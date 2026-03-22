# Bug Reporter

**Status:** fleshed-out
**Priority guess:** P2 (important)
**Date captured:** 2026-03-22

## Summary
Add an in-app bug report form so users can report issues directly instead of relying on email. Reports are stored in Supabase for tracking.

## Note: Roadmap Display
The roadmap page already exists at `app/(protected)/app/more/roadmap/page.tsx` — fully built with 10 items, status badges, and categories. Linked from Settings > Help. No work needed.

## Scope

### What to build
- **Bug report page** at `/app/more/report-bug` — category select (bug, UI issue, performance, other), description textarea (10-2000 chars), optional page URL input
- **Supabase migration** — `bug_reports` table with RLS (users can insert + read own)
- **API route** at `/api/bug-reports` — POST with auth, rate limiting (10/hr/user), Zod validation
- **Settings link** — "Report a bug" row in Help section between Roadmap and Send feedback
- Success state replaces form with confirmation (prevents double-submit)

### What NOT to build (MVP)
- No file/screenshot uploads
- No status tracking UI for users
- No admin dashboard for viewing reports

## Files Likely Affected

| Action | File |
|--------|------|
| Create | `supabase/migrations/20260322000003_bug_reports.sql` |
| Modify | `lib/validation/schemas.ts` — add `createBugReportSchema` |
| Modify | `lib/rate-limit/helpers.ts` — add `bugReport` rate limit |
| Create | `app/api/bug-reports/route.ts` |
| Create | `app/(protected)/app/more/report-bug/page.tsx` |
| Modify | `app/(protected)/app/more/page.tsx` — add row to Help section |

## Implementation Notes
- Follow endorsement-requests API route pattern (auth → rate limit → validateBody → insert → trackServerEvent)
- Follow roadmap page layout pattern (BackButton + PageTransition + heading + card)
- Reuse `safeText()` helper from `lib/validation/schemas.ts`
- Capture `user_agent` from request headers server-side, not from body
- `page_url` is a manual text input (user may navigate away from the broken page before reporting)
