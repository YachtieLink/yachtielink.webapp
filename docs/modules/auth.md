---
module: auth
updated: 2026-03-21
status: shipped
phase: 1A
---

# Auth

One-line: Email/password authentication with Supabase, PKCE code exchange, session management via middleware, and invite-only gate.

## Current State

- Email/password signup: working (Supabase `signUp` with email confirmation link)
- Email/password login: working (Supabase `signInWithPassword`)
- Password reset: working (sends reset link, redirects to `/update-password`)
- Email verification: working (PKCE code exchange at `/auth/callback`)
- Session refresh: working (middleware calls `getUser()` on every request to keep cookies in sync)
- OAuth (Apple, Google): placeholder only — buttons commented out in `/welcome` page, not wired up
- Redirect flow: working — `returnTo` param preserved through signup/login/callback for deep links
- Invite-only gate: working — `SIGNUP_MODE=invite` env var blocks `/welcome` and `/signup` unless `?invite` param present (D-012)
- Subdomain routing: working — `*.yachtie.link` rewrites to `/u/{handle}` via proxy middleware
- Protected routes: `/app/*` and `/onboarding/*` require auth; unauthenticated users redirected to `/welcome` with `returnTo`
- Auth-only routes: `/welcome`, `/login`, `/signup`, `/reset-password` redirect authenticated users to `/app/profile`
- RLS: Supabase anon key used client-side; service role key server-only via `admin.ts` with `'server-only'` import guard
- Rate limiting: auth endpoints use IP-scoped rate limit (10 requests per 15 minutes)

## Key Files

| What | Where |
|------|-------|
| Welcome page (auth method selection) | `app/(auth)/welcome/page.tsx` |
| Login page | `app/(auth)/login/page.tsx` |
| Signup page | `app/(auth)/signup/page.tsx` |
| Reset password page | `app/(auth)/reset-password/page.tsx` |
| Update password page | `app/(auth)/update-password/page.tsx` |
| Auth layout (redirect if signed in) | `app/(auth)/layout.tsx` |
| Auth callback (PKCE exchange) | `app/auth/callback/route.ts` |
| Middleware / proxy | `proxy.ts` |
| Supabase server client | `lib/supabase/server.ts` |
| Supabase browser client | `lib/supabase/client.ts` |
| Supabase middleware client | `lib/supabase/middleware.ts` |
| Supabase admin (service role) | `lib/supabase/admin.ts` |

## Decisions

**2025-11-20** — D-007: Identity is free infrastructure; presentation is paid and cosmetic only. Free identity removes barriers to graph formation. — Ari

## Next Steps

- [ ] Activate Google OAuth when user base justifies developer account cost
- [ ] Activate Apple OAuth (same gating as Google)
- [ ] Display auth error messages on `/welcome` when redirected from callback with `?error`
- [ ] Add email change flow (currently no UI for changing account email)

## Recent Activity

**2026-04-02** — Ghost flow fixes (pending push, lane 1 fix/ghost-closeout): Auth callback (`app/auth/callback/route.ts`) now calls `claim_ghost_profile()` after PKCE code exchange — ghost endorsements auto-merged on email verification and OAuth. Middleware (`middleware.ts`) fires a one-time ghost claim on first authenticated navigation via `yl_ghost_checked` session cookie (maxAge 1 year, wrapped in try-catch to prevent middleware crash on Supabase timeout) — covers password login path. Auth callback now checks both `next` and `returnTo` params for redirect consistency.

**2026-03-21** — Sprint 10.3: Dark mode sidelined — force light mode, theme toggle replaced with "coming soon" placeholder.
**2026-03-17** — Pre-merge audit: Completed launch env setup — PostHog (EU), Sentry (EU), SIGNUP_MODE=public, REDIS_URL live; created `memory/service_accounts.md` with all third-party accounts.
**2026-03-17** — Redis swap: Switched rate limiter from `@vercel/kv` → `ioredis` using `REDIS_URL`; removed `@vercel/kv`, installed `ioredis`; singleton client, fail-open when `REDIS_URL` absent.
**2026-03-17** — Phase 1A Cleanup Spec 04: Middleware auth — no changes needed, `proxy.ts` already handles session refresh correctly for Next.js 16.
**2026-03-15** — Renamed `middleware.ts` → `proxy.ts`, export renamed `middleware` → `proxy` (Next.js 16 deprecation fix).
**2026-03-15** — Sprint 8: Added `SIGNUP_MODE=invite` gate on `/welcome` and `/signup` via middleware; created `/invite-only` static landing page.
**2026-03-15** — Sprint 8: Improved `/privacy` page — added GDPR legal bases (Art 6(1)(b)/(f)), technical data disclosure, Sentry SCCs note, objection/restriction/complaint rights.
**2026-03-15** — Sprint 8: Created legal pages — `/terms` (Terms of Service) and `/privacy` (Privacy Policy with GDPR rights, cookie policy, data storage).
**2026-03-14** — Sprint 5: Added `returnTo` preservation in middleware when bouncing unauthenticated users; login redirects post-login; signup passes `returnTo` as `next` param in email callback URL.
**2026-03-13** — Sprint 1: Built full auth infrastructure — middleware, route protection, PKCE callback, login/signup/reset-password/update-password pages. Core DB schema with `users` table, auth trigger, RLS on every table. OAuth deliberately excluded until paying users justify setup cost.
**2026-03-10** — Codex GUI: Structured `AGENTS.md` as primary instruction set including auth/security workflow and decision principles.
**2026-03-08** — Created `CLAUDE.md`, `CHANGELOG.md`, `AGENTS.md`; confirmed Supabase projects created, auth enabled, RLS and env var connection pending.
