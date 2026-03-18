# 🌍 Deployment Guide

MagicBox uses a **3-environment workflow** for safe deployments.

---

## 📊 Environments

| Environment | Branch | URL | Deploy Trigger |
|-------------|--------|-----|----------------|
| **Local** | Any | `http://localhost:3000` | Run `dev.bat` |
| **Dev** | `develop` | `https://dev.magicbox.bankapirak.com` | Push to `develop` |
| **Production** | `main` | `https://magicbox.bankapirak.com` | Manual (you control) |

---

## 🔄 Recommended Workflow

### 1. Local Development
```bash
# Work on feature branch
git checkout -b feature/my-feature

# Test locally
.\dev.bat
```

### 2. Deploy to Dev (Automatic)
```bash
# Merge to develop branch
git checkout develop
git merge feature/my-feature
git push origin develop

# Auto-deploys to: https://dev.magicbox.bankapirak.com
```

### 3. Deploy to Production (You Decide)
```bash
# When ready, tag and release
git checkout main
git merge develop
npm run sync-version  # Update version

git add -A
git commit -m "chore: bump version to X.X.X"
git push origin main

git tag -a vX.X.X -m "Release vX.X.X"
git push origin vX.X.X
```

Or manually trigger:
https://github.com/kittypunkz/magicbox/actions/workflows/deploy-production.yml

---

## 🔐 Environment Protection

Production deployments can require **your approval** via GitHub Environment Protection:

1. Go to: `Settings → Environments → production`
2. Add yourself as required reviewer
3. Now all production deployments wait for your approval

---

## 📁 Workflow Files

- `.github/workflows/deploy-develop.yml` - Dev environment
- `.github/workflows/deploy-production.yml` - Production environment

---

## 🆘 Full Documentation

See [ENVIRONMENTS.md](./ENVIRONMENTS.md) for complete setup guide.
