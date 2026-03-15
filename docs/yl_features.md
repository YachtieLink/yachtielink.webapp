# YachtieLink Feature Registry

**Version:** 3.0
**Date:** 2026-03-15
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
**Priority:** Must have
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
**Priority:** Must have
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
**Priority:** Must have
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

**Languages**
- Multi-select from common language list + "Other" free-text
- Proficiency level per language: Native, Fluent, Conversational, Basic
- Displayed on profile card (below role/department) and on public profile page
- Visible to all — no visibility toggle (languages are always professional information)
- Extracted from CV import if present
- Critical for charter yachts where guest-facing language skills determine hiring

**Sections (in order):**
1. About
2. Languages
3. Yachts (reverse chronological)
4. Certifications
5. Endorsements received

**Dark mode:** Supported from launch. Light/dark toggle in settings, respects system preference by default.

---

### Employment History

**What:** A structured record of a crew member's past and current roles — yacht name, role, department, start and end dates.
**Why:** Employment history is the raw material for the yacht graph. Without it, colleague discovery and endorsement gating have nothing to work from.
**Sprint:** 2–3
**Status:** specced
**Priority:** Must have
**Key notes:** Role and date range required on every attachment. Soft-deletes preserve endorsement links (D-006).

---

### Yacht Entities

**What:** Yachts as real database objects with a UUID, display name, type, length, flag state, and year built — not free-text strings. The yacht's "Wikipedia page" in the industry.
**Why:** Making yachts entities (not just text fields) is what allows the graph to form. Two crew who both attach "Lady M" are connected because they referenced the same object.
**Sprint:** 4
**Status:** specced
**Priority:** Must have
**Details:**
- **Yacht type:** Motor Yacht or Sailing Yacht (two options only)
- **Length:** Exact length in metres (numeric input). First creator should aim for accuracy since this becomes the reference record
- **Flag state:** Country dropdown
- **Year built:** Optional, can be skipped if unknown
- Duplicate names tolerated but actively discouraged at creation time: fuzzy match runs against existing records when a user creates a new yacht; if a close match is found, a confirmation prompt displays the candidate with type/length/flag details — user must explicitly confirm "No, create new" (D-037). Near-miss events logged for Phase 2 merge tooling.
- Yacht merging (admin or user-initiated) deferred to Phase 2 (D-006)
- **Cover photo** (Sprint 4): single cover photo per yacht, upload gated to users with a past or present attachment to that yacht. Stored in `yacht-photos` bucket (public). Upload overwrites previous cover. (D-038, D-039)
- **Photo gallery** (Phase 1B Sprint 11): full multi-photo gallery replacing the single cover photo. Multiple images, contributor attribution, ordering, deletion by uploader or yacht creator. Still gated to users with an attachment. (D-038, D-039)
- Ratings, reviews, or interactions on yacht entities aren't planned — yachts are graph infrastructure, not review targets

---

### Employment Attachments

**What:** The link between a crew member and a yacht — role, dates, and yacht reference — forming the basic unit of the graph.
**Why:** Attachments are the edges that make the graph. Every other graph feature (colleagues, endorsement gating) derives from overlapping attachments.
**Sprint:** 2–4
**Status:** specced
**Priority:** Must have
**Key notes:** Fresh yachts are open to attach. Established yachts (60 days + crew threshold) move to confirmation flow in Phase 1B. Soft delete preserves existing endorsements.

---

### Colleague Graph

**What:** An automatically derived view of who you've worked with — computed from users who share at least 1 yacht attachment, not stored as explicit relationships.
**Why:** This is the wedge. The colleague graph compounds as more crew claim their history. It makes the platform useful the moment you add a second yacht.
**Sprint:** 4
**Status:** specced
**Priority:** Must have
**Key notes:** Graph edges come from shared real employment — not from follows, contacts, or payments (D-028). Computed on access, not stored as a relationship table. Display: name, shared yacht(s), relationship label.

---

### Certifications

**What:** A record of a crew member's professional certifications — type, issued date, expiry date, and optional document upload. Free tier allows document upload; Pro tier unlocks a document manager for organising and tracking cert documents.
**Why:** Certifications are a core part of a yachtie's professional identity. Tracking expiry dates is genuinely useful — crew need to know when certs are expiring.
**Sprint:** 3
**Status:** specced
**Priority:** Must have
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
**Priority:** Must have
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
**Priority:** Must have
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
**Priority:** Nice to have
**Key notes:** Only users with shared yacht attachment can signal. Signals alone don't remove an endorsement — they inform future trust calculations.

---

### Public Profile Page

**What:** A server-rendered public page at `/u/:handle` (and `handle.yachtie.link` for Pro users) showing a crew member's identity, employment history, certifications, and endorsements — shareable and SEO-indexed.
**Why:** The portable profile is useless if it can't be shared. This is the linktr.ee use case — crew hand someone this URL on a dock, in a port, or via a QR code.
**Sprint:** 6
**Status:** specced
**Priority:** Must have
**Details:**
- Sections: Name + role, about, employment history, certifications, endorsements received
- Endorsement display: endorser name, yacht, date, truncated excerpt — collapsible to expand and read full text
- No discovery rails or browse-similar on this page — it's a direct profile, not a feed
- Open Graph meta tags for link sharing (name, role, photo)
- QR code: bottom-left corner of page. Encodes `/u/:handle` URL (or custom subdomain if Pro)
- Native share button: prominent, uses Web Share API (see Native Profile Sharing feature below)
- Direct link shows full profile including contact details the user has made visible (D-025)

---

### CV Import

**What:** Upload an existing CV (PDF or DOCX) to auto-populate profile fields via LLM extraction, with a review step before saving.
**Why:** Crew already have CVs. Making them re-type employment history creates unnecessary friction that delays graph formation. The goal is time-to-first-endorsement under 30 days (D-021).
**Sprint:** 6
**Status:** specced
**Priority:** Must have
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
**Priority:** Nice to have
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
**Priority:** Must have
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

