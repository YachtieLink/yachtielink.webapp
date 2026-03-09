# Yachtielink — Mobile-First, Screen-Complete UX Spec for Engineering (PM Copy)
Version: v1.0 (2026-01-28)

This document defines **exact screens, routes, components, states, and rules** for a mobile-first web app (Safari-first). It is intended to be handed to engineering for implementation without ambiguity.

---

## 0) Product invariants (must always hold)

### 0.1 Navigation + experience
- **Mobile Safari first** (iPhone baseline). Responsive up to desktop without changing information architecture.
- **Single-column layouts** on mobile; sections as cards; one primary action per screen.
- No feeds. No “discover people”. Profiles are accessed via **direct link/QR/share**.

### 0.2 Trust + language
- No scoring, no rankings, no “trust levels”, no comparative language (“strong profile”, “highly endorsed”, etc.).
- Absence of endorsements must be **neutral** (no shame language, no red states).
- Paid features must be **presentation only** (templates, cosmetics, analytics), never affecting trust eligibility or endorsement weighting.

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
- **Header**: title left; optional icon buttons right (share/settings/notifications).
- **Bottom tab bar** (5 items) shown on all authenticated screens except full-screen flows.

### 1.2 Tabs (left → right)
1) Profile (default)  
2) CV  
3) Insights (Pro upsell)  
4) Audience  
5) More  

### 1.3 Core components
- **Card**: title, subtitle, body, optional primary CTA button, optional secondary text link, empty-state mode.
- **Progress Wheel**: small ring + label (tap → explainer sheet). Never implies trust judgement.
- **Overflow menu** (“•••”) for secondary actions.

### 1.4 Interaction rules
- One obvious primary CTA per screen.
- Secondary actions: text link, overflow, or More tab.
- Avoid modals; use full-screen pages for create/edit flows; use bottom sheets for explainers.

---

## 2) Routes overview

### Public (unauth)
- `/welcome`
- `/u/:handle` (public profile)

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
- `/app/about/edit`
- `/app/attachment/new`
- `/app/attachment/:id/edit`
- `/app/cv`
- `/app/cv/upload`
- `/app/cv/pdf`
- `/app/insights`
- `/app/audience`
- `/app/more`
- `/app/endorsement/request?yacht_id=...`

### Recipient deep links
- `/r/:token` (endorsement request link)

---

## 3) Auth + Onboarding (exact screens)

### Screen W0 — Welcome (`/welcome`)
**Purpose**: choose auth method.
- Buttons (stacked): Continue with Apple / Google / Email
- Link: Sign in
Copy: “For yachting professionals.”
**States**: loading, error toast.

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
Handle rules:
- `a-z 0-9 -`, 3–30 chars, no leading/trailing hyphen, reserved words blocked.
Primary CTA: Claim link
Success: “Your page is live.” + buttons: Continue (primary), View public page (secondary → `/u/:handle`)

---

### Screen O3 — Role (`/onboarding/role`)
Fields:
- Department: Deck / Interior / Engineering / Galley
- Role: typeahead
Primary CTA: Continue

---

### Screen O4 — Add your most recent yacht (`/onboarding/yacht`)
Fields:
- Yacht name typeahead + “Create new”
- Yacht type (optional)
- Role on yacht (defaults from O3)
- Dates: start (required), end or “Currently”
Primary CTA: Save yacht
Post-save: proceed to O5

---

### Screen O5 — Request endorsements (`/onboarding/request-endorsements`)
Sections:
1) Contacts import (optional permission) + multi-select list when granted
2) Manual add: phone/email input → chips
Copy (neutral):
- “We’ll send a request linked to this yacht.”
- “They can leave an endorsement after they add the same yacht to their profile too.”
Primary CTA: Send requests (disabled until ≥1 recipient)
Secondary link: Skip

---

### Screen O6 — You’re set (`/onboarding/done`)
Content:
- “Your page is live.”
- Card: Profile setup X/5 + Endorsements 0/5 (neutral)
Buttons: Go to Profile (primary), View public page (secondary)

Onboarding rule:
- **No upsell anywhere** during onboarding.

---

## 4) Tab 1 — Profile (`/app/profile`) (default)

### Screen P0 — Profile home
Header: Title “Profile”, Share icon on right

Top Identity card:
- Photo + edit
- Display name
- Role + department
- Link row (`yachtie.link/u/:handle`) + copy icon

