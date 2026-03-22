# Sprint 19 — Recruiter Access

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 2
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 18 (peer hiring with positions, applications, graph proximity RPC, position feed)

## Goal

Open the platform to external recruiters — the first non-crew users. Recruiters pay EUR 29/month to access the crew search infrastructure built in Sprint 15, and purchase credits (EUR 75–1200 bundles) to unlock full profile details (name, contact) from search results. This is the demand-side revenue channel that validates the business model: the graph is valuable enough that people outside it will pay to look in. Sprint 18's `get_graph_proximity()` RPC is reused to show recruiters which crew are connected to other crew they've already unlocked — making the graph discoverable even to outsiders. The constitutional guardrail is D-024: recruiters get read-only access. They cannot endorse, create attachments, post positions, signal on endorsements, or affect the trust graph in any way.

## Scope

**In:**
- Recruiter account type: separate signup flow, distinct from crew accounts
- Recruiter subscription: EUR 29/month via Stripe (separate Stripe product/price from Crew Pro)
- Credit system: purchase bundles (EUR 75/10 credits → EUR 1,200/200 credits), 1 credit = 1 profile unlock, permanent per recruiter-crew pair, credits expire 1 year from purchase
- Recruiter search: extends Sprint 15's `search_crew()` with endorsement count sorting (D-026), locked name/contact in results
- Profile unlock: spend 1 credit to reveal name and contact details from search results
- Crew opt-in for recruiter visibility: default off, toggle in availability settings (Sprint 14 infrastructure)
- Recruiter dashboard: search, unlocked profiles, credit balance, purchase history
- Recruiter-facing profile view: same public profile but with "Unlock" CTA on name/contact if not yet unlocked
- Endorsement count display in search results: "X endorsements from Y people across Z yachts" (D-026)

**Out:**
- Agency/multi-seat accounts (Sprint 20 — builds on individual recruiter infrastructure)
- NLP/semantic crew search (Sprint 20, AI-07 — this sprint uses the existing filter-based search)
- Recruiter job posting (recruiters can browse peer-posted positions from Sprint 18 but cannot post — they're not crew)
- Recruiter-to-crew messaging (Phase 3 — recruiters use unlocked contact methods)
- Recruiter analytics or reporting beyond basic purchase history
- Recruiter profile pages (recruiters don't have profiles — they're observers, not graph participants)
- Bulk unlock or CSV export (Sprint 20 agency features)
- Recruiter referral or affiliate system
- Recruiter reviews or ratings of crew (D-002: no ratings)

## Dependencies

- Sprint 18 complete: `get_graph_proximity()` RPC, positions infrastructure (recruiters can browse positions)
- Sprint 15 complete: `search_crew()` RPC with multi-filter pagination, crew search UI patterns
- Sprint 14 complete: `availability_status` and `availability_contact_methods` on users (crew opt-in for recruiter visibility)
- Stripe infrastructure from Sprint 7: Stripe Customer, Checkout, Portal, webhook handler (extended for recruiter products)
- Resend email infrastructure from Sprint 5/8 (recruiter welcome email, credit purchase confirmation)
- PostHog from Sprint 8 (recruiter event tracking)
- `endorsements` table with endorser/recipient/yacht data — exists from Sprint 5 (for endorsement count display)

## Key Deliverables

### Recruiter Account Model

- ⬜ `account_type` column on `users` table: `crew` (default), `recruiter` — or a separate `recruiters` table if cleaner separation is needed
- ⬜ **Recommended: separate `recruiters` table** to avoid polluting the crew user model:
  - `id` uuid PK
  - `email` text UNIQUE NOT NULL
  - `company_name` text NOT NULL
  - `contact_name` text NOT NULL
  - `phone` text
  - `stripe_customer_id` text
  - `subscription_status` text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'past_due', 'cancelled'))
  - `subscription_id` text (Stripe subscription ID)
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()
- ⬜ Separate auth flow: recruiter signup at `/recruiter/signup` (email/password only — no OAuth for recruiters)
- ⬜ Recruiter session: separate middleware check, routes under `/recruiter/` namespace
- ⬜ Recruiter cannot access crew features (profile, endorsements, yacht attachments, positions posting)
- ⬜ Crew cannot access recruiter features (search unlock, credit purchase)
- ⬜ RLS: recruiters have read-only access to crew profiles, yachts, endorsements. No write access to any crew table.

