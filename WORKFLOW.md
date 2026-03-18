# 🚀 MagicBox Development Workflow

Choose the workflow that fits your needs!

---

## 🎯 Option 1: PR-Based Workflow (Recommended)

**For:** Team collaboration, code review, safe deployments

```
Feature Branch → Pull Request → Merge to Main → Auto Deploy
```

### Steps:

#### 1. Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature
```

#### 2. Make Changes & Commit
```bash
# ... make changes ...
git add .
git commit -m "feat: your feature"
git push origin feature/your-feature
```

#### 3. Create Pull Request
```bash
# Go to GitHub and create PR:
# https://github.com/kittypunkz/magicbox/pull/new/feature/your-feature

# Or use GitHub CLI:
gh pr create --title "feat: your feature" --body "Description"
```

#### 4. Code Review (Self or Team)
- Review changes on GitHub
- Run tests if available
- Request changes or approve

#### 5. Merge PR
```bash
# On GitHub, click "Merge pull request"
# This triggers auto-deployment to production!
```

---

## 🎯 Option 2: Direct Push (Solo/Speed)

**For:** Solo development, quick hotfixes

```
Local → Test → Push to Main → Auto Deploy
```

### Steps:
```bash
git checkout main
git pull origin main

# Make changes
# Test locally with .\dev.bat

git add .
git commit -m "feat: your feature"
git push origin main

# Auto-deploys to production!
```

---

## 🎯 Option 3: With Dev Environment

**For:** Testing before production

```
Feature Branch → PR → Merge to Develop → Test → PR to Main → Deploy
```

---

## 📋 PR-Based Workflow (Detailed)

### Setting Up Branch Protection

1. Go to: https://github.com/kittypunkz/magicbox/settings/branches
2. Click "Add rule" for `main` branch
3. Enable:
   - ✅ **Require pull request reviews before merging**
   - ✅ **Require status checks to pass** (optional)
   - ✅ **Restrict pushes that create files larger than 100MB**

### Creating a Pull Request

```bash
# 1. Create and switch to feature branch
git checkout -b feature/amazing-feature

# 2. Make changes
vim src/components/Sidebar.tsx

# 3. Commit
git add src/components/Sidebar.tsx
git commit -m "feat: add amazing feature to sidebar"

# 4. Push branch
git push -u origin feature/amazing-feature

# 5. Create PR (opens browser)
gh pr create --title "feat: add amazing feature" \
  --body "This PR adds an amazing feature to the sidebar."

# 6. View PR
gh pr view --web
```

### Merging a Pull Request

```bash
# Option A: Merge on GitHub (recommended)
# Go to PR page, click "Merge pull request"

# Option B: Merge via CLI
gh pr merge --squash --delete-branch

# This triggers auto-deployment!
```

---

## 🔀 Complete PR Workflow Example

```bash
# Start fresh
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/dark-mode

# Work on feature
# ... edit files ...
# Test locally: .\dev.bat

# Commit and push
git add .
git commit -m "feat: add dark mode toggle"
git push origin feature/dark-mode

# Create PR
gh pr create --title "feat: add dark mode" --fill

# View PR, review changes
gh pr view --web

# Merge PR (when ready)
gh pr merge --squash --delete-branch

# Deployed automatically! 🚀
```

---

## 🛡️ Branch Protection (Recommended Setup)

Protect your `main` branch:

1. **Require PR reviews**
   - Require 1 approval before merging
   - Dismiss stale PR approvals when new commits are pushed

2. **Require status checks**
   - Require branches to be up to date before merging
   - Status checks: build, typecheck, test

3. **Restrict who can push**
   - Only allow specific people/teams to push to main
   - Force all changes through PR

4. **Require linear history**
   - Prevent merge commits
   - Use squash or rebase merging

---

## 📊 Comparison

| Feature | PR-Based | Direct Push |
|---------|----------|-------------|
| Code Review | ✅ Required | ❌ None |
| Safety | ⭐⭐⭐ High | ⭐⭐ Medium |
| Speed | 🐢 Slower | ⚡ Fastest |
| Team Use | ✅ Perfect | ❌ Risky |
| Solo Use | ✅ Good | ✅ Good |
| Rollback | ✅ Easy | ✅ Easy |

---

## 🚀 Quick Reference

### GitHub CLI Commands
```bash
# Install GitHub CLI: https://cli.github.com/

gh pr create          # Create PR
ghe pr list           # List PRs
gh pr view            # View PR details
gh pr checkout 123    # Checkout PR #123
gh pr merge           # Merge PR
gh pr close           # Close PR
```

### Git Commands
```bash
git checkout -b feature/xxx    # Create branch
git push -u origin feature/xxx # Push branch
git branch -d feature/xxx      # Delete local branch
```

---

## 💡 Best Practices

1. **Use descriptive branch names**
   - `feature/dark-mode`
   - `fix/login-bug`
   - `docs/update-readme`

2. **Write good commit messages**
   - `feat: add user profile page`
   - `fix: resolve login timeout issue`
   - `docs: update API documentation`

3. **Keep PRs small and focused**
   - One feature per PR
   - Easier to review
   - Easier to rollback

4. **Self-review before requesting review**
   - Check your own PR first
   - Catch obvious mistakes

5. **Use draft PRs for WIP**
   - Create as draft while working
   - Mark ready for review when done

---

## 🔗 Useful Links

- **Pull Requests**: https://github.com/kittypunkz/magicbox/pulls
- **Branch Protection**: https://github.com/kittypunkz/magicbox/settings/branches
- **Actions**: https://github.com/kittypunkz/magicbox/actions