Wheel A card:
- “Profile setup: n/5” (tap → checklist sheet)
Checklist milestones (5):
1) Role set  
2) ≥1 yacht attachment  
3) Bio set  
4) ≥1 certification record  
5) Profile photo set  

Sections (cards, order):
1) About  
2) Yachts (reverse chronological)  
3) Certifications  
4) Endorsements (received)  
5) Timeline  

Primary CTA (floating or bottom):
- If missing next setup item → “Complete next step” (deep link)
- Else → “Share profile”

**About**
- Empty: “Add a short bio.” CTA: Edit About → full-screen editor (500 chars)

**Yachts**
- Each attachment row: yacht name, role, dates, expand chevron
- Expand shows:
  - View yacht
  - Request endorsements from this yacht
  - Edit attachment
- Empty CTA: Add your first yacht

**Certifications**
- List type + expiry
- Empty CTA: Add certification
- Add flow: typeahead + issued/expiry; uploads optional (Phase 1 configurable)

**Endorsements**
- List: endorser name, yacht, date, excerpt
- Tap → read-only detail screen

**Timeline**
- Copy: “This timeline shows posts, interactions, and milestones shared within your network. Posts can be shared with Contacts. Interactions are visible only to Colleagues and IRL Connections (or participants if private).”
- Cards show type: Post / Interaction / Milestone
- Privacy badge:
  - Posts: “Only me” or “Network”
  - Interactions: “Public interaction” or “Private interaction”
- Interaction cards show participants list
- Right of exit action on interactions and tags:
  - “Remove yourself from this”
  - Helper: “Your name, comments, and photos will no longer appear to others.”

---

## 5) Tab 2 — CV (`/app/cv`) (public presentation)

### Screen C0 — Public page preview
Header: “CV”, Share icon, PDF icon

Segment control:
- Public view (default)
- Edit profile (switches to Profile tab)

Public view renders exactly `/u/:handle` (view-only).

Actions card:
- Primary: Generate PDF snapshot
- Secondary: Upload CV
- Template selection: locked if Pro (cosmetic only)

If PDF exists:
- Primary becomes Download PDF
- Secondary: Regenerate PDF

### Screen C1 — Upload CV (`/app/cv/upload`)
- Upload file
- Show current file + Replace/Remove

---

## 6) Public profile page (`/u/:handle`) (view-only)

### Screen U0 — Public profile
Sections:
- Name + role
- About
- Employment history (yachts)
- Certifications
- Endorsements (received)
- Timeline (only visible to network)

Relationship labels on profiles (when viewing another user):
- Colleague — Worked together on a yacht
- Met in person — Verified IRL
- Contact — Messaging only

Rules:
- No discovery rails, no browse/search users.
- No endorsement “quality” labels; counts can exist but must be neutral (prefer hide counts in Phase 1).

---

## 7) Tab 3 — Insights (`/app/insights`) (always upsell)

### Screen I0 — Insights (Free)
Teaser cards:
- Profile views
- PDF downloads
- Link shares
- Templates & watermark removal
Primary CTA: Upgrade to Pro

Rule:
- If onboarding not complete, do not show upgrade; redirect to Profile or show “Finish setup first” (no payment).

---

## 8) Tab 4 — Audience (`/app/audience`) (graph inbox)

### Screen A0 — Audience home
Header: “Audience”

Wheel B card:
- “Endorsements: n/5 added” (tap → “Get endorsements” sheet)
Sheet CTA: Request endorsements from your most recent yacht

Segment control:
1) Endorsements  
2) Contacts  
3) Colleagues + IRL  

---

### Screen A1 — Endorsements inbox
Sections:
1) Requests received
- Row: requester name (or masked), yacht, date, status pill “Needs confirmation”, CTA “Review”
2) Requests sent
- Row: recipient (name or masked), yacht, status (Pending/Accepted/Expired), actions (Resend/Cancel)

Empty state:
- “No endorsement requests yet.” CTA: Request endorsements

---

### Screen A2 — Contacts
Sections:
- Incoming requests (Accept/Decline)
- Outgoing requests (Cancel)
- Connected list (Remove via overflow)

Rule:
- Contacts do not enable endorsements by themselves.

Add Contact (CTA):
- Label: Add as Contact
- Helper: Message and stay in touch. Meet in person to create a verified IRL Connection.

