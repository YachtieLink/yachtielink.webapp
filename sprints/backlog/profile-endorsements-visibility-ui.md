# Endorsements Visibility Toggle — Missing UI Row

**Status:** idea
**Priority guess:** P2 (missing feature — user cannot control something the DB supports)
**Date captured:** 2026-04-04
**Source:** Lane 3 reviewer (Rally 009 Session 7)

## Summary
`section_visibility.endorsements` exists in the DB and is respected in `PublicProfileContent.tsx:459` and `PortfolioLayout.tsx:228`, but there is no toggle row in the profile page UI. Users have no way to hide their endorsements from their public profile.

## Scope
- Add an Endorsements visibility row to one of the 4 section groups in `app/(protected)/app/profile/page.tsx`
- Supply a `visibilityLabel` ("Endorsements from colleagues who've worked with you")
- Wire to the existing `section_visibility.endorsements` key via `PATCH /api/profile/visibility`
- No DB changes needed — the column and API already support it

## Files Likely Affected
- `app/(protected)/app/profile/page.tsx` — add row to section group config
- No API or DB changes required

## Notes
The toggle gating is already implemented on both the profile view and portfolio layout. This is purely a UI gap. One-liner fix once the sprint has room for it.
