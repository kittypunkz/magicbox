# ❌ QA Rejection Workflow

## Overview

When QA rejects code, it triggers an **iteration loop** until the code meets production standards.

```
┌─────────────┐     ❌ REJECTED     ┌─────────────┐
│     QA      │────────────────────▶│     Dev     │
│   Review    │   (with feedback)   │    Fix      │
└─────────────┘                     └──────┬──────┘
      ▲                                    │
      │                                    │
      └────────── RE-SUBMIT ───────────────┘
                  (max 3 times)
```

---

## Rejection Severity Levels

### 🔴 Critical (Must Fix - Code will be rejected)
- Security vulnerabilities (XSS, SQL injection, auth bypass)
- Type errors that cause runtime failures
- Broken core functionality
- Missing error handling on critical paths
- Data loss risks

### 🟡 Warning (Should Fix - Code may be rejected)
- Missing edge case handling
- Inconsistent error messages
- Performance issues
- Code duplication
- Missing loading states

### 🟢 Suggestion (Nice to Have - Won't block approval)
- Code style improvements
- Additional comments
- Refactoring opportunities

---

## Rejection Process

### Step 1: QA Identifies Issues

QA Agent produces a **Rejection Report** with:

```markdown
# 🧪 QA Report: Feature Name

## Verdict: ❌ REJECTED

## Summary
- Files Reviewed: 5
- Critical Issues: 2  ← MUST FIX
- Warnings: 3         ← SHOULD FIX
- Suggestions: 2      ← OPTIONAL

## 🔴 Critical Issues (Blocking)

### Issue #1: Missing Auth Check
**Location**: `backend/src/routes/notes.ts:45`
**Problem**: Anyone can delete any note without ownership check
**Impact**: Security vulnerability - users can delete others' notes
**Fix**: Add ownership verification before delete

```typescript
// Current (WRONG):
app.delete('/api/notes/:id', async (c) => {
  await db.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
});

// Should be:
app.delete('/api/notes/:id', async (c) => {
  const user = c.get('user');
  const note = await db.prepare('SELECT user_id FROM notes WHERE id = ?')
    .bind(id).first();
  
  if (!note || note.user_id !== user.id) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }
  
  await db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .bind(id, user.id).run();
});
```

### Issue #2: Unhandled Promise Rejection
**Location**: `frontend/src/hooks/useNotes.ts:23`
**Problem**: async function without try/catch
**Impact**: App crashes on network error
**Fix**: Wrap in try/catch with proper error handling

## 🟡 Warnings (Should Fix)

### Warning #1: Missing Loading State
**Location**: `frontend/src/components/NoteEditor.tsx`
**Problem**: No visual feedback during save operation
**Suggestion**: Add isSaving state and spinner

## Feedback for Developer

Please fix all 🔴 CRITICAL issues before re-submission.
Address 🟡 WARNINGS if possible.

Focus on:
1. Adding auth checks to all mutating endpoints
2. Adding error boundaries to all async operations
3. Test error scenarios manually
```

### Step 2: Main Agent Routes to Developer

I (Main Agent) receive the rejection report and spawn the **Developer Agent** with:

```markdown
## 🔄 QA Rejection - Fixes Required

### Your Previous Implementation
[Previous code]

### QA Rejection Report
[Full QA report with specific issues]

### Your Task
Fix ALL critical issues identified by QA.

Requirements:
1. Address every 🔴 CRITICAL issue with the suggested fix
2. Test your changes compile and work correctly
3. Maintain existing functionality
4. Follow the same patterns as before

### Re-submission Checklist
- [ ] All critical issues fixed
- [ ] TypeScript compiles without errors
- [ ] No new issues introduced
- [ ] Implementation notes updated

### Iteration Count
This is iteration 2/3. After 3 rejections, escalation is required.
```

### Step 3: Developer Fixes Issues

Developer Agent:
1. Reviews each issue carefully
2. Applies fixes with exact file:line references
3. Tests the fixes
4. Documents changes

Output:
```markdown
## 📝 Fixed Implementation (Iteration 2)

### Changes Made

#### Fix #1: Added Auth Check
**File**: `backend/src/routes/notes.ts:45-60`
```typescript
// Added ownership verification
const user = c.get('user');
const note = await db.prepare('SELECT user_id FROM notes WHERE id = ?')
  .bind(id).first();

if (!note || note.user_id !== user.id) {
  return c.json({ success: false, error: 'Not found' }, 404);
}
```

#### Fix #2: Added Error Handling
**File**: `frontend/src/hooks/useNotes.ts:23-35`
```typescript
// Added try/catch with proper error handling
try {
  const result = await fetchNotes();
  setNotes(result.data);
} catch (error) {
  console.error('Failed to fetch notes:', error);
  setError('Failed to load notes');
  showToast('Failed to load notes');
}
```

### Verification
- ✅ TypeScript compiles
- ✅ Tested auth check with invalid user
- ✅ Tested error handling with network failure

### Notes
All critical issues from QA have been addressed.
```

### Step 4: Re-Submit to QA

I send the fixed code back to **QA Agent**:

