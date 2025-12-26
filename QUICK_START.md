# Quick Start - Automated Deployment

## 🚀 One-Time Setup (Run Once on Your VPS)

```bash
cd /root/congo-back
npm run setup-deploy
```

This will:
- ✅ Make deployment scripts executable
- ✅ Install PM2 if needed
- ✅ Create necessary config files
- ✅ Set up logging

## 📦 Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Run database migrations
npm run migrate

# 4. Start the server
pm2 start ecosystem.config.js
pm2 save
```

## 🔄 Daily Deployment (After Git Push)

**Option 1: Simple (Recommended)**
```bash
cd /root/congo-back
git pull
./deploy.sh
```

**Option 2: Using npm**
```bash
cd /root/congo-back
git pull
npm run deploy
```

**Option 3: One-liner alias**
Add to `~/.bashrc`:
```bash
alias deploy='cd /root/congo-back && git pull && npm run deploy'
```

Then just run:
```bash
deploy
```

## ✨ What Happens Automatically

When you run `./deploy.sh` or `npm run deploy`:

1. 📦 Installs/updates npm packages
2. 🔨 Builds TypeScript to JavaScript  
3. 🗄️  Runs any pending database migrations
4. 🔄 Restarts PM2 server

## 📋 Check Status

```bash
# Check if server is running
pm2 status

# View logs
pm2 logs congo-back

# Check migrations
mysql -u root -p -e "SELECT * FROM news_platform.schema_migrations;"
```

## 🆘 Troubleshooting

**Server won't start?**
```bash
pm2 logs congo-back
pm2 restart congo-back
```

**Migrations failed?**
```bash
node scripts/run-migrations.js
```

**Need to rebuild?**
```bash
npm run build
pm2 restart congo-back
```

---

That's it! Now you can just `git pull && ./deploy.sh` and everything updates automatically! 🎉

