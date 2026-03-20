# Improvement: Handle NULL Boolean Values in Queries

**ID:** 002
**Date:** 2026-03-20
**Session:** Pin Note Feature

## Problem
When adding a new boolean column (`is_pinned`) to existing database table, legacy records have `NULL` values. The SQL queries fail or return inconsistent results when sorting/filtering by this column.

## Root Cause
SQLite allows NULL values. When sorting `ORDER BY is_pinned DESC`, NULL values sort unpredictably. Also, TypeScript types expect `number` but database returns `null`.

## Solution
Use `COALESCE(column, 0)` in SQL queries to treat NULL as default value (0/false).

## Changes Needed

### Backend: `backend/src/routes/notes.ts`
Change:
```typescript
SELECT n.*, f.name as folder_name 
FROM notes n 
JOIN folders f ON n.folder_id = f.id
ORDER BY n.is_pinned DESC, n.updated_at DESC
```

To:
```typescript
SELECT n.*, f.name as folder_name, COALESCE(n.is_pinned, 0) as is_pinned
FROM notes n 
JOIN folders f ON n.folder_id = f.id
ORDER BY COALESCE(n.is_pinned, 0) DESC, n.updated_at DESC
```

### Backend: `backend/src/routes/folders.ts`
Apply same pattern to folder notes query.

## Prevention
- [ ] Update Architect skill: "Consider legacy data when adding columns"
- [ ] Add checklist item: "Use COALESCE for new boolean columns"
- [ ] Update Dev skill: Include null handling pattern

## Status
✅ Fixed - Applied COALESCE to notes.ts and folders.ts queries during CodeRabbit review fixes
