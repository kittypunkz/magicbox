# Improvement: Enforce PM/Developer Role Boundaries

**ID:** 003
**Date:** 2026-03-20
**Session:** PR #7 Pin Notes & Security Fixes

## Problem
Product Owner (PO) agent directly implemented code fixes instead of delegating to Developer agent. This happened **twice** in the same session (violating team protocol):

1. **First violation:** PM read CodeRabbit AI review and immediately fixed all 11 issues directly
2. **Second violation:** After being called out, PM asked user "which option" instead of making autonomous PM decision

## Root Cause
- PM had full context loaded (code, review comments, environment)
- PM identified fixes as "quick" and "straightforward"
- No enforced delegation mechanism in PM skill
- Mana conflated "can do" with "should do"

## Impact
- **Pipeline violation:** Bypassed Developer agent role entirely
- **No code review:** Changes weren't reviewed by separate agent
- **User confusion:** "Why Product Owner fix issue????"
- **Skill atrophy:** Mana doesn't practice proper delegation

## Solution

### Immediate (This Session)
User selected **Option 2:** Keep fixes but enforce proper delegation going forward. Team protocol established.

### Long-term (Prevent Recurrence)

#### 1. Update PM Skill - HARD RULE
Add to `SKILL.md`:
```markdown
## ABSOLUTE RULE: No Code Changes

As Mana (PO), you NEVER write, edit, or fix code. EVER.

When you see code issues:
1. Analyze and understand (Mana)
2. Delegate to **Kaji** (Developer) with specific task
3. Wait for Kaji to complete
4. Delegate verification to **Vera** (QA)
5. Request architecture review from **Rupa** (Architect) if needed
6. Mana makes go/no-go decision

**NO EXCEPTIONS** for:
- "Quick" fixes
- "Simple" changes  
- Emergency situations
- Config files
- Documentation (delegate to appropriate agent)
```

#### 2. Add Delegation Checklist
Before ANY file modification, PM must ask:
- [ ] Is this code? → Delegate to Developer
- [ ] Is this architecture? → Delegate to Architect  
- [ ] Is this testing? → Delegate to QA
- [ ] Is this planning/coordination? → PM does it

#### 3. Enforce Via System
Consider adding validation layer that blocks PM from file write tools.

## Prevention
- [x] Update Mana (PO) skill with HARD RULE
- [ ] Update team skills with delegation decision tree
- [ ] Add "Role Boundary" section to TEAM_SKILLS.md
- [x] Log all violations to `.kimi/logs/pipeline-violations.log`
- [ ] All agents use names: Mana, Kaji, Rupa, Vera

## Status
⚠️ **Monitoring** - Next time Mana delegates will test enforcement
