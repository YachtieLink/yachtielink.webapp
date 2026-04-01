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

## Decisions

**2026-01-31** — D-027: Crew availability toggle expires after 7 days, must re-toggle. Active opt-in protects crew from unwanted contact; weekly expiry prevents stale "available" crew getting spammed. — Ari

**2026-01-28** — D-018: 67% supermajority for early account flag resolution, simple majority after 7 days, minimum 3 votes. Ossified accounts require 80%. Supermajority prevents marginal removals; minimum threshold prevents 1v1 disputes. — Ari

**2026-01-28** — D-016: Verified status earned via seed set, endorsements from verified users, or tenure+density. Paid subscription path removed 2026-03-08 to preserve the canonical monetisation rule. — Ari

**2026-01-28** — D-015: Moderation decisions resolved by community vote, not admin judgment. System-mediated moderation grounded in shared employment scales better and resists single points of failure. — Ari

**2026-01-27** — D-012: Single config flag to switch from public signup to invite-only. PM can pause first, explain after if founder unavailable. Reversing a pause is easy; reversing trust damage is not. — Ari

**2026-03-08** — D-036: Current build target narrowed to yacht graph wedge — infrastructure supports Phase 1A scope. — Ari

## Recent Activity

**2026-04-01** — Sprint 13 Polish Lane 2: Added `robots.txt` (disallow /app/, /onboarding/, /api/, /invite-only), sitemap `onboarding_complete` filter, OG/Twitter fallback metadata in root layout, cookie banner copy simplified, PublicHeader login link fix. PR #130 (merged).

**2026-03-26** — Wave 5 QA: Replaced `proxy.ts` with `middleware.ts` for subdomain routing. Fixed P1: `createMiddlewareClient` stale response reference — changed to getter pattern. Added `withCookies` helper to propagate auth cookie refresh onto all redirect/rewrite responses. Added empty subdomain guard.

**2026-03-25** — Codex: Added repo guardrails — `scripts/drift-check.mjs`, `npm run drift-check`, canonical-owner docs under `docs/ops/canonical-owners/`, critical-flow smoke checklist, and workflow/code-review updates to enforce them.

**2026-03-21** — Sprint 10.1: Migration `20260321000001_fix_storage_buckets.sql` — bucket creation (user-photos, user-gallery), yacht-photos RLS fix (ex-crew write block), `get_sea_time()` SECURITY DEFINER consistency.

**2026-03-21** — Sprint 10.1 Wave 1 F: API hardening — try/catch + handleApiError on stripe/portal, endorsement-requests, cron routes; health endpoint fixed to query `users` table with sanitised errors.

**2026-03-21** — Sprint 10.1 Wave 1 I: `admin.ts` guarded with `import 'server-only'`.

**2026-03-21** — Sprint 10.1 Wave 1 G: Storage — `uploadUserPhoto`, `uploadGalleryItem`, `deleteUserPhoto`, `deleteGalleryItem`, `extractStoragePath` added to `lib/storage/upload.ts`; account deletion cleans user-photos and user-gallery; PDF generation deletes previous export.

**2026-03-21** — Sprint 10.1 Wave 1 E: Route cleanup — `/app/audience` deleted (function renamed to `NetworkPage`); ghost " 2" directories removed.

**2026-03-18** — Project structure: Created `sprints/` folder hierarchy (major/, junior/, rallies/); `docs/disciplines/` with 6 discipline files; archived ops/ contents; updated AGENTS.md and CLAUDE.md with new structure.

**2026-03-17** — Redis swap: Switched rate limiter from `@vercel/kv` → `ioredis` using `REDIS_URL`; `npm audit fix` → 0 vulnerabilities; Vercel KV (Redis Labs) connected to project — `REDIS_URL` live in all environments (EU Central, free 30 MB tier).

**2026-03-17** — Pre-merge audit: Full codebase audit before merging `feat/sprint-8` → `main`; no critical conflicts; 10 `console.error` calls found (all safe, non-sensitive); `@vercel/kv` fully removed, `ioredis` properly in place.

**2026-03-17** — Phase 1A Cleanup Spec 11: Deleted dead `lib/cors.ts`; route-level error boundary with Sentry capture; CV API routes replaced inline Supabase client with `createServiceClient()`; share-link route Zod validation for `yacht_id`; CV download route rate limiting; `handleApiError()` wired in catch blocks.

**2026-03-17** — Phase 1A Cleanup Spec 09: Removed `Geist_Mono` font import; replaced `var(--font-geist-mono)` with system monospace stack; PostHogProvider lazy-loads posthog-js only on `/app/*` paths.

**2026-03-17** — Phase 1A Cleanup: `staleTimes.dynamic: 300` in next.config.ts — 5 min client-side RSC cache; BottomTabBar + SidebarNav prefetch all 5 tab routes on mount.

## Next Steps

- [ ] Configure Sentry DSN for production environment
- [ ] Set up Sentry alerts for error rate spikes
- [ ] Add uptime monitoring beyond the basic health check
- [ ] Review Redis tier at scale — upgrade from free shared to dedicated at ~5,000 DAU
- [ ] Add GDPR data export endpoint (JSON) and account deletion cascade as specified in launch prep
- [ ] Consider adding rate limit dashboard or logging for visibility into abuse patterns
