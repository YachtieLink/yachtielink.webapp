---
module: trust
updated: 2026-04-03
status: shipped
phase: 1B
---

# Trust

One-line: Reporting and flagging infrastructure — crew can flag profiles, yachts, and endorsements; report bugs and UI issues via structured forms; all submissions stored for admin review with founder email alerts.

## Current State

- Profile reporting: working — `POST /api/report` with `target_type: 'profile'`, auth required, self-report blocked (400), rate-limited 10/hr/user
- Yacht reporting: working — same endpoint, categories: duplicate_yacht, incorrect_details, other; `duplicate_of_yacht_id` required for duplicate_yacht
- Endorsement reporting: working — same endpoint, categories: fake, misleading, inappropriate, spam, other
- Category validation: working — cross-checks category against allowed values per target_type
- Founder email alert: working — HTML email via `sendNotifyEmail` (fire-and-forget, email failure doesn't fail request), `user.email` HTML-escaped in template
- Bug reports: working — `POST /api/bug-reports` with categories (bug, ui_issue, performance, other), `description` (10–2000 chars), optional `page_url` (max 500), `user_agent` captured server-side, founder email notify
- Rate limiting: both endpoints — 10 submissions/hour/user
- Report button: working — `ReportButton` client component with flag icon (12px), BottomSheet, radio category selector, 10+ char reason, yacht search for duplicate_yacht (debounced 300ms, LIKE special chars escaped). Submit disables until validation passes, shows inline success state.
- Bug report page: working at `/app/more/report-bug` — category selector, description, page URL (auto-populated from `document.referrer`)
- Wired to: public profile (non-owner/non-logged-out viewers only), yacht detail page, EndorsementCard (public viewers), More page
- More page: replaced "Report a problem" (mailto) with "Report a bug" → `/app/more/report-bug` + "Contact us" (mailto)

## Key Files

| What | Where |
|------|-------|
| Report API | `app/api/report/route.ts` |
| Bug report API | `app/api/bug-reports/route.ts` |
| Report button component | `components/ui/ReportButton.tsx` |
| Bug report page | `app/(protected)/app/more/report-bug/page.tsx` |
| More page (wiring) | `app/(protected)/app/more/page.tsx` |

## DB Schema

**`reports`** (migration `20260403100002_reports_bug_reports.sql`):
- `id`, `reporter_id` (FK users), `target_type` (profile/yacht/endorsement), `target_id` (uuid), `category`, `reason` (text), `duplicate_of_yacht_id` (nullable), `created_at`
- RLS: authenticated INSERT, no public READ (admin only)

**`bug_reports`** (same migration):
- `id`, `reporter_id` (FK users), `category`, `description`, `page_url` (nullable), `user_agent` (nullable), `created_at`
- RLS: authenticated INSERT + own-row SELECT

## Recent Activity

**2026-04-03** — Rally 009 Session 6, Lane 2 (feat/reporting-bugs): Built full trust infrastructure from scratch. Report + bug report APIs, ReportButton component, /more/report-bug page. 12 review fixes applied including XSS escape, self-report guard, owner flag gate, LIKE injection, page_url unbounded, unstable Supabase client ref.

## Next Steps

- [ ] Admin dashboard for viewing reports (Phase 2)
- [ ] Duplicate report deduplication — prevent same user submitting identical reports up to rate limit
- [ ] File/screenshot upload on bug reports (post-MVP)
