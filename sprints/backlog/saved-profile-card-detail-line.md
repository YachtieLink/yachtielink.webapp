# Saved Profile Card — Show Sea Time + Yachts Instead of Certs

**Status:** proposed
**Priority guess:** P2 (UX improvement)
**Date captured:** 2026-03-27

## Problem
SavedProfileCard currently shows certification names as the detail line (e.g. "Food Safety Level 2 · ENG1 (UK Seafarer Medical)"). This is deep detail that doesn't help with at-a-glance assessment of a candidate.

## Proposed Fix
Replace the cert summary line with sea time and yacht count, matching the pattern used on the public profile hero:
- "6y 7m at sea · 2 yachts" (computed from experience data)

This is what a hirer/captain cares about when scanning saved profiles — experience level, not individual cert names.

## Implementation Notes
- The saved profiles query already joins user data — check if sea time / yacht count is available or needs adding to the query
- May need to call `computeSeaTime()` or fetch from the same source the profile page uses
- Keep certs accessible elsewhere (e.g. when you click through to the full profile)
