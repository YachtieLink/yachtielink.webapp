# Desktop Responsiveness Audit

**Status:** promoted
**Priority guess:** P2 (important)
**Date captured:** 2026-03-29

## Summary
Review and fix desktop responsiveness across the app before MVP launch. Development has been mobile-first, so desktop layouts likely need attention — breakpoints, spacing, layout shifts, and content scaling at wider viewports.

## Scope
- Audit all key pages/flows at common desktop breakpoints (1024px, 1280px, 1440px, 1920px)
- Fix layout issues: overstretched content, awkward whitespace, misaligned grids
- Ensure navigation, modals, and interactive elements work well at desktop sizes
- Public profile pages (subdomain experience) must look polished on desktop

## Notes
- Shipped in Rally 009 Session 7 Lane 1 (fix/desktop-responsiveness). Core issues fixed: BottomSheet desktop card, UpgradeCTA pointer-events, public profile layout (HeroSection, ContactRow, CertsTile, EducationTile, bento stagger). Remaining desktop polish deferred: BottomSheet exit animation, sidebar-aware fixed positioning pattern (see `sidebar-fixed-positioning.md`), sub-page section color extension.
