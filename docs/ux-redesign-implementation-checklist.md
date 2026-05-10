# MagicBox UX Redesign Implementation Checklist

## Foundation

- [x] Review current app structure and map redesign requirements to existing frontend and backend flows.
- [x] Change the app entry point from notes-first to Today-first.
- [x] Add a dedicated `Today` page at `/`.
- [x] Move the notes index experience to `/notes`.
- [x] Update sidebar and mobile navigation to reflect `Today / Notes / Tasks / Bookmarks / Ask / Settings`.
- [x] Keep folder and note detail routes working during the transition.

## Phase 1: Today Workspace

- [x] Create `TodayPage` as the default landing page.
- [x] Show a Quick Capture entry point on Today.
- [x] Show `Doing Now` tasks on Today.
- [x] Show `Done Today` tasks on Today.
- [x] Show recent notes on Today.
- [x] Show recent bookmarks on Today.
- [x] Highlight Today in navigation when on `/`.

## Phase 2: Quick Capture

- [x] Add a global `+ Capture` action.
- [x] Build a unified Quick Capture modal for `Note / Task / Bookmark`.
- [x] Auto-detect capture type from input.
- [x] Allow manual override before save.
- [x] Support direct task creation without note creation.
- [x] Support bookmark creation from pasted URL.
- [x] Add `Cmd/Ctrl + N` shortcut for capture.
- [x] Preserve existing note creation behavior while migrating flows.

## Phase 3: Meeting Note Preset

- [x] Add a Meeting Note preset to Quick Capture.
- [x] Auto-generate local title in `Meeting — YYYY-MM-DD HH:mm` format.
- [x] Pre-fill the note body with `Notes / Decisions / Action Items`.
- [x] Allow folder assignment before save.

## Phase 4: Tasks Today View

- [x] Change Tasks page to default to a Today-first tab.
- [x] Add `Today / Board / Work Log` tabs.
- [x] Show `Doing` in Today tab.
- [x] Show `Done Today` in Today tab.
- [x] Show `Added Today` in Today tab.
- [x] Show `Carry Over` in Today tab.
- [x] Keep board interactions and task detail behavior intact.

## Phase 5: Work Log

- [x] Rename Summary UI to Work Log.
- [x] Support `Today` and `Custom date range`.
- [x] Show grouped task states for today.
- [x] Show completed tasks for custom ranges.
- [x] Export Work Log as readable Markdown.
- [x] Order completed tasks by completion time.

## Phase 6: Task Summary API

- [x] Extend `/tasks/summary` with `added_today`.
- [x] Extend `/tasks/summary` with `carry_over`.
- [x] Keep `backlog`, `doing`, and `done_today` compatible.
- [x] Use Bangkok timezone consistently.
- [x] Preserve current board behavior and current summary consumers.
- [x] Add backend tests for the new summary shape.

## Phase 7: Notes Timeline

- [x] Add Notes filters for `Today / Yesterday / This Week / All`.
- [x] Keep folder filtering available.
- [x] Group or sort notes by recent time.
- [x] Improve empty states for filtered views.

## Phase 8: Bookmark Library

- [x] Add bookmark search by title, URL, and content.
- [x] Add sort by newest and oldest.
- [x] Add filter by domain.
- [x] Add visible open-link action.
- [x] Add copy URL action.
- [x] Add quick save bookmark action from Bookmarks page.
- [x] Show bookmark count and clearer bookmark metadata.

## Phase 9: Ask Scope Selector

- [x] Add visible scope selector to Ask page.
- [x] Support scopes for `Today / This Week / Notes / Tasks / Bookmarks / All / Custom`.
- [x] Send scope metadata to backend chat requests.
- [x] Support custom date range selection.
- [x] Preserve chat history behavior.

## Phase 10: Source-Grounded AI Retrieval

- [x] Make backend retrieval scope-aware.
- [x] Retrieve from notes, tasks, and bookmarks by selected scope.
- [x] Stop appending unrelated recent notes by default.
- [x] Return typed sources and retrieval metadata.
- [x] Render source types clearly in the Ask UI.
- [x] Return a clear insufficient-context response when retrieval is weak.

## Phase 11: AI Source Feedback

- [x] Add `POST /chat/feedback`.
- [x] Add `ai_source_feedback` migration.
- [x] Add `Wrong source` actions to rendered sources.
- [x] Store feedback without breaking chat flow on failure.

## Phase 12: Daily Brief Integration

- [x] Removed Daily Brief from the product surface.
- [x] Removed Daily Brief navigation, Today card, and dedicated route.
- [x] Disabled backend brief endpoint and scheduled generation.

## Verification

- [ ] Update frontend tests for Today-first navigation.
- [ ] Update task-related tests for Today and Work Log.
- [ ] Run `make check` or equivalent TypeScript checks in an environment where `make` is available.
- [ ] Run `npm run test:api` for task summary changes.
- [ ] Run relevant frontend or Playwright tests after route and navigation changes.
