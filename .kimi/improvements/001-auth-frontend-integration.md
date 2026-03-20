# Improvement: Frontend Auth Integration

**ID:** 001
**Date:** 2026-03-20
**Session:** Security Fixes Refactoring

## Problem
Added JWT authentication middleware to backend, but frontend doesn't send JWT tokens. This caused all write operations (POST, PATCH, DELETE) to fail with 401 Unauthorized.

## Root Cause
Backend and frontend auth are not synchronized:
- Backend: Expects `Authorization: Bearer <token>` header
- Frontend: Doesn't have JWT login flow implemented

## Temporary Solution
Disabled authMiddleware on write operations until frontend has auth.

## Permanent Solution Required
1. Add JWT login to frontend
2. Store token in memory/localStorage
3. Add auth header to API client
4. Re-enable authMiddleware on backend

## Changes Made
- [x] Updated notes.ts routes (removed authMiddleware temporarily)
- [x] Updated folders.ts routes (removed authMiddleware temporarily)
- [x] Added TODO comments to re-enable auth

## Prevention
- [ ] Update Dev Agent skill: "Check frontend/backend auth compatibility"
- [ ] Add checklist item: "Verify auth flow end-to-end before delivery"

## Next Steps
When ready to add auth:
1. Implement JWT login in frontend
2. Update api/client.ts to send auth header
3. Re-add authMiddleware to protected routes
4. Test all endpoints
