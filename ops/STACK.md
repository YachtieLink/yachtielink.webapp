# Yachtielink — Tech Stack (Source of Truth)

This file is the canonical record of all infrastructure, ownership, and upgrade triggers.
If it’s not here, it doesn’t exist.

---

## Identity & Access

**Owner email:** ari@yachtie.link  
**Password manager:** iCloud Keychain (primary)

---

## Domains & DNS

**Registrar:** Namecheap  
**DNS:** Cloudflare (nameservers authoritative)

- yachtie.link — primary domain
- yachtielink.com — redirect → yachtie.link

---

## Code & Deployment

**Repo:** GitHub org `yachtielink`  
**Main app:** `yachtielink-webapp`

**Hosting:** Vercel  
- Preview deploys on every PR
- Production deploys from `main` only

---

## Backend & Auth

**Database:** Supabase (Postgres, EU region)

Projects (planned):
- `yachtielink-staging`
- `yachtielink-prod`

**Auth:** Supabase Auth  
- Google OAuth
- Apple OAuth
- Email/password

Rules:
- RLS enabled on all tables
- No manual edits in prod

---

## Payments

**Provider:** Stripe (EU)

Products (planned):
- Crew Pro — Monthly
- Crew Pro — Annual (later)

Rules:
- No trust-affecting monetisation

---

## Email

**Transactional:** Resend  
- Account emails
- System notifications only

Rules:
- No marketing flows

---

## Analytics & Monitoring

**Product analytics:** PostHog  
- Track only tripwire metrics

**Errors:** Sentry  
- Frontend + API routes
- Alerts → founder email only

---

## Rate Limiting & Jobs

**Rate limiting:** Vercel KV (Upstash)  
**Background jobs:** Supabase Edge Functions + pg_cron

---

## Environments

- Local — Supabase CLI
- Staging — Vercel Preview + Supabase staging
- Production — Vercel Prod + Supabase prod

Rules:
- Staging can break
- Production via PR only
- Secrets via Vercel env vars only
