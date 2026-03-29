# Post-Mortem: Production Notes Not Showing (2026-03-29)

**Duration:** 7:00 PM - 11:00 PM Bangkok (4 hours)
**Severity:** Critical — user lost access to production data (18 notes)
**Impact:** Bank could not see any notes on magicbox.bankapirak.com

---

## Root Causes (in order of impact)

### 1. Auth Middleware Mismatch (PRIMARY)
- **What:** Routes (`notes.ts`, `folders.ts`, `search.ts`) imported `authMiddleware` (JWT Bearer) instead of `sessionAuthMiddleware` (cookie)
- **Why:** Phase 1 sub-agent added `authMiddleware` which expects JWT tokens, but the frontend uses session cookies
- **Symptom:** API returned `"Unauthorized - No token provided"` for all data requests
- **Fix time:** 3+ hours (should have been 5 minutes)

### 2. Frontend Missing `credentials: 'include'`
- **What:** `fetchAPI()` in `client.ts` didn't include `credentials: 'include'` in fetch options
- **Why:** Original code never had it; AuthContext had it but data API client didn't
- **Symptom:** Browser didn't send cookies with cross-origin requests
- **Fix time:** 10 minutes once identified

### 3. CDN Caching Old Files
- **What:** Cloudflare Pages cached old HTML referencing old JS bundle
- **Why:** No `_headers` file; Pages project was Direct Upload (no Git integration)
- **Symptom:** Deployed fix but users still got old code
- **Fix time:** 1+ hour (cache purge, rebuilds, eventually Git integration)

### 4. Pages Project Configuration
- **What:** Direct Upload project → all deployments "preview" → custom domain stuck on old deployment
- **Why:** Project was created manually, not via Git integration
- **Symptom:** New deployments didn't propagate to custom domain
- **Fix time:** 30 minutes (recreated project with Git integration)

---

## What Went Wrong

### Applied Fixes Without Root Cause Analysis
- Fixed VITE_API_URL env var (not the issue)
- Added sessionAuthMiddleware (correct but routes didn't use it)
- Added Domain=.bankapirak.com to cookies (helpful but not the root cause)
- Purged CDN cache (helpful but not the root cause)
- **Should have:** Checked what auth middleware the routes actually import FIRST

### Didn't Verify Deployments
- Pushed code but didn't verify the deployed code matches
- The Worker was redeployed but with OLD auth middleware
- **Should have:** Always verify with `curl` after deploy

### Debugging by Guessing
- Made 5+ changes without testing each one
- Each "fix" seemed right but didn't address the actual issue
- **Should have:** Test one change, verify, then move to next

### No Smoke Test After Phase 1
- Phase 1 added auth enforcement but never tested the production site
- The bug was introduced in Phase 1 and never caught
- **Should have:** Test production site after every PR merge

---

## Improvements

### 1. Always Verify After Deploy
```bash
# After every deployment:
curl -s https://api.magicbox.bankapirak.com/notes
# Should return auth error (not 500 or wrong response)
```

### 2. Check Actual Deployed Code
```bash
# What the Worker is actually running:
curl -s https://api.magicbox.bankapirak.com/notes
# Compare error message with expected middleware
```

### 3. Production Smoke Test Workflow
After every PR merge to main:
1. API health check
2. Auth enforcement check (unauthenticated should return 401)
3. Authenticated request check (with valid session)
4. Frontend loads correctly
5. Frontend can fetch data

### 4. Session Auth vs JWT Auth — Clear Convention
- **Browser frontend:** Always use session cookies (sessionId)
- **API clients / sub-agents:** Use JWT if needed
- **All routes:** Use `sessionAuthMiddleware` by default
- Document this in DEVELOPER_GUIDE.md

### 5. CDN Cache Strategy
- `_headers` file: no-cache for HTML, immutable for hashed assets
- Pages project: always use Git integration (not Direct Upload)
- After deploy: verify new bundle hash is served

---

## Lessons Learned

1. **Trace the full request flow** before fixing anything
2. **Test after every change** — don't guess
3. **Verify deployed code matches source** — not just "pushed to git"
4. **The simplest explanation is usually right** — routes used wrong auth middleware
5. **Don't let frustration drive debugging** — step back, think, then fix

---

*Created: 2026-03-29 by ChokdeeAI 🍀*
