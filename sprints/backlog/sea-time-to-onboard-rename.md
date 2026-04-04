# Rename "sea time" to "onboard" in user-facing copy

**Status:** Idea
**Priority:** P3 — Copy consistency
**Source:** Walkthrough QA (Rally 010, 2026-04-04)

## Problem

"Sea time" is a technical maritime term with specific regulatory meaning — it depends on factors like vessel type, flag state, and actual days underway vs. in port. Using it loosely in the app is misleading.

"Onboard" better describes what the app actually tracks: joining date to leaving date for each role on a vessel. It's accurate without implying regulatory sea-time calculations.

## Scope

Find and replace "sea time" in all user-facing copy:
- Profile page Experience summary (e.g. "11y 5mo sea time" → "11y 5mo onboard")
- CV page
- Public profile
- Experience list page
- `formatSeaTime()` function — consider renaming to `formatOnboardTime()`
- `get_sea_time` RPC — the DB function name doesn't need to change (internal), but display values do

## Notes

- Internal code names (`sea_time`, `get_sea_time`, `seaTimeTotalDays`) can stay as-is — only user-facing strings need updating
- The `formatSeaTime` utility returns `displayShort` and `displayLong` — update those output strings
- Check public profile pages too (the SEO-facing version)
