# CV Parse — Pro Upsell on Rate Limit

**Created:** 2026-03-30
**Priority:** Medium
**Scope:** Free users hitting CV parse rate limit
**Effort:** Small

## Problem

When free users hit the CV parse rate limit (currently 3/day shown in banner), the messaging is apologetic ("Running these costs us real money!"). This is a natural upsell moment — the user is actively engaged and wants to keep going.

## Proposed Solution

Replace the rate limit banner with a Pro upsell:

- Free users: 3 CV reads per day
- Pro users: 10 CV reads per day (or unlimited)
- When the limit is hit, show: "You've used your free CV reads for today. Upgrade to Pro for more reads per day." with a CTA to `/app/settings/plan`

The banner should feel like a value proposition, not a punishment. The user just experienced the CV parser working — now tell them Pro gives them more of it.

## Copy Direction

"You've used your 3 free CV imports today. Pro members get 10 per day — along with a custom subdomain, analytics, and more."

[Upgrade to Pro] button → `/app/settings/plan`

## Dependencies

- Rate limit already exists and works
- Plan page already exists at `/app/settings/plan`
- Just needs copy change in CvImportWizard.tsx rate limit banner + Pro status check
