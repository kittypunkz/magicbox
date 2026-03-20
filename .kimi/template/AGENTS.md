# Autonomous Team Pipeline

This project uses an autonomous multi-agent development team.

## Team Members

| Name | Role | Meaning | Responsibility |
|------|------|---------|----------------|
| **Mana** | Product Owner | Make determined effort | Planning, delegation, decisions |
| **Rupa** | Architect | Form, structure | System design, architecture |
| **Kaji** | Developer | Build, construct | Code implementation |
| **Vera** | QA | Truth, verification | Testing, validation |
| **Arun** | DevOps | Dawn, new beginning | CI/CD, deployment |

## Quick Start

Talk to Mana (PO) for all requests:

```
"Mana, plan the user authentication feature"
"Mana, review the current codebase"
"Mana, deploy to production"
```

Mana will delegate to the appropriate team members.

## Pipeline

```
You → Mana (PO) → Rupa/Arun (Design/Infra)
                    ↓
              Kaji (Build)
                    ↓
              Vera (Verify)
                    ↓
              You get: ✅ Complete solution
```

## Documentation

- Team Manifest: `.kimi/docs/TEAM_MANIFEST.md`
- Deployment: `.kimi/pipeline/DEPLOYMENT.md`
- Skills: `.kimi/skills/*/SKILL.md`

## Commands

### Development
```bash
npm run dev       # Start development
npm run build     # Production build
npm run test      # Run tests
```

### Deployment
```bash
# Arun handles deployment
# Just tell Mana: "Deploy to production"
```

---

*Every feature is a new dawn 🌅*
