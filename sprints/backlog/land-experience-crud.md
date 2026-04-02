# Land Experience: No CRUD Outside CV Wizard

**Status:** idea
**Priority guess:** P2 (important — users can't manage shore-side roles after import)
**Date captured:** 2026-04-03
**Source:** Lane 1 worker + reviewer (Rally 009 Session 2)

## Summary
Users can only add/edit shore-side roles through the CV import wizard. There is no standalone page for managing land experience entries (add, edit, delete). The "Add" link in CareerTimeline currently goes to `/app/attachment/new` which is yacht-only.

## Scope
- New page at `/app/land-experience/new` (or similar) for adding shore-side roles
- Edit/delete for existing land experience entries
- Update CareerTimeline "Add" link to support both yacht and shore-side entry types
- Follow existing CRUD patterns from education or hobbies pages

## Files Likely Affected
- `app/(protected)/app/` — new page(s)
- `components/profile/CareerTimeline.tsx` — fix "Add" link
- `app/api/` — new API route for land experience CRUD (or reuse existing pattern)

## Notes
- Lower priority than the sea time SQL RPC fix but needed before launch for data completeness.
- Consider whether this should be a standalone page or inline-editable in CareerTimeline (matches the inline edit pattern from page-layout.md).
