# Session 3 — Network Tab Phase 1 + Profile Page Redesign

**Rally:** 009 Pre-MVP Polish
**Status:** BLOCKED — needs /grill-me to resolve open design questions
**Estimated time:** ~8 hours across 2 Opus workers
**Dependencies:** /grill-me session (Network + Profile), Sessions 1-2 merged

---

## ⚠️ OPEN QUESTIONS — Must resolve in /grill-me before building

See `grill-me-prep.md` §2 (Network) and §3 (Profile) for the full question list with recommendations.

**Critical decisions that change the build plan:**
1. Network: Unified yacht-grouped view — accordion? expandable rows? flat list with headers?
2. Network: What does "0/5 endorsements" mean? Free tier limit? Goal?
3. Profile: Section groupings — is the 4-group model right? (About Me, Personal Details, Career, Media)
4. Profile: Sticky CTA format — floating button, bottom sheet, or banner?

---

## Lane 1: Network Tab Phase 1 (Opus, high)

**Branch:** `feat/network-phase1`
**Objective:** Transform the Network tab from 3 confusing flat-list tabs into a unified yacht-grouped view that immediately shows users their professional network graph.

### Current State

- `app/(protected)/app/network/page.tsx` (180 lines) — fetches data, renders `AudienceTabs`
- `components/audience/AudienceTabs.tsx` (570 lines) — 3-tab segment control: Endorsements, Colleagues, Yachts
- Sub-pages: `/network/saved` (98 lines), `/network/colleagues` (198 lines)
- Data: colleagues RPC, endorsements query, endorsement requests, yachts with search

### Target State

Replace the 3-tab structure with a single unified view:

