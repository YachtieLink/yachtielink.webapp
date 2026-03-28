# Sprint 11c — Rich Portfolio Mode (Pro)

**Goal:** Ship the premium bento grid profile. Rich Portfolio mode mixes photo tiles and content tiles in a template-based layout that auto-adapts to how much content the user has. Pro users get a profile that looks like a personal website. This is the presentation upgrade that makes Pro worth paying for.

**Estimated effort:** 2-3 days
**Depends on:** Sprint 11b complete (view mode toggle, lightbox, scrim/accent rendering, PortfolioLayout)

---

## Pre-Flight

- [ ] Sprint 11b merged to main, `npm run build` zero errors
- [ ] Confirm lightbox, scrim, accent, focal point all working
- [ ] Confirm view mode toggle works (11b builds it as a two-segment toggle that adapts labels based on `ownerDefault` — no structural change needed for Rich Portfolio, just pass `ownerDefault: 'rich_portfolio'`)
- [ ] Confirm `PublicProfileShell` (from 11b) types `activeMode` as `'profile' | 'portfolio' | 'rich_portfolio'` — all three modes must be valid. If 11b typed it as only `'profile' | 'portfolio'`, widen the type.
- [ ] Branch from main: `sprint-11c/rich-portfolio`

---

## Part 1: Bento Grid Engine (3-4 hours)

**What changes:**
A CSS Grid-based layout engine that places photo tiles and content tiles on a 4-column grid. Template definitions control which tiles go where — the engine just renders what the template tells it.

**Files:**

### New: `components/public/bento/BentoGrid.tsx`
```
Props: {
  variant: BentoTemplateVariant
  tiles: BentoTile[]
  gap?: number              // default 12px
  accentColor?: string
}
```
- CSS Grid container using `grid-template-areas` from the variant
- Desktop: applies `variant.areas.desktop` with `grid-template-columns: repeat(4, 1fr)`
- Mobile (`< md`): applies `variant.areas.mobile` with `grid-template-columns: repeat(2, 1fr)`
- Each tile div gets `style={{ gridArea: tile.areaName }}`
- Tiles render their own content — the grid only handles placement + sizing
- `auto-rows: minmax(120px, auto)` — content determines row height within a minimum

### New: `lib/bento/types.ts`

**Grid placement approach:** Use `grid-template-areas` instead of numerical `colStart`/`colSpan`/`rowStart`/`rowSpan`. Named areas are easier to debug (inspect the grid in DevTools and see `"photo1 photo1 about about"` vs opaque numbers), easier to maintain (rearranging slots = moving strings), and map naturally to the template data structure. Each template variant exports a `grid-template-areas` string for desktop and mobile.

```ts
export interface BentoTemplateSlot {
  id: string
  areaName: string   // e.g. 'photo1', 'about', 'experience' — used in grid-area
  type: 'photo' | 'about' | 'experience' | 'certifications' | 'endorsements' | 'education' | 'skills' | 'contact' | 'cv' | 'stats' | 'spacer'
}

export interface BentoTemplateVariant {
  slots: BentoTemplateSlot[]
  areas: {
    desktop: string   // grid-template-areas string, e.g. '"photo1 photo1 about about" "photo1 photo1 about about" ...'
    mobile: string    // grid-template-areas string for 2-col layout
  }
}

export interface BentoTemplate {
  id: string
  name: string
  description: string
  variants: {
    full: BentoTemplateVariant      // 6+ photos, all sections
    medium: BentoTemplateVariant    // 2-5 photos, most sections
    minimal: BentoTemplateVariant   // 0-1 photos, few sections
  }
}

export type BentoDensity = 'full' | 'medium' | 'minimal'

export interface BentoTile {
  areaName: string
  type: BentoTemplateSlot['type']
  content: React.ReactNode
}
```

