# Experience Transfers — Schema Hardening

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-04-03

## Summary
The `experience_transfers` table (migration 100003) is missing two things: (1) a FK constraint from `employment_id` to `attachments(id)`, meaning audit records can dangle after hard deletes; (2) no indexes on `user_id` or `employment_id`, meaning audit lookups will scan as the table grows.

## Scope
- Migration to add FK `experience_transfers.employment_id REFERENCES attachments(id) ON DELETE SET NULL`
- Migration to add indexes on `(user_id)` and `(employment_id)`

## Files Likely Affected
- `supabase/migrations/` — new migration

## Notes
- Source: Lane 3 reviewer discovered issue, Rally 009 Session 6
- Low urgency — table is new and small; only becomes a query performance issue at scale
