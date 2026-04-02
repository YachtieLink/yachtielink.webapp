# Session 4 — Insights Layer 1 + Photo Unification + CV Tab Redesign + Settings IA

**Rally:** 009 Pre-MVP Polish
**Status:** READY TO BUILD
**Estimated time:** ~10 hours across 2-3 workers
**Dependencies:** Sessions 1-3 merged
**Grill-me decisions applied:** §4 (Insights), §5 (Photos), UX3 (free insights), UX5 (CV re-parse confirmation)

---

## Lane 1: Insights Tab Layer 1 (Opus, high)

**Branch:** `feat/insights-layer1`
**Objective:** Transform Insights from sparse teaser cards into a real analytics dashboard. Move non-analytics features (cert manager, subscription) to Settings tab. Show real value to Pro users. Make free users feel valued from day one.

### Current State

- `app/(protected)/app/insights/page.tsx` (233 lines) — teaser cards (free), basic charts (pro)
- `components/insights/AnalyticsChart.tsx` (43 lines) — simple CSS bar chart
- `components/insights/UpgradeCTA.tsx` (131 lines) — founding member offer
- Data: `get_analytics_timeseries()` + `get_analytics_summary()` RPCs

### Target State — Pro User

```
┌─────────────────────────────────┐
│ Career Insights           coral │
├─────────────────────────────────┤
│ [7d]  [30d]  [All time]        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Profile Views       ▲ 23%  │ │  Hero metric — big, bold
│ │ ████████▓▓▓  449 this month│ │  Sparkline with coral fill
│ └─────────────────────────────┘ │
│                                 │
│ ┌────────────┐ ┌──────────────┐ │
│ │ Downloads  │ │ Shares       │ │  Side-by-side stat cards
│ │ 12  ▲ 8%  │ │ 5   ▼ 2%    │ │
│ └────────────┘ └──────────────┘ │
│ ┌────────────┐ ┌──────────────┐ │
│ │ Saves      │ │ Sources      │ │  NEW metrics (Q4 decisions)
│ │ 7  ▲ 40%  │ │ 60% direct   │ │
│ └────────────┘ └──────────────┘ │
│                                 │
│ WHO VIEWED YOU            Pro   │  NEW — pulled into Layer 1 (Q4.1)
│ ┌─────────────────────────────┐ │
│ │ James W. · Captain          │ │  Real viewer cards
│ │    Viewed 2 days ago       │ │
│ │ Charlotte B. · Ch Stew      │ │
│ │    Viewed 5 days ago       │ │
│ │ See all 12 viewers →       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Target State — Free User (UX3)

```
┌─────────────────────────────────┐
│ Career Insights           coral │
├─────────────────────────────────┤
│ YOUR PROFESSIONAL FOOTPRINT     │
│ ┌────────┐ ┌────────┐ ┌──────┐ │
│ │ 11y 4m │ │   11   │ │  10  │ │  Career snapshot (always non-zero)
│ │Sea Time│ │ Yachts │ │Certs │ │
│ └────────┘ └────────┘ └──────┘ │
│                                 │
│ PROFILE STRENGTH                │
│ ┌─────────────────────────────┐ │
│ │ 70% — Standing out         │ │  Coaching widget
│ │ Next: Add a profile photo  │ │
│ │ [Add photos]               │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│ │ Profile Views      ░░░░░  │ │  Blurred real analytics
│ │ ░░░░░░░░░░░  ░░░ this mo  │ │
│ │                             │ │
│ │ Downloads ░░  Shares ░░   │ │
│ │                             │ │
│ │ WHO VIEWED YOU              │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░   │ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ See who's viewing your     │ │  Upgrade CTA
│ │ profile and what's working │ │
│ │ [Upgrade to Crew Pro]      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Tasks

#### Task 1: Move Cert Manager + Subscription to Settings Tab

Remove from Insights page:
- Cert Document Manager card
- Crew Pro subscription/plan card

These move to Settings tab (Lane 3 handles receiving them).

