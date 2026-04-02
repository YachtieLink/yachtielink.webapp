# Ghost Endorser Card: Layout Asymmetry

**Status:** idea
**Priority guess:** P2 (UX polish)
**Date captured:** 2026-04-02
**Source:** Lane 2 reviewer (worktree session)

## Summary
`components/public/EndorsementCard.tsx` lines 91-103: non-ghost branch now shows "Role on Yacht" + date on separate line, but ghost endorser branch still uses old "Yacht · Date" single-line format. Visual asymmetry on profiles with mixed ghost/non-ghost endorsements.

## Scope
- Update ghost endorser branch to match new layout
- ~1 file, small fix
