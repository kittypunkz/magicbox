# Pin Notes Feature - Technical Specification

## Overview
Add functionality to pin notes to the top of folder views. Pinned notes appear first in lists, sorted by pinned status then by updated_at.

---

## 1. Database Schema Changes

### 1.1 Migration File
**File**: `backend/migrations/0003_add_note_pinning.sql`

```sql
-- Add is_pinned column to notes table
ALTER TABLE notes ADD COLUMN is_pinned INTEGER DEFAULT 0;

-- Create index for efficient pinned note queries
CREATE INDEX idx_notes_pinned ON notes(is_pinned);

-- Create composite index for folder queries with pin sorting
CREATE INDEX idx_notes_folder_pinned_updated ON notes(folder_id, is_pinned DESC, updated_at DESC);
```

### 1.2 Updated Schema
**File**: `database/schema.sql` (update the notes table section)

```sql
-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_pinned INTEGER DEFAULT 0,  -- NEW: Pin status (0=false, 1=true)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Index for pin queries
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_folder_pinned_updated ON notes(folder_id, is_pinned DESC, updated_at DESC);
```

---

## 2. API Endpoint Design

### 2.1 Backend Types Update
**File**: `backend/src/types/index.ts`

```typescript
// Update Note interface
export interface Note {
  id: number;
  folder_id: number;
  title: string;
  content: string;
  is_pinned: number;  // 0 or 1 (SQLite boolean)
  created_at: string;
  updated_at: string;
}

// NoteWithFolder inherits is_pinned from Note

// UpdateNoteRequest now includes is_pinned
export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folder_id?: number;
  is_pinned?: boolean;  // NEW
}
```

### 2.2 Validation Schema Update
**File**: `backend/src/validators/schemas.ts`

```typescript
export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(500).transform(s => s.trim()).optional(),
  content: z.string().max(100000).optional(),
  folder_id: z.number().int().positive().optional(),
  is_pinned: z.boolean().optional(),  // NEW
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});
```

### 2.3 Notes Route Updates
**File**: `backend/src/routes/notes.ts`

```typescript
// Update UPDATEABLE_COLUMNS to include is_pinned
const UPDATEABLE_COLUMNS = ['title', 'content', 'folder_id', 'is_pinned'] as const;

// Update GET / query to sort by is_pinned DESC, then updated_at DESC
const dataQuery = `
  SELECT n.*, f.name as folder_name 
  FROM notes n 
  JOIN folders f ON n.folder_id = f.id
  ${whereClause}
  ORDER BY n.is_pinned DESC, n.updated_at DESC
  LIMIT ?${bindings.length + 1} OFFSET ?${bindings.length + 2}
`;

// PATCH endpoint automatically handles is_pinned via whitelist
```

### 2.4 Folders Route Updates
**File**: `backend/src/routes/folders.ts`

```typescript
// Update GET /:id notes query to sort by is_pinned
const { results: notes } = await db.prepare(`
  SELECT id, title, is_pinned, created_at, updated_at 
  FROM notes 
  WHERE folder_id = ?1 
  ORDER BY is_pinned DESC, updated_at DESC
`).bind(id).all();
```

### 2.5 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notes` | List notes (sorted by is_pinned DESC, updated_at DESC) |
| GET | `/notes/:id` | Get single note (includes is_pinned) |
| POST | `/notes` | Create note (is_pinned defaults to false) |
| PATCH | `/notes/:id` | Update note (can toggle is_pinned) |
| DELETE | `/notes/:id` | Delete note |
| GET | `/folders/:id` | Get folder with notes (sorted by pin status) |

---

## 3. Frontend Component Changes

### 3.1 Type Definitions Update
**File**: `frontend/src/types/index.ts`

```typescript
// Update Note interface
export interface Note {
  id: number;
  folder_id: number;
  title: string;
  content: string;
  is_pinned: number;  // 0 or 1
  created_at: string;
  updated_at: string;
  folder_name?: string;
}

// NoteSummary for list views
export interface NoteSummary {
  id: number;
  title: string;
  is_pinned: number;  // NEW
  created_at: string;
  updated_at: string;
}

// UpdateNoteRequest
export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folder_id?: number;
  is_pinned?: boolean;  // NEW
}
```

### 3.2 NoteEditor Component Update
**File**: `frontend/src/components/NoteEditor.tsx`

```typescript
import { Pin, PinOff } from 'lucide-react';  // Add imports

// Add to state
const [isPinned, setIsPinned] = useState(false);

// Load isPinned from note
useEffect(() => {
  if (note) {
    setTitle(note.title);
    setContent(note.content || '');
    setFolderId(note.folder_id);
    setIsPinned(note.is_pinned === 1);  // NEW
    addRecentNote(note);
  }
}, [note, addRecentNote]);

// Include isPinned in save
const save = useCallback(async () => {
  if (!note) return;
  
  const updates: { title?: string; content?: string; folder_id?: number; is_pinned?: boolean } = {};
  if (title !== note.title) updates.title = title;
  if (content !== note.content) updates.content = content;
  if (folderId !== note.folder_id) updates.folder_id = folderId;
  if (isPinned !== (note.is_pinned === 1)) updates.is_pinned = isPinned;  // NEW
  
  if (Object.keys(updates).length === 0) return;
  
  setSaving(true);
  const updated = await updateNote(updates);
  setSaving(false);
  setLastSaved(new Date());
  if (updated) {
    onUpdate?.(updated);
  }
}, [note, title, content, folderId, isPinned, updateNote, onUpdate]);  // Add isPinned to deps

// Add pin toggle button in header (next to folder selector or in note menu)
// In the header div, add:
<button
  data-area-id="noteeditor-pin-btn"
  onClick={() => setIsPinned(!isPinned)}
  className={`p-2 rounded-lg transition-colors ${
    isPinned ? 'text-blue-400 bg-blue-400/10' : c.gray
  } ${c.hover}`}
  title={isPinned ? 'Unpin note' : 'Pin note'}
>
  {isPinned ? <Pin size={18} className="fill-current" /> : <PinOff size={18} />}
</button>
```

