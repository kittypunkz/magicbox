# Team Setup Guide: Deploy Mana + Team to Any Project

**Quick Start:** Get the full autonomous team (Mana, Rupa, Kaji, Vera, Arun) running on any project.

---

## Option 1: Quick Setup (5 minutes)

For existing projects that just need the team structure.

### Step 1: Create Directory Structure

```bash
mkdir -p .kimi/{pipeline,skills/{architect,developer,qa,devops},plans,docs,sessions,logs}
```

### Step 2: Copy Essential Files

From this project, copy these files to your new project:

```
.kimi/
├── pipeline/
│   └── DEPLOYMENT.md          # Deployment flow
├── skills/
│   ├── architect/SKILL.md     # Rupa's role
│   ├── developer/SKILL.md     # Kaji's role
│   ├── qa/SKILL.md            # Vera's role
│   └── devops/SKILL.md        # Arun's role
└── docs/
    └── TEAM_MANIFEST.md       # Team identities
```

### Step 3: Create AGENTS.md (Root)

Create `AGENTS.md` in project root:

```markdown
# Autonomous Team Pipeline

**Product Owner:** Mana (มานะ) - Make determined effort
**Team:** Rupa (Architect), Kaji (Developer), Vera (QA), Arun (DevOps)

## Quick Commands

```bash
# Start feature
@Mana: Plan feature X

# Code review
@Vera: Review PR #X

# Deploy
@Arun: Deploy to production
```

## Pipeline Docs
- Deployment: `.kimi/pipeline/DEPLOYMENT.md`
- Team Manifest: `.kimi/docs/TEAM_MANIFEST.md`
```

### Step 4: Initialize Team

Tell Mana:
> "Initialize team for this project. Tech stack: [your stack]"

Mana will:
1. Read existing codebase
2. Brief Rupa on architecture
3. Set Kaji's development context
4. Prepare Vera's QA checklist
5. Inform Arun of deployment needs

---

## Option 2: Full Setup (15 minutes)

For new projects or complete pipeline integration.

### Complete Directory Structure

```
.kimi/
├── pipeline/                  # Process documentation
│   ├── DEPLOYMENT.md         # Deployment flow
│   ├── REJECTION_WORKFLOW.md # QA rejection handling
│   └── USAGE.md              # How to use the team
├── skills/                    # Agent skills
│   ├── architect/SKILL.md    # Rupa
│   ├── developer/
│   │   ├── SKILL.md          # Kaji's main skill
│   │   └── TECH_STACK_SKILL.md # Tech-specific guidance
│   ├── qa/SKILL.md           # Vera
│   └── devops/SKILL.md       # Arun
├── docs/                      # Team documentation
│   ├── TEAM_MANIFEST.md      # Team identities & flow
│   ├── SKILLS_QUICKREF.md    # Quick reference
│   └── TEAM_SKILLS.md        # Cross-team skills
├── plans/                     # Project plans
├── sessions/                  # Session summaries
├── logs/                      # Execution logs
└── improvements/              # Continuous improvement
```

### Required Configuration Files

#### 1. `.kimi/docs/TEAM_MANIFEST.md`

```markdown
# Team Manifest

## Mana (PO)
Meaning: Make determined effort
Role: Delegation, planning, decisions

## Rupa (Architect)
Meaning: Form, structure
Role: Design systems, plan architecture

## Kaji (Developer)
Meaning: Build, construct
Role: Write code, implement features

## Vera (QA)
Meaning: Truth, verification
Role: Test, verify, validate

## Arun (DevOps)
Meaning: Dawn, new beginning
Role: CI/CD, deployment, infrastructure
```

#### 2. `.kimi/pipeline/DEPLOYMENT.md`

Minimal version:
```markdown
# Deployment Pipeline

## Environments
- Local: Development
- Production: Live

## Flow
1. Kaji codes → PR
2. CI checks pass
3. Vera verifies locally
4. Mana approves
5. Arun deploys to production
```

#### 3. Agent Skills (Minimal)

Each skill file needs:
- Agent name & meaning
- Core responsibilities
- Tech stack for THIS project
- Commands reference
- Handoff protocol

