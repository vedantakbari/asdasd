# Home Service CRM

A CRM system for home service businesses with Gmail integration.

## Deployment to Replit

To deploy this application to Replit, follow these steps:

1. **Create a new Replit**:
   - Go to [Replit](https://replit.com)
   - Create a new Repl with Node.js
   - Choose "Import from GitHub" and paste your GitHub repository URL
   - Or upload the files directly to Replit

2. **Run the update script**:
   - Open the Shell in Replit
   - Make the update script executable: `chmod +x update-replit.sh`
   - Run the script: `./update-replit.sh`

3. **Set up environment variables in Replit**:
   - Go to the Secrets tab in your Repl
   - Add the following secrets:
     - `DATABASE_URL`: Your PostgreSQL database URL
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
     - `GOOGLE_REDIRECT_URI`: `https://your-repl-url.replit.app/api/auth/google/callback`
     - `SESSION_SECRET`: A secret string for session encryption

4. **Run the application**:
   - Click on the "Run" button in Replit

## Troubleshooting Deployment Issues

If you encounter the error "Cannot find package 'express' imported from /home/runner/workspace/server/index.ts", try these steps:

1. **Install dependencies manually**:
   ```
   npm install
   npm install -g tsx
   ```

2. **Check if your .replit file is configured correctly**:
   ```
   run = "npm install && npm run dev"
   ```

3. **Make sure the file paths in your imports match the case sensitivity**:
   - Unix systems (like Replit) are case-sensitive
   - Check that import paths exactly match the case of actual file paths

4. **Check environment variables**:
   - Make sure all required environment variables are set correctly
   - The application has fallbacks for most variables to avoid crashing

## Running Locally on Windows

To run the application locally on Windows:

```
npm run dev:win
```

## Gmail Integration

For Gmail integration to work properly, you need to:

1. Set up a Google Cloud project
2. Enable the Gmail API
3. Create OAuth credentials
4. Configure the redirect URI (pointing to your Repl URL)
5. Set the corresponding environment variables in Replit Secrets 