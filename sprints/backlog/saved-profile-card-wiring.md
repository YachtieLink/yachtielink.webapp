# SavedProfileCard: Sea Time + Yacht Count Props Not Wired

**Status:** idea
**Priority guess:** P2 (bug — feature incomplete)
**Date captured:** 2026-04-02
**Source:** Lane 2 worker + reviewer (worktree session)

## Summary
`SavedProfileCard` now accepts `seaTimeDays` and `yachtCount` props for a richer detail line, but `SavedProfilesClient.tsx` and its server page don't pass them. The detail line always falls back to role+departments. The page already queries attachment data — extending it to compute sea time and yacht count per saved user is the remaining work.

## Scope
- Wire props from `SavedProfilesClient.tsx` and `app/(protected)/app/network/saved/page.tsx`
- ~2 files