### New: `lib/bento/density.ts`
```ts
export function detectDensity(data: {
  photoCount: number
  hasAbout: boolean
  experienceCount: number
  certCount: number
  endorsementCount: number
  educationCount: number
  hasSkills: boolean
}): BentoDensity
```
Logic:
- **Full:** 6+ photos AND (experience ≥ 3 AND endorsements ≥ 2 AND certs ≥ 3)
- **Medium:** 2-5 photos OR (experience ≥ 1 AND at least 2 other populated sections from: endorsements ≥ 1, certs ≥ 1, education ≥ 1, hasSkills, hasAbout)
- **Minimal:** everything else
- All params in the function signature are used — `endorsementCount` contributes to both Full and Medium thresholds
- Thresholds can be tuned after visual testing — these are starting points

---

## Part 2: Template Definitions (2-3 hours)

**What changes:**
Two launch templates with full/medium/minimal density variants each. Templates are static data — no database storage, no user-created layouts.

**Files:**

### New: `lib/bento/templates/classic.ts`

**Classic template — balanced, editorial**

**IMPORTANT: "Photo 1" through "Photo 6" are GALLERY photos** (`user_photos` where `sort_order > 0`), NOT the hero photo. The hero section with overlaid name/info renders separately above the bento grid. The first gallery photo fills the "Photo 1" slot. Do not duplicate the hero photo in the bento.

```
FULL variant — desktop (4-col):
┌──────────┬──────────┬──────────┬──────────┐
│  Photo 1            │  About              │  ← row 1-2
│  (2×2)              │  (2×2)              │
├──────────┬──────────┼──────────┬──────────┤
│ Contact  │ CV btn   │  Photo 2            │  ← row 3
│  (1×1)   │  (1×1)   │  (2×1)              │
├──────────┴──────────┼──────────┴──────────┤
│  Experience         │  Photo 3            │  ← row 4-5
│  (2×2)              │  (2×2)              │
├──────────┬──────────┼──────────┬──────────┤
│ Certs    │ Stats    │ Endorsements        │  ← row 6
│  (1×1)   │  (1×1)   │  (2×1)              │
├──────────┴──────────┼──────────┴──────────┤
│  Photo 4            │  Education          │  ← row 7
│  (2×1)              │  (2×1)              │
├──────────┬──────────┼──────────┬──────────┤
│  Skills             │  Photo 5 │ More →   │  ← row 8
│  (2×1)              │  (1×1)   │  (1×1)   │
└──────────┴──────────┴──────────┴──────────┘

grid-template-areas (desktop):
"photo1  photo1  about   about"
"photo1  photo1  about   about"
"contact cv      photo2  photo2"
"exp     exp     photo3  photo3"
"exp     exp     photo3  photo3"
"certs   stats   endorse endorse"
"photo4  photo4  edu     edu"
"skills  skills  photo5  more"
```

**"More →" tile:** If the user has more gallery photos than the template shows (6+ photos but only 5 slots), the last photo slot becomes a "More photos →" tile linking to `/u/{handle}/gallery`. Shows a blurred thumbnail of the 6th photo behind the link text. If ≤5 photos, the last slot shows Photo 6 normally.

```
FULL variant — mobile (2-col):
┌────────────────────┐
│  Photo 1 (2×1)     │  ← row 1
├────────────────────┤
│  About (2×1)       │  ← row 2
├──────────┬─────────┤
│ Contact  │ CV      │  ← row 3
├──────────┴─────────┤
│  Experience (2×1)  │  ← row 4
├──────────┬─────────┤
│ Photo 2  │ Photo 3 │  ← row 5
├──────────┴─────────┤
│  Endorsements (2×1)│  ← row 6
├──────────┬─────────┤
│ Certs    │ Stats   │  ← row 7
├──────────┴─────────┤
│  Education (2×1)   │  ← row 8
├──────────┬─────────┤
│ Photo 4  │ Photo 5 │  ← row 9
├──────────┴─────────┤
│  Skills (2×1)      │  ← row 10
├────────────────────┤
│  More → (2×1)      │  ← row 11 (if overflow)
└────────────────────┘

grid-template-areas (mobile):
"photo1  photo1"
"about   about"
"contact cv"
"exp     exp"
"photo2  photo3"
"endorse endorse"
"certs   stats"
"edu     edu"
"photo4  photo5"
"skills  skills"
"more    more"
```

