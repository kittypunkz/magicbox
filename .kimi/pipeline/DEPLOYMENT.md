# Deployment Pipeline

**Managed by:** Arun (DevOps) + Mana (PO)

## Overview

Every deployment follows **Staging → Production** flow with full team verification.

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  DEVELOPMENT                                                  │
│  Kaji codes → commits → pushes to feature branch            │
└──────────────────┬──────────────────────────────────────────┘
                   │ PR created
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  CI CHECKS (GitHub Actions)                                  │
│  • TypeScript check (frontend)                              │
│  • TypeScript check (backend)                               │
│  • Database migration test                                  │
│  • Linting (if configured)                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ All checks pass
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  CODE REVIEW                                                 │
│  • CodeRabbit AI review (automated)                         │
│  • Rupa reviews architecture (if needed)                    │
│  • Mana approves from PO perspective                        │
└──────────────────┬──────────────────────────────────────────┘
                   │ Approved
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  MERGE TO MAIN                                               │
│  PR merged, triggers staging deployment                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ Auto-trigger
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGING DEPLOYMENT                                          │
│  Arun: Deploy backend to staging                            │
│  Arun: Apply D1 migrations to staging DB                    │
│  Arun: Deploy frontend to staging                           │
│  Arun: Health check verification                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ Deployed
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGING QA (Vera)                                           │
│  • Smoke tests                                              │
│  • Feature verification                                     │
│  • Cross-browser testing                                    │
│  • Mobile responsiveness                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ QA Passed
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION APPROVAL (Mana)                                  │
│  Mana reviews:                                              │
│  • All checks green?                                        │
│  • Vera signed off?                                         │
│  • Known risks acceptable?                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ Approved
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT                                       │
│  Arun: Manual trigger with confirmation                     │
│  Arun: Deploy backend to production                         │
│  Arun: Apply D1 migrations to production DB                 │
│  Arun: Deploy frontend to production                        │
│  Arun: Health check verification                            │
└──────────────────┬──────────────────────────────────────────┘
                   │ Deployed
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION VERIFICATION                                     │
│  Vera: Smoke tests on production                            │
│  Arun: Monitor error logs (15 min)                          │
│  Mana: Final sign-off                                       │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
         🌅 "New dawn has risen!"
```

## Team Communication During Deploy

### Standard Messages

**Arun (starting):**
> "Deployment started for v1.x.x. Backend deploying to staging..."

**Arun (backend complete):**
> "Backend on staging ✅. Applying D1 migrations..."

**Arun (migrations complete):**
> "Migrations applied ✅. Deploying frontend..."

**Arun (staging ready):**
> "Staging deployed: [URL]. Vera, ready for QA."

**Vera (QA complete):**
> "Staging QA passed ✅. [X] tests run, [Y] passed, [Z] skipped."

**Mana (approval):**
> "Approved for production. Arun, proceed when ready."

**Arun (production complete):**
> "Production deployed ✅. Health checks passing. Vera, smoke test please."

**Vera (production QA):**
> "Production smoke tests passed ✅."

**Arun (final):**
> "🌅 New dawn has risen! v1.x.x is live."

## Rollback Procedure

If issues found in production:

1. **Arun** immediately assesses severity
2. If critical: **Arun** executes rollback
3. **Mana** decides: hotfix vs full rollback
4. **Kaji** prepares hotfix if needed
5. **Vera** verifies fix

### Rollback Commands

```bash
# Arun's rollback (backend)
wrangler rollback --env production

# Rollback migrations (if needed - WARNING: data loss possible)
# Manual intervention required
```

## Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Local | any | localhost:3000/8787 | Development |
| Staging | main (after merge) | *.workers.dev | Pre-production |
| Production | main (after approval) | *.workers.dev | Live users |

## Checklists

### Pre-Deploy (Arun)
- [ ] CI checks passing
- [ ] Database migrations tested locally
- [ ] Secrets configured
- [ ] Rollback plan ready

### Pre-Deploy (Mana)
- [ ] Feature complete
- [ ] No critical known bugs
- [ ] Team availability confirmed

### Post-Deploy (Vera)
- [ ] Smoke tests pass
- [ ] Critical paths verified
- [ ] No console errors

### Post-Deploy (Arun)
- [ ] Health checks green
- [ ] Error logs monitored (15 min)
- [ ] Performance metrics normal

## Documentation

- **Full Plan:** `.kimi/plans/DEPLOYMENT_PLAN_v1.md`
- **Workflows:** `.github/workflows/`
- **Arun's Skill:** `.kimi/skills/devops/SKILL.md`

---

*Every deployment is a new dawn 🌅*  
*Managed by Arun, approved by Mana, verified by Vera, built by Kaji*
