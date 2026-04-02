# Land Experience: RLS Public Read Ignores section_visibility

**Status:** idea
**Priority guess:** P3 (tech debt — systemic, same as attachments table)
**Date captured:** 2026-04-03
**Source:** Lane 1 reviewer (Rally 009 Session 2)

## Summary
The `land_experience` RLS public read policy doesn't check the user's `section_visibility` setting. If a user hides the "Experience" section, their land experience entries are still queryable via direct Supabase API calls. This is the same pattern used by the `attachments` table — it's a systemic gap, not specific to this table.

## Scope
- Add `section_visibility` check to `land_experience` RLS public read policy
- Audit `attachments` table for the same gap
- Consider a shared RLS helper function for visibility-gated tables

## Notes
- Low real-world risk: the app UI respects section_visibility and doesn't render hidden sections. The gap is only exploitable via direct API access.
- Fixing this systemically (attachments + land_experience + any future tables) is better than a one-off fix.
