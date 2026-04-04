# Rich Portfolio: Gallery Context Awareness — Which Photos Appear Where

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-04-04

## Summary

Users who upload multiple photos have no way to know which of their photos will appear in which context (hero, avatar, rich portfolio tiles). The gallery management page shows all photos in a strip but gives no visual indication of their role across layout contexts. This causes confusion when setting focal points and zoom — the user doesn't know which photo they're actually affecting at the hero, avatar, or CV level.

## Scope

- Gallery page shows per-photo context badges: "Hero", "Avatar", "CV", "Portfolio"
- User can see at a glance which slots are filled and which are unset
- Possibly: drag-and-drop assignment of photos to rich portfolio tile positions
- Possibly: a layout preview showing where each photo lands on the rich portfolio grid
- What doesn't need to be built yet: full rich portfolio grid designer (Phase 2+)

## Files Likely Affected

- `app/(protected)/app/profile/photos/page.tsx` — gallery manager UI, context badge display
- `components/public/layouts/RichPortfolioLayout.tsx` — which photos are actually used and in what order
- `lib/queries/profile.ts` — may need to surface context assignment state

## Notes

- Captured during feat/per-context-focal-zoom session — founder observed that setting focal/zoom per context is only useful if the user can see which photos are assigned to which context.
- The current UI shows context thumbnails (avatar/hero/cv) for the SELECTED photo, but there's no grid-level view of which photo is in which slot.
- The `is_avatar`, `is_hero`, `is_cv` flags are stored per photo. Rich portfolio photos are selected by sort_order (first N photos). This asymmetry is a UX gap — user may not realise changing sort order changes which photos appear in the portfolio.
