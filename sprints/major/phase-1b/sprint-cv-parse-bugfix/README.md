# Sprint CV-Parse Bugfix — Post-Build QA Rally

**Phase:** 1B
**Priority:** P0 — blocks go-live. CV parse is the core onboarding experience and these bugs degrade it significantly.
**Status:** 📋 Planning
**Type:** Bugfix rally (37 bugs from founder QA walkthrough)
**Depends on:** Sprint CV-Parse (code complete, merged)

---

## Why This Sprint Exists

The CV parse sprint shipped Waves 1-7 and the two-pass optimization. Founder QA walkthrough on 2026-03-24 uncovered 37 bugs across the import wizard, profile page, public profile, settings, and network tab. Many are data integrity issues (stacking certs, duplicate skills) and missing display fields (age, sea time, flags on public profile) that make the feature feel unfinished.

These need to be fixed before any real users hit the flow.

---

## Bug Inventory (37 bugs, 7 groups)

### Group A: Data Integrity — Dedup & Stacking (5 bugs)
Highest priority. Multiple CV uploads create duplicate data.

| # | Bug | Severity | Notes |
|---|-----|----------|-------|
| 4/17 | Certifications stack on multiple CV uploads — no fuzzy dedup (confirmed: `saveConfirmedImport` blindly inserts) | P0 | |
| 38 | Attachments stack on multiple CV uploads — no user+yacht+role dedup (found in review) | P0 | NEW |
| 19 | No overlapping date validation on yacht employment | P1 | |
| 20 | Skills/hobbies stacking on multiple uploads (save has dedup but may not run correctly) | P1 | |

### Group B: Public Profile — Missing Data (6 bugs)
Public profile hero is missing critical fields that captains look for.

| # | Bug | Severity | Notes |
|---|-----|----------|-------|
| 25 | Country flag missing from public profile hero | P1 | Query doesn't select `home_country` |
| 26 | Sea time placement — already in body but not in hero | P1 | Data exists, needs hero placement |
| 27 | Age missing from public profile hero | P1 | Query doesn't select `dob` or `show_dob` |
| 32 | Yacht entries need ensign flags (not country flags) | P2 | |
| 31 | Yacht names in experience not clickable (graph navigation) | P1 | |
| 28/3 | CV view shows blank / `/u/[handle]/cv` returns 404 — route exists but `cv_public` flag or `latest_pdf_path` not set after parse, causing `notFound()` | P1 | Route exists; data state issue |

### Group C: CV View & Sharing (2 bugs)
CV viewing and sharing incomplete.

| # | Bug | Severity |
|---|-----|----------|
| 29 | CV view requires horizontal scroll on mobile | P1 |
| 30 | No share or download buttons on CV view | P1 |

### Group D: Import Wizard UX (11 bugs)
Wizard flow has editing gaps, bad UX patterns, and missing functionality.

| # | Bug | Severity |
|---|-----|----------|
| 2 | ParseProgress bar does jarring animated jump on Step 2 | P2 |
| 6 | Step 1 — can't add languages if parse didn't extract them | P1 |
| 7 | Phone number not formatted (no country-code-aware formatting) | P2 |
| 8 | Date format inconsistent across the app | P1 |
| 1/12 | Bio not shown or editable on Step 1 (save layer handles bio correctly — this is a wizard display issue) | P1 |
| 9 | Nationality shows country name not demonym | P2 |
| 10 | Yacht matching unclear — says "new" but yachts exist in DB | P1 |
| 11 | Dates on experience cards show raw ISO (2018-02) | P1 |
| 13 | Qualifications not editable in wizard | P2 |
| 14 | Education not editable in wizard | P2 |
| 16 | "Tap + to add" copy but no + button present | P2 |

### Group E: Skills & Interests UX (1 bug — merged into Wave 4)

| # | Bug | Severity |
|---|-----|----------|
| 15 | Skills chip UX — clicking deletes (unclear), can't add back, no x button, "(saved)" items not removable | P1 |

### Group F: Profile Page — Missing Sections & Editability (6 bugs)
New CV parse fields aren't accessible from the profile page.

| # | Bug | Severity |
|---|-----|----------|
| 5 | Edit on most sections only allows adding new, not editing existing | P1 |
| 18 | Experience shows "No experience added yet" despite imported entries (likely `ProfileSectionGrid` count/render bug) | P1 |
| 21 | Personal Details buried in Settings, should be on profile | P1 |
| 22 | No individual visibility toggles for personal detail fields | P2 |
| 23 | Visa/Travel Documents not visible from profile | P1 |
| 24 | Languages row not editable (no chevron, no tap target) | P1 |

### Group G: Network Tab — Graph & Grouping (4 bugs)
Network tab missing yacht graph and proper grouping.

| # | Bug | Severity |
|---|-----|----------|
| 34 | Network tab missing yacht graph/exploration | P1 |
| 35 | Can't save/bookmark yachts | P2 |
| 36 | Endorsements not grouped by yacht (flat list, no context) | P1 |
| 37 | Colleagues not grouped by yacht | P1 |

---

## Proposed Wave Order

| Wave | Group | Scope | Est. Effort |
|------|-------|-------|-------------|
| 1 | A | Data integrity — dedup, overlap validation | Large |
| 2 | B + C | Public profile hero + CV view fixes | Medium |
| 3 | D | Import wizard UX fixes | Large |
| 4 | E + F | Profile page sections, editability, skills UX | Medium |
| 5 | G | Network tab — yacht graph, grouping | Large |

