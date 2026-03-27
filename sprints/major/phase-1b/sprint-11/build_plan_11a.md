# Sprint 11a — Profile Mode Fixes + Foundation

**Goal:** Ship a better version of what exists (Profile mode) while laying the database and settings foundation for Portfolio and Rich Portfolio modes in 11b/11c.

**Estimated effort:** 3-4 days

---

## Pre-Flight

- [ ] Branch from main: `sprint-11a/profile-rewrite-foundation`
- [ ] `npm run build` zero errors on main before branching

---

## Migration: Foundation Schema Changes

**File:** `supabase/migrations/YYYYMMDD_sprint11a_profile_rewrite.sql`

All the schema changes needed across 11a/b/c, laid down now so we don't run 4 separate migrations:

```sql
-- Sprint 11a-c: Public Profile Rewrite Foundation

-- 1. View mode preference
ALTER TABLE users ADD COLUMN profile_view_mode text NOT NULL DEFAULT 'portfolio'
  CHECK (profile_view_mode IN ('profile', 'portfolio', 'rich_portfolio'));

-- 2. Scrim preset + accent colour
ALTER TABLE users ADD COLUMN scrim_preset text NOT NULL DEFAULT 'dark'
  CHECK (scrim_preset IN ('dark', 'light', 'teal', 'warm'));
ALTER TABLE users ADD COLUMN accent_color text NOT NULL DEFAULT 'teal';

-- 3. Photo focal points
ALTER TABLE user_photos ADD COLUMN focal_x numeric NOT NULL DEFAULT 50;
ALTER TABLE user_photos ADD COLUMN focal_y numeric NOT NULL DEFAULT 50;

-- 4. Endorsement pinning
ALTER TABLE endorsements ADD COLUMN pinned boolean NOT NULL DEFAULT false;

-- 5. Gallery photo type distinction (hero vs gallery)
-- hero photo remains users.profile_photo_url
-- gallery photos are user_photos with sort_order > 0
-- No structural change needed — sort_order 0 = hero source, rest = gallery
```

---

## Part 1: Desktop Layout — Kill the Split (1-2 hours)

**What changes:**
The public profile switches from a 40/60 side-by-side split to a single-column editorial layout, max-width ~680px, centred.

**Files:**

### `components/public/PublicProfileContent.tsx`
- Remove the `md:flex-row` outer container — always `flex-col`
- Remove the entire desktop left panel (`hidden md:block md:w-2/5 md:sticky`) — lines 164-274
- `HeroSection` becomes the only hero on all breakpoints — remove `md:hidden` from it
- Content area: remove `md:overflow-y-auto`, add `max-w-[680px] mx-auto w-full`
- Move `SaveProfileButton` and edit/back/share buttons — they now live only in `HeroSection`

### `components/public/HeroSection.tsx`
- Remove `md:hidden` class — now renders on all screen sizes
- On desktop, constrain within the 680px max-width (inherits from parent)
- Adjust hero height: `h-[65vh]` on mobile, `h-[50vh] md:h-[60vh]` on desktop (test what looks right)
- Ensure back/share/save buttons all render here

### `app/(public)/subdomain/[handle]/page.tsx`
- No code changes — uses `PublicProfileContent` so picks up the layout change automatically

**Verify:**
- Own-profile page (`/app/profile`) is NOT affected (uses `ProfileSectionGrid`, separate component)

---

## Part 2: Section Heading Typography (30 min)

**What changes:**
Section headings switch from DM Serif Display to DM Sans Medium, 14px, uppercase, letter-spaced. Editorial label style.

**Files:**

### `components/profile/ProfileAccordion.tsx`
- Change heading: `font-serif text-base` → `font-sans text-sm font-medium uppercase tracking-wider`
- This affects: About, Education, Hobbies sections (rendered via ProfileAccordion in PublicProfileContent)

### `components/public/sections/ExperienceSection.tsx`
- Same heading change if it has its own heading style

### `components/public/sections/EndorsementsSection.tsx`
- Same heading change

### `components/public/sections/CertificationsSection.tsx`
- Same heading change

### `components/public/sections/SkillsSection.tsx`
- Same heading change

