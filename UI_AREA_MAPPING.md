# MagicBox UI Area Mapping

This document maps all UI areas in the MagicBox application for easy reference and inspection.

## Quick Reference

| Area ID | Component | Location | Description |
|---------|-----------|----------|-------------|
| `app-root` | App.tsx | Root | Main application container |
| `sidebar` | Sidebar | Left side | Navigation sidebar |
| `main-content` | App.tsx | Center/Right | Main content area |
| `top-bar` | App.tsx | Top | Header with search |
| `homepage` | HomePage | Main content | Home/dashboard view |
| `folderpage` | FolderPage | Main content | Folder notes view |
| `noteeditor` | NoteEditor | Main content | Note editing view |

---

## UI Visual Reference

### Full Application Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  app-root                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  top-bar                                                            │   │
│  │  ┌──────────────┐  ┌───────────────────────────────────────────┐   │   │
│  │  │ View Title   │  │  searchbar                                │   │   │
│  │  │ "Home"       │  │  [🔍 Search notes and folders...      ✕] │   │   │
│  │  └──────────────┘  └───────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────┬──────────────────────────────────────────────────────────┐   │
│  │          │                                                          │   │
│  │ sidebar  │                    main-content                         │   │
│  │          │                                                          │   │
│  │ ┌──────┐ │  ┌────────────────────────────────────────────────────┐  │   │
│  │ │ 📥   │ │  │                                                    │  │   │
│  │ │All   │ │  │              homepage / folderpage                 │  │   │
│  │ │Notes │ │  │                   / noteeditor                     │  │   │
│  │ └──────┘ │  │                                                    │  │   │
│  │          │  │                                                    │  │   │
│  │ FOLDERS  │  │                                                    │  │   │
│  │ ┌──────┐ │  └────────────────────────────────────────────────────┘  │   │
│  │ │ 📁 W │ │                                                          │   │
│  │ │ 📁 P │ │                                                          │   │
│  │ │ 📁 I │ │                                                          │   │
│  │ └──────┘ │                                                          │   │
│  │          │                                                          │   │
│  │ ┌──────┐ │                                                          │   │
│  │ │Recent│ │                                                          │   │
│  │ └──────┘ │                                                          │   │
│  │          │                                                          │   │
│  │ MagicBox │                                                          │   │
│  │ v1.1.0   │                                                          │   │
│  └──────────┴──────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Home Page (`homepage`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  homepage                                                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  homepage-hero                                              │   │
│  │                                                             │   │
│  │              ┌─────────────┐                                │   │
│  │              │    ✨       │                                │   │
│  │              └─────────────┘                                │   │
│  │           Welcome to MagicBox                               │   │
│  │         Capture your thoughts...                            │   │
│  │                                                             │   │
│  │    ┌───────────────────────────────────────────────────┐   │   │
│  │    │ 📝  Type a note... Use #folder to organize    ⮐  │   │   │
│  │    └───────────────────────────────────────────────────┘   │   │
│  │                  central-input                             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  homepage-recent-section                                    │   │
│  │                                                             │   │
│  │  Recent Notes                                               │   │
│  │  ┌─────────────┐ ┌─────────────┐                           │   │
│  │  │ 🗑️         │ │ 🗑️         │                           │   │
│  │  │ Meeting     │ │ Project     │                           │   │
│  │  │ Notes       │ │ Plan        │                           │   │
│  │  │ Jan 15      │ │ Jan 10      │                           │   │
│  │  └─────────────┘ └─────────────┘                           │   │
│  │                                                             │   │
│  │  homepage-recent-1  homepage-recent-2                       │   │
│  │  (hover to see 🗑️ delete button)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  homepage-stats                                             │   │
│  │                                                             │   │
│  │    ┌────────┐   ┌────────┐   ┌────────┐                    │   │
│  │    │   42   │   │    5   │   │    3   │                    │   │
│  │    │ Notes  │   │ Folders│   │ Unused │ ← clickable!       │   │
│  │    └────────┘   └────────┘   └────────┘                    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Folder Page (`folderpage`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  folderpage                                                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  folderpage-header                                          │   │
│  │                                                             │   │
│  │   ┌────┐  ┌────────────────────────────┐                   │   │
│  │   │ 📁 │  │ folderpage-name            │                   │   │
│  │   │icon│  │ "Work"                     │                   │   │
│  │   └────┘  │ folderpage-count           │                   │   │
│  │           │ 5 notes                    │                   │   │
│  │           └────────────────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  folderpage-notes-grid                                      │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │ 🗑️           │  │ 🗑️           │  │ 🗑️           │      │   │
│  │  │ Meeting      │  │ Project      │  │ Ideas        │      │   │
│  │  │ Notes        │  │ Plan         │  │ Brainstorm   │      │   │
│  │  │              │  │              │  │              │      │   │
│  │  │ Jan 15, 2026 │  │ Jan 10, 2026 │  │ Jan 5, 2026  │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  │                                                             │   │
│  │  folderpage-note-1          folderpage-note-2               │   │
│  │  (hover to see 🗑️ delete button)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Note Editor (`noteeditor`) - Obsidian Style

```
┌─────────────────────────────────────────────────────────────────────┐
│  noteeditor - Clean, minimal, Obsidian-inspired                     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  noteeditor-header (minimal)                                │   │
│  │                                                             │   │
│  │  [←]  Inbox ▾                                    [ ⋮ ]      │   │
│  │   ↑           ↑                                    ↑        │   │
│  │   │           │                              note menu      │   │
│  │   │    noteeditor-folder-select                (delete)     │   │
│  │   │                                                           │   │
│  │   noteeditor-back-btn                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  noteeditor-content                                         │   │
│  │                                                             │   │
│  │  Meeting Notes with Team                    ← Big title     │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━                    noteeditor-title │   │
│  │                                                             │   │
│  │  Today we discussed Q1 goals and assigned                   │   │
│  │  action items to each team member.                          │   │
│  │                                                             │   │
│  │  - Goal 1: Increase revenue by 20%                          │   │
│  │  - Goal 2: Launch new product                               │   │
│  │  - Goal 3: Expand to new markets                            │   │
│  │                                                             │   │
│  │  Next meeting scheduled for Friday.                         │   │
│  │                                                             │   │
│  │  [Keep writing... auto-expands]                             │   │
│  │                                                             │   │
│  │              ↑ Simple textarea, no toolbar                  │   │
│  │    noteeditor-textarea (react-textarea-autosize)            │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  No toolbar, no preview toggle, no distractions.                    │
│  Just write. Auto-saves in background.                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Sidebar Detail (`sidebar`)

```
┌──────────────────────┐
│  sidebar             │
│                      │
│  ┌──────────────────┐│
│  │ 📥 All Notes     ││
│  └──────────────────┘│
│   sidebar-all-notes  │
│                      │
│  ┌────────┬─────────┐│
│  │FOLDERS │    [+]  ││  ← sidebar-new-folder-btn
│  └────────┴─────────┘│
│   sidebar-folders-   │
│   header             │
│                      │
│  ┌──────────────────┐│
│  │ 📁 Work        ✎🗑││  ← sidebar-folder-{id}
│  │ 📁 Personal    ✎🗑││     sidebar-folder-edit-{id}
│  │ 📁 Inbox       ✎  ││     sidebar-folder-delete-{id}
│  └──────────────────┘│
│   sidebar-folder-list│
│                      │
│  ┌──────────────────┐│
│  │ 🕐 RECENT        ││
│  │ Meeting Notes    ││
│  │ Project Plan     ││
│  └──────────────────┘│
│   sidebar-recent-    │
│   section            │
│                      │
│  ┌──────────────────┐│
│  │ MagicBox v1.1.0  ││
│  │ GitHub           ││
│  └──────────────────┘│
│   sidebar-footer     │
└──────────────────────┘
```

---

### Search Bar Dropdown (`searchbar`)

```
┌─────────────────────────────────────────┐
│ 🔍 Search notes and folders...      [✕] │  ← searchbar-input
└─────────────────────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────┐
    │  searchbar-results                  │
    │                                     │
    │  FOLDERS (2)                        │
    │  ┌─────────────────────────────┐   │
    │  │ 📁 Work                     │   │  ← searchbar-result-folder-1
    │  │ 📁 Personal                 │   │  ← searchbar-result-folder-2
    │  └─────────────────────────────┘   │
    │                                     │
    │  NOTES (3)                          │
    │  ┌─────────────────────────────┐   │
    │  │ 📝 Meeting Notes            │   │  ← searchbar-result-note-1
    │  │    in Work                  │   │
    │  │ 📝 Workout Plan             │   │  ← searchbar-result-note-2
    │  │    in Personal              │   │
    │  └─────────────────────────────┘   │
    │                                     │
    └─────────────────────────────────────┘
```

---

### Confirm Modal (`confirm-modal`)

```
         ┌─────────────────────────────────────┐
         │  confirm-modal-container            │
         │                                     │
    ╔════╧═════════════════════════════════════╧════╗
    ║  ┌─────────────────────────────────────────┐  ║
    ║  │              [✕] close                  │  ║  ← confirm-modal-close
    ║  │                                         │  ║
    ║  │              ⚠️                         │  ║  ← confirm-modal-icon
    ║  │                                         │  ║
    ║  │         Delete Unused Notes             │  ║  ← confirm-modal-title
    ║  │                                         │  ║
    ║  │  You have 3 notes that haven't been    │  ║  ← confirm-modal-message
    ║  │  updated in 30 days. Are you sure?     │  ║
    ║  │                                         │  ║
    ║  │  [Cancel]    [Delete 3 Notes]          │  ║
    ║  │              ↑ red/danger button       │  ║
    ║  └─────────────────────────────────────────┘  ║
    ╚═══════════════════════════════════════════════╝
         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
              confirm-modal-backdrop
              (click to close)
```

---

### Central Input with Suggestions (`central-input`)

```
┌─────────────────────────────────────────────────────────────┐
│  central-input                                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                                                     │  │
│   │  What's on your mind? Use #folder to organize       │  │
│   │                                                     │  │
│   │  Today I need to finish the project report and      │  │
│   │  send it to the team. #Work                         │  │
│   │                                                     │  │
│   │                                          [⮐]  [✕] │  │
│   └─────────────────────────────────────────────────────┘  │
│        ↑ Multi-line textarea (3 rows default)              │
│        central-input-field                                 │
│                                                             │
│                           │                                 │
│                           ▼                                 │
│    ┌─────────────────────────────────────────────────┐     │
│    │  Select folder (Tab to select, ↑↓ to navigate) │     │
│    ├─────────────────────────────────────────────────┤     │
│    │  # Work                              default    │     │
│    │  # Personal                          Tab ←───  │     │
│    │  # Ideas                                        │     │
│    └─────────────────────────────────────────────────┘     │
│         central-input-suggestions                          │
│                                                             │
│   💡 Type # to add to folder • Enter to create             │
│                                                             │
│   NEW: Text goes to NOTE CONTENT (not title)               │
│   Title is auto-generated from first line                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Area Breakdown

### 1. App Shell (`app-root`)

**File:** `src/App.tsx`

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Root Container | `app-root` | `.app-container` | Main flex container |
| Main Layout | `main-layout` | `.main-layout` | Sidebar + content wrapper |
| Top Bar | `top-bar` | `.top-bar` | Header with view title and search |
| Main Content | `main-content` | `.main-content` | Dynamic content area |

**Usage:**
```javascript
// Access main container
document.querySelector('[data-area-id="app-root"]')
document.querySelector('.app-container')
```

---

### 2. Sidebar (`sidebar`)

**File:** `src/components/Sidebar.tsx`

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Sidebar Container | `sidebar` | `.sidebar` | Left navigation panel |
| All Notes Button | `sidebar-all-notes` | `.sidebar-all-notes-btn` | "All Notes" navigation |
| Folders Section | `sidebar-folders-section` | `.sidebar-folders-section` | Folders list container |
| Folders Header | `sidebar-folders-header` | `.sidebar-folders-header` | "Folders" title + add button |
| New Folder Button | `sidebar-new-folder-btn` | `.sidebar-new-folder-btn` | Plus icon to create folder |
| Folder List | `sidebar-folder-list` | `.sidebar-folder-list` | List of folders |
| Folder Item | `sidebar-folder-{id}` | `.sidebar-folder-item` | Individual folder row |
| Folder Edit Button | `sidebar-folder-edit-{id}` | `.sidebar-folder-edit-btn` | Edit folder icon |
| Folder Delete Button | `sidebar-folder-delete-{id}` | `.sidebar-folder-delete-btn` | Delete folder icon |
| New Folder Input | `sidebar-new-folder-input` | `.sidebar-new-folder-input` | Create folder text input |
| Recent Notes Section | `sidebar-recent-section` | `.sidebar-recent-section` | Recent notes container |
| Recent Note Item | `sidebar-recent-{id}` | `.sidebar-recent-item` | Individual recent note |
| Footer | `sidebar-footer` | `.sidebar-footer` | Version and GitHub link |

**Usage:**
```javascript
// Access sidebar
document.querySelector('[data-area-id="sidebar"]')

// Access specific folder
document.querySelector('[data-area-id="sidebar-folder-1"]')

// Access new folder button
document.querySelector('[data-area-id="sidebar-new-folder-btn"]')
```

---

### 3. Search Bar (`searchbar`)

**File:** `src/components/SearchBar.tsx`

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Search Container | `searchbar` | `.searchbar` | Search component wrapper |
| Search Input | `searchbar-input` | `.searchbar-input` | Search text field |
| Search Clear Button | `searchbar-clear` | `.searchbar-clear-btn` | X button to clear search |
| Search Results | `searchbar-results` | `.searchbar-results` | Dropdown results container |
| Results Folder Section | `searchbar-results-folders` | `.searchbar-results-folders` | Folder results section |
| Results Note Section | `searchbar-results-notes` | `.searchbar-results-notes` | Note results section |
| Result Folder Item | `searchbar-result-folder-{id}` | `.searchbar-result-item` | Individual folder result |
| Result Note Item | `searchbar-result-note-{id}` | `.searchbar-result-item` | Individual note result |

**Usage:**
```javascript
// Access search input
document.querySelector('[data-area-id="searchbar-input"]')

// Access search results
document.querySelector('[data-area-id="searchbar-results"]')
```

---

### 4. Home Page (`homepage`)

**File:** `src/pages/HomePage.tsx`

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Home Container | `homepage` | `.homepage` | Home page wrapper |
| Hero Section | `homepage-hero` | `.homepage-hero` | Welcome banner area |
| Central Input | `central-input` | `.central-input` | Main note creation input |
| Central Input Field | `central-input-field` | `.central-input-field` | Text input for new notes |
| Central Input Submit | `central-input-submit` | `.central-input-submit` | Submit button (arrow) |
| Central Input Clear | `central-input-clear` | `.central-input-clear` | Clear input button |
| Folder Suggestions | `central-input-suggestions` | `.central-input-suggestions` | Folder hashtag dropdown |
| Recent Notes Section | `homepage-recent-section` | `.homepage-recent-section` | Recent notes grid |
| Recent Note Card | `homepage-recent-{id}` | `.homepage-recent-card` | Individual recent note |
| Recent Card Delete | `homepage-recent-delete-{id}` | `.homepage-recent-card-delete-btn` | Delete button on card (hover) |
| Quick Stats Section | `homepage-stats` | `.homepage-stats` | Stats bar at bottom |
| Stats Notes Count | `homepage-stats-notes` | `.homepage-stats-notes` | Total notes number |
| Stats Folders Count | `homepage-stats-folders` | `.homepage-stats-folders` | Total folders number |
| Stats Unused Count | `homepage-stats-unused` | `.homepage-stats-unused` | Unused notes count |
| Stats Unused Button | `homepage-stats-unused-btn` | `.homepage-stats-unused-btn` | Delete unused button |

**Usage:**
```javascript
// Access central input
document.querySelector('[data-area-id="central-input-field"]')

// Access recent notes
document.querySelectorAll('[data-area-id^="homepage-recent-"]')

// Access unused notes button
document.querySelector('[data-area-id="homepage-stats-unused-btn"]')
```

---

### 5. Folder Page (`folderpage`)

**File:** `src/pages/FolderPage.tsx`

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Folder Container | `folderpage` | `.folderpage` | Folder page wrapper |
| Folder Header | `folderpage-header` | `.folderpage-header` | Sticky header with folder info |
| Folder Icon | `folderpage-icon` | `.folderpage-icon` | Folder icon container |
| Folder Name | `folderpage-name` | `.folderpage-name` | Folder title |
| Folder Note Count | `folderpage-count` | `.folderpage-count` | Number of notes text |
| Notes Grid | `folderpage-notes-grid` | `.folderpage-notes-grid` | Grid of note cards |
| Note Card | `folderpage-note-{id}` | `.folderpage-note-card` | Individual note card |
| Note Card Title | `folderpage-note-title-{id}` | `.folderpage-note-title` | Note title text |
| Note Card Delete | `folderpage-note-delete-{id}` | `.folderpage-note-delete-btn` | Delete button (hover) |
| Empty State | `folderpage-empty` | `.folderpage-empty` | "No notes" message |

**Usage:**
```javascript
// Access folder name
document.querySelector('[data-area-id="folderpage-name"]')

// Access specific note card
document.querySelector('[data-area-id="folderpage-note-1"]')

// Access delete button on note
document.querySelector('[data-area-id="folderpage-note-delete-1"]')
```

---

### 6. Note Editor (`noteeditor`) - Obsidian-style

**File:** `src/components/NoteEditor.tsx`

Simple, clean editor inspired by Obsidian. Just title + content. No toolbar, minimal UI.

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Editor Container | `noteeditor` | `.noteeditor` | Editor wrapper |
| Editor Header | `noteeditor-header` | `.noteeditor-header` | Minimal top bar |
| Back Button | `noteeditor-back-btn` | `.noteeditor-back-btn` | Return arrow button |
| Folder Selector | `noteeditor-folder-select` | `.noteeditor-folder-select` | Current folder (click to change) |
| Folder Dropdown | `noteeditor-folder-dropdown` | `.noteeditor-folder-dropdown` | Folder options list |
| Title Input | `noteeditor-title` | `.noteeditor-title` | Large title field (H1 style) |
| Editor Content | `noteeditor-content` | `.noteeditor-content` | Content wrapper |
| Content Textarea | `noteeditor-textarea` | `.noteeditor-textarea` | Main writing area (auto-resize) |
| Note Menu | - | `.noteeditor-menu` | Three-dot menu (delete option) |

**Usage:**
```javascript
// Access title input
document.querySelector('[data-area-id="noteeditor-title"]')

// Access editor content
document.querySelector('[data-area-id="noteeditor-content"]')

// Access save button
document.querySelector('[data-area-id="noteeditor-save-btn"]')
```

---

### 7. Confirm Modal (`confirm-modal`)

**File:** `src/components/ConfirmModal.tsx`

| Element | data-area-id | CSS Class | Description |
|---------|--------------|-----------|-------------|
| Modal Overlay | `confirm-modal` | `.confirm-modal` | Backdrop + modal container |
| Modal Backdrop | `confirm-modal-backdrop` | `.confirm-modal-backdrop` | Dark background overlay |
| Modal Container | `confirm-modal-container` | `.confirm-modal-container` | Modal card |
| Modal Icon | `confirm-modal-icon` | `.confirm-modal-icon` | Alert/warning icon |
| Modal Title | `confirm-modal-title` | `.confirm-modal-title` | Modal heading |
| Modal Message | `confirm-modal-message` | `.confirm-modal-message` | Description text |
| Cancel Button | `confirm-modal-cancel` | `.confirm-modal-cancel-btn` | Cancel action |
| Confirm Button | `confirm-modal-confirm` | `.confirm-modal-confirm-btn` | Confirm action |
| Close Button | `confirm-modal-close` | `.confirm-modal-close-btn` | X close button |

**Usage:**
```javascript
// Check if modal is open
document.querySelector('[data-area-id="confirm-modal"]')

// Click confirm
document.querySelector('[data-area-id="confirm-modal-confirm"]')?.click()

// Click cancel
document.querySelector('[data-area-id="confirm-modal-cancel"]')?.click()
```

---

## Component Hierarchy

```
app-root
├── sidebar
│   ├── sidebar-all-notes
│   ├── sidebar-folders-section
│   │   ├── sidebar-folders-header
│   │   │   └── sidebar-new-folder-btn
│   │   ├── sidebar-new-folder-input (conditional)
│   │   └── sidebar-folder-list
│   │       └── sidebar-folder-{id}
│   │           ├── sidebar-folder-edit-{id}
│   │           └── sidebar-folder-delete-{id}
│   ├── sidebar-recent-section
│   │   └── sidebar-recent-{id}
│   └── sidebar-footer
├── main-layout
│   ├── top-bar
│   │   ├── searchbar
│   │   │   ├── searchbar-input
│   │   │   ├── searchbar-clear
│   │   │   └── searchbar-results (conditional)
│   │   │       ├── searchbar-results-folders
│   │   │       │   └── searchbar-result-folder-{id}
│   │   │       └── searchbar-results-notes
│   │   │           └── searchbar-result-note-{id}
│   │   └── (view title)
│   └── main-content
│       ├── homepage (route: /)
│       │   ├── homepage-hero
│       │   │   └── central-input
│       │   │       ├── central-input-field
│       │   │       ├── central-input-clear
│       │   │       ├── central-input-submit
│       │   │       └── central-input-suggestions (conditional)
│       │   ├── homepage-recent-section
│       │   │   └── homepage-recent-{id}
│       │   └── homepage-stats
│       │       ├── homepage-stats-notes
│       │       ├── homepage-stats-folders
│       │       └── homepage-stats-unused
│       │           └── homepage-stats-unused-btn
│       ├── folderpage (route: /folder/:id)
│       │   ├── folderpage-header
│       │   │   ├── folderpage-icon
│       │   │   ├── folderpage-name
│       │   │   └── folderpage-count
│       │   ├── folderpage-notes-grid
│       │   │   └── folderpage-note-{id}
│       │   │       ├── folderpage-note-title-{id}
│       │   │       └── folderpage-note-delete-{id}
│       │   └── folderpage-empty (conditional)
│       └── noteeditor (route: /note/:id)
│           ├── noteeditor-header (minimal)
│           │   ├── noteeditor-back-btn
│           │   ├── noteeditor-folder-select
│           │   │   └── noteeditor-folder-dropdown (conditional)
│           │   └── noteeditor-menu (3-dot menu)
│           └── noteeditor-content
│               ├── noteeditor-title (large, H1 style)
│               └── noteeditor-textarea (simple textarea)
└── confirm-modal (overlay, conditional)
    ├── confirm-modal-backdrop
    ├── confirm-modal-container
    │   ├── confirm-modal-close
    │   ├── confirm-modal-icon
    │   ├── confirm-modal-title
    │   ├── confirm-modal-message
    │   ├── confirm-modal-cancel
    │   └── confirm-modal-confirm
```

---

## Inspector Tips

### Finding Elements by Text Content
```javascript
// Find button by text
Array.from(document.querySelectorAll('button'))
  .find(btn => btn.textContent.includes('Delete'))

// Find element by partial match
document.evaluate(
  "//*[contains(text(), 'Unused')]",
  document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
).singleNodeValue
```

### Checking Current View
```javascript
// Check which view is active
const view = document.querySelector('[data-area-id="homepage"]') ? 'home' :
             document.querySelector('[data-area-id="folderpage"]') ? 'folder' :
             document.querySelector('[data-area-id="noteeditor"]') ? 'note' : 'unknown';
console.log('Current view:', view);
```

### Simulating Interactions
```javascript
// Click "All Notes"
document.querySelector('[data-area-id="sidebar-all-notes"]')?.click()

// Open folder by name
Array.from(document.querySelectorAll('[data-area-id^="sidebar-folder-"]'))
  .find(el => el.textContent.includes('Work'))?.click()

// Create new note
document.querySelector('[data-area-id="central-input-field"]').value = 'My new note'
document.querySelector('[data-area-id="central-input-submit"]')?.click()
```

---

## CSS Variables Reference

Common colors used across components:

| Variable | Value | Usage |
|----------|-------|-------|
| Background | `#191919` | Main background |
| Sidebar | `#202020` | Sidebar, cards |
| Hover | `#2a2a2a` | Hover states |
| Input | `#2a2a2a` | Input fields |
| Border | `#2f2f2f` | Borders |
| Text | `#e6e6e6` | Primary text |
| Gray | `#6b6b6b` | Secondary text |
| Blue | `#3b82f6` | Primary action |
| Red | `#ef4444` | Danger/Delete |

---

## Update History

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-13 | 1.0.0 | Initial UI area mapping |
