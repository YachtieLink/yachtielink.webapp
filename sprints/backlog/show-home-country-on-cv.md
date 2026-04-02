# Show Home Country on Generated CV

**Status:** idea
**Priority guess:** P2 (UX — toggle exists but does nothing visible)
**Date captured:** 2026-04-02
**Source:** Founder QA session

## Summary
The "Show home country on profile" toggle saves to DB but has no visible output. It should display the country name on the generated YachtieLink CV (e.g. in the personal details header alongside nationality/location).

## Notes
- The nationality flag toggle separately controls the flag icon next to the name on the public profile hero
- "Show home country" should control the text display of the country on the generated CV
- Toggle defaults and sublabel copy may need updating to reflect this
- Also consider: toggle off-state visibility across all toggles (too subtle currently)
- Also consider: default all visibility toggles to ON for new users

## Scope
- Wire `show_home_country` into `CvPreview.tsx` / CV generation
- Update sublabel copy to reference CV specifically
- ~2-3 files
