# Bookmark Links — Technical Specification

## Overview
Add bookmark support to MagicBox. When a user pastes a URL as the title, the system saves it as a bookmark with distinct visual treatment.

## 1. Database Migration

**File:** `backend/migrations/0004_add_bookmarks.sql`

```sql
-- Add bookmark_url column (NULL = regular note, non-NULL = bookmark)
ALTER TABLE notes ADD COLUMN bookmark_url TEXT DEFAULT NULL;

-- Partial index for bookmark filtering
CREATE INDEX idx_notes_bookmark ON notes(bookmark_url) WHERE bookmark_url IS NOT NULL;
```

## 2. Type Changes

### Backend: `backend/src/types/index.ts`

Add to `Note` and `NoteWithFolder` interfaces:
```typescript
bookmark_url: string | null;
```

### Frontend: `frontend/src/types/index.ts`

Add to `Note`:
```typescript
bookmark_url: string | null;
```

Add to `CreateNoteRequest`:
```typescript
bookmark_url?: string;
```

Add to `UpdateNoteRequest`:
```typescript
bookmark_url?: string | null;
```

## 3. Backend API Changes

### `backend/src/validators/schemas.ts`

```typescript
// Add to CreateNoteSchema
bookmark_url: z.string().url().max(2048).optional(),

// Add to UpdateNoteSchema
bookmark_url: z.string().url().max(2048).nullish(),
```

### `backend/src/routes/notes.ts`

**POST /notes changes:**
- Accept `bookmark_url` in request body
- If `bookmark_url` provided, set `content = ''`
- Insert with bookmark_url column

```typescript
const stmt = env.DB.prepare(
  'INSERT INTO notes (folder_id, title, content, bookmark_url) VALUES (?, ?, ?, ?)'
).bind(body.folder_id, body.title, body.content || '', body.bookmark_url || null);
```

**PATCH /notes/:id changes:**
- Add `bookmark_url` to `UPDATEABLE_COLUMNS`
- Allow null (converts bookmark → note)

**GET endpoints: No changes needed** — `SELECT *` returns bookmark_url automatically.

## 4. Frontend Changes

### 4.1 URL Detection Utility

**File:** `frontend/src/utils/isURL.ts` (new)

```typescript
export function isURL(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### 4.2 `CreateNoteModal.tsx` (modify)

- Import `isURL`
- Compute `isBookmark = isURL(title)` reactively
- Hide content editor when `isBookmark` is true
- Show bookmark indicator badge (🔗 icon)
- Update `onCreateNote` callback to accept `bookmarkUrl` param
- Pass `bookmark_url` in API call when detected

### 4.3 `App.tsx` (modify)

Update `handleCreateNote` to accept and forward `bookmark_url`:
```typescript
const handleCreateNote = async (
  title: string, content: string, folderId: number, bookmarkUrl?: string
) => {
  await notesAPI.create({
    folder_id: folderId,
    title,
    content: content || '',
    bookmark_url: bookmarkUrl
  });
  // ... rest unchanged
};
```

### 4.4 `HomePage.tsx` + `FolderPage.tsx` (modify)

Bookmark card rendering:
```typescript
{note.bookmark_url ? (
  <div className="bookmark-card border-l-4 border-l-emerald-500">
    <img src={`https://www.google.com/s2/favicons?domain=${new URL(note.bookmark_url).hostname}&sz=32`} />
    <a href={note.bookmark_url} target="_blank" rel="noopener noreferrer">
      {note.title}
    </a>
    <span className="text-xs text-gray-400">{new URL(note.bookmark_url).hostname}</span>
  </div>
) : (
  // existing note card
)}
```

### 4.5 `RecentNotes.tsx` (modify)

Show 🔗 icon instead of FileText for bookmarks in sidebar.

### 4.6 `NoteEditor.tsx` (modify)

When editing a bookmark note, show:
- Read-only content area with favicon + URL
- "Open Link" button (opens in new tab)
- Still allow editing title and folder

## 5. Request/Response Examples

### Create Bookmark
```bash
POST /api/notes
{
  "folder_id": 1,
  "title": "https://github.com/kittypunkz/magicbox",
  "content": "",
  "bookmark_url": "https://github.com/kittypunkz/magicbox"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": 42,
    "folder_id": 1,
    "title": "https://github.com/kittypunkz/magicbox",
    "content": "",
    "bookmark_url": "https://github.com/kittypunkz/magicbox",
    "is_pinned": 0,
    "created_at": "2026-03-24T15:30:00Z",
    "updated_at": "2026-03-24T15:30:00Z"
  }
}
```

## 6. Edge Cases

| Case | Handling |
|------|----------|
| URL with fragment (`#section`) | Treat as URL, store full URL |
| URL with query params | Treat as URL, store full URL |
| `ftp://` or other protocols | Reject — only `http:` and `https:` |
| URL > 2048 chars | Reject via Zod `.max(2048)` |
| URL as title + custom content | Ignore content, set to `''` |
| Convert bookmark → note | PATCH with `bookmark_url: null` |
| Existing notes | Unaffected — `bookmark_url` defaults to NULL |
