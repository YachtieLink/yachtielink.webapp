# Analytics — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Insights page — Crew Pro CTA as sticky bottom overlay with expandable feature list; bento grid for Pro analytics (profile views hero + 2-col metrics); error toast on checkout failure; removed blur on teaser cards, readable text with inline Pro badge.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Bug fix — `expiry_date` → `expires_at` column mismatch fixed in insights, cron, and certs.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 B): Insights chart colours now use `--chart-*` CSS vars for dark mode compatibility.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): `lib/profile-summaries.ts` — `computeProfileStrength` helper for server-side strength scoring used in analytics context.

**2026-03-17** — Claude Code (Sonnet 4.6, pre-merge audit): Completed PostHog (EU) and Sentry (EU) launch env setup; created `memory/service_accounts.md` with all third-party accounts and Vercel env var status.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 09): PostHogProvider now lazy-loads `posthog-js` via dynamic import; only loads on `/app/*` paths to reduce bundle size on public pages.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Sentry integration — `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`; `app/error.tsx` Sentry-integrated error boundary; `lib/api/errors.ts` — `handleApiError()` with Sentry capture.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): PostHog — `components/providers/PostHogProvider.tsx` (autocapture: false, replaysSessionSampleRate: 0); `lib/analytics/events.ts` — `trackEvent`, `identifyUser`, `resetAnalytics` (client-side); `lib/analytics/server.ts` — `trackServerEvent`, `getPostHogServer` (server-side); `CookieBanner.tsx` for consent.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): PostHog events wired (11 total) — `endorsement.created`, `endorsement.deleted`, `endorsement.requested`, `cv.parsed`, `cv.parse_failed`, `pro.subscribed`, `pro.cancelled`, `moderation.flagged`; stubs for `profile.created`, `profile.shared`, `attachment.created` (need wiring in client components).

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Insights tab full rewrite — Pro: time-range toggle (7d/30d/all-time), `AnalyticsChart.tsx` (pure CSS bar chart, no library), cert expiry card, plan management. Free: 5 teaser cards, profile completeness gate, UpgradeCTA.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Cron `app/api/cron/analytics-nudge/route.ts` — weekly Monday cron: finds free users with 2x average views, sends one-time nudge email, sets `analytics_nudge_sent = true`.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Migration `20260315000018` — `record_profile_event()`, `get_analytics_summary()`, `get_analytics_timeseries()` RPCs; index on `profile_analytics(user_id, event_type, occurred_at DESC)`.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): `app/(public)/u/[handle]/page.tsx` — added `record_profile_event('profile_view')` fire-and-forget call on every public profile visit.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): `profile_analytics` table created in core schema with owner read + public insert RLS; `internal.flags` table (no user access).
