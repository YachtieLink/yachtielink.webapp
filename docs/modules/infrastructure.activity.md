# Infrastructure — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1): Migration `20260321000001_fix_storage_buckets.sql` — bucket creation (user-photos, user-gallery), yacht-photos RLS fix (ex-crew write block), `get_sea_time()` SECURITY DEFINER consistency.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 F): API hardening — try/catch + handleApiError on stripe/portal, endorsement-requests, cron routes; health endpoint fixed to query `users` table with sanitised errors.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 I): `admin.ts` guarded with `import 'server-only'`.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 G): Storage — `uploadUserPhoto`, `uploadGalleryItem`, `deleteUserPhoto`, `deleteGalleryItem`, `extractStoragePath` added to `lib/storage/upload.ts`; account deletion cleans user-photos and user-gallery; PDF generation deletes previous export.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 E): Route cleanup — `/app/audience` deleted (function renamed to `NetworkPage`); ghost " 2" directories removed.

**2026-03-18** — Cowork (Opus 4.6, Project structure): Created `sprints/` folder hierarchy (major/, junior/, rallies/); `docs/disciplines/` with 6 discipline files (frontend.md, backend.md, design.md, performance.md, code-review.md, auth-security.md); archived ops/ contents; updated AGENTS.md and CLAUDE.md with new structure.

**2026-03-17** — Claude Code (Sonnet 4.6, Redis swap): Switched rate limiter from `@vercel/kv` → `ioredis` using `REDIS_URL`; `npm audit fix` → 0 vulnerabilities; Vercel KV (Redis Labs) connected to project — `REDIS_URL` live in all environments (EU Central, free 30 MB tier).

**2026-03-17** — Claude Code (Sonnet 4.6, pre-merge audit): Full codebase audit before merging `feat/sprint-8` → `main`; no critical conflicts; 10 `console.error` calls found (all safe, non-sensitive); `@vercel/kv` fully removed, `ioredis` properly in place.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 11): Deleted dead `lib/cors.ts`; route-level error boundary (`app/(protected)/app/error.tsx`) with Sentry capture; CV API routes replaced inline Supabase client with `createServiceClient()`; share-link route Zod validation for `yacht_id`; CV download route rate limiting; `handleApiError()` wired in catch blocks.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 09): Removed `Geist_Mono` font import; replaced `var(--font-geist-mono)` with system monospace stack; PostHogProvider lazy-loads posthog-js only on `/app/*` paths.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 05): Created `public/manifest.webmanifest` with app name, theme color, icons; placeholder PWA icons (icon-192.png, icon-512.png, apple-touch-icon.png); added manifest, apple icons, appleWebApp, viewportFit: "cover" to root layout; deleted unused Next.js boilerplate SVGs.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup): `staleTimes.dynamic: 300` in next.config.ts — 5 min client-side RSC cache; BottomTabBar + SidebarNav prefetch all 5 tab routes on mount.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup): Reconciled diverged local/remote main via rebase; cleaned up 64 iCloud sync conflict duplicate files.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Installed zod, posthog-js, posthog-node, @sentry/nextjs, @vercel/kv; `next.config.ts` updated with X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy + `withSentryConfig` wrapper.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Rate limiting — `lib/rate-limit/limiter.ts` (Vercel KV sliding window counter); `lib/rate-limit/helpers.ts` — `applyRateLimit()`, `RATE_LIMITS` config, `getClientIP()`; applied to 6 API routes; Stripe webhook intentionally excluded.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Zod validation — `lib/validation/schemas.ts` (all schemas), `lib/validation/validate.ts` (`validateBody()` helper), `lib/validation/sanitize.ts` (`sanitizeHtml()`); applied to endorsement, CV, Stripe, account delete, handle routes.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): GDPR — `GET /api/account/export` (full data export as JSON download); `POST /api/account/delete` (soft-delete: anonymise user, cancel Stripe, delete files, delete auth user; endorsements attributed to "[Deleted User]"); migration `20260315000020_sprint8_launch_prep.sql` — `deleted_at` on users + 7 performance indexes.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): `lib/api/errors.ts` — `apiError()`, `handleApiError()` with Sentry capture; `app/error.tsx` Sentry-integrated error boundary; `app/not-found.tsx` 404 page.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Email infrastructure for notifications — cert expiry reminder (`lib/email/cert-expiry.ts`), subscription welcome (`lib/email/subscription-welcome.ts`), payment failed (`lib/email/payment-failed.ts`), analytics nudge (`lib/email/analytics-nudge.ts`).

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Crons — `vercel.json` configured: cert-expiry at 09:00 UTC daily, analytics-nudge at 10:00 UTC Mondays; both routes gated by `CRON_SECRET`.

**2026-03-16** — Claude Code (Sonnet 4.6, post-Sprint 8 QA): Fixed rate limiter (`lib/rate-limit/limiter.ts`) — fails open gracefully when `KV_REST_API_URL` is placeholder or missing; was crashing with ENOTFOUND in dev. Created dev/QA Supabase account (`dev@yachtie.link`).

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): `lib/supabase/admin.ts` — service role Supabase client for webhook + cron routes.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 6): Migration `20260315000017_sprint6_cv_storage.sql` — `cv-uploads` + `pdf-exports` buckets, owner-only RLS, user columns (`cv_storage_path`, `cv_parsed_at`, `cv_parse_count_today/reset_at`, `latest_pdf_path/generated_at`), `check_cv_parse_limit` RPC (3/day); `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` added to env vars.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Cert Document Manager — `app/api/cron/cert-expiry/route.ts` daily cron: finds Pro users' certs expiring ≤60 days, sends 60d + 30d reminders.

**2026-03-15** — Claude Code (Sonnet 4.6): Renamed `middleware.ts` → `proxy.ts` (Next.js 16 deprecation fix).

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 3 close): Diagnosed production env var issue — Vercel had staging Supabase keys; updated to production keys; added missing `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`; migration `20260314000010_grant_rpc_execute.sql` — GRANT EXECUTE on all public RPC functions to anon/authenticated.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Migration `20260314000011_yacht_sprint4.sql`; `.obsidian/` added to `.gitignore`.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Supabase CLI installed and linked to prod — future migrations use `npx supabase db push`. Migrations 012–016 applied to production; SECURITY DEFINER RPC `get_endorsement_request_by_token` bypasses RLS, granted to anon.

**2026-03-13** — Claude Code (Sonnet 4.6, Email): Installed `resend`; created `lib/email/` two-pipeline architecture — `client.ts` (Resend singleton), `auth.ts` (login@mail.yachtie.link), `notify.ts` (notifications@mail.yachtie.link); `mail.yachtie.link` verified on Cloudflare with SPF/DKIM.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): Installed Supabase CLI v2.78.1; wrote 7 database migrations (extensions, reference tables, core tables, functions, RLS, seed, constraint fix) applied to production; seeded 57 cert types across 8 categories and 3 PDF templates.

**2026-03-10** — Claude Code (Codex GUI): Switched GitHub remote from SSH to HTTPS; `.claude/worktrees/` added to `.gitignore`; resolved branch staleness (4 PRs behind).

**2026-03-09** — Claude Code: Created `docs/yl_build_plan.md` — canonical sprint-by-sprint build plan for Phase 1A; updated `yl_system_state.json` status from "Pre-build" to "Building".

**2026-03-08** — Claude Code: Consolidated project structure — planning docs moved from `Project Files/` into `docs/`; archived `ops/` legacy files; created `CLAUDE.md`, `CHANGELOG.md`, `README.md` at repo root; confirmed Supabase client setup and API health check exist as uncommitted changes.
