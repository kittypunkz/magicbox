# Magicbox v2 — "Your Second Brain That Talks Back"

## Problem Statement

> How might we make Magicbox surface the right note, task, or bookmark at the right moment — so a daily user never loses context or misses something they meant to act on?

---

## Recommended Direction

Three features, one loop:

**Morning (Brief as Home):** Magicbox opens to a generated home screen. Each night a Cloudflare Cron Trigger calls OpenRouter, summarizes yesterday's notes, lists pending tasks, and stores the result in D1. Opening the app = seeing your brief. Old briefs are archived and browsable — your brief history becomes a personal journal of your days.

**On demand (Chat at `/ask`):** A dedicated page. Type in plain language. The backend retrieves relevant notes *and* bookmarks via FTS5, sends top results as context to OpenRouter, and streams a direct answer with source links back to the original note or bookmark. Your full knowledge base — notes and bookmarks together — is queryable.

**When ready (Process):** A "Extract Tasks" button on the Brief (for recent notes batch) and on each individual note. OpenRouter returns candidate tasks; you confirm or discard each one before they're saved. Every task stores a `note_id` link — one click takes you back to the original note that generated it.

**Settings page** gets a model picker: a searchable dropdown that fetches available models from OpenRouter's `/api/v1/models` endpoint live, so you always see the full current list and can switch models without touching config files.

---

## MVP Scope

### New D1 Tables

```
tasks        — id, note_id (FK nullable), title, status (pending/done), created_at, completed_at
daily_briefs — id, date (unique), content, created_at
settings     — key, value  (openrouter_api_key, preferred_model)
```

### New API Routes (Hono, Workers)

```
POST   /api/chat                   — FTS5 retrieve → OpenRouter stream
GET    /api/brief                  — today's brief (generate if missing)
GET    /api/briefs                 — brief history list
POST   /api/notes/:id/process      — extract tasks from one note
POST   /api/process/recent         — extract tasks from last 24h of notes
GET    /api/tasks                  — list tasks (filter: pending/done)
PATCH  /api/tasks/:id              — mark done / edit
DELETE /api/tasks/:id              — delete
GET    /api/settings               — read settings
PUT    /api/settings               — write settings
```

### Navigation (5 tabs)

```
/          → Home (Daily Brief)
/notes     → Notes (existing, unchanged)
/bookmarks → Bookmarks (existing, unchanged)
/tasks     → Tasks (new — list, mark done, click → source note)
/ask       → Chat (new)
/settings  → Settings (model picker added)
```

### Build Order (most productive sequence)

1. **Settings + OpenRouter key** — nothing else works without this
2. **Tasks table + `/tasks` page** — foundation for everything downstream
3. **Process button** (per-note first, then batch on Brief) — core loop starts here
4. **Chat `/ask`** — FTS5 retrieval + OpenRouter streaming
5. **Daily Brief** (home screen + Cron trigger + brief history) — last, because it depends on tasks + chat being solid

---

## Key Assumptions to Validate

- [ ] FTS5 retrieval is good enough for chat RAG — test by asking 10 questions across 50+ notes. If recall is poor, add Cloudflare Vectorize in v2.1.
- [ ] OpenRouter latency is acceptable — target under 3s for chat responses. Use Claude Haiku or Mistral Small for Brief generation (cheap + fast), Claude Sonnet for chat (accurate).
- [ ] Notes are detailed enough to extract real tasks — if inputs are too terse, Process produces garbage. May need onboarding nudge: *"Write notes like you'd explain to a colleague."*
- [ ] The Brief habit forms — if you don't open the app daily, the loop breaks. Make `/` the browser bookmark.

---

## Not Doing (and Why)

- **Aging bookmark alerts in Brief** — bookmarks are part of the knowledge base for chat and notes, not a task queue. Keep the feature, remove the nagging.
- **Auto-commit tasks** — AI suggests, you approve. Always. Trust is built slowly.
- **Cloudflare Vectorize in v2** — FTS5 on a personal dataset is sufficient. Earn the upgrade with real usage data.
- **Chat history persistence** — stateless chat in v2. Add a `chat_messages` table in v2.1 if you miss context between sessions.
- **Multi-user, shared notes, PWA, knowledge graph** — single-user is permanent. Everything else is v3+.

---

## Decisions

- Old briefs → archived and browsable (brief history)
- Tasks → link back to source note (`note_id` FK, one click to original)
- Bookmarks → included in chat RAG, feature kept as-is, removed from Brief alerts
- Model picker → in Settings, searchable dropdown from OpenRouter live model list
- All existing notes and bookmarks carry forward into v2 unchanged
