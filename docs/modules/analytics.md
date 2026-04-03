---
module: analytics
updated: 2026-04-03
status: shipped
phase: 1A
---

# Analytics

One-line: PostHog event tracking (client + server) plus a Pro-gated Insights dashboard showing profile views, PDF downloads, and link shares as time-series charts.

## Current State

- PostHog client-side provider: working — lazy-loaded, only on `/app/*` routes, manual events only (autocapture off)
- PostHog server-side tracking: working — `trackServerEvent()` used in webhook, saved-profiles, and other API routes
- Client event helpers (`trackEvent`, `identifyUser`, `resetAnalytics`): working
- Insights page for Pro users: working — 7d/30d/all-time toggle, bar charts for views/downloads/shares, summary counts
- Insights page for free users: working — teaser cards with lock icons, profile completeness gate before showing upgrade CTA
- Cert expiry widget (Pro only): working — counts certs expiring within 60 days
- Founding member slots remaining counter: working — shown in upgrade CTA for free users
- Analytics nudge cron (weekly, Mondays 10:00 UTC): working — emails free users with above-average profile views, sent once per user
- Cert expiry cron (daily, 09:00 UTC): working — emails Pro users at 60-day and 30-day windows
- `profile_analytics` table with RPC functions: working — `record_profile_event`, `get_analytics_summary`, `get_analytics_timeseries`
- AnalyticsChart component: working — pure CSS bar chart (no charting library dependency)
- Known issues: none identified

## Key Files

| What | Where |
|------|-------|
| PostHog client provider | `components/providers/PostHogProvider.tsx` |
| Client event helpers | `lib/analytics/events.ts` |
| Server event helper | `lib/analytics/server.ts` |
| Insights page (Pro dashboard) | `app/(protected)/app/insights/page.tsx` |
| Insights loading skeleton | `app/(protected)/app/insights/loading.tsx` |
| Bar chart component | `components/insights/AnalyticsChart.tsx` |
| Upgrade CTA (free users) | `components/insights/UpgradeCTA.tsx` |
| Post-upgrade toast | `components/insights/InsightsUpgradedToast.tsx` |
| Metric card | `components/insights/MetricCard.tsx` |
| Time range selector | `components/insights/TimeRangeSelector.tsx` |
| Career snapshot (free) | `components/insights/CareerSnapshot.tsx` |
| Who Viewed You (Pro) | `components/insights/WhoViewedYou.tsx` |
| Cert expiry cron | `app/api/cron/cert-expiry/route.ts` |
| Analytics nudge cron | `app/api/cron/analytics-nudge/route.ts` |
| Nudge email template | `lib/email/analytics-nudge.ts` |
| Cert expiry email template | `lib/email/cert-expiry.ts` |
| Analytics DB functions | `supabase/migrations/20260315000018_sprint7_payments.sql` |
| Vercel cron config | `vercel.json` |

## PostHog Configuration

- **Client**: `posthog-js` lazy-imported only on `/app/*` paths. `capture_pageview: false` (manual), `autocapture: false`, `persistence: localStorage`.
- **Server**: `posthog-node` singleton with `flushAt: 1, flushInterval: 0` for immediate flush in serverless.
- **Environment**: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (defaults to `https://us.i.posthog.com`).

## Tracked Events (Server-Side)

| Event | Where fired |
|-------|-------------|
| `pro.subscribed` | Stripe webhook (subscription created) |
| `pro.cancelled` | Stripe webhook (subscription deleted) |
| `profile.saved` | Saved profiles API route |

## DB Schema

`profile_analytics` table:
- `user_id`, `event_type`, `viewer_role`, `viewer_location`, `occurred_at`
- Index: `(user_id, event_type, occurred_at DESC)`

RPC functions (SECURITY DEFINER):
- `record_profile_event(uuid, text, text, text)` — inserts an event row
- `get_analytics_summary(uuid, integer)` — grouped counts by event type for N days
- `get_analytics_timeseries(uuid, text, integer)` — daily counts for a specific event type

## Cron Jobs

| Job | Schedule | What it does |
|-----|----------|--------------|
| `/api/cron/cert-expiry` | Daily 09:00 UTC | Emails Pro users about certs expiring in 60 or 30 days |
| `/api/cron/analytics-nudge` | Monday 10:00 UTC | Emails free users with 2x-average profile views (once per user) |

