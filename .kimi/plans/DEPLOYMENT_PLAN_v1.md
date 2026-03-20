# Production Deployment Plan v1.0

**Planned by:** Mana (PO) + Arun (DevOps)  
**Date:** 2026-03-20  
**Target:** MagicBox production deployment  
**Platform:** GitHub + Cloudflare Workers + D1

---

## 1. Current State Assessment

### Arun's Infrastructure Audit

| Component | Status | Notes |
|-----------|--------|-------|
| GitHub Repo | ✅ | kittypunkz/magicbox |
| Cloudflare Account | ❓ | Need to verify access |
| D1 Database | ✅ | migrations exist (0001-0003) |
| GitHub Actions | ❌ | No workflows configured |
| Wrangler Config | ❓ | Needs verification |
| Secrets (GitHub) | ❌ | Not configured |

### Mana's Feature Readiness Check

| Feature | Status | Deploy Ready |
|---------|--------|--------------|
| Pin Notes | ✅ Merged | Yes |
| Security Fixes | ✅ Merged | Yes |
| JWT Auth | ⚠️ Backend only | Partial - needs frontend |
| Database Schema | ✅ | Yes |

**Decision:** Deploy current `main` branch. Auth integration comes later.

---

## 2. Deployment Strategy

### Strategy: Staging → Production

```
main branch
    ↓
GitHub Action: Deploy to Staging
    ↓
Vera (QA) verifies on staging
    ↓
Mana approves
    ↓
GitHub Action: Deploy to Production
    ↓
Arun verifies deployment
    ↓
Team notified: "New dawn has risen"
```

### Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local | localhost:3000/8787 | Development |
| Staging | staging.magicbox.yourdomain.workers.dev | Pre-production testing |
| Production | magicbox.yourdomain.workers.dev | Live users |

---

## 3. GitHub Actions Workflows

### Workflow 1: CI (Pull Request)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  typecheck-frontend:
    name: Frontend TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: cd frontend && npm run typecheck

  typecheck-backend:
    name: Backend TypeCheck  
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: cd backend && npm ci
      - run: cd backend && npm run typecheck

  test-migrations:
    name: Test DB Migrations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - run: cd backend && npx wrangler d1 migrations list --local
```

### Workflow 2: Deploy Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy-backend:
    name: Deploy Backend to Staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - name: Deploy to Cloudflare (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: backend
          command: deploy --env staging
      - name: Apply D1 Migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: backend
          command: d1 migrations apply magicbox-db-staging --remote

  deploy-frontend:
    name: Deploy Frontend to Staging
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - name: Deploy to Cloudflare Pages (Staging)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/dist --project-name=magicbox-staging
```

### Workflow 3: Deploy Production

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      confirmation:
        description: 'Type "deploy" to confirm production deployment'
        required: true
        type: string

