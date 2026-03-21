# Payments — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Insights page — Crew Pro CTA as sticky bottom overlay with expandable feature list; bento grid for Pro analytics (profile views hero + 2-col metrics); error toast on checkout failure.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 F): Added try/catch + handleApiError on `stripe/portal` route.

**2026-03-17** — Claude Code (Sonnet 4.6, pre-merge audit): Fixed `app/api/cv/generate-pdf/route.ts` — `isPro: false` hardcoded → `isPro: profile?.subscription_status === 'pro'`; was giving all users free PDF tier since Sprint 8.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 01): Fixed Stripe webhook — captures `.update()` errors and returns 500 on failure; was always returning 200.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7 addendum): Stripe go-live — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all price IDs added to Vercel; webhook configured at `https://yachtie.link/api/stripe/webhook`; migration 20260315000018 applied to production.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7 addendum): Founding member pricing (€4.99/mo locked forever, first 100 subs) — `resolveMonthlyPriceId()` checks `users.founding_member` count; if < 100 and `STRIPE_PRO_FOUNDING_PRICE_ID` is set, uses founding price; webhook stamps `founding_member = true` on user.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Founding annual price (€49.99/yr) — `resolveAnnualPriceId()` mirroring monthly logic; annual plan gets founding price when slots remain; `STRIPE_PRO_FOUNDING_ANNUAL_PRICE_ID` env var added.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Fixed Stripe webhook — `current_period_end` moved from top-level subscription to `items.data[0]` in Stripe API `2026-02-25.clover`; fallback handles both locations.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): UpgradeCTA pricing display overhaul — correct savings vs full €8.99/mo rate; shows "full price" labels (not "then €X" which implied a trial); founding cap shared across monthly and annual.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7 — Payments): Installed `stripe` npm package; `lib/stripe/client.ts` — lazy Stripe singleton (proxy pattern); `lib/stripe/pro.ts` — `getProStatus()` checking status flag and expiry date; `lib/supabase/admin.ts` — service role Supabase client.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): `POST /api/stripe/checkout` — creates/reuses Stripe Customer, creates Checkout Session; `POST /api/stripe/portal` — creates Customer Portal session.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Stripe webhook handler — handles `subscription.created/updated/deleted`, `invoice.payment_failed`; on create/update sets `subscription_status`, `subscription_plan`, `subscription_ends_at`, `show_watermark`; on delete revokes custom subdomain, resets template_id, sets `show_watermark = true`; sends welcome email on `subscription.created`.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Insights tab full rewrite — Pro: time-range toggle (7d/30d/all-time), analytics cards with bar charts, cert expiry card, plan management. Free: 5 teaser cards (locked), profile completeness gate, UpgradeCTA.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): `InsightsUpgradedToast.tsx` — post-checkout success/pending toast, auto-refreshes if webhook hasn't fired.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Pro PDF templates — Classic Navy (navy header, gold accents, Times-Roman serif) and Modern Minimal (teal hero, Helvetica, generous whitespace); template selector in CvActions — free users redirected to `/app/insights` on Pro template click.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): More tab — billing section: free users see upgrade link; Pro users see plan, renewal date, Manage Subscription button (Stripe Portal).

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): Migration `20260315000018_sprint7_payments.sql` — `users.analytics_nudge_sent`; `certifications.expiry_reminder_60d_sent` + `expiry_reminder_30d_sent`; `record_profile_event()`, `get_analytics_summary()`, `get_analytics_timeseries()`, `get_endorsement_request_limit()` RPCs; performance indexes.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 7): PostHog events — `pro.subscribed` (with plan + founding_member), `pro.cancelled` wired to Stripe webhook handler.

**2026-03-15** — Claude Code (Opus 4.6, AI Feature Registry): Pro pricing updated — EUR 4.99/mo founding, EUR 8.99/mo standard, EUR 69.99/yr; QR code Pro-tier customisation with colour pickers, SVG export, live preview, contrast validation.

**2026-03-13** — Claude Code (Opus 4.6): Feature spec — Pro pricing EUR 12/month or EUR 9/month annual (later updated); no free trial — free tier is the trial; custom subdomain as alias (both URLs active); subscription fields on `users` table ready since Sprint 1.
