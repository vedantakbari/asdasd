#!/bin/bash

# Update script for Replit deployment
echo "Starting HomeServiceCRM deployment update script..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Ensure tsx is installed globally for Replit
echo "Installing tsx globally..."
npm install -g tsx

# Create .replit configuration if it doesn't exist
if [ ! -f .replit ]; then
  echo "Creating .replit configuration..."
  cat > .replit << EOL
run = "npm install && npm run dev"
hidden = [".config", "package-lock.json"]

[nix]
channel = "stable-23_11"

[env]
NODE_ENV = "development"

[packager]
language = "nodejs"

[packager.features]
packageSearch = true
guessImports = true
enabledForHosting = true

[languages]

[languages.javascript]
pattern = "**/{*.js,*.jsx,*.ts,*.tsx}"

[languages.javascript.languageServer]
start = "typescript-language-server --stdio"

[deployment]
build = ["npm", "run", "build"]
run = ["node", "dist/index.js"]
deploymentTarget = "cloudrun"
EOL
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file template (you need to fill in the values)..."
  cat > .env << EOL
# Database connection
DATABASE_URL=postgres://user:password@host:port/database

# Google OAuth credentials 
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.replit.co/api/auth/google/callback

# Session secret
SESSION_SECRET=your_session_secret

# Node environment
NODE_ENV=development
EOL
fi

# Build the application
echo "Building the application..."
npm run build

echo "Update completed successfully!"
echo "IMPORTANT: You need to set up your environment variables in Replit's Secrets tab"
echo "Required environment variables:"
echo "- DATABASE_URL"
echo "- GOOGLE_CLIENT_ID"
echo "- GOOGLE_CLIENT_SECRET" 
echo "- GOOGLE_REDIRECT_URI"
echo "- SESSION_SECRET" 