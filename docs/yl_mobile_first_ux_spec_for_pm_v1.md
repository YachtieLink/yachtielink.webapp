# Yachtielink — Mobile-First, Screen-Complete UX Spec for Engineering (PM Copy)
Version: v2.0 (2026-03-13)

This document defines **exact screens, routes, components, states, and rules** for a mobile-first web app (Safari-first). It is intended to be handed to engineering for implementation without ambiguity.

**Scope:** Phase 1A only. Deferred features (Timeline, Contacts, IRL Connections, Messaging) are not in this spec. See `yl_features.md` for their descriptions under Phase 2+.

---

## 0) Product invariants (must always hold)

### 0.1 Navigation + experience
- **Mobile Safari first** (iPhone baseline). Responsive up to desktop without changing information architecture.
- **Single-column layouts** on mobile; sections as cards; one primary action per screen.
- No feeds. No "discover people". Profiles are accessed via **direct link/QR/share**.
- **Dark mode** supported from launch. System preference respected by default, manual override in Settings.

### 0.2 Trust + language
- No scoring, no rankings, no "trust levels", no comparative language ("strong profile", "highly endorsed", etc.).
- Absence of endorsements must be **neutral** (no shame language, no red states).
- Paid features must be **presentation only** (templates, cosmetics, analytics, document management), never affecting trust eligibility or endorsement weighting.

### 0.3 Endorsement gating (hard rule)
- An endorsement can only be written if **endorser and recipient share a yacht attachment**.
- At most one endorsement per (endorser, recipient, yacht).
- Deleting a yacht attachment must not automatically delete endorsements; endorsement retraction is controlled by the endorser.

### 0.4 Two progress wheels (persistent concept)
- Wheel A: **Profile setup** (5 milestones).
- Wheel B: **Endorsements progress** (goal: 5 received; soft goal; neutral language).

---

## 1) Global UI system (engineers implement once)

### 1.1 App shell
- **Header**: title left; optional icon buttons right (share/settings).
- **Bottom tab bar** (5 items) shown on all authenticated screens except full-screen flows.

### 1.2 Tabs (left to right)
1) Profile (default)
2) CV
3) Insights (Pro upsell)
4) Audience
5) More

### 1.3 Core components
- **Card**: title, subtitle, body, optional primary CTA button, optional secondary text link, empty-state mode.
- **Progress Wheel**: small ring + label (tap -> explainer sheet). Never implies trust judgement.
- **Overflow menu** ("...") for secondary actions.
- **Hierarchical Picker**: tree-based selection UI for narrowing large lists (used for certifications). Category level -> specific item.

### 1.4 Interaction rules
- One obvious primary CTA per screen.
- Secondary actions: text link, overflow, or More tab.
- Avoid modals; use full-screen pages for create/edit flows; use bottom sheets for explainers.

---

## 2) Routes overview

### Public (unauth)
- `/welcome`
- `/u/:handle` (public profile)
- `handle.yachtie.link` (Pro custom subdomain — alias for `/u/:handle`)

### Auth + onboarding
- `/onboarding/name`
- `/onboarding/handle`
- `/onboarding/role`
- `/onboarding/yacht`
- `/onboarding/request-endorsements`
- `/onboarding/done`

### App (auth)
- `/app/profile`
- `/app/profile/photo`
- `/app/profile/settings` (contact info, visibility toggles)
- `/app/about/edit`
- `/app/attachment/new`
- `/app/attachment/:id/edit`
- `/app/certification/new`
- `/app/certification/:id/edit`
- `/app/cv`
- `/app/cv/upload`
- `/app/cv/pdf`
- `/app/insights`
- `/app/audience`
- `/app/more`
- `/app/more/settings`
- `/app/more/account`
- `/app/more/billing`
- `/app/endorsement/request?yacht_id=...`

### Recipient deep links
- `/r/:token` (endorsement request link)

---

## 3) Auth + Onboarding (exact screens)

### Screen W0 — Welcome (`/welcome`)
**Purpose**: choose auth method.
- Buttons (stacked): Continue with Apple / Google / Email
- Link: Sign in
Copy: "For yachting professionals."
**States**: loading, error toast.
**Email flow**: after email/password signup, show "Check your email to verify your account" screen. Account not active until verified.

