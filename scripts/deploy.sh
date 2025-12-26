#!/bin/bash

# Congo News Backend Deployment Script
# This script builds, runs migrations, and restarts the server

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production

echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
npm run build

echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
node scripts/run-migrations.js

echo -e "${YELLOW}🔄 Restarting PM2 process...${NC}"
pm2 restart congo-back || pm2 start dist/index.js --name congo-back

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Checking PM2 status...${NC}"
pm2 status