MEDIUM variant: fewer photo slots (2-3), sections stack more vertically, same mobile-first linear flow
MINIMAL variant: single photo at top, sections in 2-col pairs below, near-identical on mobile

### New: `lib/bento/templates/bold.ts`

**Bold template — photo-forward, dramatic**

Same rule: all "Photo N" slots are gallery photos, not the hero.

```
FULL variant — desktop (4-col):
┌──────────────────────────────────────────┐
│  Photo 1 (full-width, 4×2)              │  ← row 1-2
├──────────┬──────────┬──────────┬────────┤
│  About              │ Contact  │ CV     │  ← row 3
│  (2×1)              │  (1×1)   │ (1×1)  │
├──────────┼──────────┼──────────┴────────┤
│ Photo 2  │ Photo 3  │  Experience       │  ← row 4-5
│ (1×2)    │ (1×2)    │  (2×2)            │
├──────────┴──────────┼──────────┬────────┤
│  Endorsements       │ Certs    │ Stats  │  ← row 6
│  (2×1)              │  (1×1)   │ (1×1)  │
├──────────┬──────────┼──────────┴────────┤
│ Photo 4  │ Photo 5  │ More →            │  ← row 7
│ (1×1)    │ (1×1)    │ (2×1)             │
├──────────┴──────────┼───────────────────┤
│  Education          │  Skills           │  ← row 8
│  (2×1)              │  (2×1)            │
└─────────────────────┴───────────────────┘

grid-template-areas (desktop):
"photo1  photo1  photo1  photo1"
"photo1  photo1  photo1  photo1"
"about   about   contact cv"
"photo2  photo3  exp     exp"
"photo2  photo3  exp     exp"
"endorse endorse certs   stats"
"photo4  photo5  more    more"
"edu     edu     skills  skills"
```

```
FULL variant — mobile (2-col):
┌────────────────────┐
│  Photo 1 (2×2)     │  ← row 1-2 (full-width gallery photo)
├────────────────────┤
│  About (2×1)       │  ← row 3
├──────────┬─────────┤
│ Contact  │ CV      │  ← row 4
├──────────┴─────────┤
│  Experience (2×1)  │  ← row 5
├──────────┬─────────┤
│ Photo 2  │ Photo 3 │  ← row 6
├──────────┴─────────┤
│  Endorsements (2×1)│  ← row 7
├──────────┬─────────┤
│ Certs    │ Stats   │  ← row 8
├──────────┬─────────┤
│ Photo 4  │ Photo 5 │  ← row 9
├──────────┴─────────┤
│  Education (2×1)   │  ← row 10
├────────────────────┤
│  Skills (2×1)      │  ← row 11
├────────────────────┤
│  More → (2×1)      │  ← row 12 (if overflow)
└────────────────────┘

grid-template-areas (mobile):
"photo1  photo1"
"photo1  photo1"
"about   about"
"contact cv"
"exp     exp"
"photo2  photo3"
"endorse endorse"
"certs   stats"
"photo4  photo5"
"edu     edu"
"skills  skills"
"more    more"
```

MEDIUM variant: top photo still full-width but fewer interspersed photos, same mobile-first linear flow
MINIMAL variant: single full-width photo, content in clean 2-col grid below

### New: `lib/bento/templates/index.ts`
- Export both templates
- `getTemplate(id: string): BentoTemplate`
- `getTemplateVariant(id: string, density: BentoDensity): BentoTemplateSlot[]`
- Default template: `classic`

---

## Part 3: Tile Components (3-4 hours)

**What changes:**
Each tile type has its own component that renders content within its grid cell. Tiles are self-contained — they handle their own padding, typography, and overflow.

**Files:**

