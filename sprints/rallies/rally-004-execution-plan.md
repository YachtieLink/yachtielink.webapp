# Rally 004 — Execution Plan

**Date:** 2026-03-25
**Companion to:** `rally-004-srp-dry-complexity-audit.md`
**Purpose:** translate the SRP/DRY audit into a practical cleanup strategy that doesn't derail delivery

## What This Is

A concrete plan for how to clean up the concentrated debt identified in the Rally 004 audit. This is not a standalone refactor track — cleanup is piggybacked into the active CV Parse Bugfix sprint wherever those waves already touch the affected files, with at most one focused follow-up sprint for anything left over.

## Guiding Principle

The repo is not collapsing. The debt is concentrated. That means the work should be concentrated too.

1. Stop new drift from landing (already done — `npm run drift-check`, canonical-owner docs, workflow updates)
2. Fix the worst hotspots while you're already in those files for bugfix work
3. Standardize the patterns those hotspots should have used
4. Finish the product on those patterns

## Planning Assumptions

- Cleanup should be concentrated, not broad.
- The codebase is recoverable; the goal is to reduce drift before it becomes launch drag.
- No standalone cleanup sprints unless piggybacking into bugfix waves can't reach the target files.
- Dead code removal is part of completion, not a follow-up nice-to-have.

## Strategy: Piggyback Into CV Parse Bugfix Waves

Instead of 8 standalone cleanup sprints, map each cleanup concern to the bugfix wave that's already touching those files:

| Cleanup Work | Piggyback Into | Why |
|---|---|---|
| CV import consolidation — collapse dual save paths, delete `CvReviewClient`, remove dead sessionStorage flow, remove unused wizard props | **Wave 1 (Data integrity)** | Wave 1 touches `save-parsed-cv-data.ts` for dedup — do the consolidation at the same time |
| Shared CV/profile read models — extract shared query builders for CV sections, stop repeating 6 queries across pages | **Wave 2 (Public profile + CV view)** | Wave 2 fixes public CV and profile rendering — natural place to extract shared readers |
| Public profile decomposition — split `PublicProfileContent`, move viewer-relationship logic to shared helpers, replace `any[]` | **Wave 2 (Public profile + CV view)** | Same wave, same files |
| Import wizard UX cleanup — remove duplicate `ConfirmedImportData` construction, clean up onboarding CV handoff | **Wave 3 (Import wizard UX)** | Wave 3 is already reworking the wizard surface |
| Network/endorsement flow cleanup — extract shared colleague assembly, slim endorsement request client | **Wave 5 (Network tab)** | Wave 5 touches network and endorsement surfaces |

### What Doesn't Fit Into Bugfix Waves

These cleanup items don't naturally overlap with any CV Parse Bugfix wave:

| Cleanup Work | Approach |
|---|---|
| CRUD + media standardization (photo/gallery route dedup, shared Pro gating) | One focused follow-up junior sprint after bugfix waves complete |
| CV/PDF renderer unification (shared section renderers across HTML preview and PDF templates) | Defer — PDF is maintenance debt, not active drift risk. Revisit if a CV field change requires it. |

## Cleanup Scope Per Wave

### Wave 1 — Data Integrity + CV Consolidation

Bugfix scope: cert/attachment dedup, overlap validation
Cleanup additions:
- Collapse `saveParsedCvData()` and `saveConfirmedImport()` into one save contract
- Route onboarding CV persistence through the canonical pipeline
- Delete `CvReviewClient` if confirmed dead
- Remove stale sessionStorage `cv_parsed_data` flow
- Remove unused props from `CvImportWizard`

Exit criteria: one CV import path, one save path, no deprecated save code left active.

### Wave 2 — Public Profile + CV View + Shared Read Models

Bugfix scope: hero fields, CV 404 fix, responsive, share/download
Cleanup additions:
- Extract shared CV section query builder used by owner preview, public CV, and PDF
- Move viewer-relationship logic from `app/(public)/u/[handle]/page.tsx` into a shared helper
- Split `PublicProfileContent.tsx` into focused section components
- Replace `any[]` with typed props from shared reader

Exit criteria: `app/` files are mostly auth + fetch + render. Public profile is no longer one mega-component.

### Wave 3 — Import Wizard UX + Onboarding Handoff

Bugfix scope: languages, bio, phone formatting, date consistency, editable cards
Cleanup additions:
- Remove duplicate `ConfirmedImportData` construction
- Ensure onboarding completion uses the canonical import pipeline

Exit criteria: wizard and onboarding share one flow, no duplicate data assembly.

### Wave 5 — Network Tab + Endorsement Cleanup

Bugfix scope: yacht graph, endorsement/colleague grouping
Cleanup additions:
- Extract shared colleague/network assembly
- Slim endorsement request client — extract send/share logic into helpers
- Remove duplicated request-posting behavior

Exit criteria: network and endorsement rules each have one implementation path.

### Follow-Up — Media/CRUD Standardization (Junior Sprint)

Only if not naturally touched during waves above:
- Consolidate photo/gallery API routes
- Extract shared media upload/delete helpers
- Route all Pro gating through `lib/stripe/pro.ts`
- Standardize reorder handling

Exit criteria: similar resources follow the same server and client pattern.

## What Not To Do

- Do not run a repo-wide "clean architecture" rewrite.
- Do not refactor unrelated stable modules just because cleanup is active.
- Do not leave deprecated flows in place after replacing them.
- Do not start with PDF template elegance before fixing active CV/onboarding drift.
- Do not create standalone cleanup sprints for work that can be done in an active bugfix wave.

## Definition of Done

Each wave's cleanup is done when:

- canonical path is clear
- duplicate path is removed or explicitly retired
- shared helper/service/query layer is updated
- dead code left by the refactor is removed
- critical flow still works end to end

## Bottom Line

The right outcome is not "cleaner code in theory."

The right outcome is:

- fewer places to change things
- fewer chances to introduce regressions
- faster finish velocity on the rest of the project
- a launch codebase that stays understandable under pressure
