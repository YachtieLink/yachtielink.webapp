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

## Decisions That Bind This Module

- **D-012** — Growth pause mechanism: single config flag (`SIGNUP_MODE=invite`) to switch from public signup to invite-only
- **D-036** — Current build target is Phase 1A; OAuth deferred until there are enough paying users to justify developer account costs

## Next Steps

- [ ] Activate Google OAuth when user base justifies developer account cost
- [ ] Activate Apple OAuth (same gating as Google)
- [ ] Display auth error messages on `/welcome` when redirected from callback with `?error`
- [ ] Add email change flow (currently no UI for changing account email)
