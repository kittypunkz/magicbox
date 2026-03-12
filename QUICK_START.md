# 🚀 MagicBox Quick Start - Update & Deploy

## ⚡ Fastest Way to Update (Local)

After making code changes:

```bash
cd magicbox

# Update everything with one command
update.bat

# Or update specific parts:
update.bat backend   # API only
update.bat frontend  # Web app only
```

## 🔥 Fully Automatic (GitHub Actions)

### Setup (One-time)

1. **Create GitHub Repo** and push code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/magicbox.git
git push -u origin main
```

2. **Add Secrets** to GitHub:
   - Go to: `https://github.com/YOUR_USERNAME/magicbox/settings/secrets/actions`
   - Add these secrets:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Get from https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | `49b16ed3ff0d8209f2a3da300341283b` |
| `VITE_API_URL` | `https://api.magicbox.bankapirak.com` |

3. **Get API Token**:
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token" → "Custom token"
   - Permissions needed:
     - `Cloudflare Pages:Edit`
     - `Workers Scripts:Edit`
     - `D1:Edit`
     - `Zone:Read` (for your domain)

### Usage

After setup, just push to GitHub - automatic deployment happens!

```bash
git add .
git commit -m "My changes"
git push origin main

# GitHub Actions automatically:
# ✓ Type-checks code
# ✓ Builds frontend
# ✓ Deploys backend
# ✓ Deploys frontend
```

---

## 📋 Update Workflows

### Workflow 1: Local Development

```bash
# 1. Start local servers
npm run dev

# 2. Edit files...

# 3. Type check
npx tsc --noEmit

# 4. Deploy
update.bat
```

### Workflow 2: GitHub Actions (Recommended)

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Edit and test locally
npm run dev

# 3. Push branch
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 4. Create Pull Request on GitHub
#    → GitHub Actions runs checks
#    → Review and merge

# 5. Merge automatically deploys to production!
```

---

## 🗄️ Database Changes

When you need to modify the database:

```bash
cd backend

# 1. Create migration
npx wrangler d1 migrations create magicbox-db add_new_table

# 2. Edit the created file in migrations/

# 3. Apply to production (careful!)
npx wrangler d1 migrations apply magicbox-db --remote

# 4. Deploy updated code
update.bat backend
```

---

## 📊 Monitoring

Check your deployments:

| Service | Dashboard |
|---------|-----------|
| **Workers (API)** | https://dash.cloudflare.com → Workers & Pages → magicbox-api |
| **Pages (Web)** | https://dash.cloudflare.com → Workers & Pages → magicbox-app |
| **D1 (Database)** | https://dash.cloudflare.com → Workers & Pages → D1 |
| **Analytics** | Built into each service above |

---

## 🆘 Emergency Rollback

If something breaks:

```bash
# Rollback backend to previous version
cd backend
git checkout HEAD~1  # Go back one commit
npx wrangler deploy  # Deploy old version

# Rollback frontend
cd ../frontend
git checkout HEAD~1
npm run build
npx wrangler pages deploy dist --project-name=magicbox-app
```

Or use Cloudflare Dashboard:
- Workers: "Deployments" tab → Rollback
- Pages: "Deployments" tab → Rollback

---

## 📝 Summary

| Task | Command |
|------|---------|
| Update everything | `update.bat` |
| Update backend | `update.bat backend` |
| Update frontend | `update.bat frontend` |
| Database migration | `update.bat migrate` |
| Auto-deploy | `git push origin main` |
| Local dev | `npm run dev` |

**Your Account Info:**
- Account ID: `49b16ed3ff0d8209f2a3da300341283b`
- Database ID: `846b28b9-2aac-49a5-a3fa-8ad7cf925d9f`
- Domain: `magicbox.bankapirak.com`
