# 🚀 MagicBox Development Workflow

Choose the workflow that fits your needs!

---

## 🎯 Option 1: Quick Workflow (Skip Dev)

**For:** Solo development, quick iterations, when you trust local testing

```
Local → Production
```

### Steps:
```bash
# 1. Work on feature branch
git checkout -b feature/xxx
# ... code & test locally with .\dev.bat ...

# 2. When ready, merge to main and deploy
git checkout main
git merge feature/xxx
npm run sync-version  # optional

git add -A && git commit -m "chore: bump version"
git push origin main

# 3. Tag for release (triggers production deploy)
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

**Or even simpler - work directly on main:**
```bash
git checkout main
# ... code & test locally ...
git add . && git commit -m "feat: xxx"
git push origin main
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

---

## 🎯 Option 2: Safe Workflow (With Dev Environment)

**For:** Larger features, when you want a staging URL, team collaboration

```
Local → Dev Environment → Production
```

### Steps:
```bash
# 1. Work on feature branch
git checkout develop
git checkout -b feature/xxx
# ... code & test locally with .\dev.bat ...

# 2. Deploy to Dev environment
git checkout develop
git merge feature/xxx
git push origin develop
# Wait 2-3 min, test at: https://develop.magicbox-app.pages.dev

# 3. When satisfied, deploy to Production
git checkout main
git merge develop
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

---

## 🎯 Option 3: Manual Production Deploy

**For:** When you want full control, no auto-deployment

Disable auto-deployment on `main` and only deploy manually via GitHub Actions UI.

---

## 📊 Comparison

| Workflow | Speed | Safety | Best For |
|----------|-------|--------|----------|
| **Quick (skip dev)** | ⚡ Fastest | ⚠️ Local testing only | Solo dev, small changes |
| **Safe (with dev)** | 🐢 Slower | ✅ Staging URL | Large features, team |
| **Manual only** | 🐢 Slowest | ✅ Full control | Production-critical apps |

---

## 💡 My Recommendation

Since you're working solo:

**Use Option 1 (Quick) for:**
- Small UI tweaks
- Bug fixes
- Features you're confident about

**Use Option 2 (Safe) for:**
- Major features
- Database schema changes
- When you want to test on a real URL before production

---

## 🔧 How to Disable Dev Environment (Optional)

If you never want to use Dev environment:

1. Go to GitHub → Settings → Branches
2. Delete `develop` branch protection (if any)
3. Or just ignore the `develop` branch - it won't auto-deploy anything you don't push to it

**The `develop` branch is harmless** - it only deploys when YOU push to it.

---

## 🚀 Quick Reference

### Deploy to Production Only:
```bash
# Work on main
git checkout main
git pull origin main

# Make changes
# ... edit files ...

# Test locally
.\dev.bat

# Deploy
git add . && git commit -m "feat: your feature"
git push origin main
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

---

## ✅ Current Setup

Your setup supports ALL workflows:
- `main` branch → Production (manual trigger or tag)
- `develop` branch → Dev environment (auto-deploy)
- Local → Your machine (`localhost:3000`)

**You choose which one to use!**
