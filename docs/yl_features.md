# YachtieLink Feature Registry

**Version:** 2.0
**Date:** 2026-03-13
**Status:** Active — working document, refined iteratively with founder

## About this doc

This is the source of truth for what features exist, why they exist, and which phase they belong to.

- **This doc** defines the "what" and "why" of each feature, and owns phase assignment.
- **`yl_build_plan.md`** owns the "how" and "when within a sprint."
- If they conflict: this doc wins on scope and rationale; build plan wins on execution sequencing.

## Status values

`proposed` | `specced` | `building` | `shipped` | `deferred` | `not planned`

---

## Phase 1A — Portable Profile + Yacht Graph + Endorsements

Goal: prove the wedge. A crew member can build a real portable identity anchored to yacht history, generate a colleague graph from that history, and collect trusted endorsements from real coworkers.

---

### Auth & Signup

**What:** Account creation via Apple OAuth, Google OAuth, or email/password. Email accounts require email verification before the account becomes active.
**Why:** Standard auth with verification to prevent mistyped emails locking users out of password recovery and endorsement notifications.
**Sprint:** 1–2
**Status:** specced
**Details:**
- Auth methods: Apple OAuth, Google OAuth, email/password
- Email/password accounts: verification email sent immediately, account not active until confirmed
- Password recovery: email-based reset flow
- Session handling: HTTP-only cookies, 30-day duration

---

### Onboarding

**What:** A guided flow after signup that collects the minimum information needed to create a useful profile: name, handle, department(s), role, first yacht, and optional endorsement requests.
**Why:** Gets the user to a live public profile with one yacht attached as fast as possible. Every step feeds the graph.
**Sprint:** 2
**Status:** specced
**Details:**

**O1 — Name**
- Full name (required)
- Preferred display name (optional)

**O2 — Handle claim**
- Format: `yachtie.link/u/:handle`
- Rules: `a-z 0-9 -`, 3–30 chars, no leading/trailing hyphen, reserved words blocked
- When taken: show 3 suggestions — append birth year, first initial + last name, or logical variations of the requested handle
- On claim: "Your page is live" + Continue / View public page

**O3 — Department & Role**
- Department: multi-select (user can pick more than one). Options: Deck, Interior, Engineering, Galley, Medical, Admin/Purser, Land-based
- Role: typeahead from seeded list (see Reference Data below). If no match, free-text "Other" input — entered values are tracked for future addition to the seed list
- Primary role selected if multiple departments chosen

**O4 — First yacht**
- Yacht name typeahead + "Create new"
- If creating new: yacht type (Motor Yacht / Sailing Yacht), length in metres (optional), flag state dropdown (optional), year built (optional — can be skipped if unknown)
- Role on yacht (defaults from O3)
- Dates: start (required), end or "Currently"

**O5 — Request endorsements**
- Manual add: phone/email input, chips UI
- Contacts import: deferred to native app (Phase 2+). Document for future: native contacts permission → multi-select list → send requests
- Skip option always available

**O6 — Done**
- "Your page is live"
- Progress wheels: Profile setup X/5, Endorsements 0/5
- CTAs: Go to Profile / View public page

**Rules:**
- No upsell anywhere during onboarding
- Entire flow should be completable in under 3 minutes

---

### Profile

**What:** A crew member's professional identity page — photo, display name, handle, department(s), role, bio, contact info, location, and a link they own.
**Why:** The portable identity layer every other feature builds on. A crew member should be able to hand someone a URL and have it represent them professionally, permanently, and for free.
**Sprint:** 3
**Status:** specced
**Crew-first note:** Core identity stays free. Paying improves presentation of the profile, not access to it.
**Details:**

**Identity card (top of profile)**
- Profile photo + edit button
- Display name
- Role + department(s)
- Profile link (`yachtie.link/u/:handle`) + copy icon
- QR code download button

**Profile photo**
- Upload to Supabase Storage
- Validation: image type whitelist (JPEG, PNG, WebP), 5MB max
- Client-side crop/resize before upload
- Crop ratio and display style: designer's choice during build

**About section**
- Free-text bio, 500 char max
- Full-screen editor on edit