**Dependency note:** Bug 8 (date format utility `formatDate.ts`) is needed by both Wave 2 and Wave 3. Create the utility at the start of Wave 2 so both waves can use it.

### Wave 1: Data Integrity (P0)
Fix the worst bugs first — multiple uploads shouldn't corrupt data.
- Cert dedup: fuzzy match by name before insert, enrich if match found
- Attachment dedup: check existing user+yacht+role before insert
- Skills/hobbies dedup: verify existing dedup logic runs correctly
- Yacht date overlap validation: warn and block on save
- Builds on: `save-parsed-cv-data.ts`, `CvImportWizard.tsx`

### Wave 2: Public Profile + CV View (P0/P1)
Make the public-facing profile show real data.
- Create `formatDate.ts` utility first (needed here and in Wave 3)
- Add age, sea time, flag to public hero (query + component + interface changes)
- Fix CV view 404: set `cv_public` / `latest_pdf_path` after parse/generation
- Responsive CV view (no horizontal scroll) — `transform: scale()`
- Add share/download to CV view
- Yacht ensign flag assets + rendering
- Clickable yacht names
- Builds on: `PublicProfileContent.tsx`, `HeroSection.tsx`, `app/(public)/u/[handle]/page.tsx`, `app/(public)/u/[handle]/cv/page.tsx`, `CvPreview.tsx`

### Wave 3: Import Wizard UX (P1)
Polish the import flow.
- ParseProgress bar: set initial width without animation on resume
- Languages input on Step 1
- Bio textarea on Step 1
- Phone number formatting
- Nationality label change
- Yacht match status clarity
- Editable cert/education cards
- Fix "+ to add" copy
- Builds on: `CvImportWizard.tsx`, Step components

### Wave 4: Profile Page + Skills UX (P1)
Surface CV parse fields on the profile page.
- Personal Details card with toggles
- Visa/Travel Docs row
- Languages row with chevron + edit link
- Experience list with edit links to existing entries
- Fix "No experience added yet" count (`ProfileSectionGrid` rendering)
- Section edit pages: list existing + edit, not just add new
- Skills chip UX: explicit x buttons, add input, removable saved items
- Builds on: `profile/page.tsx`, `ProfileSectionGrid.tsx`, section components

### Wave 5: Network Tab (P1)
Yacht graph and proper grouping.
- Add Yachts tab to Network
- Group endorsements by yacht (collapsed by default)
- Group colleagues by yacht (collapsed by default)
- Yacht bookmark/save support
- Builds on: `app/(protected)/app/network/page.tsx`, `app/(protected)/app/network/colleagues/page.tsx`, `app/(protected)/app/network/saved/page.tsx`

---

## Decisions Needed

| ID | Question | Recommendation |
|----|----------|----------------|
| D1 | Cert dedup threshold — how fuzzy? | Levenshtein distance <= 2, or normalized string match >= 0.85 |
| D2 | Date overlap tolerance — allow brief handover? | Allow 1 month overlap, warn but don't block |
| D3 | Nationality display — demonym or label change? | Change label to "Nationality" with country name (simpler, no demonym DB needed) |
| D4 | Phone formatting — library or custom? | `libphonenumber-js` (lightweight, handles all country formats) |
| D5 | Ensign images — source? | Commission or source from maritime flag databases, store as static assets in `/public/ensigns/` |
| D6 | CV view scaling — transform or responsive reflow? | `transform: scale()` preserving A4 layout, simpler than reflow |
| D7 | Yacht graph scope — full graph viz or list-based? | List-based for now (yacht to crew list), graph viz in Phase 2 |
| D8 | Attachment dedup — match strategy? | Match on user_id + yacht_id + role. If match, enrich existing attachment with new fields (dates, description, etc.) |

---

## Files Likely Affected

### Wave 1
- `lib/cv/save-parsed-cv-data.ts`
- `components/cv/CvImportWizard.tsx`
- `app/(protected)/app/attachment/[id]/edit/page.tsx`

### Wave 2
- `lib/utils/formatDate.ts` (new — shared utility)
- `components/public/PublicProfileContent.tsx`
- `components/public/HeroSection.tsx`
- `components/profile/ProfileHeroCard.tsx`
- `app/(public)/u/[handle]/page.tsx`
- `app/(public)/u/[handle]/cv/page.tsx`
- `components/cv/CvPreview.tsx`
- `public/ensigns/*.png` (new)
- `lib/constants/ensigns.ts` (new)

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
- Section list components (new or modified)

### Wave 5
- `app/(protected)/app/network/page.tsx`
- `app/(protected)/app/network/colleagues/page.tsx`
- `app/(protected)/app/network/saved/page.tsx`
- Network tab components

---

## Review Findings Applied

From subagent review (2026-03-24):
- C1: Bug 3 recharacterized — route exists, issue is `cv_public`/`latest_pdf_path` not set. Merged with Bug 28, downgraded to P1.
- C2: Confirmed cert dedup is missing in `saveConfirmedImport`. P0 correct.
- C3: Bug 33 removed (duplicate of 25-27).
- C4: Added Bug 38 — attachment dedup missing. P0.
- H1: Sea time already in public profile body, but not in hero. Recharacterized Bug 26.
- H2: Bug 18 is likely `ProfileSectionGrid` render issue. Added to Wave 4 files.
- H3: Wave 5 file list corrected — `lib/queries/` files don't exist, actual pages referenced.
- H4: Bug 1 merged into Bug 12 (save layer handles bio, wizard display issue).
- H5: Added Decision D8 for attachment dedup strategy.
- L6: `formatDate.ts` dependency noted — created at start of Wave 2.
