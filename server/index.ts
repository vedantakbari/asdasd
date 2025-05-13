import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth, getSession } from "./replitAuth";
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
  // If request accepts HTML, pass to the next handler for proper landing page
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
  
  // Add root route handler to serve HTML landing page instead of plain "OK"
  // This needs to be after auth setup since it uses req.isAuthenticated()
  app.get("/", (req, res) => {
    // If user is authenticated, redirect them to the dashboard
    if (req.isAuthenticated()) {
      return res.redirect('/dashboard');
    }
    
    // Otherwise show the landing page
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Service CRM - All-In-One Business Management</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 900px;
              margin: 0 auto;
              padding: 2rem;
            }
            h1 {
              color: #0079f3;
              font-size: 2.5rem;
              margin-bottom: 1rem;
            }
            p {
              font-size: 1.1rem;
              margin-bottom: 1.5rem;
            }
            .btn {
              display: inline-block;
              background-color: #0079f3;
              color: white;
              font-weight: bold;
              text-decoration: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.35rem;
              transition: background-color 0.2s;
            }
            .btn:hover {
              background-color: #0067d8;
            }
            .features {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1.5rem;
              margin-top: 3rem;
            }
            .feature {
              background: #f8fafc;
              border-radius: 0.5rem;
              padding: 1.5rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .feature h3 {
              color: #0079f3;
              margin-top: 0;
            }
          </style>
        </head>
        <body>
          <h1>Service CRM</h1>
          <p>The complete business management solution for all business types.</p>
          <a href="/api/login" class="btn">Log In or Sign Up</a>
          
          <div class="features">
            <div class="feature">
              <h3>Lead Management</h3>
              <p>Easily capture, track, and nurture leads. Never miss a potential client again.</p>
            </div>
            <div class="feature">
              <h3>Smart Scheduling</h3>
              <p>Manage appointments, set reminders, and sync with Google Calendar.</p>
            </div>
            <div class="feature">
              <h3>Email Integration</h3>
              <p>Send and receive emails directly in the CRM. Keep all client communications in one place.</p>
            </div>
          </div>
        </body>
      </html>
    `);
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
      
      // Serve static files
      app.use(express.static("./dist/public"));
      
      // Add fallback catch-all route to serve index.html for all non-API routes
      app.use("*", (req, res, next) => {
        console.log("[express] Serving route:", req.originalUrl);
        
        if (req.originalUrl.startsWith("/api")) {
          return next();
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