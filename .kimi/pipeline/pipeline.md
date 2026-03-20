# 🔄 Multi-Agent Development Pipeline

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│    Architect    │────▶│    Dev      │────▶│     QA      │
│   Request   │     │    (Planner)    │     │ (Implement) │     │  (Review)   │
└─────────────┘     └─────────────────┘     └─────────────┘     └──────┬──────┘
                                                                       │
                    ┌──────────────────────────────────────────────────┘
                    ▼
           ┌─────────────────┐
           │   APPROVED ✅   │────▶ Submit to user
           │  REJECTED ❌    │────▶ Back to Dev with feedback
           └─────────────────┘
```

## Pipeline Flow

### Phase 1: Architecture (Architect Agent)
**Input**: User requirement  
**Output**: Technical Specification  
**Time**: ~2-5 minutes

```
User: "Add a folder sharing feature"
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  Architect Agent analyzes:                          │
│  - Current codebase structure                       │
│  - Database schema requirements                     │
│  - API endpoint design                              │
│  - Component architecture                           │
│  - Security considerations                          │
│                                                     │
│  Output: Technical Specification document           │
└─────────────────────────────────────────────────────┘
```

### Phase 2: Development (Dev Agent)
**Input**: Technical Specification  
**Output**: Implementation + Test Files  
**Time**: ~5-15 minutes

```
Technical Specification
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  Dev Agent implements:                              │
│  - Database migrations (if needed)                  │
│  - API routes with validation                       │
│  - Frontend components                              │
│  - Integration code                                 │
│  - Type definitions                                 │
│  - Error handling                                   │
│                                                     │
│  Output: Complete, working code                     │
└─────────────────────────────────────────────────────┘
```

### Phase 3: QA Review (QA Agent)
**Input**: Implementation + Original Requirements  
**Output**: QA Report (APPROVED/REJECTED)  
**Time**: ~3-8 minutes

```
Implementation
  │
  ▼
┌─────────────────────────────────────────────────────┐
│  QA Agent reviews:                                  │
│  - Requirements match                               │
│  - Code quality                                     │
│  - Security                                         │
│  - Performance                                      │
│  - Edge cases                                       │
│  - Error handling                                   │
│                                                     │
│  Output: QA Report with verdict                     │
└─────────────────────────────────────────────────────┘
```

### Phase 4: Resolution

```
QA Verdict:
│
├── ✅ APPROVED ───────────────────────┐
│   - Present final code to user       │
│   - Show summary of changes          │
│   - Provide usage instructions       │
│                                      │
└── ❌ REJECTED ───────────────────────┘
    - Send QA feedback to Dev Agent
    - Dev Agent fixes issues
    - Re-submit to QA
    - Loop until approved
```

---

## Agent Communication Protocol

### 1. Architect → Dev Handoff

```markdown
## 📋 Technical Specification
**Feature**: [Name]
**Date**: [Date]

### Overview
[Summary]

### ADRs
[Architecture decisions]

### Interface Definitions
```typescript
[Exact types/interfaces]
```

### Component Design
```
[Component hierarchy]
```

### API Design
```typescript
[Endpoint signatures]
```

### Implementation Notes
[Critical details]

### Definition of Done
- [ ] Checklist items
```

### 2. Dev → QA Handoff

```markdown
## 📝 Implementation
**Based on**: [Spec reference]

### Files Changed
- `path/to/file.ts` - [description]

### Implementation Notes
[Any deviations, testing instructions]

### Testing
[How to test]
```

### 3. QA → Resolution Handoff

```markdown
## 🧪 QA Report
**Verdict**: ✅ APPROVED / ❌ REJECTED

### Issues
[If rejected: specific issues with file:line]

### Feedback for Dev
[Actionable fixes needed]
```

---

## Implementation Example

### User Request
> "Add a feature to export notes as Markdown files"

### Pipeline Execution

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ARCHITECT PHASE                                          │
├─────────────────────────────────────────────────────────────┤
│ • Analyzes current export functionality (if any)            │
│ • Designs export API endpoint                               │
│ • Designs UI component (export button + format selector)    │
│ • Considers file download mechanism                         │
│ • Creates Technical Spec                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DEV PHASE                                                │
├─────────────────────────────────────────────────────────────┤
│ • Implements /api/notes/:id/export endpoint                 │
│ • Implements ExportButton component                         │
│ • Adds file download logic                                  │
│ • Handles errors (no note, network fail)                    │
│ • Creates tests                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. QA PHASE                                                 │
├─────────────────────────────────────────────────────────────┤
│ • Verifies export creates valid Markdown                    │
│ • Tests error scenarios                                     │
│ • Checks file naming convention                             │
│ • Reviews security (no path traversal)                      │
│ • APPROVED ✅                                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. USER PRESENTATION                                        │
├─────────────────────────────────────────────────────────────┤
│ • Shows final code                                          │
│ • Explains how to use feature                               │
│ • Notes any limitations                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Quality Gates

### Gate 1: Architecture Review
- [ ] Specification is complete
- [ ] No ambiguous requirements
- [ ] Technical decisions documented
- [ ] Security considered

### Gate 2: Development Complete
- [ ] All files implemented
- [ ] TypeScript compiles
- [ ] No placeholder/TODO code
- [ ] Error handling present

### Gate 3: QA Approval
- [ ] Requirements met
- [ ] No critical issues
- [ ] Code quality acceptable
- [ ] Ready for production

---

## Error Handling

### If Architect produces poor spec
- Main agent reviews and sends back for revision
- Or: Dev agent asks clarifying questions

### If Dev produces poor code
- QA rejects with specific feedback
- Dev iterates until approved
- Max 3 iterations, then escalate to main agent

### If QA is too strict/lenient
- Main agent reviews QA report
- Adjusts QA agent parameters if needed

---

## Parallel Execution Opportunities

Some tasks can run in parallel:

```
User Request
    │
    ▼
┌─────────────┐
│  Architect  │
└──────┬──────┘
       │
       ▼
┌─────────────┬─────────────┐
│ Backend Dev │ Frontend Dev│  ← Parallel
└──────┬──────┴──────┬──────┘
       │             │
       └──────┬──────┘
              ▼
       ┌─────────────┐
       │     QA      │
       └─────────────┘
```
