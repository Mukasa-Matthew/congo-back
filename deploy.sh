#!/bin/bash

# Simple deployment script - run this after git pull
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Install dependencies (including devDependencies for building)
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Run migrations
echo "🗄️  Running database migrations..."
node scripts/run-migrations.js

# Restart PM2
echo "🔄 Restarting PM2 process..."
pm2 restart congo-back || pm2 start dist/index.js --name congo-back

echo "✅ Deployment completed!"
pm2 status