```
┌─────────────────────────────┐
│ My Network                  │  ← Navy section color
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Endorsement Summary     │ │  ← X received, Y given, Z pending
│ │ [Request Endorsement]   │ │
│ └─────────────────────────┘ │
│                             │
│ ▼ M/Y Serenity (2024-2025) │  ← Yacht accordion, expandable
│   ├ John Smith ★ endorsed  │
│   ├ Jane Doe   ⏳ pending  │
│   └ Bob Wilson  [Request]  │
│                             │
│ ▼ S/Y Athena (2022-2024)   │
│   ├ Alice Chen ★ endorsed  │
│   └ Charlie Wu  [Request]  │
│                             │
│ ▶ M/Y Explorer (2020-2022) │  ← Collapsed by default (older)
│                             │
│ ┌─────────────────────────┐ │
│ │ 💡 Your yacht graph     │ │  ← Education card (dismissable)
│ │ shows connections built │ │
│ │ through shared vessels  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Tasks

#### Task 1: Endorsement Summary Card
New component: `components/network/EndorsementSummaryCard.tsx`
- Shows: endorsements received count, given count, pending requests count
- CTA: "Request Endorsement" button (links to endorsement request flow)
- Navy accent color
- Compact — 1-2 rows max

#### Task 2: Yacht-Grouped Unified View
New component: `components/network/NetworkUnifiedView.tsx`
- Replace `AudienceTabs.tsx` as the main network content
- Group colleagues by yacht (from attachments + shared yacht data)
- Each yacht section: yacht name (prefixed), date range, role badge
- Under each yacht: colleagues with endorsement status
  - ★ endorsed (mutual or received)
  - ⏳ pending request
  - [Request] — quick endorse CTA
- **Default state:** Most recent 2-3 yachts expanded, older collapsed
- **Empty yacht:** "No colleagues found for this yacht yet"

#### Task 3: Empty State Redesign
When user has zero yachts:
- Education card: "Add your first yacht to start building your network"
- Explain what the yacht graph is, why endorsements matter
- CTA: "Add Yacht" → yacht search/add flow

When user has yachts but zero endorsements:
- Yacht list shown (with colleagues if any)
- Prominent banner: "Get your first endorsement — it makes your profile stand out"
- CTA: "Request Endorsement"

#### Task 4: Pending Endorsement State
When endorsement requests are pending:
- Show pending count in summary card
- Under each colleague with pending request: "Requested {date}" with re-nudge option
- Don't let pending state feel like failure — frame as "in progress"

#### Task 5: Yachts Tab Preservation
The yacht search functionality (currently in Yachts tab) still needs a home.
- Option A: Keep as a section at the bottom of unified view ("Find a yacht")
- Option B: Move to a sub-page accessible from unified view
- **Decision needed in /grill-me**

#### Task 6: Clean Up AudienceTabs
After unified view is working:
- Remove or deprecate `AudienceTabs.tsx` (570 lines)
- Keep `ColleagueExplorer.tsx` as the full-page colleague list (accessed via "View all colleagues" link)
- Keep `/network/saved` as-is (separate sub-page)

**Allowed files:**
- `app/(protected)/app/network/page.tsx` — rewrite
- `components/audience/AudienceTabs.tsx` — deprecate/remove
- `components/network/NetworkUnifiedView.tsx` — new
- `components/network/EndorsementSummaryCard.tsx` — new
- `components/network/YachtAccordion.tsx` — new
- `components/network/NetworkEducationCard.tsx` — new
- `components/network/ColleagueExplorer.tsx` — minor updates if needed

**Forbidden files:**
- `supabase/migrations/*` — no schema changes
- `components/public/*` — public profile untouched
- `app/api/*` — no new endpoints

---

## Lane 2: Profile Page Redesign Issues 1-4 (Opus, high)

**Branch:** `feat/profile-redesign`
**Objective:** Make the profile page feel intentional and polished. Apply section color wayfinding, improve information hierarchy, fix empty states.

### Current State

- `app/(protected)/app/profile/page.tsx` (325 lines) — hero card, strength meter, 2-column section grid
- `components/profile/ProfileSectionGrid.tsx` (166 lines) — 2-column toggle grid
- `components/profile/ProfileHeroCard.tsx` (193 lines) — name, handle, role, sea time, share
- `components/profile/ProfileStrength.tsx` (74 lines) — progress ring + CTA

### Issue 1: Section Color Wayfinding (Teal)

Apply teal section color throughout the profile page:
- Page background: `var(--color-teal-50)`
- Icon accents: `var(--color-teal-700)` on section icons
- Edit affordances: teal text/underline for edit links
- Strength meter ring: teal fill
- Cards: `var(--color-surface)` with subtle teal border on active/expanded

**Files:** `app/(protected)/app/profile/page.tsx`, relevant component files

### Issue 2: Compact List (Replace 2-Column Grid)

Replace `ProfileSectionGrid` (2-column toggle grid) with a compact list layout:
- Single column, full width
- Each section: icon + label + completion indicator + chevron
- Expand on tap: shows section content inline (or navigates to edit page)
- Grouped under category headers (see Issue 4)

**Pattern:** Follow `page-layout.md` "compact lists with expand-on-tap for 4+ items"

**Files:** Replace `components/profile/ProfileSectionGrid.tsx` with new `ProfileSectionList.tsx`

### Issue 3: Empty State Reframing

Every empty section should use positive framing:
- "Add your first certification" (not "No certifications")
- "Tell your story" for empty bio (not "Bio not set")
- "Add a yacht to start building your graph" (not "No yachts")
- Each empty state has a clear CTA button

**Audit all sections:** bio, experience, certifications, endorsements, skills, hobbies, gallery, languages

**Files:** Individual section components under `components/profile/`

### Issue 4: Information Hierarchy (Grouped Sections)

Group profile sections under icon+label headers:

```
ABOUT ME
  Bio / Summary
  Skills
  Hobbies & Interests
  Languages

PERSONAL DETAILS
  Personal Information (DOB, country, etc.)
  Contact & Visibility
  CV Details (smoking, tattoos, visas, DL) — moved from CV tab

CAREER
  Yacht Experience
  Shore-side Experience (new from Session 2)
  Certifications
  Sea Time

MEDIA
  Profile Photo
  Work Gallery
```

Each group header: uppercase label, section icon, subtle separator.

**Files:**
- `app/(protected)/app/profile/page.tsx` — restructure layout
- New `components/profile/ProfileSectionGroup.tsx` — group wrapper component

### Bonus: Profile Strength Repositioning

Move `ProfileStrength` ring from below-fold to a prominent position:
- Option A: Inside the hero card (compact inline version)
- Option B: Sticky card that scrolls with page until complete
- **Decision needed in /grill-me**

**Allowed files:**
- `app/(protected)/app/profile/page.tsx` — restructure
- `components/profile/ProfileSectionGrid.tsx` → replace with `ProfileSectionList.tsx`
- `components/profile/ProfileSectionGroup.tsx` — new
- `components/profile/ProfileStrength.tsx` — may reposition
- `components/profile/ProfileHeroCard.tsx` — teal accents
- `components/profile/*Section.tsx` — empty state updates
- `components/profile/PersonalDetailsCard.tsx` — teal accents

**Forbidden files:**
- `supabase/migrations/*`
- `components/public/*` — public profile is separate work
- `app/api/*`

---

## Exit Criteria

- Network tab shows unified yacht-grouped view with endorsement summary
- Network empty states educate new users about the yacht graph
- Network tab uses navy section color throughout
- Profile page uses teal section color throughout
- Profile sections are in a compact list grouped by category
- All empty sections use positive framing with clear CTAs
- Profile page feels intentional and polished at 375px mobile width
- Both pages follow design system patterns (page-layout.md)
