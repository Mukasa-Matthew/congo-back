#!/bin/bash

# One-time setup script for automated deployment
# Run this once on your VPS to set up automatic deployment

set -e

echo "🔧 Setting up automated deployment..."

# Get the project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

# Make deploy scripts executable
chmod +x deploy.sh
chmod +x scripts/deploy.sh
chmod +x scripts/run-migrations.js

echo "✅ Made deployment scripts executable"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 is not installed. Installing PM2..."
    npm install -g pm2
    pm2 startup
    echo "✅ PM2 installed"
else
    echo "✅ PM2 is already installed"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please create one with your database credentials."
    echo "   Copy .env.example if it exists, or create a new .env file."
else
    echo "✅ .env file found"
fi

# Create ecosystem.config.js if it doesn't exist
if [ ! -f ecosystem.config.js ]; then
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'congo-back',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    echo "✅ Created ecosystem.config.js"
else
    echo "✅ ecosystem.config.js already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your .env file is configured"
echo "   2. Run: npm install"
echo "   3. Run: npm run build"
echo "   4. Run: npm run migrate (to run initial migrations)"
echo "   5. Run: pm2 start ecosystem.config.js"
echo "   6. Run: pm2 save"
echo ""
echo "🚀 For future deployments, just run:"
echo "   ./deploy.sh"
echo "   or"
echo "   npm run deploy"
echo ""

