# Sprint CV-Parse — Build Plan

> **Working doc** — updated as scope evolves. Last updated: 2026-03-23.

## Overview

This sprint does three things:
1. **Adds missing profile fields** to the platform (schema + UI + edit pages)
2. **Rewrites the CV parser** to extract everything a yachtie CV contains
3. **Builds the import wizard** that routes parsed data to the right places with user confirmation

Based on analysis of 9 real yachtie CVs across 8 crew (chefs, stewardesses — varied formats, 1-4 pages each). The current parser extracts ~25% of what's in a real CV.

---

## Part 1: New Profile Fields

### 1.1 — Schema Additions (users table)

These fields appear in nearly every yachtie CV and are standard in the industry. They don't exist in the schema today.

```sql
-- Migration: add_crew_profile_fields.sql

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS smoker text CHECK (smoker IN ('non_smoker', 'smoker', 'social_smoker')),
  ADD COLUMN IF NOT EXISTS tattoo_visibility text CHECK (tattoo_visibility IN ('none', 'visible', 'non_visible', 'not_specified')),
  ADD COLUMN IF NOT EXISTS visa_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS drivers_license text,
  ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]';

-- Visibility toggles for new fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS show_dob boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_nationality boolean DEFAULT true;

-- Column-level REVOKE on DOB (sensitive PII)
REVOKE SELECT (date_of_birth) ON public.users FROM anon;
```

**Field decisions:**

| Field | Type | Why | CV frequency | Show on public profile? |
|-------|------|-----|-------------|------------------------|
| `date_of_birth` | date | Age matters in hiring. Display as age, not DOB. | 6/8 | Age only, if `show_dob = true` |
| `nationality` | text | Visa/work implications. Industry standard. | 7/8 | Yes, as flag emoji |
| `smoker` | enum | Captains filter on this. Universal on CVs. | 5/8 | Yes, badge |
| `tattoo_visibility` | enum | Some programs care. Common on CVs. | 2/8 | Yes, if set |
| `visa_types` | text[] | B1/B2, Schengen, etc. Critical for work eligibility. | 5/8 | Yes, badges |
| `drivers_license` | text | Tender driving, errands. Industry standard. | 5/8 | Yes, if set |
| `languages` | jsonb | Array of `{language, proficiency}`. Currently extracted but never saved. | 8/8 | Yes |

**Fields we considered but rejected:**

| Field | Why not |
|-------|---------|
| `marital_status` | Privacy risk. Only 2/8 CVs. Not relevant to hiring. |
| `vaccination_status` | Was COVID-era. Fading relevance. Can add later. |
| `health_status` | Privacy risk. "Excellent Health" is generic. |
| `seaman_book` | Niche (1/8). Better as a certification entry. |

### 1.2 — Schema Additions (yachts table)

Every CV lists yacht builder. Our yachts table doesn't have it.

```sql
ALTER TABLE public.yachts
  ADD COLUMN IF NOT EXISTS builder text;
```

### 1.3 — Schema Additions (attachments table)

Employment entries in CVs carry more info than our schema captures.

```sql
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('permanent', 'seasonal', 'freelance', 'relief', 'temporary')),
  ADD COLUMN IF NOT EXISTS yacht_program text CHECK (yacht_program IN ('private', 'charter', 'private_charter')),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cruising_area text;
```

**Note:** `notes` already exists as a private field. `description` is the public-facing job description from the CV.

### 1.4 — Languages Design Decision

Languages need proficiency levels. Two options:

**Option A: JSONB on users** (recommended)
```json
[
  { "language": "English", "proficiency": "native" },
  { "language": "French", "proficiency": "intermediate" },
  { "language": "Spanish", "proficiency": "basic" }
]
```
Simple, no join needed, displays inline on profile.

**Option B: user_skills with category = 'language'**
Current plan in the build spec. Problem: `user_skills` has no proficiency column. Every CV lists proficiency ("Fluent", "Basic", "Native", "Conversational"). Losing this data loses value.

**Decision: Option A** — `users.languages` as JSONB. Proficiency enum: `native | fluent | intermediate | basic`.

---

## Part 2: The Two-Layer Model

There are two ways a captain sees a crew member:

1. **Profile page** — the visual presentation. Clean, scannable, personality-forward. "Who is this person?" in 3 seconds.
2. **Generated CV (PDF)** — the full professional document. Every detail a captain needs to make a hiring decision.

The profile page does NOT need to show smoker status, visa types, tattoo visibility, DOB, or driver's license. Those are **CV facts** — they belong in the traditional document format that captains expect when they download a CV.

This makes the profile cleaner and gives us a strong reason to generate a CV: "Your profile is your first impression. Your CV is the full picture."

### What lives where:

| Data | Profile page | Generated CV | Edit page |
|------|-------------|-------------|-----------|
| Photo, name, role | ✅ Hero | ✅ Header | Account settings |
| Nationality | ✅ Flag emoji in hero | ✅ Full text | Personal details |
| Sea time | ✅ Summary line | ✅ Calculated | Auto from attachments |
| Bio / About | ✅ Section | ✅ Section | About edit |
| Employment (yachts) | ✅ Name, role, dates | ✅ + builder, program, description, cruising area | Attachment edit |
| Endorsements | ✅ Full cards | ✅ Top 3 excerpts | Endorsement request |
| Certifications | ✅ Name + expiry | ✅ + issuing body, cert number | Cert edit |
| Education | ✅ Section | ✅ Section | Education edit |
| Skills | ✅ Chips | ✅ List | Skills edit |
| Hobbies | ✅ Chips | ✅ List | Hobbies edit |
| Languages | ✅ Chips in profile | ✅ With proficiency levels | Languages edit |
| Social links | ✅ Icons | ✅ URLs | Social links edit |
| Gallery | ✅ Grid | ❌ Not in PDF | Gallery edit |
| Date of birth | ❌ Not on profile | ✅ As age (e.g. "36 years old") | Personal details |
| Smoker status | ❌ Not on profile | ✅ "Non Smoker" | Personal details |
| Tattoo visibility | ❌ Not on profile | ✅ "No Visible Tattoos" | Personal details |
| Visa types | ❌ Not on profile | ✅ "B1/B2, Schengen" | Personal details |
| Driver's license | ❌ Not on profile | ✅ "Int'l License" | Personal details |
| Contact details | ✅ If toggled on | ✅ If toggled on | Contact settings |
| References | ❌ Never | ❌ Never (feeds endorsement system) | Via CV import only |
| Cruising areas | ❌ Not on profile | ✅ Per employment entry | Attachment edit |
| Job descriptions | ❌ Not on profile | ✅ Per employment entry | Attachment edit |
| Private/Charter | ❌ Not on profile | ✅ Per employment entry | Attachment edit |

