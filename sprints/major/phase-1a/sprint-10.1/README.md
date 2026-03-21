# Sprint 10.1 — Close & Polish Phase 1A

**Phase:** 1A
**Status:** 📋 Planned
**Started:** —
**Completed:** —

## Goal

Full polish pass on everything Sprint 10 built. Fix every bug, inconsistency, and gap found in the 2026-03-21 audit so Phase 1A can merge to `main` as a clean, tight foundation for Phase 1B.

## Scope

In:
- Missing pages (education edit, saved profiles promotion)
- Dark mode implementation (not just QA — 5 of 6 new components have zero `dark:` classes)
- Animation pass (wire `lib/motion.ts` presets — currently 100% unused)
- Typography pass (wire DM Serif Display — currently loaded but never applied)
- Route cleanup (deduplicate `/app/audience` → `/app/network`)
- Layout bug fixes (`pb-8` → `pb-24` on edit pages, hardcoded hex colours)
- API hardening (missing try/catch, missing Zod validation, missing GET-by-ID route)
- DB migration fix (storage buckets not created in SQL)
- Storage abstraction completion (all `supabase.storage` calls through `lib/storage/`)
- Shared component consolidation (EmptyState with inline variant)
- Merge `feat/ui-refresh-phase1` → `main`

Out:
- Salty mascot (Sprint 11)
- Section colours / accentColor prop (Sprint 11)
- QR code on public profile (Sprint 11 — branded treatment)
- "Endorse [Name]" CTA on public profiles (Sprint 11)
- New features, new data models
- Marketing page

## Dependencies

- Sprint 10 code complete (it is)
- One new migration required (storage bucket creation — NO policy duplication)

---

## Key Deliverables

### A. Missing Pages

#### A1. `/app/education/[id]/edit`
- ⬜ Create `page.tsx` in the existing (empty) `education/[id]/edit/` directory
- ⬜ Add `GET /api/user-education/[id]` route — currently only GET-all exists, no GET-by-ID. Needed for pre-populating the edit form. (See F3)
- ⬜ Edit form matching `/app/education/new` pattern
- ⬜ Pre-populated from existing record via new `GET /api/user-education/[id]`
- ⬜ Zod validation with `userEducationSchema`
- ⬜ Optimistic update on save
- ⬜ Delete button with confirmation
- ⬜ Inline loading skeleton (match other edit pages)
- ⬜ Not-found handling if ID doesn't exist or doesn't belong to user

#### A2. Saved Profiles — Promote to Dedicated Page
> **Audit finding:** `AudienceTabs.tsx` already has a fully functional `SavedTab` (lines 393–522). Rather than building a duplicate, we promote the existing tab into its own route and replace the tab with a link.

- ⬜ Create `/app/network/saved/page.tsx` — extract and enhance the existing `SavedTab` logic from `AudienceTabs.tsx`
- ⬜ Server-side data fetching (current SavedTab is client-only with `useEffect` + silent error swallowing — fix this)
- ⬜ Group by folder (ungrouped first, then folders)
- ⬜ Folder CRUD: create, rename, delete via `/api/profile-folders`
- ⬜ Move profile to folder (use `moveToFolderSchema` via new `PATCH /api/saved-profiles/[id]` — see F3)
- ⬜ Each saved profile card: photo, name, role, "View profile" link
- ⬜ Unsave action (heart toggle)
- ⬜ Use `EmptyState` component (depends on H)
- ⬜ Loading skeleton (match `/app/network` pattern)
- ⬜ In `AudienceTabs.tsx`: replace the inline SavedTab with a link card pointing to `/app/network/saved` ("View saved profiles →")
- ⬜ Add `loading.tsx` for the new route

---

### B. Dark Mode Implementation

The audit found 5 of 6 Sprint 10 components have **zero** `dark:` classes. This is implementation work, not QA.

#### B1. Component dark mode
- ⬜ `ProfileAccordion.tsx` — add `dark:` variants for backgrounds, borders, text
- ⬜ `PhotoGallery.tsx` — add `dark:` variants
- ⬜ `ProfileStrength.tsx` — replace hardcoded hex arc colours (`#E5A832`, `#0D7377`, `#22c55e`). Use existing `--chart-*` variables where possible; create `--color-strength-low`, `--color-strength-mid`, `--color-strength-high` semantic tokens in `globals.css` with `.dark` overrides if needed
- ⬜ `SaveProfileButton.tsx` — add `dark:` variants
- ⬜ `SectionManager.tsx` — add `dark:` variants
- ⬜ `SocialLinksRow.tsx` — already has 2 `dark:` classes, verify complete