```markdown
## 🔄 Re-review Request

### Previous Rejection
[Previous QA report]

### Fixed Implementation
[New code with fixes]

### Fix Summary
1. ✅ Added auth check to DELETE endpoint
2. ✅ Added error handling to useNotes hook

### Previous Issues Status
| Issue | Status | Notes |
|-------|--------|-------|
| Missing auth | ✅ Fixed | Added ownership check |
| Unhandled promise | ✅ Fixed | Added try/catch |
| Missing loading state | 🟡 Open | Still pending |

Please re-review focusing on:
1. Were the critical issues fixed correctly?
2. Did the fixes introduce new issues?
3. Is the code now production-ready?
```

### Step 5: QA Re-Reviews

QA Agent reviews again and either:

#### ✅ APPROVED
```markdown
# 🧪 QA Report: Feature Name (Re-review)

## Verdict: ✅ APPROVED

### Review of Fixes
| Original Issue | Fix Quality | Status |
|----------------|-------------|--------|
| Missing auth | ✅ Correct | Verified |
| Unhandled promise | ✅ Correct | Verified |

### Code Quality Score: 9/10 (+2 from previous)

All critical issues resolved. Code is production-ready!
```

#### ❌ REJECTED (Again)
```markdown
# 🧪 QA Report: Feature Name (Re-review)

## Verdict: ❌ REJECTED

### Issues with Fixes

#### 🔴 New Issue Introduced
**Location**: `backend/src/routes/notes.ts:52`
**Problem**: Auth check throws unhandled exception
**Fix**: Wrap in try/catch

#### 🔴 Original Issue Not Fully Fixed
**Location**: `frontend/src/hooks/useNotes.ts:28`
**Problem**: Error is caught but not displayed to user
**Fix**: Ensure error state is set and displayed

### Iteration: 2/3
This is the second rejection. One more iteration allowed.
```

---

## Maximum Iterations

The pipeline allows **maximum 3 Dev→QA iterations**:

| Iteration | Action |
|-----------|--------|
| 1 | Initial implementation → QA rejects |
| 2 | Fixes applied → QA re-reviews |
| 3 | Final fixes → QA re-reviews |
| 4+ | **ESCALATION** - Main agent intervenes |

### Escalation Trigger

After 3 rejections:

```markdown
## ⚠️ ESCALATION REQUIRED

The feature has been rejected 3 times by QA.

### Rejection History
1. Iteration 1: [Summary of issues]
2. Iteration 2: [Summary of issues] 
3. Iteration 3: [Summary of issues]

### Options
1. **Refine Requirements** - Maybe the spec was unclear
2. **Architect Review** - Re-examine the technical approach
3. **Manual Intervention** - I (Main Agent) will review and decide
4. **Proceed Anyway** - Accept with known issues (not recommended)

### Recommendation
[My assessment of what went wrong and suggested path forward]
```

---

## Rejection Categories & Handling

### 1. Implementation Doesn't Match Spec

**Cause**: Developer misunderstood the spec

**Handling**:
- QA rejects with specific mismatches
- Developer re-reads spec carefully
- Fixes implementation to match spec exactly

### 2. Missing Edge Cases

**Cause**: Developer didn't consider all scenarios

**Handling**:
- QA identifies missing edge cases
- Developer adds handling for empty, null, error states
- Re-submits with comprehensive coverage

### 3. Security Issues

**Cause**: Missing validation, auth checks

**Handling**:
- QA identifies security gaps
- Developer adds input validation, auth checks
- QA verifies security fixes with test cases

### 4. Type Errors

**Cause**: TypeScript issues, missing types

**Handling**:
- QA identifies type errors
- Developer fixes types, removes `any`
- Re-runs TypeScript compiler to verify

### 5. Code Quality Issues

**Cause**: Doesn't follow project patterns

**Handling**:
- QA points out inconsistencies
- Developer refactors to match existing patterns
- Re-submits with consistent style

---

## Best Practices for Rejection Handling

### For QA Agent
1. **Be specific** - Exact file:line references
2. **Provide fixes** - Don't just say "it's wrong"
3. **Prioritize** - Mark truly critical vs nice-to-have
4. **Track iterations** - Note when approaching limit

### For Developer Agent
1. **Address all critical issues** - Don't ignore any 🔴
2. **Test your fixes** - Verify they work
3. **Document changes** - List what was fixed
4. **Don't introduce new issues** - Be careful with changes

### For Main Agent (Me)
1. **Monitor iteration count** - Don't let it loop forever
2. **Review rejection reasons** - Is QA being reasonable?
3. **Intervene if needed** - Adjust agents or approach
4. **Keep user informed** - Explain what's happening

---

## Example Rejection Flow

### User Request
> "Add a delete note feature"

### Iteration 1
**Dev**: Implements delete endpoint and button

**QA**: ❌ REJECTED
- 🔴 No auth check - anyone can delete any note
- 🔴 No confirmation dialog - accidental deletion risk
- 🟡 No loading state during delete

### Iteration 2  
**Dev**: Adds auth check and confirmation dialog

**QA**: ❌ REJECTED
- 🔴 Auth check has SQL injection vulnerability (string concat)
- 🟡 Confirmation dialog doesn't show note title

### Iteration 3
**Dev**: Fixes SQL injection, adds note title to dialog

**QA**: ✅ APPROVED
- All critical issues resolved
- Code is production-ready

### Delivery
I present the final, approved code to the user.

---

## Summary

The rejection workflow ensures:
- ✅ Issues are fixed, not ignored
- ✅ Code quality improves with each iteration
- ✅ No infinite loops (max 3 iterations)
- ✅ Escalation path for stuck features
- ✅ User is informed of the process
