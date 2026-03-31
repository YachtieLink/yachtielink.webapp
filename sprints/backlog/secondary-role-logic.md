# Secondary Role / Dual Role Logic

**Status:** idea — needs significant design work before building
**Priority guess:** P2 (important)
**Date captured:** 2026-03-31

## Summary
Crew often work across two roles, but there are two fundamentally different patterns that need different logic:

1. **Dual role** — one position combining two skillsets on the same yacht. "Deck/Engineer" does both jobs simultaneously. This is a single job with a compound title.
2. **Open to either** — a crew member who would take either of two distinct positions depending on the yacht. "2nd Officer OR Bosun" — two separate roles, one flexible candidate.

These mean very different things to a captain searching for crew. A dual role fills two gaps with one hire. An "open to either" is flexibility in what they'll accept.

## Why this needs real work

The logic is not straightforward. This isn't just "add a secondary_role column." Key questions that need answers before building:

- **How does search work?** A captain searching "Bosun" should surface someone with Bosun as secondary. But should a "Deck/Engineer" show up when searching "Engineer"? Probably yes — but ranked differently.
- **How does the public profile display it?** "2nd Officer / Bosun" looks like a dual role to a reader. Need clear visual language to distinguish "I do both" from "I'd take either."
- **Which role shows on the CV PDF header?** Primary only? Both? Depends on the type?
- **How does AI parsing handle it?** The prompt needs to detect whether someone lists themselves as a combo role vs listing two separate positions across their career.
- **What about the existing `departments` array?** There's already a secondary signal (departments like ["Deck", "Engineering"]). Does secondary role replace this, complement it, or conflict?
- **Data model implications** — is secondary_role a string? An array? Does it need a "relationship type" enum (dual vs flexible)?

## Scope (once designed)
- Database: likely `secondary_role` column + `role_type` enum (dual/flexible/null)
- Profile edit form: role picker that supports the two patterns
- CV import: AI prompt update to detect dual vs flexible roles
- Search: index secondary roles, ranking logic
- Public profile: display logic for both patterns
- PDF generation: header role display logic
- Onboarding wizard: same role picker

## What doesn't need to be built yet
- Role-based matching/recommendations
- Role change history/timeline

## Files likely affected
- `users` table schema
- `lib/constants/roles.ts`
- `components/cv/steps/StepPersonal.tsx`
- `components/profile/IdentityCard.tsx`
- `lib/cv/prompt.ts` (CV_PERSONAL_PROMPT)
- `components/pdf/ProfilePdfDocument.tsx`
- Search RPCs
