# MagicBox — Bookmark Links Feature Plan

## 1. Feature Overview

**Problem:** Users frequently save URLs in MagicBox but have to manually type context around them. There's no visual distinction between a rich note and a simple saved link.

**Solution:** When a user creates a note with a URL as the title, MagicBox automatically recognizes it as a **bookmark** — disabling the content editor, saving the URL, and rendering bookmarks with a distinct visual style (favicon preview, link icon, one-click open).

**User Story:**
> As a user, I can paste a URL into the title field when creating a new note, and the system saves it as a bookmark with a preview of the site, so I can quickly save and find links without extra friction.

**Success Criteria:**
- URL detection fires as user types/pastes in the CreateNoteModal title field
- Content editor is disabled (or hidden) when a URL is detected
- Bookmark cards render with favicon + truncated URL instead of content preview
- Clicking a bookmark opens the URL in a new tab
- Bookmarks work with folders, pinning, search, and all existing features
- Backwards-compatible: existing notes are unaffected

---

## 2. Database Changes

**New migration: `0004_add_bookmarks.sql`**

```sql
-- Add bookmark_url column (NULL = regular note, non-NULL = bookmark)
ALTER TABLE notes ADD COLUMN bookmark_url TEXT DEFAULT NULL;

-- Index for filtering bookmarks
CREATE INDEX idx_notes_bookmark ON notes(bookmark_url) WHERE bookmark_url IS NOT NULL;
```

**Design rationale:** Using a nullable `bookmark_url` column instead of a `note_type` enum:
- Zero changes to existing queries (NULL = regular note)
- The URL itself is the identifying data — no need for a separate type column
- Frontend can check `note.bookmark_url ? 'bookmark' : 'note'` trivially
- Simpler than managing an enum + separate URL field

**No changes to FTS table** — bookmark URLs are already in `title`, which FTS indexes.

---

## 3. API Endpoints

### 3.1 Modify: `POST /notes` (Create Note)

**File:** `backend/src/routes/notes.ts`

Current flow:
```
{ folder_id, title, content } → INSERT INTO notes
```

Modified flow:
```
1. Validate with CreateNoteSchema (add optional bookmark_url field)
2. If bookmark_url is provided:
   - Store bookmark_url in the new column
   - Set content = '' (ignore any content)
   - Set title = bookmark_url (or user-provided title)
3. INSERT INTO notes (folder_id, title, content, bookmark_url)
4. Return note with bookmark_url field
```

**Changes:**
- `CreateNoteSchema`: Add optional `bookmark_url: z.string().url().optional()`
- INSERT statement: add `bookmark_url` column
- No changes to response shape (new field just appears)

### 3.2 Modify: `PATCH /notes/:id` (Update Note)

**File:** `backend/src/routes/notes.ts`

- Add `bookmark_url` to `UPDATEABLE_COLUMNS` whitelist
- Add `bookmark_url: z.string().url().nullish()` to `UpdateNoteSchema`
  - `nullish()` allows clearing bookmark_url (convert bookmark → note)

### 3.3 Modify: `GET /notes`, `GET /notes/:id`

**No code changes needed** — `SELECT *` already returns all columns. The new `bookmark_url` field will automatically appear in responses.

### 3.4 Types

**File:** `backend/src/types/index.ts`

Add to `Note` and `NoteWithFolder`:
```ts
bookmark_url: string | null;
```

**File:** `frontend/src/types/index.ts`

Add to `Note`:
```ts
bookmark_url: string | null;
```

Add to `CreateNoteRequest`:
```ts
bookmark_url?: string;
```

Add to `UpdateNoteRequest`:
```ts
bookmark_url?: string | null;
```

---

## 4. Frontend Components

### 4.1 `CreateNoteModal.tsx` — MODIFY

**File:** `frontend/src/components/CreateNoteModal.tsx`

**Changes:**

1. **URL detection utility** — add helper function:
   ```ts
   function isURL(text: string): boolean {
     try {
       const url = new URL(text.trim());
       return url.protocol === 'http:' || url.protocol === 'https:';
     } catch {
       return false;
     }
   }
   ```

2. **Reactive title state** — compute `isBookmark` on every title change:
   ```ts
   const isBookmark = isURL(title);
   ```

