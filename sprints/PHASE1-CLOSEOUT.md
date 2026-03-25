# Phase 1 Close-Out Checklist

**Goal:** Ship the complete Phase 1 product with a clean codebase. Three weeks, cleanup integrated into every wave.

**How to use this file:** At session start, read this checklist. Find the first unchecked item. That's your task. Update the checkboxes and notes as you go. If you're blocked, check the Blockers section.

**Last updated:** 2026-03-25

---

## Blockers (resolve before anything moves)

- [x] **D1-D8 design decisions** — Resolved 2026-03-25. D1: two-step normalize+fuzzy (maritime cert alias map). D2: 1mo overlap OK. D3: country name. D4: libphonenumber-js. D5: deferred post-launch. D6: scale, no h-scroll ever. D7: list-based. D8: upsert on user+yacht+role.
- [x] **Vercel Pro upgrade** — Purchased 2026-03-25 on YachtieLink credit card (ari@yachtie.link). Env config TBD at deploy time.
- [x] **Legal business address** — Deferred. Using ari@yachtie.link as GDPR contact until a physical desk is secured.

---

## Week 1: Unblock + Foundation + Core Fixes

### Session 1 — Unblock Everything
- [ ] Answer D1-D8 (founder + agent walkthrough)
- [ ] Upgrade Vercel to Pro
- [ ] Commit all uncommitted docs/tooling from 2026-03-25 session
- [ ] Update drift baseline after commit: `npm run drift-check:baseline`

### Session 2 — Sprint 10.1 (Phase 1A Polish)
- [ ] Education edit page
- [ ] Saved profiles → dedicated route
- [ ] Dark mode on remaining 5 components
- [ ] Animation pass (7 motion presets across 10+ components)
- [ ] Route cleanup: `/app/audience` → `/app/network`
- [ ] API hardening (5 routes try/catch, 2 routes Zod validation)
- [ ] EmptyState shared component
- [ ] Tag `v1.0-phase-1a` after merge
- [ ] Run `/review`, update drift baseline

### Session 3 — Wave 1: Data Integrity + CV Consolidation
- [ ] Cert/attachment dedup (D1, D8 decisions applied)
- [ ] Date overlap validation (D2 decision applied)
- [ ] **Cleanup:** Collapse `saveParsedCvData()` + `saveConfirmedImport()` into one save contract
- [ ] **Cleanup:** Route onboarding CV persistence through canonical pipeline
- [ ] **Cleanup:** Delete `CvReviewClient` (confirmed dead)
- [ ] **Cleanup:** Remove `cv_parsed_data` sessionStorage flow
- [ ] **Cleanup:** Remove unused props from `CvImportWizard` (`existingAttachments`, `existingCerts`, `existingEducation`)
- [ ] Run `/review`, update drift baseline
- [ ] **Baseline target:** legacy-cv-path errors → 0

### Session 4 — Wave 2: Public Profile + Shared Read Models
- [ ] Hero fields fix
- [ ] CV 404 fix
- [ ] Responsive layout fixes
- [ ] Share/download functionality
- [ ] **Cleanup:** Extract shared CV section query builder (used by owner preview, public CV, PDF)
- [ ] **Cleanup:** Move viewer-relationship logic from `app/(public)/u/[handle]/page.tsx` to shared helper
- [ ] **Cleanup:** Split `PublicProfileContent.tsx` (646 LOC) into section components
- [ ] **Cleanup:** Replace `any[]` with typed props from shared reader
- [ ] **Cleanup:** Consolidate duplicate 6-query patterns across CV pages
- [ ] Run `/review`, update drift baseline
- [ ] **Baseline target:** weak-typing warnings in profile surfaces halved, hotspot warnings reduced

---

## Week 2: Wizard, Profile, Network + Media Cleanup

