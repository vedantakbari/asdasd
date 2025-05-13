import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth, getSession, isAuthenticated } from "./replitAuth";
import passport from "passport";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add immediate health check response for Cloud Run
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Add health check routes - both for API and root path (for Cloud Run)
app.get("/api/health", (_req, res) => {
  res.status(200).send("OK");
});

// Add root health check that responds immediately for Cloud Run
app.get("/", (req, res, next) => {
  // If request accepts HTML, pass to the next handler 
  if (req.accepts('html')) {
    return next();
  }
  // For health checks, respond immediately
  res.status(200).send("OK");
});

// Check for Google OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  log("Warning: Google API credentials are not set. Gmail integration will not work properly.", "server");
  log("Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.", "server");
}

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    log(logLine);
  });

  next();
});

(async () => {
  // Set up Replit Auth
  await setupAuth(app);
  
  // Serve static files from the public directory
  app.use(express.static('public'));
  
  // Root route for authenticated users, must be after auth setup
  app.get("/", (req, res, next) => {
    // If user is authenticated, serve the static dashboard
    if (req.isAuthenticated()) {
      return res.sendFile('static-dashboard.html', { root: './public' });
    }
    
    // Otherwise show the landing page (let Vite handle it)
    return next();
  });
  
  // Add dashboard route handler
  app.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/api/login');
    }
    return res.sendFile('static-dashboard.html', { root: './public' });
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    log(`Error: ${status} - ${message}`);
    
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log("[express] Environment:", app.get("env"));

  if (app.get("env") === "development") {
    await setupVite(app, server);
    console.log("[express] Using Vite development server");
  } else {
    try {
      console.log("[express] Using static file serving");
      
      // Serve static files - this should match the Vite build output path
      app.use(express.static("./dist/public"));
      
      // Special handler for dashboard route in production
      app.get("/dashboard", (req, res) => {
        if (!req.isAuthenticated()) {
          return res.redirect('/api/login');
        }
        return res.sendFile('static-dashboard.html', { root: './public' });
      });
      
      // Add fallback catch-all route to serve index.html for all non-API routes
      app.use("*", (req, res, next) => {
        console.log("[express] Serving route:", req.originalUrl);
        
        if (req.originalUrl.startsWith("/api")) {
          return next();
        }
        
        // If user is authenticated on the homepage, serve the static dashboard
        if (req.originalUrl === "/" && req.isAuthenticated()) {
          return res.sendFile('static-dashboard.html', { root: './public' });
        }
        
        console.log("[express] Serving index.html for client-side routing");
        res.sendFile("index.html", { root: "./dist/public" });
      });
    } catch (e) {
      console.error("Error setting up static file serving:", e);
      
      // Error page as ultimate fallback
      app.use("*", (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) {
          return next();
        }
        
        res.status(200).send(`
          <html>
            <head><title>Home Services CRM</title></head>
            <body>
              <h1>Home Services CRM</h1>
              <p>Application is running. Please try accessing a specific route like 
              <a href="/dashboard">/dashboard</a></p>
            </body>
          </html>
        `);
      });
    }
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0", 
    reusePort: true,
  }, () => {
    log(`Server started successfully`);
    log(`Environment: ${process.env.NODE_ENV}`);
    log(`Listening on port ${port}`);
  });
})();