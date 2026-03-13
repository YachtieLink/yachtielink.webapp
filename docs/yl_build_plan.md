# YachtieLink — Build Plan

**Version:** 2.0
**Date:** 2026-03-13
**Status:** Active
**Target:** Ship Phase 1A for Med season (June 2026)

---

## What Exists Today

- Next.js 16.1 + React 19 + TypeScript + Tailwind CSS
- Supabase client setup (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- Health check endpoint (`app/api/health/supabase/route.ts`)
- Zero product code. Clean sheet.

---

## Phase 1A — 8 Sprints (~16 weeks)

Goal: Portable profile + yacht graph + endorsements + paid presentation. Prove the wedge.

---

### Sprint 1: Foundation (weeks 1–2)

**Database**
- Run migrations for core tables: `users`, `yachts`, `roles`, `departments`, `attachments`, `certifications`, `certification_types`, `endorsements`, `endorsement_requests`, `templates`
- Seed reference data:
  - **Departments:** Deck, Interior, Engineering, Galley, Medical, Admin/Purser, Land-based
  - **Roles:** Full seed list by department (see `yl_features.md` Reference Data section). Include "Other" tracking mechanism for custom entries
  - **Certification types:** Full hierarchical seed list by category (see `yl_features.md` Reference Data). Include "Other" tracking mechanism
  - **Yacht types:** Motor Yacht, Sailing Yacht
  - **Flag states:** ISO country list
  - Default PDF templates
- RLS policies on every table — no exceptions
- Indexes: `yachts.name_normalized` (trigram), `attachments(user_id)`, `attachments(yacht_id)`, `endorsements(recipient_id)`

**App shell**
- Mobile-first layout with bottom tab bar (5 tabs: Profile, CV, Insights, Audience, More)
- Tab routing structure under `/app/`
- Base component library: Card, Button, Input, Progress Wheel, Bottom Sheet, Toast
- Tailwind config: brand colours, typography scale, spacing, **dark mode setup from day 1** (system preference default, manual override toggle)

**Auth setup**
- Configure Supabase Auth: Google OAuth, Apple OAuth, email/password
- Email verification required for email/password accounts (account not active until confirmed)
- Password recovery flow (email-based)
- Auth middleware for protected routes
- Session handling (HTTP-only cookies, 30-day duration)

**Deliverable:** Empty app shell with working auth (including email verification), seeded database with full reference data, all tables with RLS. Dark mode working.

---

### Sprint 2: Auth + Onboarding (weeks 3–4)

**Screens**
- `/welcome` — Auth method selection (Apple, Google, Email)
- `/onboarding/name` — Full name + display name
- `/onboarding/handle` — Handle claim with live availability check (`yachtie.link/u/:handle`). When taken: 3 suggestions using birth year, first initial + last name, or logical variations
- `/onboarding/role` — Department multi-select (Deck, Interior, Engineering, Galley, Medical, Admin/Purser, Land-based) + role typeahead with "Other" free-text fallback. Primary role selection if multiple departments
- `/onboarding/yacht` — Yacht name typeahead + "Create new" (type: Motor Yacht / Sailing Yacht, length in metres, flag state dropdown, year built — all optional except type). Role on yacht (defaults from role step), dates (start required, end or "Currently")
- `/onboarding/request-endorsements` — Manual add only (phone/email → chips). No contacts import in webapp — deferred to native app. Skip option
- `/onboarding/done` — Confirmation with progress wheels

**Backend**
- Handle validation + reservation (3–30 chars, `a-z0-9-`, no leading/trailing hyphen, reserved words blocked)
- Handle suggestion generation (when taken)
- Yacht typeahead search (Postgres FTS + trigram)
- Yacht creation (type, length, flag state, year built, auto-populate `name_normalized`)
- Attachment creation (user → yacht + role + dates)
- Endorsement request creation + token generation
- Transactional email via Resend: welcome email, email verification, endorsement request notification

**Rules**
- No upsell anywhere in onboarding
- Contacts import deferred to native app — document for future implementation
- Endorsement request deep links (`/r/:token`) — generate but flow handled in Sprint 5
- Entire onboarding flow completable in under 3 minutes

**Deliverable:** New user can sign up (with email verification for email accounts), complete onboarding, have a profile with one yacht attached, and send endorsement requests.

---

### Sprint 3: Profile (weeks 5–6)

**Profile home (`/app/profile`)**
- Identity card: photo, display name, role, department(s), profile link + copy, QR code download button
- Progress Wheel A: 5 milestones (role set, ≥1 yacht, bio set, ≥1 cert, photo set)
- "Complete next step" CTA linking to first missing milestone

**Sections**
- About — edit flow (full-screen editor, 500 char max)
- Yachts — reverse chronological list, expand to view yacht / request endorsements / edit attachment
- Certifications — hierarchical tree UI for cert type selection (narrow by category first, then specific cert, "Other" free-text option). Per cert: type, issued date, expiry date, optional document upload (PDF/JPEG/PNG to Supabase Storage). Expiry status display (valid / expiring soon / expired)
- Endorsements received — list (endorser name, yacht, date, excerpt), tap for detail

**Photo upload**
- Profile photo upload to Supabase Storage
- Image validation (JPEG, PNG, WebP whitelist, 5MB max)
- Crop/resize on client before upload

**Contact info (in profile settings)**
- Input fields: phone, WhatsApp number, email, location (country dropdown + city text input)
- Per-field visibility toggles (shown/hidden on public profile)
- Defaults: all hidden

**More tab (`/app/more`)**
- Settings: dark mode toggle, notification preferences
- Account: edit name, handle, department, role
- Privacy: contact visibility toggles (link to profile settings)
- Help/Feedback section
- Theme: light/dark/system

**Deliverable:** Full profile management. User can complete all 5 setup milestones. Contact info configurable. Dark mode toggle working.

---

### Sprint 4: Yacht Graph (weeks 7–8)

**Yacht entities**
- Yacht detail view: name, type (Motor Yacht / Sailing Yacht), length in metres, flag state, year built, attached crew count
- Yacht creation: type (required), length (exact metres — first creator should aim for accuracy), flag state dropdown, year built (optional, can skip)
- Yacht search improvements: fuzzy matching, duplicate name tolerance

**Attachment management**
- Add attachment: yacht typeahead/create → role → dates (start required, end or "Currently")
- Edit attachment: change role, dates
- Delete attachment: soft delete (`deleted_at`), does not auto-delete endorsements

**Colleague graph**
- Query: find users who share ≥1 yacht attachment with current user
- Audience tab → Colleagues section: list with name, shared yacht(s), relationship label
- This is a derived view, not a stored relationship — recomputed on access

**Yacht lifecycle (lightweight)**
- Track yacht age and attached crew count
- Mark yacht as established when thresholds met (60 days + crew count by size)
- Fresh yachts: open attachment. Established yachts: attachment confirmation deferred to Phase 1B (log the status but don't gate)

**Deliverable:** Yacht graph is live. Users can see who they've worked with. Colleague list populates automatically from shared yacht history.

---

### Sprint 5: Endorsements (weeks 9–10)

**Request flow (`/app/endorsement/request?yacht_id=...`)**
- Yacht fixed at top
- Suggested colleagues from shared-yacht list
- Manual add: phone/email input → request chips
- Rate limiting: 10 requests/day free, 20/day Pro
- Delivery: email via Resend. Also generate shareable deep link (user can copy to send via WhatsApp or other messaging)
- Request expiry: 30 days

**Deep link flow (`/r/:token`)**
- Unauthenticated: → auth → return to request
- Authenticated, already attached to yacht: → write endorsement
- Authenticated, not attached: → add yacht (pre-filled, locked name) → write endorsement

**Write endorsement (`/app/endorsement/write`)**
- Text field (10–2000 chars)
- Optional structured fields: your role, their role, dates worked together (prefill from attachment data)
- Shared-yacht gating enforced in backend — API rejects if no shared attachment exists
- Unique constraint: one endorsement per (endorser, recipient, yacht)

**Endorsement management**
- Edit own endorsement
- Delete own endorsement (soft delete, `deleted_at`)
- Retraction tracking in backend (count per endorser, not exposed in UI)

**Notifications**
- Email notification when someone writes an endorsement for you
- Email notification when you receive an endorsement request

**Audience tab (`/app/audience`)**
- Progress Wheel B: endorsements received (n/5, neutral language)
- Endorsements inbox: requests received (review CTA), requests sent (status: pending/accepted/expired, resend/cancel)
- "Get endorsements" bottom sheet from Wheel B tap
- Colleagues section (from Sprint 4)

**Deliverable:** Full endorsement loop works end-to-end. User requests → colleague receives link (email or WhatsApp share) → adds yacht if needed → writes endorsement → it appears on requester's profile.

---

### Sprint 6: Public Profile + CV (weeks 11–12)

**Public profile (`/u/:handle`)**
- Server-rendered page (SEO)
- Sections: name + role, about, employment history, certifications, endorsements received
- Endorsement display: endorser name, yacht, date, truncated excerpt — collapsible to expand full text
- Contact info shown per user's visibility settings
- No discovery rails, no search, no browse
- Open Graph meta tags for link sharing (name, role, photo)
- QR code: bottom-left corner of page, links to `/u/:handle`

**CV tab (`/app/cv`)**
- Public page preview (renders `/u/:handle` in-app)
- Share button + copy link
- QR code download

**CV upload + parsing**
- Upload CV (PDF, DOCX) to Supabase Storage
- Text extraction: `pdf-parse` for PDF, `mammoth` for DOCX
- Send to Claude Sonnet API with structured extraction prompt
- Parse response into profile fields (name, employment history, certifications, languages, location)
- Review screen: pre-filled form the user can edit field by field before saving
- Rate limit: 3 parses per user per day
- Fallback: if parsing fails, skip silently to manual entry
- Cost target: <EUR 0.05 per parse

**PDF generation**
- `@react-pdf/renderer` for profile PDF export
- Content: name, photo, role, about, employment history, certifications, top 3 endorsements (excerpt + endorser + yacht) with link to full endorsements on public profile
- QR code on PDF (bottom-left corner)
- Standard template (free): clean, minimal — founder to provide reference sample during this sprint
- Watermark on free tier ("Created with YachtieLink")
- Generate + download flow
- Store generated PDF URL for re-download

**Deliverable:** Public profile page works. CV import populates profile from existing CV. PDF export produces a shareable document with QR code.

---

### Sprint 7: Payments + Pro (weeks 13–14)

**Stripe integration**
- Stripe Customer creation on signup (or lazy on first billing interaction)
- Crew Pro subscription:
  - Monthly: EUR 12/month
  - Annual: EUR 9/month billed annually (EUR 108/year)
- Stripe Checkout for subscription creation
- Stripe Customer Portal for management (cancel, update payment, switch plans)
- Webhook handler: `customer.subscription.created`, `updated`, `deleted`, `invoice.payment_failed`
- Store subscription status + plan type on user record

**Pro features**
- Premium templates: 2 additional PDF templates (Classic Navy, Modern Minimal) — locked for free users
- Watermark removal: `show_watermark = false` for Pro
- Custom subdomain: `handle.yachtie.link` routing via Vercel wildcard DNS. Both `/u/:handle` and `handle.yachtie.link` remain active — custom subdomain is an alias, not a replacement
- Profile analytics: view count, PDF download count, link share count — **time-series display** (last 7 days, 30 days, all time)
- Certification document manager: organised document view, expiry tracking dashboard, expiry reminder email alerts
- Higher endorsement request allowance: Pro users get 20/day vs 10/day free

**Insights tab (`/app/insights`)**
- Free: teaser cards showing metric names but not values, upgrade CTA
- Pro: actual numbers with time-series charts (profile views, PDF downloads, link shares)
- Rule: if onboarding incomplete, show "Finish setup first" instead of upgrade prompt

**Free tier analytics nudge email**
- When a free user's profile views are above average: send a one-time nudge email prompting upgrade to see full analytics
- Send sparingly — not a weekly nag

**Billing in More tab**
- Current plan display (Free / Pro Monthly / Pro Annual)
- Upgrade/manage subscription link
- Invoice history (via Stripe Customer Portal)

**Deliverable:** Stripe payments work. Monthly and annual Pro subscription unlocks presentation features. Revenue flows.

---

### Sprint 8: Launch Prep (weeks 15–16)

**Instrumentation**
- PostHog setup + event tracking: `profile.created`, `cv.parsed`, `cv.parse_failed`, `attachment.created`, `endorsement.requested`, `endorsement.created`, `endorsement.deleted`, `profile.shared`, `pro.subscribed`, `pro.cancelled`
- Sentry error tracking
- Basic PostHog dashboard for tripwire metrics

**Security hardening**
- Input validation with `zod` on all API routes
- Rate limiting via Vercel KV: login attempts (5/15min/IP), endorsement creation (5/24h/user), PDF generation, CV parsing
- CORS restricted to yachtie.link origins
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- CSRF protection on mutation endpoints

**Growth controls**
- Invite-only toggle (single config flag)
- Admin endpoint to flip signup mode

**GDPR**
- Data export: generate JSON of all user data
- Account deletion: cascade delete with soft-delete preservation where needed
- Cookie consent (essential cookies only — no tracking cookies)

**Legal**
- Terms of Service page (founder-written placeholder, to be professionally redone when revenue allows)
- Privacy Policy page (same)

**Performance**
- Lighthouse audit on public profile page
- Image optimization (next/image)
- Database query optimization + connection pooling

**QA**
- End-to-end flow testing: signup → email verification → onboarding → profile → yacht → endorsement → public page → PDF → Pro upgrade
- Mobile Safari testing (iPhone baseline)
- Desktop responsive check
- Dark mode testing across all screens

**Deliverable:** Production-ready. Security hardened. Instrumented. Legal pages live. Ready for real users.

---

## Phase 1A Summary

| Sprint | Weeks | Delivers |
|--------|-------|----------|
| 1. Foundation | 1–2 | Database, auth (with email verification), app shell, components, dark mode |
| 2. Auth + Onboarding | 3–4 | Signup, onboarding flow, first yacht + endorsement request |
| 3. Profile | 5–6 | Profile management, photo, certs (with upload), contact info, settings |
| 4. Yacht Graph | 7–8 | Yacht entities, attachments, colleague derivation |
| 5. Endorsements | 9–10 | Request → write → display loop, deep links, email + WhatsApp share |
| 6. Public Profile + CV | 11–12 | Public page, CV import, PDF export, QR codes |
| 7. Payments + Pro | 13–14 | Stripe (monthly + annual), Pro features, cert document manager, time-series analytics |
| 8. Launch Prep | 15–16 | Instrumentation, security, GDPR, legal, QA |

**Timeline:** ~16 weeks (4 months). Target: ship by end of June 2026 for Med season.

---

## Phase 1B — Discovery + Convenience (~6 weeks)

Gate: Phase 1A graph loop is healthy (endorsement-to-profile ratio >0.3 at 500 profiles, organic share rate >10%).

### Sprint 9: Availability + Search + Endorsement Signals (weeks 17–18)

- Availability toggle on profile: available for work (yes/no), available from (date), notes
- 7-day auto-expiry on availability (re-confirm to stay visible)
- Limited crew search for Pro users: search by role, yacht name, location
- Search results show: name, role, last yacht, availability status
- Contextual profile visibility: search result = summary only, direct link = full profile (D-025)
- Endorsement signals (agree/disagree) — display only, trust weight in Phase 2+

### Sprint 10: Expanded Analytics + Convenience (weeks 19–20)

- Enhanced Insights tab: who viewed your profile (anonymised counts by role/location), trend lines
- Endorsement pinning for Pro users (choose which endorsements appear first)
- Notification preferences (email digest frequency)
- Profile completeness nudges (smart, not nagging)

### Sprint 11: Graph Quality + Established Yachts (weeks 21–22)

- Attachment confirmation flow for established yachts: existing verified crew can confirm/deny new attachments
- Confirmation voting (simple majority)
- Yacht establishment visual indicator
- Dispute flow: flag an attachment as incorrect (escalates to abuse protocol)
- False attachment dispute rate tracking (tripwire: 5%)

**Deliverable:** Crew can signal availability. Pro users can search. Endorsement signals live. Established yachts have lightweight integrity controls.

---

## Phase 1C — Commercial Adjacency (~8 weeks)

Gate: Crew-side product stands on its own. 10,000+ crew, 3,000+ yachts, recruiter demand signal (inbound inquiries or waitlist).

### Sprint 12: Peer Hiring (weeks 23–24)

- Crew can post open positions on yachts they're attached to (free, per D-022)
- Position visible to: colleagues (graph-adjacent crew)
- Graph proximity indicator: "You worked with 3 crew on this yacht"
- Apply flow: express interest → direct contact (no platform intermediation in 1C)
- Position expiry: 30 days, renewable

### Sprint 13: Recruiter Access — Foundation (weeks 25–26)

- Separate recruiter signup flow (not crew accounts)
- Recruiter subscription: EUR 29/month base + credit system for profile unlocks (D-024)
- Recruiter dashboard: search crew by role, certifications, yacht experience, availability
- Search returns locked summaries; full profile unlock costs credits
- Crew opt-in required: "Visible to recruiters" toggle (default off)

### Sprint 14: Recruiter Access — Polish (weeks 27–28)

- Shortlisting: save candidates to named lists
- Recruiter analytics: search patterns, unlock rates
- Crew notification: "A recruiter viewed your profile" (anonymised)
- Recruiter sorting by endorsement count allowed (D-026) — presentation order, not trust weight
- Rate limiting on recruiter searches to prevent scraping

### Sprint 15: Agency Plans (weeks 29–30)

- Multi-seat agency accounts (EUR 299–499/month)
- Shared shortlists across agency seats
- Bulk search + CSV export of unlocked profiles
- Agency-level analytics
- Account management: add/remove seats, billing per seat

**Deliverable:** Demand-side monetisation live. Recruiters and agencies can find crew who've opted in. Crew controls remain intact.

---

## Dependency Chain

```
Sprint 1 (Foundation)
  └─► Sprint 2 (Auth + Onboarding)
        └─► Sprint 3 (Profile)
        └─► Sprint 4 (Yacht Graph)
              └─► Sprint 5 (Endorsements)
                    └─► Sprint 6 (Public Profile + CV)
                          └─► Sprint 7 (Payments + Pro)
                                └─► Sprint 8 (Launch Prep)
                                      └─► SHIP 1A
                                            └─► Sprint 9–11 (Phase 1B)
                                                  └─► Sprint 12–15 (Phase 1C)
```

Sprints 3 and 4 can overlap if there's more than one person building. Everything else is sequential.

---

## Critical Path Items

These are the things that block everything else if they slip:

1. **Database schema** (Sprint 1) — Everything depends on this. Get it right. Schema changes after launch are painful.
2. **Supabase Auth config** (Sprint 1) — Apple OAuth requires Apple Developer setup, signing keys. Start this on day 1.
3. **Endorsement deep link flow** (Sprint 5) — This is the growth loop. If the `/r/:token` flow is clunky, the graph doesn't compound.
4. **Stripe webhook reliability** (Sprint 7) — Subscription state must be consistent. Test edge cases: failed payments, plan changes (monthly ↔ annual), cancellations mid-cycle.
5. **Apple Developer Account** — Required for Apple OAuth + future App Store. Apply early if not already done.

---

## What's NOT in this plan

Explicitly excluded from all sprints above (deferred to Phase 2+). Build with future upgrades in mind — architecture should not make these harder to add later:

- Timeline / posts
- Messaging / direct messages
- IRL interactions / QR meet system
- Contacts (as a separate relationship type)
- Contacts import (native device API — awaiting native app)
- In-app notifications (awaiting native app for push)
- NLP search
- Conversational onboarding
- Multilingual support
- Native mobile app (iOS/Android)
- Verification API (enterprise)
- Endorsement signals (moved to Phase 1B Sprint 9)

These are real features with real value. They're not in scope because the yacht graph wedge must be proven first.

---

## Sprint Sizing Assumptions

- Solo developer or 1 dev + 1 founder doing product/design
- 2-week sprints, ~8 working days per sprint (accounting for context switching)
- Each sprint should produce a deployable increment (continuous deployment via Vercel)
- Design happens just-in-time within each sprint (no separate design phase)
- UX spec (`yl_mobile_first_ux_spec_for_pm_v1.md`) is the design source of truth
- English only for Phase 1A
- Online-only web app (no PWA/offline support)

If a second developer joins, Sprints 3+4 can run in parallel, compressing the timeline by ~2 weeks.

---

## Success Criteria for Phase 1A Launch

Before declaring 1A shipped:

- [ ] New user can sign up, verify email, complete onboarding, and have a live public profile in <5 minutes
- [ ] Endorsement deep link flow works end-to-end (unauthenticated user → auth → yacht confirm → write endorsement)
- [ ] Public profile page loads in <2 seconds, renders correctly on mobile Safari
- [ ] PDF export produces a professional-looking document with QR code and top 3 endorsements
- [ ] CV import successfully parses >80% of typical yacht crew CVs
- [ ] Stripe subscription works: monthly + annual upgrade, downgrade, cancel, payment failure handling
- [ ] All PostHog events firing correctly
- [ ] No critical Sentry errors
- [ ] GDPR data export and account deletion work
- [ ] Growth pause mechanism tested and ready
- [ ] Dark mode works across all screens
- [ ] Certification document upload and expiry tracking functional
