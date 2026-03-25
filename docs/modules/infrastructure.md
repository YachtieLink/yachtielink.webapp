---
module: infrastructure
updated: 2026-03-25
status: shipped
phase: 1A
---

# Infrastructure

One-line: Supabase (Postgres + Auth + Storage + RLS), Vercel deployment with Sentry error tracking, Resend email (two-pipeline architecture), Redis rate limiting, and Vercel Cron jobs.

## Current State

- Supabase Postgres (v17) with 23 migrations: working
- Supabase Auth (Apple OAuth, Google OAuth, email/password): working
- Supabase Storage (profile photos, yacht photos, cert documents, CV uploads, gallery): working
- Supabase RLS on all tables: working
- Supabase server client (cookie-aware via `@supabase/ssr`): working
- Supabase service role client (bypasses RLS for webhooks/crons): working
- Supabase middleware client (session refresh in Next.js middleware): working
- Vercel deployment with Sentry integration: working
- Sentry client/server/edge configs: working — 10% traces, 50% error replays, no session replays
- Resend email with two pipelines (auth + notifications): working
- Redis rate limiting (Vercel KV / ioredis): working — fails open if Redis unavailable
- Security headers (HSTS, X-Frame-Options, CSP via Permissions-Policy, etc.): working
- Health check endpoint (`/api/health/supabase`): working
- Vercel Cron jobs (cert expiry daily, analytics nudge weekly): working
- Drift guardrails: `npm run drift-check`, canonical-owner docs, and critical-flow smoke checklist: working
- `next.config.ts` with Sentry wrapper and security headers: working
- Image optimization for Supabase Storage URLs: working
- RSC stale time cache (120s dynamic): working
- Known issues: Sentry DSN is env-var based — not yet configured for production (silent: true in build)

## Key Files

| What | Where |
|------|-------|
| Next.js config + Sentry | `next.config.ts` |
| Vercel cron config | `vercel.json` |
| Sentry client config | `sentry.client.config.ts` |
| Sentry server config | `sentry.server.config.ts` |
| Sentry edge config | `sentry.edge.config.ts` |
| Supabase server client | `lib/supabase/server.ts` |
| Supabase admin/service client | `lib/supabase/admin.ts` |
| Supabase middleware client | `lib/supabase/middleware.ts` |
| Supabase browser client | `lib/supabase/client.ts` |
| Supabase local config | `supabase/config.toml` |
| All migrations | `supabase/migrations/` (23 files) |
| Email index (two-pipeline) | `lib/email/index.ts` |
| Auth email pipeline | `lib/email/auth.ts` |
| Notification email pipeline | `lib/email/notify.ts` |
| Resend client singleton | `lib/email/client.ts` |
| Cert expiry email | `lib/email/cert-expiry.ts` |
| Subscription welcome email | `lib/email/subscription-welcome.ts` |
| Payment failed email | `lib/email/payment-failed.ts` |
| Analytics nudge email | `lib/email/analytics-nudge.ts` |
| Rate limiter (Redis) | `lib/rate-limit/limiter.ts` |
| Rate limit helpers + presets | `lib/rate-limit/helpers.ts` |
| Drift check script | `scripts/drift-check.mjs` |
| Canonical owner docs | `docs/ops/canonical-owners/` |
| Critical flow smoke checklist | `docs/ops/critical-flow-smoke-checklist.md` |
| Health check | `app/api/health/supabase/route.ts` |
| Cert expiry cron | `app/api/cron/cert-expiry/route.ts` |
| Analytics nudge cron | `app/api/cron/analytics-nudge/route.ts` |

## Supabase Architecture

**Auth**: Apple OAuth, Google OAuth, email/password. Email verification required for email accounts. Supabase Auth emails routed through Resend SMTP (configured in Supabase dashboard).

**Storage buckets**: profile-photos, yacht-photos, cert-documents, cv-uploads, user-gallery. RLS policies control access. Public read for profile/yacht photos.

**Database**: 23 migrations covering extensions, reference tables, core tables (users, yachts, attachments, endorsements, endorsement_requests, certifications, profile_analytics, saved_profiles, profile_folders, user_education, user_hobbies, user_skills, user_gallery, social_links), RPC functions (get_colleagues, get_analytics_summary, get_analytics_timeseries, record_profile_event, get_endorsement_request_limit), and indexes.

**RLS**: Enabled on all tables. Users can CRUD their own data. Endorsements and endorsement requests have more nuanced policies. Service role client bypasses RLS for cron jobs and webhooks.

## Email Architecture

Two-sender pipeline via Resend:

| Pipeline | From address | Use |
|----------|-------------|-----|
| Auth | `login@mail.yachtie.link` | Magic links, password reset, verification |
| Notifications | `notifications@mail.yachtie.link` | Endorsement alerts, cert expiry, analytics nudges, subscription emails |

Rule: auth sender is never mixed with product/marketing emails to protect deliverability.

## Rate Limiting

Redis-backed (ioredis), fixed-window algorithm. Fails open if Redis is unavailable.

| Category | Limit | Window | Scope |
|----------|-------|--------|-------|
| auth | 10 | 15 min | IP |
| profileView | 100 | 1 min | IP |
| profileEdit | 30 | 1 min | user |
| endorsementCreate | 5 | 24 hr | user |
| endorsementEdit | 20 | 1 hr | user |
| pdfGenerate | 10 | 1 hr | user |
| fileUpload | 20 | 1 hr | user |
| search | 60 | 1 min | user |
| accountFlag | 10 | 7 days | user |
| aiSummary | 10 | 1 hr | user |

Redis tier: Redis/30 MB free (shared). Revisit at ~5,000 DAU.

## Security Headers

Set in `next.config.ts` `headers()`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: on`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Sentry Configuration

| Setting | Client | Server | Edge |
|---------|--------|--------|------|
| Traces sample rate | 10% | 10% | 10% |
| Session replay | 0% | N/A | N/A |
| Error replay | 50% | N/A | N/A |
| Environment | `NODE_ENV` | `NODE_ENV` | `NODE_ENV` |

`withSentryConfig` wraps the Next.js config. `silent: true` suppresses CLI output. Source maps widened for client.

## Cron Jobs

| Path | Schedule | Runtime | Auth |
|------|----------|---------|------|
| `/api/cron/cert-expiry` | `0 9 * * *` (daily 09:00 UTC) | nodejs | `CRON_SECRET` bearer token |
| `/api/cron/analytics-nudge` | `0 10 * * 1` (Monday 10:00 UTC) | nodejs | `CRON_SECRET` bearer token |

## Environment Variables

Key variables (non-exhaustive):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_PRO_FOUNDING_PRICE_ID`, `STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID`
- `RESEND_API_KEY`
- `REDIS_URL`
- `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`

## Decisions That Bind This Module

- **D-012**: Growth pause mechanism — single config flag to switch from public signup to invite-only
- **D-015**: Consensus-based moderation — system must support future moderation infrastructure
- **D-036**: Current build target narrowed to yacht graph wedge — infrastructure supports Phase 1A scope

## Next Steps

- [ ] Configure Sentry DSN for production environment
- [ ] Set up Sentry alerts for error rate spikes
- [ ] Add uptime monitoring beyond the basic health check
- [ ] Review Redis tier at scale — upgrade from free shared to dedicated at ~5,000 DAU
- [ ] Add GDPR data export endpoint (JSON) and account deletion cascade as specified in launch prep
- [ ] Consider adding rate limit dashboard or logging for visibility into abuse patterns
