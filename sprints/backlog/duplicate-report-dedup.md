# Duplicate Report Deduplication

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-04-03

## Summary
The current reporting system allows the same user to submit identical reports on the same target up to the rate limit (10/hr). A malicious user could flood the queue with the same report. Adding deduplication would keep the reports table clean and admin review manageable.

## Scope
- Add a unique constraint or partial index on `(reporter_id, target_type, target_id, category)` to prevent exact duplicate reports
- OR app-level dedup: check for existing open report before insert, return 409 if found
- Consider a cooldown window (e.g., 24h) rather than a permanent unique constraint, so users can re-report after changes

## Files Likely Affected
- `supabase/migrations/` — unique constraint or index
- `app/api/report/route.ts` — 409 handling

## Notes
- Source: Lane 2 reviewer discovered issue, Rally 009 Session 6
- Low urgency — rate limiting (10/hr/user) already mitigates the worst abuse
