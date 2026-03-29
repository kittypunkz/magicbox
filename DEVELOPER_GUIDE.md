# MagicBox Developer Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | (bundled with Node) | — |
| Wrangler CLI | 3.x | `npm install -g wrangler` |
| Git | 2.x+ | [git-scm.com](https://git-scm.com) |
| Cloudflare account | — | [dash.cloudflare.com](https://dash.cloudflare.com) |

You also need a **Cloudflare API token** with these permissions:
- Workers Scripts (Edit)
- D1 (Edit)
- Pages (Edit)

Create one at: https://dash.cloudflare.com/profile/api-tokens

## Local Setup

### 1. Clone & Install

```bash
git clone <repo-url> magicbox
cd magicbox
npm install          # installs root + workspaces (frontend, backend)
```

If `npm install` at root doesn't pick up workspace deps:

```bash
npm run setup        # explicitly installs all three package roots
```

### 2. Environment Variables

Copy the example files and fill in values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

**Required values in `backend/.env`:**

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | From Cloudflare dashboard URL or API |
| `CLOUDFLARE_API_TOKEN` | API token (see Prerequisites) |
| `JWT_SECRET` | Random secret for auth tokens — generate with `openssl rand -hex 32` |

The frontend `.env` files are already pre-configured:
- `.env.development` → points to the dev API URL
- `.env.production` → points to the prod API URL
- `.env.example` → template for custom setups

### 3. Run Dev Server

```bash
npm run dev
```

This starts **both** services concurrently:
- **Backend API** → `http://localhost:8787`
- **Frontend** → `http://localhost:3000`

You can also start them individually:

```bash
npm run dev:api      # backend only
npm run dev:web      # frontend only
```

## Database

MagicBox uses **Cloudflare D1** (SQLite on the edge).

### Local Development

Wrangler auto-creates a local D1 database. Apply migrations:

```bash
npx wrangler d1 migrations apply magicbox-db --local
```

### Remote Database

Same command with `--remote` to hit the live database:

```bash
npx wrangler d1 migrations apply magicbox-db --remote
```

### Creating a New Migration

```bash
npx wrangler d1 migrations create magicbox-db your_migration_name
# Edit the generated file in backend/migrations/
```

### Database Schema

The full schema is in `database/schema.sql`. Migrations live in `backend/migrations/`:

| File | Description |
|------|-------------|
| `0001_init.sql` | Initial tables (folders, notes) |
| `0002_add_auth.sql` | Auth tables (users, WebAuthn credentials) |
| `0003_add_note_pinning.sql` | Note pinning support |
| `0004_add_bookmarks.sql` | Bookmark functionality |
| `0005_add_bookmark_title.sql` | Bookmark title field |

### Useful D1 Commands

```bash
# List databases
wrangler d1 list

# Query directly
wrangler d1 execute magicbox-db --command="SELECT * FROM notes LIMIT 5"

# Execute a SQL file
wrangler d1 execute magicbox-db --file=./some-query.sql
```

## Deployment

### CI/CD Workflows

| Branch/Tag | Deploys To | Trigger |
|------------|------------|---------|
| Push to `develop` | Dev environment | Automatic |
| Tag `v*` (e.g. `v1.5.0`) | Production | Automatic |
| Manual | Either | `npm run deploy` |

### Deploy via Git

**To dev:**
```bash
git checkout develop
git merge feature/your-feature
git push origin develop
```

**To production:**
```bash
git checkout main
git merge develop
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

### Manual Deploy

```bash
npm run deploy           # full deploy (backend + frontend)
npm run deploy:api       # backend only
npm run deploy:web       # frontend only
```

The deploy script (`deploy.sh`) handles:
- Wrangler auth check
- D1 database creation (if missing)
- Backend Workers deploy
- Frontend Pages build + deploy

## Project Structure

```
magicbox/
├── backend/                  # Cloudflare Workers API (Hono)
│   ├── src/
│   │   ├── index.ts          # Entry point, route registration
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/        # Auth, CORS, etc.
│   │   ├── validators/       # Request validation (Zod)
│   │   └── types/            # Shared TypeScript types
│   ├── migrations/           # D1 SQL migrations
│   └── wrangler.toml         # Cloudflare config
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api/              # API client functions
│   │   ├── contexts/         # React context providers
│   │   ├── lib/              # Utilities and helpers
│   │   └── types/            # Shared types
│   ├── .env.development      # Dev API URL
│   ├── .env.production       # Prod API URL
│   └── vite.config.ts
├── database/
│   └── schema.sql            # Full D1 schema reference
├── scripts/
│   └── sync-version.js       # Version sync across packages
├── .github/workflows/        # CI/CD pipelines
├── deploy.sh                 # Manual deploy script
└── package.json              # Workspace root
```

## Common Errors & Fixes

### TypeScript Errors

```bash
# Check types without building
npm run typecheck           # runs in frontend/
cd backend && npx tsc --noEmit
```

If you see type errors after pulling changes, reinstall deps:

```bash
npm run setup
```

### Wrangler Auth Issues

**"Not logged in" or 403 errors:**

```bash
wrangler login              # interactive browser login
wrangler whoami             # verify current auth
```

Or set token in `backend/.env` (non-interactive):

```
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

**Token not being read:** Wrangler reads from `.env` in the `backend/` directory, not the project root.

### D1 Migration Issues

**"Database not found":**

```bash
wrangler d1 list            # verify DB exists
# Check database_id in backend/wrangler.toml matches your DB
```

**"Migration already applied":**

Migrations are tracked in a `_cf_KV` metadata table. If you need to re-run a migration during development, you can reset the local database:

```bash
rm -rf .wrangler/           # deletes local D1 state
```

**"no such table" at runtime:**

You forgot to run migrations against the environment you're targeting:

```bash
# For local dev
npx wrangler d1 migrations apply magicbox-db --local

# For deployed env
npx wrangler d1 migrations apply magicbox-db --remote
```

### Port Already in Use

If port `8787` (backend) or `3000` (frontend) is taken:

```bash
# Find and kill the process
lsof -i :8787
kill <PID>
```

## Version Management

The version is maintained in three `package.json` files. Use the sync script to update all at once:

```bash
# Manually bump version in root package.json, then:
npm run sync-version
```

## Testing

```bash
cd frontend
npm test                    # Playwright E2E tests
npm run test:ui             # with UI mode
npm run test:headed         # visible browser
npm run test:debug          # step-through debugging
```

## Quick Reference

| What | Command |
|------|---------|
| Start everything | `npm run dev` |
| Start backend only | `npm run dev:api` |
| Start frontend only | `npm run dev:web` |
| Run migrations (local) | `npx wrangler d1 migrations apply magicbox-db --local` |
| Deploy | `npm run deploy` |
| Type check frontend | `cd frontend && npm run typecheck` |
| E2E tests | `cd frontend && npm test` |