### New: `components/public/bento/tiles/PhotoTile.tsx`
```
Props: { url: string; focalX: number; focalY: number; onClick: () => void }
```
- `rounded-xl overflow-hidden` container
- `object-cover` image with `object-position` from focal point
- Subtle hover: slight scale + shadow (Framer Motion `cardHover` preset)
- Tap → lightbox (via onClick)

### New: `components/public/bento/tiles/AboutTile.tsx`
```
Props: { bio: string; accentColor?: string }
```
- Bio text, `line-clamp-6` for 2×2 cells, `line-clamp-3` for smaller
- Subtle section icon (`User`) top-left
- `Read more →` link to scroll to or open full about

### New: `components/public/bento/tiles/ExperienceTile.tsx`
```
Props: { attachments: PublicAttachment[]; handle: string; maxShow?: number }
```
**Note:** Uses `PublicAttachment` from `lib/queries/types.ts` — yacht data is nested as `attachment.yachts`. Do NOT create a `PublicYacht` type.
- Compact yacht list: name + role + dates, max 2-3 entries
- `See all →` link to `/u/{handle}/experience`

### New: `components/public/bento/tiles/EndorsementsTile.tsx`
```
Props: { endorsements: PublicEndorsement[]; handle: string }
```
- Top endorsement: avatar + name + snippet of text
- `+N more →` link to `/u/{handle}/endorsements`

### New: `components/public/bento/tiles/CertsTile.tsx`
```
Props: { certifications: PublicCertification[]; handle: string }
```
- Cert chips in a flex-wrap layout
- Count badge if overflow

### New: `components/public/bento/tiles/ContactTile.tsx`
```
Props: { email?: string; phone?: string; whatsapp?: string; showEmail: boolean; showPhone: boolean; showWhatsapp: boolean }
```
- Icon grid: 📧 📱 💬 — same icons as `ContactRow` from 11a but in a tile container
- Clean centered layout for the grid cell

### New: `components/public/bento/tiles/CvTile.tsx`
```
Props: { handle: string }
```
- `FileText` icon + "View my CV" button
- Links to `/u/{handle}/cv`

### New: `components/public/bento/tiles/StatsTile.tsx`
```
Props: { seaTime: string; yachtCount: number; certCount: number }
```
- Key numbers in large display text
- Compact summary tile
- **Data assembly:** `seaTime` is computed as `formatSeaTime(seaTimeTotalDays)` using the helper from `lib/sea-time`. The `seaTimeTotalDays` comes from the `get_sea_time` RPC call in the page route. The `RichPortfolioLayout` must call `formatSeaTime()` and pass the formatted string.

### New: `components/public/bento/tiles/EducationTile.tsx`
```
Props: { education: Education[]; handle: string }
```
**Note:** Uses `Education` from `lib/queries/types.ts` — do NOT create a `PublicEducation` type.
- Compact list: institution + qualification
- `See all →` link

### New: `components/public/bento/tiles/SkillsTile.tsx`
```
Props: { skills: string[]; languages: string[]; hobbies: string[] }
```
- Chip cloud combining skills, languages, hobbies
- Grouped with subtle label separators

---

## Part 4: Rich Portfolio Layout Assembly (2-3 hours)

**What changes:**
The orchestrator component that reads user data, picks a template + density variant, maps data to tiles, and renders the bento grid.

**Files:**