### `components/public/sections/GallerySection.tsx`
- Same heading change

**Check:** Are there any other `font-serif` usages on section headings? The hero `h1` (name) stays serif — that's correct.

**NOT changed:**
- Hero name (`h1`) — stays DM Serif Display
- App page headings (CV, Network, etc.) — separate concern, not this sprint
- `IdentityCard.tsx` — separate component, not public profile sections

---

## Part 3: Kill the Left-Border Accent (1 hour)

**What changes:**
Remove the teal left-border on every section. Replace with icon-led headings. Each section gets a small, refined icon in its section colour.

**Files:**

### `components/profile/ProfileAccordion.tsx`
- Remove `border-l-3` / `border-l-[var(--color-teal-500)]` (or however the left border is currently applied)
- Add icon prop: `icon?: React.ReactNode`
- Render icon before the heading text, tinted with section colour

### Section icon mapping (in `PublicProfileContent.tsx` or a constants file):

| Section | Icon (lucide-react) | Colour |
|---------|---------------------|--------|
| About | `User` | teal |
| Experience | `Anchor` | navy |
| Endorsements | `Star` | coral |
| Certifications | `Shield` | amber |
| Education | `GraduationCap` | teal |
| Hobbies | `Heart` | coral |
| Extra Skills | `Sparkles` | teal |
| Gallery | `Camera` | teal |

### Standalone section components
- `ExperienceSection.tsx`, `EndorsementsSection.tsx`, `CertificationsSection.tsx`, `SkillsSection.tsx`, `GallerySection.tsx` — if they render their own heading/border, update to match. If they delegate to `ProfileAccordion`, they get the change for free.

---

## Part 4: Contact Card Redesign (1-2 hours)

**What changes:**
Raw text contact card → compact icon row. Tappable icons for email, phone, WhatsApp.

**Files:**

### `components/public/PublicProfileContent.tsx`
- Replace the contact card block (lines ~280-300) with a new `ContactRow` component
- Remove the `CONTACT` heading + card wrapper

### New: `components/public/ContactRow.tsx`
```
Props: { email, phone, whatsapp, showEmail, showPhone, showWhatsapp }
```
Renders a horizontal row of tappable icons:
- `Mail` icon → `mailto:{email}`
- `Phone` icon → `tel:{phone}`
- `MessageCircle` icon (or WhatsApp brand icon) → `https://wa.me/{whatsapp}`
- Only renders icons where `show_*` is true AND field has a value
- Subtle, compact — no card wrapper, no heading

**NOT changed:**
- Settings page (`/app/profile/settings`) — edit surface stays the same
- CV PDF generation — still reads the same fields with same visibility toggles

---

## Part 5: Endorsement Fixes (2-3 hours)

**What changes:**
1. Show full name (not username)
2. Cap at 3 on profile
3. Endorser avatar + name is clickable → their profile
4. "See all endorsements" link

### 5a. Query: Add endorser handle

**File:** `lib/queries/profile.ts`
- In `getPublicProfileSections`, endorser select: add `handle` to the select string
- Change: `endorser:endorser_id ( id, display_name, full_name, profile_photo_url )` → add `handle`

**File:** `lib/queries/types.ts`
- `PublicEndorsement.endorser` — add `handle?: string | null`

### 5b. Display: Clickable endorser with name

**File:** `components/public/EndorsementCard.tsx`
- Wrap endorser name + avatar in `<Link href={/u/${endorser.handle}}>` (if handle exists)
- Show `endorser.display_name || endorser.full_name` (not username)
- Avatar already renders — ensure it's inside the link

### 5c. Cap at 3 + "See all"

**File:** `components/public/sections/EndorsementsSection.tsx`
- Change: show only first 3 endorsements (currently shows 5 with ShowMoreButton)
- Remove `ShowMoreButton` logic
- Add: `<Link href={/u/${handle}/endorsements}>See all {count} endorsements</Link>` after the 3 cards
- Always show the "See all" link (even with ≤3 endorsements — it leads to the richer view)

### 5d. Pinning display (sort pinned first)

