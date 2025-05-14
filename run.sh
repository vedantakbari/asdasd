#!/bin/bash

# Set environment variables
export NODE_ENV=development

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Install tsx globally if not already installed
if ! command -v tsx &> /dev/null; then
  echo "Installing tsx globally..."
  npm install -g tsx
fi

# Run the development server
echo "Starting server..."
npx tsx server/index.ts 