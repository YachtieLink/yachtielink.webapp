# Profile Layout Visual Preview

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-04-01

## Summary
The Profile Layout selector (Profile / Portfolio / Rich Portfolio) currently uses text labels only. Users can't see what each layout looks like before switching. Show don't tell — give users a visual preview of each layout option so they understand the differences without trial and error.

## Scope
- Visual thumbnails or mini-previews for each layout option in the settings selector
- Could be: static preview images, animated transitions on hover/tap, or a live mini-preview of their own profile in each layout
- The current selector already has short descriptions ("Clean, editorial" / "Card-based sections" / "Bento grid layout") — replace or augment with visual previews
- Consider: preview modal on long-press/tap, or inline thumbnail above each option

## Files Likely Affected
- `app/(protected)/app/profile/settings/page.tsx` — the layout selector UI
- Possibly new preview image assets or a preview component

## Notes
- Founder emphasis: "show don't tell" — visual communication over text descriptions
- Mobile-first: previews need to work in thumb-zone on small screens
- Could be a quick win with static screenshots, or a bigger feature with live mini-previews
