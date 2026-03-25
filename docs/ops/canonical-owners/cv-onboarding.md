# Canonical Owner: CV And Onboarding

## Target

There should be one canonical CV import/save path. New work should converge toward the import wizard flow, not add more behavior to legacy review/save surfaces.

## Canonical Owners

| Responsibility | Canonical owner |
|---|---|
| CV import orchestration | `components/cv/CvImportWizard.tsx` |
| Canonical save entrypoint | `saveConfirmedImport()` in `lib/cv/save-parsed-cv-data.ts` |
| CV field/domain types | `lib/cv/types.ts` |
| CV parsing prompts/contracts | `lib/cv/prompt.ts` and parse routes |

## Legacy / Do Not Extend

These have been deleted as of Wave 1 cleanup (2026-03-25):

- ~~`saveParsedCvData()` — deleted, replaced by `saveConfirmedImport()`~~
- ~~`components/cv/CvReviewClient.tsx` — deleted (dead code)~~
- ~~`cv_parsed_data` sessionStorage flow — deleted with CvReviewClient~~
- Do not add duplicate save logic inside onboarding or page components

## Build Rules

- UI components may gather and confirm data, but DB writes should route through the shared save entrypoint.
- If onboarding needs CV-derived behavior, compose the canonical import/save helpers instead of re-implementing them inside `components/onboarding/`.
- Replacement work is incomplete until the old path is deleted or explicitly retired in the same sprint notes.

## Current Divergence

- ~~`Wizard.tsx` calls `saveParsedCvData()` directly~~ — Fixed: now routes through `saveConfirmedImport()` via `parsedToConfirmedImport()`
- ~~`CvReviewClient.tsx` sessionStorage flow~~ — Deleted
- ~~`CvImportWizard.tsx` unused props~~ — Removed (`existingAttachments`, `existingCerts`, `existingEducation`)
- ~~`save-parsed-cv-data.ts` dual saver~~ — `saveParsedCvData()` deleted, only canonical `saveConfirmedImport()` remains
- `CvImportWizard.tsx` builds `ConfirmedImportData` in two separate places (still open)

## Cleanup Tracked In

CV Parse Bugfix sprint (Waves 1-2) — consolidation will be piggybacked into the active bugfix waves that already touch these files.

## Review Questions

- Did this branch add another CV save path?
- Did it keep the old review/sessionStorage flow alive while adding a new one?
- Did it push save logic back into UI code?
