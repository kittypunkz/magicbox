# Deployment Pipeline

**Managed by:** Arun (DevOps) + Mana (PO)

## Overview

**⚠️ NO STAGING ENVIRONMENT** - Only Local → Production.

Deployments go directly to production after local verification and Mana's approval.

## Deployment Flow

**⚠️ NO STAGING - Direct to Production after Local Verification**

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
│  LOCAL VERIFICATION                                          │
│  Kaji: Test locally with production DB (if possible)        │
│  Vera: Full QA on local environment                         │
└──────────────────┬──────────────────────────────────────────┘
                   │ Verified locally
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  MERGE TO MAIN                                               │
│  PR merged to main branch                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │ Ready for deploy
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION APPROVAL (Mana)                                  │
│  Mana reviews:                                              │
│  • All CI checks green?                                     │
│  • Local verification passed?                               │
│  • Known risks acceptable?                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ Approved
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT                                       │
│  Arun: Manual trigger with confirmation                     │
│  Arun: Apply D1 migrations (tested locally first!)          │
│  Arun: Deploy backend to production                         │
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

**Kaji (local ready):**
> "Feature ready for QA. Tested locally ✅"

**Vera (local QA complete):**
> "Local QA passed ✅. Ready for production deploy."

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
| ~~Staging~~ | ~~develop~~ | ~~*.workers.dev~~ | ~~NOT AVAILABLE~~ |
| Production | main (after approval) | *.workers.dev | Live users |

## Checklists

### Pre-Deploy (Arun) - NO STAGING!
- [ ] CI checks passing
- [ ] Database migrations tested locally (CRITICAL!)
- [ ] Secrets configured
- [ ] Rollback plan ready
- [ ] Team aware: direct to production

### Pre-Deploy (Mana) - NO STAGING!
- [ ] Feature complete
- [ ] Local verification passed
- [ ] No critical known bugs
- [ ] Team availability confirmed
- [ ] Risk of no staging environment accepted

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
