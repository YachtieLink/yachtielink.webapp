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

## Decisions That Bind This Module

- **D-003**: Never monetise influence over trust outcomes
- **D-004**: Crew pay first, yachts pay later
- **D-007**: Identity is free; presentation is paid and cosmetic only
- **D-014**: PDF snapshot/export is free identity infrastructure
- **D-023**: Pro tier at EUR 12/month with search, analytics, cert alerts, endorsement request boost

## Next Steps

- [ ] Monitor `current_period_end` extraction — verify against next Stripe API version update
- [ ] Add annual plan toggle to billing portal return URL for plan switching
- [ ] Consider subscription pause (Stripe pause collection) for crew between contracts
- [ ] Track founding member conversion rate via PostHog
