# Sea Time SQL RPC: Naive Sum Double-Counts Overlaps

**Status:** idea
**Priority guess:** P1 (critical — most visible sea time displays are wrong)
**Date captured:** 2026-04-03
**Source:** Lane 2 worker + reviewer (Rally 009 Session 2)

## Summary
`get_sea_time()` SQL function sums `(ended_at - started_at)` across all attachments without overlap handling. Users with overlapping stints (relief work, handover periods) see inflated sea time on the profile hero card, SeaTimeSummary, and public profile. Client-side calcs are now fixed (Rally 009 Session 2), but the DB function feeds the most visible displays.

Related: `get_sea_time_detailed` feeds the sea time breakdown page (`app/(protected)/app/profile/sea-time/page.tsx:33`) which also sums naively. Saved profiles page (`app/(protected)/app/network/saved/page.tsx:65-72`) has the same issue inline.

## Scope
- New migration: rewrite `get_sea_time()` with union-based interval logic (recursive CTE or generate_series)
- Fix sea time breakdown page to use union-based sum (or rely on fixed RPC)
- Fix saved profiles page inline sum (or use `calculateSeaTimeDays` from `lib/sea-time.ts`)

## Files Likely Affected
- `supabase/migrations/` — new migration
- `app/(protected)/app/profile/sea-time/page.tsx` — breakdown page sum
- `app/(protected)/app/network/saved/page.tsx` — inline sea time sum

## Notes
- The client-side `calculateSeaTimeDays` in `lib/sea-time.ts` is the reference implementation for the union-based approach.
- Fixing the SQL RPC is the single highest-impact change — it feeds profile hero + public profile + SeaTimeSummary.
