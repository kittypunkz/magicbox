# 🚀 Pipeline Quick Reference

## One-Line Usage

```
"Add [feature description]"
```

That's it. I'll run the full pipeline.

---

## Pipeline Phases

| Phase | Agent | Duration | What It Does |
|-------|-------|----------|--------------|
| 1 | 🏗️ Architect | 2-5 min | Creates technical spec |
| 2 | 💻 Developer | 5-15 min | Implements code |
| 3 | 🧪 QA | 3-8 min | Reviews & validates |

---

## Common Commands

### Full Pipeline (Default)
```
"Add dark mode to the app"
"Create a feature to export notes as PDF"
"Fix the search bug where results don't update"
```

### See Architecture First
```
"Show me the technical spec for [feature]"
"Plan the architecture for [feature]"
```

### Skip to Implementation
```
"Just implement: [feature]"
"Skip planning, I know what I want"
```

### Review Existing Code
```
"QA review this file: [path]"
"Check if this code is production-ready"
```

---

## What to Expect

### Good Requests ✅
```
"Add a 'Duplicate Note' button that creates a copy of the current note"
"Fix the bug where folders don't show note counts"
"Add keyboard shortcut Ctrl+S to save notes"
"Create an export feature that downloads notes as Markdown files"
```

### Needs More Detail ⚠️
```
"Make it better" → "What specifically?"
"Fix the bug" → "Which bug?"
"Add sharing" → "Share how? With who?"
```

---

## Output Format

After pipeline completes, you'll see:

```
✅ Feature Complete: [Feature Name]

Files Created/Modified:
1. path/to/file.ts - Description
2. path/to/file.tsx - Description

How to Use:
[Instructions]

Testing:
[How to test]
```

---

## Quality Guarantees

Every delivery includes:
- ✅ TypeScript strict mode
- ✅ Error handling
- ✅ Loading states
- ✅ Security validation
- ✅ Edge case handling
- ✅ Follows existing patterns

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Want changes | "Also make it do [X]" |
| QA rejected | "Fix the [specific issue]" |
| Too slow | "Skip architecture phase" |
| Want to see process | "Show me the pipeline output" |

---

## ❌ QA Rejection Handling

### What Happens When QA Rejects?

```
Dev Code ──▶ QA Review ──▶ ❌ REJECTED ──▶ Dev Fixes ──▶ QA Re-review
                                              ▲              │
                                              └──────────────┘
                                                    (max 3x)
```

### You'll See:
```
⚠️ QA Found Issues - Sending back to Developer...

Issues to Fix:
🔴 Critical: Missing auth check on DELETE endpoint
🔴 Critical: Unhandled promise rejection
🟡 Warning: No loading state during save

Developer is fixing issues... ⏳

✅ Fixes Applied - Re-submitting to QA...

QA Re-review: ✅ APPROVED - Code is production-ready!
```

### Maximum Iterations: 3
- Iteration 1: Initial implementation
- Iteration 2: First fixes
- Iteration 3: Final fixes
- Iteration 4+: **ESCALATION** - I review and decide

### What You Can Do:
1. **Wait** - Let the pipeline auto-fix (default)
2. **Intervene** - "Skip the fixes, show me the code anyway"
3. **Refine** - "Change the requirement to [simpler version]"

---

## Pipeline Config

Located at `.kimi/pipeline/`

To customize agents, edit:
- `.kimi/skills/architect/SKILL.md`
- `.kimi/skills/developer/SKILL.md`
- `.kimi/skills/qa/SKILL.md`

---

**Need help?** Just ask: "How do I use the pipeline?"