**Contact info (in profile settings)**
- Input fields: phone, WhatsApp, email, location
- Location: country dropdown, then free-text city input
- Visibility toggles per field: each can be shown/hidden on public profile independently
- Defaults: all hidden — user explicitly chooses what to display

**Progress Wheel A — Profile setup (5 milestones)**
1. Role set
2. At least 1 yacht attachment
3. Bio set
4. At least 1 certification record
5. Profile photo set
- "Complete next step" CTA links to first missing milestone

**Sections (in order):**
1. About
2. Yachts (reverse chronological)
3. Certifications
4. Endorsements received

**Dark mode:** Supported from launch. Light/dark toggle in settings, respects system preference by default.

---

### Employment History

**What:** A structured record of a crew member's past and current roles — yacht name, role, department, start and end dates.
**Why:** Employment history is the raw material for the yacht graph. Without it, colleague discovery and endorsement gating have nothing to work from.
**Sprint:** 2–3
**Status:** specced
**Key notes:** Role and date range required on every attachment. Soft-deletes preserve endorsement links (D-006).

---

### Yacht Entities

**What:** Yachts as real database objects with a UUID, display name, type, length, flag state, and year built — not free-text strings. The yacht's "Wikipedia page" in the industry.
**Why:** Making yachts entities (not just text fields) is what allows the graph to form. Two crew who both attach "Lady M" are connected because they referenced the same object.
**Sprint:** 4
**Status:** specced
**Details:**
- **Yacht type:** Motor Yacht or Sailing Yacht (two options only)
- **Length:** Exact length in metres (numeric input). First creator should aim for accuracy since this becomes the reference record
- **Flag state:** Country dropdown
- **Year built:** Optional, can be skipped if unknown
- Duplicate names tolerated. Renamed yachts are separate entities — merging deferred to Phase 2 (D-006)
- Ratings, reviews, or interactions on yacht entities aren't planned — yachts are graph infrastructure, not review targets

---

### Employment Attachments

**What:** The link between a crew member and a yacht — role, dates, and yacht reference — forming the basic unit of the graph.
**Why:** Attachments are the edges that make the graph. Every other graph feature (colleagues, endorsement gating) derives from overlapping attachments.
**Sprint:** 2–4
**Status:** specced
**Key notes:** Fresh yachts are open to attach. Established yachts (60 days + crew threshold) move to confirmation flow in Phase 1B. Soft delete preserves existing endorsements.

---

### Colleague Graph

**What:** An automatically derived view of who you've worked with — computed from users who share at least 1 yacht attachment, not stored as explicit relationships.
**Why:** This is the wedge. The colleague graph compounds as more crew claim their history. It makes the platform useful the moment you add a second yacht.
**Sprint:** 4
**Status:** specced
**Key notes:** Graph edges come from shared real employment — not from follows, contacts, or payments (D-028). Computed on access, not stored as a relationship table. Display: name, shared yacht(s), relationship label.

---

### Certifications

**What:** A record of a crew member's professional certifications — type, issued date, expiry date, and optional document upload. Free tier allows document upload; Pro tier unlocks a document manager for organising and tracking cert documents.
**Why:** Certifications are a core part of a yachtie's professional identity. Tracking expiry dates is genuinely useful — crew need to know when certs are expiring.
**Sprint:** 3
**Status:** specced
**Details:**

**Cert type selection**
- Seeded list of all known certification types (see Reference Data below)
- Hierarchical/tree UI that narrows by category first (e.g., Safety → STCW Basic, STCW Advanced; Medical → ENG1, PADI; Navigation → Yachtmaster Coastal, Yachtmaster Offshore, etc.) so users aren't scrolling hundreds of certs
- "Other" free-text option — entered values tracked for future addition to seed list

**Per certification record:**
- Certification type (required)
- Issued date (optional)
- Expiry date (optional)
- Document upload (optional) — PDF, JPEG, PNG. Stored in Supabase Storage

**Document management:**
- Free tier: upload cert documents, view them, basic list
- Pro tier: document manager — organised view, expiry tracking dashboard, expiry reminders/alerts
- Note: we are not verifying documents. Upload is for the user's convenience and future features

**Expiry tracking:**
- Display expiry status on cert list (valid / expiring soon / expired)
- Pro users: email alerts before cert expiry (timing TBD — 30 days? 60 days?)