### CV Preview — Critical Feature

The generated CV currently has NO preview. Users tap "Generate" and get a PDF opened in a new tab. There's no way to see how their data will look before sharing it.

**We need an in-app CV preview** so users can:
1. See their generated CV rendered in the app (not a PDF download)
2. Spot missing fields ("oh, I haven't added my smoker status")
3. Tweak data, see the preview update
4. Be confident before toggling "Make CV downloadable"

**Implementation:**

The preview renders the same `ProfilePdfDocument` component but as an **in-app view** rather than a downloaded PDF. Two approaches:

**Option A: HTML preview (recommended)**
- New component: `components/cv/CvPreview.tsx`
- Renders CV layout as HTML/Tailwind (not react-pdf)
- Matches the PDF layout visually but uses web rendering
- Fast, interactive, scrollable in-app
- Route: `/app/cv/preview` — server component fetches all CV data, renders preview
- "Download PDF" button generates the actual PDF from the same data

**Option B: PDF iframe**
- Generate PDF on the fly, embed as `<iframe src={signedUrl}>`
- Slower (needs full PDF generation before preview)
- Less interactive (PDF viewer, not native web)
- Better visual fidelity (exactly what the PDF looks like)

**Recommendation: Option A (HTML preview)** — faster, more interactive, and we can add "This field is empty" prompts inline to drive completion. The actual PDF download is a separate action.

**The preview component serves two audiences:**

1. **Owner** at `/app/cv/preview` — "Preview your CV before sharing"
2. **Viewer** on public profile `/u/[handle]` — "View CV" button renders it in-app

Same `CvPreview` component, two modes:

| | Owner mode | Viewer mode |
|---|---|---|
| Route | `/app/cv/preview` | `/u/[handle]/cv` or sheet/modal on public profile |
| Missing field prompts | ✅ "Add smoker status" with edit links | ❌ Hidden — viewer doesn't see gaps |
| "Edit" buttons | ✅ Per section | ❌ Hidden |
| "Download PDF" | ✅ Bottom action | ✅ Bottom action |
| Data source | Own profile data | Public profile data (respects visibility toggles) |

**Owner preview:**
```
┌─────────────────────────────────────┐
│  ← Preview Your CV                  │
│                                     │
│  CHRISTIAN ARNOLD                   │
│  Head Chef · British · 36           │
│  Antibes, France                    │
│  Non Smoker · B1/B2 · License       │
│  EN (native) · FR (basic)           │
│                                     │
│  ABOUT                              │
│  [bio text...]                      │
│                                     │
│  EXPERIENCE                         │
│  M/Y Amevi · 80m · Oceanco          │
│  Head Chef · Oct 2020 – Sep 2021    │
│  Private · Mediterranean             │
│  [description paragraph...]          │
│                                     │
│  CERTIFICATIONS                     │
│  ✅ STCW10 · Exp Jan 2027           │
│  ⚠️ ENG1 · Exp May 2025 (expired)  │
│                                     │
│  EDUCATION                          │
│  Le Cordon Bleu · Culinary Arts     │
│                                     │
│  ⚠ 2 fields could improve your CV  │
│  [+ Add driver's license]           │
│  [+ Add tattoo visibility]          │
│                                     │
│  [Edit Profile]  [Download PDF]     │
└─────────────────────────────────────┘
```

**Viewer experience on public profile:**

Currently the public profile has a "Download CV" link. Replace with two options:

```
┌─────────────────────────────────────┐
│  📄 CV                              │
│  [View CV]  [Download PDF ↓]        │
└─────────────────────────────────────┘
```

"View CV" → navigates to `/u/[handle]/cv` — a full-page render of the CV in the app. No PDF download required. The viewer reads the complete CV (with all the detail fields — smoker, visa, DOB as age, descriptions, cruising areas) right in their browser.

"Download PDF" → existing flow, downloads the actual PDF file.

**Why this matters on mobile:** A captain on their phone taps a YachtieLink link from WhatsApp. They see the profile (clean, visual). They tap "View CV" and get the full professional detail — all without downloading a PDF, leaving the browser, or needing a PDF viewer app. Frictionless.

**Public CV view route:** `app/(public)/u/[handle]/cv/page.tsx`
- Server component
- Only accessible if `cv_public = true` — returns 404 otherwise
- **Two render paths based on `cv_public_source`:**

| `cv_public_source` | What renders |
|---|---|
| `'generated'` | `CvPreview` in viewer mode — HTML render of all profile data |
| `'uploaded'` | Embedded PDF viewer — the user's own uploaded CV displayed inline (`<iframe>` or `<object>` with signed URL) |

- Back link → `/u/[handle]` (the profile)
- "Download PDF" button at the bottom (works for both — downloads the generated PDF or the uploaded file)

This respects the user's choice. If they've curated their own CV and prefer it, that's what the world sees. If they want the platform-generated version (which stays up to date as they edit their profile), they choose that instead. The owner controls which version is public from the CV & Sharing page — the existing `cv_public_source` toggle already handles this.

### PDF Template Updates

The current `ProfilePdfDocument.tsx` needs to include all the new fields:

**Currently rendered:**
- Header: name, role, departments, photo, handle URL
- About: bio
- Contact: email, phone, whatsapp, location (gated by show_*)
- Employment: role, dates, yacht name/type (length + flag fetched but NOT rendered)
- Certifications: name, expiry
- Endorsements: top 3 excerpts
- Footer: QR code, watermark

**Needs adding:**
- Header: nationality, age (from DOB)
- Personal details block: smoker, tattoo, visa types, license
- Languages with proficiency
- Employment: builder, private/charter, description, cruising area, length + flag (already fetched, just not rendered)
- Certifications: issuing body, issued date
- Education section (entirely missing from PDF)
- Skills section (entirely missing from PDF)
- Hobbies section (entirely missing from PDF)
- Social links (entirely missing from PDF)