### Recruiter Subscription — Stripe

- ⬜ New Stripe Product: "YachtieLink Recruiter" with Price: EUR 29/month
- ⬜ Recruiter signup → Stripe Customer creation → Stripe Checkout for subscription
- ⬜ Subscription required before any search or unlock actions (paywall on first use, not on signup)
- ⬜ Stripe webhook handler extended: `recruiter.subscription.created`, `.updated`, `.deleted`, `.payment_failed`
- ⬜ Subscription management: Stripe Customer Portal (cancel, update payment, invoices) — same pattern as Crew Pro (Sprint 7)
- ⬜ Grace period: 3-day grace on failed payment before search/unlock is disabled
- ⬜ Cancelled subscription: search access revoked, previously unlocked profiles remain accessible (unlock is permanent)

### Credit System

- ⬜ `recruiter_credits` table:
  - `id` uuid PK
  - `recruiter_id` uuid FK → recruiters
  - `credits_purchased` int NOT NULL
  - `credits_remaining` int NOT NULL
  - `price_eur` numeric NOT NULL
  - `stripe_payment_intent_id` text
  - `purchased_at` timestamptz DEFAULT now()
  - `expires_at` timestamptz (purchased_at + 1 year)
- ⬜ Credit bundles (Stripe one-time payments):
  - 10 credits — EUR 75 (EUR 7.50/credit)
  - 25 credits — EUR 150 (EUR 6.00/credit)
  - 50 credits — EUR 250 (EUR 5.00/credit)
  - 100 credits — EUR 400 (EUR 4.00/credit)
  - 200 credits — EUR 1,200 (EUR 6.00/credit) — volume tier for agencies previewing Sprint 20
- ⬜ Credit deduction: FIFO from oldest non-expired bundle (use oldest credits first)
- ⬜ Credit expiry: cron job runs monthly, expires credits where `expires_at < now()`, notifies recruiter
- ⬜ `recruiter_unlocks` table:
  - `id` uuid PK
  - `recruiter_id` uuid FK → recruiters
  - `crew_user_id` uuid FK → users
  - `credit_id` uuid FK → recruiter_credits (which bundle was charged)
  - `unlocked_at` timestamptz DEFAULT now()
- ⬜ Unique constraint: `recruiter_unlocks(recruiter_id, crew_user_id)` — one unlock per pair, permanent
- ⬜ Credit purchase flow: recruiter selects bundle → Stripe Checkout (one-time payment) → webhook confirms → credits added
- ⬜ Credit balance display: persistent in recruiter dashboard header

### Recruiter Search — `/recruiter/search`

- ⬜ Extends Sprint 15's `search_crew()` RPC with recruiter-specific behaviour:
  - Only returns crew who have opted in to recruiter visibility (`recruiter_visible` boolean on users, default false)
  - Adds endorsement count and endorsement depth to result fields
  - Sort options: relevance (default), endorsement count DESC, sea time DESC, recently active
- ⬜ Recruiter search UI: same filter bar pattern as Sprint 15 crew search (department, role, location, availability, cert, yacht) + new filters:
  - Minimum endorsement count
  - Minimum sea time (years)
  - Yacht size preference (based on yacht length history)
- ⬜ Search result card (locked state — before unlock):
  - Profile photo: shown (not locked — photos are public)
  - Name: **locked** — shows "Crew Member #[hash]" placeholder
  - Role + department: shown
  - Location: country shown, city locked
  - Sea time: shown
  - Endorsement summary: "X endorsements from Y people across Z yachts" (D-026)
  - Availability badge: shown if active
  - Graph context: if recruiter has previously unlocked colleagues of this crew, show "Connected to [unlocked crew name]"
  - **"Unlock — 1 credit"** button
- ⬜ Search result card (unlocked state):
  - Full name shown
  - Contact details shown (whatever the crew member has made visible via availability contact methods)
  - Full location (country + city)
  - "View full profile" link → `/u/[handle]` (public profile page)
  - "Already unlocked" badge (no re-charge)

### Crew Opt-In for Recruiter Visibility

