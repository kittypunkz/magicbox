# 📚 Version Control Guide for MagicBox

How to manage versions and deploy features properly.

---

## 🔄 Basic Git Workflow

### Daily Development Flow

```bash
# 1. Start from main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes
# ... edit files ...

# 4. Commit changes
git add .
git commit -m "feat: add new feature description"

# 5. Push to GitHub
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
# 7. Merge PR → Auto-deploys!
```

---

## 🏷️ Semantic Versioning

Use semantic versioning for releases: `MAJOR.MINOR.PATCH`

| Version | When to Use | Example |
|---------|-------------|---------|
| **MAJOR** | Breaking changes | `v2.0.0` - Complete redesign |
| **MINOR** | New features (backward compatible) | `v1.1.0` - Add dark mode |
| **PATCH** | Bug fixes | `v1.0.1` - Fix search bug |

### Creating a Release

```bash
# 1. Tag a release
git tag -a v1.1.0 -m "Add dark mode and improve UI"

# 2. Push tag
git push origin v1.1.0

# GitHub Actions will:
# ✅ Create GitHub Release
# ✅ Deploy to production
```

---

## 🌿 Branch Strategy

### Branch Types

| Branch | Purpose | Deploys? |
|--------|---------|----------|
| `main` | Production code | ✅ Auto-deploy |
| `feature/*` | New features | ❌ (need PR) |
| `hotfix/*` | Urgent fixes | ⚠️ Manual |
| `v*` tags | Releases | ✅ Auto-deploy |

### Naming Conventions

```
feature/add-search-functionality
feature/dark-mode-toggle
hotfix/fix-login-bug
release/v1.2.0
```

---

## 📝 Commit Message Format

Use conventional commits for clear history:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Use For | Example |
|------|---------|---------|
| `feat` | New features | `feat: add dark mode toggle` |
| `fix` | Bug fixes | `fix: resolve search crash` |
| `docs` | Documentation | `docs: update README` |
| `style` | CSS/formatting | `style: improve button styling` |
| `refactor` | Code restructuring | `refactor: simplify note editor` |
| `ci` | CI/CD changes | `ci: update deployment workflow` |
| `chore` | Maintenance | `chore: update dependencies` |

### Examples

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve folder deletion bug"
git commit -m "feat(ui): redesign sidebar navigation"
git commit -m "docs: add deployment instructions"
```

---

## 🚀 Deployment Triggers

### Automatic Deployment (Push to main)

```bash
git checkout main
git merge feature/my-feature
git push origin main

# Result: 🚀 Auto-deployed!
```

### Manual Deployment (GitHub Actions)

1. Go to: https://github.com/kittypunkz/magicbox/actions
2. Click "🚀 Manual Deploy to Cloudflare"
3. Click "Run workflow"
4. Select options
5. Deploy!

### Comment Deployment (PR only)

Comment on Pull Request:
```
@deploy backend    # Deploy API only
@deploy frontend   # Deploy web only
@deploy            # Deploy everything
```

---

## 📋 Complete Workflow Example

### Adding a New Feature

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/add-tags-to-notes

# 3. Develop
# Edit files...

# 4. Test locally
npm run dev

# 5. Commit
git add .
git commit -m "feat: add tags to notes

- Add tags column to notes table
- Create tag input component
- Update note editor with tag support
- Add tag filtering in search"

# 6. Push
git push origin feature/add-tags-to-notes

# 7. Create Pull Request on GitHub
# 8. Code review (optional)
# 9. Merge to main → Auto-deploys!
```

---

## 🔥 Hotfix Workflow (Emergency)

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Fix the bug
# ... quick fix ...

# 3. Commit and push
git add .
git commit -m "fix: resolve critical login bug"
git push origin hotfix/critical-bug-fix

# 4. Create PR and merge immediately
# Or use manual deploy for speed
```

---

## 📊 Version History

### Viewing History

```bash
# See commit history
git log --oneline -10

# See with branches
git log --oneline --graph --all

# See what changed
git log --stat
```

### Rolling Back

```bash
# Rollback to previous commit
git revert HEAD

# Rollback to specific commit
git revert <commit-hash>

# Hard reset (DANGEROUS - loses changes)
git reset --hard HEAD~1
```

---

## 🎯 Best Practices

### ✅ Do

- ✅ Create feature branches for new work
- ✅ Write clear commit messages
- ✅ Pull before pushing
- ✅ Use semantic versioning for releases
- ✅ Test locally before pushing
- ✅ Keep commits small and focused

### ❌ Don't

- ❌ Push directly to main without testing
- ❌ Commit large binary files
- ❌ Write vague commit messages ("fix stuff")
- ❌ Forget to pull before starting work
- ❌ Commit secrets/tokens

---

## 🆘 Common Issues

### Merge Conflicts

```bash
# When you see "merge conflict"
# 1. Open conflicted files
# 2. Find <<<<<<< HEAD sections
# 3. Choose which changes to keep
# 4. Remove conflict markers
# 5. Commit the resolution

git add .
git commit -m "resolve merge conflicts"
```

### Forgot to Create Branch

```bash
# Oops, committed to main instead of feature branch
# Save your changes
git branch feature/my-feature
# Reset main
git reset --hard origin/main
# Switch to feature
git checkout feature/my-feature
```

### Undo Last Commit

```bash
# Keep changes, just undo commit
git reset --soft HEAD~1

# Completely remove last commit (DANGEROUS)
git reset --hard HEAD~1
```

---

## 📝 Quick Reference

```bash
# Daily workflow
git checkout main && git pull
git checkout -b feature/name
# ... work ...
git add . && git commit -m "feat: description"
git push origin feature/name
# Create PR on GitHub

# Release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Emergency fix
git checkout -b hotfix/name
git add . && git commit -m "fix: description"
git push origin hotfix/name
```

---

## 🌐 Your Repository

- **URL:** https://github.com/kittypunkz/magicbox
- **Actions:** https://github.com/kittypunkz/magicbox/actions
- **Live Site:** https://magicbox.bankapirak.com