---

### Endorsement Requests

**What:** A tool for crew to request endorsements from colleagues identified via shared yacht history, sent via deep link (email, and optionally WhatsApp if the user chooses to share as a message).
**Why:** Increases the response rate on the endorsement loop. The tooling improves response rate — it doesn't change who is eligible to endorse (D-009).
**Sprint:** 5
**Status:** specced
**Details:**
- Rate-limited: 10/day free, 20/day Pro
- Suggestions drawn from colleague graph (shared-yacht list)
- Manual add: phone/email input
- Delivery: email via Resend. User can also copy the deep link to send via WhatsApp or other messaging
- Request expiry: 30 days
- Deep link format: `/r/:token`

---

### Endorsements

**What:** A written endorsement from one crew member to another, requiring shared yacht attachment, containing free-text and structured metadata (role, dates, yacht).
**Why:** Endorsements are the trust signal — attestation from real coworkers with verifiable shared history. They're what makes the profile more than a self-authored CV.
**Sprint:** 5
**Status:** specced
**Details:**
- Shared yacht attachment required to endorse (D-009) — this keeps endorsements grounded in real experience
- One endorsement per (endorser, recipient, yacht)
- Text field: 10–2000 characters
- Optional structured fields: your role, their role, dates worked together (prefill from attachment data)
- Editing allowed. Deletion allowed — retractions tracked in backend only, not shown in UI (D-005)
- Star ratings and numeric scores aren't planned — they create false precision and gaming incentives (D-002)
- Absence of endorsements is neutral — the platform shouldn't label it as a negative (D-011)
- Auto-summary language ("well endorsed", "lightly endorsed") isn't planned — it collapses nuance into judgment (D-013)

**Notifications when someone endorses you:**
- Email notification (webapp phase)
- In-app notification (when native app ships)

---

### Endorsement Signals (agree/disagree)

**What:** A lightweight agree/disagree signal on an endorsement, available to users with overlapping attachment to the same yacht.
**Why:** Allows the community to express opinion on an endorsement without triggering moderation. Signals are social proof — they feed trust weighting in Phase 2+ but don't act on endorsements directly.
**Sprint:** Phase 1B
**Status:** deferred from 1A (D-019)
**Key notes:** Only users with shared yacht attachment can signal. Signals alone don't remove an endorsement — they inform future trust calculations.

---

### Public Profile Page

**What:** A server-rendered public page at `/u/:handle` (and `handle.yachtie.link` for Pro users) showing a crew member's identity, employment history, certifications, and endorsements — shareable and SEO-indexed.
**Why:** The portable profile is useless if it can't be shared. This is the linktr.ee use case — crew hand someone this URL on a dock, in a port, or via a QR code.
**Sprint:** 6
**Status:** specced
**Details:**
- Sections: Name + role, about, employment history, certifications, endorsements received
- Endorsement display: endorser name, yacht, date, truncated excerpt — collapsible to expand and read full text
- No discovery rails or browse-similar on this page — it's a direct profile, not a feed
- Open Graph meta tags for link sharing (name, role, photo)
- QR code: bottom-left corner of page. Encodes `/u/:handle` URL (or custom subdomain if Pro)
- Direct link shows full profile including contact details the user has made visible (D-025)

---

### CV Import

**What:** Upload an existing CV (PDF or DOCX) to auto-populate profile fields via LLM extraction, with a review step before saving.
**Why:** Crew already have CVs. Making them re-type employment history creates unnecessary friction that delays graph formation. The goal is time-to-first-endorsement under 30 days (D-021).
**Sprint:** 6
**Status:** specced
**Details:**
- Extraction via Claude Sonnet API
- Review screen: pre-filled form the user can edit field by field before saving
- Extracted data is still self-reported — this is not verification
- Cost target: less than EUR 0.05 per parse
- Fallback: if parsing fails, skip silently to manual entry
- Rate-limited: 3 parses/user/day
- Part of the free identity layer

---

### PDF Snapshot

