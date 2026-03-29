# E2E Test Results — Dev Environment (2026-03-29)

**Environment:** https://develop.magicbox-app.pages.dev
**Status:** ⚠️ Partial — tests aborted during run
**Root Issue:** Tests require auth but have no auth setup

## Results (partial — 12/22 tests shown)

| # | Test | Status | Time |
|---|------|--------|------|
| 1 | Folder Page › should display folder header | ✘ FAIL | 30.1s |
| 2 | Folder Page › should create note in folder | ✘ FAIL | 30.1s |
| 3 | Folder Page › should show folder page | ✘ FAIL | 30.1s |
| 4 | Folder Page › should open note from folder | ✘ FAIL | 30.1s |
| 5 | Folder Page › should navigate between folders | ✘ FAIL | 30.1s |
| 6 | Homepage › should display homepage | ✘ FAIL | 5.5s |
| 7 | Homepage › should display recent notes section | ✘ FAIL | 5.5s |
| 8 | Homepage › should display new note button | ✘ FAIL | 5.5s |
| 9 | Homepage › should open create note modal | ✘ FAIL | 30.1s |
| 10 | Homepage › should create a new note | ✘ FAIL | 30.1s |
| 11 | Homepage › should open note from recent cards | ✓ PASS | 512ms |
| 12 | Note Editor › should display note editor | ✘ FAIL | 30.1s |

## Why Tests Fail

All tests navigate to `/` and expect to see notes/folders. Without auth, the app shows the login page instead.

**Root cause:** Phase 1 removed `VITE_TEST_MODE` auth bypass. Tests were written to work with that bypass.

## Fix Needed

Add Playwright auth setup:
1. Create `e2e/auth.setup.ts` — logs in via API and saves cookies
2. Update `playwright-dev.config.ts` — use storageState for authenticated tests
3. Or add a test-only API endpoint that returns a valid session

**Action item:** Add to Phase 3 tasks.

---
*Generated: 2026-03-29 by ChokdeeAI 🍀*