# Fix Git Conflict

To resolve the git conflict with `deploy.sh`, run on your VPS:

```bash
cd /root/congo-back
git stash          # Save local changes
git pull           # Pull latest changes
git stash pop      # Apply your local changes (if needed)
```

Or if you want to use the remote version:

```bash
cd /root/congo-back
git checkout -- deploy.sh    # Discard local changes
git pull                      # Pull latest
```

The deployment script is now fixed in the repository, so you can safely use the remote version.