---

### Screen O1 — Your name (`/onboarding/name`)
Fields:
- Full name (required)
- Preferred display name (optional)
Primary CTA: Continue (disabled until valid)

---

### Screen O2 — Claim your link (`/onboarding/handle`)
UI:
- Prefix: `yachtie.link/u/`
- Editable handle input with live status:
  - Available / Taken (+ 3 suggestion chips) / Invalid
- Suggestion logic when taken: append birth year, first initial + last name, logical variations of the requested handle
Handle rules:
- `a-z 0-9 -`, 3-30 chars, no leading/trailing hyphen, reserved words blocked.
Primary CTA: Claim link
Success: "Your page is live." + buttons: Continue (primary), View public page (secondary -> `/u/:handle`)

---

### Screen O3 — Department & Role (`/onboarding/role`)
Fields:
- Department: **multi-select** checkboxes. Options: Deck, Interior, Engineering, Galley, Medical, Admin/Purser, Land-based
- If multiple departments selected: primary department picker
- Role: typeahead from seeded list filtered by selected department(s). "Other" free-text input if no match
Primary CTA: Continue

---

### Screen O4 — Add your most recent yacht (`/onboarding/yacht`)
Fields:
- Yacht name typeahead + "Create new"
- If creating new yacht:
  - Yacht type: Motor Yacht / Sailing Yacht (required)
  - Length in metres (optional)
  - Flag state: country dropdown (optional)
  - Year built (optional — "Skip if you don't know")
- Role on yacht (defaults from O3)
- Dates: start (required), end or "Currently"
Primary CTA: Save yacht
Post-save: proceed to O5

---

### Screen O5 — Request endorsements (`/onboarding/request-endorsements`)
Sections:
1) Manual add: phone/email input -> chips

Copy (neutral):
- "We'll send a request linked to this yacht."
- "They can leave an endorsement after they add the same yacht to their profile too."
Primary CTA: Send requests (disabled until >= 1 recipient)
Secondary link: Skip

**Note:** Contacts import (native device API) deferred to native app. Not shown in webapp.

---

### Screen O6 — You're set (`/onboarding/done`)
Content:
- "Your page is live."
- Card: Profile setup X/5 + Endorsements 0/5 (neutral)
Buttons: Go to Profile (primary), View public page (secondary)

Onboarding rule:
- **No upsell anywhere** during onboarding.

---

## 4) Tab 1 — Profile (`/app/profile`) (default)

### Screen P0 — Profile home
Header: Title "Profile", Share icon on right

Top Identity card:
- Photo + edit
- Display name
- Role + department(s)
- Link row (`yachtie.link/u/:handle`) + copy icon
- QR code download button

Wheel A card:
- "Profile setup: n/5" (tap -> checklist sheet)
Checklist milestones (5):
1) Role set
2) >= 1 yacht attachment
3) Bio set
4) >= 1 certification record
5) Profile photo set

Sections (cards, order):
1) About
2) Yachts (reverse chronological)
3) Certifications
4) Endorsements (received)

Primary CTA (floating or bottom):
- If missing next setup item -> "Complete next step" (deep link)
- Else -> "Share profile"

**About**
- Empty: "Add a short bio." CTA: Edit About -> full-screen editor (500 chars)

**Yachts**
- Each attachment row: yacht name, role, dates, expand chevron
- Expand shows:
  - View yacht
  - Request endorsements from this yacht
  - Edit attachment
- Empty CTA: Add your first yacht

**Certifications**
- Each row: cert type, expiry date, expiry status indicator (valid / expiring soon / expired)
- Empty CTA: Add certification
- Add flow: hierarchical tree picker (category -> specific cert type, "Other" free-text), issued date, expiry date, optional document upload (PDF/JPEG/PNG)
- Document upload available to all users. Pro users get document manager (see Insights/Pro section)

**Endorsements**
- List: endorser name, yacht, date, excerpt
- Tap -> read-only detail screen

---

