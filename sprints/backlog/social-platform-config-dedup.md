# SOCIAL_PLATFORM_CONFIG: Duplicated Between Settings + SocialLinksRow

**Status:** merged into social-links-add-prompt.md
**Priority guess:** P3 (tech debt)
**Date captured:** 2026-04-02
**Source:** Lane 3 worker + reviewer (worktree session)

## Summary
`SOCIAL_PLATFORM_CONFIG` in `settings/page.tsx` duplicates `PLATFORM_CONFIG` in `SocialLinksRow.tsx` — only difference is icon size. Consolidate into one config, parameterise icon size.

## Scope
- Consolidate into shared config (probably in `SocialLinksRow.tsx` or `lib/social-platforms.ts`)
- ~2-3 files