**Files:**
- `app/(protected)/app/insights/page.tsx` — remove sections
- Cert manager component — identify and note for Lane 3

#### Task 2: Enhanced Analytics Cards + Dashboard Visual Upgrade

Replace current basic cards with richer metric components. "Make it look cooler" — bold coral wayfinding, sparklines with personality (grill-me NEW decision).

New component: `components/insights/MetricCard.tsx`
- Metric value (large number, `text-2xl font-bold`)
- Trend indicator (▲/▼ percentage vs previous period, green up / red down)
- Sparkline chart with coral fill (7 data points for weekly, 30 for monthly)
- Responsive: full-width on mobile, 2-up grid where space allows
- Label: `text-sm text-secondary`

**Metrics to show (Layer 1):**
- Profile Views — already tracked via `record_profile_event('profile_view')` — **hero metric** (large card, top position)
- PDF Downloads — already tracked via `record_profile_event('pdf_download')`
- Link Shares — already tracked via `record_profile_event('link_share')`
- Profile Saves — already tracked — **NEW** (grill-me decision). "X people saved your profile."
- View Source Breakdown — **NEW** (grill-me decision). Where views come from: direct link, public profile search, QR code.
- Search Appearances — check if tracked; if yes show, if no skip (Q4.3)

#### Task 3: Who Viewed You — Pro Feature (Q4.1 NEW)

Pulled from Layer 2 into Layer 1 as a Pro-only feature.

- Individual viewers: name, role, date — last 30 days
- Individual viewer data retained 30 days, aggregate forever
- Shown as a list of person rows below the metric cards
- "See all X viewers" progressive disclosure link
- Free users see blurred teaser of the section

New component: `components/insights/WhoViewedYou.tsx`

#### Task 4: Time Range Selector

Pill-style toggle: 7d | 30d | All time
- Affects all metric cards simultaneously
- Persist selection in URL search params (so back button preserves it)
- Default: 30d

#### Task 5: Free Tier Experience (UX3)

Free users see (top to bottom):
1. **Career snapshot stats** — sea time, yachts, certs (always non-zero after CV parse). These are real numbers the user earned. Three stat cards in a row.
2. **Profile Strength coaching widget** — percentage ring, next action CTA. Coaching that helps them improve.
3. **Blurred real analytics** — profile views, downloads, shares, saves, who viewed you. Real aggregate count visible but detail blurred. Honest approach builds trust and creates desire.
4. **Upgrade CTA** — "See who's viewing your profile and what's working" + [Upgrade to Crew Pro]. Founding member pricing if applicable.

The tab is useful from day one. No dead tab. No paywall wall.

#### Task 6: Coral Section Color + Visual Quality

Apply coral wayfinding throughout — same commitment as CV tab with amber:
- Page background: `var(--color-coral-50)`
- Metric card sparklines: `var(--color-coral-500)` fill
- Trend positive: green, trend negative: red
- Section headers: coral text accents
- Cards: `var(--color-surface)` base (never section-colored card bg)
- Loading skeleton: coral pulse animation
- Use section colors from `lib/section-colors.ts` — never hardcode hex

**Quality bar:** Compare output to Charlotte's public profile. Metrics should feel like achievements, charts should have personality. Not clinical.

**Allowed files:**
- `app/(protected)/app/insights/page.tsx` — rewrite
- `components/insights/MetricCard.tsx` — new
- `components/insights/WhoViewedYou.tsx` — new
- `components/insights/AnalyticsChart.tsx` — enhance or replace
- `components/insights/UpgradeCTA.tsx` — update
- `components/insights/TimeRangeSelector.tsx` — new
- `components/insights/CareerSnapshot.tsx` — new (free tier)
- `lib/section-colors.ts` (read only)

**Forbidden files:**
- `supabase/migrations/*` — no schema changes for Layer 1 (use existing analytics RPCs)
- `app/api/*` — no new endpoints unless search appearance tracking needed

---

## Lane 2: Photo Management Unification (Opus, high)

