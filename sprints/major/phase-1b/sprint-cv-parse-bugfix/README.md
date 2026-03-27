# Sprint CV-Parse Bugfix — Phase 1B Bug Rally (Revised)

**Phase:** 1B
**Priority:** P0 — blocks onboarding quality, go-live readiness
**Status:** 📋 Ready for execution
**Runs after:** Sprint 10.1 complete ✅
**Runs before:** Sprint 11 (CV onboarding rebuild)
**Type:** Bugfix rally — originally 37 QA bugs, 29 resolved, 8 remaining
**Estimated effort:** 2–3 days (2 waves, parallel-capable)
**Last validated:** 2026-03-27 (against main after Sprint 10.1 merge)

---

## Why This Sprint Exists

The founder QA'd the CV import flow (2026-03-24) and found 37 bugs. Waves 1-5 and Sprint 10.1 fixed 22 of them. 7 more were deferred to Sprint 12 (yacht graph scope). **8 bugs remain** that don't belong in any other sprint and degrade the onboarding experience.

---

## What's Already Fixed (29 bugs — no action needed)

### Fixed in Waves 1-5 (22 bugs)
- ✅ All Group A data integrity bugs (cert dedup, attachment dedup, overlap validation, skills dedup)
- ✅ Age in hero, sea time in hero
- ✅ Languages editable + add inline
- ✅ Phone formatting (libphonenumber-js)
- ✅ Date formatting (formatDateDisplay in lib/cv/types.ts)
- ✅ Bio shown and editable on Step 1
- ✅ Nationality shows country name (label, not demonym)
- ✅ "Tap + to add" copy fixed (button exists)
- ✅ Skills chip UX (full editor page at /app/skills/edit)
- ✅ Edit existing entries (ProfileSectionGrid editHref)
- ✅ Experience shows imported entries (yacht_id select bug fixed)
- ✅ Personal Details card on profile page
- ✅ Visa/Travel Docs visible on profile
- ✅ Languages editable (edit link + page)
- ✅ Date display on experience cards (formatDateDisplay)

### Deferred to Sprint 12 (7 bugs)
- → Bug 34: Yacht graph/exploration (Sprint 12 core scope)
- → Bug 37: Colleagues grouped by yacht (Sprint 12 Section B)
- → Bug 10: Yacht matching unclear (Sprint 12 Section D — match quality indicator)
- → Bug 31: Yacht names not clickable (Sprint 12 — yacht detail pages)
- → Bug 32: Yacht ensign flags (Sprint 12 — yacht stats)
- → Bug 36: Endorsements grouped by yacht (Sprint 12 Section A)
- → Bug 35: Save/bookmark yachts (Sprint 12 backlog note)

---

## Remaining Bugs (8 bugs, 2 waves)

### Wave 1: CV View + Public Profile (4 bugs) — P1

| # | Bug | Severity | File(s) |
|---|-----|----------|---------|
| 3/28 | CV view 404 — `cv_public_source` not set after parse | P1 | `app/api/cv/parse/route.ts` |
| 25 | Country flag missing from public profile hero | P1 | `HeroSection.tsx`, `PublicProfileContent.tsx` |
| 29 | CV horizontal scroll on mobile | P1 | `app/(public)/u/[handle]/cv/page.tsx`, `CvPreview.tsx` |
| 30 | No share/download buttons on CV view | P1 | `app/(public)/u/[handle]/cv/page.tsx`, `CvPreview.tsx` |

### Wave 2: Wizard Editability + Profile Polish (4 bugs) — P2

| # | Bug | Severity | File(s) |
|---|-----|----------|---------|
| 13 | Qualifications not editable in wizard (remove only) | P2 | `StepQualifications.tsx` |
| 14 | Education not editable in wizard (remove only) | P2 | `StepQualifications.tsx` |
| 22 | Visibility toggles only in Settings, not on profile | P2 | `PersonalDetailsCard.tsx` |
| 2 | ParseProgress animated jump on step transitions | P2 | `CvImportWizard.tsx` |

---

## Key Deliverables

### Wave 1