### New: `components/public/layouts/RichPortfolioLayout.tsx`
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
  seaTimeTotalDays: number
  accentColor: string
  handle: string
  templateId?: string       // default 'classic'
}
```
**Note:** Uses the same individual array props as `PortfolioLayout` (11b pattern). All types from `lib/queries/types.ts`. Do NOT create a `PublicProfileSections` aggregate type — match the existing data flow from `PublicProfileContent`.

**Logic:**
1. Detect density from user data (`detectDensity()`)
2. Get template variant (`getTemplateVariant(templateId, density)`)
3. Build tiles array:
   - Map each slot in the variant to a tile component
   - Photo slots: fill from gallery photos in order (gallery photos = `user_photos` where `sort_order > 0`), skip if no photo available
   - "More →" slot: if total gallery photos > template photo slots, render a `MorePhotosTile` linking to `/u/{handle}/gallery` with the next unseen photo as a blurred background. If no overflow, render the last photo normally instead.
   - Content slots: render the matching tile component with section data
   - If a section has no data (e.g., no education), collapse the slot — don't render an empty tile
4. Render `<BentoGrid template={variant} tiles={tiles} accentColor={accentColor} />`

**Empty slot handling:**
- If a content section is empty AND the slot is adjacent to a photo, the photo can expand to fill (grid tracks adjust)
- If a content section is empty AND no adjacent photo, the slot collapses (grid auto-rows handle this)
- At minimum: always render About (even if empty — "No bio yet"), Experience, and Contact

### `components/public/PublicProfileContent.tsx`
- When `activeMode === 'rich_portfolio'`: render `<RichPortfolioLayout>`
- Pass `user.profile_template` as `templateId` (or default to `'classic'`)

---

## Part 5: Template Selection Settings (1-2 hours)

**What changes:**
Pro users can choose their bento template in the display settings page (built in 11a).

**Files:**

### `app/(protected)/app/profile/settings/page.tsx`
- Add "Portfolio Template" section below the existing view mode / scrim / accent settings
- Only visible when `profile_view_mode === 'rich_portfolio'`
- Two template options: Classic and Bold
- Visual preview: small thumbnail showing the grid layout pattern (not live data — just a schematic)
- Save to a new column or reuse existing settings API

### `app/api/profile/display-settings/route.ts`
- Add `profile_template` to the PATCH payload
- Zod validation: `z.enum(['classic', 'bold'])`

### Migration (REQUIRED — column does not exist)

**File:** `supabase/migrations/YYYYMMDD_sprint11c_profile_template.sql`
```sql
ALTER TABLE users ADD COLUMN profile_template text NOT NULL DEFAULT 'classic'
  CHECK (profile_template IN ('classic', 'bold'));