Example for Kaji (Developer):
```markdown
# Kaji (Developer)

## Role
Write code, implement features, fix bugs.

## Tech Stack (Project-Specific)
- Frontend: React + TypeScript + Vite
- Backend: Hono + Cloudflare Workers
- Database: D1 (SQLite)

## Commands
```bash
npm run dev          # Start dev server
npm run typecheck    # TypeScript check
npm run build        # Production build
```

## Handoff
- Receive: Architecture from Rupa
- Deliver: Code to Vera for QA
```

---

## Option 3: Template Repository (Recommended)

Create a template repo with the team pre-configured.

### Template Structure

```
template-autonomous-team/
├── .kimi/
│   ├── pipeline/
│   │   └── DEPLOYMENT.md
│   ├── skills/
│   │   ├── architect/SKILL.md
│   │   ├── developer/SKILL.md
│   │   ├── qa/SKILL.md
│   │   └── devops/SKILL.md
│   ├── docs/
│   │   └── TEAM_MANIFEST.md
│   └── README.md
└── AGENTS.md
```

### Usage

1. **Copy template** to new project
2. **Update tech stack** in skill files
3. **Customize** deployment flow if needed
4. **Tell Mana** to initialize

---

## Mana's Initialization Checklist

When starting a new project, Mana will:

```markdown
## Project Onboarding (Mana)

### 1. Understand Project
- [ ] Read README / docs
- [ ] Identify tech stack
- [ ] Understand architecture
- [ ] Identify deployment target

### 2. Brief Team
- [ ] Rupa: Review architecture, identify patterns
- [ ] Kaji: Understand codebase, build commands
- [ ] Vera: Prepare QA checklist
- [ ] Arun: Understand deployment needs

### 3. Establish Workflow
- [ ] Confirm deployment flow
- [ ] Set communication style
- [ ] Define done criteria

### 4. Document
- [ ] Create session summary
- [ ] Log any issues
- [ ] Update team manifest if needed
```

---

## Minimal Viable Team (MVT)

If you want just the essentials:

**Required:**
1. `AGENTS.md` (root) - Explains the team
2. `.kimi/docs/TEAM_MANIFEST.md` - Team identities
3. One skill file per agent (can be minimal)

**Optional:**
- Pipeline docs (deployment, workflows)
- Plans directory
- Logs directory
- Improvement tracking

---

## Communication Patterns

Once set up, talk to the team by name:

```
"Mana, plan the auth feature"
"Rupa, design the database schema"
"Kaji, implement the login page"
"Vera, test the registration flow"
"Arun, set up CI/CD"
```

Or let Mana delegate:

```
"Mana, we need user authentication"
→ Mana plans
→ Rupa designs
→ Kaji implements
→ Vera tests
→ Arun deploys
```

---

## Tech Stack Customization

Update skill files for your stack:

| Your Stack | Update In |
|------------|-----------|
| React/Vue/Svelte | `developer/SKILL.md` |
| Node/Python/Go | `developer/SKILL.md` |
| AWS/GCP/Azure | `devops/SKILL.md` |
| Docker/K8s | `devops/SKILL.md` |
| Postgres/Mongo/Dynamo | `architect/SKILL.md` |

---

## Quick Reference

### Start New Project
```bash
# 1. Copy team structure
cp -r template-autonomous-team/.kimi my-project/

# 2. Create AGENTS.md
echo "# Autonomous Team\n\nMana (PO), Rupa, Kaji, Vera, Arun" > AGENTS.md

# 3. Tell Mana to initialize
"Mana, initialize team for this project"
```

### Add Team to Existing Project
```bash
# 1. Create minimal structure
mkdir -p .kimi/{skills/{developer,qa},docs}

# 2. Copy minimal files
cp template/TEAM_MANIFEST.md .kimi/docs/
cp template/developer/SKILL.md .kimi/skills/developer/
cp template/qa/SKILL.md .kimi/skills/qa/

# 3. Start working
"Mana, we're adding a new feature"
```

---

## Success Metrics

You'll know the team is working when:
- ✅ Mana delegates without you micromanaging
- ✅ Agents refer to each other by name
- ✅ Handoffs happen automatically
- ✅ You only talk to Mana (PO)
- ✅ Code is delivered with QA sign-off

---

**Ready to deploy the team?** Just say:
> "Mana, initialize team for [project name] with [tech stack]"

*The dawn of autonomous development 🌅*
