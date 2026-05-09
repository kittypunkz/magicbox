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
- [x] Show Daily Brief as a Today section.
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

- [ ] Change Tasks page to default to a Today-first tab.
- [ ] Add `Today / Board / Work Log` tabs.
- [ ] Show `Doing` in Today tab.
- [ ] Show `Done Today` in Today tab.
- [ ] Show `Added Today` in Today tab.
- [ ] Show `Carry Over` in Today tab.
- [ ] Keep board interactions and task detail behavior intact.

## Phase 5: Work Log

- [ ] Rename Summary UI to Work Log.
- [ ] Support `Today` and `Custom date range`.
- [ ] Show grouped task states for today.
- [ ] Show completed tasks for custom ranges.
- [ ] Export Work Log as readable Markdown.
- [ ] Order completed tasks by completion time.

## Phase 6: Task Summary API

- [ ] Extend `/tasks/summary` with `added_today`.
- [ ] Extend `/tasks/summary` with `carry_over`.
- [ ] Keep `backlog`, `doing`, and `done_today` compatible.
- [ ] Use Bangkok timezone consistently.
- [ ] Preserve current board behavior and current summary consumers.
- [ ] Add backend tests for the new summary shape.

## Phase 7: Notes Timeline

- [ ] Add Notes filters for `Today / Yesterday / This Week / All`.
- [ ] Keep folder filtering available.
- [ ] Group or sort notes by recent time.
- [ ] Improve empty states for filtered views.

## Phase 8: Bookmark Library

- [ ] Add bookmark search by title, URL, and content.
- [ ] Add sort by newest and oldest.
- [ ] Add filter by domain.
- [ ] Add visible open-link action.
- [ ] Add copy URL action.
- [ ] Add quick save bookmark action from Bookmarks page.
- [ ] Show bookmark count and clearer bookmark metadata.

## Phase 9: Ask Scope Selector

- [ ] Add visible scope selector to Ask page.
- [ ] Support scopes for `Today / This Week / Notes / Tasks / Bookmarks / All / Custom`.
- [ ] Send scope metadata to backend chat requests.
- [ ] Support custom date range selection.
- [ ] Preserve chat history behavior.

## Phase 10: Source-Grounded AI Retrieval

- [ ] Make backend retrieval scope-aware.
- [ ] Retrieve from notes, tasks, and bookmarks by selected scope.
- [ ] Stop appending unrelated recent notes by default.
- [ ] Return typed sources and retrieval metadata.
- [ ] Render source types clearly in the Ask UI.
- [ ] Return a clear insufficient-context response when retrieval is weak.

## Phase 11: AI Source Feedback

- [ ] Add `POST /chat/feedback`.
- [ ] Add `ai_source_feedback` migration.
- [ ] Add `Wrong source` actions to rendered sources.
- [ ] Store feedback without breaking chat flow on failure.

## Phase 12: Daily Brief Integration

- [ ] Reposition Daily Brief into Today as a first-class card.
- [ ] Add refresh action from Today.
- [ ] Add export action from Today.
- [ ] Add link to brief history from Today.
- [ ] Reduce Brief prominence in primary navigation.

## Verification

- [ ] Update frontend tests for Today-first navigation.
- [ ] Update task-related tests for Today and Work Log.
- [ ] Run `make check` or equivalent TypeScript checks in an environment where `make` is available.
- [ ] Run `npm run test:api` for task summary changes.
- [ ] Run relevant frontend or Playwright tests after route and navigation changes.
