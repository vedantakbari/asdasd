import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./replitAuth";
import path from "path";
import fs from "fs";

// Read the fallback HTML file
const FALLBACK_HTML_PATH = path.join(process.cwd(), "public", "index-fallback.html");
let fallbackHtml = "";
try {
  if (fs.existsSync(FALLBACK_HTML_PATH)) {
    fallbackHtml = fs.readFileSync(FALLBACK_HTML_PATH, "utf-8");
    console.log("Loaded fallback HTML for reliability");
  } else {
    console.warn("Fallback HTML not found at:", FALLBACK_HTML_PATH);
  }
} catch (err) {
  console.error("Error loading fallback HTML:", err);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add health check route but only respond when requesting /api/health
app.get("/api/health", (_req, res) => {
  res.status(200).send("OK");
});

// Add fallback route that will always work even if React fails
app.get("/fallback", (_req, res) => {
  if (fallbackHtml) {
    res.setHeader('Content-Type', 'text/html');
    res.send(fallbackHtml);
  } else {
    res.send(`
      <html>
        <head>
          <title>ServiceCRM</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; text-align: center; max-width: 800px; margin: 0 auto; }
            h1 { color: #4299e1; }
            a { display: inline-block; margin-top: 1rem; background: #4299e1; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.25rem; }
          </style>
        </head>
        <body>
          <h1>ServiceCRM</h1>
          <p>Free Customer Relationship Management for all business types</p>
          <a href="/api/login">Login or Sign Up</a>
        </body>
      </html>
    `);
  }
});

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Check for Google OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  log("Warning: Google API credentials are not set. Gmail integration will not work properly.", "server");
  log("Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.", "server");
}

(async () => {
  // Set up Replit Auth
  await setupAuth(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    try {
      serveStatic(app);
    } catch (e) {
      console.error("Error setting up static file serving:", e);
      
      // Add fallback middleware if serveStatic fails
      app.use(express.static("./dist/public"));
      
      // Add fallback catch-all route to serve index.html for all non-API routes
      app.use("*", (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) {
          return next();
        }
        
        try {
          // First try to serve the regular index.html
          res.sendFile("index.html", { root: "./public" });
        } catch (err) {
          console.error("Error serving index.html, trying fallback:", err);
          
          // If that fails, serve our fallback HTML
          if (fallbackHtml) {
            console.log("Serving fallback HTML for route:", req.originalUrl);
            res.setHeader('Content-Type', 'text/html');
            res.send(fallbackHtml);
          } else {
            // Last resort fallback if even our fallback HTML isn't available
            console.log("Serving minimal HTML fallback for route:", req.originalUrl);
            res.status(200).send(`
              <html>
                <head>
                  <title>ServiceCRM</title>
                  <style>
                    body { font-family: sans-serif; padding: 2rem; text-align: center; max-width: 800px; margin: 0 auto; }
                    h1 { color: #4299e1; }
                    a { display: inline-block; margin-top: 1rem; background: #4299e1; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.25rem; }
                  </style>
                </head>
                <body>
                  <h1>ServiceCRM</h1>
                  <p>Free Customer Relationship Management for all business types</p>
                  <p>The application is running. Please sign in to continue:</p>
                  <a href="/api/login">Login or Sign Up</a>
                </body>
              </html>
            `);
          }
        }
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
    log(`serving on port ${port}`);
  });
})();