- ⬜ `recruiter_visible` boolean on `users` table, DEFAULT false
- ⬜ Toggle in availability settings (Sprint 14): "Visible to recruiters" — separate from the availability toggle itself
- ⬜ Crew can be available (visible to other crew for hiring) without being visible to recruiters, and vice versa
- ⬜ Explanation text: "When enabled, recruiters can find your profile in search results. Your name and contact details are hidden until a recruiter unlocks your profile."
- ⬜ Default off: crew must actively opt in — no assumptions about recruiter visibility (D-027 principle extended)
- ⬜ Opt-in persists independently of availability toggle (doesn't expire with the 7-day availability cycle)

### Profile Unlock Flow

- ⬜ Recruiter clicks "Unlock — 1 credit" on search result card
- ⬜ Confirmation: "Spend 1 credit to unlock [role]'s name and contact details? You have [N] credits remaining."
- ⬜ On confirm: deduct 1 credit (FIFO), create `recruiter_unlocks` record, refresh card to unlocked state
- ⬜ If insufficient credits: show "Purchase credits" CTA → credit purchase flow
- ⬜ Unlock is permanent: recruiter always sees this crew member's full details (even if crew later toggles off recruiter visibility — the unlock persists, but the crew member can still hide from new search results)
- ⬜ Unlocked profiles accessible via `/recruiter/unlocked` page (recruiter's talent pool)

### Recruiter Dashboard — `/recruiter/dashboard`

- ⬜ Landing page after recruiter login
- ⬜ Sections:
  - **Search** — link to recruiter search
  - **Unlocked Profiles** — list of all unlocked crew with quick-access cards (name, role, yacht, endorsement count)
  - **Credit Balance** — current credits, next expiry date, "Purchase more" CTA
  - **Purchase History** — list of credit purchases and unlocks with dates and amounts
  - **Subscription** — current plan, next billing date, "Manage" link to Stripe Portal
- ⬜ Browse positions: link to Sprint 18's position feed (read-only — recruiters can see what roles are being posted to understand market demand)

### Recruiter Welcome & Onboarding

- ⬜ Recruiter signup: email + password + company name + contact name
- ⬜ Email verification (same Resend flow as crew, separate template)
- ⬜ Post-verification: "Subscribe to start searching" → Stripe Checkout for EUR 29/month
- ⬜ Post-subscription: "Purchase credits to unlock profiles" → credit bundle selection
- ⬜ Welcome email: explains the model (subscription for search access, credits for profile unlock, crew opt-in)

### Database Migration

- ⬜ `CREATE TABLE recruiters (id uuid PK DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, company_name text NOT NULL, contact_name text NOT NULL, phone text, password_hash text NOT NULL, email_verified boolean DEFAULT false, stripe_customer_id text, subscription_status text DEFAULT 'inactive', subscription_id text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
- ⬜ `CREATE TABLE recruiter_credits (id uuid PK, recruiter_id uuid FK, credits_purchased int NOT NULL, credits_remaining int NOT NULL, price_eur numeric(10,2) NOT NULL, stripe_payment_intent_id text, purchased_at timestamptz DEFAULT now(), expires_at timestamptz NOT NULL)`
- ⬜ Index: `recruiter_credits(recruiter_id, expires_at)` for FIFO credit deduction
- ⬜ `CREATE TABLE recruiter_unlocks (id uuid PK, recruiter_id uuid FK, crew_user_id uuid FK, credit_id uuid FK, unlocked_at timestamptz DEFAULT now())`
- ⬜ Unique index: `recruiter_unlocks(recruiter_id, crew_user_id)`
- ⬜ `ALTER TABLE users ADD COLUMN recruiter_visible boolean DEFAULT false`
- ⬜ `search_crew_recruiter(p_recruiter_id uuid, p_filters jsonb, p_page int, p_page_size int)` RPC — extends `search_crew()` with recruiter-specific filters and locked/unlocked result shaping
- ⬜ `unlock_crew_profile(p_recruiter_id uuid, p_crew_user_id uuid)` RPC — handles credit deduction + unlock creation atomically
- ⬜ `get_recruiter_credit_balance(p_recruiter_id uuid)` RPC — returns total available (non-expired) credits
- ⬜ RLS: recruiters can SELECT from users, yachts, attachments, endorsements (read-only). No INSERT/UPDATE/DELETE on crew tables.
- ⬜ Separate RLS policies for recruiter tables (recruiters can only access their own records)
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `recruiter_signup` with company_name
- ⬜ `recruiter_subscription_started` / `recruiter_subscription_cancelled`
- ⬜ `recruiter_credits_purchased` with bundle size and price
- ⬜ `recruiter_search_executed` with filter params, result count
- ⬜ `recruiter_profile_unlocked` with crew role, department, endorsement count
- ⬜ `recruiter_unlock_insufficient_credits` (conversion moment)
- ⬜ `recruiter_credit_expiry_warning` / `recruiter_credits_expired` with expired count
- ⬜ `crew_recruiter_visibility_toggled` with on/off

## Exit Criteria

- Recruiter signup, email verification, and subscription flow operational end-to-end
- Recruiter search returns only crew who have opted in to recruiter visibility
- Search results show locked profiles (name/contact hidden) with endorsement count and availability badges
- Credit purchase via Stripe Checkout works for all bundle tiers
- Profile unlock: 1 credit deducted, name/contact revealed, unlock permanent per pair
- FIFO credit deduction from oldest non-expired bundle
- Recruiter dashboard shows search, unlocked profiles, credit balance, purchase history, subscription management
- Crew opt-in toggle works independently of availability toggle
- Cancelled recruiter subscription revokes search access but preserves existing unlocks
- Recruiter cannot access any crew-side feature (endorsements, attachments, positions posting, signals)
- RLS enforces read-only access for recruiters on all crew tables
- Credit expiry cron operational
- All components work at 375px width (mobile-first — recruiters may use tablets on dock)
- PostHog events firing for full recruiter lifecycle

## Estimated Effort

10–12 days

## Notes

**Separate `recruiters` table is the right call.** Putting recruiters in the `users` table would require `account_type` checks everywhere and risk accidentally granting recruiter access to crew endpoints (or vice versa). A separate table with separate auth, separate middleware, and separate RLS policies keeps the boundaries clean. The tradeoff is some duplicated auth logic (signup, email verification, password reset), but this is straightforward to share via utility functions without mixing the data models.

**The unlock model is the revenue core (D-024).** Every unlock is a micro-transaction that compounds. A recruiter who unlocks 10 profiles/month at EUR 4–7.50/credit generates EUR 40–75/month on top of the EUR 29 subscription. The FIFO expiry ensures credits don't accumulate indefinitely. The permanent-per-pair model means recruiters build a talent pool over time — each new unlock adds to their asset, creating switching costs.

**Crew opt-in is non-negotiable (D-027 extended).** The `recruiter_visible` toggle is separate from availability. A deckhand can be "available for work" (visible to fellow crew, positions feed) without being searchable by external recruiters. This matters because some crew don't want to be found by agencies — they hire through personal networks. Respecting this preference is what makes the platform trustworthy.

**D-025 creates an intentional asymmetry.** Direct profile links (shared via QR, WhatsApp, email) always show the full profile — name, contact, everything. This is the linktr.ee use case and it stays open. But efficient discovery via search is gated behind payment. Graph browsing (yacht → crew → yacht) also shows full profiles — this is intentional because it's slow and doesn't support filtering. The paywall is on the efficient path (search + filter + sort), not on the graph itself.

**Hardest technical challenge:** The credit deduction must be atomic with the unlock creation. If the credit deduction succeeds but the unlock record fails to create, the recruiter loses a credit without getting access. The `unlock_crew_profile()` RPC should wrap both operations in a transaction. Also handle the edge case where two concurrent unlock requests for the same pair race — the unique constraint on `recruiter_unlocks` prevents double-charging, but the error handling needs to detect this and refund the credit.

**Endorsement count in search results (D-026).** Displaying "X endorsements from Y people across Z yachts" is more nuanced than a single number. It shows breadth (how many yachts), depth (how many people), and volume. This is ordering information, not trust weighting — but it's powerful ordering. Track whether endorsement count significantly affects which profiles get unlocked; if it does, that's the graph working as intended.

**Next sprint picks up:** Sprint 20 introduces agency plans (multi-seat recruiter accounts with shared shortlists, bulk operations, CSV export) and NLP crew search (AI-07) using the pgvector infrastructure from Sprint 17. Agency plans extend the recruiter model with team management; NLP search replaces filter-based search with natural language queries.
