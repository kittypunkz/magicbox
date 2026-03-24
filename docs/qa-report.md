# MagicBox Bookmark Feature — QA Report

**Date:** 2026-03-24  
**Reviewer:** QA Agent  
**Spec:** `/magicbox/docs/bookmark-spec.md`

---

## Checklist Results

### 1. Migration SQL ✅
```sql
ALTER TABLE notes ADD COLUMN bookmark_url TEXT DEFAULT NULL;
CREATE INDEX idx_notes_bookmark ON notes(bookmark_url) WHERE bookmark_url IS NOT NULL;
```
- Column is nullable (NULL = regular note). Correct.
- Partial index only indexes non-null rows. Efficient.
- No issues.

### 2. TypeScript Types Consistency ✅
- **Backend `Note`:** `bookmark_url: string | null` — correct.
- **Frontend `Note`:** `bookmark_url: string | null` — matches.
- **Backend/Frontend `CreateNoteRequest`:** `bookmark_url?: string` — consistent.
- **Backend/Frontend `UpdateNoteRequest`:** `bookmark_url?: string | null` — consistent (allows null to convert bookmark → note).
- **Minor:** Frontend `NoteSummary.bookmark_url` is `string | null | undefined` while `Note.bookmark_url` is `string | null`. Functionally fine but slightly inconsistent.

### 3. URL Detection (http/https only) ✅
`frontend/src/utils/isURL.ts` — Uses `new URL()` constructor with explicit protocol check. Rejects `ftp:`, `javascript:`, `data:`, etc. Correct.

### 4. Content Cleared When Saving Bookmark ✅
- **Backend POST /notes:** `data.bookmark_url ? '' : (data.content || '')` — content forced to `''` when bookmark.
- **Frontend `CreateNoteModal.tsx`:** `onCreateNote(cleanTitle, bookmarkUrl ? '' : cleanContent, folderName, bookmarkUrl)` — matches.

### 5. Bookmark → Note Conversion (PATCH with null) ✅
- `UpdateNoteSchema`: `bookmark_url: z.string().url().max(2048).nullish()` — accepts `null`.
- `UPDATEABLE_COLUMNS` includes `bookmark_url`.
- PATCH handler passes `null` value to DB correctly.

### 6. Bookmark Card Edge Cases ✅
All three rendering locations (HomePage, FolderPage, NoteEditor) use:
- IIFE with `try/catch` around `new URL()` for hostname extraction.
- `onError` handler to hide favicon `<img>` on failure.
- `rel="noopener noreferrer"` on all `<a>` links.
- Fallback to raw `bookmark_url` string if URL parsing fails.

### 7. NoteEditor Bookmark View ✅
- Shows favicon, hostname, "Open Link" button.
- Title and folder still editable.
- Auto-save still works for non-bookmark fields.
- Help text: "This is a bookmark. You can edit the title and folder above."

### 8. Security ✅
- **XSS:** React auto-escapes `href`, `src`, and text content. No `dangerouslySetInnerHTML` used.
- **Protocol injection:** `isURL()` rejects non-http(s) protocols.
- **`target="_blank"` hardening:** All links use `rel="noopener noreferrer"`.
- **URL length:** Zod `.max(2048)` on both create and update schemas.
- **SQL injection:** Column whitelist approach in PATCH is safe.

### 9. `any` Types / Type Errors ✅ (with minor notes)
- No `any` types found in bookmark-related code.
- Unused imports in `FolderPage.tsx`: `LinkIcon`, `Globe` from lucide-react (imported but never used). Lint warning, not functional issue.

---

## 🐛 Bugs Found

### BUG-1: Bookmarks broken from FolderPage (REJECTABLE)

**Severity:** High — Functional regression  
**Location:** `FolderPage.tsx` → `handleCreateNote`

**Problem:** `FolderPage` defines its own `onCreateNote` callback signature as:
```typescript
onCreateNote?: (title: string, content: string, folderId: number) => Promise<void> | void;
```
This is a **3-argument** function. However, `CreateNoteModal` calls it with **4 arguments**:
```typescript
onCreateNote(cleanTitle, bookmarkUrl ? '' : cleanContent, folderName, bookmarkUrl);
```

The 4th argument (`bookmarkUrl`) is silently dropped. The `handleCreateNote` in `FolderPage` never captures or forwards `bookmark_url` to the API. **Bookmarks created from a folder page will be saved as regular notes** (without `bookmark_url`), even though the modal UI shows the bookmark indicator.

**Fix:** Update `FolderPage.handleCreateNote` to accept the 4th `bookmarkUrl` parameter and pass it through to `onCreateNote` / the API call.

### BUG-2: Unused imports (Minor)

**Severity:** Low — Lint/cosmetic  
**Location:** `FolderPage.tsx` line 1  
`LinkIcon` and `Globe` are imported from lucide-react but never used.

---

## Verdict

### ❌ REJECTED

**Reason:** BUG-1 is a functional bug — bookmark creation is broken when initiated from the `FolderPage`. Users will think they're saving a bookmark (the modal shows the bookmark UI), but it gets saved as a plain note. This directly violates the spec's core behavior.

**Required fix before approval:**
1. Update `FolderPage.handleCreateNote` to accept and forward `bookmarkUrl`.
2. (Optional) Remove unused imports in `FolderPage.tsx`.

Everything else is solid — migration, types, URL detection, security, edge cases, and the HomePage/App.tsx bookmark flows all work correctly.
