# Magicbox v2 — Implementation Plan

> Spec: [docs/ideas/magicbox-v2.md](./ideas/magicbox-v2.md)
> Status key: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` skipped

---

## UI Specification

### App Shell — Icon Rail Sidebar
```
┌────┬──────────────────────────────────────────┐
│ ▣  │                                          │
│ 📝 │          (page content)                  │
│ 🔖 │                                          │
│ ✓  │                                          │
│ 💬 │                                          │
│    │                                          │
│ ⚙  │                                          │
└────┴──────────────────────────────────────────┘
```
Collapsed: ~48px icons only. Hover/click: expands to ~220px with labels.
Mobile: bottom tab bar.

---

### Notes Page — Feed View
```
┌────┬──────────────────────────────────────────┐
│ 📝 │  Notes                   [+ New Note]    │
│    │  [All] [#Inbox] [#Design] [#Work] ...    │
│    │  ────────────────────────────────────    │
│    │  ┌────────────────────────────────────┐  │
│    │  │ 📌 #Inbox              2 hours ago │  │
│    │  │ Note Title                         │  │
│    │  │ Preview of content, truncated...   │  │
│    │  │ [Extract Tasks]                    │  │
│    │  └────────────────────────────────────┘  │
└────┴──────────────────────────────────────────┘
```
Cards: title + content preview + #folder tag + relative date + pin indicator + Extract Tasks button.
Click card → full-page editor. `+ New Note` → `/note/new`.

---

### Note Editor — Markdown with Click-to-Edit
Default: rendered markdown (`react-markdown`). Click → raw markdown textarea. Escape/blur → back to rendered. Auto-save 2s debounce.

---

## Architecture Decisions

- OpenRouter API key stored in D1 `settings` table (set from Settings UI)
- FTS5 for RAG retrieval (no Vectorize in v2)
- Chat: SSE streaming via Hono `streamText()`
- Daily Brief: Cron trigger nightly + on-demand fallback
- Tasks: always confirm-before-save (AI suggests, user approves)
- Replace BlockNote with pure markdown: `textarea` + `react-markdown`
- Bookmarks page = `GET /notes?type=bookmark`
- **Auth: replace passkeys with simple master password** — hashed with Web Crypto PBKDF2 (built into Workers runtime, no package needed). Sessions remain in D1 unchanged.

---

## Phase 0 — Auth: Replace Passkeys with Password

> Why first: auth is foundational. Everything else requires a working login.

**What changes:**
- Remove `@passwordless-id/webauthn` and all WebAuthn routes/UI
- Add `password_hash TEXT` column to `users` table
- Login = POST password → PBKDF2 verify → session cookie (7-day, same as today)
- Setup = first-run page to create the master password
- Sessions table, `sessionAuthMiddleware`, and session cookie format stay **unchanged**

**PBKDF2 on Cloudflare Workers (no package needed):**
```
hash   = crypto.subtle.deriveBits(PBKDF2, password + salt, 256)
verify = compare derived bits to stored hash
```

| # | Task | Status | Files |
|---|------|--------|-------|
| 0a | D1 migration: add `password_hash` + `password_salt` to `users` table | `[x]` | `backend/migrations/0006_auth_password.sql` |
| 0b | Backend auth rewrite: replace WebAuthn routes with `POST /auth/setup` + `POST /auth/login` + `POST /auth/logout` | `[x]` | `backend/src/routes/auth.ts`, `backend/src/types/index.ts` |
| 0c | Frontend login + setup page rewrite: simple password forms | `[x]` | `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/SetupPage.tsx`, `frontend/src/contexts/AuthContext.tsx` |

**New auth routes (replaces all WebAuthn endpoints):**
```
GET  /auth/status   → { isSetup: bool, isAuthenticated: bool }  (unchanged)
POST /auth/setup    → { password } — hashes + stores, creates first session
POST /auth/login    → { password } — verifies, creates session cookie
POST /auth/logout   → clears session (unchanged)
GET  /auth/me       → current user from session (unchanged)
```

**Checkpoint 0:** Can set password on setup screen · Can log in from any device with password · Session cookie persists · Logout works · Old passkey package removed

---

## Phase 1 — Foundation: Database + Settings

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | D1 migration: tasks, daily_briefs, settings tables | `[x]` | `backend/migrations/0007_v2_tables.sql` |
| 2 | Backend settings routes + OpenRouter models proxy | `[x]` | `backend/src/routes/settings.ts`, `index.ts`, `types/index.ts` |
| 3 | Frontend Settings page: API key input + model picker | `[x]` | `frontend/src/pages/SettingsPage.tsx`, `api/client.ts`, `types/index.ts` |

**Checkpoint 1:** API key stored/retrieved · Model picker loads live models · Build clean

---

## Phase 2 — Tasks

| # | Task | Status | Files |
|---|------|--------|-------|
| 4 | Backend tasks CRUD (GET/POST/PATCH/DELETE /tasks) | `[x]` | `backend/src/routes/tasks.ts`, `index.ts`, `validators/schemas.ts` |
| 5 | Frontend tasks API client + `useTasks` hook | `[x]` | `frontend/src/api/client.ts`, `hooks/useTasks.ts`, `types/index.ts` |
| 6 | Frontend TasksPage + route + nav icon | `[x]` | `frontend/src/pages/TasksPage.tsx`, `App.tsx`, `components/Sidebar.tsx` |

**Checkpoint 2:** Create/complete/delete tasks · Source note links work · Build clean

---

## Phase 3 — Process (AI Task Extraction)

| # | Task | Status | Files |
|---|------|--------|-------|
| 7 | Backend process routes: `/notes/:id/process` + `/process/recent` | `[x]` | `backend/src/routes/notes.ts` or `routes/process.ts`, `index.ts` |
| 8 | Frontend TaskConfirmModal + NoteCard Extract Tasks button | `[x]` | `frontend/src/components/TaskConfirmModal.tsx`, `components/NoteCard.tsx` |

**Checkpoint 3:** Note → Extract → Confirm → Task with note link · Batch process works

---

## Phase 4 — UI Redesign: Shell + Notes Feed

| # | Task | Status | Files |
|---|------|--------|-------|
| 9 | Icon rail sidebar (rewrite Sidebar.tsx) | `[ ]` | `frontend/src/components/Sidebar.tsx` |
| 10 | MarkdownEditor component (textarea + react-markdown toggle) | `[ ]` | `frontend/src/components/MarkdownEditor.tsx` |
| 11 | NoteEditorPage rewrite (click-to-edit, auto-save, folder selector) | `[ ]` | `frontend/src/pages/NoteEditorPage.tsx`, `App.tsx` |
| 12 | NotesPage — feed view with NoteCard component | `[ ]` | `frontend/src/pages/NotesPage.tsx`, `components/NoteCard.tsx`, `App.tsx` |

**Checkpoint 4:** Icon rail works · Feed shows cards with filters · Editor opens and auto-saves

---

## Phase 5 — Chat

| # | Task | Status | Files |
|---|------|--------|-------|
| 13 | Backend POST /chat: FTS5 RAG + OpenRouter streaming (SSE) | `[ ]` | `backend/src/routes/chat.ts`, `index.ts` |
| 14 | Frontend AskPage: streaming chat UI | `[ ]` | `frontend/src/pages/AskPage.tsx`, `App.tsx`, `api/client.ts` |

**Checkpoint 5:** Ask a question → streaming answer with note references

---

## Phase 6 — Daily Brief

| # | Task | Status | Files |
|---|------|--------|-------|
| 15 | Backend GET /brief + GET /briefs (generate + cache) | `[ ]` | `backend/src/routes/brief.ts`, `index.ts` |
| 16 | Cron trigger: nightly brief generation | `[ ]` | `backend/wrangler.toml`, `backend/src/index.ts` |
| 17 | Frontend BriefPage (home `/`) + BookmarksPage + final routing | `[ ]` | `frontend/src/pages/BriefPage.tsx`, `pages/BookmarksPage.tsx`, `App.tsx`, `api/client.ts` |

**Checkpoint 6 — Complete:**
- [ ] Full loop: open → brief → process notes → tasks → ask question
- [ ] All 5 nav tabs route correctly
- [ ] Existing notes/bookmarks/auth unaffected
- [ ] `npm run build` clean in both workspaces

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenRouter chat latency | High | SSE streaming — first token appears fast |
| FTS5 semantic misses | Medium | Acceptable v2; add Vectorize in v2.1 |
| BlockNote removal breaks notes | Medium | Notes stored as markdown string — MarkdownEditor renders directly |
| Cron brief fails silently | Low | `GET /brief` generates on-demand as fallback |
| react-markdown not installed | Low | `npm install react-markdown remark-gfm` in Task 10 |
