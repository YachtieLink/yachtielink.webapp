# UpgradeCTA — Hardcoded Feature List

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-04-03

## Summary
`components/insights/UpgradeCTA.tsx` hardcodes a list of 6 Pro features. If Pro features change (new features added, existing ones removed or renamed), this list needs a manual update and is easy to miss.

## Scope
- Extract feature list to a constant in `lib/config/pro-features.ts` or similar
- `UpgradeCTA` imports and maps over the list
- Bonus: `ProUpsellCard` (all 3 variants) could reference the same constant for consistency

## Files Likely Affected
- `components/insights/UpgradeCTA.tsx`
- `components/ui/ProUpsellCard.tsx`
- `lib/config/pro-features.ts` (new)

## Notes
- Source: Lane 4 worker discovered issue, Rally 009 Session 6
- Low urgency — feature list is stable for Phase 1; becomes higher priority before a Pro feature audit or rebranding
