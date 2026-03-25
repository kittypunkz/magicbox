# PLAN: Block-Based Editor for MagicBox

**Author:** PO  
**Date:** 2026-03-25  
**Status:** Ready for implementation  
**Scope:** Dev environment only  
**Effort:** ~2-3 days (frontend-dev agent)

---

## 1. Library Recommendation: BlockNote ✅

**Decision: BlockNote** — already installed (`@blocknote/core`, `@blocknote/mantine`, `@blocknote/react` v0.47.1). No new deps needed.

### Comparison

| Criteria | BlockNote | Tiptap | Plate |
|----------|-----------|--------|-------|
| **Already installed** | ✅ Yes | ❌ No | ❌ No |
| **Markdown I/O** | ✅ Built-in `blocksToMarkdownLossy` / `markdownToBlocks` | ⚠️ Extension needed, config-heavy | ⚠️ Plugin needed |
| **Slash commands** | ✅ Built-in, zero config | ⚠️ Custom extension | ⚠️ Custom plugin |
| **Dark mode** | ✅ Mantine theme support | 🔧 Manual | 🔧 Manual |
| **Bundle size** | Medium (~180KB) | Small (~80KB core) | Large (~250KB) |
| **Text-only restriction** | ✅ `blockSchema` — just omit image/embed blocks | 🔧 Manual filtering | 🔧 Manual filtering |
| **Learning curve** | Low | Medium | High |
| **React integration** | First-class | Framework-agnostic | First-class (but complex API) |

### Why NOT Tiptap
- Would need to add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, markdown extensions
- Slash commands require custom extension code
- More wiring for less output
- Good library, but BlockNote is already here and better suited for this exact use case

### Why NOT Plate
- Overkill — Plate is a full framework built on Slate.js
- Massive API surface, plugin system is complex
- Significantly heavier bundle
- Designed for rich editors (we want text-only)

---

## 2. Implementation Approach

### Architecture

```
┌─────────────────────────────────────────────┐
│  NoteEditor.tsx                              │
│  ┌───────────────────────────────────────┐   │
│  │  Title Input (unchanged)              │   │
│  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────┐   │
│  │  BlockNoteEditor (NEW - replaces      │   │
│  │  TextareaAutosize)                    │   │
│  │  - Block schema: paragraph, heading,  │   │
│  │    bulletList, orderedList, quote,    │   │
│  │    codeBlock, divider                 │   │
│  │  - Slash commands (built-in)          │   │
│  │  - Keyboard shortcuts (built-in)      │   │
│  │  - onChange → markdown string          │   │
│  │  - InitialContent ← markdown string   │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
         │ onChange (debounced)
         ▼
    save() → PATCH /notes/:id { content: markdownString }
```

### Key Design Decisions

1. **Markdown as the interchange format.** BlockNote stores blocks internally as JSON, but we convert to/from markdown on the boundaries:
   - On load: `markdownToBlocks(content)` → set editor content
   - On save: `blocksToMarkdownLossy(editor.document)` → save as `content`
   - This preserves backward compatibility — old notes load fine, new notes render as markdown anywhere

2. **Restrict block schema.** Pass a custom `blockSchema` that only includes: `paragraph`, `heading`, `bulletListItem`, `numberedListItem`, `checkListItem`, `quote`, `codeBlock`, `divider`. No image, table, file, etc.

3. **Mantine provider for dark theme.** BlockNote uses Mantine. We need to wrap the editor in `BlockNoteView` with a dark Mantine theme that matches the existing `#191919` / `#202020` palette.

4. **Auto-save integration.** The existing debounced save pattern stays. BlockNote's `onEditorContentChange` callback triggers the same `setContent(markdown)` → debounce → `save()` flow.

5. **Bookmark notes unchanged.** The bookmark view path (`note?.bookmark_url`) stays exactly as-is. Only the content textarea path changes.

### Block Schema

```typescript
import {
  defaultBlockSchema,
  type BlockNoteEditor,
  type PartialBlock,
} from '@blocknote/core';

// Only these blocks allowed:
const blockSchema = {
  paragraph: defaultBlockSchema.paragraph,
  heading: defaultBlockSchema.heading,
  bulletListItem: defaultBlockSchema.bulletListItem,
  numberedListItem: defaultBlockSchema.numberedListItem,
  checkListItem: defaultBlockSchema.checkListItem,
  quote: defaultBlockSchema.quote,
  codeBlock: defaultBlockSchema.codeBlock,
  divider: defaultBlockSchema.divider,
};
```

### Keyboard Shortcuts (built-in, no custom code)

