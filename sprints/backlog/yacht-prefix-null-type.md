# Yacht Prefix: "M/Y Unknown yacht" When Type Is Null

**Status:** idea
**Priority guess:** P2 (UX)
**Date captured:** 2026-04-02
**Source:** Lane 2 reviewer (worktree session)

## Summary
`lib/yacht-prefix.ts` `prefixedYachtName()` defaults to "M/Y" when `yacht_type` is null. This causes "M/Y Unknown yacht" to display when yacht data is missing entirely — misleading. Should return bare name when no yacht_type is available.

## Scope
- Update `prefixedYachtName` to skip prefix when `yacht_type` is null/undefined
- Check all callers still behave correctly
- ~1 file
