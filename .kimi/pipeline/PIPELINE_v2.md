# 🚀 MagicBox Development Pipeline v2.0

## Overview
Autonomous multi-agent pipeline with continuous improvement.

**Philosophy:** PM decides everything. User only sees results.

---

## Pipeline Architecture

```
User Request
    ↓
┌─────────────────────────────────────┐
│  🎯 PM (Autonomous)                 │
│  - Analyze                          │
│  - Decide approach                  │
│  - Spawn sub-agents                 │
│  - Answer all questions             │
│  - Make all decisions               │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  🏗️ Architect                        │
│  PM answers: "Which pattern?"       │
│  PM answers: "How to structure?"    │
│  PM decides: Tech choices           │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  💻 Developer                        │
│  PM answers: "How to implement?"    │
│  PM answers: "Which library?"       │
│  PM decides: Code structure         │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  🧪 QA                               │
│  PM answers: "Is this critical?"    │
│  PM decides: Approve/Reject         │
│  PM decides: Fix or defer           │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  🎯 PM Delivery                      │
│  - Verify completion                │
│  - Log session                      │
│  - Update improvements              │
│  - Deliver to user                  │
└─────────────────────────────────────┘
```

---

## File Structure

```
.kimi/
├── README.md                    # Pipeline overview
├── QUICKREF.md                  # Quick reference
├── pipeline/
│   ├── PIPELINE_v2.md          # This file
│   ├── REJECTION_WORKFLOW.md   # QA rejection handling
│   └── USAGE.md                # How to use
├── skills/
│   ├── product-manager/        # PM skill (autonomous)
│   ├── architect/              # Architect skill
│   ├── developer/              # Dev skill + tech stack
│   └── qa/                     # QA skill
├── logs/                       # Session logs
│   └── session-YYYY-MM-DD-HH-MM.log
├── sessions/                   # Session summaries
│   └── feature-xyz-summary.md
└── improvements/               # Continuous improvements
    └── 001-lesson-learned.md
```

---

## Session Lifecycle

### 1. Start Session
```
PM Actions:
1. Read .kimi/skills/product-manager/SKILL.md
2. Check .kimi/sessions/ for context
3. Create log file: .kimi/logs/session-{timestamp}.log
4. Log: "Session started: [feature]"
```

### 2. Execute Pipeline
```
For each phase:
1. Spawn sub-agent with context
2. Answer any questions immediately
3. Make all decisions
4. Log key decisions to session log
5. Receive output
6. Move to next phase
```

### 3. Handle Iterations
```
If QA rejects:
1. PM reviews rejection reasons
2. PM decides: Accept rejection or override
3. If accept: Send back to Dev with specific fixes
4. Log iteration to session log
5. Max 3 iterations, then escalate to user
```

### 4. End Session
```
PM Actions:
1. Verify deliverable meets requirements
2. Create session summary: .kimi/sessions/{feature}-summary.md
3. If problems found, create improvement note
4. Delete temporary files
5. Clean up logs (keep last 10)
6. Deliver to user
```

---

## Decision Authority

### PM Decides (No Escalation)
- Technology choices
- Architecture patterns
- Implementation details
- File organization
- Code style
- Test strategy
- Refactoring scope
- Performance optimizations

### PM Escalates to User
- Cloud resource costs
- Database deletion
- System-level changes
- API credentials/billing
- Security policy changes
- Production deployment

---

## Logging System

### Log File Format
`.kimi/logs/session-YYYY-MM-DD-HHMM.log`

```
=== Session: [Feature Name] ===
Start: [Timestamp]

[PHASE 1: Architect]
- Decision: Used Repository pattern (reason: ...)
- Output: [Summary]
- Duration: [X minutes]

[PHASE 2: Developer]
- Decision: Added retry logic (reason: ...)
- Issues: None
- Output: [Summary]
- Duration: [X minutes]

[PHASE 3: QA]
- Iteration 1: [Result]
- Decision: Approved with minor suggestions
- Duration: [X minutes]

[END]
Total Duration: [X minutes]
Result: ✅ SUCCESS / ❌ FAILED
```

### Session Summary Format
`.kimi/sessions/{feature}-summary.md`

```markdown
# Session: [Feature Name]
**Date:** YYYY-MM-DD
**Duration:** X minutes
**Status:** ✅ Complete

## Request
[What user asked for]

## Decisions Made
| Decision | Reason |
|----------|--------|
| Used X pattern | Better for Y reason |
| Added Z library | Handles edge cases |

## Files Changed
- `path/to/file.ts` - [description]

## Iterations
- Architect → Dev → QA: 1 iteration (minor fix)

## Problems Encountered
None / [Description]

## Improvements Made
None / [Link to improvement file]

## Deliverable
[What was delivered]
```

---

## Continuous Improvement

### When to Create Improvement Note

| Trigger | Action |
|---------|--------|
| QA needed 3+ iterations | Create improvement note |
| Bug found after delivery | Create improvement note |
| Sub-agent confusion | Update skill file |
| Performance issue | Update skill file |
| Pattern inconsistency | Update skill file |

### Improvement File Template
`.kimi/improvements/XXX-title.md`

```markdown
# Improvement: [Title]

**ID:** 001
**Date:** YYYY-MM-DD
**Session:** [link to session]

## Problem
[What went wrong]

## Root Cause
[Why it happened]

## Solution
[What was changed]

## Changes Made
- [ ] Updated [skill file]
- [ ] Added [checklist item]
- [ ] Modified [template]

## Prevention
[How to prevent in future]
```

---

## Cleanup Rules

### After Each Session
- Delete temporary files in `/tmp` or similar
- Keep only last 10 log files in `.kimi/logs/`
- Archive old session summaries (keep last 20)

### Monthly
- Review `.kimi/improvements/`
- Integrate improvements into skill files
- Archive old logs

---

## Usage

### User Says
> "Add a feature to export notes as PDF"

### PM Does
1. Log start: `.kimi/logs/session-2026-03-20-1430.log`
2. Spawn Architect (answer all questions)
3. Spawn Developer (answer all questions)
4. Spawn QA (answer all questions, handle iterations)
5. Create summary: `.kimi/sessions/export-pdf-summary.md`
6. If issues found, create: `.kimi/improvements/002-pdf-handling.md`
7. Delete temp files
8. Deliver to user

### User Gets
```
✅ Feature Complete: Export Notes as PDF

📁 Files Created:
- backend/src/routes/export.ts
- frontend/src/components/ExportButton.tsx

🚀 How to Use:
[Instructions]

📊 Session Stats:
- Duration: 12 minutes
- Iterations: 1 (minor QA fix)
- Decisions made: 5
```

---

## Success Criteria

- ✅ Zero files in root directory
- ✅ All logs in `.kimi/logs/`
- ✅ All summaries in `.kimi/sessions/`
- ✅ User never sees internal questions
- ✅ Sub-agents never wait for user
- ✅ Pipeline improves with each session
- ✅ Fast delivery (no approval delays)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-20 | Initial pipeline |
| 2.0 | 2026-03-20 | Autonomous PM, file management, continuous improvement |
