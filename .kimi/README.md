# 🤖 Kimi Multi-Agent Pipeline v2.0

**AUTONOMOUS MODE:** PM makes all decisions. You only see results.

## Quick Start

```
You: "Add a feature"
    ↓
🎯 PM (Decides everything)
    ↓
🏗️ Architect → 💻 Developer → 🧪 QA
    ↓
You: ✅ "Done"
```

**No questions. No approvals. Just delivery.**

---

## What's New in v2.0

1. **🎯 Autonomous PM** - Makes all technical decisions without bothering you
2. **🗂️ Organized Files** - Logs, summaries, and improvements in `.kimi/`
3. **📈 Continuous Improvement** - Pipeline gets better with each session

---

## Structure

```
.kimi/
├── README.md                    # This file
├── QUICKREF.md                  # Quick reference card
├── pipeline/
│   ├── PIPELINE_v2.md          # ✅ Main pipeline documentation (NEW)
│   ├── REJECTION_WORKFLOW.md   # QA rejection handling
│   └── USAGE.md                # How to use
├── skills/
│   ├── product-manager/        # 🎯 PM skill (AUTONOMOUS)
│   ├── architect/              # 🏗️ Architect skill
│   ├── developer/              # 💻 Dev skill + tech stack
│   └── qa/                     # 🧪 QA skill
├── logs/                       # 📋 Session logs
│   └── session-YYYY-MM-DD.log
├── sessions/                   # 📄 Session summaries
│   └── feature-xyz-summary.md
└── improvements/               # 📈 Continuous improvements
    └── 001-lesson-learned.md
```

## How It Works

1. **You** describe what you want
2. **Architect Agent** creates technical specification
3. **Dev Agent** implements production-ready code
4. **QA Agent** reviews and validates
5. **You** receive perfect, deployable code

## Usage

Just tell me what feature you want:

> "Add a way to export notes as PDF"

I'll run the pipeline and deliver production-ready code.

## Documentation

### Pipeline
- [Pipeline Architecture](./pipeline/pipeline.md)
- [Agent Configurations](./pipeline/AGENTS.md)
- [Usage Guide](./pipeline/USAGE.md)
- [QA Rejection Workflow](./pipeline/REJECTION_WORKFLOW.md)

### Team Skills
- [Team Skills Reference](./docs/TEAM_SKILLS.md) - Complete skill requirements
- [Skills Quick Reference](./docs/SKILLS_QUICKREF.md) - At-a-glance skills
- [Product Manager Skill](./skills/product-manager/SKILL.md) - Main agent role

## Agents

| Agent | Role | Output |
|-------|------|--------|
| 🏗️ Architect | Plans technical implementation | Technical Specification |
| 💻 Developer | Writes code | Implementation |
| 🧪 QA | Reviews quality | QA Report (APPROVED/REJECTED) |

---

**Note**: This pipeline ensures every code delivery is production-ready with zero defects.
