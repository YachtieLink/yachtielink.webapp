# Colleague Display Names — Full Name + Nickname

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26

## Summary

Colleague lists (Network tab, Endorsement request page) only show first names / display_name. With multiple users sharing first names (e.g. two "James"), this is ambiguous. Need to show full names and, where applicable, nicknames.

## Issues Found During QA

1. **Colleagues tab**: Shows only first name + role — "James, Captain" appears twice with no way to distinguish
2. **Endorsement request colleague list**: Same — first name only
3. **Endorsement display on profile**: Only shows endorser first name (see also `endorsement-context-display.md`)

## What Needs to Change

- Show **full name** (first + last) in colleague lists, endorsement requests, and endorsement displays
- If `display_name` differs from first name (i.e. a nickname), show it as: **"Charlotte 'Charlie' Beaumont"** or **"Charlie (Charlotte Beaumont)"** — pick a pattern
- The `get_colleagues` RPC already returns enough data — this is a rendering fix

## Related Bug

- **Duplicate colleague entries**: James (Captain) appears twice under TS Driftwood for Charlotte. Likely the `test-onboard-james` user created during QA, or a dedup issue in `get_colleagues` RPC. Needs investigation.

## Files Likely Affected

- `components/network/ColleaguesTab.tsx` (or equivalent) — colleague row rendering
- `app/(protected)/app/endorsement/request/page.tsx` — request colleague list
- Endorsement display components (profile, public CV)

## Notes

- `display_name` is the "nickname" field — defaults to first name during onboarding
- `full_name` is the legal/complete name
- Consider a shared `<CrewName>` component that handles display logic consistently
