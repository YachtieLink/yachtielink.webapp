# Sprint 10.1 — Phase 1A Closeout

**Phase:** 1A (Final)
**Status:** 📋 Ready for execution
**Priority:** P0 — must complete before Phase 1B work
**Estimated effort:** 5–7 days
**Runs after:** PRs #96 + #97 merge (Waves 4–5)
**Runs before:** Sprint CV-Parse-Bugfix (Phase 1B)

---

## Why This Sprint Exists

Waves 1–5 shipped the core Phase 1A features (CV import, profile, entities, endorsements, public profile, PDF). The 2026-03-21 audit found gaps: missing pages, incomplete dark mode, unused animation presets, unpolished typography, and API edge cases. This sprint closes those gaps so Phase 1A merges to main as a solid, complete foundation for Phase 1B work.

**Without this sprint:** Phase 1B bugfixes land on a wobbly foundation. Dark mode incomplete, storage calls scattered, empty state patterns inconsistent.

**With this sprint:** Phase 1A is production-ready. Phase 1B can focus on bugs and features without foundation churn.

---

## Scope

### In — Core Completeness

**A. Missing Pages** (Phase 1A surfaces all CRUD)
- Education edit page (`/app/education/[id]/edit`) — load, edit, delete existing education records
- Saved profiles dedicated page (`/app/network/saved`) — extract from inline tab, server-side fetching, folder management
- API routes to support both: `GET /api/user-education/[id]`, `PATCH /api/saved-profiles/[id]`

**B. Dark Mode Implementation** (5 of 6 components missing `dark:` classes)
- `ProfileAccordion.tsx`, `PhotoGallery.tsx`, `ProfileStrength.tsx`, `SaveProfileButton.tsx`, `SectionManager.tsx` — add `dark:` variants
- Page-level dark: `insights/page.tsx` (chart colours), `AudienceTabs.tsx` (status pills), `SidebarNav.tsx` (badges)
- Full visual verification at 375px width

**C. Animation Consistency** (7 presets defined, zero used)
- Add `easeGentle` preset (for accordion/expand, no spring overshoot)
- Add `scrollReveal` viewport config (entrance animations on scroll)
- Wire presets into: `ProfileAccordion`, `IdentityCard`, `Toast`, `BottomSheet` (replace inline values)
- Add entrance animations to Sprint 10 components: `fadeUp`, `staggerContainer`, `cardHover`, `popIn`, `scrollReveal`

**D. Typography Consistency** (DM Serif Display loaded but unused)
- Apply `font-serif` to: profile names (hero), section headings, page titles (`<h1>` on profile/network/insights/cv/more)
- Remove synthetic bold (`font-semibold`/`font-bold`) from any heading with `font-serif`
- Verify rendering at all viewport sizes

**E. Route & Layout Cleanup**
- Delete `/app/audience` directory (deduplicate with `/app/network`)
- Fix bottom padding on edit pages (`pb-8` → `pb-24` to avoid BottomTabBar obscuring content at 375px)
- Delete empty macOS iCloud ghost directories under `app/api/`

**F. API & Database Hardening**
- Add error handling: `POST /api/stripe/portal`, `GET/PUT /api/endorsement-requests/[id]`, `GET /api/cron/*`
- Add Zod validation: `DELETE /api/saved-profiles`, `POST /api/profile/ai-summary`
- Fix health endpoint: query `users` table instead of non-existent `profiles`
- Storage buckets created in migration (not manual dashboard step)

**G. Storage Abstraction** (all `supabase.storage` calls → `lib/storage/`)
- Add `uploadUserPhoto()`, `deleteUserPhoto()`, `uploadGalleryItem()`, `deleteGalleryItem()`
- Refactor `profile/photos`, `profile/gallery`, and `DELETE /api/user-photos`, `DELETE /api/user-gallery` to use abstraction
- Add storage cleanup to `POST /api/account/delete` and `POST /api/cv/generate-pdf`
- Client-side image compression on photo/gallery uploads (max 1200px, WebP 0.85)

