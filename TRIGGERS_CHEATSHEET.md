# 🎯 MagicBox Deployment Cheat Sheet

Quick reference for deployment!

---

## ⚡ One-Liners

```bash
# Local deployment (direct)
update.bat                              # Deploy everything
update.bat backend                      # API only
update.bat frontend                     # Web only

# Git (automatic - recommended)
git push origin main                    # Auto-deploy on push
```

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
# Quick hotfix (direct deploy)
cd backend && npx wrangler deploy
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=magicbox-app

# Rollback backend
cd backend
git checkout HEAD~1
npx wrangler deploy

# Check status
curl https://api.magicbox.bankapirak.com/
```
