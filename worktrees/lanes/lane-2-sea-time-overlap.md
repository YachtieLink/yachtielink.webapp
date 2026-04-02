# Lane 2 — Overlapping Yacht Dates / Sea Time Fix

**Session:** [Session 2 — Data Integrity](../../sessions/2026-04-03-rally009-session2.md)
**Worktree:** yl-wt-2
**Branch:** fix/sea-time-overlap
**Model:** Sonnet
**Status:** queued

---

## Task

Fix sea time calculation to not double-count overlapping yacht stints. Add date range merge utility, replace naive sum with union-based calculation, and add overlap warnings in CV import wizard.

## Scope

### Task 1: Date Range Merge Utility

Extend `lib/sea-time.ts` (canonical location after Session 1) with three functions:

```typescript
// Merge overlapping date ranges into a union set
export function mergeOverlappingRanges(ranges: DateRange[]): DateRange[]

// Calculate total days from potentially overlapping ranges (no double-counting)
export function calculateSeaTimeDays(ranges: DateRange[]): number

// Detect overlaps — returns pairs with overlap duration
export function detectOverlaps(ranges: DateRange[]): Array<{
  rangeA: DateRange; rangeB: DateRange; overlapDays: number;
}>
```

### Task 2: Fix Sea Time Calculation

Find all places where sea time is currently calculated as a naive sum and replace with `calculateSeaTimeDays()`. Search for `seaTime`, `sea_time`, `totalDays`, `formatSeaTime` usage and trace back to where the raw number is computed.

**Important:** Don't change the display format — only the calculation input. `formatSeaTime` stays as-is, just receives a more accurate number.

### Task 3: CV Import Overlap Validation

In `StepExperience.tsx`, after the user confirms yacht experience, run `detectOverlaps()`:

- **Short overlap (<28 days):** Info note: "These roles overlap by {N} days. This is common for handover periods."
- **Long overlap (>=28 days):** Amber warning: "These roles overlap by {N} days. Your sea time will be calculated based on actual calendar days, not summed separately." Highlight both entries with amber border.
- **Neither blocks import.** User can always proceed.

### Grill-Me Decisions (locked)

- **Q1.4:** 4-week (28 day) threshold. Under = info note, over = amber warning.
- **Q1.5:** Recalculate on next profile view. No batch migration.

## Allowed Files

```
lib/sea-time.ts
components/cv/steps/StepExperience.tsx
components/profile/SeaTimeSummary.tsx
lib/profile-summaries.ts (if sea time computed here)
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
sprints/ (planning docs)
docs/ops/
lib/cv/save-parsed-cv-data.ts (Lane 1)
lib/queries/profile.ts (Lane 1)
components/cv/steps/StepLandExperience.tsx (Lane 1)
components/profile/* (except SeaTimeSummary.tsx)
components/public/* (Lane 1)
supabase/migrations/* (Lane 1 — no schema changes in this lane)
lib/database.types.ts (Lane 1)
middleware.ts
app/api/stripe/*
```

## Definition of Done

- [ ] `mergeOverlappingRanges()` correctly unions overlapping date ranges
- [ ] `calculateSeaTimeDays()` returns accurate count without double-counting
- [ ] `detectOverlaps()` finds and reports all overlapping pairs
- [ ] All sea time calculations in the app use the new union-based function
- [ ] CV import shows info note for overlaps < 28 days
- [ ] CV import shows amber warning for overlaps >= 28 days
- [ ] Overlap warnings don't block import
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._
