# Session: 2026-04-01 — First Worktree Push

**Status:** active
**Date:** 2026-04-01
**Sprint:** Rally 006 continuation + Sprint 13 + Ghost Profiles

---

## Lanes

| Lane | Worktree | Branch | Model | Status |
|------|----------|--------|-------|--------|
| 1 — CV Wizard Steps 2-3 | yl-wt-1 | feat/cv-wizard-steps-2-5 | Sonnet | planning |
| 2 — Sprint 13 Polish | yl-wt-2 | chore/sprint-13-polish | Sonnet | planning |
| 3 — Ghost Profiles | yl-wt-3 | feat/ghost-profiles | Opus | planning |

## Lane Summaries

### Lane 1 — CV Wizard Steps 2-3
- **Scope:** Continue the UX rework from Step 1 into Steps 2 (Employment/Experience) and 3 (Qualifications/Certs). Same design patterns: field grouping, sticky Done button, flag-outside-input, contextual help text.
- **Lane file:** `worktrees/lanes/lane-1-cv-wizard-steps.md`
- **Key files:** `components/cv/steps/StepExperience.tsx`, `components/cv/steps/StepQualifications.tsx`, `CvImportWizard.tsx`

### Lane 2 — Sprint 13 Polish
- **Scope:** SEO/sitemap soft-delete fix, cookie banner copy, marketing page verification, isolated launch QA fixes.
- **Lane file:** `worktrees/lanes/lane-2-sprint-13-polish.md`
- **Key files:** Public-facing SEO files, cookie banner components, marketing pages

### Lane 3 — Ghost Profiles
- **Scope:** Ghost profile creation, claimable account mechanics, ghost-to-real merge flow, related DB/API work.
- **Lane file:** `worktrees/lanes/lane-3-ghost-profiles.md`
- **Key files:** New tables, new API routes, new claim flow components

## Merge Log

| Order | Branch | Merged at | Conflicts | Notes |
|-------|--------|-----------|-----------|-------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## Notes

- First session using the worktree model. Expect some roughness.
- Ghost Profiles is the only lane with migrations — merge order should consider this.
- Lane 1 scoped to Steps 2-3 only (Employment + Qualifications). Steps 4-5 (Extras + Review) already done in previous session.
