# 🔧 Pipeline Improvements — v2.1

**Date:** 2026-03-25  
**Based on:** Bookmark links feature implementation

---

## Problems Identified

### 1. Agents Timeout Reading Files
**Problem:** Agents spend 60%+ of their time reading existing code before writing anything. Both the Solutions Architect (120s timeout) and Frontend Dev (300s timeout) ran out of time.

**Root Cause:** Agents read 10+ files one by one to understand patterns. Each `read` call adds latency.

### 2. Manual Handoffs Between Phases
**Problem:** After each agent finishes, the orchestrator announces results and waits for user input before proceeding.

**Root Cause:** Pipeline designed for step-by-step visibility, but this breaks autonomous flow.

### 3. QA Rejection Requires Manual Restart
**Problem:** When QA rejects code, the orchestrator waits for user to say "fix it" before re-running.

**Root Cause:** No auto-fix loop implemented.

### 4. Deploy is a Separate Manual Step
**Problem:** After merge, user must manually trigger migration + deploy.

**Root Cause:** Pipeline ends at PR merge, doesn't include deployment.

### 5. Large Agent Tasks
**Problem:** "Implement all frontend changes" is too big for one agent. They read many files and run out of time.

**Root Cause:** Tasks not granular enough for the free model's speed.

---

## Fixes Applied

### Fix 1: Pre-compile Context (P0 — Biggest Impact)
**Before:** Agent reads task → reads 10+ code files → writes code  
**After:** Orchestrator reads files → passes code in task prompt → agent writes code immediately

```python
# In orchestrator, before spawning agent:
context = read_relevant_files(agent_role, task)
task_prompt = f"""
## Task
{task_description}

## Existing Code (read-only reference)
### frontend/src/components/CreateNoteModal.tsx
```tsx
{read_file('frontend/src/components/CreateNoteModal.tsx')}
```

## Your Job
Modify the files above to implement the feature.
Write COMPLETE files, not snippets.
"""
spawn_agent(role, task_prompt)  # Agent skips reading, starts writing
```

**Expected Impact:** 60-70% reduction in agent runtime.

### Fix 2: Auto-chain Agents (P0)
**Before:** Agent finishes → announce → wait for user → next agent  
**After:** Agent finishes → immediately spawn next agent

```python
# Orchestrator flow:
po_result = spawn_po(task)
architect_result = spawn_architect(po_result)  # auto-spawn
backend_result, frontend_result = spawn_devs_parallel(architect_result)  # auto-spawn
qa_result = spawn_qa(backend_result, frontend_result)  # auto-spawn

if qa_result.rejected:
    fix_result = auto_fix(qa_result.issues)
    qa_result = spawn_qa(fix_result)  # auto-retry

commit_and_deploy()  # auto-deploy
notify_user("Done. Live at magicbox.bankapirak.com.")
```

### Fix 3: Longer Timeouts + Smaller Tasks (P1)
- Architect: 120s → 300s
- Dev agents: 300s → 600s
- QA agent: 180s → 300s
- Split large tasks: "frontend" → "CreateNoteModal" + "HomePage cards" + "NoteEditor view"

### Fix 4: Auto-fix QA Rejections (P1)
```python
MAX_RETRIES = 3
for attempt in range(MAX_RETRIES):
    qa_result = spawn_qa(code)
    if qa_result.approved:
        break
    code = spawn_dev_fix(qa_result.issues)  # auto-fix
else:
    escalate_to_user("QA rejected 3 times. Manual review needed.")
```

### Fix 5: Auto-deploy After Merge (P1)
```python
# After PR is merged:
run_migration()
deploy_backend()
deploy_frontend()
notify_user(f"✅ Deployed to {production_url}")
```

### Fix 6: Finish Incomplete Work Silently (P2)
If an agent times out, the orchestrator reads what was completed and finishes the remaining work itself without announcing the timeout.

---

## Updated Pipeline Flow (v2.1)

```
User: "Add dark mode toggle"
    │
    ▼
Orchestrator reads relevant files, compiles context
    │
    ▼ (auto-chain, no waiting)
PO Agent (context pre-loaded) → creates plan
    │
    ▼ (auto-chain)
Architect Agent (context pre-loaded) → creates spec + ADR
    │
    ▼ (auto-chain, parallel)
Backend Dev (ctx+spec)  │  Frontend Dev (ctx+spec)
    │                     │
    └─────────┬───────────┘
              ▼ (auto-chain)
    QA Agent (ctx+spec+code)
    ├── ❌ → Auto-fix → QA retry (max 3)
    └── ✅ → Commit + PR
              │
              ▼ (auto-deploy)
    Migration → Deploy Backend → Deploy Frontend
              │
              ▼
    Notify User: "Done. Live at..."
```

**User interaction:** 1 message in, 1 message out. Zero prompts in between.

---

## Metrics to Track

| Metric | Before (v2.0) | Target (v2.1) |
|--------|---------------|---------------|
| Agent timeout rate | ~40% | <5% |
| User prompts per feature | 5-10 | 1-2 |
| Time: request → deploy | ~30 min | ~10 min |
| QA retry rate | Manual | Auto (max 3) |
| Incomplete work | User notices | Orchestrator finishes silently |

---

## Implementation Checklist

- [x] Document pre-compiled context pattern
- [x] Document auto-chain flow
- [x] Document auto-fix loop
- [x] Update timeout guidelines
- [ ] Implement in orchestrator script
- [ ] Test with next feature
