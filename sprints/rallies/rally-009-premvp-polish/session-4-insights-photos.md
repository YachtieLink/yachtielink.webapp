# Session 4 — Insights Layer 1 + Photo Unification + More Tab

**Rally:** 009 Pre-MVP Polish
**Status:** BLOCKED — needs /grill-me to resolve Insights privacy model + Photo UX decisions
**Estimated time:** ~8 hours across 2-3 workers
**Dependencies:** /grill-me session (Insights + Photo), Sessions 1-3 merged

---

## ⚠️ OPEN QUESTIONS — Must resolve in /grill-me before building

See `grill-me-prep.md` §4 (Insights) and §5 (Photo) for the full question list with recommendations.

**Critical decisions:**
1. Insights: Profile view retention window (GDPR) — 90 days? Configurable?
2. Insights: Free tier teaser — blurred real data or placeholder?
3. Photo: Work gallery location — within unified page or separate?
4. Photo: AI enhancement — which API? Ship without for MVP?
5. Photo: Pro contextual assignment UX — how does user pick which photo for which context?

---

## Lane 1: Insights Tab Layer 1 (Opus, high)

**Branch:** `feat/insights-layer1`
**Objective:** Transform Insights from sparse teaser cards into a real analytics dashboard. Move non-analytics features (cert manager, subscription) to More tab. Show real value to Pro users.

### Current State

- `app/(protected)/app/insights/page.tsx` (233 lines) — teaser cards (free), basic charts (pro)
- `components/insights/AnalyticsChart.tsx` (43 lines) — simple CSS bar chart
- `components/insights/UpgradeCTA.tsx` (131 lines) — founding member offer
- Data: `get_analytics_timeseries()` + `get_analytics_summary()` RPCs

### Target State