---

## Part 2B: Profile Page Presentation

With CV-detail facts offloaded to the PDF, the profile page stays clean. Here are the specific changes needed.

### 2.1 — Current Layout (what exists today)

**Private profile** (`/app/profile` — `ProfilePage`):
```
Currently renders top to bottom:
1. Page title "My Profile"
2. Photo strip (72px thumbnails, horizontal scroll, + button)
3. ProfileHeroCard (56px photo, name, role, departments, handle URL, Preview/Share)
4. SocialLinksRow (if any)
5. ProfileStrength (score bar + next action CTA)
6. SeaTimeSummary (standalone card: "X years at sea · Y yachts")
7. ProfileSectionGrid (9 cards: About, Experience, Endorsements, Certs, Education, Hobbies, Skills, Photos, Gallery)
8. Empty state prompts (Hobbies, Skills, Gallery)
```

**Public profile** (`/u/[handle]` — `PublicProfileContent`):
```
MOBILE: HeroSection (full-bleed photo swiper, name/role/location/badges overlaid at bottom)
DESKTOP: 40% sticky photo panel left, 60% scrollable content right

Content order:
1. Contact info (email/phone/whatsapp — if visibility toggled on)
2. CV download (if cv_public)
3. About accordion (ai_summary or bio)
4. Sea time stat line ("⚓ 12y at sea · 10 yachts")
5. Experience accordion (● yacht name — role, dates, flag + length)
6. Endorsements accordion (EndorsementCards)
7. Certifications accordion (name + expiry status)
8. Education accordion (institution, qualification, dates)
9. Hobbies accordion (emoji chips)
10. Skills accordion (grouped by category, chips)
11. Gallery accordion (3-col grid)
12. Bottom CTAs
```

**Key components:**
| Component | File | What it does |
|-----------|------|-------------|
| `ProfileHeroCard` | `components/profile/ProfileHeroCard.tsx` | Private: 56px photo, name, role, departments, handle URL, edit/preview/share |
| `HeroSection` | `components/public/HeroSection.tsx` | Public mobile: full-bleed photo swiper, identity overlaid at bottom with gradient |
| Desktop hero panel | inline in `PublicProfileContent` | Sticky 40% left panel with photo + identity |
| `ProfileAccordion` | `components/profile/ProfileAccordion.tsx` | Each public section: title, summary line, expandable content |
| `ProfileSectionGrid` | `components/profile/ProfileSectionGrid.tsx` | Private: 9 cards with icon, label, summary, count, visibility toggle |
| `SeaTimeSummary` | `components/profile/SeaTimeSummary.tsx` | Standalone card showing sea time + yacht count |

### 2.2 — Changes to Private Profile (`/app/profile`)

**ProfileHeroCard** — add nationality flag + fold in sea time:

```
CURRENT:                              PROPOSED:
┌───────────────────────────┐         ┌───────────────────────────┐
│ [Photo] Christian Arnold  │         │ [Photo] Christian Arnold  │
│         Head Chef         │         │         Head Chef · 🇬🇧   │
│         Deck              │         │         Deck              │
│                           │         │         12y at sea · 10 🛥 │
│ yachtie.link/u/christian  │         │                           │
│ [Preview]  [Share]        │         │ yachtie.link/u/christian  │
└───────────────────────────┘         │ [Preview]  [Share]        │
                                      └───────────────────────────┘
```

Props to add to `ProfileHeroCard`:
- `nationality: string | null` → render flag emoji after primaryRole
- `seaTimeTotalDays: number` → render formatted sea time as a line below departments
- `seaTimeYachtCount: number` → "12y at sea · 10 yachts"

This replaces the standalone `SeaTimeSummary` card — one less card, tighter layout.

**New: Languages chip row** — if user has languages, show as compact chips between SocialLinksRow and ProfileStrength:

```
┌─────────────────────────────────────┐
│ 🗣 English (native) · French (basic)│
│                                     │
└─────────────────────────────────────┘
```

- Simple inline chip display — languages are presentation-worthy (unlike smoker/visa which go to PDF)
- Only renders if user has languages set
- Links to `/app/languages/edit`

**CV completeness prompt** — if new CV-detail fields are empty, show a prompt card:

```
┌─────────────────────────────────────┐
│ 📄 Your generated CV is missing     │
│    3 fields captains look for.      │
│    [Complete your CV details →]     │
└─────────────────────────────────────┘
```

- Links to personal details edit page
- Only shows if DOB, smoker, or visa are empty
- Disappears when all CV fields are filled

**Updated private profile render order:**
```
1. Page title "My Profile"
2. Photo strip (unchanged)
3. ProfileHeroCard (+ nationality flag, + sea time line)
4. SocialLinksRow (unchanged)
5. Languages chip row (NEW — if set)
6. ProfileStrength (unchanged)
7. CV completeness prompt (NEW — if CV fields missing)
8. ProfileSectionGrid (unchanged — 9 sections)
9. Empty state prompts (unchanged)

REMOVED: Standalone SeaTimeSummary card (folded into hero)
```

### 2.3 — Changes to Public Profile (`/u/[handle]`)

**HeroSection (mobile)** — add nationality + sea time to overlaid identity:

```
CURRENT:                              PROPOSED:
┌─────────────────────────┐           ┌─────────────────────────┐
│                         │           │                         │
│   [Full-bleed photo]    │           │   [Full-bleed photo]    │
│                         │           │                         │
│  ── gradient ──         │           │  ── gradient ──         │
│  🟢 Available           │           │  🟢 Available           │
│  Christian Arnold       │           │  Christian Arnold       │
│  Head Chef              │           │  Head Chef · 🇬🇧        │
│  Deck                   │           │  Deck                   │
│  📍 Antibes, France     │           │  📍 Antibes, France     │
│  [🤝 Colleague]        │           │  ⚓ 12y at sea · 10 yachts│
│                         │           │  [🤝 Colleague]        │
└─────────────────────────┘           └─────────────────────────┘
```

Props to add to `HeroSection`:
- `nationality: string | null` → flag emoji after primaryRole
- `seaTimeTotalDays: number` → stat line with anchor icon, same style as location line
- `seaTimeYachtCount: number`

**Desktop hero panel** — same additions. Nationality after role, sea time below location, within the overlaid identity block at bottom of the sticky photo panel.