3. **Disable/hide content editor** when `isBookmark` is true:
   - Conditionally render the content textarea
   - Or render it disabled with a hint: "Bookmark mode — content disabled"
   - Preferred: hide it entirely and show a bookmark preview badge

4. **Update `onCreateNote` callback signature** to accept `bookmark_url`:
   ```ts
   // New callback prop
   onCreateNote: (title: string, content: string, folderName: string | null, bookmarkUrl?: string) => void;
   ```

5. **Update `handleSubmit`** to pass bookmark_url when detected:
   ```ts
   if (isBookmark) {
     onCreateNote(cleanTitle, '', folderName, title.trim());
   } else {
     onCreateNote(cleanTitle, cleanContent, folderName);
   }
   ```

6. **Visual indicator in modal** — when URL is detected, show:
   - 🔗 icon + "Bookmark detected" badge near title input
   - Title input placeholder changes to "Link title (optional)..."
   - Header icon changes from FileText to Link/Globe

### 4.2 `App.tsx` — MODIFY (note creation handler)

**File:** `frontend/src/App.tsx`

Update the `handleCreateNote` function to accept and pass `bookmark_url`:
```ts
const handleCreateNote = async (title: string, content: string, folderId: number, bookmarkUrl?: string) => {
  await notesAPI.create({ folder_id: folderId, title, content, bookmark_url: bookmarkUrl });
  // ... rest unchanged
};
```

### 4.3 `HomePage.tsx` — MODIFY (bookmark card display)

**File:** `frontend/src/pages/HomePage.tsx`

Modify the recent notes card rendering:
- If `note.bookmark_url` exists:
  - Show a **globe/link icon** instead of FileText icon
  - Show **favicon** via `https://www.google.com/s2/favicons?domain={hostname}&sz=32`
  - Title = clickable link (opens in new tab)
  - Preview = truncated URL instead of content
  - Visual accent: left border or subtle background tint (e.g., `border-l-4 border-l-emerald-500`)
- If `note.bookmark_url` is null: render as current (existing behavior)

### 4.4 `FolderPage.tsx` — MODIFY (bookmark card display)

**File:** `frontend/src/pages/FolderPage.tsx`

Same bookmark display logic as HomePage cards:
- Link icon, favicon, clickable title
- Click opens URL in new tab (not note editor)
- Visual distinction from regular notes

### 4.5 `RecentNotes.tsx` — MODIFY (sidebar)

**File:** `frontend/src/components/RecentNotes.tsx`

- Show link icon instead of FileText for bookmarks in sidebar
- Click opens URL in new tab

### 4.6 `NoteEditor.tsx` — MODIFY (optional)

**File:** `frontend/src/components/NoteEditor.tsx`

When opening a bookmark note, either:
- **Option A:** Redirect to open the URL in a new tab instead of showing editor
- **Option B:** Show a read-only view with favicon, URL, and "Open Link" button
- **Recommended:** Option B — gives user the option to edit bookmark title or folder without leaving the app

### 4.7 `useNotes.ts` / hooks — NO CHANGES

The hook fetches notes as-is. The `bookmark_url` field comes through automatically from the API.

---

## 5. Task Breakdown

### Phase 1: Foundation (Backend)

| # | Task | Agent | Estimate | Dependencies |
|---|------|-------|----------|--------------|
| 1.1 | Create migration `0004_add_bookmarks.sql` | backend-dev | S | None |
| 1.2 | Update `Note`, `NoteWithFolder` types (add `bookmark_url`) | backend-dev | S | None |
| 1.3 | Update `CreateNoteSchema` — add `bookmark_url` field | backend-dev | S | None |
| 1.4 | Update `UpdateNoteSchema` — add `bookmark_url` to whitelist + schema | backend-dev | S | None |
| 1.5 | Update `POST /notes` — insert bookmark_url | backend-dev | S | 1.1, 1.3 |
| 1.6 | Update `PATCH /notes/:id` — allow bookmark_url updates | backend-dev | S | 1.4 |
| 1.7 | Run migration, verify API with curl/Postman | tester | S | 1.1-1.6 |

