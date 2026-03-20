# 📖 Pipeline Usage Guide

## Quick Start

This multi-agent pipeline ensures every code delivered is **production-ready** through 3 phases:

```
User Request → Architect → Developer → QA → ✅ Production Code
```

---

## How to Use (As User)

### Option 1: Simple Feature Request

Just tell me what you want:

> **You**: "Add a feature to pin important notes to the top"

**What happens:**
1. I spawn **Architect Agent** → Creates technical spec
2. I spawn **Dev Agent** → Implements the code
3. I spawn **QA Agent** → Reviews and approves
4. I present you the **final code** with instructions

### Option 2: See the Process

> **You**: "Show me the pipeline process for adding search filters"

I'll show you each phase's output:
1. Technical Specification
2. Implementation
3. QA Report
4. Final Code

### Option 3: Iterative Refinement

> **You**: "The implementation needs to also handle [X]"

The pipeline re-runs with updated requirements.

---

## Example Session

### User Request
```
User: I want to add a "Duplicate Note" feature
```

### Phase 1: Architecture
```
Main Agent → Spawns Architect

Output: Technical Specification
═══════════════════════════════════════════════════════════════
## Feature: Duplicate Note

### Overview
Allow users to duplicate an existing note with a single click.
The duplicated note will have "(Copy)" appended to the title.

### API Design
POST /api/notes/:id/duplicate
Response: { success: true, data: { id: string } }

### UI Design
- Add "Duplicate" option to note context menu
- Add duplicate icon button in note toolbar

### Database
No schema changes. Reuses INSERT with existing note data.

### Implementation Notes
1. Copy all fields except id and created_at
2. Append " (Copy)" to title
3. Place in same folder as original
4. Handle case where title + " (Copy)" exceeds max length
═══════════════════════════════════════════════════════════════
```

### Phase 2: Development
```
Main Agent → Spawns Developer with spec

Output: Implementation
═══════════════════════════════════════════════════════════════
Files Created:
- backend/src/routes/notes.ts (adds duplicate endpoint)
- frontend/src/components/DuplicateButton.tsx
- frontend/src/hooks/useDuplicateNote.ts

Implementation Notes:
- Endpoint validates note exists and user has access
- Truncates title if " (Copy)" exceeds 255 chars
- Returns 404 if note not found
- Shows toast notification on success
═══════════════════════════════════════════════════════════════
```

### Phase 3: QA Review
```
Main Agent → Spawns QA Agent

Output: QA Report
═══════════════════════════════════════════════════════════════
## QA Report: Duplicate Note Feature

Verdict: ✅ APPROVED

Requirements Check:
✅ Can duplicate a note
✅ "(Copy)" appended to title
✅ Context menu option works
✅ Toolbar button works

Code Quality: 9/10
✅ Proper TypeScript types
✅ Error handling present
✅ Loading state implemented
⚪ Suggestion: Add keyboard shortcut (optional)

No critical issues found. Code is production-ready.
═══════════════════════════════════════════════════════════════
```

### Phase 4: Delivery
```
Main Agent presents to user:

✅ Feature Complete: Duplicate Note

Files Created:
1. backend/src/routes/notes.ts - API endpoint
2. frontend/src/components/DuplicateButton.tsx - UI button
3. frontend/src/hooks/useDuplicateNote.ts - Logic hook

How to Use:
1. Right-click any note → Select "Duplicate"
2. Or open note → Click duplicate icon in toolbar
3. Duplicated note appears in same folder with " (Copy)" suffix

Testing:
1. Create a note: "My Meeting Notes"
2. Click Duplicate
3. Verify new note: "My Meeting Notes (Copy)"
```

---

## Pipeline Commands (For Reference)

These are the internal commands I use to orchestrate:

```bash
# Phase 1: Architecture
Task: "As Software Architect for MagicBox, create technical spec for: [feature]. 
       Use skill at .kimi/skills/architect/SKILL.md
       Context: [relevant files]"

# Phase 2: Development  
Task: "As Dev Agent, implement this spec: [spec].
       Use skill at .kimi/skills/developer/SKILL.md
       Existing patterns: [code examples]"

# Phase 3: QA
Task: "As QA Agent, review this implementation: [code].
       Original spec: [spec]
       Use skill at .kimi/skills/qa/SKILL.md"
```

---

## Quality Guarantees

### What the Pipeline Ensures

| Quality Aspect | Guarantee |
|----------------|-----------|
| Type Safety | ✅ TypeScript strict, no `any` |
| Error Handling | ✅ All errors handled gracefully |
| Security | ✅ Input validated, no injection risks |
| Performance | ✅ No unnecessary re-renders, efficient queries |
| Completeness | ✅ No TODOs, no placeholders |
| Consistency | ✅ Follows existing code patterns |