#### B2. Page-level dark mode
- ⬜ `insights/page.tsx` — replace hardcoded chart colours (`#0D7377`, `#0D9488`, `#14B8A6`) with `var(--chart-1)` through `var(--chart-3)` (already defined in `.dark` block of `globals.css`)
- ⬜ `AudienceTabs.tsx` — verify status pills (`bg-blue-500/10 text-blue-400`, `bg-emerald-500/10 text-emerald-400`) render acceptably on dark backgrounds; if not, add explicit `dark:` overrides
- ⬜ `SidebarNav.tsx` — notification badge uses `bg-red-500`, should use `bg-[var(--color-error)]` to match `BottomTabBar.tsx`

#### B3. Dark mode verification
- ⬜ Toggle dark mode and visually check every Sprint 10 page/component
- ⬜ Verify no white flashes, no invisible text, no missing borders

---

### C. Animation Pass

`lib/motion.ts` exports 7 presets. Zero are imported anywhere. All current Framer Motion usage is inline/ad-hoc with inconsistent spring values.

> **Audit finding:** Replacing `{duration: 0.2, ease: 'easeOut'}` with `springGentle` changes animation character — springs overshoot, eases don't. This is a **deliberate UX upgrade**, not a mechanical swap. Add `easeGentle` preset to `lib/motion.ts` as an alternative for height-expanding elements (accordions) where overshoot looks wrong.

#### C1. Extend `lib/motion.ts` presets
- ⬜ Add `easeGentle: { duration: 0.25, ease: 'easeOut' }` — for accordion/expand animations where spring overshoot is undesirable
- ⬜ Add `scrollReveal` viewport config: `{ whileInView: true, viewport: { once: true, margin: '-50px' } }` — currently only a variant, not a complete recipe

#### C2. Wire shared presets into existing components
- ⬜ `ProfileAccordion.tsx` — replace inline ease with `easeGentle` (not `springGentle` — accordion height expansion should not overshoot)
- ⬜ `IdentityCard.tsx` — replace inline ease with `easeGentle` (QR panel expand)
- ⬜ `Toast.tsx` — replace inline `{type: "spring", damping: 20, stiffness: 300}` with `springSnappy` (damping 20→24, slightly less bounce — acceptable)
- ⬜ `BottomSheet.tsx` — replace inline `{type: "spring", damping: 25, stiffness: 300}` with `springSnappy` (damping 25→24, near-identical)

#### C3. Add entrance animations to Sprint 10 components
- ⬜ `fadeUp` on page-level content wrappers (profile, network, insights, cv, more)
- ⬜ `staggerContainer` on card lists (endorsement cards, saved profiles, cert cards)
- ⬜ `cardHover` on interactive cards (yacht cards, endorsement cards, saved profile cards)
- ⬜ `popIn` on badges and counts (profile strength score, badge count, endorsement count)
- ⬜ `scrollReveal` on public profile sections (each accordion reveals on scroll using `whileInView`)

---

### D. Typography Pass

DM Serif Display is loaded (~15KB) but applied nowhere. Wire it in for visual hierarchy.

> **Audit finding:** DM Serif Display is loaded at weight 400 only. Applying `font-serif` + `font-semibold` triggers ugly synthetic bold. **Drop `font-semibold`/`font-bold` from any heading that receives `font-serif`** — the serif face provides its own visual weight at 400.

- ⬜ Public profile: apply `font-serif` to profile name in hero section (remove any `font-semibold`/`font-bold`)
- ⬜ Public profile: apply `font-serif` to section headings (About, Experience, etc.)
- ⬜ Page titles: apply `font-serif` to main `<h1>` on authenticated pages (Profile, Network, Insights, CV, More) — remove weight utilities
- ⬜ Auth pages: apply `font-serif` to `<h1>` (Welcome, Login, Signup) — remove weight utilities
- ⬜ Verify rendering at all viewport sizes — DM Serif can get tight at small sizes

---

### E. Route & Layout Cleanup

#### E1. Deduplicate audience/network
- ⬜ Delete `/app/(protected)/app/audience/` directory entirely
- ⬜ In `/app/network/page.tsx`: rename the exported function from `AudiencePage` to `NetworkPage`
- ⬜ Verify no internal links point to `/app/audience` (search codebase, update any references)
- ⬜ Both nav components already point to `/app/network` — confirm, no change needed

#### E2. Fix edit page bottom padding
- ⬜ Change `pb-8` → `pb-24` on: `about/edit`, `certification/[id]/edit`, `certification/new`, `more/account`, `profile/settings`, `profile/photo`
- ⬜ Verify content is not obscured by BottomTabBar on mobile (375px)

#### E3. Clean up ghost directories
- ⬜ Delete all empty macOS iCloud " 2" duplicate directories under `app/api/` (10 directories)
- ⬜ Do NOT delete `education/[id]/edit/` — A1 creates a page there