### Phase 2: Frontend — Creation Flow

| # | Task | Agent | Estimate | Dependencies |
|---|------|-------|----------|--------------|
| 2.1 | Update frontend `Note` types (add `bookmark_url`) | frontend-dev | S | None |
| 2.2 | Add `isURL()` utility function to `lib/utils.ts` | frontend-dev | S | None |
| 2.3 | Update `CreateNoteModal` — URL detection + disable content + bookmark UX | frontend-dev | M | 2.1, 2.2 |
| 2.4 | Update `App.tsx` — pass `bookmark_url` through create handler | frontend-dev | S | 2.1 |
| 2.5 | Update `HomePage.tsx` + `FolderPage.tsx` — bookmark card rendering | frontend-dev | M | 2.1 |
| 2.6 | Update `RecentNotes.tsx` — bookmark icon in sidebar | frontend-dev | S | 2.1 |
| 2.7 | Update `NoteEditor.tsx` — bookmark read-only view | frontend-dev | M | 2.1 |

### Phase 3: Integration & Testing

| # | Task | Agent | Estimate | Dependencies |
|---|------|-------|----------|--------------|
| 3.1 | E2E test: create bookmark via URL title | tester | S | 2.3, 1.5 |
| 3.2 | E2E test: bookmark card display + click opens link | tester | S | 2.5 |
| 3.3 | E2E test: existing notes unaffected (regression) | tester | S | All |
| 3.4 | E2E test: bookmark in folder page + search | tester | S | 2.5 |
| 3.5 | Manual QA: mobile responsiveness of bookmark cards | tester | S | 2.5 |
| 3.6 | Manual QA: bookmark with folder/pin interactions | tester | S | All |

### Task Dependency Graph

```
Phase 1 (Backend):  1.1 → 1.5 → 1.7
                    1.2    1.3 ↗
                    1.4 → 1.6 ↗

Phase 2 (Frontend): 2.1 → 2.3 → 2.5 → 2.7
                    2.2 ↗       ↘
                    2.4 (needs App.tsx changes, depends on 2.1)
                    2.6 (standalone, depends on 2.1)

Phase 3 (Testing):  All of Phase 1 + Phase 2 complete
```

### Agent Assignments

- **solutions-architect**: Review plan, validate URL detection approach, approve favicon proxy strategy
- **backend-dev**: Phase 1 tasks (migration, types, routes, validators)
- **frontend-dev**: Phase 2 tasks (components, types, utilities, display)
- **tester**: Phase 3 tasks (E2E tests, regression, manual QA)

---

## 6. Open Questions / Decisions

| Question | Recommendation |
|----------|---------------|
| Favicon source? | Use Google's favicon service (`google.com/s2/favicons`) — lightweight, no API key, works for most sites. Alternative: self-host via Cloudflare Worker that proxies favicons. |
| Allow editing bookmark URL after creation? | Yes — `PATCH` endpoint supports updating `bookmark_url`. User can convert bookmark → note by setting `bookmark_url: null`. |
| Should `#folder` syntax work with URLs? | Yes — existing behavior: user types `https://example.com #work` → URL detected, folder set to "work" |
| Max URL length? | 2048 chars (standard browser URL limit). Already covered by `title` max of 500, so may need to increase or store URL separately from title. |
| Title field: store URL as title or allow custom title? | Allow both. If user pastes just a URL → title = URL. If they type after the URL → use that as title. `bookmark_url` always stores the raw URL. |
| Search: should bookmarks appear in FTS results? | Yes — URL is in `title` field which FTS indexes. No changes needed. |

---

## 7. Estimated Timeline

- **Phase 1 (Backend):** ~2 hours
- **Phase 2 (Frontend):** ~4 hours  
- **Phase 3 (Testing):** ~2 hours
- **Total:** ~8 hours / 1 day of focused work

---

## 8. Rollback Plan

If issues arise:
1. The `bookmark_url` column defaults to NULL — existing notes are unaffected even without rollback
2. Frontend gracefully handles missing `bookmark_url` (treats as regular note)
3. Worst case: run `ALTER TABLE` is irreversible on D1 but NULL default means no data impact
4. Can disable frontend bookmark detection with a feature flag if needed