#### 1a. CV view 404 fix (Bug 3/28)
- ⬜ In `app/api/cv/parse/route.ts` line 112: add `cv_public_source: 'uploaded'` to the `.update()` payload after successful parse
- ⬜ This ensures `/u/[handle]/cv` knows to render the uploaded iframe path
- **Edge case:** User who only used the wizard (never uploaded a raw CV) — `cv_public_source` stays null. The CV view page already handles this by falling through to the generated HTML path. No change needed there.
- **Test:** Upload a CV → navigate to `/u/[handle]/cv` → should render the uploaded PDF, not 404

#### 1b. Country flag in hero (Bug 25)
- ⬜ In `components/public/PublicProfileContent.tsx`: import `countryToFlag` from `@/lib/constants/country-iso`
- ⬜ Call `countryToFlag(user.home_country)` and pass result as `homeCountryFlag` to `HeroSection`
- ⬜ Gate on `user.show_home_country !== false`
- ⬜ In `components/public/HeroSection.tsx`: add `homeCountryFlag?: string` prop, render flag emoji next to name or in the stats line
- ⬜ Also render in the desktop identity panel (line ~206 block)
- **Edge case:** `home_country` is null → don't render flag. Country not in ISO map → `countryToFlag` returns empty string → don't render.
- **Test:** View `/u/test-seed-charlotte` (France) → flag 🇫🇷 visible in hero. View profile with no home_country → no flag shown.

#### 1c. CV mobile scroll fix (Bug 29)
- ⬜ In `app/(public)/u/[handle]/cv/page.tsx` line 51: add `overflow-x-hidden` to outer wrapper div
- ⬜ In `components/cv/CvPreview.tsx`: add `break-words` or `overflow-wrap: anywhere` to text containers that could overflow
- **Test:** View `/u/[handle]/cv` on 375px viewport → no horizontal scrollbar

#### 1d. CV share + download buttons (Bug 30)
- ⬜ In `app/(public)/u/[handle]/cv/page.tsx`: add `ShareButton` (import from `@/components/public/ShareButton`) and Download link (`/api/cv/public-download/${handle}`) in a top bar
- ⬜ In `components/cv/CvPreview.tsx` `mode="viewer"`: add Download link alongside "Back to profile"
- ⬜ Download link: `<a href="/api/cv/public-download/${user.handle}" target="_blank">Download PDF</a>`
- **Edge case:** User has no uploaded CV and no generated PDF → download link should not render. Gate on `user.latest_pdf_path || user.cv_storage_path`.
- **Test:** View `/u/[handle]/cv` → share button copies URL, download button opens PDF

---

### Wave 2

#### 2a. Wizard cert editing (Bug 13)
- ⬜ In `components/cv/steps/StepQualifications.tsx`: add inline expand/edit mode on cert cards
- ⬜ Clicking "Edit" on a cert row reveals input fields for: `name`, `issued_date`, `expiry_date`, `issuing_body`
- ⬜ "Save" collapses back to display mode. "Cancel" discards changes.
- ⬜ Follow the inline form pattern from `StepPersonal.tsx`
- **Edge case:** Editing a cert name to match another cert in the list → warn about duplicate
- **Test:** Import CV → Step 3 → click Edit on a cert → change name → Save → verify change persists to review step

#### 2b. Wizard education editing (Bug 14)
- ⬜ Same component as 2a (`StepQualifications.tsx`) — education section
- ⬜ Add inline expand/edit mode on education cards
- ⬜ Fields: `institution`, `qualification`, `field_of_study`, `start_date`, `end_date`
- **Test:** Import CV → Step 3 → click Edit on education → change institution → Save → verify

#### 2c. Visibility toggles on profile card (Bug 22)
- ⬜ In `components/profile/PersonalDetailsCard.tsx`: add a "Visibility settings" link that deep-links to `/app/profile/settings`
- ⬜ Keep it simple — don't add inline toggles (Settings page already handles this well). Just make it easier to get there from the card.
- ⬜ Add subtext: "Control what's visible on your public profile"
- **Test:** Profile page → Personal Details card → "Visibility settings" link → navigates to settings page

