# Sprint 10.1 — Phase 1A Closeout

**Phase:** 1A (Final)
**Status:** 📋 Ready for execution
**Priority:** P0 — must complete before Phase 1B work
**Estimated effort:** 4–5 days (revised down from 5-7, API routes pre-exist)
**Runs after:** PRs #96 + #97 merge (Waves 4–5)
**Runs before:** Sprint CV-Parse-Bugfix (Phase 1B)

---

## Why This Sprint Exists

Waves 1–5 shipped the core Phase 1A features (CV import, profile, entities, endorsements, public profile, PDF). The 2026-03-21 audit found gaps: incomplete dark mode, unused animation presets, unpolished typography, and missing public layout infrastructure. This sprint closes those gaps so Phase 1A merges to main as a solid, complete foundation for Phase 1B work.

**Without this sprint:** Phase 1B bugfixes land on a wobbly foundation. Dark mode incomplete, animations inconsistent, public pages have no layout wrapper.

**With this sprint:** Phase 1A is production-ready. Phase 1B can focus on bugs and features without foundation churn.

---

## Scope

### In — Core Completeness

**A. Missing Pages** (Phase 1A surfaces all CRUD)
- Education edit page (`/app/education/[id]/edit`) — **page.tsx already exists and is fully implemented** (Mar 22). Verify it matches expected UX pattern.
- Saved profiles dedicated page (`/app/network/saved`) — extract from inline tab, server-side fetching, folder management
- Supporting API routes: **GET /api/user-education/[id] and PATCH /api/saved-profiles/[id] already exist**. Verify they work correctly.

**B. Dark Mode Implementation** (5 of 6 components with zero `dark:` classes)
- `ProfileAccordion.tsx`, `PhotoGallery.tsx`, `ProfileStrength.tsx`, `SaveProfileButton.tsx`, `SectionManager.tsx` — add `dark:` variants
- Page-level dark: `insights/page.tsx` (chart colours), `AudienceTabs.tsx` (status pills), `SidebarNav.tsx` (badges)
- Full visual verification at 375px width

**C. Animation Consistency** (12 presets defined, zero used)
- Presets already exist in `lib/motion.ts` (springSnappy, springGentle, easeFast, fadeUp, fadeIn, staggerContainer, cardHover, buttonTap, scrollReveal, easeGentle, scrollRevealViewport, popIn)
- Wire presets into: `ProfileAccordion`, `IdentityCard`, `Toast`, `BottomSheet` (replace inline values)
- Add entrance animations to Sprint 10 components

**D. Typography Consistency** (DM Serif Display loaded but unused)
- Apply `font-serif` to: profile names (hero), section headings, page titles
- Remove synthetic bold from serif headings
- Verify rendering at all viewport sizes

**E. Route & Layout Cleanup**
- Delete `/app/audience` directory (deduplicate with `/app/network`)
- Fix bottom padding on edit pages (`pb-8` → `pb-24`)
- Delete empty macOS iCloud ghost directories under `app/api/`

**F. API & Database Hardening**
- Add error handling: `POST /api/stripe/portal`, `GET/PUT /api/endorsement-requests/[id]`, `GET /api/cron/*`
- Add Zod validation: `DELETE /api/saved-profiles`, `POST /api/profile/ai-summary`
- Fix health endpoint: query `users` table instead of non-existent `profiles`
- Storage buckets created in migration (not manual dashboard step)

**G. Storage Abstraction** (all `supabase.storage` calls → `lib/storage/`)
- `lib/storage/upload.ts` already has comprehensive functions: `uploadUserPhoto()`, `deleteUserPhoto()`, `uploadGalleryItem()`, `deleteGalleryItem()`, and more
- Refactor `profile/photos`, `profile/gallery`, and `DELETE /api/user-photos`, `DELETE /api/user-gallery` to use existing abstraction
- Add storage cleanup to `POST /api/account/delete` and `POST /api/cv/generate-pdf`
- Client-side image compression on photo/gallery uploads (max 1200px, WebP 0.85)

**H. Shared Component: EmptyState** (consolidate 3 patterns)
- Create `components/ui/EmptyState.tsx` with `variant: 'card' | 'inline'`
- Replace ad-hoc empty states in: `AboutSection`, `YachtsSection`, `CertsSection`, `EndorsementsSection`, `AudienceTabs`
- Dark mode support built in; becomes mounting point for Salty illustrations in Sprint 11

