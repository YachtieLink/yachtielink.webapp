---
module: payments
updated: 2026-03-21
status: shipped
phase: 1A
---

# Payments

One-line: Stripe-powered Crew Pro subscription (EUR 12/month or EUR 9/month annual) with checkout, billing portal, webhook lifecycle, and founding member pricing.

## Current State

- Stripe Checkout (subscription mode): working
- Stripe Customer Portal (manage/cancel): working
- Webhook handler (created/updated/deleted/payment_failed): working
- Founding member pricing (100-slot cap, EUR 4.99/mo or EUR 49.99/yr): working
- Pro status check (`getProStatus`): working — belt-and-suspenders check on both `subscription_status` and `subscription_ends_at`
- Welcome email on subscription: working (via Resend)
- Payment failed email: working (via Resend)
- Rate limiting on checkout endpoint: working (10 req / 15 min / IP)
- Pro feature gating in UI (Insights page, PDF templates, endorsement request limits, cert expiry reminders): working
- Subscription downgrade on cancellation resets `show_watermark`, `custom_subdomain`, `template_id`: working
- Known issues: `current_period_end` fallback logic in webhook has a cast to `any` — works but fragile across Stripe API version bumps

## Key Files

| What | Where |
|------|-------|
| Stripe singleton client | `lib/stripe/client.ts` |
| Pro status query | `lib/stripe/pro.ts` |
| Checkout API route | `app/api/stripe/checkout/route.ts` |
| Billing portal API route | `app/api/stripe/portal/route.ts` |
| Webhook handler | `app/api/stripe/webhook/route.ts` |
| Upgrade CTA component | `components/insights/UpgradeCTA.tsx` |
| Manage subscription button | `components/insights/ManagePortalButton.tsx` |
| Post-upgrade toast | `components/insights/InsightsUpgradedToast.tsx` |
| Welcome email | `lib/email/subscription-welcome.ts` |
| Payment failed email | `lib/email/payment-failed.ts` |
| Payments migration | `supabase/migrations/20260315000018_sprint7_payments.sql` |
| Checkout validation schema | `lib/validation/schemas.ts` (checkoutSchema) |

## Schema

Users table columns added by Sprint 7 migration:

- `subscription_status` — `'free'` or `'pro'`
- `subscription_plan` — `'monthly'` or `'annual'` or null
- `subscription_ends_at` — ISO timestamp or null
- `stripe_customer_id` — Stripe customer ID, set lazily on first checkout
- `show_watermark` — boolean, true for free, false for Pro
- `founding_member` — boolean, set via webhook metadata
- `analytics_nudge_sent` — boolean, prevents re-sending the upgrade nudge

## Pricing Architecture

| Plan | Standard | Founding (first 100) |
|------|----------|---------------------|
| Monthly | EUR 8.99/mo | EUR 4.99/mo |
| Annual | EUR 69.99/yr | EUR 49.99/yr |

Founding member count is checked at checkout time against the shared 100-slot cap. Price IDs are resolved dynamically (`resolveMonthlyPriceId`, `resolveAnnualPriceId`). Founding price locks in forever for that subscriber.

## Webhook Events Handled

1. `customer.subscription.created` — set Pro status, send welcome email, fire `pro.subscribed` PostHog event
2. `customer.subscription.updated` — sync status, plan, period end
3. `customer.subscription.deleted` — downgrade to free, clear Pro-only fields
4. `invoice.payment_failed` — log warning, send email, do NOT downgrade (Stripe retries)

## Next Steps

- [ ] Monitor `current_period_end` extraction — verify against next Stripe API version update
- [ ] Add annual plan toggle to billing portal return URL for plan switching
- [ ] Consider subscription pause (Stripe pause collection) for crew between contracts
- [ ] Track founding member conversion rate via PostHog

## Decisions

