# Lane 1 — Land Experience + CV Restore Data Integrity

**Session:** [Session 2 — Data Integrity](../../sessions/2026-04-03-rally009-session2.md)
**Worktree:** yl-wt-1
**Branch:** feat/land-experience
**Model:** Opus
**Status:** queued

---

## Task

Add non-yachting (shore-side) employment support: schema, CV parser integration, wizard step, and integrated timeline display on profile + public profile. Also fix 4 CV re-parse data integrity gaps (trackOverwrite, education dedup, languages/travel docs merge).

## Scope

### Part A: Land Experience (from Session 2 spec — Lane 1)

1. **Migration** — Create `land_experience` table with RLS (owner full access + public read). See `session-2-data-integrity.md` Lane 1 Task 1 for exact SQL.
2. **Save parsed CV data** — In `save-parsed-cv-data.ts`, insert `employment_land` entries into new `land_experience` table after yacht experience saving.
3. **Wizard step** — Create `StepLandExperience.tsx` between Experience and Certifications steps. Card-per-job pattern matching `StepExperience.tsx`. Edit inline, delete, add manually. Empty state: "No shore-side experience found in your CV."
4. **Profile display** — Integrated reverse-chronological timeline in Career group. Shore-side = briefcase icon, yacht = anchor icon. No separate section. Compact list rows.
5. **Public profile display** — Same integrated timeline on public profile bento/sections.
6. **Regenerate types** — `npx supabase gen types typescript --local > lib/database.types.ts`

### Part B: CV Restore Data Integrity (from Session 2 spec — Lane 3)

7. **trackOverwrite for 5 fields (UX6a)** — Wrap `location_country`, `location_city`, `date_of_birth`, `smoking_preference`, `appearance_notes` in `trackOverwrite()` in `save-parsed-cv-data.ts`.
8. **Education dedup (UX6b)** — Before inserting education entries, check for existing with matching `institution` + `qualification` (case-insensitive). Update instead of insert if match found.
9. **Languages merge (UX6c)** — Dedup by language name (case-insensitive). Append new, keep existing. Never remove user languages.
10. **Travel docs merge (UX6d)** — Union of existing + parsed. Dedup by document type. Never remove user docs.

### Grill-Me Decisions (locked)

- **Q1.1:** Integrated reverse-chronological timeline — shore-side alongside yacht, sorted by date. Briefcase vs anchor icon.
- **Q1.2:** Moot — no separate section.
- **Q1.3:** Include industry if present, don't require it.

## Allowed Files

```
supabase/migrations/*_land_experience.sql (new)
lib/cv/save-parsed-cv-data.ts
lib/cv/types.ts (read only — verify ParsedLandJob interface)
components/cv/steps/StepLandExperience.tsx (new)
components/cv/steps/ (wizard parent — step ordering only)
app/(protected)/app/profile/page.tsx
components/profile/* (experience display)
components/public/* (public profile experience display ONLY)
lib/queries/profile.ts
lib/database.types.ts (regenerate)
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
sprints/ (planning docs)
docs/ops/
lib/sea-time.ts (Lane 2)
components/cv/steps/StepExperience.tsx (Lane 2)
components/profile/SeaTimeSummary.tsx (Lane 2)
middleware.ts
app/api/stripe/*
```

## Definition of Done

- [ ] Migration applies cleanly via `supabase db push`
- [ ] CV parser land jobs saved to `land_experience` table
- [ ] Wizard shows shore-side experience step with edit/delete/add
- [ ] Profile page shows integrated timeline (briefcase + anchor icons)
- [ ] Public profile shows same integrated timeline
- [ ] trackOverwrite wraps all 5 missing scalar fields
- [ ] Education entries dedup on re-parse (no duplicates)
- [ ] Languages merge on re-parse (never removes existing)
- [ ] Travel docs merge on re-parse (never removes existing)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Types regenerated
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._