**What:** A downloadable PDF of the crew member's profile — clean, professional layout, generated on demand.
**Why:** Crew need a physical/email-ready CV for situations where a URL isn't enough. PDF export is core portable identity and should stay free (D-014).
**Sprint:** 6
**Status:** specced
**Details:**
- **Sections on PDF:** Name, photo, role, about, employment history, certifications, top 3 endorsements (excerpt + endorser name + yacht), link to full endorsements on public profile
- **Free template:** Clean, minimal design. Founder to provide reference sample during Sprint 6 build
- **Pro templates:** 2 additional (Classic Navy, Modern Minimal) — locked for free users
- **Watermark:** "Created with YachtieLink" on free tier. Removed for Pro
- **QR code:** Included on generated PDF (bottom-left corner), links to public profile
- Generate + download flow. Store generated PDF URL for re-download

**Crew-first note:** The ability to export your profile as a PDF stays free. Paid scope covers premium templates and watermark removal only — not the export itself.

---

### Crew Pro — Paid Presentation Upgrades

**What:** A subscription that unlocks presentation polish and workflow convenience — premium PDF templates, watermark removal, custom subdomain, profile analytics, certification document manager, and higher endorsement request allowance.
**Why:** Funds operations without affecting trust. Paid features improve how a profile looks and how efficiently it can be worked — not how trustworthy it appears.
**Sprint:** 7
**Status:** specced
**Details:**

**Pricing:**
- Monthly: EUR 12/month
- Annual: EUR 9/month billed annually (EUR 108/year — save 25%)
- No free trial — the free tier is the trial

**Includes:**
- Premium PDF templates (2 additional: Classic Navy, Modern Minimal)
- Watermark removal on PDF exports
- Custom subdomain (`handle.yachtie.link`) — works as an alias alongside the standard `/u/:handle` URL. Both URLs remain active
- Profile analytics: view count, PDF downloads, link shares — displayed as time-series (last 7 days, 30 days, all time)
- Certification document manager: organised document view, expiry tracking dashboard, expiry reminder alerts
- Higher endorsement request allowance (20/day vs 10/day free)

**Stripe integration:**
- Stripe Customer creation on signup (or lazy on first billing interaction)
- Stripe Checkout for subscription creation
- Stripe Customer Portal for management (cancel, update payment, invoice history)
- Webhook handler: subscription created, updated, deleted, payment failed

**Crew-first note:** If a Pro feature starts to look like it affects trust weight, endorsement visibility, or graph behaviour — flag it before building. Verified status, moderation power, and endorsement eligibility sit outside paid scope.

---

### QR Code

**What:** A downloadable QR code encoding the user's public profile URL, displayed on their profile page and embedded in generated PDFs.
**Why:** Crew share profiles in person — on docks, in marinas, at crew agencies. A QR code is the fastest way to hand someone your profile.
**Sprint:** 6
**Status:** specced
**Details:**
- QR encodes `/u/:handle` (or `handle.yachtie.link` for Pro users)
- Appears: bottom-left corner of public profile page, bottom-left corner of generated PDFs, downloadable from profile tab
- Download as image (PNG)

---

### Notifications & Email

**What:** Transactional email for key events, with a light touch — no spam, no marketing fluff.
**Why:** Users need to know about endorsement requests, account events, and (for free tier) nudges when profile views spike.
**Sprint:** 2 (auth emails), 5 (endorsement emails), 7 (analytics nudges), 8 (full set)
**Status:** specced
**Details:**

**Email (via Resend):**
- Welcome email on signup
- Email verification (email/password accounts)
- Password recovery
- Endorsement request received (with deep link)
- Endorsement written for you
- Cert expiry reminders (Pro)
- Free tier nudge: "Your profile views are above average this week" — prompt to upgrade to see full analytics (send sparingly, not weekly)

**In-app notifications:**
- Deferred to native app (Phase 2+). Webapp relies on email for now

**Rules:**
- No marketing emails in Phase 1A
- Unsubscribe option on all non-essential emails
- Keep copy concise and useful — no filler

---

### Dark Mode

**What:** Full dark mode support, toggled in settings or following system preference.
**Why:** Industry standard. Crew use phones in all lighting conditions.
**Sprint:** 1 (built into Tailwind config from the start)
**Status:** specced
**Details:**
- System preference respected by default
- Manual override toggle in More > Settings
- All components, pages, and PDF preview must support both themes

---

### Launch Prep

