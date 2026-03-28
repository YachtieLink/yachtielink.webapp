# Sprint 11b — Portfolio Mode

**Goal:** Ship the default free-tier presentation. Portfolio mode renders the same data as Profile mode but with polished visual hierarchy, scrim/accent rendering, a view-mode toggle, and a mini bento gallery at the bottom. Every free profile looks premium.

**Estimated effort:** 2-3 days
**Depends on:** Sprint 11a complete (layout, settings schema, sub-page skeletons)

---

## Pre-Flight

- [ ] Sprint 11a merged to main, `npm run build` zero errors
- [ ] Confirm migration columns exist: `profile_view_mode`, `scrim_preset`, `accent_color`, `focal_x`, `focal_y`
- [ ] Confirm display settings API exists: `app/api/profile/display-settings/route.ts`
- [ ] Branch from main: `sprint-11b/portfolio-mode`

---

## Part 0: Query + Type Prerequisites (30 min)

**What changes:**
Sprint 11a adds the display settings columns to the DB and builds the settings API, but does NOT update `getUserByHandle` to return them. Without this, no scrim/accent/view-mode rendering works. This step must complete before anything else in 11b.

**Files:**

### `lib/queries/profile.ts`
- Add `profile_view_mode, scrim_preset, accent_color` to the `getUserByHandle` select string
- Add `focal_x, focal_y` to the `user_photos` select in `getExtendedProfileSections`

### `lib/queries/types.ts`
- Add to the user profile type (wherever `getUserByHandle` return is typed):
  - `profile_view_mode: 'profile' | 'portfolio' | 'rich_portfolio'`
  - `scrim_preset: 'dark' | 'light' | 'teal' | 'warm'`
  - `accent_color: string`
- Add to `ProfilePhoto` type: `focal_x: number; focal_y: number`

### `components/public/PublicProfileContent.tsx`
- Add these fields to the component's user prop interface

**Verify:** `npm run build` — no type errors with the new fields

---

## Part 1: View Mode Toggle (1-2 hours)

**What changes:**
A two-state toggle in the hero area lets viewers switch between the owner's default mode and Profile mode. The toggle scrolls away with the hero — it's presentation context, not navigation.

**Files:**

### New: `components/public/ViewModeToggle.tsx`
```
Props: {
  ownerDefault: 'portfolio' | 'rich_portfolio'
  activeMode: 'profile' | 'portfolio' | 'rich_portfolio'
  onChange: (mode: string) => void
}
```
- Two-segment pill toggle: `Profile` | `Portfolio` (or `Rich Portfolio` for Pro)
- Compact — sits in the hero info area below name/role, above the fold
- Subtle styling: semi-transparent background, current mode highlighted
- Uses accent colour for the active indicator

### `components/public/HeroSection.tsx`
- Accept `viewModeToggle?: React.ReactNode` prop
- Render toggle below the location/sea-time line, above the scrim fade-out
- Toggle inherits scrim readability (white text on dark scrim, dark text on light)

### New: `components/public/PublicProfileShell.tsx` (client component)
```
'use client'
Props: {
  defaultViewMode: 'profile' | 'portfolio' | 'rich_portfolio'
  ownerDefault: 'portfolio' | 'rich_portfolio'
  children: (activeMode: string) => React.ReactNode
}
```
- Manages `useState` for `activeMode`, initialised to `defaultViewMode`
- Renders the `ViewModeToggle` and passes it to `HeroSection`
- Calls `children(activeMode)` — the render-prop pattern keeps layout selection in the server component
- **Why a wrapper:** `PublicProfileContent` is currently a React Server Component. Adding `useState` directly would convert it (and all children) to client-side, losing SSR benefits on the profile page. This shell manages only the interactive toggle state.
- **Pre-build check:** Verify during build whether `PublicProfileContent` already has a `'use client'` directive. If it's already a client component, skip creating this wrapper — just add `useState` directly and remove the unnecessary indirection.

### `components/public/PublicProfileContent.tsx` (stays server component)
- Wrap content in `<PublicProfileShell>` render prop
- Conditionally render Portfolio vs Profile layout based on the `activeMode` passed down
- When `activeMode === 'profile'`: render current 11a layout (single-column editorial)
- When `activeMode === 'portfolio'`: render Portfolio layout (Part 2 below)

