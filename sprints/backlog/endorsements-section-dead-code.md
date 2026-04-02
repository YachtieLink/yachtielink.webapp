# Private EndorsementsSection: Dead Code + Wrong Types

**Status:** idea
**Priority guess:** P3 (tech debt)
**Date captured:** 2026-04-02
**Source:** Lane 1 reviewer (worktree session)

## Summary
`components/profile/EndorsementsSection.tsx` has `endorser_id: string` (non-nullable) in interface but it's never queried. `isOwn` check on line 65 is dead code. `yacht_id` should be `string | null`. Component has no active callers — but types should be correct for when it's reused.

## Scope
- Fix interface types (nullable fields)
- Remove dead code
- ~1 file, small cleanup