**2026-01-31** — D-024: Recruiters pay €29/month + credits (€75–1200 bundles) to access crew search. Credits unlock name and contact details from search results. 1 credit = 1 profile unlock, permanent per recruiter-crew pair, credits expire 1 year from purchase. — Ari
**2026-01-31** — D-023: Crew Pro (€12/month) includes database search, extended availability reach, cert expiry alerts, profile analytics, and increased job post limits. Free: 1 job post/month, network-only availability. Pro: 3 posts/month, 2nd-degree reach, full analytics. — Ari
**2026-01-31** — D-022: Users with full profiles can post jobs for free. No paid listings, no placement fees, no recruiter tools. Jobs are a use case for the graph, not a separate product. — Ari
**2025-12-01** — D-004: Monetisation sequence — crew subscription revenue must stabilise before any yacht-side payments. Whoever pays first has implicit power. — Ari
**2025-11-20** — D-007: Identity is free infrastructure; presentation is paid and cosmetic only. — Ari
**2025-11-15** — D-003: Never monetise influence over trust outcomes. The entire value proposition collapses if trust can be bought. — Ari

## Recent Activity

**2026-03-21** — Sprint 10.3: Insights page — Crew Pro CTA as sticky bottom overlay with expandable feature list; bento grid for Pro analytics (profile views hero + 2-col metrics); error toast on checkout failure.
**2026-03-21** — Sprint 10.1 Wave 1 F: Added try/catch + handleApiError on `stripe/portal` route.
**2026-03-17** — Pre-merge audit: Fixed `app/api/cv/generate-pdf/route.ts` — `isPro: false` hardcoded → `isPro: profile?.subscription_status === 'pro'`; was giving all users free PDF tier since Sprint 8.
**2026-03-17** — Phase 1A Cleanup Spec 01: Fixed Stripe webhook — captures `.update()` errors and returns 500 on failure; was always returning 200.
**2026-03-15** — Sprint 7 addendum: Stripe go-live — all env vars added to Vercel; webhook configured at `https://yachtie.link/api/stripe/webhook`; migration 20260315000018 applied to production.
**2026-03-15** — Sprint 7 addendum: Founding member pricing (€4.99/mo locked forever, first 100 subs) — `resolveMonthlyPriceId()` checks `users.founding_member` count; founding price applied if < 100 slots remain.
**2026-03-15** — Sprint 7: Founding annual price (€49.99/yr) — `resolveAnnualPriceId()` mirrors monthly logic; `STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID` env var added.
**2026-03-15** — Sprint 7: Fixed Stripe webhook — `current_period_end` moved from top-level to `items.data[0]` in Stripe API `2026-02-25.clover`; fallback handles both locations.
**2026-03-15** — Sprint 7: UpgradeCTA pricing display overhaul — correct savings vs full €8.99/mo rate; founding cap shared across monthly and annual.
**2026-03-15** — Sprint 7: Installed `stripe` npm package; `lib/stripe/client.ts` — lazy Stripe singleton; `lib/stripe/pro.ts` — `getProStatus()` checking status flag and expiry date; `lib/supabase/admin.ts` — service role Supabase client.
**2026-03-15** — Sprint 7: `POST /api/stripe/checkout` — creates/reuses Stripe Customer, creates Checkout Session; `POST /api/stripe/portal` — creates Customer Portal session.
**2026-03-15** — Sprint 7: Stripe webhook handler — handles `subscription.created/updated/deleted`, `invoice.payment_failed`; on delete revokes custom subdomain, resets template_id, sets `show_watermark = true`; sends welcome email on `subscription.created`.
**2026-03-15** — Sprint 7: `InsightsUpgradedToast.tsx` — post-checkout success/pending toast, auto-refreshes if webhook hasn't fired.
**2026-03-15** — Sprint 7: Pro PDF templates — Classic Navy and Modern Minimal; template selector in CvActions with Pro gate redirect to `/app/insights`.
**2026-03-13** — Feature spec: Pro pricing EUR 12/month or EUR 9/month annual; no free trial — free tier is the trial; custom subdomain as alias (both URLs active).