### `app/(public)/u/[handle]/page.tsx` + subdomain equivalent
- `profile_view_mode` now available from `getUserByHandle` (Part 0 prerequisite)
- Pass to `PublicProfileContent` as `defaultViewMode`

**NOT changed:**
- Own-profile view (`/app/profile`) — no toggle, separate component
- Settings page — already built in 11a

---

## Part 2: Portfolio Layout Shell (2-3 hours)

**What changes:**
Portfolio mode uses the same data and sections as Profile mode but with a different visual treatment. Sections are visually separated cards rather than accordion-style blocks. The gallery moves from inline to a dedicated mini bento at the bottom.

**Files:**

### New: `components/public/layouts/PortfolioLayout.tsx`
```
Props: {
  user: PublicProfileUser
  attachments: PublicAttachment[]
  certifications: PublicCertification[]
  endorsements: PublicEndorsement[]
  education: Education[]
  skills: Skill[]
  hobbies: string[]
  profilePhotos: ProfilePhoto[]
  accentColor: string
  handle: string
}
```
**Note:** Uses the same individual array props that `PublicProfileContent` already receives — `PublicAttachment`, `PublicCertification`, `PublicEndorsement`, `Education`, `Skill`, `ProfilePhoto` from `lib/queries/types.ts`. Do NOT create a `PublicProfileSections` aggregate type — pass arrays individually to match the existing data flow.
- Single-column, max-width ~680px (same as Profile mode — consistent frame)
- Renders sections as **spaced cards** with subtle backgrounds, not accordion borders
- Section order follows spec: About → Experience → Certifications → Endorsements → Education → Skills/Languages → Hobbies → Mini Bento Gallery
- Each section card: `rounded-xl bg-white/80 p-6` with generous vertical spacing between cards (`space-y-6`)
- **No `dark:` variants** — the public profile is always light mode (dark mode is app chrome only, per design spec). Do not add `dark:bg-*` to any profile presentation component.
- Section headings: same DM Sans uppercase style from 11a, with section icons
- "See all" links on Experience (at 4+), Education (at 3+), Endorsements (always)
- **Note:** 11a creates sub-page skeletons for `/endorsements`, `/experience`, `/certifications`, and `/gallery` — but NOT `/education`. The education "See all" link needs a target. Options: (a) add a `/u/{handle}/education` skeleton in this sprint, or (b) link to the full Profile mode view with a scroll anchor. **Recommendation:** add the skeleton page — it's 30 min work and avoids a broken link.

### `components/public/PublicProfileContent.tsx`
- Import `PortfolioLayout`
- When `activeMode === 'portfolio'`: render `<PortfolioLayout>` instead of the inline section list
- Pass through all section data, accent colour, handle

**Design notes:**
- Portfolio mode is NOT a radical visual departure from Profile. It's the same information in a slightly more polished container. The big visual leap is Rich Portfolio (11c).
- The key difference: sections feel like curated cards rather than an expandable document.

---

## Part 3: Scrim Preset Rendering (1-2 hours)

**What changes:**
The hero photo gets a gradient scrim overlay based on the user's scrim preset (Dark, Light, Teal, Warm). This was stored in 11a but not rendered — now it renders.

**Files:**

### New: `lib/scrim-presets.ts`
```ts
export const scrimPresets = {
  dark: {
    topGradient: 'from-black/50 to-transparent',       // nav/back buttons area
    bottomGradient: 'from-transparent to-black/70',     // identity text area
    textColor: 'text-white',
    subtextColor: 'text-white/80',
    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    badgeBg: 'bg-green-500/25',
  },
  light: {
    topGradient: 'from-white/50 to-transparent',
    bottomGradient: 'from-transparent to-white/70',
    textColor: 'text-gray-900',
    subtextColor: 'text-gray-700',
    textShadow: 'none',                                // no shadow on light scrim
    badgeBg: 'bg-green-500/30',
  },
  teal: {
    topGradient: 'from-teal-900/50 to-transparent',
    bottomGradient: 'from-transparent to-teal-900/70',
    textColor: 'text-white',
    subtextColor: 'text-teal-100',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    badgeBg: 'bg-green-400/25',
  },
  warm: {
    topGradient: 'from-amber-900/40 to-transparent',
    bottomGradient: 'from-transparent to-amber-900/60',
    textColor: 'text-white',
    subtextColor: 'text-amber-100',
    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    badgeBg: 'bg-green-400/25',
  },
} as const

export type ScrimPreset = keyof typeof scrimPresets
```

