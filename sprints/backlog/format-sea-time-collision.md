# formatSeaTime: Naming Collision Between Two Files

**Status:** shipped
**Priority guess:** P3 (tech debt)
**Date captured:** 2026-04-02
**Shipped in:** Rally 009 Session 2, Lane 2 (fix/sea-time-overlap) — 2026-04-03

## Summary
`lib/profile-summaries.ts` and `lib/sea-time.ts` both exported `formatSeaTime` with different signatures. `formatSeaTimeCompact` deleted; `profile-summaries.ts` now uses canonical `formatSeaTime().displayShort` from `lib/sea-time.ts`.

## Scope
- ~~Pick canonical location, update all imports~~
- Resolved — `formatSeaTimeCompact` removed, canonical version used everywhere
