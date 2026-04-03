# Alias Moderation — Granular Per-Alias State

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-04-03

## Summary
The current `certifications_registry.review_status` column is row-level, not alias-level. When alias learning writes a new alias, it can't mark just that alias as "pending review" — marking the row pending would hide the entire approved certification from search. So new aliases are currently appended immediately without moderation.

## Scope
- Add alias-level review metadata: a dedicated `alias_submissions` table (or JSONB with per-alias `{value, count, status, submitted_at}` on `certifications_registry.aliases_pending`)
- Count-based auto-approval: if same alias appears 10+ times, auto-approve (promote to `aliases[]`); otherwise flag for admin review
- Admin view to approve/reject pending aliases
- Backfill the running count from current session's confirmed matches

## Files Likely Affected
- `supabase/migrations/` — new migration for alias_submissions table or aliases_pending JSONB
- `lib/cv/save-parsed-cv-data.ts` — write to pending instead of direct aliases array
- `lib/cv/cert-matching.ts` — query approved aliases only

## Notes
- Source: Lane 1 worker + reviewer, Rally 009 Session 6
- Low urgency — alias learning still improves matching over time even without per-alias moderation; risk is only that a bad alias could be auto-approved at 10 confirmations
