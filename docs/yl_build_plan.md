# YachtieLink — Build Plan

**Version:** 1.0
**Date:** 2026-03-09
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
- Run migrations for core tables: `users`, `yachts`, `roles`, `attachments`, `certifications`, `certification_types`, `endorsements`, `templates`
- Seed reference data: roles (Captain, Chief Officer, Bosun, Chief Stewardess, Chef, Engineer, Deckhand, Stewardess, etc.), certification types (STCW, ENG1, Yachtmaster, PSA, etc.), default templates
- RLS policies on every table — no exceptions
- Indexes: `yachts.name_normalized` (trigram), `attachments(user_id)`, `attachments(yacht_id)`, `endorsements(recipient_id)`

**App shell**
- Mobile-first layout with bottom tab bar (5 tabs: Profile, CV, Insights, Audience, More)
- Tab routing structure under `/app/`
- Base component library: Card, Button, Input, Progress Wheel, Bottom Sheet, Toast
- Tailwind config: brand colours, typography scale, spacing

**Auth setup**
- Configure Supabase Auth: Google OAuth, Apple OAuth, email/password
- Auth middleware for protected routes
- Session handling (HTTP-only cookies, 30-day duration)

**Deliverable:** Empty app shell with working auth, seeded database, all tables with RLS.

---

### Sprint 2: Auth + Onboarding (weeks 3–4)

**Screens**
- `/welcome` — Auth method selection (Apple, Google, Email)
- `/onboarding/name` — Full name + display name
- `/onboarding/handle` — Handle claim with live availability check (`yachtie.link/u/:handle`)
- `/onboarding/role` — Department picker + role typeahead
- `/onboarding/yacht` — Yacht name typeahead + create new, role, dates
- `/onboarding/request-endorsements` — Manual add (phone/email), skip option
- `/onboarding/done` — Confirmation with progress wheels

**Backend**
- Handle validation + reservation (3–30 chars, `a-z0-9-`, reserved words blocked)
- Yacht typeahead search (Postgres FTS + trigram)
- Yacht creation (auto-populate `name_normalized`)
- Attachment creation (user → yacht + role + dates)
- Endorsement request creation + token generation
- Transactional email via Resend (endorsement request notification)

**Rules**
- No upsell anywhere in onboarding
- Contacts import is optional — defer to manual add for MVP if native contacts API adds complexity
- Endorsement request deep links (`/r/:token`) — generate but flow handled in Sprint 5

**Deliverable:** New user can sign up, complete onboarding, have a profile with one yacht attached, and send endorsement requests.

---

### Sprint 3: Profile (weeks 5–6)

**Profile home (`/app/profile`)**
- Identity card: photo, display name, role, department, profile link + copy
- Progress Wheel A: 5 milestones (role set, ≥1 yacht, bio set, ≥1 cert, photo set)
- "Complete next step" CTA linking to first missing milestone

**Sections**
- About — edit flow (full-screen editor, 500 char max)
- Yachts — reverse chronological list, expand to view yacht / request endorsements / edit attachment
- Certifications — list with type + expiry, add flow (typeahead + dates)
- Endorsements received — list (endorser name, yacht, date, excerpt), tap for detail

**Photo upload**
- Profile photo upload to Supabase Storage
- Image validation (type whitelist, 5MB max)
- Crop/resize on client before upload

**More tab (`/app/more`)**
- Settings, Account, Privacy, Help/Feedback sections
- Visibility toggles (phone, whatsapp, email, location)
- Tag approval toggle

**Deliverable:** Full profile management. User can complete all 5 setup milestones.

---

### Sprint 4: Yacht Graph (weeks 7–8)

