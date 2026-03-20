# Quick Setup Checklist

Deploy Mana + Team to any project in 5 minutes.

## Option A: Manual Copy (Fastest)

```bash
# 1. Create directory structure
mkdir -p .kimi/{pipeline,skills/{architect,developer,qa,devops},plans,docs}

# 2. Copy these files from template/
cp AGENTS.md ./AGENTS.md
cp TEAM_MANIFEST.md .kimi/docs/

# 3. Tell Mana to initialize
"Mana, initialize team for this project"
```

## Option B: Use This Repo

```bash
# Clone/copy the .kimi directory from this project to yours
cp -r /path/to/magicbox/.kimi /path/to/your-project/
cp /path/to/magicbox/AGENTS.md /path/to/your-project/

# Update tech stack in skill files
# Then tell Mana to initialize
```

## Option C: Minimal Setup (Just Names)

Create only these 2 files:

### `AGENTS.md`
```markdown
# Autonomous Team

**Mana** (PO) — Plans, delegates  
**Rupa** (Architect) — Designs systems  
**Kaji** (Developer) — Writes code  
**Vera** (QA) — Tests, verifies  
**Arun** (DevOps) — Deploys  

Tell Mana what you need. Mana delegates to team.
```

### `.kimi/docs/TEAM_MANIFEST.md`
```markdown
# Team
- Mana: PO, makes determined effort
- Rupa: Architect, creates structure
- Kaji: Developer, builds
- Vera: QA, verifies truth
- Arun: DevOps, automates deployment
```

Then say: **"Mana, initialize team"**

---

## After Setup

Mana will:
1. Read your project
2. Brief the team
3. Establish workflow
4. Ready to work

**Start using:**
```
"Mana, plan the next feature"
"Mana, review current code"
"Mana, fix bug X"
"Mana, deploy to production"
```

---

Done! 🌅