### Session 5 — Wave 3: Import Wizard UX + Onboarding Handoff ✅
- [x] Languages support
- [x] Bio field handling
- [x] Phone formatting (D4: `libphonenumber-js`)
- [x] Date consistency
- [x] Editable cards in review flow
- [x] **Cleanup:** Remove duplicate `ConfirmedImportData` construction
- [x] **Cleanup:** Ensure onboarding completion uses canonical import pipeline
- [x] Run `/review`, update drift baseline

### Session 6 — Wave 4: Profile Page + Skills
- [ ] Personal details card
- [ ] Editability improvements
- [ ] Skills chip UX
- [ ] Section counts
- [ ] **Cleanup:** Extract settings load/save logic from `ProfileSettingsPage` (445 LOC)
- [ ] Run `/review`, update drift baseline

### Session 7 — Wave 5: Network Tab + Endorsement Cleanup
- [ ] Yacht graph (list-based, D7 decision applied)
- [ ] Endorsement/colleague grouping by yacht
- [ ] **Cleanup:** Extract shared colleague/network assembly
- [ ] **Cleanup:** Slim `RequestEndorsementClient.tsx` (546 LOC) — extract send/share logic to helpers
- [ ] **Cleanup:** Remove duplicate request-posting behavior
- [ ] Run `/review`, update drift baseline

### Session 8 — Media/CRUD Standardization (Junior Sprint)
- [ ] Consolidate `app/api/user-photos/route.ts` + `app/api/user-gallery/route.ts` (duplicate auth, limits, reorder)
- [ ] Extract shared media upload/delete helpers from `lib/storage/upload.ts`
- [ ] Route all `subscription_status === 'pro'` through `getProStatus()`
- [ ] Standardize reorder handling
- [ ] Run `/review`, update drift baseline
- [ ] **Baseline target:** pro-gate errors → 0

---

## Week 3: Onboarding, Graph, Launch

### Session 9-10 — Sprint 11: Onboarding Rebuild
- [ ] CV upload → auto-populate profile flow
- [ ] Section colours
- [ ] Onboarding polish and edge cases
- [ ] Run `/review`, update drift baseline

### Session 11-12 — Sprint 12: Yacht Graph + Network
- [ ] Yacht detail page
- [ ] Colleague explorer
- [ ] Sea time calculation
- [ ] Attachment transfer
- [ ] Run `/review`, update drift baseline

### Session 13-14 — Sprint 13: Launch
- [ ] Marketing/landing page
- [ ] Production environment (domains, SEO, env vars)
- [ ] Full QA pass — run complete [smoke checklist](../docs/ops/critical-flow-smoke-checklist.md)
- [ ] Legal sign-off (business address in terms/privacy)
- [ ] Final drift check: `npm run drift-check:all` — target near-zero errors, warnings under 30
- [ ] Deploy to production in invite mode
- [ ] Tag `v1.0-launch`

---

## Active Junior Sprints (pick up between sessions or in parallel)

- [ ] debug-cv-parse-extraction (High — blocks CV uploads for some files)
- [ ] debug-photo-upload-limit (Medium — wrong limit for free users)
- [ ] debug-cv-regenerate-date (Low — cosmetic)
- [ ] ui-public-profile-button-margin (Low — cosmetic)

---

## Post-Launch Queue (Phase 1 done, these are next)

- Ensign flags for yacht entries (D5 — source maritime flag SVGs, store in `/public/ensigns/`)
- Ghost Profiles & Claimable Accounts (design complete, 24 decisions — viral growth loop)
- Endorsement Writing Assist (design complete, 12 decisions — no schema changes)
- CV Actions Card Redesign (design complete)
- feature-pro-subdomain-link (planned junior sprint)
- feature-cv-sharing-rework (planned junior sprint)
- feature-saved-profiles-rework (planned junior sprint)

---

## Session Start Checklist

Every session, before doing anything:

1. Read this file — find the first unchecked item
2. Read `STATUS.md` — check for new blockers or changes from other sessions
3. Read the latest `CHANGELOG.md` entry — know what happened last
4. If starting a wave/sprint: read its README for full scope
5. At session end: update checkboxes here, run `/shipslog`
