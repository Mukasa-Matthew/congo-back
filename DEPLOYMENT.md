# Automated Deployment Guide

This guide explains how to set up automatic deployment for the Congo News backend.

## Option 1: Simple Deployment Script (Recommended)

After pushing code to your VPS, SSH into your server and run:

```bash
cd /root/congo-back
git pull
./deploy.sh
```

Or use npm:
```bash
cd /root/congo-back
git pull
npm run deploy
```

## Option 2: Git Post-Receive Hook (Fully Automatic)

This will automatically deploy when you push to your repository.

### Setup Steps:

1. **On your VPS, create a bare repository** (if you don't have one):
```bash
mkdir -p /var/repo/congo-back.git
cd /var/repo/congo-back.git
git init --bare
```

2. **Set up the post-receive hook**:
```bash
cat > /var/repo/congo-back.git/hooks/post-receive << 'EOF'
#!/bin/bash
WORK_TREE="/root/congo-back"
GIT_DIR="/var/repo/congo-back.git"
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f
cd "$WORK_TREE"
bash scripts/deploy.sh
EOF

chmod +x /var/repo/congo-back.git/hooks/post-receive
```

3. **Add remote to your local repository**:
```bash
git remote add production root@your-vps-ip:/var/repo/congo-back.git
```

4. **Push to deploy**:
```bash
git push production main
```

## Option 3: PM2 Ecosystem with Auto-Deploy

Create a `ecosystem.config.js` file:

```javascript
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
    }
  }]
};
```

Then use:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## What the Deployment Script Does:

1. ✅ Installs/updates npm dependencies
2. ✅ Builds TypeScript to JavaScript
3. ✅ Runs pending database migrations automatically
4. ✅ Restarts the PM2 process

## Database Migrations

Migrations are tracked in the `schema_migrations` table. The script:
- Automatically detects new migration files
- Only runs migrations that haven't been executed
- Handles errors gracefully (e.g., if a column already exists)

## Troubleshooting

### If deployment fails:

1. Check PM2 logs:
```bash
pm2 logs congo-back
```

2. Check if migrations ran:
```bash
mysql -u root -p -e "SELECT * FROM news_platform.schema_migrations;"
```

3. Manually run migrations:
```bash
cd /root/congo-back
node scripts/run-migrations.js
```

4. Manually restart:
```bash
pm2 restart congo-back
```

## Quick Deploy Command

After the initial setup, you can create an alias for quick deployment:

```bash
# Add to ~/.bashrc
alias deploy-congo='cd /root/congo-back && git pull && npm run deploy'
```

Then just run:
```bash
deploy-congo
```