**What:** Security hardening, instrumentation, legal pages, GDPR compliance, and QA.
**Why:** Production readiness.
**Sprint:** 8
**Status:** specced
**Details:**

**Instrumentation:** PostHog + Sentry
**Security:** Zod validation on all API routes, rate limiting via Vercel KV, CORS, security headers, CSRF protection
**Growth controls:** Invite-only toggle (single config flag)
**GDPR:** Data export (JSON), account deletion cascade, cookie consent (essential only)
**Legal pages:** Terms of Service and Privacy Policy — founder-written placeholders, to be professionally redone when revenue allows
**Language:** English only for 1A
**Offline/PWA:** Not in scope — purely online web app

---

## Reference Data

### Departments
Multi-select. A user can belong to more than one.
- Deck
- Interior
- Engineering
- Galley
- Medical
- Admin/Purser
- Land-based

### Roles (seed list — non-exhaustive)
Organised by department. Users pick from this list via typeahead. "Other" free-text option available — entered values are tracked for future addition.

**Deck:** Captain, First Officer, Second Officer, Third Officer, Bosun, Lead Deckhand, Deckhand, Junior Deckhand, Navigator, Sailing Master
**Interior:** Chief Stewardess, Second Stewardess, Third Stewardess, Stewardess, Junior Stewardess, Purser, Housekeeper, Laundress, Butler
**Engineering:** Chief Engineer, Second Engineer, Third Engineer, ETO (Electro-Technical Officer), AV/IT Officer, Engineer
**Galley:** Head Chef, Sous Chef, Chef, Cook, Crew Cook, Pastry Chef
**Medical:** Ship's Doctor, Nurse, Medic, Paramedic
**Admin/Purser:** Purser, Administrator, PA to Captain, Yacht Manager, Fleet Manager
**Land-based:** Yacht Broker, Yacht Surveyor, Naval Architect, Marine Consultant, Crew Agent, Shore-based Manager, Dock Master, Marina Manager, Chandler, Sail Maker, Rigger
**Other:** Nanny, Fitness Instructor, Spa Therapist, Dive Instructor, Water Sports Instructor, Security Officer, Videographer/Photographer

*This list will grow as users enter custom roles via the "Other" input. Review analytics on "Other" entries periodically and promote common ones into the seed list.*

### Certification Types (seed list — non-exhaustive)
Organised in a hierarchical tree UI so users can narrow by category before selecting.

**Safety & Sea Survival:**
- STCW Basic Safety Training (BST)
- STCW Advanced Fire Fighting
- STCW Proficiency in Survival Craft (PSCRB)
- STCW Medical First Aid
- STCW Medical Care
- STCW Security Awareness
- STCW Crowd Management
- Personal Survival Techniques (PST)
- Sea Survival

**Medical:**
- ENG1 (UK Seafarer Medical)
- ML5 (UK Medical Fitness)
- PADI Rescue Diver
- PADI Divemaster
- First Aid at Work
- Remote Emergency Medical Technician (REMT)
- Automated External Defibrillator (AED)

**Navigation & Watchkeeping:**
- Yachtmaster Coastal
- Yachtmaster Offshore
- Yachtmaster Ocean
- Officer of the Watch (OOW) 3000 GT
- Chief Mate 3000 GT
- Master 3000 GT
- Master 500 GT
- COLREGS
- Radar/ARPA
- GMDSS/GOC (General Operator Certificate)
- GMDSS/ROC (Restricted Operator Certificate)
- ECDIS

**Engineering:**
- AEC (Approved Engine Course)
- Y4 Engineer
- Y3 Engineer
- Y2 Engineer
- Y1 Engineer
- Marine Engine Operator Licence (MEOL)

**Hospitality & Service:**
- WSET (Wine & Spirit Education Trust) Level 1/2/3
- Food Safety / Food Hygiene Level 2/3
- Barista Certification
- Silver Service

**Water Sports & Leisure:**
- RYA Powerboat Level 2
- RYA Jet Ski / PWC
- RYA VHF/SRC
- PADI Open Water
- PADI Advanced Open Water
- PADI Divemaster
- PADI Instructor (IDC)
- SSI equivalents
- RYA Dinghy Instructor
- Kitesurf Instructor (IKO)
- Windsurf Instructor
- Wakeboard / Waterski Instructor
- Paddle Board Instructor