**Languages on public profile** — compact display between CV download and About (only if set):

```
🗣 English (native) · French (basic) · Turkish (fluent)
```

- Simple inline text, not chips — keeps the public profile clean
- CV-detail fields (smoker, visa, tattoo, DOB, license) are NOT shown here — they're in the downloadable CV only

**Experience section** — enhanced attachment rendering:

```
CURRENT:                              PROPOSED:
● M/Y Amevi — Head Chef              ● M/Y Amevi — Head Chef
  Oct 2020 – Sep 2021                  Oct 2020 – Sep 2021
  🏳 Malta · 80m                       80m · Oceanco · Private · 🇲🇹
                                       ▸ Mediterranean, Maldives
                                       ▸ [tap to show description]
```

Changes to experience rendering in `PublicProfileContent`:
- **Line 3**: `{length}m · {builder} · {program} · {flag}` — builder is the key addition
- **Line 4**: `cruising_area` (if set) — subtle text, `text-xs text-secondary`
- **Tap to expand**: `description` shown in an expandable area below the entry (not a new page)
- These new fields come from `attachments` joined with `yachts` — the query already joins yachts

**Certifications section** — add issuing body:

```
CURRENT:                              PROPOSED:
STCW10        Valid until Jan 2027    STCW10        Valid until Jan 2027
                                      Romanian Naval Authority
```

- `issuing_body` shown as `text-xs text-secondary` below cert name (only when set)
- Expiry status coloring unchanged (already has green/amber/red)

**Updated public profile content order:**
```
1. Contact info (unchanged)
2. CV download (unchanged)
3. Languages line (NEW — if set, compact inline)
4. About accordion (unchanged)
5. Sea time stat line (REMOVED — now in hero)
6. Experience accordion (ENHANCED — builder, program, cruising area, expandable description)
7. Endorsements accordion (unchanged)
8. Certifications accordion (ENHANCED — issuing body line)
9. Education accordion (unchanged)
10. Hobbies accordion (unchanged)
11. Skills accordion (unchanged)
12. Gallery accordion (unchanged)
13. Bottom CTAs (unchanged)
```

**Note on sea time:** Currently a standalone `<p>` between About and Experience. With sea time now in the hero card/hero section, this standalone line becomes redundant. Remove it and let the hero carry this info.

### 2.4 — Component Change Summary

| Component | File | What changes |
|-----------|------|-------------|
| `ProfileHeroCard` | `components/profile/ProfileHeroCard.tsx` | Add `nationality`, `seaTimeTotalDays`, `seaTimeYachtCount` props. Render flag after role, sea time line below departments. |
| `HeroSection` | `components/public/HeroSection.tsx` | Add `nationality`, `seaTimeTotalDays`, `seaTimeYachtCount` props. Flag after role, sea time line below location. |
| `CvPreview` | `components/cv/CvPreview.tsx` | **NEW**. HTML CV render with two modes: owner (edit links + missing field prompts) and viewer (clean, no prompts). Used by both `/app/cv/preview` and `/u/[handle]/cv`. |
| `PublicProfileContent` | `components/public/PublicProfileContent.tsx` | Add languages line. Enhance experience entries (builder, program, cruising, description expand). Enhance cert entries (issuing body). Add new fields to `UserProfile` interface. Remove standalone sea time line. |
| `ProfilePage` | `app/(protected)/app/profile/page.tsx` | Fetch new user columns. Pass nationality + sea time to ProfileHeroCard. Add languages + CV completeness prompt. Remove standalone SeaTimeSummary. |
| `ProfilePdfDocument` | `components/pdf/ProfilePdfDocument.tsx` | Add all new fields: DOB/age, nationality, smoker, tattoo, visa, license, languages, education, skills, hobbies, builder, program, description, cruising area, issuing body. |
| Public profile page | `app/(public)/u/[handle]/page.tsx` | Fetch new user columns + attachment enrichment. Pass to PublicProfileContent. |

### 2.5 — What We Don't Change

- **ProfileSectionGrid** — unchanged. 9 section cards with counts + summaries. Works well for the private profile's edit-oriented layout.
- **ProfileAccordion** — unchanged. Expand/collapse pattern works for public sections.
- **Photo strip** — unchanged.
- **ProfileStrength** — unchanged for now. Later: add nationality + languages to strength calculation.
- **Section visibility toggles** — unchanged.
- **Endorsement/About/Education/Hobbies/Skills/Gallery sections** — content unchanged, just better populated by the CV parser.

### 2.6 — References (NOT on profile)

References are private. They feed into the endorsement system, not the public profile. The CV parser extracts them → offers to send endorsement requests → feeds ghost profiles. They're never displayed on any profile page.

---

## Part 3: Edit Pages for New Fields

### 3.1 — Personal Details Edit Page

**Extend existing:** `app/(protected)/app/profile/settings/page.tsx`

Add new fields to the settings page:

```
┌─────────────────────────────────────┐
│  ← Personal Details                │
│                                     │
│  Date of Birth  [DD/MM/YYYY      ] │
│  Nationality    [British         ▾] │
│  Smoker Status  [Non Smoker      ▾] │
│  Tattoo Vis.    [No Visible      ▾] │
│  Driver License [Int'l License   ] │
│                                     │
│  Visa / Passport                    │
│  [x] B1/B2  [ ] Schengen           │
│  [x] EU Citizen  [ ] Seaman's Book │
│                                     │
│  Visibility                         │
│  [x] Show age on public profile     │
│  [x] Show nationality               │
│                                     │
│  [Save]                             │
└─────────────────────────────────────┘
```

### 3.2 — Languages Edit Page

**New page:** `app/(protected)/app/languages/edit/page.tsx`

```
┌─────────────────────────────────────┐
│  ← Languages                        │
│                                     │
│  English        [Native          ▾] │
│  French         [Intermediate    ▾] │
│  Spanish        [Basic           ▾] │
│                                     │
│  [+ Add language]                   │
│                                     │
│  [Save]                             │
└─────────────────────────────────────┘
```

### 3.3 — Employment Detail Edit

**Extend existing:** `app/(protected)/app/attachment/[id]/edit/page.tsx`

Add: `employment_type` dropdown, `yacht_program` dropdown, `description` textarea, `cruising_area` text field.