**Architecture note:** The current `HeroSection.tsx` uses TWO gradient overlay divs — a top fade (for nav/back buttons) and a bottom fade (for the identity text block). Each scrim preset provides both gradients. The `textShadow` property replaces the current hardcoded inline `textShadow` — for light scrims it must be explicitly applied as `style={{ textShadow: 'none' }}` to override, not merely omitted. If the hero currently applies shadow via a CSS class rather than inline style, omitting the inline style won't clear it.

### `components/public/HeroSection.tsx`
- Accept `scrimPreset?: ScrimPreset` prop (default `'dark'`)
- Replace the hardcoded top gradient div class with the preset's `topGradient`
- Replace the hardcoded bottom gradient div class with the preset's `bottomGradient`
- Apply `textColor` and `subtextColor` to name, role, location, sea-time text
- Replace the hardcoded `textShadow` inline style with the preset's `textShadow` value
- Update the "Available" badge background to use the preset's `badgeBg`
- Toggle text colours apply based on scrim (dark scrim → white toggle text, light scrim → dark toggle text)

### `components/public/PublicProfileContent.tsx`
- Pass `user.scrim_preset` to `HeroSection`

**Verify:**
- All 4 presets render readably over a variety of hero photos (dark photo + light scrim, bright photo + dark scrim, etc.)
- Text remains accessible (WCAG AA contrast on the name at minimum)
- Light scrim: no lingering dark text shadows making text look dirty
- Badge backgrounds visible on all scrim types

---

## Part 4: Accent Colour Rendering (1-2 hours)

**What changes:**
The user's chosen accent colour tints section icons, "See all" links, the active toggle indicator, and the CTA button. Stored in 11a, now rendered.

**Files:**

### New: `lib/accent-colors.ts`
```ts
export const accentColors = {
  teal:  { 500: '#14b8a6', 600: '#0d9488', 100: '#ccfbf1' },
  coral: { 500: '#f97066', 600: '#ef4444', 100: '#ffe4e6' },
  navy:  { 500: '#3b82f6', 600: '#2563eb', 100: '#dbeafe' },
  amber: { 500: '#f59e0b', 600: '#d97706', 100: '#fef3c7' },
  slate: { 500: '#64748b', 600: '#475569', 100: '#f1f5f9' },
} as const

export type AccentColor = keyof typeof accentColors
```

### `components/public/PublicProfileContent.tsx`
- Read `user.accent_color` (string from DB)
- **Fallback guard:** `const resolved = accentColors[user.accent_color as AccentColor] ?? accentColors.teal` — the DB has no CHECK constraint on this column, so always fall back to teal for unknown values
- Set CSS custom properties on the profile wrapper: `--accent-500`, `--accent-600`, `--accent-100` from the resolved map
- All children consume via `var(--accent-500)` etc.

### Components that use accent:
- `ViewModeToggle.tsx` — active segment background uses `--accent-500`
- Section icons in `PortfolioLayout.tsx` — icon tint uses section-specific colours (unchanged from 11a), but "See all" links use `--accent-500`
- `ContactRow.tsx` (from 11a) — icon hover uses `--accent-500`
- Bottom CTA ("Build your crew profile") — button background uses `--accent-500`

**NOT changed:**
- Section-specific colours (navy for experience, coral for endorsements, etc.) — these are structural, not personalisable
- The accent colour is a subtle personal touch, not a theme override

---

## Part 5: Photo Focal Point Rendering (1 hour)

**What changes:**
Hero photo and gallery photos use the stored focal point (`focal_x`, `focal_y`) for `object-position`, so the photo crops to the user's chosen focus area.

**Files:**

### `components/public/HeroSection.tsx`
- Accept `focalX?: number` and `focalY?: number` props (default 50, 50)
- Apply `object-position: ${focalX}% ${focalY}%` on the hero `<img>` / `next/image`
- This replaces the default `object-position: center`