jobs:
  verify:
    name: Verify Ready for Production
    runs-on: ubuntu-latest
    steps:
      - name: Check confirmation
        if: github.event.inputs.confirmation != 'deploy'
        run: |
          echo "Production deployment requires confirmation"
          exit 1
      - uses: actions/checkout@v4
      - name: Verify all checks passed
        run: |
          echo "Checking last commit status..."
          # Add verification logic here

  deploy-backend:
    name: Deploy Backend to Production
    runs-on: ubuntu-latest
    needs: verify
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd backend && npm ci
      - name: Deploy to Cloudflare (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: backend
          command: deploy --env production
      - name: Apply D1 Migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: backend
          command: d1 migrations apply magicbox-db --remote

  deploy-frontend:
    name: Deploy Frontend to Production
    runs-on: ubuntu-latest
    needs: deploy-backend
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - name: Deploy to Cloudflare Pages (Production)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/dist --project-name=magicbox

  notify:
    name: Notify Team
    runs-on: ubuntu-latest
    needs: [deploy-backend, deploy-frontend]
    steps:
      - name: Deployment Complete
        run: |
          echo "🌅 New dawn has risen!"
          echo "Production deployment complete: $(date)"
```

---

## 4. Cloudflare Configuration

### D1 Databases

```toml
# backend/wrangler.toml
name = "magicbox"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Environment variables
[vars]
NODE_ENV = "production"

# D1 Database Binding
[[env.production.d1_databases]]
binding = "DB"
database_name = "magicbox-db"
database_id = "<PRODUCTION_DB_ID>"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "magicbox-db-staging"
database_id = "<STAGING_DB_ID>"

# Secrets (set via wrangler secret)
# JWT_SECRET
```

### Cloudflare Pages

| Environment | Project Name | Branch |
|-------------|--------------|--------|
| Staging | magicbox-staging | develop |
| Production | magicbox | main |

### Required Secrets (GitHub)

Set in: `Settings → Secrets and variables → Actions`

| Secret | Value Source |
|--------|--------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar |

### Required Secrets (Cloudflare)

```bash
# Set JWT secret for production
wrangler secret put JWT_SECRET --env production

# Set JWT secret for staging  
wrangler secret put JWT_SECRET --env staging
```

---

## 5. Database Migration Strategy

### Migration Checklist

Before each deployment:

```bash
# 1. List pending migrations
wrangler d1 migrations list --env staging

# 2. Apply migrations (staging)
wrangler d1 migrations apply magicbox-db-staging --remote --env staging

# 3. Verify migrations applied
wrangler d1 migrations list --env staging

# 4. Test application on staging

# 5. Repeat for production
wrangler d1 migrations list --env production
wrangler d1 migrations apply magicbox-db --remote --env production
```

### Rollback Plan

If migration fails:

```bash
# Arun's rollback procedure
# 1. Identify last known good version
# 2. Restore database from backup (manual - Cloudflare D1)
# 3. Redeploy previous code version
# 4. Notify Mana for incident report
```

---

## 6. Team Responsibilities

### During Deployment

| Phase | Who | Action |
|-------|-----|--------|
| Pre-deploy | Arun | Verify CI green, migrations ready |
| Pre-deploy | Mana | Final approval from PO |
| Deploy | Arun | Trigger deployment workflow |
| Deploy | Arun | Monitor deployment logs |
| Post-deploy | Arun | Verify health checks |
| Post-deploy | Vera | Run smoke tests on production |
| Post-deploy | Mana | Approve/rollback decision |
| Post-deploy | Kaji | On standby for hotfixes |

### Communication

```
Arun: "Deployment started for v1.x.x"
Arun: "Backend deployed successfully"
Arun: "Frontend deployed successfully"  
Arun: "Health checks passing"
Vera: "Smoke tests passed ✅"
Mana: "Production deployment approved. Great work team!"
Arun: "🌅 New dawn has risen!"
```

---

## 7. Implementation Checklist

### Phase 1: Setup (Arun)
- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/deploy-staging.yml`
- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Update `wrangler.toml` with environments
- [ ] Add GitHub secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- [ ] Create D1 databases (staging, production)
- [ ] Test CI workflow on PR

### Phase 2: Staging Deploy (Arun + Vera)
- [ ] Deploy to staging environment
- [ ] Apply D1 migrations to staging
- [ ] Vera runs full QA on staging
- [ ] Fix any issues found

### Phase 3: Production Deploy (Full Team)
- [ ] Mana gives final approval
- [ ] Arun triggers production deployment
- [ ] Apply D1 migrations to production
- [ ] Vera runs smoke tests
- [ ] Team monitors for issues

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration fails | Low | High | Test on staging first, have rollback plan |
| Secrets missing | Medium | High | Arun verifies all secrets before deploy |
| Downtime during deploy | Low | Medium | Cloudflare Workers has zero-downtime deploys |
| Frontend/backend version mismatch | Medium | Medium | Deploy backend first, then frontend |

---

## Decisions Made

### Mana (PO) Decisions:
1. **Deploy current state:** Pin notes + security fixes are ready
2. **Staging → Production:** Two-stage deployment for safety
3. **Auth integration later:** Deploy without full auth flow

### Arun (DevOps) Decisions:
1. **GitHub Actions:** Native integration, free for public repos
2. **Cloudflare:** Already in use, maintain consistency
3. **D1 separate DBs:** Staging and production isolated
4. **Manual production trigger:** Require confirmation for safety

---

## Next Steps

1. **Arun** implements Phase 1 (setup workflows)
2. **Mana** reviews and approves setup
3. **Vera** prepares QA checklist for staging
4. **Kaji** on standby for any hotfixes needed

---

*Plan created by Mana + Arun*  
*Every deployment is a new dawn 🌅*
