# Social Icons: TikTokIcon + XIcon Duplicated Across Files

**Status:** idea
**Priority guess:** P3 (tech debt)
**Date captured:** 2026-04-02
**Source:** Lane 3 worker + reviewer (worktree session)

## Summary
TikTokIcon duplicated in 3 files (`StepReview.tsx`, `settings/page.tsx`, `SocialLinksRow.tsx`). XIcon duplicated in 2 files. Extract to shared `components/icons/` directory.

## Scope
- Create `components/icons/TikTokIcon.tsx` and `components/icons/XIcon.tsx`
- Update all imports
- ~5 files
