# QA Workflow Guide

## 🌿 Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production | Production Environment |
| `develop` | Integration | Development Environment |
| `qa` | QA Testing | QA/Staging Environment |
| `feature/*` | New Features | Local/Dev Only |

## 🔄 QA Process Flow

### 1. Developer Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. Work on feature, commit changes
git add .
git commit -m "feat: add new feature"

# 3. Push feature branch
git push -u origin feature/new-feature

# 4. Create PR to qa branch for QA testing
# (via GitHub UI)
```

### 2. QA Testing Flow

```
Developer creates PR → Reviewer approves → Merge to qa
                           ↓
                    Auto-deploy to QA env
                           ↓
              QA Team tests on qa.magicbox.app
                           ↓
              QA Approves → Merge to develop
                           ↓
              Final QA → Merge to main (production)
```

### 3. Deployment Commands

```bash
# Deploy to QA (after feature is ready for testing)
git checkout qa
git merge feature/new-feature --no-edit
git push origin qa

# After QA passes, deploy to develop
git checkout develop
git merge qa --no-edit
git push origin develop

# After final approval, deploy to production
git checkout main
git merge develop --no-edit
git push origin main
```

## 📝 QA Checklist Template

Create this template for every feature PR:

```markdown
## QA Checklist

### Feature: [Feature Name]
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] Auto-save works correctly
- [ ] Navigation works properly

### Regression Testing
- [ ] Existing notes still editable
- [ ] Folder navigation works
- [ ] Delete functionality works
- [ ] Homepage loads correctly

### Performance
- [ ] Page loads under 3 seconds
- [ ] No memory leaks

QA Approved By: ___________
Date: ___________
```

## 🚀 Environment URLs

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | https://magicbox.app | `main` |
| QA/Staging | https://qa.magicbox.app | `qa` |
| Development | http://localhost:3000 | `develop` |

## 🏷️ Version Tagging

After QA approves and code reaches production:

```bash
# Tag the release
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0 - New Feature"
git push origin v1.2.0
```

## 🐛 Bug Fix Workflow

For bugs found in QA:

```bash
# 1. Create hotfix from qa
git checkout qa
git checkout -b hotfix/bug-description

# 2. Fix the bug
git commit -m "fix: resolve bug description"

# 3. Push and create PR to qa
git push -u origin hotfix/bug-description
# Create PR to qa branch

# 4. After QA approves
# Merge to qa → develop → main
```

## 📋 Pre-QA Checklist (Developer)

Before sending to QA:
- [ ] Code builds without errors (`npm run build`)
- [ ] TypeScript checks pass (`npx tsc --noEmit`)
- [ ] Tested locally
- [ ] No console warnings
- [ ] Feature flag added (if needed)
- [ ] PR description includes testing steps