### Gallery photos (Part 6 below)
- Same `object-position` logic on gallery thumbnails

**No UI for setting focal points in this sprint.** The migration added the columns and defaults to center (50, 50). Setting focal points is Sprint 11c scope (photo management).

---

## Part 6: Mini Bento Gallery (3-4 hours)

**What changes:**
Portfolio mode gets a mini bento gallery at the bottom — 3 gallery photos in a compact asymmetric grid. This gives free users a taste of the Rich Portfolio aesthetic.

**Files:**

### New: `components/public/MiniBentoGallery.tsx`
```
Props: {
  photos: Array<{ url: string; focal_x: number; focal_y: number; alt?: string }>
  handle: string
  accentColor?: string
}
```
- **Layout (3 photos):**
  ```
  ┌──────────────┬────────┐
  │              │   2    │
  │     1        ├────────┤
  │   (large)    │   3    │
  │              │        │
  └──────────────┴────────┘
  ```
  - Photo 1: spans 2 rows, ~60% width
  - Photos 2 & 3: stacked, ~40% width each
  - CSS Grid: `grid-template-columns: 3fr 2fr`, `grid-template-rows: 1fr 1fr`
  - Photo 1: `grid-row: 1 / 3`
- **Fewer than 3 photos:**
  - 2 photos: side-by-side, equal width
  - 1 photo: single centered image, rounded corners, max-height 300px
  - 0 photos: don't render the section at all
- All photos: `rounded-lg`, `object-cover`, focal point `object-position`
- All photos tappable → full-screen lightbox (Part 7)
- Below the grid: `See all photos →` link to `/u/{handle}/gallery` (if 4+ exist)
- Section heading: `Camera` icon + "Gallery" (same style as other sections)

### `components/public/layouts/PortfolioLayout.tsx`
- Render `<MiniBentoGallery>` as the final section
- Pass `profilePhotos` array (already received as a prop) — take first 3 where `sort_order > 0`

**Photo source clarification:** Gallery photos for the bento come from the `user_photos` table (personal presentation photos), NOT `user_gallery` (work portfolio items with captions and yacht associations). The `user_gallery` table is a separate feature and is NOT used here. The field on each photo is `photo_url` (not `url`).

### `lib/queries/profile.ts`
- In `getExtendedProfileSections`: update `user_photos` select from `'id, photo_url, sort_order'` to `'id, photo_url, sort_order, focal_x, focal_y'` (already done in Part 0)
- Gallery photos for mini bento: filter `profilePhotos` where `sort_order > 0`, take first 3
- **Pre-build check:** Confirm the convention that `sort_order = 0` is the hero photo. If `sort_order` starts at 1 for all photos (hero included), the `> 0` filter will accidentally exclude the first gallery photo. Check actual data in the dev account and the photo upload code to verify.

### `lib/queries/types.ts`
- Update `ProfilePhoto` type to include `focal_x: number; focal_y: number` (already done in Part 0)
- Do NOT create a separate `GalleryPhoto` type — use `ProfilePhoto` throughout

---

## Part 7: Photo Lightbox (2-3 hours)

**What changes:**
Tapping any photo (hero or gallery) opens a full-screen lightbox with swipe navigation, pinch-to-zoom, and tap/swipe-down to dismiss.

**Files:**

### New: `components/public/PhotoLightbox.tsx`
```
Props: {
  photos: Array<{ url: string; alt?: string }>
  initialIndex: number
  open: boolean
  onClose: () => void
}
```
- Full-screen overlay: `fixed inset-0 z-50 bg-black`
- Swipe left/right between photos (touch events)
- Pinch-to-zoom on mobile
- Tap background or swipe down to dismiss
- Close button (X) top-right
- Photo counter: `1 / 5` bottom-center
- **Keyboard:** Escape to close, left/right arrows to navigate between photos
- **Focus trap:** trap focus within the overlay while open (prevent tabbing to elements behind it)
- **Lazy-load:** component is never needed on initial render — use `React.lazy()` / `next/dynamic` regardless of implementation approach
- **Implementation options (decide during build):**
  - Option A: Build from scratch with Framer Motion — more control, no dependency
  - Option B: Use a lightweight library (e.g., `yet-another-react-lightbox`, ~30KB gzipped) — faster to ship
  - **Recommendation:** Option A if the implementation is under ~150 lines, Option B otherwise. Don't over-engineer. Either way, lazy-load it.