## 5) Tab 2 — CV (`/app/cv`) (public presentation)

### Screen C0 — Public page preview
Header: "CV", Share icon, PDF icon

Segment control:
- Public view (default)
- Edit profile (switches to Profile tab)

Public view renders exactly `/u/:handle` (view-only).

Actions card:
- Primary: Generate PDF snapshot
- Secondary: Upload CV
- Template selection: free template default, Pro templates locked with upgrade CTA
- QR code download button

If PDF exists:
- Primary becomes Download PDF
- Secondary: Regenerate PDF

### Screen C1 — Upload CV (`/app/cv/upload`)
- Upload file (PDF or DOCX)
- Processing indicator while LLM extracts data
- Review screen: pre-filled form with extracted fields (name, employment history, certifications, languages, location). User edits field by field before saving
- Show current file + Replace/Remove
- Rate limit: 3 parses/user/day. On limit: "You can try again tomorrow"
- On parse failure: "We couldn't extract data from this CV. You can enter your details manually." -> redirect to profile

---

## 6) Public profile page (`/u/:handle`) (view-only)

### Screen U0 — Public profile
Also accessible via `handle.yachtie.link` for Pro users.

Sections:
- Name + role + department(s)
- About
- Contact info (only fields user has toggled visible)
- Employment history (yachts)
- Certifications
- Endorsements received: endorser name, yacht, date, truncated excerpt — **collapsible** to expand and read full text

QR code: bottom-left corner of page

Relationship label (when viewing another user who you know):
- Colleague — Worked together on a yacht

Rules:
- No discovery rails, no browse/search users.
- No endorsement "quality" labels; counts can exist but must be neutral (prefer hide counts in Phase 1).
- Open Graph meta tags for link sharing (name, role, photo).

---

## 7) Tab 3 — Insights (`/app/insights`) (always upsell)

### Screen I0 — Insights (Free)
Teaser cards:
- Profile views
- PDF downloads
- Link shares
- Templates & watermark removal
- Certification document manager
Primary CTA: Upgrade to Pro

Pricing display: EUR 12/month or EUR 9/month billed annually

Rule:
- If onboarding not complete, do not show upgrade; redirect to Profile or show "Finish setup first" (no payment).

### Screen I1 — Insights (Pro)
- Profile views: time-series chart (last 7 days, 30 days, all time)
- PDF downloads: time-series chart
- Link shares: time-series chart
- Certification document manager link
- Cert expiry dashboard: upcoming expirations with alert dates

---

## 8) Tab 4 — Audience (`/app/audience`) (graph inbox)

### Screen A0 — Audience home
Header: "Audience"

Wheel B card:
- "Endorsements: n/5 added" (tap -> "Get endorsements" sheet)
Sheet CTA: Request endorsements from your most recent yacht

Segment control:
1) Endorsements
2) Colleagues

---

### Screen A1 — Endorsements inbox
Sections:
1) Requests received
- Row: requester name (or masked), yacht, date, status pill "Needs confirmation", CTA "Review"
2) Requests sent
- Row: recipient (name or masked), yacht, status (Pending/Accepted/Expired), actions (Resend/Cancel)
- Expired = 30 days with no response

Empty state:
- "No endorsement requests yet." CTA: Request endorsements

---

### Screen A2 — Colleagues
Sections:
1) Colleagues (worked together)
- List users who share >= 1 yacht attachment with you.

Row: name, shared yacht(s), relationship label, CTA: Write/Request endorsement (contextual)

Rule:
- This is not public discovery; this is derived from shared yacht attachments only.

---

## 9) Tab 5 — More (`/app/more`)

### Screen M0 — More
Sections:
- Settings (dark mode toggle, theme: light/dark/system)
- Account (edit name, handle, department, role)
- Contact Info (phone, WhatsApp, email, location — with per-field visibility toggles)
- Billing (current plan, upgrade/manage subscription, invoice history)
- Privacy (data export, account deletion)
- Help/Feedback
- Legal (Terms of Service, Privacy Policy)

---

## 10) Endorsement flows (exact)

