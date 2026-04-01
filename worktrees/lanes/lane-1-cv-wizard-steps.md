# Lane 1 — CV Wizard Steps 2-3 UX Rework

**Session:** worktrees/sessions/2026-04-01-first-worktree-push.md
**Worktree:** yl-wt-1
**Branch:** feat/cv-wizard-steps-2-5
**Model:** sonnet
**Status:** planning

---

## Task

Continue the CV import wizard UX rework into Steps 2 (Employment/Experience) and 3 (Qualifications/Certs). Step 1 (Personal) and Steps 4-5 (Extras, Review) were already reworked in the previous session. Apply the same design patterns established in Step 1.

## Scope

- **StepExperience.tsx** — Apply Step 1 design patterns: field grouping with border-t dividers, sticky Done button, Cancel in edit header, contextual help text, flag-outside-input where applicable
- **StepQualifications.tsx** — Same UX pass: review state polish, edit state polish, chip hierarchy for cert types, proper empty states
- Minor tweaks to **CvImportWizard.tsx** if needed for step-level chrome consistency

## Design Patterns to Follow (from Step 1)

Read these before starting:
- `docs/design-system/patterns/page-layout.md` — mandatory
- `docs/design-system/philosophy.md`
- `docs/design-system/style-guide.md`
- Look at `components/cv/steps/StepPersonal.tsx` as the reference implementation

Key patterns:
- Field grouping with `border-t` dividers between sections
- Sticky Done button at bottom of edit state
- Cancel button in edit header (not floating)
- Section color = amber (CV module)
- Flag emoji outside input boxes (nationality/country fields)
- Contextual help text below fields where it adds value
- Bio/large text fields uncapped display in review state
- Proper capitalization for enum labels

## Allowed Files

```
components/cv/steps/StepExperience.tsx
components/cv/steps/StepQualifications.tsx
components/cv/CvImportWizard.tsx (minor tweaks only)
components/cv/ChipSelect.tsx (if needed for cert chip patterns)
components/ui/DatePicker.tsx (bug fixes only)
components/ui/SearchableSelect.tsx (bug fixes only)
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
sprints/ (planning docs)
docs/ops/
components/cv/steps/StepPersonal.tsx (already done — don't touch)
components/cv/steps/StepExtras.tsx (already done — don't touch)
components/cv/steps/StepReview.tsx (already done — don't touch)
lib/cv/ (data layer — not in scope)
supabase/migrations/ (no migrations needed)
Any Ghost Profiles or Sprint 13 files
```

## Definition of Done

- [ ] StepExperience.tsx review state matches Step 1 design quality
- [ ] StepExperience.tsx edit state has field grouping, sticky Done, Cancel in header
- [ ] StepQualifications.tsx review state matches Step 1 design quality
- [ ] StepQualifications.tsx edit state has field grouping, sticky Done, Cancel in header
- [ ] Amber section color consistent throughout
- [ ] No WCAG AA contrast violations (no amber text on white)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] No console errors in browser
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._