#### 2d. ParseProgress animated jump (Bug 2)
- ⬜ In `components/cv/CvImportWizard.tsx` inline `ParseProgress` function (~line 21-84):
- ⬜ Change progress bar `initial={{ width: '5%' }}` to `initial={false}` — prevents animation from 5% to current on first render
- ⬜ On step list items: add `initial={false}` to already-completed steps so they don't re-animate their opacity
- **Test:** Upload CV → progress bar advances smoothly without jumping from 5% to current position

---

## Build Order

```
Wave 1 — CV View + Public Profile (~1 day)
  Can run as 2 parallel Sonnet subagents:
  - Agent A: Bug 3/28 (cv_public_source) + Bug 29 (scroll) + Bug 30 (share/download)
    → all touch cv/page.tsx and CvPreview.tsx
  - Agent B: Bug 25 (country flag)
    → touches HeroSection.tsx and PublicProfileContent.tsx

Wave 2 — Wizard + Profile Polish (~1 day)
  Can run as 2 parallel Sonnet subagents:
  - Agent C: Bug 13 + 14 (cert/education editing)
    → touches StepQualifications.tsx only
  - Agent D: Bug 22 (visibility link) + Bug 2 (progress bar)
    → touches PersonalDetailsCard.tsx + CvImportWizard.tsx (no overlap)
```

**Total with parallelization: ~2 days**

---

## Out of Scope

- Yacht graph, yacht grouping, yacht bookmarking (Sprint 12)
- Ensign flags (Sprint 12)
- Yacht names clickable (Sprint 12)
- Data integrity dedup (already fixed in Waves 1-5)
- Skills chip UX (already fixed)
- Dark mode (Sprint 10.1 handled component-level, force light mode for now)
- CV onboarding rebuild (Sprint 11)

---

## Exit Criteria

- [ ] Upload CV → `/u/[handle]/cv` renders uploaded PDF (no 404)
- [ ] Public profile hero shows country flag emoji (when home_country set + show_home_country true)
- [ ] Public profile hero shows no flag when home_country is null
- [ ] `/u/[handle]/cv` has no horizontal scroll at 375px mobile viewport
- [ ] `/u/[handle]/cv` has Share button and Download PDF button
- [ ] Download PDF button works (returns file)
- [ ] Wizard Step 3: certs are editable inline (name, dates, issuing body)
- [ ] Wizard Step 3: education is editable inline (institution, qualification, dates)
- [ ] Personal Details card has "Visibility settings" link → navigates to settings
- [ ] ParseProgress bar doesn't jump on initial render
- [ ] `npm run build` zero errors
- [ ] `npm run drift-check` PASS

---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Visibility toggles: deep-link to Settings, not inline on profile | Settings page already has full toggle UX. Adding duplicate toggles on the card creates two editing surfaces. A link is simpler and avoids sync issues. |
| 2 | Cert/education editing: inline expand in wizard, not modal or page navigation | Matches the wizard's existing inline editing pattern (StepPersonal). Leaving the wizard to edit would break flow. |
| 3 | Country flag: emoji via countryToFlag(), not SVG library | Zero-dependency, already implemented in lib/constants/country-iso.ts. Consistent rendering on iOS/Mac (our primary users). |
| 4 | CV download: use existing `/api/cv/public-download/[handle]` route | Route exists and works. Just needs a button in the UI. |

---

## Estimated Effort

- **Sequential:** 2–3 days
- **Parallel (4 Sonnet subagents):** 1–1.5 days
- **Model:** Sonnet for all 4 agents. No Opus needed — all bugs are mechanical fixes with clear specs.

---

## Notes

**Validation pass (2026-03-27):** 29 of original 37 bugs confirmed fixed or deferred. This rewrite reflects actual remaining scope. The sprint-start-yl validation found zero stale assumptions in this revised spec.

**Sprint 12 handoff:** 7 bugs explicitly noted in Sprint 12 README under "Deferred bugs from CV-Parse-Bugfix sprint" with per-bug section references.

**`formatDate.ts` not needed:** The spec originally proposed `lib/utils/formatDate.ts` as a shared utility. `formatDateDisplay()` in `lib/cv/types.ts` already serves this purpose and is wired throughout the codebase. No new utility needed.
