# Yachtielink — TODO & Phase Tracking

This file tracks execution state.
Completed items are never deleted, only checked off.
All meaningful changes must be recorded in `/Users/ari/yachtielink.webapp/ops/LOG.md`.

---

## Change Control (Multi-Contributor)

- When updating any checklist status, add a matching log entry ID in `/Users/ari/yachtielink.webapp/ops/LOG.md`.
- Use log IDs in format: `LOG-YYYYMMDD-###`.
- Never remove old checklist items or old log entries.
- If a task changes scope, update text in this file and log the reason.

---

## Phase A — Identity & DNS (COMPLETE)

- [x] Purchase yachtie.link
- [x] Purchase yachtielink.com
- [x] Create Cloudflare account
- [x] Move nameservers to Cloudflare
- [x] Create Google Workspace (yachtie.link)
- [x] Verify domain via TXT record
- [x] Configure Google Workspace MX records
- [x] Confirm founder email operational

Status: ✅ Complete

---

## Phase B — Code & Deployment (IN PROGRESS)

- [x] Create GitHub organization
- [x] Create repo: yachtielink-webapp
- [x] Add branch protection on main (PR required, approvals 0)
- [x] Create /ops/STACK.md
- [x] Create /ops/TODO.md
- [x] Create Vercel account (sign up with GitHub)
- [x] Import repo into Vercel
- [x] Confirm preview deployments working

Status: ✅ Complete

---

## Phase C — Backend & Auth (IN PROGRESS)

### Infrastructure (done)
- [x] Create Supabase project: yachtielink-staging (EU)
- [x] Create Supabase project: yachtielink-prod (EU)
- [x] Enable Supabase Auth (Google, Apple, email/password)

### Planning (done)
- [x] Phase C implementation plan created (see `docs/scaffolding.md`)
- [x] Founder decisions captured: incremental schema, pricing deferred, PDF stays free

### Dependencies & Config
- [ ] Install deps: @supabase/supabase-js, @supabase/ssr, zod
- [ ] Create .env.local.example with required var names
- [ ] Connect Supabase env vars to Vercel (staging)
- [ ] Configure Supabase Auth providers in dashboard (Google, Apple, redirect URLs)

### Schema & Database
- [ ] Deploy initial migration: templates, roles, users tables
- [ ] Enforce RLS on all deployed tables
- [ ] Deploy handle_new_user() trigger
- [ ] Seed roles (16 crew positions) and templates (3)
- [ ] Enable pg_trgm extension

### Auth Implementation
- [ ] Create Supabase client utilities (browser, server, middleware, admin)
- [ ] Create root middleware (session refresh + route protection)
- [ ] Create auth callback route (OAuth code exchange)
- [ ] Create auth server actions (login, signup, signout, OAuth)
- [ ] Create Zod validation schemas for auth inputs
- [ ] Create login page
- [ ] Create signup page

### Profile & Config
- [ ] Create profile page (authenticated user views own data)
- [ ] Add security headers to next.config.ts
- [ ] Update layout metadata (title, viewport)
- [ ] Replace boilerplate landing page
- [ ] Create TypeScript types for database entities

### Verification
- [ ] npm run build succeeds
- [ ] Email signup + login works end-to-end
- [ ] Google OAuth flow works
- [ ] Protected route redirects unauthenticated users
- [ ] RLS policies tested

Status: ⏳ Planning complete, implementation next

---

## Phase D — Payments & Email

- [ ] Create Stripe account (EU)
- [ ] Create Crew Pro product (monthly)
- [ ] Create Resend account
- [ ] Verify domain with Resend
- [ ] Test transactional email send

Status: ⏳ Not started

---

## Phase E — Observability

- [ ] Create PostHog project
- [ ] Stub tripwire events
- [ ] Create Sentry project
- [ ] Connect frontend + API error reporting

Status: ⏳ Not started

---

## Deferred (Do Later)

- [ ] SPF / DKIM / DMARC hardening (after Workspace stable)
- [ ] Redirect yachtielink.com → yachtie.link
- [ ] Vercel Pro upgrade (before public beta)
- [ ] Supabase Pro upgrade (before public beta)

---

Last updated: 2026-02-11 (Phase C plan added)
