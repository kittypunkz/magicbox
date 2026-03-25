# ADR-003: Bookmark Storage — `bookmark_url` Column vs `note_type` Enum

**Date:** 2026-03-24
**Status:** Proposed
**Deciders:** Solutions Architect, Product Owner
**Context:** MagicBox bookmark links feature

---

## Context and Problem Statement

Users want to save URLs as first-class "bookmark" entities within MagicBox. We need to decide how to represent bookmarks in the data model alongside existing notes.

Two candidate approaches emerged:

1. **Nullable `bookmark_url` column** — Add a `TEXT` column `bookmark_url` to the `notes` table. NULL = regular note, non-NULL = bookmark.
2. **`note_type` enum + separate URL field** — Add a `TEXT` column `note_type` (values: `'note'` | `'bookmark'`) and a `TEXT` column `bookmark_url`.

## Decision Drivers

- **Backwards compatibility** — Existing notes must be unaffected without data migration.
- **Query simplicity** — Minimal changes to existing SQL queries.
- **Data integrity** — The type indicator and the URL data should be coupled, not independent.
- **Simplicity** — Fewer columns, fewer states to validate.

## Considered Options

### Option A: Nullable `bookmark_url` Column (CHOSEN)

```sql
ALTER TABLE notes ADD COLUMN bookmark_url TEXT DEFAULT NULL;
CREATE INDEX idx_notes_bookmark ON notes(bookmark_url) WHERE bookmark_url IS NOT NULL;
```

**Pros:**
- Zero changes to existing queries. `SELECT *` automatically returns the column; existing code treats NULL as "regular note".
- The URL itself is the identifying data. If `bookmark_url IS NOT NULL`, it's a bookmark. No separate type field to keep in sync.
- Frontend check is trivial: `note.bookmark_url ? 'bookmark' : 'note'`.
- One column instead of two. Simpler schema.
- Converting bookmark → note is just `SET bookmark_url = NULL`.
- The partial index (`WHERE bookmark_url IS NOT NULL`) keeps index size near-zero for non-bookmark notes.

**Cons:**
- "Implicit type" via NULL might confuse developers unfamiliar with the pattern.
- If future note types are added (e.g., "task", "snippet"), this pattern doesn't scale well — would need a migration to add `note_type`.

### Option B: `note_type` Enum + `bookmark_url` Column

```sql
ALTER TABLE notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'note';
ALTER TABLE notes ADD COLUMN bookmark_url TEXT DEFAULT NULL;
ALTER TABLE notes ADD CHECK (note_type IN ('note', 'bookmark'));
ALTER TABLE notes ADD CHECK (note_type != 'bookmark' OR bookmark_url IS NOT NULL);
```

**Pros:**
- Explicit type field makes intent clear.
- Scales to additional note types without schema changes.
- CHECK constraint enforces data integrity (bookmarks must have URLs).

**Cons:**
- Two new columns instead of one.
- Every query that checks note type needs `note_type = 'bookmark'` — redundant when `bookmark_url IS NOT NULL` tells you the same thing.
- CHECK constraints are supported in SQLite 3.35+ (D1 supports this) but add complexity.
- More code to write and maintain for no functional benefit in the current scope.

### Option C: Separate `bookmarks` Table

Not seriously considered — would duplicate folder relationships, FTS integration, ordering, pinning, etc. Massive overengineering.

## Decision

**Option A: Nullable `bookmark_url` column.**

Rationale:
- Currently only two note types exist (note, bookmark). An enum adds overhead for no benefit.
- The NULL-as-default pattern is well-established and zero-risk for backwards compatibility.
- If future note types are needed, a later migration can add `note_type` and backfill from `bookmark_url IS NOT NULL`.
- Aligns with YAGNI — build for what's needed now, not hypothetical futures.

## Consequences

- **Positive:** Simplest implementation, zero migration risk, minimal code changes.
- **Positive:** `SELECT *` queries return bookmark data automatically — no query changes needed for GET endpoints.
- **Negative:** PATCH endpoint logic must handle `null` values for `bookmark_url` (converting bookmark → note). Current code uses `!== undefined` check which passes `null` through — this needs a type cast fix.
- **Risk:** If additional note types are added within 6 months, a follow-up migration will be needed. This is an acceptable tradeoff given the current scope.

## Related

- `backend/src/routes/notes.ts` — PATCH handler needs `bookmark_url` in UPDATEABLE_COLUMNS + null handling fix
- `backend/src/types/index.ts` — `Note` interface needs `bookmark_url: string | null`
- `backend/src/validators/schemas.ts` — `CreateNoteSchema`/`UpdateNoteSchema` need bookmark_url field