---

### F. API Hardening

#### F1. Missing error handling
- ⬜ `POST /api/stripe/portal` — wrap in try/catch + `handleApiError()`
- ⬜ `GET /api/endorsement-requests/[id]` — add `handleApiError()` wrapper
- ⬜ `PUT /api/endorsement-requests/[id]` — add `handleApiError()` wrapper
- ⬜ `GET /api/cron/analytics-nudge` — add try/catch
- ⬜ `GET /api/cron/cert-expiry` — add try/catch

#### F2. Missing validation
- ⬜ `DELETE /api/saved-profiles` — add Zod validation for `saved_user_id` (schema: `z.object({ saved_user_id: z.string().uuid() })`)
- ⬜ `POST /api/profile/ai-summary` — add minimal Zod schema for `{ force?: boolean }`

#### F3. New routes
- ⬜ `GET /api/user-education/[id]` — return single education record by ID. Auth + ownership check. Needed by A1.
- ⬜ `PATCH /api/saved-profiles/[id]` — move a saved profile to a different folder. Uses `moveToFolderSchema` (already defined in schemas.ts). Auth + ownership check. Needed by A2.

#### F4. Health endpoint fix
- ⬜ `GET /api/health/supabase` — fix query from `profiles` table (doesn't exist) to `users` table
- ⬜ Sanitise error messages (don't leak Supabase internals)

---

### G. Database Migration + Storage Fixes

One migration to fix deployment risks + storage hardening. See `docs/yl_storage_plan.md` (v2.0) for full context.

> **Audit finding:** Migration 021 already created RLS policies for `user-photos` and `user-gallery`. The new migration must ONLY add `INSERT INTO storage.buckets` rows — do NOT duplicate `CREATE POLICY` statements or they will conflict.

#### G1. Storage bucket creation
- ⬜ Create migration `20260321000001_fix_storage_buckets.sql`
- ⬜ Add `INSERT INTO storage.buckets` for `user-photos` (public, 5 MB limit, `image/jpeg`, `image/png`, `image/webp`) — policies already exist from migration 021
- ⬜ Add `INSERT INTO storage.buckets` for `user-gallery` (public, 5 MB limit, `image/jpeg`, `image/png`, `image/webp`) — policies already exist from migration 021
- ⬜ Fix `yacht-photos` RLS: add `AND deleted_at IS NULL` to attachment check (ex-crew can currently still write)

#### G2. Function consistency
- ⬜ Update `get_sea_time()` to add `SECURITY DEFINER`, `SET search_path = public`, and `public.` schema prefix (currently inconsistent with all other functions)

#### G3. Storage abstraction completion
- ⬜ Add `uploadUserPhoto()`, `deleteUserPhoto()` to `lib/storage/upload.ts`
- ⬜ Add `uploadGalleryItem()`, `deleteGalleryItem()` to `lib/storage/upload.ts`
- ⬜ Refactor `profile/photos/page.tsx` to use `uploadUserPhoto()` instead of direct `supabase.storage` call
- ⬜ Refactor `profile/gallery/page.tsx` to use `uploadGalleryItem()` instead of direct `supabase.storage` call
- ⬜ Refactor `DELETE /api/user-photos/[id]` to use `deleteUserPhoto()`
- ⬜ Refactor `DELETE /api/user-gallery/[id]` to use `deleteGalleryItem()`
- ⬜ All `supabase.storage` calls now routed through `lib/storage/` (provider-swappable)

#### G4. Storage cleanup gaps
- ⬜ Add `user-photos/{user_id}/` and `user-gallery/{user_id}/` to `POST /api/account/delete` cleanup
- ⬜ In `POST /api/cv/generate-pdf`: delete previous PDF (from `users.latest_pdf_path`) before writing new one
- ⬜ Add client-side image compression to `user-photos` and `user-gallery` uploads (Canvas resize max 1200px, WebP 0.85 — same pattern as avatar)

---

### H. Shared Component: EmptyState

Three different empty state patterns exist. Consolidate before Sprint 11 adds Salty illustrations.

> **Audit finding:** Three profile sections (About, Yachts, Certs) render empty states inline inside existing cards. A standalone card wrapper would create double-borders. The component needs a `variant` prop.

- ⬜ Create `components/ui/EmptyState.tsx` — props: `icon?` (emoji or component), `title`, `description?`, `actionLabel?`, `actionHref?`, `variant: 'card' | 'inline'`
- ⬜ `variant='card'`: renders its own `p-6 text-center` card wrapper (for standalone use in AudienceTabs, saved profiles page)
- ⬜ `variant='inline'`: renders just the text content without a card shell (for use inside AboutSection, YachtsSection, CertsSection which already have a card wrapper)
- ⬜ Replace ad-hoc empty states in: `AboutSection` (inline), `YachtsSection` (inline), `CertsSection` (inline), `EndorsementsSection` (inline), `AudienceTabs` endorsements (card), `AudienceTabs` colleagues (card)
- ⬜ Dark mode support built in from day one
- ⬜ This component becomes the mounting point for Salty illustrations in Sprint 11

---

### I. Minor Fixes

- ⬜ `AudienceTabs.tsx` saved tab — replace raw `animate-pulse` div with `<Skeleton>` component
- ⬜ `SidebarNav.tsx` — change `bg-red-500` badge to `bg-[var(--color-error)]`
- ⬜ `PublicProfileContent.tsx` — "N more endorsements" text: make it a button that expands to show all, or remove the `text-[var(--color-interactive)]` styling so it doesn't look clickable
- ⬜ `PublicProfileContent.tsx` — "N more photos" text: same fix
- ⬜ Privacy page — add TODO comment to CHANGELOG as a pre-launch blocker (business address needed)
- ⬜ `admin.ts` — add `import 'server-only'` guard at top of file (will cause deliberate build error if accidentally imported in a Client Component)
- ⬜ Commit the 4 uncommitted sprint doc files before starting work (clean baseline)

---

### J. Git

- ⬜ Merge `feat/ui-refresh-phase1` → `main`
- ⬜ Tag `v1.0-phase-1a`
- ⬜ Update CHANGELOG.md

---

## Build Order (Dependency-Validated)

```
Wave 0 — Unblock everything (~2 hours):
  H   EmptyState component (with inline/card variants)
  F3  New API routes: GET /api/user-education/[id] + PATCH /api/saved-profiles/[id]
  G1  Migration SQL (bucket creation ONLY, no policy duplication)

Wave 1 — Parallel workstreams:
  Agent A: A1 (education edit page) + A2 (saved profiles promotion)
  Agent B: B (dark mode) + D (typography)
  Agent C: C (animation pass — extend presets first, then wire)
  Agent D: E (route cleanup) + F1/F2/F4 (API hardening) + I (minor fixes)
  Agent E: G2 + G3 + G4 (storage chain)

Wave 2:
  J   Merge + tag (blocks on ALL above)
```

## Exit Criteria

- Education edit page works end-to-end (load → edit → save → delete → verify)
- Saved profiles promoted to own page with server-side data fetching and folder support
- All Sprint 10 components use `lib/motion.ts` presets (zero inline spring/ease values)
- DM Serif Display visible on profile names and page headings (at weight 400, no synthetic bold)
- No dark mode regressions — every page checked with toggle
- No layout breaks at 375px — edit pages have correct bottom padding
- `/app/audience` removed, `/app/network` is sole route (function renamed)
- All API routes have try/catch + handleApiError
- Health endpoint queries the correct table
- Storage buckets created in migration (not manual dashboard step)
- All `supabase.storage` calls routed through `lib/storage/` abstraction
- EmptyState component (card + inline variants) used in all empty-state locations
- Branch merged to `main`, clean git state, tagged

## Estimated Effort

5–7 days with parallel agents (Wave 0 + 4-5 concurrent workstreams)
8–11 days sequential (single developer)

## Notes

**Audit source:** Full 6-agent audit conducted 2026-03-21 covering routes, UI consistency, API validation, database schema, Sprint 10 completion, and public profile experience. Followed by 3-agent verification audit that found 8 additional issues, all folded in.

**Key decisions:**
- `/app/network` is canonical (audience deleted, function renamed)
- DM Serif Display wired in now at weight 400 (drop font-semibold from serif headings)
- QR code left for Sprint 11 branded treatment
- "Endorse [Name]" CTA deferred to Sprint 11
- EmptyState component built with card/inline variants as Salty mounting point
- Animation: `easeGentle` added for accordion/expand (no spring overshoot), `springGentle`/`springSnappy` for entrances/transitions
- Saved profiles: promote existing SavedTab to own route, don't build duplicate
- Storage migration: bucket INSERT only, no policy duplication (021 already has them)

**Risks:**
- Dark mode is deeper than expected — 5 components need full implementation. Budget 1-2 days.
- Animation pass touches many files — risk of visual regressions. Test on mobile Safari.
- C3 (`scrollReveal` with `whileInView`) is scope creep risk — keep it simple, no intersection observers.
- DM Serif Display at 400 weight renders differently per OS — test on Windows/Android if possible.
- B and C touch the same .tsx files — coordinate agent file ownership to avoid git conflicts.

**Key Files:**
- [build_plan.md](./build_plan.md) — full implementation spec (Part 1–8)
- `docs/yl_storage_plan.md` (v2.0) — storage architecture and migration strategy
