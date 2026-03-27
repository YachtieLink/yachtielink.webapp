# Sprint CV-Parse Bugfix — Phase 1B Bug Rally

**Phase:** 1B
**Priority:** P0 — blocks onboarding quality, go-live readiness
**Status:** 📋 Ready for execution
**Runs after:** Sprint 10.1 complete (Phase 1A closed)
**Runs before:** Sprint 11 (CV onboarding rebuild)
**Type:** Bugfix rally — 37 QA bugs from founder walkthrough (2026-03-24)
**Estimated effort:** 5–7 days (5 waves, parallel-capable)

---

## Why This Sprint Exists

Waves 1–5 shipped the core CV import feature. The founder QA'd the entire flow (2026-03-24) and found 37 bugs across import wizard, profile page, public profile, network tab, and data integrity. Many are data corruption issues (cert stacking, attachment duplication) and missing display fields (age, sea time, flags) that make the feature feel unfinished.

These bugs degrade onboarding (the core user journey). Fixing them is the prerequisite for Phase 1B work and eventual go-live.

---

## Bug Inventory (37 bugs, 7 groups)

### Group A: Data Integrity — Dedup & Stacking (5 bugs) — **P0**

Multiple CV uploads create duplicate data. This is the highest-impact category.

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 4/17 | Certifications stack on multiple CV uploads — no fuzzy dedup | P0 | Confirmed in `saveConfirmedImport` |
| 38 | Attachments stack on multiple uploads — no user+yacht+role dedup | P0 | Missing from save layer |
| 19 | No overlapping date validation on yacht employment | P1 | Validation missing |
| 20 | Skills/hobbies stacking on multiple uploads | P1 | Save has dedup but may not run |
| 3 | CV view 404 — `cv_public` or `latest_pdf_path` not set after parse | P1 | Route exists, data state issue |

### Group B: Public Profile — Missing Data (6 bugs) — **P0/P1**

Public profile hero is missing critical fields that captains look for.

| # | Bug | Severity |
|---|-----|----------|
| 25 | Country flag missing from public profile hero | P1 |
| 26 | Sea time placement — in body but not hero | P1 |
| 27 | Age missing from public profile hero | P1 |
| 32 | Yacht entries need ensign flags (not country flags) | P2 |
| 31 | Yacht names in experience not clickable | P1 |
| 28 | CV view shows blank / 404 | P1 |

### Group C: CV View & Sharing (2 bugs) — **P1**

| # | Bug | Severity |
|---|-----|----------|
| 29 | CV view requires horizontal scroll on mobile | P1 |
| 30 | No share or download buttons on CV view | P1 |

### Group D: Import Wizard UX (11 bugs) — **P1/P2**

Wizard flow has editing gaps and bad UX patterns.

| # | Bug | Severity |
|---|-----|----------|
| 2 | ParseProgress bar animated jump on Step 2 | P2 |
| 6 | Step 1 — can't add languages if parse didn't extract them | P1 |
| 7 | Phone number not formatted | P2 |
| 8 | Date format inconsistent across app | P1 |
| 1/12 | Bio not shown or editable on Step 1 | P1 |
| 9 | Nationality shows country name not demonym | P2 |
| 10 | Yacht matching unclear — says "new" but yachts exist | P1 |
| 11 | Dates on experience cards show raw ISO | P1 |
| 13 | Qualifications not editable in wizard | P2 |
| 14 | Education not editable in wizard | P2 |
| 16 | "Tap + to add" copy but no + button present | P2 |

### Group E: Skills & Interests UX (1 bug) — **P1**

| # | Bug | Severity |
|---|-----|----------|
| 15 | Skills chip UX — unclear delete, can't re-add, "(saved)" items not removable | P1 |

### Group F: Profile Page — Missing Sections & Editability (6 bugs) — **P1/P2**

New CV parse fields aren't accessible from the profile page.

| # | Bug | Severity |
|---|-----|----------|
| 5 | Edit on most sections only allows adding new, not editing existing | P1 |
| 18 | Experience shows "No experience added yet" despite imported entries | P1 |
| 21 | Personal Details buried in Settings, should be on profile | P1 |
| 22 | No individual visibility toggles for personal detail fields | P2 |
| 23 | Visa/Travel Documents not visible from profile | P1 |
| 24 | Languages row not editable | P1 |

