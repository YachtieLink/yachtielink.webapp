# formatSeaTime: Naming Collision Between Two Files

**Status:** idea
**Priority guess:** P3 (tech debt)
**Date captured:** 2026-04-02
**Source:** Lane 2 reviewer (worktree session)

## Summary
`lib/profile-summaries.ts` and `lib/sea-time.ts` both export `formatSeaTime` with different signatures. Naming collision — consolidate into one canonical version.

## Scope
- Pick canonical location, update all imports
- ~2-3 files