| Shortcut | Action |
|----------|--------|
| `# ` + space | Heading 1 |
| `## ` + space | Heading 2 |
| `### ` + space | Heading 3 |
| `- ` or `* ` | Bullet list |
| `1. ` | Numbered list |
| `[] ` or `[ ] ` | Checkbox |
| `> ` | Quote block |
| ``` ``` ``` | Code block |
| `---` | Divider |
| `/` | Slash command menu |

### Slash Commands (built-in menu)

BlockNote's built-in slash command menu shows on `/` typing. It includes all block types with icons. We can customize the displayed items to match our restricted schema. No custom code needed — just configure which items appear.

---

## 3. Task Breakdown

### Task 1: Create BlockNoteEditor component
**File:** `frontend/src/components/BlockNoteEditor.tsx` (new file)

- Create a wrapper component around `BlockNoteView`
- Props: `initialContent: string` (markdown), `onChange: (markdown: string) => void`, `placeholder?: string`
- Use `useCreateBlockNote` hook with restricted `blockSchema`
- On mount: parse `initialContent` with `markdownToBlocks`
- On change: serialize with `blocksToMarkdownLossy`, call `onChange`
- Configure dark Mantine theme to match existing palette
- Disable default image/file/table block types

### Task 2: Replace textarea in NoteEditor
**File:** `frontend/src/components/NoteEditor.tsx`

- Import `BlockNoteEditor` component
- Replace `<TextareaAutosize>` with `<BlockNoteEditor>` in the non-bookmark path
- Wire `initialContent={content}` and `onChange={setContent}`
- Keep existing auto-save logic unchanged
- Keep title input, header, folder selector, etc. unchanged

### Task 3: Style BlockNote to match Obsidian dark theme
**File:** `frontend/src/components/BlockNoteEditor.tsx` (same as Task 1)

- Override Mantine theme colors to match `#191919`, `#202020`, `#2a2a2a`, `#2f2f2f`
- Set text color to `#e6e6e6`, placeholder to `#4b5563`
- Style the slash command menu to match sidebar styling
- Style code blocks with proper syntax background
- Ensure divider renders as subtle `#2f2f2f` line
- Test focus ring matches existing `#3b82f6` blue

### Task 4: Handle edge cases
**File:** `frontend/src/components/BlockNoteEditor.tsx`

- Empty content → show placeholder "Start writing..."
- Very long content → ensure scroll works (editor should handle this)
- Rapid typing → debounce the markdown serialization (not the save — that's already debounced)
- Paste markdown → should parse correctly into blocks
- Undo/redo → BlockNote handles this internally

### Task 5: Update E2E tests
**File:** `frontend/e2e/note-editor.spec.ts`

- Update `test('should display note editor')` — no more `textarea`, check for BlockNote's contenteditable
- Update `test('should edit note content')` — use BlockNote's contenteditable instead of textarea fill
- Update `test('should show saving indicator')` — same logic, different trigger
- Update `test('should use checkboxes')` — test BlockNote's checkbox block
- Add new test: `test('should convert markdown shortcuts to blocks')` — type `# Heading`, verify it becomes an H1
- Add new test: `test('should open slash command menu')` — type `/`, verify menu appears

### Task 6: Dev deployment
- Run `npm run build` in frontend to verify no TypeScript errors
- Run `npm run typecheck`
- Deploy to dev environment only (not production)
- Smoke test: create new note, type content, reload, verify persistence
- Smoke test: open existing markdown note, verify it renders as blocks

---

## 4. Migration Strategy for Existing Notes

### Zero migration needed.

**Why:** The storage format stays as markdown string. Old notes were always markdown (even if users typed plain text, plain text IS valid markdown). BlockNote's `markdownToBlocks()` handles:

- Plain text → paragraph blocks
- `# Heading` → heading blocks
- `- item` → bullet list blocks
- `1. item` → numbered list blocks
- `> quote` → quote blocks
- ```code``` → code block blocks
- `---` → divider blocks
- `[ ] task` → checkbox blocks

**Edge cases:**
- Empty content → empty editor (one empty paragraph block, which is correct)
- Content with markdown syntax users didn't intend (e.g., literal `# not a heading`) → BlockNote will render it as a heading. This is actually correct behavior — if someone typed `#` at the start of a line in a markdown note, it IS a heading.
- Content with HTML → BlockNote will treat it as plain text (we're not enabling HTML blocks)

**Rollback safety:** If we need to revert, the database is untouched. We just swap the textarea back in. No data loss risk.

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| BlockNote v0.47 API may have breaking changes from docs | Medium | Pin to `^0.47.1`, test thoroughly |
| Mantine theme conflicts with existing CSS | Low | Use Mantine's `createTheme` to override, scope to editor |
| Markdown round-trip fidelity (blocks → markdown → blocks) | Medium | Test with existing notes, edge cases in Task 4 |
| Bundle size increase | Low | Acceptable for dev, optimize later if needed |
| E2E tests break | High | Update tests in same PR (Task 5) |

---

## 6. Definition of Done

- [ ] BlockNote editor replaces textarea in NoteEditor
- [ ] All 7 block types work (paragraph, heading, bullet, numbered, quote, code, divider)
- [ ] Slash command menu appears on `/` and inserts blocks
- [ ] Keyboard shortcuts work (`#`, `-`, `1.`, `>`, ``` ``` ```, `---`)
- [ ] Existing markdown notes load and render correctly
- [ ] New notes save as markdown string (backward compatible)
- [ ] Auto-save still works (debounced, 1s)
- [ ] Dark mode matches existing Obsidian-style theme
- [ ] Bookmark notes are unaffected
- [ ] E2E tests updated and passing
- [ ] TypeScript compiles with no errors
- [ ] Deployed to dev only
