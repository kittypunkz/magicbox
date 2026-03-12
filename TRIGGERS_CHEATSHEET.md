# 🎯 MagicBox Deployment Cheat Sheet

Quick reference for all deployment triggers!

---

## ⚡ One-Liners

```bash
# Local (fastest)
update.bat                              # Deploy everything
update.bat backend                      # API only
update.bat frontend                     # Web only

# GitHub Actions (remote trigger)
node trigger-deploy.js                  # Deploy everything
node trigger-deploy.js backend          # API only

# Git (automatic)
git push origin main                    # Auto-deploy on push
git tag v1.0.0 && git push origin v1.0.0  # Release + deploy

# GitHub (web)
# Go to: Actions → "🚀 Manual Deploy" → Run workflow
```

---

## 💬 Comment Commands (on PR/Issue)

| Comment | Effect |
|---------|--------|
| `@deploy` | Deploy everything |
| `@deploy backend` | Deploy API only |
| `@deploy frontend` | Deploy web app only |
| `@deploy database` | Run DB migrations |
| `@magicbox deploy` | Alternative syntax |
| `/deploy` | Alternative syntax |

---

## 🔧 Setup Checklist

- [ ] Push code to GitHub
- [ ] Add secrets to GitHub repo:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID` = `49b16ed3ff0d8209f2a3da300341283b`
  - `VITE_API_URL` = `https://api.magicbox.bankapirak.com`

---

## 📊 URLs

| Service | URL |
|---------|-----|
| Web App | https://magicbox.bankapirak.com |
| API | https://api.magicbox.bankapirak.com |
| GitHub Actions | `https://github.com/YOUR_USERNAME/magicbox/actions` |

---

## 🚨 Emergency Commands

```bash
# Quick hotfix (skip tests)
node trigger-deploy.js full --skip-tests

# Rollback backend
cd backend
git checkout HEAD~1
npx wrangler deploy

# Check status
curl https://api.magicbox.bankapirak.com/
```