```
The 11a migration does NOT include this column. This migration is mandatory.

### `lib/validation/schemas.ts`
- Add `profile_template: z.enum(['classic', 'bold']).optional()` to the `displaySettingsSchema`

### `app/api/profile/display-settings/route.ts`
- Add `profile_template` to both the GET query select list and the PATCH update path

### `lib/queries/profile.ts`
- Add `profile_template` to the `getUserByHandle` select string (same pattern as 11b adding display fields)

---

## Part 6: Photo Management Enhancements (2-3 hours)

**What changes:**
The photo management page already exists at `app/(protected)/app/profile/photos/page.tsx` with drag-to-reorder (`@dnd-kit/sortable`), multi-upload, and delete. This part adds focal point adjustment and updates the Pro photo limit.

**Existing state (do NOT rebuild from scratch):**
- Page: `app/(protected)/app/profile/photos/page.tsx` — fully functional
- Reorder: uses `@dnd-kit/sortable` (already installed)
- Upload: drag-drop multi-upload with file validation
- Delete: per-photo delete with confirmation
- Current limits: Free = 3, Pro = 9 (`MAX_PHOTOS_PRO`)
- Photo source: `user_photos` table (personal presentation photos, NOT `user_gallery` which is work portfolio with captions/yacht links)
- Storage: uploads to existing photo storage bucket with RLS

**New work:**

### 6a. Bump Pro photo limit
- Update `MAX_PHOTOS_PRO` from 9 to 15 in the photos page AND the API route that validates upload count
- **Check both locations:** the limit may be enforced client-side (in the page component) and server-side (in the API route). Both must match.
- Free limit stays at 3
- **Pro upsell when limit hit:** When a free user has 3 photos uploaded, replace the upload drop zone with an inline message: "Upgrade to Pro for up to 15 photos" with a link to the billing page. Not a modal, not a toast — inline below the existing photos so it's visible in context. Same pattern as other Pro upsells in the app (see `sprints/backlog/pro-upsell-consistency.md` for app-wide standardisation notes).

### 6b. Focal point picker

### New: `components/profile/FocalPointPicker.tsx`
```
Props: {
  imageUrl: string
  focalX: number
  focalY: number
  onChange: (x: number, y: number) => void
}
```
- Photo preview with a draggable crosshair/circle
- Drag the crosshair to set the focal point
- Shows a **hero crop preview only** (how it'll look in the hero aspect ratio). Bento tiles crop at varying aspect ratios (1×1, 2×2, 2×1) — showing all of them is too complex for this sprint. Hero is the most important crop; bento tiles are secondary and the focal point will be close enough.
- Simple: just map drag position to percentage coordinates

### 6c. Integrate focal point into existing page

### `app/(protected)/app/profile/photos/page.tsx`
- Add a "Set focal point" button on each photo card (hero + gallery)
- On tap: open the `FocalPointPicker` in a modal/drawer
- Save via existing photo API: `PATCH /api/user-photos/{id}` with `{ focal_x, focal_y }`
- **Check:** the existing PATCH route may not accept `focal_x`/`focal_y` yet — add them to the allowed update fields and Zod schema

### 6d. API updates (if needed)

Check the existing photo API routes (likely `app/api/user-photos/` based on codebase convention):
- Ensure PATCH accepts `focal_x: number` and `focal_y: number`
- Ensure GET returns `focal_x` and `focal_y` in the response
- Do NOT create duplicate routes at `app/api/profile/photos/` — use the existing paths

**Photo source reminder:** All bento gallery photos come from `user_photos` (field: `photo_url`). The `user_gallery` table (work portfolio items with captions and yacht associations) is a separate feature not used by the bento grid.

---

## Part 7: Mobile Responsive Bento (1-2 hours)

**What changes:**
The 4-column desktop grid collapses to a 2-column mobile grid. Templates define separate mobile placements.

**Files:**

### `components/public/bento/BentoGrid.tsx`
- At `< md` breakpoint: switch to `grid-template-columns: repeat(2, 1fr)`
- Each tile uses its `placement.mobile` values instead of `placement.desktop`
- Photos that were 1×1 on desktop stay 1×1 on mobile
- Full-width content tiles (4×1 on desktop) become 2×1 on mobile
- Large photo tiles (2×2 on desktop) become 2×1 on mobile (shorter, still full-width)

### Template mobile variants
- In `classic.ts` and `bold.ts`: each variant includes a `areas.mobile` string (see Part 2 for the detailed mobile grid-template-areas definitions)
- Mobile layout uses 2-col grid with mostly full-width content tiles and paired photo/utility tiles
- Classic Full mobile: 11 rows (see Part 2 diagram)
- Bold Full mobile: 12 rows including double-height Photo 1 (see Part 2 diagram)
- The mobile layouts are specified in Part 2 — they must be implemented as written, not designed on the fly during build

**Verify:**
- Test at 375px (iPhone SE)
- No horizontal overflow
- Photos maintain aspect ratio and focal point
- Tiles don't get too cramped at 2-col width

---

## Part 8: Pro Gating (1 hour)

**What changes:**
Rich Portfolio is Pro-only. Free users see it greyed out in settings. No "this is a free profile" signalling on the public profile itself.

**Files:**

### `app/(protected)/app/profile/settings/page.tsx`
- Rich Portfolio radio option: disabled for free users
- Show `Pro` badge next to it
- On tap (free user): open Pro upsell modal or navigate to billing page
- Template selection section: hidden for free users entirely

### `components/public/PublicProfileContent.tsx`
- If `profile_view_mode === 'rich_portfolio'` but user is not Pro: fall back to `'portfolio'`
- **Pro check:** use `isProFromRecord(user)` from `lib/stripe/pro.ts` — this utility already exists and handles subscription status + expiry edge cases. Do NOT create a separate Pro check. `getUserByHandle` already selects `subscription_status, subscription_ends_at`.
- This handles edge cases (downgraded user, expired trial, past_due, etc.)
- No error, no messaging — just graceful degradation

### `components/public/ViewModeToggle.tsx`
- Toggle is always **two-segment** (per design spec: owner's default ↔ Profile mode). No structural change from 11b — just different labels based on `ownerDefault`:
  - Pro user's profile with `ownerDefault: 'rich_portfolio'`: toggle shows `Profile | Rich Portfolio`
  - Free user's profile with `ownerDefault: 'portfolio'`: toggle shows `Profile | Portfolio`
  - Viewer always sees both modes regardless of their own subscription status
- The 11b component already accepts `ownerDefault: 'portfolio' | 'rich_portfolio'` — just pass the right value

---

## Build Order

```
Wave 1: Bento grid engine + templates + tile components (Parts 1, 2, 3)
  — type-check + render test with mock data
