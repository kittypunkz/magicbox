# 🚀 Release Workflow: Multiple Features → One Release

How to work on 2-3 features and deploy them together as one release.

---

## 🌿 Branch Strategy Overview

```
feature/A  ────┐
feature/B  ────┼───►  develop  ───►  main  ───►  Production
feature/C  ────┘      (test)       (release)    (live)
```

| Branch | Purpose | Deploys? |
|--------|---------|----------|
| `feature/*` | Individual features | ❌ No |
| `develop` | Integration & testing | ❌ No (or staging) |
| `main` | Production releases | ✅ Yes |

---

## 📋 Workflow: 3 Features → 1 Release

### Step 1: Create Feature Branches

```bash
# Start from main
git checkout main
git pull origin main

# Create feature 1
git checkout -b feature/search-by-tags
# ... work on it ...
git add . && git commit -m "feat: add search by tags"
git push origin feature/search-by-tags

# Create feature 2
git checkout main
git checkout -b feature/export-notes
# ... work on it ...
git add . && git commit -m "feat: add export to markdown"
git push origin feature/export-notes

# Create feature 3
git checkout main
git checkout -b feature/drag-drop-folders
# ... work on it ...
git add . && git commit -m "feat: add drag-drop folder reorder"
git push origin feature/drag-drop-folders
```

---

### Step 2: Create Integration Branch (develop)

```bash
# Create develop branch from main
git checkout main
git pull origin main
git checkout -b develop

# Merge all features into develop
git merge feature/search-by-tags --no-ff -m "merge: add search by tags"
git merge feature/export-notes --no-ff -m "merge: add export to markdown"
git merge feature/drag-drop-folders --no-ff -m "merge: add drag-drop folders"

# Test everything together locally
npm run dev

# Push develop branch
git push origin develop
```

---

### Step 3: Test on Develop Branch

**Option A: Local Testing**
```bash
git checkout develop
npm run dev
# Test all features together
```

**Option B: Deploy to Staging (Optional)**
If you want a staging environment:
```bash
# Update version for staging
git checkout develop
git tag -a v1.2.0-rc.1 -m "Release candidate 1"
git push origin v1.2.0-rc.1
# Then manually deploy to staging URL
```

---

### Step 4: Release to Production

When all features are tested and ready:

```bash
# Switch to main
git checkout main
git pull origin main

# Merge develop into main (this is the release!)
git merge develop --no-ff -m "release: v1.2.0 - Search, Export, Drag-Drop"

# Update version in code (IMPORTANT!)
# Edit: frontend/src/components/Sidebar.tsx
# Change: v1.0.0 → v1.2.0

# Commit version bump
git add .
git commit -m "chore: bump version to v1.2.0"

# Create release tag
git tag -a v1.2.0 -m "Release v1.2.0

Features:
- Search notes by tags
- Export notes to markdown
- Drag-drop folder reorder"

# Push everything
git push origin main
git push origin v1.2.0

# 🎉 Auto-deploys to production!
```

---

## 🔄 Visual Timeline

```
Day 1-3:  Work on feature/search-by-tags
          Work on feature/export-notes
          Work on feature/drag-drop-folders

Day 4:    Merge all to develop
          Test everything together

Day 5:    Merge develop to main
          Tag v1.2.0
          🚀 Auto-deploy!
```

---

## 📂 Alternative: Simpler Approach (No Develop Branch)

If you don't want a `develop` branch:

```bash
# Work on features separately
git checkout -b feature/A
git checkout -b feature/B
git checkout -b feature/C

# When ready, merge to main one by one WITHOUT pushing
# (keep them local until all ready)

git checkout main

git merge feature/A --no-ff
git merge feature/B --no-ff
git merge feature/C --no-ff

# Test locally
npm run dev

# All good? Push once!
git push origin main

# Tag and release
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

---

## 🏷️ Version Management

### When to Bump Version

| Change | Version | Example |
|--------|---------|---------|
| 1-2 small fixes | Patch | `v1.0.0` → `v1.0.1` |
| 2-3 new features | Minor | `v1.0.0` → `v1.1.0` |
| Major redesign | Major | `v1.0.0` → `v2.0.0` |

### Version Update Checklist

- [ ] Update `frontend/src/components/Sidebar.tsx`
- [ ] Update `frontend/package.json` (optional)
- [ ] Update `backend/package.json` (optional)
- [ ] Create git tag
- [ ] Write release notes

---

## 📝 Commit Message Convention for Releases

```bash
# Individual feature commits (on feature branches)
git commit -m "feat: add search by tags functionality"
git commit -m "feat: implement markdown export"
git commit -m "feat: add drag-drop folder reordering"
git commit -m "fix: resolve folder selection bug"

# Merge commits
git merge feature/search --no-ff -m "merge: add search by tags"
git merge develop --no-ff -m "release: v1.2.0"

# Version bump
git commit -m "chore: bump version to v1.2.0"
```

---

## 🎯 Quick Reference

### For 3 Features → 1 Release

```bash
# 1. Create feature branches (do this for each feature)
git checkout main && git pull
git checkout -b feature/my-feature
# work...
git commit -m "feat: description"
git push origin feature/my-feature

# 2. Create develop branch
git checkout main
git checkout -b develop
git merge feature/feature-1 --no-ff
git merge feature/feature-2 --no-ff
git merge feature/feature-3 --no-ff
git push origin develop

# 3. Test locally
npm run dev

# 4. Release!
git checkout main
git merge develop --no-ff
# update version in code
git add . && git commit -m "chore: bump version to v1.2.0"
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main
git push origin v1.2.0
```

---

## 🔥 Hotfix During Feature Development

If you need to fix a critical bug while working on features:

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-fix
# fix...
git commit -m "fix: resolve critical bug"

# Option A: Deploy hotfix immediately
git checkout main
git merge hotfix/critical-fix --no-ff
git push origin main  # Deploys immediately

# Option B: Include in next release
git checkout develop
git merge hotfix/critical-fix --no-ff
git checkout main
git merge develop --no-ff  # Will deploy with other features
git push origin main
```

---

## ✅ Best Practices Summary

1. **Always use feature branches** - Never commit directly to main
2. **Test before merging** - Run `npm run dev` on develop branch
3. **Update version on release** - Change version number in code
4. **Write meaningful release notes** - List all features/changes
5. **Tag every release** - `git tag -a v1.2.0 -m "description"`
6. **Keep commits clean** - Use conventional commit format

---

## 🌐 Your Workflow

| Action | Command |
|--------|---------|
| Start feature | `git checkout -b feature/name` |
| Merge to develop | `git checkout develop && git merge feature/name` |
| Test all features | `npm run dev` on develop branch |
| Release to prod | `git checkout main && git merge develop` |
| Tag release | `git tag -a v1.2.0 -m "Release v1.2.0"` |
| Push & deploy | `git push origin main && git push origin v1.2.0` |

---

## 🎉 Example Release

**Release v1.2.0**

Features included:
- ✅ Keyboard navigation for folder selection
- ✅ Dark mode toggle
- ✅ Version footer in sidebar
- ✅ Search improvements

All deployed together with one tag push! 🚀