**Branch:** `feat/unified-photos`
**Objective:** Merge 3 fragmented photo pages into one unified experience. One photo used everywhere with focal point control. AI enhancement for Pro. Contextual photo assignment for Pro.

### Current State

- `/profile/photos/page.tsx` (368 lines) — grid upload, drag-reorder, focal point picker
- `/profile/gallery/page.tsx` (121 lines) — work gallery tied to yachts
- `/profile/photo/page.tsx` — may exist as a single-photo upload page
- `components/profile/FocalPointPicker.tsx` (82 lines) — interactive focal point
- Limits: Free 3 photos / Pro 15 photos

### Target State

One page: `/profile/photos/page.tsx` with profile photo section + work gallery section. Pro users get AI enhancement + contextual assignment.

```
┌──────────────────────────────────┐
│ Your Photos              teal    │
├──────────────────────────────────┤
│ PROFILE PHOTO                    │
│ ┌─────────────────────────────┐  │
│ │ [Current photo]             │  │  Large preview
│ │                             │  │
│ │  Set focal point            │  │
│ │  [Enhance] Pro              │  │  ← AI enhancement (Q5.2)
│ └─────────────────────────────┘  │
│                                  │
│ Preview:                         │
│ ┌───┐ ┌─────────┐ ┌────┐       │
│ │ ○ │ │ 16:9    │ │ □  │       │  3-format live preview
│ │   │ │ Hero    │ │ CV │       │  (circle, wide, square)
│ └───┘ └─────────┘ └────┘       │
│                                  │
│ CONTEXT ASSIGNMENT         Pro   │  ← Pro contextual (Q5.4)
│ ┌──────────┐┌──────────┐┌─────┐ │
│ │ Avatar   ││ Hero     ││ CV  │ │  3 labeled slots
│ │ [photo]  ││ [photo]  ││[ph] │ │  Click to assign
│ └──────────┘└──────────┘└─────┘ │
│ Free: 1 photo for all contexts   │
│                                  │
│ [Upload new photo]               │
│                                  │
│ ─────────────────────────────── │
│                                  │
│ WORK GALLERY                     │
│ ┌────┐ ┌────┐ ┌────┐           │  Drag-reorder grid
│ │    │ │    │ │ +  │           │
│ └────┘ └────┘ └────┘           │
│ 2/3 photos (Free)               │
│ [Upgrade for 15 photos]         │
└──────────────────────────────────┘
```

### Tasks

#### Task 1: Merge Pages

- Keep `/profile/photos/page.tsx` as the unified page
- Redirect `/profile/gallery/` → `/profile/photos/#gallery` (or remove route, update all links)
- Redirect `/profile/photo/` → `/profile/photos/` (if it exists)
- Update all navigation links that point to the old pages

#### Task 2: Profile Photo Section

Top of page: single profile photo management.
- Large preview of current photo
- Focal point picker button (opens existing `FocalPointPicker`)
- 3-format live preview below: circle (avatar), 16:9 (hero), square (CV)
- All three previews update in real-time as focal point moves
- Upload/replace button

**Free tier:** 1 profile photo, focal point editing, 1 photo for all contexts.
**Pro tier:** Multiple photos with contextual assignment (Task 4), AI enhancement (Task 5).

#### Task 3: 3-Format Preview Component

New component: `components/profile/PhotoFormatPreview.tsx`
- Takes: photo URL, focal point coordinates (x%, y%)
- Renders 3 containers side by side:
  - Circle (64px diameter) — avatar use
  - 16:9 rectangle (160x90) — hero/OG use
  - Square (90x90) — CV/PDF use
- Each applies `object-position` based on focal point
- Updates live as focal point changes

#### Task 4: Pro Contextual Photo Assignment (Q5.4 — included in MVP)

Pro users can assign different photos to different contexts. Context-first UX:

- 3 labeled slots: Avatar, Hero, CV
- Click a slot to assign a photo from their uploaded photos
- Visual: each slot shows the photo cropped to its aspect ratio
- Free users see the 3 slots but they all show the same photo with a note: "1 photo for all contexts. Upgrade for context-specific photos."