### Group G: Network Tab — Graph & Grouping (4 bugs) — **P1/P2**

| # | Bug | Severity |
|---|-----|----------|
| 34 | Network tab missing yacht graph/exploration | P1 |
| 35 | Can't save/bookmark yachts | P2 |
| 36 | Endorsements not grouped by yacht | P1 |
| 37 | Colleagues not grouped by yacht | P1 |

---

## Proposed Wave Order

| Wave | Groups | Focus | Est. Effort | Dependency |
|------|--------|-------|-------------|------------|
| 1 | A | Data integrity: dedup, overlap validation | Large | None |
| 2 | B + C | Public profile hero + CV view fixes | Medium | Wave 1 complete |
| 3 | D | Import wizard UX fixes | Large | formatDate utility (Wave 2) |
| 4 | E + F | Profile page sections, skills UX, editability | Medium | Wave 1 complete |
| 5 | G | Network tab — yacht graph, grouping | Large | Wave 4 complete |

**Key dependency:** `formatDate.ts` utility created in Wave 2 (needed by Wave 3). All other waves are independent after Wave 1 completes.

---

## Wave Specifications

### Wave 1: Data Integrity (P0) — Large Effort

**What:** Fix the worst bugs first. Multiple uploads shouldn't corrupt data.

**What you'll change:**
- `lib/cv/save-parsed-cv-data.ts` — cert fuzzy dedup, attachment dedup, skill dedup verification, overlap validation
- `components/cv/CvImportWizard.tsx` — error handling for overlapping dates (warn + block, 1-month tolerance)
- Certs: two-step normalization (maritime alias map) then fuzzy match (Levenshtein ≤ 2 or ≥ 0.85)
- Attachments: upsert on `user_id + yacht_id + role`, enrich if exists
- Skills/hobbies: verify existing dedup runs correctly
- Yachts: validate no overlapping dates (allow 1-month tolerance, warn)

**Exit:** Multiple uploads don't create duplicate certs/attachments/skills. Yacht date overlaps caught at save time.

**Files:**
- `lib/cv/save-parsed-cv-data.ts`
- `components/cv/CvImportWizard.tsx`
- `app/(protected)/app/attachment/[id]/edit/page.tsx`

---

### Wave 2: Public Profile + CV View (P0/P1) — Medium Effort

**What:** Make the public-facing profile show real data. Fix CV view 404.

**What you'll change:**
- Create `lib/utils/formatDate.ts` utility (needed by Wave 3 too)
- Public profile hero: add age, sea time, country flag (query + component changes)
- CV view: set `cv_public` + `latest_pdf_path` after parse/generation (fixes 404)
- CV view: responsive scaling `transform: scale()` (no horizontal scroll)
- CV view: add share button + download button
- Yacht ensign flag assets + rendering (deferred post-launch per D5, use placeholder for now)
- Clickable yacht names (link to `/app/yacht/[id]`)

**Exit:** Public profile hero shows age, sea time, flag. CV view renders, no 404, has share/download. Mobile CV view doesn't scroll.

**Files:**
- `lib/utils/formatDate.ts` (new)
- `components/public/PublicProfileContent.tsx`
- `components/public/HeroSection.tsx`
- `components/profile/ProfileHeroCard.tsx`
- `app/(public)/u/[handle]/page.tsx`
- `app/(public)/u/[handle]/cv/page.tsx`
- `components/cv/CvPreview.tsx`

---

### Wave 3: Import Wizard UX (P1/P2) — Large Effort

**What:** Polish the import flow. (Depends on `formatDate.ts` from Wave 2.)

**What you'll change:**
- ParseProgress bar: set initial width without animation on resume
- Step 1: add languages input, bio textarea
- Phone number: format using `libphonenumber-js`
- Nationality: label (not demonym)
- Yacht match: clarity on new vs existing
- Experience/cert/education cards: make them editable
- Copy: fix "+ to add" when button doesn't exist
- Date display: use `formatDate.ts` from Wave 2

**Exit:** All wizard steps are editable. Phone numbers format. Dates are consistent. Progress bar smooth. No confusing copy.

**Files:**
- `components/cv/CvImportWizard.tsx`
- `components/cv/steps/StepPersonal.tsx`
- `components/cv/steps/StepExperience.tsx`
- `components/cv/steps/StepQualifications.tsx`
- `components/cv/steps/StepExtras.tsx`
- `lib/utils/formatPhone.ts` (new)