### 3.4 — Yacht Builder

When creating a new yacht (during CV import or via YachtPicker "create new"), add a `builder` field.

---

## Part 4: CV Parser Rewrite

### 4.1 — New AI Extraction Prompt

The prompt needs to extract everything a yachtie CV contains. Based on 9 real CVs analyzed:

```
Extract ALL of the following from this yacht crew CV. Return ONLY valid JSON.

{
  "personal": {
    "full_name": "string or null",
    "primary_role": "string or null — most recent/main role",
    "bio": "string or null — professional summary/objective, max 500 chars",
    "phone": "string or null — include country code",
    "email": "string or null",
    "date_of_birth": "YYYY-MM-DD or null — parse any format",
    "nationality": "string or null — country name",
    "location_country": "string or null",
    "location_city": "string or null",
    "smoker": "non_smoker | smoker | social_smoker | null",
    "tattoo_visibility": "none | visible | non_visible | null",
    "drivers_license": "string or null — e.g. 'International Drivers License'",
    "visa_types": ["string — e.g. 'B1/B2', 'Schengen', 'EU Citizen'"],
    "marital_status": "string or null — extract if present but we may not store"
  },

  "languages": [
    {
      "language": "string",
      "proficiency": "native | fluent | intermediate | basic | null"
    }
  ],

  "employment_yacht": [
    {
      "yacht_name": "string — the primary name",
      "former_names": ["string — any names in parentheses, e.g. 'M/Y Anna I'"],
      "yacht_type": "motor | sailing | null",
      "length_meters": "number or null — convert feet to meters",
      "builder": "string or null — shipyard/manufacturer (Feadship, Benetti, etc.)",
      "flag_state": "string or null",
      "year_built": "number or null",
      "program": "private | charter | private_charter | null",
      "role": "string — job title",
      "employment_type": "permanent | seasonal | freelance | relief | temporary | null",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or 'Current' or null",
      "description": "string or null — the paragraph describing what they did",
      "crew_count": "number or null",
      "guest_capacity": "number or null",
      "cruising_area": "string or null — e.g. 'Mediterranean, Caribbean'"
    }
  ],

  "employment_land": [
    {
      "company_name": "string",
      "location": "string or null — city, country",
      "role": "string",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or null",
      "description": "string or null"
    }
  ],

  "certifications": [
    {
      "name": "string — cert name as written",
      "category": "Safety & Sea Survival | Medical | Navigation & Watchkeeping | Engineering | Hospitality & Service | Water Sports & Leisure | Regulatory & Flag State | Other | null",
      "issued_date": "YYYY-MM or YYYY or null",
      "expiry_date": "YYYY-MM or YYYY or null",
      "issuing_body": "string or null"
    }
  ],

  "education": [
    {
      "institution": "string",
      "qualification": "string or null",
      "field_of_study": "string or null",
      "location": "string or null",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or null"
    }
  ],

  "skills": ["string — professional skills, cuisine types, service skills"],

  "hobbies": ["string — only if explicitly listed in a hobbies/interests section"],

  "references": [
    {
      "name": "string",
      "role": "string or null — their role/title",
      "company_or_yacht": "string or null",
      "phone": "string or null",
      "email": "string or null"
    }
  ],

  "social_media": {
    "instagram": "string or null — handle only, no URL prefix",
    "website": "string or null"
  }
}

Rules:
- Yacht CVs often list vessels in reverse chronological order
- "M/Y" = Motor Yacht, "S/Y" = Sailing Yacht
- Length may be in feet — convert to metres (1 foot = 0.3048m), round to 1 decimal
- Dates may be approximate — use best available precision
- Separate yachting from land-based employment — they are different arrays
- Former yacht names appear in parentheses: "M/Y Firebird (M/Y Anna I)" → name: "Firebird", former_names: ["Anna I"]
- Builder/shipyard names: Feadship, Benetti, Lürssen, Oceanco, Sunseeker, etc.
- "Private/Charter" → program: "private_charter"
- Cuisine lists (e.g. "French, Italian, Thai") → extract as skills
- Cert expiry noted inline (e.g. "STCW10 - Exp. 01.26") → expiry_date: "2026-01"
- References: only extract if name AND at least one contact method (phone/email) are present
- "References available on request" → empty references array
- Return valid JSON only, no markdown code fences
```

### 4.2 — Parse-to-Profile Routing Map

Where each extracted field lands in the database:

| Extracted field | → Table.column | Notes |
|----------------|---------------|-------|
| `personal.full_name` | `users.full_name` | With overwrite protection |
| `personal.primary_role` | `users.primary_role` | With overwrite protection |
| `personal.bio` | `users.bio` | With overwrite protection |
| `personal.phone` | `users.phone` | With overwrite protection |
| `personal.email` | Skipped | User's auth email is canonical |
| `personal.date_of_birth` | `users.date_of_birth` | NEW column |
| `personal.nationality` | `users.nationality` | NEW column |
| `personal.location_country` | `users.location_country` | With overwrite protection |
| `personal.location_city` | `users.location_city` | With overwrite protection |
| `personal.smoker` | `users.smoker` | NEW column |
| `personal.tattoo_visibility` | `users.tattoo_visibility` | NEW column |
| `personal.drivers_license` | `users.drivers_license` | NEW column |
| `personal.visa_types` | `users.visa_types` | NEW column |
| `languages[]` | `users.languages` | NEW JSONB column |
| `employment_yacht[].yacht_name` | Matched via `search_yachts` → `yachts.id` | User confirms match |
| `employment_yacht[].builder` | `yachts.builder` | NEW column, set on create or update |
| `employment_yacht[].role` | `attachments.role_label` | User confirms |
| `employment_yacht[].start_date` | `attachments.started_at` | User confirms |
| `employment_yacht[].end_date` | `attachments.ended_at` | User confirms |
| `employment_yacht[].program` | `attachments.yacht_program` | NEW column |
| `employment_yacht[].employment_type` | `attachments.employment_type` | NEW column |
| `employment_yacht[].description` | `attachments.description` | NEW column |
| `employment_yacht[].cruising_area` | `attachments.cruising_area` | NEW column |
| `employment_land[]` | NOT stored (yet) | Show in wizard, skip save. Land employment is out of scope for Phase 1. Can add `land_experience` table later. |
| `certifications[]` | `certifications` table | Matched against `certification_types` |
| `certifications[].issuing_body` | `certifications.issuing_body` | Column exists, not currently populated |
| `education[]` | `user_education` table | Direct insert |
| `skills[]` | `user_skills` table | category = 'technical' or 'other' |
| `hobbies[]` | `user_hobbies` table | Direct insert |
| `references[]` | NOT stored | Fed into endorsement request flow. User opts in per reference. Feeds ghost profiles. |
| `social_media.instagram` | `users.social_links` | Appended to JSONB array |
| `social_media.website` | `users.social_links` | Appended to JSONB array |