**Regulatory & Flag State:**
- ISPS Ship Security Officer (SSO)
- Designated Person Ashore (DPA)
- ISM Auditor
- Flag State Registration Certificate
- MCA Oral Exam

**Other:**
- Custom entry with free-text (tracked for future addition to seed list)

*Same growth model as roles: track "Other" entries, promote common ones.*

### Yacht Types
- Motor Yacht
- Sailing Yacht

### Flag States
Country dropdown — standard ISO country list.

---

## Phase 1B — Discovery + Convenience

Gate: Phase 1A graph loop is healthy (endorsement-to-profile ratio >0.3 at 500 profiles, organic share rate >10%).

---

### Endorsement Signals (agree/disagree)

Moved from 1A. See entry above in Phase 1A section (marked as deferred to 1B).

---

### Availability Toggle

**What:** A crew member can signal they are available for work, with an expiry (auto-expires after 7 days, re-confirm to stay visible).
**Why:** The toggle is how crew opt into being findable. Without active opt-in, crew get contacted based on stale availability. Weekly expiry keeps the pool current and crew in control (D-027).
**Sprint:** 9
**Status:** specced
**Key notes:** Active opt-in only — off by default. 7-day auto-expiry with day-6 reminder. Crew can hide from recruiters while remaining visible to other crew.

---

### Limited Crew Search

**What:** Pro users can search the crew database by role, yacht name, location, and availability status.
**Why:** Search is recruiter behaviour — if you're searching to find candidates, you're recruiting, so pay for it (D-023). Makes Pro valuable for captains and HODs who hire, while the free tier stays useful for junior crew.
**Sprint:** 9
**Status:** specced
**Key notes:** Search results show profile summaries — name and contact require Pro access or recruiter credits. Graph browsing (yacht to crew) stays open but isn't filterable, so it doesn't support harvesting at scale (D-025).

---

### Attachment Confirmation (Established Yachts)

**What:** When a yacht is established (60+ days, crew threshold met), new attachment requests move through a lightweight confirmation step from existing crew.
**Why:** Balances open graph formation (fresh yachts) with integrity protection as yachts grow (D-017).
**Sprint:** 11
**Status:** specced
**Key notes:** Simple majority confirmation. Dispute flow escalates to moderation if flagged. Worth monitoring false dispute rate — if it spikes, the friction may need tuning.

---

### Expanded Analytics & Convenience

**What:** Enhanced Insights tab for Pro users — who viewed your profile (anonymised by role/location), trend lines, endorsement pinning, notification preferences.
**Why:** Gives Pro users more signal on how their profile is performing and more control over presentation.
**Sprint:** 10
**Status:** specced
**Key notes:** Viewer identity is always anonymised in aggregate. Endorsement pinning is display order only — it doesn't affect trust weight.

---

## Phase 1C — Commercial Adjacency

Gate: 10,000+ crew, 3,000+ yachts, recruiter demand signal confirmed.

---

### Peer Hiring

**What:** Crew with full profiles can post open positions on yachts they're attached to. Other crew can apply with their profile. Graph proximity is visible to both parties.
**Why:** Hiring is a use case for the graph, not a separate product. When both parties are nodes in the trust graph with visible profiles, incentives align. Captains are crew too (D-022).
**Sprint:** 12
**Status:** specced
**Key notes:** Free for all crew — no paid listings or placement fees. Poster must have a full profile. Positions visible to graph-adjacent crew. 30-day expiry, renewable. Free: 1 post/month. Pro: 3 posts/month (D-023). This is peer-to-peer hiring — the moment it starts looking like employer-pays, flag it.

---

### Recruiter Access

**What:** External recruiters pay EUR 29/month + credits to search and unlock crew profiles. Credits (EUR 75–1200 bundles) reveal name and contact from search results. Crew must opt in.
**Why:** Monetises the demand side without touching crew-side trust. Recruiters get read-only access — they can't affect the graph (D-024).
**Sprints:** 13–14
**Status:** specced
**Key notes:** Crew opt-in required, default off. Direct link/QR always shows full profile regardless of recruiter paywall (D-025). Recruiters can sort by endorsement count — this is ordering, not trust weighting (D-026). 1 credit = 1 profile unlock, permanent per pair. Credits expire after 1 year.

