# 🌍 Environment Setup Guide

MagicBox uses a **3-environment workflow** for safe, controlled deployments.

---

## 📊 Environment Overview

| Environment | Branch | URL | Purpose | Auto Deploy |
|-------------|--------|-----|---------|-------------|
| **Local** | Any local branch | `http://localhost:3000` | Development on your machine | ❌ Manual |
| **Dev** | `develop` | `https://dev.magicbox.bankapirak.com` | Testing & QA | ✅ Yes |
| **Production** | `main` | `https://magicbox.bankapirak.com` | Live users | ⚠️ Manual trigger |

---

## 🔄 Workflow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LOCAL     │────▶│     DEV     │────▶│ PRODUCTION  │
│  (develop)  │     │  (develop)  │     │    (main)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │                    │                    │
   Code & Test       Auto-deploy on      YOU decide when
   on localhost      push to develop     to deploy
```

---

## 🛠️ Setting Up Each Environment

### 1️⃣ Local Environment

**Purpose**: Develop and test on your machine

**Setup:**
```bash
# 1. Start local servers
.\dev.bat

# 2. Open browser
http://localhost:3000
```

**Features:**
- Hot reload on code changes
- Agentation enabled for annotations
- Local SQLite database (if using)

---

### 2️⃣ Dev Environment

**Purpose**: Test features in a live-like environment before production

**Setup:**
```bash
# Push to develop branch → Auto deploys to Dev

git checkout develop
git merge feature/your-feature
git push origin develop
```

**URL:**
- Web: `https://dev.magicbox.bankapirak.com`
- API: `https://api-dev.magicbox.bankapirak.com`

**GitHub Actions:**
- File: `.github/workflows/deploy-develop.yml`
- Trigger: Push to `develop` branch

---

### 3️⃣ Production Environment

**Purpose**: Live site for real users

**Deploy Methods:**

#### Method A: Manual Trigger (Recommended)
```bash
# 1. Go to GitHub Actions
https://github.com/kittypunkz/magicbox/actions/workflows/deploy-production.yml

# 2. Click "Run workflow"
# 3. Select branch: main
# 4. Click "Run workflow"
```

#### Method B: Merge to Main (If enabled)
```bash
# When you're ready to release:
git checkout main
git merge develop
git push origin main
```

**⚠️ IMPORTANT**: Production deployments require **manual approval** or **tag creation** (your choice).

**URL:**
- Web: `https://magicbox.bankapirak.com`
- API: `https://api.magicbox.bankapirak.com`

---

## 📋 Complete Development Workflow

### Starting a New Feature

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Work locally
# ... make changes ...

# 4. Test locally
.\dev.bat

# 5. Commit and push to develop for Dev environment testing
git add .
git commit -m "feat: add new feature"
git checkout develop
git merge feature/new-feature
git push origin develop

# 6. Test on Dev environment
# https://dev.magicbox.bankapirak.com
```

### Deploying to Production

```bash
# When you're satisfied with Dev testing:

# 1. Create a release tag (this is your deployment trigger)
git checkout main
git merge develop
git tag -a v1.5.0 -m "Release v1.5.0 - New features"
git push origin main
git push origin v1.5.0

# 2. Or manually trigger via GitHub Actions UI
# https://github.com/kittypunkz/magicbox/actions/workflows/deploy-production.yml
```

---

## 🔐 Environment Protection (GitHub Settings)

You can add protection rules in GitHub:

### Production Environment

1. Go to: `https://github.com/kittypunkz/magicbox/settings/environments`
2. Click "New environment" → Name: `production`
3. Enable:
   - ✅ **Required reviewers** (add yourself)
   - ✅ **Wait timer** (e.g., 5 minutes)
   - ✅ **Deployment branches** (only `main`)

This means:
- Every production deployment requires YOUR approval
- No accidental deployments
- Full control over release timing

---

## 🚀 Quick Reference

| Action | Command |
|--------|---------|
| Start local dev | `.\dev.bat` |
| Test on Dev | Push to `develop` branch |
| Deploy to Production | Create tag `vX.X.X` on `main` |
| Check Dev status | https://dev.magicbox.bankapirak.com |
| Check Production status | https://magicbox.bankapirak.com |

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Dev not deploying | Check `.github/workflows/deploy-develop.yml` |
| Production won't deploy | Check environment protection rules |
| Wrong API URL | Check `VITE_API_URL_*` secrets in GitHub |
| Local not working | Run `.\dev.bat` and check console |

---

## 💡 Best Practices

1. **Never push directly to `main`** - Always go through `develop` first
2. **Test on Dev before Production** - Catch issues early
3. **Use version tags** - `v1.4.0`, `v1.5.0` for production releases
4. **Keep develop in sync** - Regularly merge main back to develop

---

## 📁 Related Files

- `.github/workflows/deploy-develop.yml` - Dev deployment
- `.github/workflows/deploy-production.yml` - Production deployment
- `.env.example` - Environment variable template
- `dev.bat` - Local development starter
