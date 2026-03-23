# Sprint CV-Parse -- Build Plan

> Last updated: 2026-03-23. Field names use codenames from `field-registry.md`.

## Overview

1. Add new profile columns (schema + UI + edit pages)
2. Rewrite CV parser to extract all fields
3. Build import wizard for parsed data

Based on 9 real CVs across 8 crew. Current parser extracts ~25% of available data.

---

## Architecture: Two-Layer Model

| Layer | Purpose | Shows |
|-------|---------|-------|
| Profile page | Visual presentation | Name, role, flag, sea time, languages, experience (name/role/dates), certs (name/expiry), education, skills, hobbies |
| Generated CV (PDF) | Full professional document | Everything above PLUS UF1-UF6 detail fields, AF1-AF4 per employment, EF1 per cert |

UF3/UF4/UF5/UF6 are CV-only fields -- they don't appear on the profile page.

---

## Waves

| Wave | Scope | Spec File |
|------|-------|-----------|
| 1 | Migration (14 new columns) | `specs/wave-1-migration.md` |
| 2a | Helpers + languages API | `specs/wave-2a-helpers.md` |
| 2b | Settings page (UF1-UF9) | `specs/wave-2b-settings.md` |
| 2c | Attachment edit (AF1-AF4) + cert edit (EF1) | `specs/wave-2c-employment.md` |
| 2d | Profile display (hero, languages row, CV prompt) | `specs/wave-2d-profile-display.md` |
| 3 | AI prompt rewrite + parse chain hardening | `specs/wave-3-ai-prompt.md` |
| 4 | Import wizard (5 steps) | `specs/wave-4-import-wizard.md` |
| 5 | Save function + celebration | `specs/wave-5-save-function.md` |
| 6 | PDF template + CV preview | `specs/wave-6-pdf-preview.md` |
| 7 | Verification + testing | `specs/wave-7-verification.md` |

---

## New Files

```
supabase/migrations/20260323000001_crew_profile_fields.sql
lib/cv/types.ts
lib/cv/validate.ts
components/cv/CvImportWizard.tsx
components/cv/ConfirmCard.tsx
components/cv/ConflictInput.tsx
components/cv/ChipSelect.tsx
components/cv/steps/Step*.tsx (5 files)
components/cv/CvPreview.tsx
app/(protected)/app/cv/preview/page.tsx
app/(public)/u/[handle]/cv/page.tsx
app/(protected)/app/languages/edit/page.tsx
app/api/profile/languages/route.ts
```

## Modified Files

```
lib/constants/countries.ts
lib/validation/schemas.ts
lib/cv/prompt.ts
lib/cv/save-parsed-cv-data.ts
app/api/cv/parse/route.ts
components/cv/CvUploadClient.tsx
app/(protected)/app/cv/review/page.tsx
app/(protected)/app/profile/settings/page.tsx
app/(protected)/app/attachment/[id]/edit/page.tsx
app/(protected)/app/certification/[id]/edit/page.tsx
app/(protected)/app/profile/page.tsx
components/profile/ProfileHeroCard.tsx
components/pdf/ProfilePdfDocument.tsx
components/cv/CvActions.tsx
app/(public)/u/[handle]/page.tsx
components/public/PublicProfileContent.tsx
components/yacht/YachtPicker.tsx
```

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | UF7 as JSONB on users, not user_skills | Proficiency level needed. user_skills has no proficiency column. |
| D2 | UF1 displayed as age, not raw value | Privacy. Age is what hiring managers need. |
| D3 | YF1 on yachts table | Every CV lists builder. Meaningful hiring signal. |
| D4 | AF1-AF4 on attachments | Enriches employment to CV-quality detail. |
| D5 | Land-based employment: display in wizard, don't store | No table. Yacht-focused. Add later. |
| D6 | References: extract for endorsement flow only | Privacy. Feeds ghost profiles. |
| D7 | Two-layer model (profile vs PDF) | Profile stays clean. CV detail fields in PDF only. |
| D8 | HTML CV preview, not PDF iframe | Faster, interactive, missing field prompts inline. |
| D9 | UF3/UF4/UF5/UF6 NOT on profile page | Hiring-decision fields, not presentation fields. |
