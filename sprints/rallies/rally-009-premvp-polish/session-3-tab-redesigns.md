# Session 3 — Network Tab Phase 1 + Profile Page Redesign

**Rally:** 009 Pre-MVP Polish
**Status:** Ready (all grill-me decisions resolved)
**Estimated time:** ~8 hours across 2 Opus workers
**Dependencies:** Sessions 1-2 merged

**Grill-me decisions applied:** §2 (Q2.1–Q2.6), §3 (Q3.1–Q3.5), Network visual design (D1–D5), UX audit (UX1, UX2, UX4)
**Design reference:** `frontend-design-guide.md` — read before building. Promote to `docs/design-system/` before this session starts.

---

## Lane 1: Network Tab Phase 1 (Opus, high)

**Branch:** `feat/network-phase1`
**Objective:** Transform the Network tab from 3 confusing flat-list tabs into a unified yacht-grouped view with rich visual design matching Charlotte's public profile quality bar.

### Current State

- `app/(protected)/app/network/page.tsx` (180 lines) — fetches data, renders `AudienceTabs`
- `components/audience/AudienceTabs.tsx` (570 lines) — 3-tab segment control: Endorsements, Colleagues, Yachts
- Sub-pages: `/network/saved` (98 lines), `/network/colleagues` (198 lines)
- Data: colleagues RPC, endorsements query, endorsement requests, yachts with search

### Grill-Me Decisions (locked)

| Decision | Source |
|----------|--------|
| **Accordion layout, only 1 yacht expanded** (most recent) | Q2.1 |
| Endorsements → summary stat card at top. Colleagues → yacht-grouped accordion. Yachts → each accordion section IS the yacht + search at bottom. | Q2.2 |
| **Keep 0/5 fraction format** — goal-based CTA. Collapsed copy dynamic: "You have no endorsements yet" / "You have 1 endorsement" / etc. Expanded keeps fraction + motivational copy. | Q2.3 |
| Yacht name in accordion links to existing yacht detail page | Q2.4 |
| **Auto-discovery only** for colleagues. "Invite former crew" CTA per yacht section. | Q2.5 |
| Yacht search at **bottom of unified view** | Q2.6 |
| **Rich yacht mini cards** in accordion headers — name, type, size, photo | D1 |
| **Beautiful endorsement quote cards** inline for received endorsements | D2 |
| **Stat card** for endorsement summary — number-forward (X received, Y given, Z pending) | D3 |
| **Avatar circles** with initials fallback for colleague rows | D4 |
| **Full navy commitment** — same boldness as CV tab amber | D5 |
| **Rename "Endorse" to "Request"** everywhere | UX2 |
| **Move Saved Profiles** — bookmark icon in Network header → `/network/saved` sub-page | UX4 |
| **Ghost suggestions inline** within yacht groups, tagged "not on platform" | Q6.3 (from §6) |

### Target State

```
┌─────────────────────────────────┐
│ My Network                 navy │
│                           [🔖] │  ← Saved Profiles bookmark icon
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ENDORSEMENTS          0/5  │ │  Endorsement CTA card
│ │ You have no endorsements   │ │  Dynamic copy
│ │ yet                        │ │
│ │ ▸ Expand for details       │ │
│ │ [Request endorsement]      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚓ 3 received · 1 given    │ │  Endorsement summary (stat card)
│ │   2 pending                │ │  Number-forward, not quote-forward
│ └─────────────────────────────┘ │
│                                 │
│ ▼ M/Y Go (Nov 2025–Present)    │  ← Expanded (most recent ONLY)
│ ┌─────────────────────────────┐ │
│ │ [Photo]  M/Y Go             │ │  Rich yacht mini card (D1)
│ │          Motor Yacht · 45m  │ │  With photo if exists
│ │          Deckhand            │ │
│ │          4 colleagues        │ │
│ └─────────────────────────────┘ │
│ ┌───────────────────────────┐   │
│ │ [○] Olivia Chen           │   │  Colleague rows with avatars (D4)
│ │     Purser · ★ endorsed   │   │
│ │ [○] Kai Nakamura          │   │
│ │     ETO · [Request]       │   │  ← "Request" not "Endorse" (UX2)
│ │ [○] Not on platform       │   │
│ │     "Invite to join" →    │   │  Ghost suggestion inline (Q6.3)
│ └───────────────────────────┘   │
│ [Invite former crew →]          │  ← Per-yacht growth CTA (Q2.5)
│                                 │
│ ▶ Big Sky (May–Nov 2025)  4 crew│  ← Collapsed
│ ▶ TS Jade Wave (Apr 2025–) 3   │
│ ▶ Param Jamuna IV         2    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Find a yacht            │ │  Yacht search at bottom (Q2.6)
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Tasks

#### Task 1: Endorsement Summary Stat Card + CTA Card

**Stat card:** `components/network/EndorsementSummaryCard.tsx`
- Number-forward: X received, Y given, Z pending (D3)
- Navy accent color
- Compact — 1-2 rows max

**CTA card:** `components/network/EndorsementCTACard.tsx`
- Keep 0/5 fraction format (Q2.3)
- Collapsed: dynamic copy based on count ("You have no endorsements yet" / "You have 1 endorsement" / "You have 3 endorsements")
- Expandable: shows fraction + motivational copy ("Profiles with 5+ endorsements get 3x more attention")
- CTA: "Request endorsement" button
- Chevron rotates with `easeGentle` (200ms) per design guide animation standards

#### Task 2: Yacht-Grouped Unified View

New component: `components/network/NetworkUnifiedView.tsx`
- Replace `AudienceTabs.tsx` as the main network content
- Group colleagues by yacht (from attachments + shared yacht data)
- **Only most recent 1 yacht expanded by default** (Q2.1) — NOT 2-3
- Older yachts collapsed with colleague count badge

#### Task 3: Rich Yacht Accordion Headers (D1)

New component: `components/network/YachtAccordion.tsx`

Each accordion header is a rich yacht mini card:
```
[Photo]  M/Y Go
         Motor Yacht · 45m
         Deckhand · Nov 2025–Present
         4 colleagues