New component: `components/profile/ContextAssignment.tsx`

#### Task 5: AI Photo Enhancement (Q5.2 — included as Pro MVP feature)

One-tap "Enhance" button on any photo. Pro-only feature.

- Evaluate API integration (Claid.ai or similar)
- Button appears on profile photo and gallery photos
- Shows before/after preview
- User confirms before saving enhanced version
- Free users see the button grayed with Pro badge
- Brilliant upsell — tangible value users can see immediately

New component: `components/profile/PhotoEnhance.tsx`

#### Task 6: Work Gallery Section

Below profile photo: work gallery.
- Existing drag-reorder grid (from current photos page)
- Multi-file upload with progress
- Free: 3 photos / Pro: 15 photos limit display
- Remove yacht-tagging complexity for now (simplify)

#### Task 7: Migration — Explicit Backfill (Q5.5)

Explicit migration, not convention (decided by founder).

If `user_photos` doesn't already have a `role` column:
```sql
ALTER TABLE public.user_photos ADD COLUMN role TEXT DEFAULT 'gallery';
```

Run a backfill migration: mark the first user photo as `role = 'profile'`, rest as `role = 'gallery'`. Do not rely on sort order convention.

#### Task 8: Update Consumers

All places that display the user's avatar/photo need to use the focal point:
- `ProfileAvatar` or equivalent — apply `object-position: {focalX}% {focalY}%`
- `HeroSection.tsx` — already uses focal point (verify)
- `ProfilePdfDocument.tsx` — apply focal point to CV photo
- `components/nav/` — sidebar avatar
- OG image generation — if applicable

**Allowed files:**
- `app/(protected)/app/profile/photos/page.tsx` — rewrite
- `app/(protected)/app/profile/gallery/page.tsx` — remove or redirect
- `app/(protected)/app/profile/photo/page.tsx` — remove or redirect (if exists)
- `components/profile/FocalPointPicker.tsx` — enhance
- `components/profile/PhotoFormatPreview.tsx` — new
- `components/profile/ContextAssignment.tsx` — new
- `components/profile/PhotoEnhance.tsx` — new
- `components/profile/PhotoGallery.tsx` — may refactor
- `components/profile/ProfileAvatar.tsx` — focal point
- `components/pdf/ProfilePdfDocument.tsx` — focal point
- Links/navigation pointing to old photo pages

**Forbidden files:**
- `components/public/*` — public profile photo display is a separate concern
- `middleware.ts`

---

## Lane 3: CV Tab Redesign + Settings IA (Sonnet, medium)

**Branch:** `chore/cv-settings-final`
**Objective:** Make CV tab output-only (Q3.5). Receive Cert Manager + Subscription in Settings. Finalize Settings IA to match design guide.

### CV Tab Tasks

#### Task 1: CV Tab Becomes Output-Only (Q3.5)

CV tab is now a document hub — generate, preview, download, share. No data entry.

- Remove CV Details section (moved to Profile under Personal Details in Session 3)
- Remove any inline editing of experience/cert data
- CV is built from Profile data — make this clear with an education card

#### Task 2: Rename "Visitor Downloads" to "Sharing"

Per design guide: rename the download permission section.

- New label: "Sharing"
- New copy: "Who can download from your public profile?"
- Radio options: No download / YachtieLink CV / Your uploaded CV

#### Task 3: Education Card — Link to Profile

Add a card that helps users understand the output-only model:

```
┌─────────────────────────────┐
│ Your CV is built from your  │
│ profile. Edit your          │
│ experience and certs on the │
│ Profile tab.                │
│ [Go to Profile]             │
└─────────────────────────────┘
```

#### Task 4: Re-Parse Confirmation Dialog (UX5)

"Update from new CV" button must show a confirmation dialog before proceeding:

- Dialog text: "This will re-parse your CV and may overwrite edits you've made. Continue?"
- Two buttons: Cancel (default/safe) and Continue (destructive action)
- Amber warning treatment on the re-parse card: caution icon, clear copy about overwrite risk

