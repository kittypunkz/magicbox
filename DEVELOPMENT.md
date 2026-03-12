# MagicBox Development Guide

## Quick Update Commands

After making changes, use these commands to deploy:

### Option 1: Use Update Script (Recommended)

```bash
cd magicbox

# Update everything
update.bat full

# Update only backend
update.bat backend

# Update only frontend  
update.bat frontend

# Run database migrations
update.bat migrate
```

### Option 2: Manual Deployment

```bash
# 1. Backend Update
cd backend
npx tsc --noEmit           # Type check
npx wrangler deploy        # Deploy

# 2. Frontend Update  
cd ../frontend
npm run build              # Build
npx wrangler pages deploy dist --project-name=magicbox-app
```

---

## GitHub Actions CI/CD (Full Automation)

I've set up automatic deployment via GitHub Actions. Here's how to use it:

### Step 1: Push to GitHub

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/magicbox.git
git push -u origin main
```

### Step 2: Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `CLOUDFLARE_API_TOKEN` | Your API token | Cloudflare Dashboard → My Profile → API Tokens → Create Token |
| `CLOUDFLARE_ACCOUNT_ID` | `49b16ed3ff0d8209f2a3da300341283b` | From wrangler.toml or `wrangler whoami` |
| `VITE_API_URL` | `https://api.magicbox.bankapirak.com` | Your API URL |

**Get API Token:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Custom token" with these permissions:
   - Zone:Read (for domain verification)
   - Cloudflare Pages:Edit
   - Workers Scripts:Edit
   - Account:Read
   - D1:Edit

### Step 3: Automatic Deployment

Now every push to `main` branch automatically deploys!

```bash
# Make changes
git add .
git commit -m "Update feature X"
git push origin main

# GitHub Actions will automatically:
# 1. Type-check code
# 2. Build frontend
# 3. Deploy backend
# 4. Deploy frontend
```

---

## Development Workflow

### Daily Development Flow

```bash
# 1. Start local development
npm run dev

# 2. Make your changes
# ... edit files ...

# 3. Test locally
# Frontend: http://localhost:3000
# Backend: http://localhost:8787

# 4. Type check
npx tsc --noEmit

# 5. Deploy
update.bat
```

### Feature Development Flow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Develop and test locally
npm run dev

# 3. Commit changes
git add .
git commit -m "Add feature X"

# 4. Push and create PR
git push origin feature/my-feature
# Create Pull Request on GitHub

# 5. GitHub Actions will:
#    - Run type checks
#    - Run build checks
#    - Comment on PR with status

# 6. After PR merge to main:
#    - Automatic deployment happens!
```

---

## Database Migrations

When you need to change database schema:

### 1. Create Migration

```bash
cd backend
npx wrangler d1 migrations create magicbox-db add_user_preferences
```

This creates: `migrations/0002_add_user_preferences.sql`

### 2. Edit Migration File

```sql
-- migrations/0002_add_user_preferences.sql
ALTER TABLE notes ADD COLUMN tags TEXT DEFAULT '';
```

### 3. Test Locally

```bash
# Apply to local dev database
npx wrangler d1 migrations apply magicbox-db --local

# Or apply to remote (CAREFUL - production!)
npx wrangler d1 migrations apply magicbox-db --remote
```

### 4. Deploy

```bash
# Deploy backend with new code
update.bat backend
```

---

## Best Practices

### 1. Always Type Check First

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend  
cd frontend && npx tsc --noEmit
```

### 2. Use Semantic Versioning

```bash
git tag -a v1.0.1 -m "Fix search bug"
git push origin v1.0.1
```

### 3. Keep Dependencies Updated

```bash
# Monthly update
cd backend && npm update
cd ../frontend && npm update

# Then test and deploy
update.bat
```

### 4. Monitor Deployments

- Cloudflare Dashboard: https://dash.cloudflare.com
- Workers: Real-time logs and metrics
- Pages: Build history and analytics
- D1: Query analytics

### 5. Backup Strategy

Database is automatically backed up by Cloudflare. For extra safety:

```bash
# Export database
cd backend
npx wrangler d1 export magicbox-db --remote --output=backup.sql
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to deploy" | Check `wrangler whoami` is logged in |
| "Type check failed" | Fix TypeScript errors before deploying |
| "Build failed" | Check for missing imports or syntax errors |
| "Database migration failed" | Check SQL syntax; migrations are atomic |
| "CORS errors" | Verify API URL matches custom domain |
| "Changes not showing" | Clear browser cache or check deployment URL |

---

## Environment Summary

| Environment | URL | Deploy Command |
|-------------|-----|----------------|
| Production | https://magicbox.bankapirak.com | `update.bat` or GitHub Actions |
| Preview | https://[hash].magicbox-app.pages.dev | Auto on PR |
| Local | http://localhost:3000 | `npm run dev` |