### What You Get

Every feature delivered with:
1. **Complete code** - All files needed
2. **Working implementation** - No broken code
3. **Error handling** - Graceful failures
4. **Type safety** - Full TypeScript coverage
5. **Production ready** - Can deploy immediately

---

## Troubleshooting

### QA Rejected the Code

**What happens:**
- Code goes back to Dev Agent with QA feedback
- Dev fixes the issues
- Re-submitted to QA
- Loop continues until approved

**You see:**
```
QA found issues. Sending back to Dev for fixes...
[Fixes applied]
QA Re-review: ✅ APPROVED
```

### Feature Needs Changes

**Just ask:**
> "Can you also make it work for folders too?"

The pipeline re-runs with updated requirements.

### Something Seems Wrong

**Tell me:**
> "The implementation doesn't handle empty notes"

I'll:
1. Send feedback to Dev Agent
2. Get updated implementation
3. Re-run QA

---

## Best Practices

### For Best Results

1. **Be specific in requests**
   - Good: "Add a delete confirmation modal with 'Cancel' and 'Delete' buttons"
   - Vague: "Make deletion better"

2. **Mention edge cases if important**
   - "This needs to work offline too"
   - "Handle the case where user has 1000+ notes"

3. **Reference existing features**
   - "Similar to how the search feature works"
   - "Use the same pattern as the folder creation"

4. **Ask to see the process**
   - "Show me the technical spec first"
   - "I want to review the architecture before implementation"

---

## Pipeline Configuration

### Located at: `.kimi/pipeline/`

```
.kimi/pipeline/
├── pipeline.md       # Pipeline architecture
├── AGENTS.md         # Agent configurations
└── USAGE.md          # This file

.kimi/skills/
├── architect/SKILL.md # Architect agent definition
├── developer/SKILL.md # Dev agent definition
└── qa/SKILL.md        # QA agent definition
```

---

## ❌ Handling QA Rejections

### What Triggers a Rejection?

QA rejects code when it finds:
- 🔴 **Critical Issues**: Security holes, crashes, data loss risks
- 🟡 **Warnings**: Missing edge cases, poor UX

### The Rejection Loop

```
Developer ──▶ QA ──▶ ❌ REJECTED ──▶ Developer Fixes ──▶ QA Re-reviews
                                          ▲                    │
                                          └────────────────────┘
                                                (max 3 iterations)
```

### What You See

```
⚠️ QA Found Issues

Critical Issues:
1. Missing auth check (backend/src/routes/notes.ts:45)
2. Unhandled promise rejection (frontend/src/hooks/useNotes.ts:23)

Sending back to Developer for fixes...
[Fixing...]

✅ QA Re-review: APPROVED
```

### Rejection Severity

| Severity | Means | Action |
|----------|-------|--------|
| 🔴 Critical | Code cannot ship | Must be fixed |
| 🟡 Warning | Should improve | Should be fixed |
| 🟢 Suggestion | Nice to have | Optional |

### Maximum Iterations

After **3 rejections**, I escalate:

```
⚠️ ESCALATION: Feature rejected 3 times

Options:
1. Refine requirements
2. Re-architect the approach
3. Proceed with known issues
4. Manual review

Recommendation: [My assessment]
```

### Your Options During Rejection

1. **Let it run** (default) - Pipeline auto-fixes issues
2. **Intervene** - "Show me the code anyway"
3. **Simplify** - "Change the requirement to..."
4. **Escalate** - "Why is this failing?"

### Example Rejection Flow

**User**: "Add delete note feature"

**Iteration 1:**
- Dev: Implements delete
- QA: ❌ Missing auth check, no confirmation dialog

**Iteration 2:**
- Dev: Adds auth + confirmation
- QA: ❌ Auth has SQL injection vulnerability

**Iteration 3:**
- Dev: Fixes SQL injection
- QA: ✅ APPROVED

**Result**: Production-ready code delivered

---

## Questions?

**Q: How long does it take?**  
A: Simple features: 3-5 minutes. Complex features: 10-15 minutes.

**Q: Can I skip phases?**  
A: Yes! Tell me: "Skip architecture, just implement" or "Show me the spec first"

**Q: What if I don't like the implementation?**  
A: Tell me what's wrong. The pipeline re-runs with your feedback.

**Q: Is this automated?**  
A: I orchestrate the agents. You interact only with me.

**Q: What if QA keeps rejecting?**  
A: After 3 iterations, I escalate and review the situation manually. We can refine requirements or adjust the approach.

**Q: Can I see the rejection details?**  
A: Yes! Say "Show me the full pipeline output" to see all phases including QA reports.
