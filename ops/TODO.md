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

## Phase C — Backend & Auth (NEXT)

- [x] Create Supabase project: yachtielink-staging (EU)
- [x] Create Supabase project: yachtielink-prod (EU)
- [x] Enable Supabase Auth (Google, Apple, email/password)
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

Last updated: 2026-02-11
