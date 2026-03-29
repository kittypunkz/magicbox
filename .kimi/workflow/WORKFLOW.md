# GSD-Inspired Workflow for OpenClaw

Adopted from [get-shit-done](https://github.com/gsd-build/get-shit-done) patterns.

## The Flow

```
User: "Add feature X"
    │
    ▼
1. UNDERSTAND (prevent context rot)
   → Ask clarifying questions
   → Extract v1/v2/out-of-scope
   → Capture user preferences
    │
    ▼
2. RESEARCH (investigate before coding)
   → Read existing code
   → Search for solutions
   → Document findings
    │
    ▼
3. PLAN (spec-driven)
   → Create technical spec
   → Define acceptance criteria
   → Break into tasks
    │
    ▼
4. BUILD (execute)
   → Implement with agents
   → Status updates every step
   → E2E tests before deploy
    │
    ▼
5. DELIVER
   → Deploy to dev
   → Wait for feedback
   → Deploy to prod (with permission)
    │
    ▼
6. LEARN (auto-improve)
   → What worked?
   → What didn't?
   → Update workflow docs
```

## Commands (Internal)

These aren't CLI commands — they're workflow steps I follow:

### `/understand` — Before Building
Ask clarifying questions:
- What problem does this solve?
- What does "done" look like?
- What are the edge cases?
- What should NOT be built?

### `/research` — Before Coding
- Read relevant existing code
- Search for open-source solutions
- Check if similar patterns exist in the codebase
- Document findings in `docs/research/`

### `/plan` — Before Implementation
- Create technical spec at `docs/specs/[feature].md`
- Define acceptance criteria
- Break into tasks with dependencies
- Estimate effort

### `/build` — Execute
- Status updates to #agent-status
- Run E2E tests before deploy
- Deploy to dev first
- Wait for feedback

### `/deliver` — Ship
- Deploy to dev
- User tests
- Deploy to prod (with permission)

### `/learn` — After Completion
- Save learnings to memory
- Update workflow docs
- What could be better?
