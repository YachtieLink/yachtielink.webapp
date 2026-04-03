# Cert Registry — STCW Naming & Aliases

**Source:** Founder observation during QA (2026-04-03)
**Priority:** High
**Module:** cv (certifications_registry)

## Problem

Registry entries use generic names ("Basic Safety Training") instead of industry-standard names ("STCW Basic Safety Training"). This causes the cert matcher to show amber (ambiguous) results for common abbreviations like "STCW BST" when they should be confident green matches.

## Root Cause

- Migration `20260403100001_certifications_registry.sql` seeded 60 certs with generic names
- "STCW BST" → trigram similarity 0.44 to "Basic Safety Training" → amber (needs ≥0.6 for green)
- No aliases seeded — alias learning will eventually fix this, but first impressions matter

## Suggested Fix

**Migration to rename + add aliases for all STCW certs:**

```sql
-- Rename to industry-standard names
UPDATE certifications_registry SET name = 'STCW Basic Safety Training' WHERE name = 'Basic Safety Training';
UPDATE certifications_registry SET name = 'STCW Personal Survival Techniques' WHERE name = 'Personal Survival Techniques';
UPDATE certifications_registry SET name = 'STCW Personal Safety & Social Responsibilities' WHERE name = 'Personal Safety and Social Responsibilities';
-- etc. for all STCW module certs

-- Add common aliases
UPDATE certifications_registry SET aliases = array['STCW BST', 'BST', 'STCW 95 BST'] WHERE name = 'STCW Basic Safety Training' AND issuing_authority = 'MCA';
UPDATE certifications_registry SET aliases = array['ENG1', 'ENG 1', 'Seafarer Medical'] WHERE name = 'ENG1 Medical Certificate' AND issuing_authority = 'MCA';
-- etc.
```

**Also consider:** Pre-seeding crew_count with realistic numbers so the "412 crew" social proof works on day one.

## Files Involved

- New migration: `supabase/migrations/TIMESTAMP_cert_registry_naming.sql`
- No code changes needed — the matching logic is correct, the data is wrong
