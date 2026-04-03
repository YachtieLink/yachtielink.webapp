# Saved Profiles Loading Skeleton — Inconsistent Pattern

**Status:** idea
**Priority guess:** P3 (visual polish)
**Date captured:** 2026-04-04
**Source:** Lane 3 worker + reviewer (Rally 009 Session 7)

## Summary
`app/(protected)/app/network/saved/loading.tsx` uses a generic `<Skeleton>` component without navy color or content-matching shapes. This is inconsistent with the updated `network/loading.tsx` which now uses navy-200 accordion-shaped pulse animations. The saved profiles skeleton looks visually disconnected.

## Scope
- Rewrite `app/(protected)/app/network/saved/loading.tsx` to use navy-200 card-shaped skeletons matching the `SavedProfiles` layout (profile avatar + name + role + bookmark icon)
- Match the pulse animation style from `network/loading.tsx`
- No logic changes — loading file only

## Files Likely Affected
- `app/(protected)/app/network/saved/loading.tsx` — rewrite

## Notes
The network tab as a whole should have visually consistent skeletons. This is the last inconsistent one after the Session 7 pass.