**I. Public Layout Infrastructure** (needed for Sprint 13, add here to unblock)
- Create `app/(public)/layout.tsx` — wrapper for public pages
- Create `components/public/PublicHeader.tsx` — logo, sign up/login, responsive menu
- Create `components/public/PublicFooter.tsx` — links (terms, privacy, roadmap), copyright
- Apply to: marketing page (`/`), legal pages (`/privacy`, `/terms`), roadmap page
- This is a blocker for Sprint 13; build it here to close Phase 1A infrastructure

**J. Minor Fixes**
- `CookieBanner.tsx` (note: file is named `CookieBanner`, not `CookieConsent` as previously referenced) — component exists, may need text updates
- Badge colours — use `var(--color-error)` instead of `bg-red-500`
- "N more endorsements/photos" text — remove clickable styling or make it a button
- `admin.ts` — add `import 'server-only'` guard

### Out — Deferred

- Salty mascot (Sprint 11)
- Section colours / `accentColor` prop (Sprint 11)
- QR code on public profile (Sprint 11)
- "Endorse [Name]" CTA (Sprint 11)
- Any new features or data models
- Marketing page content (Sprint 13)

---

## Dependencies

- **Prerequisite:** PRs #96 + #97 merged to main (Waves 4–5)
- **Blocker none:** All required tables, RPCs, and components exist
- **Foundation for:** Sprint CV-Parse-Bugfix, Sprint 11+
- **Blocks Sprint 13:** Public layout infrastructure (add to this sprint to unblock)

---

## Build Order (Dependency-Validated)

### Wave 0 — Public Infrastructure + Unblock Everything (~1.5 days)

These pieces enable parallel work on Waves 1–5 AND unblock Sprint 13.

- **I** — Create public layout, header, footer (infrastructure for Sprint 13)
- **H** — Create EmptyState component (card/inline variants, dark mode)
- **F (migration)** — Storage bucket creation, health endpoint fix

### Wave 1 — Parallel Workstreams (3–4 days)

After Wave 0:

- **Agent A:** A (verify education edit page works correctly) + J (minor fixes, CookieBanner text)
- **Agent B:** B (dark mode on all components) + D (typography)
- **Agent C:** C (animation presets + wire into components)
- **Agent D:** E (route cleanup) + F (API hardening) + G (storage abstraction)

### Wave 2 — Merge & Close

- Verify all changes work at 375px (mobile)
- Merge `feat/ui-refresh-phase1` → `main`
- Tag `v1.0-phase-1a`
- Update CHANGELOG.md

---

## Exit Criteria — All Required

- [ ] Education edit page verified functional (load → edit → save → delete)
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
- [ ] Public layout, header, footer exist and applied to public routes
- [ ] Public header/footer responsive at 375px
- [ ] Branch merged to main, tagged `v1.0-phase-1a`

---

## Estimated Effort (Revised)

- **Wave 0:** 1.5 days (public infrastructure + EmptyState + migration)
- **Wave 1:** 2.5–3 days (parallel agents on 4 workstreams; education edit already exists, verification only)
- **Wave 2:** 0.5 day (merge + tag)
- **Total:** 4–5 days (revised down from 5–7; API routes + education page pre-exist)

---

## Notes

**Phase 1A is done after this sprint.** The gap between "features built" and "ready to hand off to Phase 1B" is exactly this work: complete the missing pieces (public layout), fix dark mode, wire animations, polish typography. Nothing new is added; everything is consolidated and hardened.

**Public layout is critical for Sprint 13.** Don't defer it — build it here in Wave 0 so Sprint 13 can focus on marketing content and ops, not infrastructure.

**Education edit page already exists.** The sprint scope is to verify it's correct, not build it from scratch. Same for API routes — just verify they work.

**Key decisions reflected:**
- `/app/network` is canonical (audience deleted entirely)
- DM Serif Display at weight 400 only (no synthetic bold)
- EmptyState component with card/inline variants (mounting point for Salty later)
- Animation presets used consistently (no inline spring/ease)
- Storage abstraction complete (provider-swappable)
- Public layout built here to unblock Sprint 13

**Risks:**
- Dark mode is deeper than expected — 5 components, 2 pages. Budget 1–2 days.
- Animation pass touches many files — visual regressions risk on mobile Safari.
- B and C touch same files — coordinate agent file ownership to avoid conflicts.
