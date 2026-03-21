# Auth — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Dark mode sidelined — force light mode, theme toggle replaced with "coming soon" placeholder.

**2026-03-17** — Claude Code (Sonnet 4.6, Pre-merge audit): Completed launch env setup — PostHog (EU), Sentry (EU), SIGNUP_MODE=public, REDIS_URL live; created `memory/service_accounts.md` with all third-party accounts.

**2026-03-17** — Claude Code (Sonnet 4.6, Redis swap): Switched rate limiter from `@vercel/kv` → `ioredis` using `REDIS_URL`; removed `@vercel/kv`, installed `ioredis`; singleton client, fail-open when `REDIS_URL` absent.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 04): Middleware auth — no changes needed, `proxy.ts` already handles session refresh correctly for Next.js 16.

**2026-03-15** — Claude Code (Sonnet 4.6): Renamed `middleware.ts` → `proxy.ts`, export renamed `middleware` → `proxy` (Next.js 16 deprecation fix).

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Added `SIGNUP_MODE=invite` gate on `/welcome` and `/signup` routes via middleware; created `/invite-only` static landing page.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Improved `/privacy` page — added GDPR legal bases (Art 6(1)(b)/(f)), technical data disclosure, Sentry SCCs note, objection/restriction/complaint rights; TODO comment left for registered business address.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): Created legal pages — `/terms` (Terms of Service) and `/privacy` (Privacy Policy with GDPR rights, cookie policy, data storage).

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): Added `returnTo` preservation in `middleware.ts` when bouncing unauthenticated users; `app/(auth)/login/page.tsx` redirects post-login; `app/(auth)/signup/page.tsx` passes `returnTo` as `next` param in email callback URL.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): Built full auth infrastructure — `lib/supabase/middleware.ts`, route protection middleware (PROTECTED_PREFIXES → /welcome, AUTH_ONLY_PREFIXES → /app/profile), `app/auth/callback/route.ts` (PKCE code exchange, error handling, safe redirect), login page, signup page with email verification confirmation, reset-password page, update-password page.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): Core DB schema — `users` table with handle, onboarding_complete, departments[], subscription fields; auth trigger `handle_new_user`; RLS on every table. OAuth (Google/Apple) deliberately excluded — email/password only until paying users justify the setup cost.

**2026-03-10** — Claude Code (Codex GUI): Structured `AGENTS.md` as the primary instruction set for all coding agents including auth/security workflow and decision principles.

**2026-03-08** — Claude Code: Created `CLAUDE.md`, `CHANGELOG.md`, `AGENTS.md` at repo root; confirmed Supabase projects created, auth enabled, RLS and env var connection pending.