---

### Wave 4: Profile Page + Skills UX (P1/P2) — Medium Effort

**What:** Surface CV parse fields on the profile page. Fix skills UX.

**What you'll change:**
- Personal Details card with individual visibility toggles
- Visa/Travel Docs row (visible on profile)
- Languages row with edit link
- Experience list: show imported entries, edit existing (not just add new)
- "No experience added yet" bug: fix `ProfileSectionGrid` rendering
- Skills chip UX: explicit x buttons, add input field, removable saved items

**Exit:** All CV-imported fields visible on profile. Can edit any section entry. Skills chips are clear and manageable.

**Files:**
- `app/(protected)/app/profile/page.tsx`
- `app/(protected)/app/profile/settings/page.tsx`
- `app/(protected)/app/languages/edit/page.tsx`
- `app/(protected)/app/attachment/[id]/edit/page.tsx`
- `components/profile/ProfileSectionGrid.tsx`
- Section list components (updated/new)

---

### Wave 5: Network Tab (P1/P2) — Large Effort

**What:** Yacht graph and proper grouping in Network tab.

**What you'll change:**
- Add Yachts tab to Network (list of yachts user has worked on)
- Group endorsements by yacht (collapsed by default, expand to see crew)
- Group colleagues by yacht (collapsed by default)
- Yacht bookmark/save support
- Endorsement/colleague grouping logic: sort by yacht, count, activity

**Exit:** Network tab shows three tabs: Colleagues (grouped by yacht), Endorsements (grouped by yacht), Yachts (browsable list). Each group shows who/what happened on that yacht.

**Files:**
- `app/(protected)/app/network/page.tsx`
- `app/(protected)/app/network/colleagues/page.tsx`
- `app/(protected)/app/network/saved/page.tsx`
- Network tab components (new or refactored)

---

## Build Order (Dependency-Validated)

```
Sequential phases:

Wave 1 (Data Integrity) — ~2 days
  ├─ Cert dedup + attachment dedup
  ├─ Overlap validation
  └─ Blocks: Waves 2, 3, 4, 5 (needed for clean data going forward)

Wave 2 (Public Profile + CV View) — ~1.5 days
  ├─ Create formatDate.ts utility
  ├─ Public profile hero (age, flag, sea time)
  ├─ CV view (404 fix, responsive, share/download)
  └─ Unblocks Wave 3 (formatDate.ts dependency)

Wave 3 (Import Wizard UX) — ~1.5 days (can start after Wave 2 has formatDate.ts)
  ├─ Wizard step enhancements
  ├─ Phone formatting
  └─ All steps editable

Wave 4 (Profile Page + Skills UX) — ~1.5 days (independent after Wave 1)
  ├─ Personal Details + fields on profile
  ├─ Skills chip redesign
  └─ All section editability

Wave 5 (Network Tab Grouping) — ~1.5 days (independent after Wave 1)
  ├─ Yacht tabs
  ├─ Group endorsements + colleagues by yacht
  └─ Yacht bookmarking
```

**Parallelization opportunity:** After Wave 1 completes:
- Wave 2 starts immediately (no dependency)
- Waves 4 + 5 can start in parallel with Wave 2 (independent)
- Wave 3 starts once Wave 2 has `formatDate.ts` (~day 1 afternoon)

**Sequential minimum:** Wave 1 → Wave 2 → Wave 3 / Waves 4,5 parallel → done (~5 days)

---

## Exit Criteria — All Required

- [ ] Cert dedup: multiple uploads don't create duplicates (test 3+ imports same CV)
- [ ] Attachment dedup: multiple uploads don't stack (test 3+ imports same person+yacht+role)
- [ ] Overlap validation: yacht date overlaps caught at save, 1-month tolerance, warning shown
- [ ] Public profile hero: displays age, sea time, country flag (non-null checks)
- [ ] CV view: no 404, `cv_public` + `latest_pdf_path` set after parse
- [ ] CV view: mobile-responsive (no horizontal scroll), share + download buttons present
- [ ] Import wizard: all steps editable (language, bio, dates, yachts, certs, education)
- [ ] Import wizard: phone formatting works, date format consistent, copy is clear
- [ ] Profile page: Personal Details visible, Visa/Travel Docs visible, Languages editable
- [ ] Profile page: Experience shows imported entries, can edit existing (not just add)
- [ ] Skills chip UX: explicit x button, add input field, saved items removable
- [ ] Network tab: Colleagues grouped by yacht, Endorsements grouped by yacht, Yachts tab present
- [ ] Network tab: all groupings show crew count and endorsement status
- [ ] `formatDate.ts` utility used consistently across public profile, CV view, import wizard