### 4.3 — Land-Based Employment Decision

Real CVs mix yacht and shore careers. 7/8 CVs reviewed have significant land-based experience. For Phase 1, we **display land-based entries in the wizard** (so the user sees them) but **don't store them**. Reasons:

1. No `land_experience` table exists
2. The profile is yacht-focused — land experience is context, not the core product
3. Adding a full land-based employment system is scope creep
4. The user can always re-upload their CV later when we add land support

The wizard shows land entries as "We found these land-based positions. They won't be imported to your yacht profile." Clear expectation setting.

**Future:** Add `land_experience` table in Phase 1C or Phase 2. Many crew have 5-10 land entries that add credibility (Michelin kitchens, luxury chalets, etc.).

---

## Part 5: Import Wizard UX

### 5.1 — Design Philosophy

The wizard is a **fast-track tool, not the whole app.** Its job is to get the profile to ≥80% complete as fast as possible. The user confirms batches of pre-merged data — they don't fill out forms. Everything can be edited later from the normal app. A profile completer helps close out the remaining 20%.

**Four rules:**
1. **Show, don't ask.** Present the merged result as a card. "Looks good?" Yes/Edit.
2. **Never make them type.** If we didn't find something, don't show an empty input. Say "you can add this later" and move on.
3. **Never leave them wondering.** Every second has feedback. Parse runs while they review Step 1.
4. **The wizard is a fast-track, not the whole app.** Confirm and go. Edit everything later from the normal app.

### 5.2 — The Loading Solution

AI parsing takes 5-15 seconds.

1. Upload completes → "Build my profile" clicked
2. Parse request fires in background
3. **Immediately** show Step 1 with existing profile data as a confirm card
4. Staged progress messages: "Reading your CV..." → "Finding your experience..." → "Done!"
5. Parse completes → auto-merge with existing data → card updates → all steps ready
6. User never sees a blank loading screen

### 5.3 — Wizard Flow (5 Steps)

```
Step 0: Upload → choose path
  ├── "Just upload" → store file → done
  └── "Build my profile" → start parse in background → go to Step 1

Step 1: Your Details (shown IMMEDIATELY)
  - Confirm card: merged personal details, languages
  - "Looks good?" / "Edit details"
  - Empty fields not shown — add later from profile

Step 2: Your Experience (needs parse result)
  - Scrollable yacht cards: matched ✓, needs pick ?, new ✦, already on profile 🔗
  - Confirm all / edit individual / skip individual
  - Colleague discovery runs silently in background

Step 3: Qualifications (needs parse result)
  - Certs + Education on one screen
  - Cert matching with expiry warnings
  - "Looks good?" / "Edit certs"

Step 4: Skills & Interests (needs parse result)
  - Toggleable chips for skills + hobbies
  - Social media links
  - "Looks good?"

Step 5: Review & Import
  - Summary counts + endorsement request opt-in
  - "Import to my profile" → batch save → celebration screen
  - Celebration: completion %, stats, what's left
```

### 5.3 — Step 1: Personal Details (Immediate)

This step loads instantly because it uses the user's existing profile data + the new fields. The AI parse result populates any blanks when it arrives.

```
┌─────────────────────────────────────┐
│  ← Step 1 of 7                     │
│  Let's confirm your details         │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│                                     │
│  Full Name     [Christian Arnold  ] │
│  Primary Role  [Head Chef         ] │
│  Date of Birth [18 / 08 / 1988   ] │  ← NEW field
│  Nationality   [British          ▾] │  ← NEW field
│  Country       [France           ▾] │
│  City          [Antibes           ] │
│                                     │
│  ── Quick Facts ─────────────────── │
│                                     │
│  Smoker?       [Non Smoker       ▾] │
│  Visible       [No Visible       ▾] │
│  Tattoos?                           │
│  License       [Int'l License     ] │
│  Visa Types    [x] B1/B2           │
│                [x] Schengen         │
│                                     │
│  ── Languages ───────────────────── │
│                                     │
│  English   [Native           ▾] [✕] │
│  French    [Basic            ▾] [✕] │
│  [+ Add language]                   │
│                                     │
│  ⏳ Reading your CV...              │  ← if parse still running
│  ── or ──                           │
│  ✅ CV parsed! Next steps ready.    │  ← when parse completes
│                                     │
│            [Next →]                  │
└─────────────────────────────────────┘
```