**H. Shared Component: EmptyState** (consolidate 3 patterns)
- Create `components/ui/EmptyState.tsx` with `variant: 'card' | 'inline'`
- Replace ad-hoc empty states in: `AboutSection`, `YachtsSection`, `CertsSection`, `EndorsementsSection`, `AudienceTabs`
- Dark mode support built in; becomes mounting point for Salty illustrations in Sprint 11

**I. Minor Fixes**
- `AudienceTabs` saved tab — replace `animate-pulse` with `<Skeleton>` component
- Badge colours — use `var(--color-error)` instead of `bg-red-500`
- "N more endorsements/photos" text — remove clickable styling or make it a button
- `admin.ts` — add `import 'server-only'` guard

### Out — Deferred

- Salty mascot (Sprint 11)
- Section colours / `accentColor` prop (Sprint 11)
- QR code on public profile (Sprint 11)
- "Endorse [Name]" CTA (Sprint 11)
- Any new features or data models
- Marketing page (Sprint 13)

---

## Dependencies

- **Prerequisite:** PRs #96 + #97 merged to main (Waves 4–5)
- **Blocker none:** All required tables, RPCs, and components exist
- **Foundation for:** Sprint CV-Parse-Bugfix, Sprint 11+

---

## Build Order (Dependency-Validated)

### Wave 0 — Unblock Everything (~2 hours)

These pieces enable parallel work on Waves 1–5.

- **H** — Create EmptyState component (card/inline variants, dark mode)
- **F (new routes)** — `GET /api/user-education/[id]`, `PATCH /api/saved-profiles/[id]`
- **F (migration)** — Storage bucket creation, no policy duplication (migration 021 already has policies)

### Wave 1 — Parallel Workstreams (5–6 days)

After Wave 0:

- **Agent A:** A (missing pages: education edit, saved profiles promotion) + G (storage abstraction)
- **Agent B:** B (dark mode on all components) + D (typography)
- **Agent C:** C (animation presets + wire into components)
- **Agent D:** E (route cleanup) + F (API hardening) + I (minor fixes)

### Wave 2 — Merge & Close

- Merge `feat/ui-refresh-phase1` → `main`
- Tag `v1.0-phase-1a`
- Update CHANGELOG.md

---

## Exit Criteria — All Required

- [ ] Education edit page works end-to-end (load → edit → save → delete)
- [ ] Saved profiles promoted to own page, server-side fetching, folder support
- [ ] All Sprint 10 components use `lib/motion.ts` presets (zero inline spring/ease)
- [ ] DM Serif Display visible on profile names and headings (weight 400, no synthetic bold)
- [ ] Dark mode: every page checked with toggle, no regressions
- [ ] No layout breaks at 375px — edit pages have `pb-24`
- [ ] `/app/audience` deleted, `/app/network` is canonical
- [ ] All API routes have try/catch + error handling
- [ ] Health endpoint queries correct table
- [ ] Storage buckets created in migration
- [ ] All `supabase.storage` calls routed through `lib/storage/` abstraction
- [ ] EmptyState component used in all empty-state locations
- [ ] Branch merged to main, tagged `v1.0-phase-1a`

---

## Estimated Effort

- **Wave 0:** 2 hours (unblocks everything)
- **Wave 1:** 4–5 days (parallel agents on 4 workstreams)
- **Wave 2:** 1 hour (merge + tag)
- **Total:** 5–7 days (parallel execution)
- **Sequential fallback:** 8–11 days (single developer)

---

## Notes

**Phase 1A is done after this sprint.** The gap between "features built" and "ready to hand off to Phase 1B" is exactly this work: complete the missing pieces, fix dark mode, wire animations, polish typography. Nothing new is added; everything is consolidated and hardened.

**Key decisions reflected:**
- `/app/network` is canonical (audience deleted entirely)
- DM Serif Display at weight 400 only (no synthetic bold)
- EmptyState component with card/inline variants (mounting point for Salty later)
- Animation presets used consistently (no inline spring/ease)
- Storage abstraction complete (provider-swappable)

**Risks:**
- Dark mode is deeper than expected — 5 components, 2 pages, mobile Safari compatibility. Budget 1–2 days.
- Animation pass touches many files — visual regressions risk. Test on mobile Safari.
- B and C touch same `.tsx` files — coordinate agent file ownership to avoid conflicts.
