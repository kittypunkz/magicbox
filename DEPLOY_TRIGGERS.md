# 🎯 MagicBox Deployment Triggers

Multiple ways to trigger automatic deployment to Cloudflare!

---

## 📋 Overview of Trigger Methods

| Method | When to Use | Speed | Setup |
|--------|-------------|-------|-------|
| **Push to Main** | Regular development | ⚡ Instant | Zero setup |
| **Manual Trigger** | On-demand control | ⚡ Instant | GitHub Actions |
| **Comment `@deploy`** | From PRs/Issues | ⚡ Instant | GitHub Actions |
| **Git Tag** | Production releases | ⚡ Instant | Zero setup |
| **CLI Trigger** | From local terminal | ⚡ ~10 sec | Node script |
| **Scheduled** | Automatic backups | ⏰ Daily | GitHub Actions |

---

## Method 1: Push to Main (Automatic)

**Best for:** Daily development

```bash
# Just push to main branch - automatic deployment!
git add .
git commit -m "Update feature X"
git push origin main

# GitHub Actions automatically:
# ✅ Type-checks code
# ✅ Builds frontend  
# ✅ Deploys backend
# ✅ Deploys frontend
```

**No setup required!** Already configured in `.github/workflows/deploy.yml`

---

## Method 2: Manual Trigger (GitHub Actions)

**Best for:** Selective deployments, testing

### How to Use:

1. Go to: `https://github.com/YOUR_USERNAME/magicbox/actions`

2. Click **"🚀 Manual Deploy to Cloudflare"**

3. Click **"Run workflow"**

4. Choose options:
   - **Component:** `full` | `backend` | `frontend` | `database`
   - **Environment:** `production` | `staging`
   - **Skip tests:** Check to skip type checking (faster)

5. Click **"Run workflow"**

### Example:
```
Component: backend
Environment: production
Skip tests: false

→ Deploys only backend with type checking
```

---

## Method 3: Comment Trigger 🎉

**Best for:** Quick deployments from PRs, code reviews

### How to Use:

Comment on any **Pull Request** or **Issue**:

```markdown
@deploy              # Deploy everything
@deploy backend      # Deploy API only
@deploy frontend     # Deploy web app only
@deploy database     # Run migrations
@magicbox deploy     # Alternative syntax
/deploy              # Alternative syntax
```

### Examples:

**PR Comment:**
```markdown
LGTM! Let's deploy this.

@deploy backend
```

**Issue Comment:**
```markdown
Need to update the UI

@deploy frontend
```

**Bot will reply:**
```markdown
✅ Deployment successful!

- Component: backend
- Environment: production
- Time: 2024-01-15T10:30:00Z

🔗 URLs:
- Web App: https://magicbox.bankapirak.com
- API: https://api.magicbox.bankapirak.com
```

---

## Method 4: Git Tag (Release)

**Best for:** Production releases, versioning

```bash
# Create a version tag
git tag -a v1.0.1 -m "Fix search bug and improve UI"

# Push tag
git push origin v1.0.1

# Automatic:
# ✅ Creates GitHub Release
# ✅ Deploys to production
# ✅ Comments with URLs
```

**Release will include:**
- Auto-generated release notes
- Deployment status
- Direct links to live app

---

## Method 5: CLI Trigger (Local)

**Best for:** Developers who prefer terminal

### Setup:
```bash
# Set your GitHub token (one-time)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Or use --token flag
```

### Usage:
```bash
cd magicbox

# Deploy everything
node trigger-deploy.js

# Deploy specific component
node trigger-deploy.js backend
node trigger-deploy.js frontend
node trigger-deploy.js migrate

# With options
node trigger-deploy.js full --env=production --skip-tests
node trigger-deploy.js --token=ghp_xxx
```

### Get GitHub Token:
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Select scopes:
   - ✅ `repo` (full control)
   - ✅ `workflow` (update GitHub Actions)
4. Generate and copy token

---

## Method 6: Scheduled Triggers

**Best for:** Automated maintenance

### Included Workflows:

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| **Database Backup** | Daily 2 AM UTC | Automatic DB export |

### Manual Backup:
```bash
# Trigger anytime from GitHub Actions
# Go to: Actions → 🗄️ Scheduled Database Backup → Run workflow
```

---

## 🔄 Complete Workflow Examples

### Daily Development Flow:
```bash
# 1. Make changes locally
vim src/components/Sidebar.tsx

# 2. Test locally
npm run dev

# 3. Commit and push (auto-deploys!)
git add .
git commit -m "Update sidebar styling"
git push origin main

# 4. Watch deployment at:
# https://github.com/YOUR_USERNAME/magicbox/actions
```

### Feature Branch Flow:
```bash
# 1. Create feature branch
git checkout -b feature/dark-mode

# 2. Make changes
# ...

# 3. Push branch
git push origin feature/dark-mode

# 4. Create Pull Request on GitHub

# 5. Reviewer comments:
# "Looks good! @deploy frontend"

# 6. Merge PR → Auto-deploys to production!
```

### Hotfix Flow:
```bash
# 1. Fix urgent bug
git checkout -b hotfix/critical-fix

# 2. Quick fix
# ...

# 3. Deploy immediately
node trigger-deploy.js full --skip-tests

# Or via GitHub Actions manual trigger
```

---

## 🎛️ GitHub Secrets Setup

For all triggers to work, add these secrets:

Go to: `https://github.com/YOUR_USERNAME/magicbox/settings/secrets/actions`

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `CLOUDFLARE_API_TOKEN` | Token | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | `49b16ed3ff0d8209f2a3da300341283b` | From wrangler.toml |
| `VITE_API_URL` | `https://api.magicbox.bankapirak.com` | Your API URL |
| `GITHUB_TOKEN` | Auto-provided | No action needed |

---

## 📊 Monitoring Deployments

### GitHub Actions Dashboard:
```
https://github.com/YOUR_USERNAME/magicbox/actions
```

### Cloudflare Dashboards:
- **Workers:** https://dash.cloudflare.com → Workers & Pages → magicbox-api
- **Pages:** https://dash.cloudflare.com → Workers & Pages → magicbox-app
- **D1:** https://dash.cloudflare.com → Workers & Pages → D1

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Workflow not found" | Push workflow files to GitHub first |
| "Unauthorized" | Check CLOUDFLARE_API_TOKEN is correct |
| "Deployment failed" | Check logs in GitHub Actions |
| "Comment trigger not working" | Make sure comment contains `@deploy` |
| "CLI trigger fails" | Verify GITHUB_TOKEN has `repo` + `workflow` scopes |

---

## 💡 Pro Tips

1. **Use `@deploy backend`** when only API changes - faster than full deploy
2. **Use `--skip-tests`** for emergency hotfixes
3. **Tag releases** (`v1.0.0`) for major milestones
4. **Enable branch protection** on `main` to require PR reviews
5. **Use PR comments** for team collaboration on deployments

---

## 🔗 Quick Links

| Action | URL |
|--------|-----|
| GitHub Actions | `https://github.com/YOUR_USERNAME/magicbox/actions` |
| Manual Deploy | `https://github.com/YOUR_USERNAME/magicbox/actions/workflows/manual-deploy.yml` |
| Secrets Settings | `https://github.com/YOUR_USERNAME/magicbox/settings/secrets/actions` |
| Live App | https://magicbox.bankapirak.com |
| API | https://api.magicbox.bankapirak.com |
