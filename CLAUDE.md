# Magicbox — Claude Instructions

## Version Bumping Rule

**Every time you make a code change and commit, bump the version in `package.json` (root).**

Use semantic versioning:
- `patch` (2.0.x) — bug fixes, small tweaks
- `minor` (2.x.0) — new features, UI improvements
- `major` (x.0.0) — breaking changes, full rewrites

After changing the root `package.json` version, run:
```bash
node scripts/sync-version.js
```
This syncs the version to `backend/package.json`, `frontend/package.json`, and `backend/src/index.ts` automatically.

Then commit the version bump together with the code change, or as a separate commit immediately after.

## Project Overview

- **Stack:** Cloudflare Workers (Hono) + D1 + Cloudflare Pages (React + Vite)
- **Auth:** PBKDF2 password via Web Crypto API, session cookies
- **AI:** OpenRouter API — key stored as Worker secret `OPENROUTER_API_KEY`
- **Deploy backend:** `cd backend && npm run deploy`
- **Deploy frontend:** `npm run deploy:web` (from root)
- **Migrations:** `cd backend && wrangler d1 migrations apply magicbox-db --remote`

## Key Files

- `docs/plan.md` — implementation plan with `[ ]`/`[x]` status tracking
- `scripts/sync-version.js` — syncs version across all package files
- `backend/src/lib/settings.ts` — reads OpenRouter API key (env secret > DB)
