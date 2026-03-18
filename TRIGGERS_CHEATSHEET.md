# 🎯 MagicBox Deployment Cheat Sheet

## 🌍 3-Environment Workflow

| Environment | Branch | URL | How to Deploy |
|-------------|--------|-----|---------------|
| **Local** | Any local | `localhost:3000` | Run `.\dev.bat` |
| **Dev** | `develop` | `dev.magicbox.bankapirak.com` | Push to `develop` |
| **Production** | `main` | `magicbox.bankapirak.com` | Tag release or manual |

---

## ⚡ Quick Commands

### Local Development
```bash
.\dev.bat              # Start local dev servers
```

### Deploy to Dev (Automatic)
```bash
git checkout develop
git merge feature/xxx   # Merge your feature
git push origin develop # Auto-deploys to Dev!
```

### Deploy to Production (You Control)
```bash
# Via tag (recommended)
git checkout main
git merge develop
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0

# Or manually via GitHub UI:
# https://github.com/kittypunkz/magicbox/actions/workflows/deploy-production.yml
```

---

## 🔧 Setup Checklist

GitHub Secrets required:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` 
- `VITE_API_URL` (production)
- `VITE_API_URL_DEV` (dev environment)

---

## 📊 URLs

| Environment | Web App | API |
|-------------|---------|-----|
| Local | http://localhost:3000 | http://localhost:8787 |
| Dev | https://dev.magicbox.bankapirak.com | https://api-dev.magicbox.bankapirak.com |
| Production | https://magicbox.bankapirak.com | https://api.magicbox.bankapirak.com |

---

## 💡 Best Practices

1. **Always test on Dev first** before Production
2. **Never push directly to main**
3. **Use version tags** for production releases
4. **Enable environment protection** for production (requires approval)

---

📖 Full guide: [ENVIRONMENTS.md](./ENVIRONMENTS.md)