### 3.3 FolderPage Component Update
**File**: `frontend/src/components/FolderPage.tsx`

```typescript
import { Pin } from 'lucide-react';  // Add import

// In note card rendering, add pin indicator
// Inside the note card div, before or alongside the title:
{note.is_pinned === 1 && (
  <div className="absolute top-3 left-3">
    <Pin size={14} className="text-blue-400 fill-current" />
  </div>
)}

// Update title styling to account for pin icon when pinned
<h3 
  data-area-id={`folderpage-note-title-${note.id}`}
  className={`folderpage-note-title font-semibold ${c.text} truncate mb-2 ${
    isBulkDeleteMode ? 'pl-7 sm:pl-8' : note.is_pinned === 1 ? 'pl-6 pr-8' : 'pr-8'
  }`}
>
  {note.title}
</h3>
```

### 3.4 useNote Hook Update
**File**: `frontend/src/hooks/useNotes.ts`

The `updateNote` function already accepts `UpdateNoteRequest` which will include `is_pinned`. No changes needed if types are updated.

---

## 4. File Structure

```
magicbox/
├── backend/
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   ├── 0002_add_auth.sql
│   │   └── 0003_add_note_pinning.sql      # NEW
│   ├── src/
│   │   ├── routes/
│   │   │   ├── notes.ts                   # UPDATE sorting & columns
│   │   │   └── folders.ts                 # UPDATE sorting
│   │   ├── types/
│   │   │   └── index.ts                   # UPDATE Note interface
│   │   └── validators/
│   │       └── schemas.ts                 # UPDATE UpdateNoteSchema
├── database/
│   └── schema.sql                         # UPDATE notes table
├── frontend/
│   └── src/
│       ├── types/
│       │   └── index.ts                   # UPDATE Note, NoteSummary
│       ├── components/
│       │   ├── NoteEditor.tsx             # UPDATE add pin toggle
│       │   └── FolderPage.tsx             # UPDATE show pin icon
│       └── hooks/
│           └── useNotes.ts                # No changes (type-driven)
```

---

## 5. Implementation Checklist

### Backend
- [ ] Create migration `0003_add_note_pinning.sql`
- [ ] Update `backend/src/types/index.ts` - add `is_pinned` to Note and UpdateNoteRequest
- [ ] Update `backend/src/validators/schemas.ts` - add `is_pinned` to UpdateNoteSchema
- [ ] Update `backend/src/routes/notes.ts` - add `is_pinned` to UPDATEABLE_COLUMNS, update ORDER BY
- [ ] Update `backend/src/routes/folders.ts` - update ORDER BY in notes query
- [ ] Update `database/schema.sql` - add is_pinned column and indexes

### Frontend
- [ ] Update `frontend/src/types/index.ts` - add `is_pinned` to Note, NoteSummary, UpdateNoteRequest
- [ ] Update `frontend/src/components/NoteEditor.tsx` - add pin toggle UI and state
- [ ] Update `frontend/src/components/FolderPage.tsx` - add pin icon indicator on cards

### Testing
- [ ] Test migration on existing data
- [ ] Test pin/unpin functionality
- [ ] Test sorting in folder view
- [ ] Test sorting in notes list API
- [ ] Verify pin state persists after page reload

---

## 6. SQL Query Reference

### Get Notes by Folder (with pin sorting)
```sql
SELECT id, title, is_pinned, created_at, updated_at 
FROM notes 
WHERE folder_id = ? 
ORDER BY is_pinned DESC, updated_at DESC
```

### Get All Notes (with pin sorting)
```sql
SELECT n.*, f.name as folder_name 
FROM notes n 
JOIN folders f ON n.folder_id = f.id
ORDER BY n.is_pinned DESC, n.updated_at DESC
LIMIT ? OFFSET ?
```

### Toggle Pin Status
```sql
UPDATE notes 
SET is_pinned = ?1, updated_at = datetime('now') 
WHERE id = ?2 
RETURNING *
```

---

## 7. UI/UX Specifications

### Pin Toggle Button (NoteEditor)
- **Location**: Top bar, next to folder selector or in note menu dropdown
- **Icon**: Pin (filled when pinned, outline when unpinned)
- **Color**: Blue when pinned, gray when unpinned
- **Tooltip**: "Pin note" / "Unpin note"

### Pin Indicator (FolderPage)
- **Location**: Top-left corner of note card
- **Icon**: Filled Pin icon
- **Color**: Blue (#3b82f6)
- **Size**: 14px

### Sorting Behavior
- Pinned notes always appear at top
- Within pinned notes: sorted by updated_at DESC (most recently updated first)
- Within unpinned notes: sorted by updated_at DESC
