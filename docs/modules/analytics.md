---
module: analytics
updated: 2026-03-21
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
| Manage subscription button | `components/insights/ManagePortalButton.tsx` |
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

## Decisions That Bind This Module

- **D-007**: Identity is free; presentation (including analytics) is paid
- **D-013**: No auto-summary language — the Insights page shows raw numbers, never labels like "well viewed"
- **D-023**: Pro tier includes profile analytics as a paid feature

## Next Steps

- [ ] Add PDF download and link share tracking to public profile page (record_profile_event calls)
- [ ] Consider weekly email digest for Pro users summarising their analytics
- [ ] Track endorsement-related events (request sent, endorsement received) in PostHog
- [ ] Evaluate whether chart library is needed or if CSS bars remain sufficient at scale
