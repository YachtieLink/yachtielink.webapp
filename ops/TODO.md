# Yachtielink — TODO & Phase Tracking

This file tracks execution state.
Completed items are never deleted, only checked off.

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
- [ ] Create Vercel account (sign up with GitHub)
- [ ] Import repo into Vercel
- [ ] Confirm preview deployments working

Status: ⏳ In progress

---

## Phase C — Backend & Auth (NEXT)

- [ ] Create Supabase project: yachtielink-staging (EU)
- [ ] Create Supabase project: yachtielink-prod (EU)
- [ ] Enable Supabase Auth (Google, Apple, email/password)
- [ ] Enforce RLS on all tables
- [ ] Connect Supabase env vars to Vercel (staging)

Status: ⏳ Not started

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

Last updated: 2026-01-31