### `components/public/HeroSection.tsx`
- Hero photo becomes tappable → opens lightbox at index 0 (hero is photo[0])

### `components/public/MiniBentoGallery.tsx`
- Each photo tappable → opens lightbox at the photo's index

### Gallery sub-page (`app/(public)/u/[handle]/gallery/page.tsx`)
- Already has a skeleton from 11a — enhance with lightbox on tap

---

## Part 8: Endorsement Pin/Unpin on Sub-Page (1-2 hours)

**What changes:**
On the `/u/{handle}/endorsements` sub-page (skeleton from 11a), the profile owner can pin/unpin endorsements. Pinned endorsements float to the top of the profile display (capped at 3 on the main profile).

**Files:**

### `app/(public)/u/[handle]/endorsements/page.tsx`
- Already exists as skeleton from 11a
- Also create subdomain equivalent: `app/(public)/subdomain/[handle]/endorsements/page.tsx` (shared component imported by both routes — pattern established in 11a)
- Add: if viewer is the profile owner, show a pin/unpin toggle on each endorsement card
- Pin toggle: small `Pin` icon (lucide), toggles `endorsements.is_pinned` via API
- Pinned cards get a subtle indicator (pin icon or "Pinned" badge)
- Sort: pinned first (`is_pinned DESC`), then by `created_at DESC` (already set up in 11a query)
- Max 3 pinned — if user tries to pin a 4th, show toast: "Unpin one first"

### New: `app/api/endorsements/[id]/pin/route.ts`
```
PATCH: { is_pinned: boolean }
- Auth: only the endorsement recipient can pin/unpin
  - Query: endorsements WHERE id = params.id AND recipient_id = auth.uid()
  - NOTE: the column is `recipient_id`, NOT `endorsee_id` (that doesn't exist)
  - NOTE: this is the INVERSE of the existing endorsement edit route which checks `endorser_id`
- Validate: if pinning (is_pinned=true), count existing pinned endorsements for this recipient — reject if already 3 pinned
- Update: endorsements.is_pinned = body.is_pinned
- Also verify: the existing `updateEndorsementSchema` in the general endorsement PATCH route does NOT include `is_pinned` — if it does, add `.omit({ is_pinned: true })` to prevent endorsers from pinning their own endorsements on someone else's profile
```

### `components/public/EndorsementCard.tsx`
- Accept optional `onPin?: (id: string, isPinned: boolean) => void` prop
- If `onPin` provided, render the pin toggle button
- Pinned state: subtle visual indicator (pin icon in corner)
- Read `is_pinned` from the endorsement data (field name in DB and types is `is_pinned`, not `pinned`)

---

## Part 9: Section Polish for Portfolio Mode (1-2 hours)

**What changes:**
Small refinements that make Portfolio mode feel distinct from Profile mode:

### 9a. About section — truncation
- In Portfolio mode, About/bio truncates at 3 lines with a "Read more" expansion
- In Profile mode, About shows in full (current behaviour)
- **File:** `PortfolioLayout.tsx` — wrap bio text in a `line-clamp-3` container with expand toggle

### 9b. Experience section — yacht cards
- In Portfolio mode, show top 3 yachts as compact cards (yacht name, role, dates) rather than full accordion entries
- "See all experience →" link at 4+ entries
- **File:** `PortfolioLayout.tsx` — compact experience card variant

### 9c. Certifications — chip display
- In Portfolio mode, show certs as a horizontal chip row (name only, no expiry)
- Tapping a chip → certification sub-page for details
- "See all certifications →" link always visible
- **File:** `PortfolioLayout.tsx` — cert chip row component

### 9d. Bottom CTA for non-logged-in viewers
- Below the mini bento gallery: "Build your crew profile — it's free" button
- Uses accent colour for background
- Links to `/signup`
- Only renders for non-authenticated viewers
- **File:** `PortfolioLayout.tsx` — conditional CTA block

---

## Build Order