Wave 2: Layout assembly + Pro gating (Parts 4, 8)
  — type-check + visual test with real dev-qa profile
Wave 3: Template settings + photo management (Parts 5, 6)
  — type-check + test upload/reorder/focal-point/delete flow
Wave 4: Mobile responsive + polish (Part 7)
  — type-check + drift-check + test at 375px
Full review chain: /review → /yachtielink-review → /test-yl
```

---

## Files Summary

### New files
```
components/public/bento/BentoGrid.tsx
components/public/bento/tiles/PhotoTile.tsx
components/public/bento/tiles/AboutTile.tsx
components/public/bento/tiles/ExperienceTile.tsx
components/public/bento/tiles/EndorsementsTile.tsx
components/public/bento/tiles/CertsTile.tsx
components/public/bento/tiles/ContactTile.tsx
components/public/bento/tiles/CvTile.tsx
components/public/bento/tiles/StatsTile.tsx
components/public/bento/tiles/EducationTile.tsx
components/public/bento/tiles/SkillsTile.tsx
components/public/layouts/RichPortfolioLayout.tsx
components/profile/FocalPointPicker.tsx
lib/bento/types.ts
lib/bento/density.ts
lib/bento/templates/classic.ts
lib/bento/templates/bold.ts
lib/bento/templates/index.ts
supabase/migrations/YYYYMMDD_sprint11c_profile_template.sql
```

### Modified files
```
components/public/PublicProfileContent.tsx          — rich_portfolio branch + Pro fallback via isProFromRecord()
components/public/ViewModeToggle.tsx                — label changes only (still two-segment, adapts to ownerDefault)
app/(protected)/app/profile/settings/page.tsx       — template picker + Pro gating
app/api/profile/display-settings/route.ts           — profile_template in GET select + PATCH payload
lib/validation/schemas.ts                           — profile_template enum added to displaySettingsSchema
lib/queries/profile.ts                              — add profile_template to getUserByHandle select
lib/queries/types.ts                                — add profile_template to user profile type (same pattern as 11b display fields)
app/(protected)/app/profile/photos/page.tsx         — focal point picker integration + bump MAX_PHOTOS_PRO to 15
existing photo API route (app/api/user-photos/)     — accept focal_x/focal_y in PATCH, update Pro limit
```

### Migration (REQUIRED)
```
supabase/migrations/YYYYMMDD_sprint11c_profile_template.sql
  — ALTER TABLE users ADD COLUMN profile_template text NOT NULL DEFAULT 'classic' CHECK (...)
