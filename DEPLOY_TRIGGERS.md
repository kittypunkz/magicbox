# 🎯 MagicBox Deployment

## Deployment Method

MagicBox uses **automatic deployment** via GitHub Actions when pushing to the `main` branch.

### How to Deploy

Simply push to the `main` branch:

```bash
# Commit your changes
git add .
git commit -m "feat: your feature description"

# Push to main branch (triggers deployment)
git push origin main
```

GitHub Actions will automatically:
- ✅ Deploy backend to Cloudflare Workers
- ✅ Build and deploy frontend to Cloudflare Pages

### Workflow File

The deployment workflow is defined in:
- `.github/workflows/deploy.yml` - "Deploy MagicBox to Cloudflare"

### Required Secrets

Configure these secrets in GitHub repository settings:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `CLOUDFLARE_API_TOKEN` | API Token | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | `49b16ed3ff0d8209f2a3da300341283b` | From wrangler.toml |
| `VITE_API_URL` | `https://api.magicbox.bankapirak.com` | Your API URL |

### Monitoring Deployments

- **GitHub Actions**: https://github.com/kittypunkz/magicbox/actions
- **Live App**: https://magicbox.bankapirak.com
- **API**: https://api.magicbox.bankapirak.com

### Live URLs

| Component | URL |
|-----------|-----|
| 🌐 Web App | https://magicbox.bankapirak.com |
| 🔌 API | https://api.magicbox.bankapirak.com |
| 📁 Folders | https://api.magicbox.bankapirak.com/folders |
| 📝 Notes | https://api.magicbox.bankapirak.com/notes |
