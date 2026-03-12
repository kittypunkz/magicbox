# 🛠️ MagicBox Developer Guide

Learnings from building and deploying MagicBox to avoid future issues.

---

## 🚀 Quick Start (Daily Development)

### 1. Start Local Development

```bash
cd magicbox

# Terminal 1 - Backend
cd backend
npm run dev
# API: http://localhost:8787

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Web: http://localhost:3000
```

### 2. Test Before Pushing

```bash
cd frontend
npm run build
# Must pass TypeScript checks!
```

---

## 📁 Project Structure

```
magicbox/
├── backend/
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Entry point
│   └── wrangler.toml     # Cloudflare config
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── api/          # API client
│   └── index.html
└── .github/workflows/    # CI/CD
```

---

## 🎨 Dark Mode Best Practices

### ✅ DO: Use Explicit Dark Colors

```typescript
// GOOD - Explicit dark colors
const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

<div className={`${c.bg} ${c.text}`}>Content</div>
```

### ❌ DON'T: Use Tailwind dark: classes

```typescript
// BAD - Unreliable with Vite
<div className="bg-white dark:bg-[#191919]">Content</div>
```

### Color Palette

| Element | Color Code |
|---------|------------|
| Background | `#191919` |
| Sidebar | `#202020` |
| Hover | `#2a2a2a` |
| Input | `#2a2a2a` |
| Text | `#e6e6e6` |
| Gray Text | `#6b6b6b` |
| Border | `#2f2f2f` |

---

## 🔌 CORS Configuration

### Backend (src/index.ts)

```typescript
app.use('*', cors({
  origin: [
    'https://magicbox.bankapirak.com',  // Production
    'http://localhost:3000',             // Dev default
    'http://localhost:3001',             // Dev alt
    'http://localhost:8787',             // Local API
  ],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));
```

### Common CORS Error

```
Access to fetch blocked by CORS policy
```

**Fix:** Add your localhost port to backend CORS, then redeploy backend.

---

## 🔄 State Management

### Sharing State Between Components

**Problem:** Sidebar and HomePage both need folder list

**Solution:** Lift state to App.tsx

```typescript
// App.tsx
const { folders, addFolderLocally } = useFolders();

<Sidebar folders={folders} ... />
<HomePage folders={folders} addFolderLocally={addFolderLocally} ... />
```

### Instant UI Updates

```typescript
// When creating new item, update local state immediately
const handleCreateFolder = async (name: string) => {
  const newFolder = await createFolder(name);
  addFolderLocally(newFolder); // Instant update!
  return newFolder;
};
```

---

## 🐛 Common Errors & Fixes

### Error: "Nested buttons" (React Warning)

**Fix:** Change outer button to div
```tsx
// BAD
<button>
  <button>Edit</button>
</button>

// GOOD
<div onClick={...}>
  <button>Edit</button>
</div>
```

### Error: "Property 'env' does not exist"

**Fix:** Don't use import.meta.env in components
```typescript
// BAD
const API_BASE = import.meta.env.VITE_API_URL;

// GOOD
const API_BASE = 'https://api.magicbox.bankapirak.com';
```

### Error: "Type not defined"

**Fix:** Import types explicitly
```typescript
import type { Folder, Note } from '../types';
```

---

## 🚀 Deployment Checklist

### Before Pushing to GitHub

- [ ] `npm run build` passes (no TypeScript errors)
- [ ] Test locally at http://localhost:3000
- [ ] Check all features work
- [ ] No console errors (F12)

### Release Process

```bash
# 1. Merge feature to develop
git checkout develop
git merge feature/my-feature

# 2. Test on develop branch
npm run dev

# 3. Merge to main (production)
git checkout main
git merge develop

# 4. Update version
# Edit: frontend/src/components/Sidebar.tsx
# Change: v1.0.0 → v1.1.0

git add .
git commit -m "chore: bump version to v1.1.0"

# 5. Tag and release
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main
git push origin v1.1.0

# 6. GitHub Actions auto-deploys!
```

---

## 📦 Version Control

### Branch Strategy

| Branch | Purpose | Deploys? |
|--------|---------|----------|
| `main` | Production | ✅ Auto-deploy |
| `develop` | Integration | ❌ Test only |
| `feature/*` | New features | ❌ PR only |

### Commit Message Format

```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: maintenance task
ci: CI/CD changes
```

---

## 🔧 GitHub Actions Secrets

Required secrets at: https://github.com/kittypunkz/magicbox/settings/secrets/actions

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | From Cloudflare profile |
| `CLOUDFLARE_ACCOUNT_ID` | `49b16ed3ff0d8209f2a3da300341283b` |
| `VITE_API_URL` | `https://api.magicbox.bankapirak.com` |

---

## 🌐 URLs Reference

| Environment | URL |
|-------------|-----|
| Production | https://magicbox.bankapirak.com |
| API | https://api.magicbox.bankapirak.com |
| Local Dev | http://localhost:3000 |
| Local API | http://localhost:8787 |

---

## 🐛 Debugging Tips

### Check Build Locally
```bash
cd frontend
npm run build
# Watch for TypeScript errors
```

### Clear Cache
```bash
rm -rf dist node_modules/.vite
npm run dev
```

### Browser Console Commands
```javascript
// Check localStorage
localStorage.getItem('magicbox-theme')

// Clear everything
localStorage.clear()
location.reload()

// Force dark mode
document.documentElement.classList.add('dark')
```

---

## ✅ Testing Checklist

### New Feature Testing

- [ ] Works in local dev
- [ ] Build passes (`npm run build`)
- [ ] Dark mode looks correct
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Keyboard navigation works

### Before Release

- [ ] All features tested on `develop`
- [ ] Version bumped
- [ ] Git tag created
- [ ] GitHub Actions passing
- [ ] Production URL working

---

## 🚀 Emergency Commands

```bash
# Hard reset to main
git checkout main
git fetch origin
git reset --hard origin/main

# Deploy backend manually
cd backend
npx wrangler deploy

# Deploy frontend manually
cd frontend
npm run build
npx wrangler pages deploy dist
```

---

## 💡 Key Learnings

1. **Always test build before pushing** - catches TypeScript errors
2. **Use explicit dark colors** - `dark:` classes don't work reliably
3. **Share state via props** - don't use hooks in multiple places
4. **Update CORS for new ports** - localhost:3001, 3002, etc.
5. **Hard reload browser** - `Ctrl+Shift+R` after deployments
6. **Check GitHub Actions** - verify deployment succeeded

---

**Happy coding!** 🎉
