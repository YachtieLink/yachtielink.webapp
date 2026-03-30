# CV Staleness Nudge

**Created:** 2026-03-30
**Priority:** Medium
**Scope:** All users
**Effort:** Low

## Problem

Users upload a CV during onboarding and never update it. Their CV becomes outdated as they change roles, gain certifications, or move yachts. Employers see stale information.

## Proposed Solution

### Detection logic
CV is considered stale when ALL of these are true:
- `cv_parsed_at` is >12 months ago (or null)
- Most recent attachment `end_date` is >12 months ago (or all are "Current" but `cv_parsed_at` is still >12 months old)
- User has not uploaded a new CV in the last 12 months

### Nudge UI
- Banner on the CV page (same collapsible pattern as endorsement banner)
- Copy: "Your CV may be outdated — consider uploading a recent version so employers see your latest experience"
- Collapsible, re-expands every 30 days
- Dismisses permanently once a new CV is uploaded or profile is updated via the CV import wizard

### Implementation
- Query `cv_parsed_at` from users table + most recent attachment end_date
- Client-side staleness check (no new RPC needed)
- Reuse the collapsible banner pattern from `EndorsementBanner`

## Dependencies
- None

## Notes
- This pairs well with the endorsement freshness nudge — both encourage profile maintenance
- Could eventually feed into a "profile health score" metric
