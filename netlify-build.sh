#!/bin/bash

# Print environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Print success message
echo "Build completed successfully!"
