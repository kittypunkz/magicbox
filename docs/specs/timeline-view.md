# Feature Spec: Timeline View in Folders

**Date:** 2026-03-26
**Status:** Ready for implementation

## 1. Problem Statement
The folder view shows notes in a grid, but users want a chronological feed view (like Facebook) where they can scroll through notes as a timeline.

## 2. Solution Overview
Add a toggle to switch between **Grid View** (existing) and **Timeline View** (new vertical feed). Timeline shows each note as a full card with title, content, date, folder name, and pin indicator. Sorted by created date (newest first).

## 3. Requirements

### v1 (Must Have)
- [ ] Toggle button in folder header (Grid ↔ Timeline)
- [ ] Timeline view with vertical card layout
- [ ] Each card shows: title, full content, created date, folder name, pin indicator
- [ ] Sort by created_at DESC
- [ ] Mobile responsive
- [ ] Keep existing grid view as default

### v2 (Nice to Have)
- [ ] Date separators (Today, Yesterday, Last Week)
- [ ] Remember user's view preference per folder
- [ ] Bookmark cards in timeline view

### Out of Scope
- Drag to reorder timeline
- Inline editing in timeline view

## 4. Technical Design

### Files to Modify
- `frontend/src/pages/FolderPage.tsx` — add view toggle + timeline rendering

### Toggle UI
- Button group in folder header: [Grid] [Timeline]
- Icons: Grid3X3 and List from lucide-react
- State: `viewMode: 'grid' | 'timeline'`

### Timeline Card Design
```
┌─────────────────────────────────────┐
│ 📌 Title                    Mar 26  │
│ Folder: Inbox                       │
│                                     │
│ Content preview...                  │
│ Full content of the note,           │
│ showing multiple lines.             │
│                                     │
└─────────────────────────────────────┘
```

### Sort
- Timeline: `sort((a, b) => new Date(b.created_at) - new Date(a.created_at))`
- Grid: existing order (from API: pinned first, then updated_at)

## 5. Acceptance Criteria
- [ ] Toggle switches between grid and timeline
- [ ] Timeline shows notes sorted by created date
- [ ] Each card shows title, content, date, folder, pin
- [ ] Works on mobile
- [ ] E2E tests pass
- [ ] Deployed to dev first
