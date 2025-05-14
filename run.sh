#!/bin/bash

# Set environment variables
export NODE_ENV=development

# Force install all dependencies from package.json
echo "Installing all dependencies..."
npm install --force

# Install tsx if it's not available
if ! command -v tsx &> /dev/null; then
  echo "Installing tsx..."
  npm install -g tsx
fi

# Check for required environment variables and set defaults if needed
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL not set. Using in-memory storage."
  # App should have a fallback for this
fi

if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "Warning: GOOGLE_CLIENT_ID not set. Gmail integration will be disabled."
  # App has fallback for this
fi

# Run the development server
echo "Starting server..."
npx --yes tsx server/index.ts 