# Backend Changes Summary — Bookmark Feature

## Files Modified

### 1. `backend/migrations/0004_add_bookmarks.sql` (NEW)
- Adds `bookmark_url TEXT DEFAULT NULL` column to `notes` table
- Creates partial index `idx_notes_bookmark` on bookmark_url for non-null values

### 2. `backend/src/types/index.ts`
- Added `bookmark_url: string | null` to `Note` interface
- `NoteWithFolder` inherits it via `extends Note` — no change needed
- Added `bookmark_url?: string` to `CreateNoteRequest`
- Added `bookmark_url?: string | null` to `UpdateNoteRequest`

### 3. `backend/src/validators/schemas.ts`
- Added `bookmark_url: z.string().url().max(2048).optional()` to `CreateNoteSchema`
- Added `bookmark_url: z.string().url().max(2048).nullish()` to `UpdateNoteSchema` (`.nullish()` allows undefined or null)

### 4. `backend/src/routes/notes.ts`
- Added `'bookmark_url'` to `UPDATEABLE_COLUMNS` whitelist
- Updated INSERT to include `bookmark_url` column; sets `content = ''` when bookmark_url is provided
- Updated PATCH `values` array type from `(string | number)[]` to `(string | number | null)[]` to handle null bookmark_url (bookmark → note conversion)

## How to Test with curl

### 1. Run the migration
```bash
npx wrangler d1 migrations apply magicbox-db
```

### 2. Create a bookmark note
```bash
curl -X POST http://localhost:8787/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "folder_id": 1,
    "title": "https://github.com/kittypunkz/magicbox",
    "content": "",
    "bookmark_url": "https://github.com/kittypunkz/magicbox"
  }'
```

### 3. Create a regular note (unchanged)
```bash
curl -X POST http://localhost:8787/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "folder_id": 1,
    "title": "My regular note",
    "content": "Some content here"
  }'
```

### 4. Convert bookmark → regular note
```bash
curl -X PATCH http://localhost:8787/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "bookmark_url": null
  }'
```

### 5. Invalid bookmark_url (should return 400)
```bash
curl -X POST http://localhost:8787/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "folder_id": 1,
    "title": "Bad URL",
    "bookmark_url": "not-a-url"
  }'
```

### 6. List notes (GET — returns bookmark_url in response automatically)
```bash
curl http://localhost:8787/api/notes
```
