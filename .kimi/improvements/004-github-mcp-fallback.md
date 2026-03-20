# Improvement: Document GitHub MCP Fallback Methods

**ID:** 004
**Date:** 2026-03-20
**Session:** PR #7 Review Comments Retrieval

## Problem
GitHub MCP tools failed with connection error:
```
Client failed to connect: Server session was closed unexpectedly
```

This blocked retrieval of CodeRabbit AI review comments from PR #7.

## Root Cause
- MCP server connectivity issue (environment/configuration)
- No documented fallback method for GitHub operations
- Agent assumed MCP was the only way to access PR data

## Solution

### Fallback Methods (Documented Priority)

#### 1. GitHub CLI (`gh`) - PRIMARY FALLBACK
```powershell
# View PR with comments
gh pr view <number> --repo <owner/repo> --comments

# List PR files
gh pr view <number> --repo <owner/repo> --files

# Get PR status
gh pr checks <number> --repo <owner/repo>
```

**Pros:** Rich output, authentication already handled
**Cons:** Requires `gh` to be installed and authenticated

#### 2. GitHub API via curl - SECONDARY FALLBACK
```powershell
# Requires GITHUB_TOKEN environment variable
$headers = @{Authorization = "token $env:GITHUB_TOKEN"}
Invoke-RestMethod -Uri "https://api.github.com/repos/owner/repo/pulls/7/comments" -Headers $headers
```

**Pros:** Direct API access, no CLI dependency
**Cons:** Requires token, more verbose

#### 3. Local git - LIMITED FALLBACK
```powershell
# Compare branches locally
git diff main...feature-branch --stat
git log feature-branch --oneline
```

**Pros:** Always available, no network needed
**Cons:** No PR metadata (comments, reviews, status)

## Changes Made
- Used `gh pr view 7 --comments` successfully
- Saved review to `.kimi/logs/coderabbit-review-pr7.md`

## Prevention
- [ ] Update PM skill: "GitHub MCP failed? Try gh CLI first"
- [ ] Update Dev skill: Include fallback methods for GitHub operations
- [ ] Add to QUICKREF.md: "GitHub Operations - MCP Failure Fallback"
- [ ] Add MCP status check to pipeline startup

## Status
✅ **Documented** - Fallback method worked successfully
