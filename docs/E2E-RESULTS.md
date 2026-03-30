# E2E Test Results

**Date:** 2026-03-30  
**Runner:** Playwright 1.58.2  
**Config:** `playwright-dev.config.ts`  
**Base URL:** `https://develop.magicbox-app.pages.dev`  
**API URL:** `https://api.magicbox.bankapirak.com`

## Summary

✅ **23 passed** · 0 failed · 55.6s

## Auth Setup

A test-only auth bypass was added to support E2E testing without WebAuthn:

- **Endpoint:** `POST /auth/test-login` on the API server
- **Env var:** `TEST_SECRET` configured in `wrangler.toml`
- **Setup file:** `e2e/auth.setup.ts` — authenticates via the test-login endpoint and saves cookies
- **Config:** `playwright-dev.config.ts` — uses `storageState` from the auth setup for the `chromium` project

## Test Results

```
  ✓  1 [setup] › e2e/auth.setup.ts:7:1 › authenticate (252ms)
  ✓  2 [chromium] › e2e/folder-page.spec.ts:4:3 › Folder Page › should display folder header (2.6s)
  ✓  3 [chromium] › e2e/folder-page.spec.ts:11:3 › Folder Page › should create note in folder (1.9s)
  ✓  4 [chromium] › e2e/folder-page.spec.ts:17:3 › Folder Page › should show folder page (2.4s)
  ✓  5 [chromium] › e2e/folder-page.spec.ts:23:3 › Folder Page › should open note from folder (2.3s)
  ✓  6 [chromium] › e2e/folder-page.spec.ts:33:3 › Folder Page › should navigate between folders (3.8s)
  ✓  7 [chromium] › e2e/homepage.spec.ts:8:3 › Homepage › should display homepage (1.4s)
  ✓  8 [chromium] › e2e/homepage.spec.ts:12:3 › Homepage › should display recent notes section (1.4s)
  ✓  9 [chromium] › e2e/homepage.spec.ts:16:3 › Homepage › should display new note button (1.4s)
  ✓ 10 [chromium] › e2e/homepage.spec.ts:20:3 › Homepage › should open create note modal (1.5s)
  ✓ 11 [chromium] › e2e/homepage.spec.ts:25:3 › Homepage › should create a new note (3.3s)
  ✓ 12 [chromium] › e2e/homepage.spec.ts:33:3 › Homepage › should open note from recent cards (439ms)
  ✓ 13 [chromium] › e2e/note-editor.spec.ts:14:3 › Note Editor › should display note editor (3.3s)
  ✓ 14 [chromium] › e2e/note-editor.spec.ts:19:3 › Note Editor › should edit note title (5.3s)
  ✓ 15 [chromium] › e2e/note-editor.spec.ts:29:3 › Note Editor › should show saving indicator (3.3s)
  ✓ 16 [chromium] › e2e/note-editor.spec.ts:37:3 › Note Editor › should delete note (3.6s)
  ✓ 17 [chromium] › e2e/note-editor.spec.ts:48:3 › Note Editor › should navigate back (3.4s)
  ✓ 18 [chromium] › e2e/sidebar.spec.ts:8:3 › Sidebar › should display logo and version (1.4s)
  ✓ 19 [chromium] › e2e/sidebar.spec.ts:13:3 › Sidebar › should display folder list (2.3s)
  ✓ 20 [chromium] › e2e/sidebar.spec.ts:19:3 › Sidebar › should navigate to folder (2.3s)
  ✓ 21 [chromium] › e2e/sidebar.spec.ts:25:3 › Sidebar › should highlight active folder (1.8s)
  ✓ 22 [chromium] › e2e/sidebar.spec.ts:31:3 › Sidebar › should show search (1.4s)
  ✓ 23 [chromium] › e2e/sidebar.spec.ts:35:3 › Sidebar › should have new note button (1.4s)
```

## Files Modified

| File | Change |
|------|--------|
| `backend/src/routes/auth.ts` | Added `POST /auth/test-login` endpoint (gated by `TEST_SECRET`) |
| `backend/src/types/index.ts` | Added `TEST_SECRET?: string` to `Env` interface |
| `backend/wrangler.toml` | Added `[vars]` with `TEST_SECRET` |
| `frontend/e2e/auth.setup.ts` | New — Playwright auth setup project |
| `frontend/playwright-dev.config.ts` | Updated — added setup project, storageState on chromium |