Both crons verify `CRON_SECRET` bearer token and use the service role Supabase client.

## Next Steps

- [ ] Add PDF download and link share tracking to public profile page (record_profile_event calls)
- [ ] Consider weekly email digest for Pro users summarising their analytics
- [ ] Track endorsement-related events (request sent, endorsement received) in PostHog
- [ ] Evaluate whether chart library is needed or if CSS bars remain sufficient at scale

## Decisions

**2026-01-31** — D-023: Profile analytics included in Crew Pro tier (€12/month). Free tier has no analytics. — Ari

## Recent Activity

**2026-04-03** — Rally 009 QA: Fixed `WhoViewedYou` hardcoded "30 days" copy — now accepts `range` prop and dynamically shows "last 7 days" / "last 30 days" / "last 12 months". Deleted dead `ManagePortalButton` component.

**2026-04-03** — Rally 009 Session 4: Insights dashboard rewrite. Pro: `TimeRangeSelector` (7d/30d/All), `MetricCard` grid (hero Profile Views + Downloads/Shares/Saves), `WhoViewedYou` viewer rows. Free: `CareerSnapshot` (3 stat cards), Profile Strength coaching ring, blurred analytics + upgrade CTA. Coral wayfinding. New components: MetricCard, TimeRangeSelector, CareerSnapshot, WhoViewedYou.

**2026-03-21** — Sprint 10.3: Insights page — Crew Pro CTA as sticky bottom overlay with expandable feature list; bento grid for Pro analytics (profile views hero + 2-col metrics); error toast on checkout failure; removed blur on teaser cards, readable text with inline Pro badge.
**2026-03-21** — Sprint 10.3: Bug fix — `expiry_date` → `expires_at` column mismatch fixed in insights, cron, and certs.
**2026-03-21** — Sprint 10.1 Wave 1 B: Insights chart colours now use `--chart-*` CSS vars for dark mode compatibility.
**2026-03-18** — Phase 1A Profile Robustness: `lib/profile-summaries.ts` — `computeProfileStrength` helper for server-side strength scoring used in analytics context.
**2026-03-17** — Pre-merge audit: Completed PostHog (EU) and Sentry (EU) launch env setup; created `memory/service_accounts.md` with all third-party accounts and Vercel env var status.
**2026-03-17** — Phase 1A Cleanup Spec 09: PostHogProvider now lazy-loads `posthog-js` via dynamic import; only loads on `/app/*` paths to reduce bundle size on public pages.
**2026-03-15** — Sprint 8: Sentry integration — `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`; `app/error.tsx` Sentry-integrated error boundary; `lib/api/errors.ts` — `handleApiError()` with Sentry capture.
**2026-03-15** — Sprint 8: PostHog — `PostHogProvider.tsx` (autocapture: false, replaysSessionSampleRate: 0); `lib/analytics/events.ts` — `trackEvent`, `identifyUser`, `resetAnalytics`; `lib/analytics/server.ts` — `trackServerEvent`, `getPostHogServer`; `CookieBanner.tsx` for consent.
**2026-03-15** — Sprint 8: PostHog events wired (11 total) — `endorsement.created/deleted/requested`, `cv.parsed/parse_failed`, `pro.subscribed/cancelled`, `moderation.flagged`; stubs for `profile.created`, `profile.shared`, `attachment.created`.
**2026-03-15** — Sprint 7: Insights tab full rewrite — Pro: time-range toggle (7d/30d/all-time), `AnalyticsChart.tsx` (pure CSS bar chart, no library), cert expiry card, plan management. Free: 5 teaser cards, profile completeness gate, UpgradeCTA.
**2026-03-15** — Sprint 7: Cron `app/api/cron/analytics-nudge/route.ts` — weekly Monday cron: finds free users with 2x average views, sends one-time nudge email, sets `analytics_nudge_sent = true`.
**2026-03-15** — Sprint 7: Migration `20260315000018` — `record_profile_event()`, `get_analytics_summary()`, `get_analytics_timeseries()` RPCs; index on `profile_analytics(user_id, event_type, occurred_at DESC)`.
**2026-03-15** — Sprint 7: `app/(public)/u/[handle]/page.tsx` — added `record_profile_event('profile_view')` fire-and-forget call on every public profile visit.
**2026-03-13** — Sprint 1: `profile_analytics` table created in core schema with owner read + public insert RLS; `internal.flags` table (no user access).