When the parse result arrives, pre-fill any empty fields with extracted values. If a field is already filled (from the user's existing profile), show "CV says: [value]" as a hint — user can tap to replace.

### 5.4 — Step 2: Yachts & Employment

(Unchanged from previous build plan — see yacht matching UX above. Add builder field to the yacht card and the "create new" form.)

Enhanced yacht card shows builder:
```
┌─ Match found ──────────────────┐
│ 🛥 M/Y Amevi                   │
│ 80m · Oceanco · Private · 🇲🇹  │
│ [This is my yacht ✓]           │
└────────────────────────────────┘
```

When creating a new yacht, the form includes builder:
```
Name:    [M/Y Oxygen        ]
Type:    [Motor Yacht       ▾]
Length:  [43] m
Builder: [Baglietto          ]  ← NEW
Flag:    [Thailand           ]
```

### 5.5 — Steps 3-7

(Unchanged from previous build plan. Education, skills, hobbies, references, summary all work as previously spec'd.)

---

## Part 6: Current State Fixes

### 6.1 — Bug: CV Parse Fails from CV Tab

The CV upload/parse flow is reportedly broken from the CV tab. Investigate:
- `pdf-parse` bundler issue (was fixed in Sprint 11.1 — may not be deployed)
- Error path from CV tab vs direct upload page
- `serverExternalPackages: ['pdf-parse']` in `next.config.ts` — verify deployed

### 6.2 — Languages: Extracted But Never Saved

The current prompt extracts `languages[]` as strings. The current save function ignores them entirely. Fix:
- Prompt updated to extract `{language, proficiency}` objects
- Save function writes to `users.languages` JSONB column

### 6.3 — Cert Issuing Body: Column Exists, Never Populated

`certifications.issuing_body` exists in the schema. The parse prompt doesn't extract it. The edit page doesn't show it. Fix all three.

### 6.4 — Available for Work: No Edit UI

`users.available_for_work`, `available_from`, `available_notes` — schema columns with no edit page. Add to personal details settings.

---

## Part 7: Migration

```sql
-- 20260323000001_crew_profile_fields.sql

-- 1. Users: new personal detail fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS smoker text
    CHECK (smoker IN ('non_smoker', 'smoker', 'social_smoker')),
  ADD COLUMN IF NOT EXISTS tattoo_visibility text
    CHECK (tattoo_visibility IN ('none', 'visible', 'non_visible', 'not_specified')),
  ADD COLUMN IF NOT EXISTS visa_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS drivers_license text,
  ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS show_dob boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_nationality boolean DEFAULT true;

-- Column-level REVOKE on DOB (don't expose to anon)
REVOKE SELECT (date_of_birth) ON public.users FROM anon;

-- 2. Yachts: builder
ALTER TABLE public.yachts
  ADD COLUMN IF NOT EXISTS builder text;

-- 3. Attachments: richer employment data
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS employment_type text
    CHECK (employment_type IN ('permanent', 'seasonal', 'freelance', 'relief', 'temporary')),
  ADD COLUMN IF NOT EXISTS yacht_program text
    CHECK (yacht_program IN ('private', 'charter', 'private_charter')),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cruising_area text;

-- No new tables needed. All target tables exist.
```

---

## Part 8: Files to Create / Modify

### New Files
```
supabase/migrations/20260323000001_crew_profile_fields.sql
lib/cv/types.ts                             — shared types: parsed data, confirmed data, save stats
lib/cv/validate.ts                          — pre-flight text validation (fail early)
components/cv/CvImportWizard.tsx            — wizard shell, state management, parse trigger
components/cv/ConfirmCard.tsx               — confirm/edit card wrapper (the core UX pattern)
components/cv/ConflictInput.tsx             — input with amber conflict highlight + "was:" hint
components/cv/ChipSelect.tsx                — toggleable chip cloud for skills/hobbies
components/cv/steps/StepPersonal.tsx        — Step 1: personal details confirm card
components/cv/steps/StepExperience.tsx      — Step 2: yacht matching + confirm cards
components/cv/steps/StepQualifications.tsx  — Step 3: certs + education
components/cv/steps/StepExtras.tsx          — Step 4: skills, hobbies, social
components/cv/steps/StepReview.tsx          — Step 5: summary + endorsements + import + celebration
components/cv/CvPreview.tsx                 — HTML CV render (owner + viewer modes)
app/(protected)/app/cv/preview/page.tsx     — owner preview route
app/(public)/u/[handle]/cv/page.tsx         — public CV view route (viewer)
app/(protected)/app/languages/edit/page.tsx — language edit page
app/api/profile/languages/route.ts          — GET + PATCH for users.languages JSONB
```

### Modified Files
```
lib/cv/prompt.ts                    — complete rewrite of extraction prompt
lib/cv/save-parsed-cv-data.ts      — add saveConfirmedImport(), mark old @deprecated
app/api/cv/parse/route.ts          — pre-flight validation, retry, increased limits, .doc handling
components/cv/CvUploadClient.tsx    — two-button split (build profile / just upload)
app/(protected)/app/cv/review/page.tsx   — render wizard instead of old review
app/(protected)/app/profile/settings/page.tsx — add new personal fields
app/(protected)/app/attachment/[id]/edit/page.tsx — add employment_type, program, description
app/(protected)/app/profile/page.tsx      — add languages, CV prompt, remove SeaTimeSummary
components/pdf/ProfilePdfDocument.tsx     — add all new fields to PDF templates
components/cv/CvActions.tsx              — wire up preview button, add preview link
app/(public)/u/[handle]/page.tsx          — display new fields on public profile
components/public/PublicProfileContent.tsx — render new fields
components/yacht/YachtPicker.tsx           — builder field on create
```

---

## Part 9: Build Order

```
Wave 1: Schema + migration (no UI changes, safe to deploy)
  - Write and apply migration
  - Verify columns, constraints, DOB REVOKE

Wave 2: Edit pages for new fields (users can manually fill)
  - Personal details edit (DOB, nationality, smoker, tattoo, visa, license)
  - Language edit page + API route
  - Attachment edit (employment_type, program, description, cruising area)
  - Profile hero updates (nationality flag, sea time in hero)
  - Languages display on profile + public profile
  - CV completeness prompt on private profile

Wave 3: AI prompt rewrite + parse chain hardening
  - New extraction prompt (~40 fields)
  - Shared types file (lib/cv/types.ts)
  - Pre-flight text validation (fail early on bad files)
  - Retry logic (almost never fail)
  - max_tokens 8000, text limit 25K, timeout 30s
  - .doc error handling, response_format: json_object

Wave 4: Import wizard (5 steps, batch confirm UX)
  - ConfirmCard, ConflictInput, ChipSelect (merge components)
  - CvImportWizard shell (state + parse + navigation + sessionStorage)
  - StepPersonal (immediate render, auto-merge on parse complete)
  - StepExperience (yacht matching pipeline + confirm cards)
  - StepQualifications (certs + education on one screen)
  - StepExtras (skills/hobbies chips + social links)
  - StepReview (summary + endorsements + import + celebration)
  - CvUploadClient two-button split
  - Review page (fetch existing data, render wizard)

Wave 5: Save function + celebration
  - saveConfirmedImport() — batch writes, yacht creation
  - Deduplication for skills/hobbies
  - Profile completion % calculation for celebration screen
  - Partial failure resilience
  - Old saveParsedCvData marked @deprecated

Wave 6: PDF template + CV preview (both audiences)
  - Update ProfilePdfDocument with all new fields
  - Build CvPreview component (owner mode + viewer mode)
  - Build /app/cv/preview route (owner)
  - Build /u/[handle]/cv route (viewer — public, gated by cv_public)
  - Wire preview button in CvActions
  - Replace "Download CV" on public profile with "View CV" + "Download PDF"
  - Missing field prompts in owner preview

Wave 7: Verify + Review
  - Pre-flight validation testing (bad files fail fast)
  - Test with all 9 real CVs (target: ≥80% profile completion)
  - Wizard speed test (<60 seconds upload-to-celebration)
  - Mobile layout for all wizard steps
  - PDF output matches preview
  - /review before commit
```

---

## Part 10: Testing Checklist

### Schema
- [ ] Migration applies cleanly
- [ ] New columns accept valid values
- [ ] CHECK constraints reject invalid enum values
- [ ] DOB column-level REVOKE works (anon can't read)

### Edit Pages
- [ ] Personal details: all new fields save + load
- [ ] Languages: add/edit/remove with proficiency
- [ ] Attachment edit: employment_type, program, description save
- [ ] Languages display on private and public profile
- [ ] CV completeness prompt shows when CV fields missing
- [ ] CV completeness prompt hides when all fields filled

### CV Preview + PDF
- [ ] CV preview route renders at /app/cv/preview
- [ ] Preview shows all fields: personal details, employment (with builder/program/description), certs (with issuing body), education, skills, hobbies, languages
- [ ] Preview shows "missing" prompts for empty fields
- [ ] Preview matches PDF layout visually
- [ ] PDF includes all new fields (DOB as age, nationality, smoker, tattoo, visa, license)
- [ ] PDF includes education, skills, hobbies (currently missing)
- [ ] PDF includes builder, program, cruising area, description per employment
- [ ] PDF includes issuing body per cert
- [ ] PDF includes languages with proficiency
- [ ] Owner preview at /app/cv/preview shows edit links + missing prompts
- [ ] Viewer CV at /u/[handle]/cv renders generated CV when source = 'generated'
- [ ] Viewer CV at /u/[handle]/cv renders uploaded PDF when source = 'uploaded'
- [ ] Viewer CV returns 404 when cv_public is false
- [ ] Public profile "View CV" button works
- [ ] Public profile "Download PDF" button works
- [ ] Preview button in CvActions links to /app/cv/preview
- [ ] PDF download from preview works
- [ ] Mobile: viewer CV is scrollable and readable at 375px
- [ ] Public profile shows new fields respecting visibility toggles

### CV Parser
- [ ] Upload PDF → parse succeeds (fix current bug)
- [ ] Upload DOCX → parse succeeds
- [ ] All 9 test CVs extract correctly:
  - [ ] Alexandru Botez — skills, hobbies, languages, education, land-based
  - [ ] Christian Arnold (2023) — refs inline, yachting + land-based, DOB
  - [ ] Christian Arnold (2024) — same person, different format
  - [ ] Ece Pekcan — refs with yacht context, education, social
  - [ ] Nicholas Essex — social media, education with grades
  - [ ] Reann Elks — QR code CV, vaccination status
  - [ ] Tamara Fredriksen — heavy freelance, many short positions, refs
  - [ ] Clare McGuigan — 4-page CV, chalet experience, multi-school education
  - [ ] Krista Graham — 4-page CV, Michelin background, remote provisioning

### Import Wizard
- [ ] "Just upload" stores file, no parsing
- [ ] Step 1 loads immediately while parse runs in background
- [ ] Parse result populates Step 1 blanks when ready
- [ ] Step 2: yacht matching works with builder
- [ ] Step 2: create new yacht includes builder
- [ ] Step 2: colleague discovery finds overlapping crew
- [ ] Step 3: cert matching with issuing body
- [ ] Step 4: education entries saved
- [ ] Step 5: skills + hobbies saved
- [ ] Step 6: references → endorsement requests queued
- [ ] Step 7: summary accurate, batch save works
- [ ] Overwrite protection: existing data shows "Keep current" toggle
- [ ] Skip works on every step (skipped items not saved)
- [ ] Mobile layout: all steps usable at 375px
- [ ] Build passes, `/review` clean

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-CVP-01 | Add DOB, nationality, smoker, tattoo, visa, license to schema | Found in 5-7 of 8 real CVs. Industry standard for yachting hiring. |
| D-CVP-02 | Show age not DOB on public profile | Privacy — exact DOB is sensitive. Age is what captains need. |
| D-CVP-03 | Languages as JSONB on users, not user_skills | Proficiency level is critical. user_skills has no proficiency column. |
| D-CVP-04 | Add builder to yachts table | Every CV lists builder. "Feadship Chef" is a meaningful signal. |
| D-CVP-05 | Add employment_type, program, description, cruising_area to attachments | Enriches employment entries to CV-quality detail. |
| D-CVP-06 | Land-based employment: display in wizard, don't store (Phase 1) | No table exists. Profile is yacht-focused. Add storage later. |
| D-CVP-07 | References: extract for endorsement flow, don't store on profile | Privacy. References feed ghost profiles viral loop. |
| D-CVP-08 | Reject marital_status, vaccination_status from schema | Privacy risk. Low CV frequency. Not relevant to hiring decisions. |
| D-CVP-09 | Progressive reveal — Step 1 loads while parse runs | Eliminates dead loading screen. User is productive immediately. |
| D-CVP-10 | Nationality shown as flag emoji next to role | Compact, visual, industry standard. |
| D-CVP-11 | Two-layer model: profile = presentation, PDF = full detail | Profile stays clean and visual. CV-detail fields (smoker, visa, tattoo, DOB, license) belong in the document format captains expect. Gives a strong reason to generate a CV. |
| D-CVP-12 | HTML CV preview, not PDF iframe | Faster, interactive, can show missing field prompts inline. PDF download is a separate action. |
| D-CVP-13 | CV-detail fields not shown on profile page | Smoker, tattoo, visa, DOB, license are hiring-decision fields, not identity/presentation fields. They go in the downloadable CV only. |
| D-CVP-14 | Field-level merge UX for existing data conflicts | When user has existing data AND CV has different data, show both as radio options with edit capability. See `specs/merge-ux.md` for full spec. |
| D-CVP-15 | No "revert to CV" metadata stored | Once saved, we don't track whether a value came from CV or manual entry. Re-upload the CV to reimport. |
