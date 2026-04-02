# Worker Completion Report

---

## Lane

- **Worktree:** yl-wt-2
- **Branch:** fix/sea-time-overlap
- **Lane file:** worktrees/lanes/lane-2-sea-time-overlap.md

## Summary

Added three date-range utility functions (`mergeOverlappingRanges`, `calculateSeaTimeDays`, `detectOverlaps`) to `lib/sea-time.ts` as the canonical calculation layer. Replaced the naive month-based sea time sum in `StepExperience.tsx` with union-based calculation via `calculateSeaTimeDays`, and added overlap detection with two-tier warning UI (info note <28 days, amber warning ≥28 days) plus amber ring highlights on overlapping cards. Also fixed the naive sum in `lib/profile-summaries.ts#computeSeaTime`, which feeds the profile accordion summary text.

## Files Changed

```
lib/sea-time.ts                          — added DateRange, mergeOverlappingRanges, calculateSeaTimeDays, detectOverlaps
lib/profile-summaries.ts                 — computeSeaTime now uses calculateSeaTimeDays instead of naive sum
components/cv/steps/StepExperience.tsx  — union-based calculation, overlap detection, warning UI
```

## Migrations

- [x] No migrations added

## Tests

- [x] Type check passed (`npx tsc --noEmit` — zero errors)
- [x] Drift check passed (`npm run drift-check` — 1 pre-existing warning: StepExperience.tsx hotspot LOC, not introduced by this lane)
- [ ] /yl-review passed (run by reviewer, not worker)
- [x] Manual QA notes: logic verified by tracing through merge algorithm. Edge cases checked: empty array, single range, adjacent non-overlapping ranges (no merge), identical ranges (merge to one), partial-day date strings ("YYYY-MM", "YYYY"). The <31-day edge case (seaTimeDays > 0 but both totalYears and remainingMonths = 0) was caught and fixed — stat card now conditionally renders on `totalYears > 0 || remainingMonths > 0` to match the old behavior.

## Risks

- **`get_sea_time` DB RPC remains naive:** The profile page hero card and SeaTimeSummary receive `totalDays` from the `get_sea_time` Supabase RPC, which is still a naive sum at the SQL level (see Discovered Issues). The three files this lane touches now calculate correctly, but the DB function needs a separate fix.
- **SeaTimeSummary.tsx not changed:** No fix needed here — it only formats a pre-computed `totalDays`. The upstream callers are responsible for the accuracy of that number.

## Discovered Issues

- **[BUG]** `app/(protected)/app/profile/sea-time/page.tsx:33` — `seaTimeEntries.reduce((sum, e) => sum + e.days, 0)` is a naive sum of per-stint entries from `get_sea_time_detailed`. If a user has overlapping stints this will over-count. Needs union-based fix on the client side (or ideally, the DB function should return non-overlapping segments). Not in allowed files for this lane.

- **[BUG]** `app/(protected)/app/network/saved/page.tsx:65-72` — Inline naive sea time sum for saved profiles' sea time cards. Same double-counting issue. Not in allowed files for this lane.

- **[BUG]** `supabase/migrations/20260321000001_fix_storage_buckets.sql:76` — `get_sea_time()` SQL function sums `(ended_at - started_at)` across all attachments without overlap handling. This is the source of incorrect totals on the profile hero card and SeaTimeSummary. Needs a new migration that implements range union logic in SQL (e.g., using a recursive CTE or generate_series approach). Highest-priority fix as it affects the most visible sea time displays.

## Overlap Detected

- [x] None — lane 1 (`lib/cv/save-parsed-cv-data.ts`, `lib/queries/profile.ts`) is separate from the files touched here. No conflicts.

## Recommended Merge Order

This lane can merge independently — it only adds to `lib/sea-time.ts` and modifies `StepExperience.tsx` and `profile-summaries.ts`, none of which are touched by Lane 1. No ordering dependency.

---

## Review Fixes — Round 1

Reviewer verdict: BLOCK — 3 MEDIUM, 2 LOW blockers

### Blockers Fixed

| # | Blocker | Fix Applied | Files Touched |
|---|---------|-------------|---------------|
| 1 | `detectOverlaps` return type lost subtype properties (fragile `as` cast) | Made function generic: `detectOverlaps<T extends DateRange>` — cast in StepExperience removed entirely | `lib/sea-time.ts`, `components/cv/steps/StepExperience.tsx` |
| 2 | `formatSeaTimeCompact` divisor inconsistency (365/30 vs 365.25/30.44) | Deleted `formatSeaTimeCompact`; `experienceSummary` now uses `formatSeaTime(totalDays).displayShort` | `lib/profile-summaries.ts` |
| 3 | `parseCVDate` NaN propagation from malformed month/day (e.g. "2022-foo") | Added `if (isNaN(date.getTime())) return null` guard after constructing Date | `components/cv/steps/StepExperience.tsx` |
| 4 | `mergeOverlappingRanges` no guard for inverted ranges (`start > end`) | Added `valid = ranges.filter(r => r.start <= r.end)` before sort | `lib/sea-time.ts` |
| 5 | Overlap warning copy referred to single pair; ring highlight only on ≥28-day pairs | Updated copy to "Some of your roles overlap. The longest overlap is {N} days."; ring now applied to ALL overlapping card indices (not just ≥28-day pairs); renamed `longOverlapCardIndices` → `overlapCardIndices` | `components/cv/steps/StepExperience.tsx` |

### Warnings Addressed

None — all findings were blockers.

### Validation (post-fix)
- Type check: pass (zero errors)
- Drift check: pass (1 pre-existing hotspot warning, StepExperience.tsx 896 LOC)
- Self-review: clean