---

### Agency Plans

**What:** Multi-seat recruiter accounts for crewing agencies — shared shortlists, bulk search, CSV export of unlocked profiles, agency-level analytics.
**Why:** Agencies are the high-volume demand-side user. Multi-seat plans capture more revenue per customer than individual subscriptions.
**Sprint:** 15
**Status:** specced
**Key notes:** Same access rules as individual recruiters, per seat. No moderation power or trust influence at any tier.

---

## Phase 2+ — Deferred

These are real features with real value. They're deferred until the crew-side product and graph have integrity. Nothing here is permanently off the table — they're sequencing decisions (D-035, D-036).

Build with future upgrades in mind — architecture should not make these harder to add later.

---

### Contacts Import (Native)

**What:** Import contacts from phone's native contact list to send endorsement requests. Multi-select UI.
**Why:** Reduces friction on endorsement request flow. Deferred because it requires native device API access.
**Status:** deferred — awaiting native app (iOS/Android)

---

### In-App Notifications

**What:** Real-time notification system with bell icon, notification list, and push notifications.
**Why:** Essential for engagement but requires native app for push. Webapp relies on email.
**Status:** deferred — awaiting native app

---

### Timeline / Posts

**What:** A chronological feed of posts, career milestones, and interactions — visible only within a user's network.
**Why:** Crew have real career memory worth capturing. A graph-bounded timeline surfaces it without creating a public engagement loop.
**Status:** deferred
**Key notes:** Chronological ordering is the right default — algorithmic surfacing creates incentives that tend to corrupt truthful behaviour (D-031). Visibility bounded to network (D-030). Worth revisiting the ordering question when the time comes.

---

### Messaging / Direct Messages

**What:** Direct messaging between users who have a contact relationship.
**Why:** Communication convenience for crew who know each other. Contacts exist for messaging — they don't create graph edges or endorsement eligibility (D-029).
**Status:** deferred

---

### IRL Connections

**What:** In-person encounters as first-class objects — verified by mutual confirmation. Creates a graph edge without shared yacht history.
**Why:** Crew meet in marinas, ports, industry events. A verified IRL connection is a reality-bound graph edge (D-028) that extends the network beyond employment.
**Status:** deferred
**Key notes:** Mutual confirmation required — one party can't unilaterally create an IRL edge. Users can always remove themselves from an interaction, removing their association everywhere (D-033).

---

### Yacht Merging

**What:** Admin-mediated or community-proposed merge of duplicate or renamed yacht entities into a single canonical entity.
**Why:** Over time the same physical yacht accumulates multiple entries. Merging restores graph integrity at scale.
**Status:** deferred
**Key notes:** Wrong merges are hard to reverse and corrupt trust — worth being careful when this gets built. Quorum approval is the right model (D-006).

---

### Verified Status & Community Moderation

**What:** An earned status level that grants expanded moderation power — earned through tenure, endorsement density from verified users, or seed-set membership.
**Why:** Community-based moderation scales better than admin intervention as the graph grows (D-015, D-016).
**Status:** deferred
**Crew-first note:** Verified status should stay earned through trust evidence — not purchasable. If there's ever pressure to make it a paid feature, flag it.

---

## Not planned

These have been considered and aren't on the roadmap based on current product direction. Worth revisiting if the product evolves significantly — but flag before building any of them.

---

### Star ratings or numeric scores

**Why not:** Creates false precision, coercion dynamics, legal exposure, and gaming incentives (D-002). Endorsements as free text are more nuanced and harder to game.

### Auto-summary language

**Why not:** "Well endorsed" / "lightly endorsed" turns a nuanced signal into a judgment, and quietly undermines the principle that absence of endorsements is neutral (D-013).

### Algorithmic timeline surfacing

**Why not:** Trending, boosting, and engagement weighting create incentives for performative rather than truthful behaviour (D-031).

### Payment affecting trust outcomes

**Why not:** If trust can be bought, the signal is worthless. The value proposition depends on this staying clean (D-003). Any feature that looks like it crosses this line should be flagged.

### Labelling absence of endorsements as negative

**Why not:** Penalises early users and private crew for having fewer endorsements. Only contradicted endorsements create negative signal (D-011).
