import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add health check route with fallback to static file in production
app.get("/", (_req, res) => {
  if (app.get("env") === "production") {
    return res.sendFile("index.html", { root: "./public" });
  }
  res.status(200).send("OK");
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
      app.use(express.static("./public"));
      
      // Add fallback catch-all route to serve index.html for all non-API routes
      app.use("*", (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) {
          return next();
        }
        
        try {
          res.sendFile("index.html", { root: "./public" });
        } catch (err) {
          console.error("Error serving fallback index.html:", err);
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
