#!/bin/bash

# This script is specifically for the Replit environment

# Set environment variables
export NODE_ENV=development

# Clear any node_modules to avoid conflicts
if [ -d "node_modules" ]; then
  echo "Removing old node_modules..."
  rm -rf node_modules
fi

# Install all dependencies from package.json
echo "Installing all dependencies..."
npm install --force

# Run the development server
echo "Starting server..."
npx --yes tsx server/index.ts 