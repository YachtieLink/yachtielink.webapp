# CV Review — Education Autocomplete (Light Touch)

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-03-26

## Summary
Education entries from CV import should get light autocomplete for institution names and qualifications, but NOT the strict match-or-create flow used for yachts and certifications. The universe of degrees, diplomas, and institutions is enormous and mostly non-yachting, so the DB can't be comprehensive and shouldn't try to be.

## Approach: Autocomplete, Not Gating
- **Yachts:** strict match → picker → create if missing (small known universe, high graph value)
- **Certs:** fuzzy match → picker → create if missing (known yachting universe, high compliance value)
- **Education:** free text with autocomplete suggestions (huge universe, low match value)

## What This Looks Like
- Institution field: as the user types, suggest from a growing `institutions` lookup (or just prior entries from other users)
- Qualification field: free text, maybe suggest common ones ("Bachelor of", "Diploma in", "Certificate IV")
- No blocking — if they type something new, it just saves as-is
- The autocomplete table grows passively from what users enter, not from forced matching

## Why Not Strict Matching
- A maritime academy grad and a university grad both have valid education — can't gatekeep
- The DB would never be comprehensive enough (thousands of universities worldwide)
- Low graph value — knowing two people went to "University of Southampton" is mildly interesting but not a connection driver like shared yachts
- Exception: yachting-specific academies (Warsash, UKSA, Fort Lauderdale Maritime) could get highlighted if matched — "12 YachtieLink crew studied here"

## Implementation
- Auto-growing lookup table for institution names (deduplicated, title-cased)
- Autocomplete component on the education review step
- No picker modal, no "create new" prompt — just type-ahead suggestions
- Maritime academies could be flagged/promoted in suggestions

## Files Likely Affected
- `components/cv/steps/StepEducation.tsx` (or wherever education review lives)
- Possibly: new `institutions` lookup table or just aggregate from `user_education.institution`
