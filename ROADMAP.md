# MagicBox Roadmap

## ✅ Built (Production)

### Core Features
- Notes CRUD (create, read, update, delete)
- Folders (create, rename, delete, organize)
- Search (FTS across title + content)
- Pin notes
- Bookmark links (with title fetch + favicon)
- Auto-save (debounced)
- Passkey authentication

### Editor
- BlockNote block-based editor
- Markdown rendering
- In-note search (Ctrl+F)
- Full-width toggle

### UI
- Dark mode (Obsidian style)
- Responsive mobile/desktop
- Sidebar with folder navigation
- Timeline view toggle in folders
- Grid view (default)
- Recent notes in sidebar

### Infrastructure
- Production: magicbox.bankapirak.com
- Dev: develop.magicbox-app.pages.dev
- Independent dev environment (DB + API + frontend)
- E2E tests (22/22 passing)
- CI/CD via Cloudflare Pages + Workers

---

## 🔲 Not Built Yet

### High Priority
- [ ] Share notes (public link)
- [ ] Export notes (Markdown, PDF)
- [ ] Tags/labels (beyond folders)
- [ ] Trash / recover deleted notes
- [ ] Bulk operations (move, delete, tag)
- [ ] Keyboard shortcuts guide

### Medium Priority
- [ ] Dark/light theme toggle
- [ ] Note templates
- [ ] Inline images in notes
- [ ] Table support in BlockNote
- [ ] Note linking (backlinks)
- [ ] Version history (undo/redo across sessions)

### Low Priority
- [ ] Collaboration (shared folders)
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)
- [ ] AI features (summarize, rewrite, translate)

---

## 🔧 Tech Debt
- [ ] Auth frontend integration (currently disabled)
- [ ] E2E test coverage for new features
- [ ] Bundle size optimization (BlockNote is large)
- [ ] Error boundary for all routes
- [ ] Loading states for all async operations

---

## Next Sprint (Proposed)
1. Share notes via public link
2. Export to Markdown/PDF
3. Tags/labels system
4. Trash with recovery
5. Deploy current features to production