```
Wave 0: Query + type prerequisites (Part 0)
  — type-check — MUST pass before any other wave
Wave 1: View mode toggle + PublicProfileShell + Portfolio layout shell (Parts 1, 2)
  — type-check + visual review
Wave 2: Scrim + accent + focal point rendering (Parts 3, 4, 5)
  — type-check + visual review across all 4 scrims × 5 accents
Wave 3: Mini bento gallery + lightbox (Parts 6, 7)
  — type-check + test with 0, 1, 2, 3, 5 photos
Wave 4: Endorsement pinning + section polish + education sub-page (Parts 8, 9)
  — type-check + drift-check
Full review chain: /review → /yachtielink-review → /test-yl
```

---

## Files Summary

### New files
```
components/public/ViewModeToggle.tsx
components/public/PublicProfileShell.tsx        — client wrapper for view mode state (keeps PublicProfileContent as server component)
components/public/layouts/PortfolioLayout.tsx
components/public/MiniBentoGallery.tsx
components/public/PhotoLightbox.tsx
lib/scrim-presets.ts
lib/accent-colors.ts
app/api/endorsements/[id]/pin/route.ts
app/(public)/u/[handle]/education/page.tsx      — education sub-page skeleton (target for "See all" link)
app/(public)/subdomain/[handle]/education/page.tsx — subdomain equivalent
```

### Modified files
```
lib/queries/profile.ts                      — add display fields to getUserByHandle, focal points to getExtendedProfileSections
lib/queries/types.ts                        — add display fields to user type, focal points to ProfilePhoto
components/public/PublicProfileContent.tsx   — layout branching via PublicProfileShell, accent CSS vars (stays server component)
components/public/HeroSection.tsx           — dual-gradient scrim rendering, focal point, toggle slot, textShadow per scrim, lightbox trigger
components/public/EndorsementCard.tsx       — pin toggle prop + is_pinned indicator
app/(public)/u/[handle]/page.tsx            — pass view mode to content
app/(public)/u/[handle]/endorsements/page.tsx — pin/unpin UI (upgrade from 11a skeleton)
app/(public)/subdomain/[handle]/endorsements/page.tsx — subdomain equivalent with shared component
app/(public)/u/[handle]/gallery/page.tsx    — lightbox integration (upgrade from 11a skeleton)
```

### NOT touched
```
app/(protected)/app/profile/page.tsx        — own-profile, separate layout
app/api/profile/display-settings/route.ts   — already built in 11a
lib/validation/schemas.ts                   — already built in 11a
components/cv/*                             — CV system, unrelated
Any auth, network, insights pages
Photo upload/management UI (that's 11c)
```

---

## Exit Criteria

```
[ ] View mode toggle renders in hero, switches between Profile and Portfolio
[ ] Portfolio layout: sections render as spaced cards, not accordion blocks
[ ] Scrim presets: all 4 render correctly over hero photo, text stays readable
[ ] Accent colour: tints toggle, "See all" links, CTA button
[ ] Focal point: hero photo crops to stored focal_x/focal_y
[ ] Mini bento gallery: 3-photo asymmetric grid at bottom of Portfolio mode
[ ] Mini bento gallery: graceful degradation for 0, 1, 2 photos
[ ] Lightbox: opens on photo tap, swipe between photos, dismiss on tap/swipe-down
[ ] Lightbox: keyboard nav (Escape to close, arrow keys to navigate), focus trap active
[ ] Lightbox: lazy-loaded (not in initial bundle)
[ ] Endorsement pinning: owner can pin/unpin on endorsements sub-page, max 3 (uses `is_pinned` column, NOT `pinned`)
[ ] Endorsement pinning: endorsers CANNOT pin their own endorsements on someone else's profile
[ ] Pinned endorsements sort first on main profile
[ ] About bio truncates at 3 lines in Portfolio mode with "Read more"
[ ] Experience shows compact yacht cards (top 3) in Portfolio mode
[ ] Certifications show as chip row in Portfolio mode
[ ] Bottom CTA renders for non-logged-in viewers only
[ ] Education "See all" link works — sub-page exists at /u/{handle}/education
[ ] No `dark:` variants on any public profile presentation component (always light mode)
[ ] Subdomain profile picks up all changes (including endorsements sub-page)
[ ] npm run build zero errors
[ ] npm run drift-check PASS
[ ] Mobile-first: no regressions at 375px
[ ] View mode toggle readable on all 4 scrim presets
```
