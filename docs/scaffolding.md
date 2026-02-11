# Phase C Scaffolding — Database + Auth

**Created:** 2026-02-11
**Status:** Plan approved, implementation not started
**Plan file:** `/Users/ari/.claude/plans/peppy-churning-pebble.md`

---

## Quick Summary

Phase C connects the Next.js boilerplate to Supabase for auth + initial schema. Deliverable: users can sign up (email/Google/Apple), sign in, view their profile, sign out. 20 files total (16 new, 4 modified).

---

## Implementation Order

| # | Task | Files |
|---|------|-------|
| 1 | Install deps | `npm install @supabase/supabase-js @supabase/ssr zod` |
| 2 | Env var template | `.env.local.example` |
| 3 | SQL migration | `supabase/migrations/20260211000000_initial_auth_schema.sql` |
| 4 | TypeScript types | `lib/types/database.ts` |
| 5 | Supabase clients | `lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `admin.ts` |
| 6 | Root middleware | `middleware.ts` |
| 7 | Config updates | `next.config.ts`, `app/layout.tsx` |
| 8 | Zod schemas | `lib/validations/auth.ts` |
| 9 | Auth callback | `app/auth/callback/route.ts` |
| 10 | Auth actions | `app/(auth)/actions.ts` |
| 11 | Auth UI | `app/(auth)/login/page.tsx`, `signup/page.tsx`, `_components/oauth-buttons.tsx` |
| 12 | Profile page | `app/(protected)/profile/page.tsx`, `_components/sign-out-button.tsx` |
| 13 | Landing page | `app/page.tsx` (replace boilerplate) |
| 14 | Build + test | `npm run build`, manual E2E |

---

## Key Decisions Already Made

- Schema: incremental (only `users`, `roles`, `templates` tables for now)
- Pricing: decide later (no Stripe this phase)
- PDF export: stays free
- User adds Supabase env vars to Vercel themselves
- Apple OAuth can be deferred if setup blocks progress
- Migration run manually via Supabase SQL Editor (not CLI)

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Supabase Dashboard Config (Manual, Before Testing)

1. Auth > Email: enable, min password 12 chars
2. Auth > Google: enable, set OAuth credentials
3. Auth > Apple: enable or defer
4. Auth > URL Config: add redirect URLs (`localhost:3000`, `yachtie.link`, `*.vercel.app`)

---

## Schema Tables for This Phase

Source: `docs/canonical/yl_schema.md`

1. **templates** — reference table (must be created before users due to FK)
2. **roles** — reference table with 16 seed crew positions
3. **users** — extends auth.users, profile data, RLS: public read, self-update
4. **handle_new_user() trigger** — auto-creates users row on auth signup
5. **pg_trgm extension** — for fuzzy search indexes

---

## Critical Architecture Notes

- Use `getUser()` not `getSession()` in server code (security: validates token server-side)
- Use `await cookies()` in server client (Next.js 16 async requirement)
- No INSERT RLS policy on users — rows created by trigger (security definer)
- OAuth redirectTo uses `NEXT_PUBLIC_SITE_URL` env var
- Middleware matcher excludes static assets

---

## What Comes After Phase C

- Phase D: Onboarding flow, profile editing, public profiles, yachts + attachments tables
- Phase D: Rate limiting (Vercel KV), Stripe, Resend email
- Phase E: Observability (PostHog, Sentry)

---

## To Resume

Tell Claude: "Continue implementing Phase C from docs/scaffolding.md" — the plan file at `/Users/ari/.claude/plans/peppy-churning-pebble.md` has the full detailed plan with code patterns for every file.