**File:** `lib/queries/profile.ts`
- Endorsement query: add `pinned` to select
- Order: `pinned DESC, created_at DESC` (pinned first, then most recent)

**File:** `lib/queries/types.ts`
- Add `pinned?: boolean` to `PublicEndorsement`

**Pinning UI deferred to Sprint 11b** (when we build the `/u/{handle}/endorsements` sub-page)

---

## Part 6: Orphaned Stat Line (30 min)

**What changes:**
"4 months at sea · 1 yacht" currently sits between About and Experience, belonging to neither. Move it into the hero overlay, next to location.

**Files:**

### `components/public/HeroSection.tsx`
- Add sea time + yacht count to the hero info block, below location
- Format: `{seaTime} · {yachtCount} yachts` (or singular)

### `components/public/PublicProfileContent.tsx`
- Remove the standalone stat line block between About and Experience sections

---

## Part 7: Top Button Margins (15 min)

**What changes:**
Back/share buttons flush against top edge on mobile. Add safe-area padding.

**File:** `components/public/HeroSection.tsx`
- Add `pt-[env(safe-area-inset-top)]` or `pt-[max(env(safe-area-inset-top),12px)]` to the button container

---

## Part 8: CV On-Demand Generation (2-3 hours)

**What changes:**
Kill the regenerate button. CV is generated on demand when someone views or downloads it.

### 8a. Remove regenerate UI

**File:** `components/cv/CvActions.tsx`
- Remove the "Regenerate" button entirely
- Remove `generating` state, `generatePdf()` function, `generatedAt` display
- Keep the Download button — it now triggers on-demand generation
- The "Generate PDF" first-time button also goes — replaced by the same download flow

### 8b. On-demand generation flow

**File:** `app/api/cv/generate-pdf/route.ts`
- Currently generates and stores a PDF on user request
- Repurpose: this becomes the on-demand endpoint
- When called, always generate a fresh PDF from current profile data
- Still store the result in `latest_pdf_path` for caching (optional: add a TTL)
- Return the PDF URL

### 8c. CV page simplification

**File:** `app/(protected)/app/cv/page.tsx`
- Remove `hasPdf` / `pdfGeneratedAt` props to CvActions
- The page now shows: uploaded CV card + download generated CV button
- "View my CV" opens the same `/u/{handle}/cv` preview that the public sees

### 8d. Public CV route (already exists)

**File:** `app/(public)/u/[handle]/cv/page.tsx`
- Already works — no changes needed
- This is where "View my CV" on the public profile links to

**NOT changed:**
- `app/api/cv/public-download/[handle]/route.ts` — still serves the PDF, no change
- `CvUploadClient`, `CvPreview`, parse routes — unrelated

---

## Part 9: View Mode + Display Settings Foundation (1-2 hours)

**What changes:**
Add the settings UI for view mode, scrim preset, and accent colour. These don't affect the public profile rendering yet (that's 11b) — but the settings and storage are ready.

### 9a. API route for display settings

**New file:** `app/api/profile/display-settings/route.ts`
- GET: returns `{ profile_view_mode, scrim_preset, accent_color }` for current user
- PATCH: updates any subset of those fields
- Zod validation for allowed values

### 9b. Settings UI

**File:** `app/(protected)/app/profile/settings/page.tsx` (or a new sub-section)
- Add a "Profile Display" section with:
  - View mode: radio/segmented control — Profile | Portfolio | Rich Portfolio (Rich Portfolio disabled + Pro badge for free users)
  - Scrim preset: visual swatches (Dark, Light, Teal, Warm) — show preview of how the scrim looks
  - Accent colour: colour swatches — small set of curated colours

### 9c. Validation schemas

**File:** `lib/validation/schemas.ts`
- Add `displaySettingsSchema` with the allowed values

---

## Part 10: Sub-Page Routes — Skeleton (1-2 hours)

Create the route files with basic rendering. Full design in 11b, but the URLs need to exist for the "See all" links to work.

### New files:

**`app/(public)/u/[handle]/endorsements/page.tsx`**
- Fetch user + all endorsements via existing queries
- Render full endorsement list (reuse `EndorsementCard`)
- Back link to `/u/{handle}`
- If viewer is the profile owner, show pin/unpin toggle on each card