#### Task 5: Template Picker — Collapse to Single Line

Per design guide: template picker is not a full radio group.

- Collapsed format: "Standard . Change" — single line
- Tap "Change" to expand picker inline
- Secondary UI element, not competing with primary actions

### Settings Tab Tasks

#### Task 6: Receive Cert Manager

Move the Cert Document Manager component from Insights to Settings tab under ACCOUNT group.
- Component may need minor restyling (coral accent to sand accent)
- Keep all functionality intact

#### Task 7: Receive Subscription Card

Move the subscription/plan management from Insights to Settings tab.
- Place under PLAN group
- Merge with existing plan display
- Show Pro value — not just what you're paying, but what you're getting
- Ensure Stripe portal link still works

#### Task 8: Settings IA — Match Design Guide

Update Settings page IA to match the design guide exactly. Five groups:

```
ACCOUNT
  Login & security           >
  Cert Documents             >   <- From Insights
  Data export (GDPR)         >   <- Renamed from "Download my data"

PLAN
  Crew Pro . Monthly         >
  Renews 1 Jan 2030
  Pro features: 3 photos,
  15 gallery, analytics,
  premium templates

APP
  Appearance (dark mode)     >
  Notifications (coming soon)

COMMUNITY
  Feature Roadmap & Ideas    >   <- BuddyBoss 3-tab pattern (§9)
  Report a problem           >

LEGAL
  Terms of Service           >
  Privacy Policy             >

Sign out                         <- Quiet text link

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
Delete my account            >   <- Isolated danger zone
```

**Removed rows:**
- "Edit profile & contact info" — removed entirely, Profile tab handles all editing (UX1, Session 3)
- "Saved Profiles" — moved to Network tab (UX4, Session 3)

**Added rows:**
- Cert Documents (from Insights)
- Feature Roadmap & Ideas under COMMUNITY (§9 decision — in-app, BuddyBoss 3-tab pattern)

**Renamed:**
- Tab label: "More" to "Settings"
- "Download my data" to "Data export (GDPR)"

#### Task 9: Sand Section Color (if not done in Session 2)

Verify sand wayfinding is applied throughout:
- Page background: `var(--color-sand-50)`
- Group header accents: sand
- Pro badges: sand accent
- Row accents: sand
- Mini profile card at top for user context
- Icons on every group header for visual wayfinding

**Allowed files:**
- `app/(protected)/app/more/page.tsx` — rewrite
- `app/(protected)/app/cv/page.tsx` — rewrite for output-only
- Cert manager component (moved from insights)
- Subscription component (moved from insights)

**Forbidden files:** Everything else.

---

## Exit Criteria

- Insights tab shows real analytics with sparkline charts and trend indicators
- "Who Viewed You" shows in Layer 1 as Pro feature with individual viewer cards
- Profile Saves and View Source Breakdown metrics are displayed
- Dashboard looks beautiful — bold coral, sparklines with personality, matches Charlotte quality bar
- Free users see career snapshot (sea time/yachts/certs) + Profile Strength coaching + blurred real analytics
- Free Insights tab is useful from day one — no dead tab
- Cert Manager and Subscription no longer on Insights tab
- Photo management is one unified page with profile photo + gallery sections
- AI photo enhancement available as Pro feature with one-tap enhance
- Pro contextual photo assignment works with 3 labeled slots (Avatar, Hero, CV)
- Photo migration uses explicit backfill (not convention)
- Focal point picker shows 3-format live preview
- All avatar/hero/CV consumers respect focal point
- CV tab is output-only — no data entry, education card links to Profile
- "Visitor Downloads" renamed to "Sharing"
- Re-parse shows confirmation dialog before proceeding
- Template picker collapsed to single line
- Settings IA uses 5 groups: Account, Plan, App, Community, Legal
- "Edit profile" and "Saved Profiles" removed from Settings
- Feature Roadmap under Community section
- All three pages use correct section color wayfinding (coral, teal, sand)