---

## Decisions — Resolved 2026-03-25

| ID | Question | Decision |
|----|----------|----------|
| D1 | Cert dedup — how fuzzy? | Two-step: normalize (maritime alias map) + fuzzy match (Levenshtein ≤ 2 or ≥ 0.85) |
| D2 | Date overlap — allow brief handover? | Allow 1 month overlap, warn but don't block |
| D3 | Nationality display — demonym or label? | Label "Nationality" with country name |
| D4 | Phone formatting — library or custom? | `libphonenumber-js` — lightweight |
| D5 | Ensign flags — source? | Deferred to post-launch. Use placeholder for now. |
| D6 | CV scaling — transform or responsive? | `transform: scale()` to fit viewport width, no horizontal scroll |
| D7 | Yacht graph — full viz or list? | List-based (yacht → crew). Graph viz deferred to Phase 2. |
| D8 | Attachment dedup — match strategy? | Upsert on `user_id + yacht_id + role`. Enrich if exists. |

---

## Files Likely Affected

### Wave 1
- `lib/cv/save-parsed-cv-data.ts`
- `components/cv/CvImportWizard.tsx`
- `app/(protected)/app/attachment/[id]/edit/page.tsx`

### Wave 2
- `lib/utils/formatDate.ts` (new)
- `components/public/PublicProfileContent.tsx`
- `components/public/HeroSection.tsx`
- `components/profile/ProfileHeroCard.tsx`
- `app/(public)/u/[handle]/page.tsx`
- `app/(public)/u/[handle]/cv/page.tsx`
- `components/cv/CvPreview.tsx`

### Wave 3
- `components/cv/CvImportWizard.tsx`
- `components/cv/steps/StepPersonal.tsx`
- `components/cv/steps/StepExperience.tsx`
- `components/cv/steps/StepQualifications.tsx`
- `components/cv/steps/StepExtras.tsx`
- `lib/utils/formatPhone.ts` (new)

### Wave 4
- `app/(protected)/app/profile/page.tsx`
- `app/(protected)/app/profile/settings/page.tsx`
- `app/(protected)/app/languages/edit/page.tsx`
- `app/(protected)/app/attachment/[id]/edit/page.tsx`
- `components/profile/ProfileSectionGrid.tsx`
- Section list components

### Wave 5
- `app/(protected)/app/network/page.tsx`
- `app/(protected)/app/network/colleagues/page.tsx`
- `app/(protected)/app/network/saved/page.tsx`
- Network tab components

---

## Estimated Effort

- **Wave 1:** 2 days (data integrity, highest risk)
- **Wave 2:** 1.5 days (public profile hero, CV view)
- **Wave 3:** 1.5 days (import wizard UX — depends on formatDate from Wave 2)
- **Wave 4:** 1.5 days (profile sections, skills)
- **Wave 5:** 1.5 days (network grouping)
- **Total sequential:** 5–7 days
- **With parallelization (Waves 4+5 after Wave 1):** 4–5 days

---

## Notes

**Wave 1 is foundational.** Data corruption bugs are worse than UX bugs. Fix dedup first. Everything else lands on clean data.

**`formatDate.ts` is a shared utility.** Needed by Wave 2 (public profile, CV view), Wave 3 (import wizard), and beyond. Create it early in Wave 2 so Wave 3 can start immediately.

**Network grouping unblocks yacht graph.** This isn't the full graph visualization (that's Phase 2+). But grouping colleagues + endorsements by yacht is the foundation. After this sprint, the yacht graph navigation (profile → yacht → crew) becomes real and usable.

**Ensign flags deferred.** D5 says post-launch. For now, use yacht country flag or placeholder. Don't block the sprint on maritime flag assets.

**Post-launch follow-up:** After these 37 bugs are fixed, the next work is Ghost Profiles + Claimable Accounts (design spec ready) and Endorsement Writing Assist (design spec ready). But those come after this bugfix sprint and the onboarding rebuild (Sprint 11).
