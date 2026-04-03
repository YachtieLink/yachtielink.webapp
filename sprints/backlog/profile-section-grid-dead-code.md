# Dead Code: ProfileSectionGrid + SectionManager

**Status:** idea
**Priority guess:** P3 (tech debt)
**Date captured:** 2026-04-04
**Source:** Lane 3 worker (Rally 009 Session 7)

## Summary
`components/profile/ProfileSectionGrid.tsx` and `components/profile/SectionManager.tsx` have no importers anywhere in `app/` or `components/`. The profile page was redesigned in Rally 009 Session 3 to use `ProfileSectionList` exclusively. These two files are dead code and safe to delete.

## Scope
- Confirm zero grep matches for `ProfileSectionGrid` and `SectionManager` in the app directory
- Delete both files
- 2-file cleanup, zero risk

## Files Likely Affected
- `components/profile/ProfileSectionGrid.tsx` — delete
- `components/profile/SectionManager.tsx` — delete

## Notes
Quick housekeeping. Can be batched with other dead-code removals in a chore PR.