### Screen E1 — Request endorsements from a specific yacht (`/app/endorsement/request?yacht_id=...`)
- Yacht fixed at top
- Suggested colleagues first (shared-yacht list)
- Manual add always available (phone/email -> chips)
- Copy shareable deep link button (for WhatsApp or other messaging)
Primary CTA: Send requests
Rate limit display: "X/10 requests remaining today" (or X/20 for Pro)

---

### Deep link entry (`/r/:token`)
If logged out -> auth -> return to request.

#### Screen E2 — Request details
Shows requester + yacht.
Primary CTA:
- If already attached to yacht -> Write endorsement
- Else -> Add yacht to continue
Secondary: Decline

#### Screen E3 — Add yacht (pre-filled)
- Yacht name locked (pre-filled from request)
- Yacht type, length, flag state, year built shown if already set (read-only)
- Role + dates required minimally
Primary CTA: Confirm yacht

#### Screen E4 — Write endorsement
Fields:
- Text (min 10, max 2000)
Optional structured:
- Your role / their role / worked together dates (prefill from attachment data)
Primary CTA: Submit

Success:
- "Endorsement sent." CTA back to Audience.

---

## 11) Responsive rules (engineering)

### 11.1 Breakpoints
- Mobile < 768px (default)
- Tablet 768-1024
- Desktop > 1024

### 11.2 Desktop adaptation
- Keep the same 5 areas; no new IA.
- Optional: tabs become left rail on desktop only if identical destinations.

### 11.3 Safe areas
- Respect iOS notch + bottom bar; tab bar must not overlap system UI.

---

## 12) Data/state requirements (to avoid lying UI)

### 12.1 Profile setup (Wheel A)
Computed milestones (5):
1) role present
2) >= 1 yacht attachment
3) bio non-empty
4) >= 1 certification record
5) photo set

UI:
- show `n/5`
- "Complete next step" deep links to first missing milestone in order.

### 12.2 Endorsements wheel (Wheel B)
- Count received endorsements where not deleted
- Display `min(count, 5)/5`

Neutral copy only:
- "Endorsements add context to your work history."

---

## 13) Monetisation placement (exact)

Allowed:
1) Insights tab (always upsell)
2) Template selection in CV tab (locked)
3) Watermark removal / cosmetic PDF settings (locked)
4) Certification document manager (locked for free, basic upload still available)

Not allowed:
- Upsell during onboarding
- Upsell inside endorsement request/write flows
- Anything that changes trust outcomes (ordering, visibility, eligibility, weighting)

---

## 14) Engineering acceptance checklist

- Sign up (with email verification for email accounts) -> claim handle -> `/u/:handle` works instantly.
- Onboarding includes: name, handle, department (multi-select), role, first yacht, first endorsement request.
- Endorsement deep link supports: auth -> yacht confirm -> endorsement write, gated by shared yacht attachment.
- Endorsement requests expire after 30 days.
- Profile tab edits drive Wheel A accurately.
- Audience tab drives Wheel B accurately and shows requests sent/received.
- CV tab renders public view and supports PDF snapshot (with QR code and top 3 endorsements) + upload CV (with pre-filled review form).
- Insights tab always upsells (but never blocks elsewhere, and never appears during onboarding).
- Pro subscription available monthly (EUR 12) and annual (EUR 9/month billed annually).
- Custom subdomain (`handle.yachtie.link`) works as alias for Pro users.
- Dark mode works across all screens.
- Contact info configurable with per-field visibility toggles.
- Certification tree picker allows narrowing by category.
- No discovery/search/feed. No reputation labels. No shame language.

---

## 15) Deferred features (Phase 2+)

The following were in v1.0 of this spec but are now deferred. Architecture should not make them harder to add later:

- **Timeline / Posts** — chronological feed of posts and milestones, network-bounded
- **Contacts** — messaging-only relationship type, non-graph
- **IRL Connections** — in-person encounter verification via QR, mutual confirmation
- **Messaging / Direct Messages** — between contacts
- **In-app notifications** — awaiting native app for push
- **Contacts import** — native device API, awaiting native app
- **Tag approval toggle** — relevant when Timeline ships

See `yl_features.md` Phase 2+ section for full descriptions.
