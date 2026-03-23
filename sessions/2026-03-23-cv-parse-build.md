# Session: CV Parse Full Build (Waves 2-7)

**Date:** 2026-03-23
**Agent:** Claude Code (Opus 4.6, 1M context)
**Branch:** docs/cv-parse-specs-final
**Sprint:** CV Parse (Phase 1B)

---

## Summary

Built the complete CV parse sprint from specs. Waves 2a-2d (edit pages), Wave 3 (AI prompt + validation), Wave 4 (5-step import wizard), Wave 5 (save function), Wave 6 (PDF template + CV preview), Wave 7 (review + fixes + ship).

## Wave Execution Log

### Wave 2a — Helpers + Languages API
- Added `languagesSchema` to `lib/validation/schemas.ts`
- Created `app/api/profile/languages/route.ts` (GET + PATCH, follows social-links pattern)
- `country-iso.ts` already existed — skipped

### Wave 2b — Profile Settings
- Extended `ContactSettings` interface with 8 new fields
- Extended `.select()` and `.update()` queries
- Added 3 new sections: Personal Details (DOB, home country, smoke pref, appearance, license), Visa/Travel Documents (checkbox grid + free text), Visibility (show_dob, show_home_country toggles)

### Wave 2c — Attachment + Cert Edit
- Attachment edit: 4 new fields (employment_type Select, yacht_program Select, cruising_area Input, description textarea with 2000 char counter)
- Cert edit: 1 new field (issuing_body Input after expiry date)

### Wave 2d — Profile Display
- `getUserById`: added home_country, languages, dob, smoke_pref (later expanded to all 9 new columns)
- `ProfileHeroCard`: flag emoji via countryToFlag(), sea time line via formatSeaTime()
- Profile page: hero gets new props, SeaTimeSummary removed, languages row added, CV completeness prompt added
- Languages edit page: full CRUD via API, max 10, duplicate prevention

### Wave 3 — AI Prompt + Validation
- Rewrote `CV_EXTRACTION_PROMPT`: ~6 fields → ~40 fields
- Created `lib/cv/validate.ts`: 4 pre-flight checks
- Created `lib/cv/types.ts`: ParsedCvData, ConfirmedImportData, SaveStats + all sub-types
- Updated parse route: validation before AI call, retry wrapper, 25K/8K/30s limits, .doc rejection

### Wave 4 — Import Wizard
- Created 8 new component files (wizard shell + 5 steps + 3 reusable)
- Rewrote CvUploadClient: upload → two-button split (build profile vs just upload)
- Rewrote cv/review/page.tsx: fetches all existing data, renders wizard with storagePath from URL

### Wave 5 — Save Function
- Added `saveConfirmedImport()` to save-parsed-cv-data.ts
- Cert type matching by name/short_name, yacht search→create, case-insensitive skill/hobby dedup
- Marked old saveParsedCvData as @deprecated

### Wave 6 — PDF + Preview
- Updated all 3 PDF templates: new interfaces, new sections, enhanced employment/cert rendering
- Updated generate-pdf route: fetches 3 additional tables + new columns
- Created CvPreview HTML component, owner preview page, public CV viewer page
- Updated CvActions + PublicProfileContent

### Wave 7 — Review + Ship
- Phase 1 (Sonnet): 2 CRITICAL, 4 HIGH, 4 MEDIUM, 1 LOW
- Phase 2 (Opus): 1 P1, 3 P2
- All critical/high/medium fixed
- Migration pushed, committed, branch pushed

## Review Findings Fixed

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | CRITICAL | Yacht upsert on non-unique `name` column | Replaced wizard inline save with `saveConfirmedImport()` |
| 2 | CRITICAL | `getUserByHandle` missing new fields → blank public CV | Added all new fields to query |
| 3 | P1 | Column-level REVOKE on `dob` breaks anon queries | Removed `dob` from `getUserByHandle` |
| 4 | HIGH | Parse warning silently discarded | Destructure + toast warning |
| 5 | HIGH | Wizard certs skip certification_type_id lookup | Fixed by using `saveConfirmedImport` |
| 6 | P2 | `getUserById` missing 5 columns | Added all 9 new columns |
| 7 | P2 | `show_home_country` not enforced | Added check on profile page + CvPreview |
| 8 | P2 | Fake endorsement request counter | Removed until implemented |
| 9 | MEDIUM | Case-sensitive skill dedup | Changed to toLowerCase() comparison |
| 10 | MEDIUM | `renderHeaderSubline` called twice | Assigned to variable |
| 11 | LOW | Malformed language entries render "undefined" | Added shape guard |

## Files Created (17)
- `app/(protected)/app/cv/preview/page.tsx`
- `app/(protected)/app/languages/edit/page.tsx`
- `app/(public)/u/[handle]/cv/page.tsx`
- `app/api/profile/languages/route.ts`
- `components/cv/ChipSelect.tsx`
- `components/cv/ConfirmCard.tsx`
- `components/cv/ConflictInput.tsx`
- `components/cv/CvImportWizard.tsx`
- `components/cv/CvPreview.tsx`
- `components/cv/steps/StepExperience.tsx`
- `components/cv/steps/StepExtras.tsx`
- `components/cv/steps/StepPersonal.tsx`
- `components/cv/steps/StepQualifications.tsx`
- `components/cv/steps/StepReview.tsx`
- `lib/cv/types.ts`
- `lib/cv/validate.ts`
- `sprints/major/phase-1b/sprint-cv-parse/plans/wave-2-plan.md`

## Files Modified (17)
- `app/(protected)/app/attachment/[id]/edit/page.tsx`
- `app/(protected)/app/certification/[id]/edit/page.tsx`
- `app/(protected)/app/cv/review/page.tsx`
- `app/(protected)/app/profile/page.tsx`
- `app/(protected)/app/profile/settings/page.tsx`
- `app/api/cv/generate-pdf/route.ts`
- `app/api/cv/parse/route.ts`
- `components/cv/CvActions.tsx`
- `components/cv/CvUploadClient.tsx`
- `components/pdf/ProfilePdfDocument.tsx`
- `components/profile/ProfileHeroCard.tsx`
- `components/public/PublicProfileContent.tsx`
- `lib/cv/prompt.ts`
- `lib/cv/save-parsed-cv-data.ts`
- `lib/queries/profile.ts`
- `lib/validation/schemas.ts`
- `supabase/migrations/20260323000001_crew_profile_fields.sql`