**What:** A downloadable QR code encoding the user's public profile URL, displayed on their profile page and embedded in generated PDFs. Pro users can customise the QR code's appearance — colors, background, transparency — and the customised design persists everywhere the QR appears.
**Why:** Crew share profiles in person — on docks, in marinas, at crew agencies. A QR code is the fastest way to hand someone your profile. Pro customisation lets crew match the QR to their personal brand or the yacht's livery — a presentation upgrade that makes printed and shared materials look polished and intentional.
**Sprint:** 6
**Status:** specced
**Priority:** Nice to have
**Details:**
- QR encodes `/u/:handle` (or `handle.yachtie.link` for Pro users)
- Appears: bottom-left corner of public profile page, bottom-left corner of generated PDFs, downloadable from profile tab
- **Free tier:** two preset styles — black-on-white (default) and white-on-black (inverted). Downloadable as PNG. Toggle between the two in the QR section of the profile tab
- **Pro tier — QR Customisation:**
  - **Foreground colour:** colour picker for the QR code modules (dots/squares). Default: black (#000000)
  - **Background colour:** colour picker for the QR background. Default: white (#FFFFFF)
  - **Transparent background:** toggle to remove the background entirely (exports as PNG with alpha channel)
  - **Live preview:** real-time preview updates as the user adjusts colours/transparency
  - **Download formats:** PNG (default, supports transparency), SVG (for print/vector use)
  - **Global application:** customised QR style is saved to the user's profile settings and automatically applied everywhere:
    - Public profile page QR display
    - Generated CV/PDF exports (the QR embedded in the PDF uses the user's chosen colours)
    - QR download from the profile tab
  - **Contrast validation:** warn the user if their colour combination produces insufficient contrast for reliable scanning (QR codes need strong foreground/background contrast to scan). Block save if contrast ratio falls below a scannable threshold
  - Implementation: client-side QR generation library (e.g., `qrcode` npm package) with colour params passed in. PDF generation pipeline reads saved QR style from user profile and renders accordingly

---

### Native Profile Sharing

**What:** A prominent share button on the public profile page and the profile owner's own profile view that triggers the device's native share sheet — letting users share a profile via WhatsApp, iMessage, Telegram, email, or any other app on their phone in two taps.
**Why:** Crew share profiles constantly — recommending colleagues to captains, forwarding their own profile to agencies, sharing in crew WhatsApp groups. The share flow must be as fast and frictionless as possible. The native share sheet shows the user's own installed apps (WhatsApp, Telegram, Messages, Mail, etc.) so it always works regardless of which messaging apps they use. This is how crew actually communicate — not via desktop browsers.
**Sprint:** 6 (alongside Public Profile Page)
**Status:** proposed
**Priority:** Must have
**Details:**
- **Web Share API** (`navigator.share()`): supported on all modern mobile browsers (iOS Safari, Chrome Android). Triggers the native OS share sheet showing the user's installed apps
- Share payload: profile URL (`yachtie.link/u/:handle` or custom subdomain) + display name + role as the share text (e.g., "Check out Sarah Mitchell — Chief Stewardess on YachtieLink")
- **Share button placement:**
  - Public profile page (`/u/:handle`): prominent share icon in the header area, visible to anyone viewing the profile
  - Profile owner's own view: share button in the CV/profile tab alongside existing copy-link and QR actions
  - Generated PDFs: profile URL is printed (not a share button — PDFs are static)
- **Fallback for desktop browsers** that don't support Web Share API: show a share popover with:
  - Copy link button (with "Copied!" confirmation)
  - WhatsApp deep link (`https://wa.me/?text=...`)
  - Telegram deep link (`https://t.me/share/url?url=...&text=...`)
  - Email (`mailto:?subject=...&body=...`)
  - SMS/iMessage (`sms:?body=...`)
- Open Graph meta tags already specced on public profile — these ensure the shared link renders a rich preview (name, role, photo) in WhatsApp, Telegram, iMessage, etc.
- No login required to view a shared profile — the public page is the whole point
- Analytics: track share events in PostHog (which channel if available via Web Share API callback, otherwise just "shared")

---

### Notifications & Email

**What:** Transactional email for key events, with a light touch — no spam, no marketing fluff.
**Why:** Users need to know about endorsement requests, account events, and (for free tier) nudges when profile views spike.
**Sprint:** 2 (auth emails), 5 (endorsement emails), 7 (analytics nudges), 8 (full set)
**Status:** specced
**Priority:** Must have
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
**Priority:** Nice to have
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
**Priority:** Must have
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
**Priority:** Must have
**Key notes:** Active opt-in only — off by default. 7-day auto-expiry with day-6 reminder. Crew can hide from recruiters while remaining visible to other crew.

---

### Limited Crew Search

**What:** Pro users can search the crew database by role, yacht name, location, and availability status.
**Why:** Search is recruiter behaviour — if you're searching to find candidates, you're recruiting, so pay for it (D-023). Makes Pro valuable for captains and HODs who hire, while the free tier stays useful for junior crew.
**Sprint:** 9
**Status:** specced
**Priority:** Must have
**Key notes:** Search results show profile summaries — name and contact require Pro access or recruiter credits. Graph browsing (yacht to crew) stays open but isn't filterable, so it doesn't support harvesting at scale (D-025).

---

### Attachment Confirmation (Established Yachts)

**What:** When a yacht is established (60+ days, crew threshold met), new attachment requests move through a lightweight confirmation step from existing crew.
**Why:** Balances open graph formation (fresh yachts) with integrity protection as yachts grow (D-017).
**Sprint:** 11
**Status:** specced
**Priority:** Nice to have
**Key notes:** Simple majority confirmation. Dispute flow escalates to moderation if flagged. Worth monitoring false dispute rate — if it spikes, the friction may need tuning.

---

### Expanded Analytics & Convenience

**What:** Enhanced Insights tab for Pro users — who viewed your profile (anonymised by role/location), trend lines, endorsement pinning, notification preferences.
**Why:** Gives Pro users more signal on how their profile is performing and more control over presentation.
**Sprint:** 10
**Status:** specced
**Priority:** Nice to have
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
**Priority:** Must have
**Key notes:** Free for all crew — no paid listings or placement fees. Poster must have a full profile. Positions visible to graph-adjacent crew. 30-day expiry, renewable. Free: 1 post/month. Pro: 3 posts/month (D-023). This is peer-to-peer hiring — the moment it starts looking like employer-pays, flag it.

---

### Recruiter Access

**What:** External recruiters pay EUR 29/month + credits to search and unlock crew profiles. Credits (EUR 75–1200 bundles) reveal name and contact from search results. Crew must opt in.
**Why:** Monetises the demand side without touching crew-side trust. Recruiters get read-only access — they can't affect the graph (D-024).
**Sprints:** 13–14
**Status:** specced
**Priority:** Must have
**Key notes:** Crew opt-in required, default off. Direct link/QR always shows full profile regardless of recruiter paywall (D-025). Recruiters can sort by endorsement count — this is ordering, not trust weighting (D-026). 1 credit = 1 profile unlock, permanent per pair. Credits expire after 1 year.

---

### Agency Plans

**What:** Multi-seat recruiter accounts for crewing agencies — shared shortlists, bulk search, CSV export of unlocked profiles, agency-level analytics.
**Why:** Agencies are the high-volume demand-side user. Multi-seat plans capture more revenue per customer than individual subscriptions.
**Sprint:** 15
**Status:** specced
**Priority:** Nice to have
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
**Priority:** Nice to have

---

### In-App Notifications

**What:** Real-time notification system with bell icon, notification list, and push notifications.
**Why:** Essential for engagement but requires native app for push. Webapp relies on email.
**Status:** deferred — awaiting native app
**Priority:** Must have

---

### Timeline / Posts

**What:** A chronological feed of posts, career milestones, and interactions — visible only within a user's network.
**Why:** Crew have real career memory worth capturing. A graph-bounded timeline surfaces it without creating a public engagement loop.
**Status:** deferred
**Priority:** Only if we have lots of time
**Key notes:** Chronological ordering is the right default — algorithmic surfacing creates incentives that tend to corrupt truthful behaviour (D-031). Visibility bounded to network (D-030). Worth revisiting the ordering question when the time comes.

---

### Messaging / Direct Messages

**What:** Direct messaging between users who have a contact relationship.
**Why:** Communication convenience for crew who know each other. Contacts exist for messaging — they don't create graph edges or endorsement eligibility (D-029).
**Status:** deferred
**Priority:** Nice to have

---

### IRL Connections

**What:** In-person encounters as first-class objects — verified by mutual confirmation. Creates a graph edge without shared yacht history.
**Why:** Crew meet in marinas, ports, industry events. A verified IRL connection is a reality-bound graph edge (D-028) that extends the network beyond employment.
**Status:** deferred
**Priority:** Only if we have lots of time
**Key notes:** Mutual confirmation required — one party can't unilaterally create an IRL edge. Users can always remove themselves from an interaction, removing their association everywhere (D-033).

---

### Yacht Merging

**What:** Admin-mediated or community-proposed merge of duplicate or renamed yacht entities into a single canonical entity.
**Why:** Over time the same physical yacht accumulates multiple entries. Merging restores graph integrity at scale.
**Status:** deferred
**Priority:** Nice to have
**Key notes:** Wrong merges are hard to reverse and corrupt trust — worth being careful when this gets built. Quorum approval is the right model (D-006).

---

### Verified Status & Community Moderation

**What:** An earned status level that grants expanded moderation power — earned through tenure, endorsement density from verified users, or seed-set membership.
**Why:** Community-based moderation scales better than admin intervention as the graph grows (D-015, D-016).
**Status:** deferred
**Priority:** Must have
**Crew-first note:** Verified status should stay earned through trust evidence — not purchasable. If there's ever pressure to make it a paid feature, flag it.

---

## AI Features — OpenAI API Integration

These features use OpenAI's API to enhance the crew experience across free and paid tiers. All AI features respect the canonical monetisation law: AI can improve presentation, convenience, and workflow — never create, suppress, or alter trust. No AI feature affects endorsement eligibility, trust weighting, or graph behaviour.

**API strategy:** One vendor (OpenAI), one bill. Model selection per feature based on cost/quality tradeoff. Cheapest viable model always preferred. Batch API (50% off) used for non-realtime workloads.

**Cost principle:** Free-tier AI features must cost under EUR 0.01/user/month at scale. Pro-tier AI features must stay under EUR 0.10/user/month, well within the EUR 9–12/month subscription margin. Expensive features (voice, recruiter search) map to higher-value tiers or one-time use.

---

### AI-01 — Content Moderation

**What:** Automated moderation of all user-generated text and images using OpenAI's `omni-moderation-latest` model. Runs on every profile bio, endorsement, endorsement request message, and uploaded profile photo.
**Why:** Protects the trust layer from spam, abuse, and inappropriate content from day one. Multilingual support covers the international crew base (42% better on non-English content than previous moderation models). The moderation API is completely free — there is no reason not to ship this immediately.
**Tier:** Free (all users)
**Cost:** FREE — OpenAI charges nothing for the moderation API
**Phase:** 1A (ship with launch)
**Status:** proposed
**Priority:** Must have
**Details:**
- Runs on: profile bios, endorsement text, endorsement request messages, profile photos, yacht cover photos
- Categories checked: hate, harassment, self-harm, sexual content, violence, and subcategories
- Accepts both text and images natively (built on GPT-4o)
- Action on flag: content blocked from publishing, user shown generic "content policy" message, flag logged for review
- No false-positive appeal flow in Phase 1A — manual admin review if users report an issue
- Latency: <500ms per check, non-blocking where possible (check on submit, not on keystroke)

---

### AI-02 — Certification OCR & Auto-Fill

**What:** Crew photograph their certificates (STCW, ENG1, food safety, etc.) with their phone camera, and AI reads the cert type, issue date, expiry date, and issuing authority — auto-populating the certification record.
**Why:** Certification entry is the most tedious part of profile setup. A crew member with 8–12 certs faces 15+ minutes of manual data entry. Photo-to-fields reduces this to seconds per cert. Removes a major friction point that delays profile completion and graph formation.
**Tier:** Pro
**Cost:** ~EUR 0.003/cert (GPT-4o Mini Vision)
**Phase:** 1B
**Status:** proposed
**Priority:** Must have
**Details:**
- Model: GPT-4o Mini with vision input
- Input: phone camera photo or uploaded image (JPEG, PNG, WebP) of certificate
- Extracted fields: cert type (matched against seeded cert list), issue date, expiry date, issuing authority, certificate number (if visible)
- Review step required: pre-filled form shown to user for confirmation/editing before saving — same pattern as CV import
- Fallback: if extraction confidence is low or parsing fails, skip to manual entry with a helpful message ("We couldn't read this one — please enter the details manually")
- Handles: angled photos, variable lighting, different cert layouts across flag states and issuing bodies
- Does not constitute verification — extracted data is still self-reported
- Rate limit: 20 cert scans/day (Pro only)
- Upload the photo as the cert document attachment simultaneously (saves a second upload step)

---

### AI-03 — Multilingual Endorsement Requests

**What:** When a crew member sends an endorsement request to a colleague who speaks a different language, the request email is automatically translated into the recipient's preferred language. The recipient can write their endorsement in their native language.
**Why:** The superyacht industry employs crew from 50+ nationalities. A Filipino deckhand requesting an endorsement from a French captain shouldn't be blocked by language. This directly accelerates trust graph formation across the international crew base — the single biggest competitive moat YachtieLink can build. Traditional agencies are limited to languages their staff speak.
**Tier:** Free (all users)
**Cost:** ~EUR 0.0003/request (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Must have
**Details:**
- Model: GPT-5 Nano for translation
- Trigger: when sender and recipient have different preferred languages set in their profile
- Translates: the endorsement request email body and subject line
- Does NOT translate: endorsement text itself (stored in the language it was written in — see AI-10 for profile translation)
- Language detection: uses recipient's profile language preference. If not set, sends in English (default)
- Priority languages (10): English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch
- Supported but lower priority: all other languages GPT-5 Nano handles
- Request email includes a note: "This message was automatically translated from [language]"
- No user action required — translation happens transparently on send

---

### AI-04 — Endorsement Writing Assistant

**What:** An optional "Help me write" tool in the endorsement form that asks 2–3 quick questions and generates a draft endorsement the user can edit before submitting.
**Why:** Many crew stare at a blank endorsement box and either write something generic ("great to work with") or abandon the form entirely. Guided drafting increases both endorsement completion rate and quality, which directly feeds graph density. The crew member still owns and edits the final text — the AI is a starting point, not a replacement.
**Tier:** Free (all users)
**Cost:** ~EUR 0.0003/endorsement (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Must have
**Details:**
- Model: GPT-5 Nano
- UX: "Help me write" button below the endorsement text field. Opens a 2–3 question mini-flow:
  1. "What did [name] excel at in their role?" (free text, 1–2 sentences)
  2. "What stood out about working with them?" (free text, 1–2 sentences)
  3. "Would you work with them again?" (Yes / Absolutely / optional skip)
- Output: a 100–300 word draft endorsement populated into the text field, clearly marked as a draft for editing
- Crew can edit freely before submitting — the draft is a starting point
- The generated text is contextual: references the shared yacht name, the recipient's role, and the time period from attachment data
- No AI attribution on the published endorsement — it's the endorser's words once they submit
- Does NOT affect endorsement eligibility or trust weighting in any way
- Guardrail: prompt instructs the model to write authentically and avoid superlatives or generic praise. Tone should match how real crew speak

---

### AI-05 — Cert Expiry Intelligence

**What:** AI-powered certification guidance that goes beyond simple expiry reminders. Cross-references the crew member's target roles, yacht size preferences, and current cert portfolio to identify gaps, renewal priorities, and career-blocking expirations.
**Why:** A simple "your STCW expires in 30 days" alert is useful but not differentiated. Cert intelligence connects expiry tracking to career progression — telling crew which certs matter most for the roles they're targeting and what gaps might block them. Transforms the cert manager from a checklist into genuine career guidance.
**Tier:** Pro
**Cost:** ~EUR 0.001/alert (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: GPT-5 Nano
- Trigger: monthly analysis for Pro users, plus on-demand "Check my certs" button in the cert manager
- Inputs: user's current certifications (type, expiry dates), their role, department, yacht size history, and any stated career goals (future: role aspiration field)
- Output examples:
  - "You're targeting Chief Officer on 60m+ vessels — you'll need your GMDSS renewal before April and your Advanced Fire Fighting is missing entirely. These courses typically book 4–6 weeks out."
  - "Your ENG1 expires in 45 days. Most Med season contracts require a valid ENG1 at embarkation — renew before your availability window opens."
  - "You have 11 of 12 certs typical for a Second Engineer on motor yachts. Adding an ETO qualification would significantly broaden your options."
- Delivery: in-app card in the cert manager section + optional email digest (monthly, Pro only)
- Does NOT verify certs or make claims about cert validity — advisory only
- Knowledge base: cert requirements by role and flag state are maintained as a structured reference file, not baked into prompts (updatable without model changes)

---

### AI-06 — Season Readiness Score

**What:** A personalised readiness checklist generated as Med or Caribbean season approaches, based on the crew member's current profile state, cert status, endorsement portfolio, and availability settings.
**Why:** Drives engagement at exactly the right moment in the crew calendar. Crew who complete their profile before season are more likely to find positions and stay on the platform. The readiness score creates urgency without being pushy — it's genuinely useful guidance.
**Tier:** Pro
**Cost:** ~EUR 0.001/check (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: GPT-5 Nano
- Trigger: automatically generated 6–8 weeks before season start (Med: mid-March; Caribbean: mid-September). Re-generated weekly until season starts. Also available on-demand via "Am I ready?" button
- Inputs: profile completeness, cert expiry dates, endorsement count and recency, availability toggle status, employment history gaps
- Output: a percentage score (e.g., "82% season-ready") plus a prioritised checklist of 3–5 actionable items:
  - "Update your availability dates — you're not currently visible to recruiters"
  - "Your ENG1 expires mid-season — renew before embarkation"
  - "No endorsement from your most recent vessel (MY Atlas, 14 months) — request one from Captain [name]"
  - "Add a profile photo — profiles with photos get 3x more views"
- Delivery: in-app card on the home/dashboard screen + email notification when first generated for the season
- Score is private — never shown to other users or recruiters
- Does NOT affect search ranking, trust weight, or profile visibility

---

### AI-07 — NLP Crew Search for Captains/Agencies

**What:** A natural language search interface for captains and recruiters to query the crew database conversationally. Returns ranked candidate shortlists with match explanations.
**Why:** This is the Phase 1C revenue unlock. Replaces 3–5 days of manual agency back-and-forth with instant, intelligent search. Search quality depends entirely on trust graph density — this is a post-density feature only.
**Tier:** Recruiter (EUR 29/month + credits)
**Cost:** ~EUR 0.02/query (text-embedding-3-small + GPT-5)
**Phase:** 1C
**Status:** proposed
**Priority:** Must have
**Details:**
- Models: text-embedding-3-small for semantic search, GPT-5 for match explanation generation
- Vector store: all crew profiles + endorsement text embedded using text-embedding-3-small (~EUR 0.10 to index 10K profiles). Incremental updates on profile changes
- Query examples:
  - "Chief stew for a 60m charter yacht, silver service experience, French-speaking, available May"
  - "Engineer with Lürssen refit experience, Y2 minimum, available for a 3-month contract"
  - "Experienced bosun who's worked 50m+ motor yachts in the Med, good with guests"
- Results: ranked list of matching crew profiles with AI-generated match explanations ("Matched: 8 years chief stew experience, 3 endorsements mentioning silver service, WSET Level 2, French native speaker, available from April 15")
- This is filtering, not recommending — the platform surfaces matches, it doesn't make hiring decisions
- Crew must opt in to recruiter search (availability toggle, default off)
- Credit cost: 1 credit to unlock a matched profile's name and contact info (same as standard recruiter access)
- Endorsement text is searchable but endorsement count does not affect ranking position (ordering, not trust weighting — D-026)
- Storage: first 1GB vector store free (OpenAI), then $0.10/GB/day
- Latency target: <3 seconds for query → results

---

### AI-08 — CV Parser Vision Upgrade

**What:** Upgrade the existing CV import feature to accept phone camera photos of CVs in addition to PDF/DOCX uploads, using GPT-4.1 with vision capabilities.
**Why:** Many crew — especially those in ports without easy access to a scanner or computer — have their CV as a physical document. Photograph-to-profile removes the need to find a PDF. Same cost as current parsing, dramatically better mobile UX.
**Tier:** Pro (photo upload); Free (PDF/DOCX upload stays free as-is)
**Cost:** ~EUR 0.005/parse (GPT-4.1 Vision — same as current text parsing cost)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: GPT-4.1 with vision input (replaces current GPT-4o-mini for text-only parsing)
- Input: phone camera photo (JPEG, PNG) of a printed or handwritten CV, in addition to existing PDF/DOCX upload
- Extraction: same fields as current CV import — name, employment history (yacht names, roles, dates), certifications, contact info, languages
- Review step: identical to current flow — pre-filled form, user edits before saving
- Handles: multi-page CVs (user takes one photo per page), angled/imperfect photos, varied CV layouts
- Fallback: if vision parsing fails, prompt user to try PDF/DOCX upload instead
- Photo CV upload is a Pro feature (value-add for the subscription). Standard PDF/DOCX upload remains free
- Rate limit: 3 parses/user/day (unchanged)
- Cost target: under EUR 0.05 per parse (same as current)

---

### AI-09 — Endorsement Portfolio Advisor

**What:** Analyses a crew member's existing endorsements and identifies strategic gaps — which colleagues would provide the most valuable endorsements based on seniority, department coverage, and overlap duration.
**Why:** Not all endorsements carry equal weight in a recruiter's eyes. A deckhand with 5 endorsements from fellow deckhands but none from a captain or bosun has a gap. This feature helps Pro users strategically build their endorsement portfolio, which directly drives the graph density that makes the platform valuable.
**Tier:** Pro
**Cost:** ~EUR 0.001/analysis (text-embedding-3-small + GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Models: text-embedding-3-small for endorsement analysis, GPT-5 Nano for recommendation generation
- Trigger: on-demand via "Improve my endorsements" button in the Audience tab, plus a monthly nudge email for Pro users
- Inputs: current endorsements (who wrote them, their role, which yacht), full colleague graph (all shared-yacht connections), endorsement request history (avoid re-suggesting declined requests)
- Output examples:
  - "You have 4 endorsements from fellow stewardesses but none from a captain or chief stew. For senior roles, management-level endorsements carry significant weight. You overlapped with Captain James on MY Horizon for 8 months — consider requesting one."
  - "Your 3 most recent yachts have no endorsements yet. Endorsements from recent vessels are most relevant to recruiters."
  - "You have strong coverage from Deck department but nothing from Engineering — if you worked closely with engineers on MY Atlas, a cross-department endorsement adds depth."
- Suggestions link directly to the endorsement request flow (pre-filled with the suggested colleague)
- Does NOT tell crew their endorsements are "weak" or "insufficient" — frames everything as opportunity, not deficit (respects D-011: absence is neutral)
- Does NOT affect endorsement eligibility, trust weight, or search ranking

---

### AI-10 — Multilingual Profile Translation

**What:** Auto-translate profile content (bio, endorsements, employment descriptions) for viewing by users who speak a different language. Crew writes in their native language; readers see it in theirs.
**Why:** A massive competitive moat. No traditional crewing agency can offer real-time multilingual profile viewing. Combined with AI-03 (multilingual endorsement requests), this removes the language barrier from the entire platform experience. Fits the monetisation law perfectly — translation improves presentation, not trust.
**Tier:** Free (all users)
**Cost:** ~EUR 0.001/profile view with translation (GPT-4o Mini)
**Phase:** 1B
**Status:** proposed
**Priority:** Must have
**Details:**
- Model: GPT-4o Mini
- Trigger: when a viewer's preferred language differs from the profile's original language
- Translates: bio text, endorsement text (on the fly), role descriptions
- Does NOT translate: names, yacht names, certification names (these are industry-standard terms)
- Display: translated text shown with a small "Translated from [language]" indicator. Toggle to view original
- Caching: translations cached per (content hash, target language) to avoid re-translating unchanged content. Cache invalidated on content edit
- Priority languages: same 10 as AI-03 (English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch)
- Fallback: if translation fails or language isn't supported, show original text
- Translation does not affect the stored content — original language is always preserved
- Free because it benefits the entire ecosystem (a French captain reading a Filipino deckhand's profile benefits both parties and the graph)

---

### AI-11 — Smart Yacht Auto-Complete

**What:** Semantic fuzzy matching when crew type a yacht name during onboarding or when adding a new yacht attachment. Uses embeddings to match against the yacht database, handling misspellings, alternate naming conventions, and even descriptive queries.
**Why:** Duplicate yacht entries are a known problem (D-006, D-037). Trigram matching catches simple typos but misses "MY Lady S" vs "M/Y Lady S" vs "Lady S II" vs "the 62m Benetti." Semantic matching dramatically reduces duplicates, which preserves graph integrity. Every duplicate yacht is a broken graph edge.
**Tier:** Free (all users)
**Cost:** ~EUR 0.0001/search (text-embedding-3-small)
**Phase:** 1B
**Status:** proposed
**Priority:** Must have
**Details:**
- Model: text-embedding-3-small for yacht name embeddings
- How it works: all yacht names + metadata (type, length, flag state) are embedded into a vector index. When a user types a yacht name, the input is embedded and compared semantically against the index
- Handles: common variations (MY/M.Y./M/Y, SY/S.Y./S/Y), misspellings, partial names, name changes (if previous names are recorded), and descriptive queries ("the big Feadship in Antibes")
- Display: ranked list of candidate matches with type, length, and flag state shown alongside — same confirmation UX as current duplicate prevention (D-037), but with better matching
- Falls back to current trigram search if vector search returns no results above threshold
- Yacht name embeddings are re-indexed nightly (batch API, 50% off) and on yacht creation
- Extremely cheap: embedding the entire yacht database (even 10K yachts) costs ~EUR 0.01

---

### AI-12 — Yacht History Gap Analyzer

**What:** Scans a crew member's employment timeline and flags gaps, unusually short stints, or patterns that a recruiter would notice — then suggests how to address them.
**Why:** Recruiters scan for gaps and short stints. Many gaps have legitimate explanations (refit work, travel, training, family) but if they're not addressed, they look like red flags. This helps crew present clean, complete timelines before a recruiter notices — improving presentation without altering the underlying data.
**Tier:** Pro
**Cost:** ~EUR 0.0005/analysis (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: GPT-5 Nano
- Trigger: on-demand via "Review my timeline" button in the employment history section, plus a one-time prompt after profile setup is complete
- Inputs: all employment attachments (yacht, role, dates) in chronological order
- Output examples:
  - "You have a 6-month gap between MY Atlas (ended March 2024) and MY Coral (started September 2024). Consider adding any freelance, refit, or training work from that period. Profiles with continuous timelines get more views."
  - "Your stint on MY Phoenix was 6 weeks — short stints are common for day work or relief roles, but you may want to note the context (e.g., 'relief engineer during refit')."
  - "Strong timeline: 4 vessels over 6 years with no significant gaps. No changes needed."
- Suggestions are advisory — the tool doesn't add or modify attachments
- Does NOT penalise gaps or short stints — frames them as presentation opportunities
- Does NOT surface gap analysis to recruiters or other users — private to the crew member

---

### AI-13 — Smart Endorsement Requests

**What:** Uses embeddings to analyse a crew member's colleague graph and recommend the highest-value endorsement requests based on overlap duration, seniority, department, and existing endorsement coverage.
**Why:** A targeted endorsement request to the right colleague is more likely to be completed and more valuable when received. This helps crew make the most of their limited endorsement request allowance (10/day free, 20/day Pro) by prioritising quality over quantity.
**Tier:** Pro
**Cost:** ~EUR 0.0005/suggestion (text-embedding-3-small + GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Models: text-embedding-3-small for colleague analysis, GPT-5 Nano for recommendation generation
- Trigger: shown in the endorsement request flow when the user taps "Request endorsement"
- Inputs: colleague graph (all shared-yacht connections), overlap duration per colleague per yacht, colleague's role and seniority, existing endorsements (who from, which yacht), past request history (avoid re-suggesting ignored requests)
- Output: ranked list of 3–5 recommended colleagues with reasoning:
  - "Request from Captain James — you worked together for 14 months on MY Seahorse, and captain endorsements carry the most weight for your career level."
  - "Request from Chief Engineer Martinez — you have no cross-department endorsements yet, and you overlapped for 8 months on MY Atlas."
- Recommendations link directly to the request flow (pre-filled)
- Complements AI-09 (Portfolio Advisor) — AI-09 identifies gaps, AI-13 suggests specific people to fill them
- Does NOT affect endorsement eligibility or bypass the shared-yacht requirement

---

### AI-14 — Voice Onboarding

**What:** A voice-based conversational onboarding flow where crew talk through their career in their native language and AI extracts structured profile data — name, employment history, certifications, languages spoken.
**Why:** Many crew are more comfortable speaking than typing, especially in a second language. Voice onboarding reduces time-to-first-endorsement (the key activation metric) by making profile creation as easy as a phone call. Multilingual from day one — covers 10 priority languages. This is the conversational onboarding feature already spec'd in the AI Agent Planning Note.
**Tier:** Free (one-time onboarding); Pro (re-run to update profile)
**Cost:** ~EUR 0.30/conversation (OpenAI Realtime API, ~5 minutes)
**Phase:** 2+
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: OpenAI Realtime API (gpt-realtime or gpt-realtime-mini)
- Connection: WebRTC for browser-based voice (no app install needed)
- Flow: conversational interview (~3–5 minutes) covering:
  1. Name and preferred display name
  2. Current/most recent role and department
  3. Employment history (yachts, roles, dates — as many as the user mentions)
  4. Key certifications
  5. Languages spoken
  6. Location and availability
- Extraction: structured data extracted in real-time using function calling during the voice conversation
- Review step: after conversation, user sees a pre-filled profile form (same as CV import review) to confirm/edit before saving
- Languages: 10 priority languages (English, French, Filipino/Tagalog, Spanish, Croatian/Serbian, Afrikaans, Italian, Greek, Portuguese, Dutch). Crew speaks in their language, profile data is stored in the original language
- Interruption handling: OpenAI's semantic VAD (voice activity detection) handles natural pauses vs. finished speaking
- Fallback: if voice fails (poor connection, accent issues), graceful redirect to standard form-based onboarding
- One-time free use during initial onboarding. Pro users can re-run to update their profile via voice
- Tech alternatives evaluated: Vapi, Bland.ai, ElevenLabs — OpenAI Realtime preferred for single-vendor strategy

---

### AI-15 — AI Profile Insights

**What:** AI-generated narrative insights layered on top of the existing Pro analytics (view count, PDF downloads, link shares), turning raw numbers into actionable guidance.
**Why:** Most crew don't know what to do with "47 views this month." AI insights translate data into specific actions — which user segments are viewing, what's driving traffic, and what to do about it. Makes the analytics dashboard worth checking regularly.
**Tier:** Pro
**Cost:** ~EUR 0.001/report (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: GPT-5 Nano
- Trigger: generated weekly for Pro users, shown in the Insights tab. Updated on dashboard visit if >24h stale
- Inputs: view count trends (7d, 30d), PDF download count, referral sources (if trackable), viewer metadata (anonymised — role category, yacht size segment if available), endorsement activity
- Output examples:
  - "Your profile was viewed 47 times this month, up 23% from last month. Views spiked on March 3 — this coincides with when Captain Sarah shared your profile."
  - "3 PDF downloads this week, all from users browsing 50–70m motor yacht crew. Consider highlighting your large-yacht experience in your bio."
  - "You received 2 new endorsements this month but your profile views didn't increase — try sharing your profile link in crew groups to amplify the signal."
- Delivery: in-app card in the analytics/insights section + optional weekly email digest
- Viewer identity is never revealed — insights reference segments and patterns, not individuals
- Does NOT affect search ranking or profile visibility

---

### AI-16 — Weekly Job Market Pulse

**What:** A weekly AI-generated briefing personalised to the crew member's role, experience level, yacht size preferences, and location — covering hiring trends, in-demand certifications, and seasonal patterns.
**Why:** Feels like having a personal crewing agent. Drives weekly return visits to the platform and keeps crew engaged between active job searches. Uses OpenAI's web search tool to scan publicly available job boards and industry sources, then personalises with GPT-5 Nano.
**Tier:** Pro
**Cost:** ~EUR 0.02/digest (OpenAI web search at $10/1K calls + GPT-5 Nano)
**Phase:** 2+
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Models: OpenAI Responses API with web search tool (for market data), GPT-5 Nano (for personalisation)
- Trigger: generated weekly (e.g., Monday morning), delivered via email + in-app card
- Inputs: user's role, department, yacht size history, location, certifications, availability status
- Web search sources: publicly available yacht crew job boards, industry news, seasonal hiring patterns
- Output examples:
  - "This week: 12 new Chief Stew positions posted for Med summer season. 60m+ motor yachts are hiring heavily. Demand for crew with RSA certification is up — you already have this, make sure it's visible on your profile."
  - "Caribbean season wind-down: fewer new postings this week. Good time to update your profile and collect endorsements before Med ramp-up."
- Personalised: references the crew member's specific certs, experience, and gaps
- Does NOT include specific job listings or links to external job boards (avoids becoming a job board aggregator)
- Unsubscribe option available
- Cost note: web search is the expensive component ($10/1K calls). Batch generation for all Pro users overnight keeps costs manageable

---

### AI-17 — Smart Profile Suggestions

**What:** When crew fill out their bio, role description, or other free-text profile fields, AI suggests improvements — better phrasing, industry-relevant keywords, grammar fixes for non-native English speakers.
**Why:** Many crew write sparse or awkwardly worded bios because English isn't their first language or they don't know what to include. Low-effort polish that improves profile quality across the platform without changing the crew member's intent.
**Tier:** Free (all users)
**Cost:** ~EUR 0.0002/request (GPT-5 Nano)
**Phase:** 1B
**Status:** proposed
**Priority:** Nice to have
**Details:**
- Model: GPT-5 Nano
- Trigger: "Improve" button next to bio and text fields, or suggested after the user finishes typing and tabs away
- Input: the user's current text + their role, department, and experience level for context
- Output: a suggested revision shown inline (diff-style or side-by-side). User can accept, edit, or dismiss
- Suggestions focus on: clarity, conciseness, grammar, industry-standard terminology, and completeness (e.g., "Consider mentioning your language skills — they're valuable for charter yachts")
- Does NOT change the crew member's voice or personality — improvements should feel like the user wrote them, just better
- Does NOT add false claims or embellish experience
- Guardrail: prompt explicitly instructs the model to preserve the user's intent and tone

---

### AI-18 — AI Profile Photo Coach

**What:** Crew upload a profile photo and receive instant feedback on lighting, framing, background, and professional appearance — with specific suggestions for improvement.
**Why:** The superyacht industry is appearance-conscious. A good profile photo matters for first impressions, but many crew use casual selfies, group photos, or poorly lit images. Quick, private feedback helps crew put their best foot forward. Presentation improvement, not trust — fits the monetisation law.
**Tier:** Pro
**Cost:** ~EUR 0.002/analysis (GPT-4o Mini Vision)
**Phase:** 1B
**Status:** proposed
**Priority:** Only if we have lots of time
**Details:**
- Model: GPT-4o Mini with vision input
- Trigger: optional — "Get photo feedback" button after uploading a profile photo. Not automatic (crew shouldn't feel judged on upload)
- Input: the uploaded profile photo
- Output: 2–3 specific, actionable suggestions:
  - "Good lighting and professional appearance. Suggestion: crop tighter to head and shoulders — the current framing shows too much background."
  - "A plain or nautical background would look more professional than the current setting."
  - "Consider a photo in uniform or smart casual — yacht crew profiles with professional attire get more engagement."
- Tone: encouraging and constructive, never critical of appearance. Focus on controllable factors (lighting, framing, attire, background)
- Does NOT assess attractiveness, body type, or personal appearance
- Does NOT reject or block photos — suggestions are optional guidance
- Guardrail: prompt explicitly prohibits comments on physical appearance, age, race, or gender

---

### AI-19 — PDF Cover Letter Generator

**What:** Pro users can generate a tailored cover letter for a specific position or yacht, pulling from their profile data, endorsements, and employment history. Exported as PDF alongside their profile snapshot.
**Why:** Useful for crew actively applying to positions. Saves time writing personalised applications while maintaining a professional standard. Nice-to-have feature that adds polish to the Pro subscription.
**Tier:** Pro
**Cost:** ~EUR 0.01/letter (GPT-5 Mini)
**Phase:** 2+
**Status:** proposed
**Priority:** Only if we have lots of time
**Details:**
- Model: GPT-5 Mini (needs more capability than Nano for quality writing)
- Input: user's profile data (role, experience, certs, endorsements) + target position details (role, yacht name/type/size, specific requirements if provided by the user)
- Output: a 200–400 word cover letter referencing:
  - Relevant experience from their employment history
  - Applicable certifications
  - Key endorsement highlights ("endorsed by Captain [X] for [quality]")
  - Why they're a good fit for the specific yacht type/size
- Review step: generated letter shown in an editor for the user to customise before export
- Export: downloadable as PDF, formatted to match Pro PDF template style
- Does NOT fabricate experience or certifications — only references what's on the user's profile
- Rate limit: 5 cover letters/day (Pro only)
- Templates: professional and concise. No flowery language or corporate jargon — matches how crew actually communicate

---

### AI-20 — AI Interview Prep

**What:** An AI mock interviewer that asks role-specific questions based on the yacht type, size, and position the crew member is targeting. Provides feedback on answers.
**Why:** Useful for crew stepping up to a new role level or interviewing for a different yacht type. Niche but valuable for career progression. Lower urgency than other features — a nice differentiator for Pro subscribers.
**Tier:** Pro
**Cost:** ~EUR 0.02/session (GPT-5 Mini)
**Phase:** 2+
**Status:** proposed
**Priority:** Only if we have lots of time
**Details:**
- Model: GPT-5 Mini
- Input: user selects target role, yacht type, and yacht size. Optionally adds specific context ("first time interviewing for a 60m+", "switching from sailing to motor")
- Flow: 5–8 interview questions, text-based (voice interview prep is a future upgrade)
  - Role-specific technical questions (e.g., for engineers: "Walk me through your approach to a generator failure during a charter")
  - Soft-skill questions common in yacht interviews ("How do you handle guest complaints?", "Describe a difficult crew dynamic you navigated")
  - Scenario-based questions relevant to yacht size and type
- Feedback: after each answer, AI provides constructive feedback on content, clarity, and completeness
- Summary: at the end, a brief assessment with strengths and areas to practice
- Does NOT store interview answers or share them with anyone — completely private
- Does NOT contribute to profile, trust score, or any visible metric

---

### AI-21 — Endorsement Sentiment Analysis

**What:** Backend embedding and analysis of endorsement text to compute trust signal density — identifying whether endorsements are substantive and specific vs. generic and vague. Surfaced to the recruiter tier as "endorsement depth indicators."
**Why:** A profile with 5 endorsements saying "great to work with" is different from one with 5 endorsements detailing specific skills, situations, and outcomes. This provides signal to recruiters without introducing numeric scores (respects D-002). Requires large endorsement volume to be statistically meaningful — a late-stage feature.
**Tier:** Recruiter (backend infrastructure, surfaced in recruiter search results)
**Cost:** ~EUR 0.0001/endorsement (text-embedding-3-small)
**Phase:** 2+
**Status:** proposed
**Priority:** Only if we have lots of time
**Details:**
- Model: text-embedding-3-small for endorsement embedding and clustering
- How it works: endorsements are embedded and compared against a reference set of high-quality endorsements. Specificity, detail, and role-relevance are scored programmatically (cosine similarity to quality clusters), not by LLM judgment
- Display to recruiters: a qualitative indicator (e.g., "detailed endorsements" vs. no indicator) — never a numeric score
- Thresholds: minimum 3 endorsements before any indicator is shown. Profiles with fewer endorsements show no indicator (absence is neutral — D-011)
- Does NOT affect crew-facing profile display — crew never see sentiment scores
- Does NOT affect search ranking directly — recruiters can filter by "has detailed endorsements" but it doesn't auto-boost
- Does NOT constitute auto-summary language (D-013) — the indicator describes endorsement content quality, not the crew member's quality
- Retractions and edits are reflected in real-time (re-embedded on change)
- Batch processing: embeddings computed overnight via Batch API (50% off)
- Worth monitoring: if this indicator starts being gamed (crews coaching each other to write "detailed" endorsements), flag it and consider pausing

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
