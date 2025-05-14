import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import * as passportModule from "passport";
import * as sessionModule from "express-session";
import type { Express, RequestHandler } from "express";
import * as memoizeModule from "memoizee";
import * as connectPgModule from "connect-pg-simple";
import { storage } from "./storage";

const passport = passportModule;
const session = sessionModule;
const memoize = memoizeModule.default || memoizeModule;
const connectPg = connectPgModule.default || connectPgModule;

// Check if running on Replit
const isRunningOnReplit = !!process.env.REPLIT_DOMAINS;

// Skip authentication setup if not on Replit
if (!isRunningOnReplit) {
  console.log("Not running on Replit, authentication will be disabled");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID || 'dummy-id'
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  let sessionStore;
  
  try {
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  } catch (e) {
    console.error("Error creating pgStore:", e);
    // Fallback to memory store if database is not available
    const MemoryStore = require('memorystore')(session);
    sessionStore = new MemoryStore({
      checkPeriod: sessionTtl
    });
  }
  
  return session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: "user",
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  try {
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());
  } catch (e) {
    console.error("Error setting up auth middleware:", e);
    return; // Skip auth setup if middleware fails
  }

  // Skip the rest of auth setup if not on Replit
  if (!isRunningOnReplit) {
    console.log("Authentication setup skipped (not running on Replit)");
    return;
  }

  try {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    for (const domain of (process.env.REPLIT_DOMAINS || "").split(",")) {
      if (!domain) continue;
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: Express.User, cb: (err: any, id?: any) => void) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb: (err: any, user?: Express.User) => void) => cb(null, user));

    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID || 'dummy-id',
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  } catch (error) {
    console.error("Error configuring Replit authentication:", error);
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Skip authentication check if not on Replit
  if (!isRunningOnReplit) {
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};