**`app/(public)/u/[handle]/experience/page.tsx`**
- Fetch user + all attachments
- Render full experience list
- Back link

**`app/(public)/u/[handle]/certifications/page.tsx`**
- Fetch user + all certifications with detail (expiry, issuer)
- Back link

**`app/(public)/u/[handle]/gallery/page.tsx`**
- Fetch user + all gallery photos
- Photo grid with lightbox
- Back link

### Subdomain equivalents:
- These routes also need to work under `app/(public)/subdomain/[handle]/`
- Either duplicate the pages or use middleware rewrites
- **Recommendation:** Use a shared component for each, imported by both route groups

---

## Part 11: "View my CV" Button (30 min)

**What changes:**
Replace the minimal "View CV" text link with a styled button in the contact/utility area.

**File:** `components/public/PublicProfileContent.tsx`
- Replace the current `View CV` link + download icon with a proper button
- Style: outlined button, `FileText` icon, "View my CV" label
- Links to `/u/{handle}/cv`

---

## Build Order

```
Wave 0: Migration (schema foundation for all of 11a-c)
Wave 1: Layout + typography + accents (Parts 1, 2, 3)
  — type-check + drift-check
Wave 2: Contact + endorsements + stat line + margins (Parts 4, 5, 6, 7)
  — type-check + drift-check
Wave 3: CV on-demand + settings + sub-pages + CV button (Parts 8, 9, 10, 11)
  — type-check + drift-check
Full review chain: /review → /yachtielink-review → /test-yl
```

---

## Files Summary

### New files
```
supabase/migrations/YYYYMMDD_sprint11a_profile_rewrite.sql
components/public/ContactRow.tsx
app/api/profile/display-settings/route.ts
app/(public)/u/[handle]/endorsements/page.tsx
app/(public)/u/[handle]/experience/page.tsx
app/(public)/u/[handle]/certifications/page.tsx
app/(public)/u/[handle]/gallery/page.tsx
```

### Modified files
```
components/public/PublicProfileContent.tsx  — layout, contact, stat line, CV button, endorsement link
components/public/HeroSection.tsx           — full-width hero, stat line, safe-area margins
components/profile/ProfileAccordion.tsx     — font, icon, kill left-border
components/public/EndorsementCard.tsx       — clickable endorser, name display
components/public/sections/EndorsementsSection.tsx — cap at 3, see-all link
components/cv/CvActions.tsx                 — kill regenerate
app/(protected)/app/cv/page.tsx             — simplify CV page
app/api/cv/generate-pdf/route.ts            — on-demand repurpose
lib/queries/profile.ts                      — endorser handle, pinned sort
lib/queries/types.ts                        — endorser handle, pinned field
lib/validation/schemas.ts                   — display settings schema
app/(protected)/app/profile/settings/page.tsx — display settings UI
```

### NOT touched
```
app/(protected)/app/profile/page.tsx        — own-profile, separate layout
components/profile/ProfileSectionGrid.tsx   — own-profile component
components/pdf/ProfilePdfDocument.tsx        — PDF generation
app/api/cv/parse/route.ts                   — CV parsing
Any auth, network, insights, or more pages
```

---

## Exit Criteria

```
[ ] Desktop: single column, ~680px, centred — no side-by-side split
[ ] Section headings: DM Sans Medium, 14px, uppercase, letter-spaced
[ ] No teal left-borders on any section
[ ] Section icons render with correct colours
[ ] Contact shows as tappable icon row (email, phone, WhatsApp)
[ ] Endorsements: show full name, cap at 3, clickable to endorser profile
[ ] "See all" links work: /endorsements, /experience, /certifications, /gallery
[ ] Stat line in hero, not orphaned between sections
[ ] Top buttons have safe-area margin
[ ] CV page: no regenerate button, download triggers fresh generation
[ ] View mode + scrim + accent settings page exists and saves
[ ] /u/{handle}/cv still works (public CV preview)
[ ] Subdomain profile picks up all changes
[ ] npm run build zero errors
[ ] npm run drift-check PASS
[ ] Mobile-first: no regressions at 375px
```