```
┌──────────────────────────────┐
│ Career Insights         coral│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Profile Views      ▲ 23%│ │  ← Sparkline + trend indicator
│ │ ████████▓▓ 47 this week │ │
│ └──────────────────────────┘ │
│ ┌────────────┐┌────────────┐ │
│ │ Downloads  ││ Shares     │ │  ← Side-by-side metric cards
│ │ 12 ▲ 8%   ││ 5 ▼ 2%    │ │
│ └────────────┘└────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Search Appearances    31 │ │  ← New metric (if tracking exists)
│ └──────────────────────────┘ │
│                              │
│ [7d] [30d] [All time]       │  ← Time range selector
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔒 Who Viewed You       │ │  ← Pro teaser for Layer 2
│ │ Upgrade to see who's    │ │
│ │ looking at your profile │ │
│ │ [Upgrade to Crew Pro]   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### Tasks

#### Task 1: Move Cert Manager + Subscription to More Tab

Remove from Insights page:
- Cert Document Manager card
- Crew Pro subscription/plan card

These move to More tab (Lane 3 handles receiving them).

**Files:**
- `app/(protected)/app/insights/page.tsx` — remove sections
- Cert manager component — identify and note for Lane 3

#### Task 2: Enhanced Analytics Cards

Replace current basic cards with richer metric components:

New component: `components/insights/MetricCard.tsx`
- Metric value (large number)
- Trend indicator (▲/▼ percentage vs previous period)
- Sparkline chart (7 data points for weekly, 30 for monthly)
- Coral accent color
- Responsive: full-width on mobile, 2-up grid where space allows

**Metrics to show (Layer 1):**
- Profile Views — already tracked via `record_profile_event('profile_view')`
- PDF Downloads — already tracked via `record_profile_event('pdf_download')`
- Link Shares — already tracked via `record_profile_event('link_share')`
- Search Appearances — check if tracked; if not, add tracking in public profile search results

#### Task 3: Time Range Selector

Enhance existing time range selector:
- Pill-style toggle: 7d | 30d | All time
- Affects all metric cards simultaneously
- Persist selection in URL search params (so back button preserves it)
- Default: 30d

#### Task 4: Free Tier Experience

Free users see:
- Profile views sparkline with blurred/grayed overlay
- Real count visible but no trend or details
- "Upgrade to Crew Pro to see detailed analytics" CTA
- Founding member pricing if applicable
- Teaser card for "Who Viewed You" (Layer 2, Pro only)

**Don't show fake data.** Show real aggregate count, blur the detail. Users trust real numbers.

#### Task 5: Coral Section Color

Apply coral wayfinding throughout:
- Page background: `var(--color-coral-50)`
- Metric card accents: `var(--color-coral-500)` for sparkline bars
- Trend positive: `var(--color-coral-700)`
- Headers: coral text accents
- Cards: `var(--color-surface)` base

**Allowed files:**
- `app/(protected)/app/insights/page.tsx` — rewrite
- `components/insights/MetricCard.tsx` — new
- `components/insights/AnalyticsChart.tsx` — enhance or replace
- `components/insights/UpgradeCTA.tsx` — update
- `components/insights/TimeRangeSelector.tsx` — new
- `lib/section-colors.ts` (read only)

**Forbidden files:**
- `supabase/migrations/*` — no schema changes for Layer 1 (use existing analytics RPCs)
- `app/api/*` — no new endpoints unless search appearance tracking needed

---

## Lane 2: Photo Management Unification (Opus, high)

**Branch:** `feat/unified-photos`
**Objective:** Merge 3 fragmented photo pages into one unified experience. One photo used everywhere with focal point control.

### Current State

- `/profile/photos/page.tsx` (368 lines) — grid upload, drag-reorder, focal point picker
- `/profile/gallery/page.tsx` (121 lines) — work gallery tied to yachts
- `/profile/photo/page.tsx` — may exist as a single-photo upload page
- `components/profile/FocalPointPicker.tsx` (82 lines) — interactive focal point
- Limits: Free 3 photos / Pro 15 photos

### Target State

One page: `/profile/photos/page.tsx` with two sections:

```
┌──────────────────────────────┐
│ Your Photos            teal  │
├──────────────────────────────┤
│ PROFILE PHOTO                │
│ ┌─────────────────────────┐  │
│ │ [Current photo]         │  │  ← Large preview
│ │                         │  │
│ │  ⊕ Set focal point     │  │
│ └─────────────────────────┘  │
│                              │
│ Preview:                     │
│ ┌───┐ ┌─────────┐ ┌────┐   │
│ │ ○ │ │ 16:9    │ │ □  │   │  ← 3-format live preview
│ │   │ │ Hero    │ │ CV │   │     (circle, wide, square)
│ └───┘ └─────────┘ └────┘   │
│                              │
│ [Upload new photo]           │
│                              │
│ ─────────────────────────── │
│                              │
│ WORK GALLERY                 │
│ ┌────┐ ┌────┐ ┌────┐       │  ← Drag-reorder grid
│ │    │ │    │ │ +  │       │
│ └────┘ └────┘ └────┘       │
│ 2/3 photos (Free)           │
│ [Upgrade for 15 photos]     │
└──────────────────────────────┘
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

**Free tier:** 1 profile photo, focal point editing.
**Pro tier:** Future — 3 photos with context assignment (not built in this session, just leave the architecture open).

#### Task 3: 3-Format Preview Component

New component: `components/profile/PhotoFormatPreview.tsx`
- Takes: photo URL, focal point coordinates (x%, y%)
- Renders 3 containers side by side:
  - Circle (64px diameter) — avatar use
  - 16:9 rectangle (160×90) — hero/OG use
  - Square (90×90) — CV/PDF use
- Each applies `object-position` based on focal point
- Updates live as focal point changes

#### Task 4: Work Gallery Section

Below profile photo: work gallery.
- Existing drag-reorder grid (from current photos page)
- Multi-file upload with progress
- Free: 3 photos / Pro: 15 photos limit display
- Remove yacht-tagging complexity for now (simplify)

#### Task 5: Migration (if needed)

If `user_photos` doesn't already have a `role` column:
```sql
ALTER TABLE public.user_photos ADD COLUMN role TEXT DEFAULT 'gallery';
```

Mark the first user photo as `role = 'profile'`, rest as `role = 'gallery'`.

**Check first** — if photos are already distinguished by order (first = profile), skip migration and use convention.

#### Task 6: Update Consumers

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
- `components/profile/PhotoGallery.tsx` — may refactor
- `components/profile/ProfileAvatar.tsx` — focal point
- `components/pdf/ProfilePdfDocument.tsx` — focal point
- Links/navigation pointing to old photo pages

**Forbidden files:**
- `components/public/*` — public profile photo display is a separate concern
- `middleware.ts`

---

## Lane 3: More Tab Completion (Sonnet, medium)

**Branch:** `chore/more-tab-final`
**Objective:** Receive Cert Manager + Subscription from Insights. Finalize More tab IA.

### Tasks

#### Task 1: Receive Cert Manager

Move the Cert Document Manager component from Insights to More tab under YOUR ACCOUNT or a new DOCUMENTS group.
- Component may need minor restyling (coral → sand accent)
- Keep all functionality intact

#### Task 2: Receive Subscription Card

Move the subscription/plan management from Insights to More tab.
- Place under BILLING group (already exists)
- Merge with existing plan display
- Ensure Stripe portal link still works

#### Task 3: Final IA

Complete the IA from Session 2 prep:
```
YOUR ACCOUNT
  Login & Security
  Cert Documents              ← NEW (from Insights)
  Data Export
  Delete Account

YOUR PROFILE
  Edit Profile & Contact
  Display Settings
  Visibility

BILLING
  Current Plan                ← ENHANCED (merged with Insights subscription)
  Manage Subscription         ← Stripe portal link

SAVED
  Saved Profiles

APP
  Appearance (coming soon)
  Feature Roadmap

LEGAL
  Terms of Service
  Privacy Policy

[SIGN OUT]
```

#### Task 4: Sand Section Color (if not done in Session 2)

Verify sand wayfinding is applied. If Session 2 Lane 3 already did this, skip.

**Allowed files:**
- `app/(protected)/app/more/page.tsx`
- Cert manager component (moved from insights)

**Forbidden files:** Everything else.

---

## Exit Criteria

- Insights tab shows real analytics with sparkline charts and trend indicators
- Free users see teaser with real aggregate data (not fake numbers)
- Pro users see detailed analytics with time range selector
- Cert Manager and Subscription no longer on Insights tab
- Photo management is one unified page with profile photo + gallery sections
- Focal point picker shows 3-format live preview
- All avatar/hero/CV consumers respect focal point
- More tab is complete with all items properly organized
- All three pages use correct section color wayfinding (coral, teal, sand)
