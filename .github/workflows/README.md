# GitHub Actions Workflows

This directory contains all CI/CD workflows for MagicBox.

## Workflows Overview

| File | Trigger | Purpose |
|------|---------|---------|
| `deploy.yml` | Push to main | Auto-deploy on code changes |
| `manual-deploy.yml` | Manual button | On-demand deployment with options |
| `mention-deploy.yml` | PR/issue comment | Deploy by commenting `@deploy` |
| `pr-check.yml` | Pull request | Validate code before merge |
| `release.yml` | Git tag | Production releases |
| `scheduled-backup.yml` | Daily cron | Automatic database backups |

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      TRIGGER OPTIONS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PUSH TO MAIN ───────┐                                   │
│     (Auto-deploy)       │                                   │
│                         ▼                                   │
│  2. MANUAL BUTTON ─────►┌─────────────┐                     │
│     (GitHub Actions)    │   DEPLOY    │                     │
│                         │   WORKFLOW  │                     │
│  3. COMMENT @deploy ───►│             │                     │
│     (PR/Issue)          │  • Backend  │                     │
│                         │  • Frontend │                     │
│  4. GIT TAG ───────────►│  • Database │                     │
│     (Release)           └──────┬──────┘                     │
│                                │                            │
│  5. CLI TRIGGER ───────────────┘                            │
│     (Local terminal)                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  CLOUDFLARE     │
                    │  • Workers      │
                    │  • Pages        │
                    │  • D1 Database  │
                    └─────────────────┘
```

## Required Secrets

Set these in GitHub repo settings:

- `CLOUDFLARE_API_TOKEN` - From Cloudflare profile
- `CLOUDFLARE_ACCOUNT_ID` - `49b16ed3ff0d8209f2a3da300341283b`
- `VITE_API_URL` - `https://api.magicbox.bankapirak.com`

## Usage Examples

### Deploy via Comment
```markdown
PR Comment:
@deploy backend

→ Deploys only backend
```

### Deploy via Git Tag
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

→ Creates release + deploys
```

### Deploy via CLI
```bash
node trigger-deploy.js frontend

→ Triggers GitHub Actions
```