**Yacht entities**
- Yacht detail view: name, type, size category, flag state, attached crew count
- Yacht creation with disambiguation metadata (type, length, year built — all optional)
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
- Fresh yachts: open attachment. Established yachts: attachment confirmation deferred to later (keep it simple for 1A — log the status but don't gate)

**Deliverable:** Yacht graph is live. Users can see who they've worked with. Colleague list populates automatically from shared yacht history.

---

### Sprint 5: Endorsements (weeks 9–10)

**Request flow (`/app/endorsement/request?yacht_id=...`)**
- Yacht fixed at top
- Suggested colleagues from shared-yacht list
- Manual add: phone/email input → request chips
- Rate limiting: configurable max requests per user per day (start at 10)

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

**Audience tab (`/app/audience`)**
- Progress Wheel B: endorsements received (n/5, neutral language)
- Endorsements inbox: requests received (review CTA), requests sent (status: pending/accepted/expired, resend/cancel)
- "Get endorsements" bottom sheet from Wheel B tap

**Deliverable:** Full endorsement loop works end-to-end. User requests → colleague receives link → adds yacht if needed → writes endorsement → it appears on requester's profile.

---

### Sprint 6: Public Profile + CV (weeks 11–12)

**Public profile (`/u/:handle`)**
- Server-rendered page (SEO)
- Sections: name + role, about, yachts (employment history), certifications, endorsements received
- No discovery rails, no search, no browse
- Open Graph meta tags for link sharing (name, role, photo)
- QR code generation (qrcode.react) for sharing

**CV tab (`/app/cv`)**
- Public page preview (renders `/u/:handle` in-app)
- Share button + copy link

**CV upload + parsing**
- Upload CV (PDF, DOCX) to Supabase Storage
- Text extraction: `pdf-parse` for PDF, `mammoth` for DOCX
- Send to Claude Sonnet API with structured extraction prompt
- Parse response into profile fields (name, employment history, certifications, languages, location)
- Review screen: user confirms/edits extracted data before saving
- Rate limit: 3 parses per user per day
- Fallback: if parsing fails, skip silently to manual entry
- Cost target: <€0.05 per parse

**PDF generation**
- `@react-pdf/renderer` for profile PDF export
- Standard template (free): clean, professional layout
- Watermark on free tier ("Created with YachtieLink")
- Generate + download flow
- Store generated PDF URL for re-download

**Deliverable:** Public profile page works. CV import populates profile from existing CV. PDF export produces a shareable document.

---

### Sprint 7: Payments + Pro (weeks 13–14)

**Stripe integration**
- Stripe Customer creation on signup (or lazy on first billing interaction)
- Crew Pro subscription: €12/month
- Stripe Checkout for subscription creation
- Stripe Customer Portal for management (cancel, update payment)
- Webhook handler: `customer.subscription.created`, `updated`, `deleted`
- Store subscription status on user record

**Pro features**
- Premium templates: 2 additional PDF templates (Classic Navy, Modern Minimal) — locked for free users
- Watermark removal: `show_watermark = false` for Pro
- Custom subdomain: `username.yachtie.link` routing via Vercel wildcard DNS
- Profile analytics: view count, PDF download count, link share count (basic counters)
- Higher endorsement request allowance: Pro users get 20/day vs 10/day free

**Insights tab (`/app/insights`)**
- Free: teaser cards showing metric names but not values, upgrade CTA
- Pro: actual numbers (profile views, PDF downloads, link shares)
- Rule: if onboarding incomplete, show "Finish setup first" instead of upgrade prompt

**Billing in More tab**
- Current plan display
- Upgrade/manage subscription link
- Invoice history (via Stripe Customer Portal)

**Deliverable:** Stripe payments work. Pro subscription unlocks presentation features. Revenue flows.

---

### Sprint 8: Launch Prep (weeks 15–16)

**Instrumentation**
- PostHog setup + event tracking: `profile.created`, `cv.parsed`, `cv.parse_failed`, `attachment.created`, `endorsement.requested`, `endorsement.created`, `endorsement.deleted`, `profile.shared`
- Sentry error tracking
- Basic PostHog dashboard for tripwire metrics

**Security hardening**
- Input validation with `zod` on all API routes
- Rate limiting via Vercel KV: login attempts (5/15min/IP), endorsement creation (5/24h/user), PDF generation
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
- Terms of Service page
- Privacy Policy page

**Performance**
- Lighthouse audit on public profile page
- Image optimization (next/image)
- Database query optimization + connection pooling

**QA**
- End-to-end flow testing: signup → onboarding → profile → yacht → endorsement → public page → PDF → Pro upgrade
- Mobile Safari testing (iPhone baseline)
- Desktop responsive check

**Deliverable:** Production-ready. Security hardened. Instrumented. Legal pages live. Ready for real users.

---

## Phase 1A Summary

| Sprint | Weeks | Delivers |
|--------|-------|----------|
| 1. Foundation | 1–2 | Database, auth, app shell, components |
| 2. Auth + Onboarding | 3–4 | Signup, onboarding flow, first yacht + endorsement request |
| 3. Profile | 5–6 | Profile management, photo, certs, settings |
| 4. Yacht Graph | 7–8 | Yacht entities, attachments, colleague derivation |
| 5. Endorsements | 9–10 | Request → write → display loop, deep links |
| 6. Public Profile + CV | 11–12 | Public page, CV import, PDF export |
| 7. Payments + Pro | 13–14 | Stripe, Pro features, Insights tab |
| 8. Launch Prep | 15–16 | Instrumentation, security, GDPR, QA |

**Timeline:** ~16 weeks (4 months). Target: ship by end of June 2026 for Med season.

---

## Phase 1B — Discovery + Convenience (~6 weeks)

Gate: Phase 1A graph loop is healthy (endorsement-to-profile ratio >0.3 at 500 profiles, organic share rate >10%).

### Sprint 9: Availability + Search (weeks 17–18)

- Availability toggle on profile: available for work (yes/no), available from (date), notes
- 7-day auto-expiry on availability (re-confirm to stay visible)
- Limited crew search for Pro users: search by role, yacht name, location
- Search results show: name, role, last yacht, availability status
- Contextual profile visibility: search result = summary only, direct link = full profile (D-025)

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

**Deliverable:** Crew can signal availability. Pro users can search. Established yachts have lightweight integrity controls.

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
- Recruiter subscription: €29/month base + credit system for profile unlocks (D-024)
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

- Multi-seat agency accounts (€299–499/month)
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
4. **Stripe webhook reliability** (Sprint 7) — Subscription state must be consistent. Test edge cases: failed payments, plan changes, cancellations mid-cycle.
5. **Apple Developer Account** — Required for Apple OAuth + future App Store. Apply early if not already done.

---

## What's NOT in this plan

Explicitly excluded from all sprints above (deferred to Phase 2+):

- Timeline / posts
- Messaging / direct messages
- IRL interactions / QR meet system
- Contacts (as a separate relationship type)
- NLP search
- Conversational onboarding
- Multilingual support
- Native mobile app
- Verification API (enterprise)

These are real features with real value. They're not in scope because the yacht graph wedge must be proven first.

---

## Sprint Sizing Assumptions

- Solo developer or 1 dev + 1 founder doing product/design
- 2-week sprints, ~8 working days per sprint (accounting for context switching)
- Each sprint should produce a deployable increment (continuous deployment via Vercel)
- Design happens just-in-time within each sprint (no separate design phase)
- UX spec (`yl_mobile_first_ux_spec_for_pm_v1.md`) is the design source of truth

If a second developer joins, Sprints 3+4 can run in parallel, compressing the timeline by ~2 weeks.

---

## Success Criteria for Phase 1A Launch

Before declaring 1A shipped:

- [ ] New user can sign up, complete onboarding, and have a live public profile in <5 minutes
- [ ] Endorsement deep link flow works end-to-end (unauthenticated user → auth → yacht confirm → write endorsement)
- [ ] Public profile page loads in <2 seconds, renders correctly on mobile Safari
- [ ] PDF export produces a professional-looking document
- [ ] CV import successfully parses >80% of typical yacht crew CVs
- [ ] Stripe subscription works: upgrade, downgrade, cancel, payment failure handling
- [ ] All PostHog events firing correctly
- [ ] No critical Sentry errors
- [ ] GDPR data export and account deletion work
- [ ] Growth pause mechanism tested and ready