```

### NOT created (already exist)
```
components/profile/GalleryManager.tsx               — NOT needed, existing photos page has drag-to-reorder
app/api/profile/photos/*                            — NOT created, use existing photo API routes
```

### NOT touched
```
components/public/layouts/PortfolioLayout.tsx    — free tier, built in 11b
components/public/MiniBentoGallery.tsx           — free tier gallery, built in 11b
components/public/PhotoLightbox.tsx              — shared, built in 11b
lib/scrim-presets.ts                             — built in 11b
lib/accent-colors.ts                             — built in 11b
Any auth, network, CV, onboarding code
```

---

## Exit Criteria

```
[ ] Rich Portfolio renders bento grid on desktop (4-col) and mobile (2-col)
[ ] Classic template: all 3 density variants render correctly
[ ] Bold template: all 3 density variants render correctly
[ ] Density auto-detection picks correct variant based on profile data
[ ] Photo tiles render with focal point, open lightbox on tap
[ ] Content tiles render correct data, link to sub-pages
[ ] Empty sections collapse gracefully (no empty tiles)
[ ] Contact + CV render as tiles in the grid
[ ] Template selection in settings (Pro only)
[ ] Template preview thumbnails render in settings
[ ] Photo management: upload, reorder, delete, focal point adjust
[ ] Free user: max 3 gallery photos, Pro: max 15
[ ] Pro upsell shown when free user hits photo limit
[ ] Rich Portfolio greyed out for free users in settings
[ ] Free user with rich_portfolio mode stored → falls back to portfolio
[ ] Viewer toggle: Profile ↔ Rich Portfolio on Pro profiles
[ ] Mobile bento: 2-col layout, no overflow, photos maintain focal point
[ ] Subdomain profile picks up all changes
[ ] npm run build zero errors
[ ] npm run drift-check PASS
[ ] Mobile-first: no regressions at 375px
[ ] View mode toggle (two-segment) readable on all 4 scrim presets at 375px and desktop
[ ] Photo limit enforced consistently: client-side AND API-side both use 3 (free) / 15 (Pro)
```

### Explicitly Deferred
- **Photo overflow carousel:** The design spec says "Pro: photos fill bento slots in user-defined order, overflow goes to carousel at bottom." The full carousel is NOT built in 11c. Instead, the last bento photo slot becomes a "More photos →" tile linking to the gallery sub-page when the user has more photos than slots (5 slots in Full variant, Pro allows 15). This signals that more exist without building a carousel. A bottom carousel is deferred to a future polish sprint.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bento grid too complex, slows page load | Medium | Medium | Keep tile components light — no heavy renders. Lazy-load photos below fold. |
| Templates look bad with sparse data | High | Medium | Density variants handle this — minimal variant is near-linear. Test with empty dev account. |
| Mobile 2-col feels cramped | Medium | Medium | If tiles feel too small at 375px, fall back to single-column for `< sm` breakpoint. |
| Drag reorder UX is fiddly on mobile | Medium | Low | Consider long-press to enter reorder mode, or use up/down arrows as mobile alternative. |
| 15 photos = slow gallery page | Low | Medium | Lazy load + thumbnail variants. Don't load full-res until lightbox opens. |
| Photo upload storage costs | Low | Low | 5MB limit per photo, 15 max = 75MB max per user. Reasonable at current scale. |
| Template expansion (adding more later) | — | — | Template system is data-driven — adding a third template is just a new file in `lib/bento/templates/`. No engine changes needed. |

---

## Notes

> **Templates, not drag-and-drop.** The bento grid is template-driven, not user-arranged. Users pick Classic or Bold, the system picks the density variant, content fills the slots. This keeps the UX simple and the output consistently good-looking. Drag-and-drop bento editing is explicitly out of scope (per design spec).

> **Density auto-switch is the magic.** A sparse profile shouldn't look empty. A packed profile shouldn't look cramped. The density variants handle this — same template, different arrangements based on how much the user has filled in. Users never see this switch — it just works.

> **Photos make the bento.** Without gallery photos, Rich Portfolio degrades gracefully to near-Portfolio. The photo management flow (Part 6) is what unlocks the wow factor. Photo upload should be frictionless — drag-drop, instant preview, done.

> **Pro gating is invisible to viewers.** A viewer looking at a free user's Portfolio mode should never feel like they're seeing a "lesser" version. Portfolio mode looks great on its own. Rich Portfolio is a bonus, not the baseline.