```
- Yacht photo if exists (rounded-xl, 64x64), fallback: anchor icon on navy-100 bg
- Name: `text-base font-semibold` — links to yacht detail page (Q2.4)
- Type + size: `text-sm text-secondary`
- Your role + dates: `text-sm`
- Colleague count badge
- Chevron rotates with `easeGentle`
- Touch target: full header row (minimum 44px height)

#### Task 4: Colleague Rows with Avatars (D4)

New component: `components/network/ColleagueRow.tsx`
```
[Avatar] Name                [CTA]
         Role · Yacht context
         Status indicator
```
- Avatar: 40px circle, initials fallback with navy-colored background
- Name: `text-sm font-semibold`
- Role + context: `text-xs text-secondary`
- Status: "★ endorsed" / "⏳ pending" / "not on platform"
- **CTA: "Request" button** (outline style) — NOT "Endorse" (UX2)

#### Task 5: Ghost Suggestions Inline (Q6.3)

Within each yacht group, ghost profiles appear inline:
- Tagged "not on platform" in `text-xs text-secondary`
- CTA: "Invite to join" → creates ghost profile + sends invite
- Not a separate section — mixed with on-platform colleagues

#### Task 6: "Invite Former Crew" CTA (Q2.5)

Per yacht section, below the colleague list:
- Text link: "Invite former crew →"
- Opens invite form (name + email/phone) or existing invite flow
- This is the growth engine — every invite is a signup funnel entry

#### Task 7: Saved Profiles Bookmark (UX4)

- Add bookmark icon (🔖) in Network page header, top-right
- Links to existing `/network/saved` sub-page
- Remove "Saved Profiles" from More tab

#### Task 8: Yacht Search at Bottom (Q2.6)

- "Find a yacht" search section at bottom of unified view
- Reuse existing yacht search component from old Yachts tab
- Simple, discoverable

#### Task 9: Empty States

**Zero yachts:**
- Benefit headline: "Add your first yacht to start building your network"
- Supporting copy: explains yacht graph, why endorsements matter
- CTA: "Add Yacht" → yacht search/add flow
- Navy-colored illustration/icon

**Yachts but zero endorsements:**
- Yacht list shown with colleagues
- Endorsement CTA card at top (0/5 with dynamic copy)
- Frame as opportunity, not absence

**Zero colleagues on a specific yacht:**
- "No colleagues found for this yacht yet"
- "Invite former crew →" CTA

#### Task 10: Navy Section Color (D5)

Full navy wayfinding throughout:
- Page background: `var(--color-navy-50)`
- Yacht accordion headers: navy accents
- Endorsement badges: navy
- Section header icons: `var(--color-navy-700)`
- Colleague accent: navy
- Loading spinner: navy
- Cards: `var(--color-surface)` base (per design guide — NOT navy backgrounds on cards)

#### Task 11: Clean Up AudienceTabs

After unified view is working:
- Remove `AudienceTabs.tsx` (570 lines)
- Keep `/network/saved` as-is (now accessed via bookmark icon)

**Allowed files:**
- `app/(protected)/app/network/page.tsx` — rewrite
- `components/audience/AudienceTabs.tsx` — remove
- `components/network/NetworkUnifiedView.tsx` — new
- `components/network/EndorsementSummaryCard.tsx` — new
- `components/network/EndorsementCTACard.tsx` — new
- `components/network/YachtAccordion.tsx` — new
- `components/network/ColleagueRow.tsx` — new
- `app/(protected)/app/more/page.tsx` — remove "Saved Profiles" row

**Forbidden files:**
- `supabase/migrations/*` — no schema changes
- `components/public/*` — public profile untouched
- `app/api/*` — no new endpoints

---

## Lane 2: Profile Page Redesign (Opus, high)

**Branch:** `feat/profile-redesign`
**Objective:** Make the profile page feel intentional and polished. Tap-to-edit hero, compact grouped list, teal wayfinding, positive empty states.

### Current State

- `app/(protected)/app/profile/page.tsx` (325 lines) — hero card, strength meter, 2-column section grid
- `components/profile/ProfileSectionGrid.tsx` (166 lines) — 2-column toggle grid
- `components/profile/ProfileHeroCard.tsx` (193 lines) — name, handle, role, sea time, share
- `components/profile/ProfileStrength.tsx` (74 lines) — progress ring + CTA

### Grill-Me Decisions (locked)

| Decision | Source |
|----------|--------|
| **4-group model:** ABOUT ME (Bio, Skills, Hobbies, Languages), PERSONAL DETAILS (Personal Info, Contact & Visibility, CV Details), CAREER (Yacht Experience, Shore-side Experience, Certifications, Sea Time), MEDIA (Profile Photo, Work Gallery) | Q3.1 |
| Sea time: **both** — summary in hero card, detailed breakdown in Career section | Q3.2 |
| Profile Strength: **compact ring inside hero card**, always visible | Q3.3 |
| Sticky CTA: **inside Profile Strength** area, CTA text changes by state | Q3.4 |
| **CV Details move to Profile** under Personal Details. CV tab becomes output-only. | Q3.5 |
| **Add tap-to-edit on hero card** for name/role. Remove "Edit profile & contact info" from More tab. | UX1 |

### Target State

```
┌─────────────────────────────────┐
│ My Profile                 teal │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [Photo / Add photo CTA]    │ │  Hero card
│ │                             │ │
│ │ Dev QA Account    [70%]    │ │  ← Name tappable to edit (UX1)
│ │ First Officer · 🇰🇷         │ │  ← Role tappable to edit (UX1)
│ │ 11y 4mo · 11 yachts       │ │  ← Sea time summary (Q3.2)
│ │ yachtie.link/u/dev-qa  📋 │ │
│ │                             │ │
│ │ Profile Strength: 70%      │ │  ← Ring inside hero (Q3.3)
│ │ "Add a photo to make it    │ │  ← CTA changes by state (Q3.4)
│ │  yours" → [Add photos]     │ │
│ │                             │ │
│ │ [Preview]  [Share Profile]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ABOUT ME                        │  ← 4 groups (Q3.1)
│ ├ Bio          "Experienced..." │  ← Compact list, expand on tap
│ ├ Skills       "47 skills"      │  ← Summary + chevron
│ ├ Hobbies      "Surfing +9"     │
│ └ Languages    "Korean, English"│
│                                 │
│ PERSONAL DETAILS                │
│ ├ Personal Info  "Age 30, 🇰🇷"  │
│ ├ Contact        "Phone, Email" │
│ └ CV Details     "Tattoos, DL"  │  ← Moved from CV tab (Q3.5)
│                                 │
│ CAREER                          │
│ ├ Experience   "11y · 11 yachts"│  ← Integrated timeline (Session 2)
│ ├ Certifications "10 certs"     │
│ └ Sea Time     "Breakdown →"    │  ← Detailed view (Q3.2)
│                                 │
│ MEDIA                           │
│ ├ Profile Photo  [thumbnail]    │
│ └ Work Gallery   "0 photos"     │
└─────────────────────────────────┘
```

### Tasks

#### Task 1: Tap-to-Edit Hero Card (UX1)

Update `ProfileHeroCard.tsx`:
- Name and role fields become tappable with pencil icon affordance
- On tap: inline text input with current value
- Small "Done" button or tap outside to save
- Optimistic update — value changes immediately
- Subtle save confirmation (checkmark fade)

#### Task 2: Profile Strength Inside Hero (Q3.3 + Q3.4)

Move `ProfileStrength` into the hero card:
- Compact ring next to name/handle area
- Always visible, not below fold
- CTA text changes based on state:
  - <50%: "Complete your profile"
  - 50-80%: context-specific ("Add a photo to make it yours")
  - >80%: "Share your profile"
- No floating buttons (Q3.4)

#### Task 3: Replace 2-Column Grid with Compact Grouped List

Replace `ProfileSectionGrid` (2-column toggle grid) with:
- Single column, full width
- 4 group headers: ABOUT ME, PERSONAL DETAILS, CAREER, MEDIA (Q3.1)
- Each group header: uppercase label + section icon (teal-700) + subtle separator
- Each section row: icon + label + summary text + chevron
- Expand on tap: shows section content inline with edit affordances
- **Visibility controls inline** within expanded sections — small eye icon + "Visible on public profile" label
- Allow multiple sections open (not exclusive)

**Section summary patterns:**
- Bio: First line of text, truncated
- Skills: Count ("47 skills") + first 3 as mini chips
- Experience: Sea time + yacht count
- Certifications: Count + expiry alert if any expiring
- Sea Time: "Breakdown →" link to detailed view

New components:
- `components/profile/ProfileSectionList.tsx` — replaces `ProfileSectionGrid.tsx`
- `components/profile/ProfileSectionGroup.tsx` — group wrapper with header

#### Task 4: CV Details Relocation (Q3.5)

Move CV Details (smoking preference, tattoo visibility, travel docs, driving license) from the CV tab to the Profile tab under PERSONAL DETAILS group.

- Add as a new section row: "CV Details" with summary (e.g., "Tattoos, DL, Non-smoker")
- Expands to show individual fields with edit capability
- Update CV tab to remove these fields (or leave as read-only with "Edit on Profile" link)

#### Task 5: Positive Empty States (UX3-adjacent)

Every empty section uses positive framing per design guide:
- "Add your first certification — captains search by certifications first"
- "Tell your story" for empty bio
- "Add a yacht to start building your graph"
- Section-colored illustration/icon
- One clear CTA button per empty state
- Never: "No certifications yet." Always: "Add certifications to get found by captains."

#### Task 6: Teal Section Color Wayfinding

Apply teal throughout:
- Page background: `var(--color-teal-50)`
- Group header icons: `var(--color-teal-700)`
- Edit affordances: teal text/underline
- Strength meter ring: teal fill
- Loading spinner: teal
- Cards: `var(--color-surface)` base (NOT teal background on cards)
- **No left border accent stripes on cards** — ever (founder hard reject)

#### Task 7: Remove "Edit Profile" from More Tab (UX1)

- Remove "Edit profile & contact info" row from More tab
- Profile tab inline edits + tap-to-edit hero are now the only path

**Allowed files:**
- `app/(protected)/app/profile/page.tsx` — restructure
- `components/profile/ProfileSectionGrid.tsx` → replace with `ProfileSectionList.tsx`
- `components/profile/ProfileSectionGroup.tsx` — new
- `components/profile/ProfileStrength.tsx` — reposition into hero
- `components/profile/ProfileHeroCard.tsx` — tap-to-edit + strength ring
- `components/profile/*Section.tsx` — empty state updates
- `app/(protected)/app/more/page.tsx` — remove "Edit profile" row
- CV tab page — remove CV Details section (or add "Edit on Profile" link)

**Forbidden files:**
- `supabase/migrations/*`
- `components/public/*` — public profile is separate work
- `app/api/*`

---

## Exit Criteria

- Network tab shows unified yacht-grouped accordion with **only 1 yacht expanded**
- Yacht accordion headers are **rich mini cards** with photo, type, size (D1)
- Endorsement summary is a **stat card** (number-forward) at top (D3)
- Endorsement CTA card uses **0/5 fraction** with dynamic collapsed copy (Q2.3)
- All "Endorse" buttons renamed to **"Request"** (UX2)
- Saved Profiles accessible via **bookmark icon** in Network header (UX4)
- Each yacht section has **"Invite former crew"** CTA (Q2.5)
- Ghost suggestions appear **inline** within yacht groups (Q6.3)
- Yacht search at **bottom** of unified view (Q2.6)
- Network tab uses **full navy wayfinding** (D5)
- Profile hero card has **tap-to-edit** on name/role (UX1)
- Profile Strength is a **compact ring inside hero card** (Q3.3)
- Profile sections use **4-group compact list** with expand-on-tap (Q3.1)
- CV Details relocated to Profile under Personal Details (Q3.5)
- "Edit profile" removed from More tab (UX1)
- All empty sections use **positive framing** with clear CTAs
- Profile page uses **teal wayfinding** throughout
- Both pages follow design system patterns and pass mobile UX at 375px
