# 🚀 Deploy Now - Quick Steps

## Step 1: Push Your Code to VPS

If you're using git, push your changes:
```bash
git add .
git commit -m "Add username support and automated deployment"
git push
```

## Step 2: SSH into Your VPS

```bash
ssh root@64.23.169.136
```

## Step 3: Navigate to Backend Directory

```bash
cd /root/congo-back
```

## Step 4: Pull Latest Code

```bash
git pull
```

## Step 5: Run Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

**OR** use npm:
```bash
npm run deploy
```

## What This Does:

1. ✅ Installs dependencies
2. ✅ Builds TypeScript
3. ✅ **Automatically runs database migrations** (adds username column)
4. ✅ Restarts PM2 server

## Step 6: Verify It Works

Check if the server is running:
```bash
pm2 status
pm2 logs congo-back --lines 50
```

## If Something Goes Wrong:

**Check migrations:**
```bash
node scripts/run-migrations.js
```

**Check if username column exists:**
```bash
mysql -u root -p -e "DESCRIBE news_platform.users;"
```

**Manually restart:**
```bash
pm2 restart congo-back
```

---

After deployment, refresh your Settings page and the profile should load correctly! 🎉

