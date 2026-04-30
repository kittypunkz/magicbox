# Repository Guidelines

## Project Structure & Module Organization

MagicBox is a TypeScript app with a Cloudflare Workers API and a React/Vite frontend. Backend source lives in `backend/src`, with routes in `backend/src/routes`, middleware in `backend/src/middleware`, validators in `backend/src/validators`, D1 migrations in `backend/migrations`, and tests in `backend/test`. Frontend source lives in `frontend/src`, organized into `pages`, `components`, `hooks`, `contexts`, `api`, `lib`, `types`, and `utils`. Playwright tests are in `frontend/e2e`. Docs live under `docs`; `database/schema.sql` is the schema reference.

## Build, Test, and Development Commands

- `npm run setup`: install root, backend, frontend, and Playwright dependencies.
- `npm run dev`: run backend and frontend together.
- `npm run dev:api`: run the Worker API locally, usually on port `8787`.
- `npm run dev:web`: run Vite with `VITE_API_URL=http://localhost:8787`.
- `npm run build`: sync versions, then build the frontend.
- `npm run test:api`: run backend Vitest tests.
- `npm run test:e2e`: run frontend Playwright tests.
- `make check`: run TypeScript checks for backend and frontend.
- `npm run db:migrate`: apply local D1 migrations from `backend/migrations`.

## Coding Style & Naming Conventions

Use TypeScript and ES modules throughout. Match existing two-space indentation and React functional component patterns. Name React components and pages in `PascalCase` (`TaskDetailModal.tsx`), hooks with `use` prefixes (`useTasks.ts`), and utilities by purpose (`imageCompress.ts`). Keep route files resource-oriented (`notes.ts`, `tasks.ts`) and validate request payloads through `backend/src/validators` where applicable. Use Tailwind and existing CSS conventions.

## Testing Guidelines

Backend tests use Vitest with Cloudflare worker support; place API tests in `backend/test/*.test.ts`. Frontend end-to-end coverage uses Playwright; place specs in `frontend/e2e/*.spec.ts`. Prefer focused tests for changed routes, hooks, and user workflows. Run `npm run test:api` for backend changes, `npm run test:e2e` for UI changes, and `make check` before larger pull requests.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `feat:` and `fix:` with concise summaries, often including version notes. If a committed code change ships, bump the root `package.json` version using semver and run `node scripts/sync-version.js`. Pull requests should describe the change, list tests run, link relevant issues or docs, and include screenshots for visible UI changes.

## Security & Configuration Tips

Start from `.env.example` for local configuration. Keep secrets out of git; production OpenRouter credentials should be stored as Cloudflare Worker secrets, with D1 settings only as fallback. Review `backend/wrangler.toml` and `frontend/wrangler.toml` before deployment changes.