---

### Screen A3 — Colleagues + IRL
Sections:
1) Colleagues (worked together)
- List users who share ≥1 yacht attachment with you.
2) Met in person (IRL)
- List users with confirmed IRL interactions.

Row: name, relationship label, CTA: Write/Request endorsement (contextual when colleague)

Rule:
- This is not public discovery; this is derived from shared yacht attachments only.

---

## 9) Tab 5 — More (`/app/more`)

### Screen M0 — More
Sections:
- Settings
- Account
- Billing
- Privacy
- Help/Feedback

No growth tools.

Settings → Tagging:
- Toggle: “Require approval before I’m tagged”
- Helper: “When enabled, tags must be approved before appearing on your timeline.”

---

## 10) Endorsement flows (exact)

### Screen E1 — Request endorsements from a specific yacht (`/app/endorsement/request?yacht_id=...`)
- Yacht fixed at top
- Suggested colleagues first (shared-yacht list)
- Contacts import optional
- Manual add always available
Primary CTA: Send requests

---

### Deep link entry (`/r/:token`)
If logged out → auth → return to request.

#### Screen E2 — Request details
Shows requester + yacht.
Primary CTA:
- If already attached to yacht → Write endorsement
- Else → Add yacht to continue
Secondary: Decline

#### Screen E3 — Add yacht (pre-filled)
- Yacht locked
- Role + dates required minimally
Primary CTA: Confirm yacht

#### Screen E4 — Write endorsement
Fields:
- Text (min 10, max 2000)
Optional structured:
- Your role / their role / worked together dates (prefill)
Primary CTA: Submit

Success:
- “Endorsement sent.” CTA back to Audience.

---

## 11) Interaction flows (IRL)

### Screen IR1 — Start interaction (`/app/interaction/new`)
- Choose visibility: Public interaction / Private interaction
  - Public interaction: Visible to people you know
  - Private interaction: Only visible to participants
- Generate QR (5-minute window)
- Participants list: Pending / Confirmed

### Screen IR2 — Confirm interaction (`/app/interaction/confirm`)
After QR scan + mutual confirm:
- “You’re now connected in real life”
- Helper: “This confirms you’ve met in person. It doesn’t imply you worked together.”

### Interaction removal (anywhere)
Action: “Remove yourself from this”
Helper: “Your name, comments, and photos will no longer appear to others.”

---

## 12) Responsive rules (engineering)

### 12.1 Breakpoints
- Mobile < 768px (default)
- Tablet 768–1024
- Desktop > 1024

### 12.2 Desktop adaptation
- Keep the same 5 areas; no new IA.
- Optional: tabs become left rail on desktop only if identical destinations.

### 12.3 Safe areas
- Respect iOS notch + bottom bar; tab bar must not overlap system UI.

---

## 13) Data/state requirements (to avoid lying UI)

### 13.1 Profile setup (Wheel A)
Computed milestones (5):
1) role present
2) ≥1 yacht attachment
3) bio non-empty
4) ≥1 certification record
5) photo set

UI:
- show `n/5`
- “Complete next step” deep links to first missing milestone in order.

### 13.2 Endorsements wheel (Wheel B)
- Count received endorsements where not deleted
- Display `min(count, 5)/5`

Neutral copy only:
- “Endorsements add context to your work history.”

---

## 14) Monetisation placement (exact)

Allowed:
1) Insights tab (always upsell)
2) Template selection in CV tab (locked)
3) Watermark removal / cosmetic PDF settings (locked)

Not allowed:
- Upsell during onboarding
- Upsell inside endorsement request/write flows
- Anything that changes trust outcomes (ordering, visibility, eligibility, weighting)

---

## 15) Engineering acceptance checklist

- Sign up → claim handle → `/u/:handle` works instantly.
- Onboarding includes: name, handle, role, first yacht, first endorsement request.
- Endorsement deep link supports: auth → yacht confirm → endorsement write, gated by shared yacht attachment.
- Profile tab edits drive Wheel A accurately.
- Audience tab drives Wheel B accurately and shows requests sent/received.
- CV tab renders public view and supports PDF snapshot + upload CV.
- Insights tab always upsells (but never blocks elsewhere, and never appears during onboarding).
- No discovery/search/feed. No reputation labels. No shame language.
