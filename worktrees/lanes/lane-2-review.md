## Review: fix/sea-time-overlap (yl-wt-2)

**Verdict: BLOCK**

### /yl-review results
- Type-check: **PASS** — zero errors
- Drift-check: **PASS** — 1 pre-existing warning (StepExperience.tsx hotspot 900 LOC)
- Sonnet scan: 8 findings (0 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW)
- Opus deep review: 8 findings (0 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW) — significant overlap with Sonnet
- YL drift patterns: clean — no new drift introduced
- QA: deferred until fixes applied

### Lane compliance
- [x] All changed files within allowed list (`lib/sea-time.ts`, `lib/profile-summaries.ts`, `components/cv/steps/StepExperience.tsx`)
- [x] No forbidden file edits
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep — worker correctly flagged out-of-scope issues as Discovered Issues rather than fixing them

### Fix list

Every finding gets fixed. Ordered by severity.

1. **[MEDIUM]** `lib/sea-time.ts:50` — `detectOverlaps` should be generic: `function detectOverlaps<T extends DateRange>(ranges: T[]): Array<{ rangeA: T; rangeB: T; overlapDays: number }>`. Currently the `as` cast in StepExperience.tsx (line 627) to recover `cardIndex` from `IndexedDateRange` is fragile — any future refactor that copies/reconstructs ranges inside `detectOverlaps` will silently lose `cardIndex`, breaking the amber ring highlight with no error. One-line fix that eliminates the cast entirely. **Fix:** Add `<T extends DateRange>` generic parameter to the function signature and return type.

2. **[MEDIUM]** `lib/profile-summaries.ts:12-13` — `formatSeaTimeCompact` uses `365` and `30` as divisors while `formatSeaTime` in `sea-time.ts` uses `365.25` and `30.44`, and the new StepExperience calculation also uses `365.25`/`30.44`. For 730 days: compact shows `2y 0m`, canonical shows `1y 11mo`. Profile accordion summary and profile hero card show different values for the same user. **Fix:** Replace `formatSeaTimeCompact` with a call to `formatSeaTime(totalDays).displayShort` from `lib/sea-time.ts`.

3. **[MEDIUM]** `components/cv/steps/StepExperience.tsx:878` — `parseCVDate` doesn't guard against NaN month/day. For malformed input like `"2022-foo"`, `parts[1]` is `NaN`, and `NaN ?? 1` evaluates to `NaN` (not `1`, because `NaN` is not `null`/`undefined`). `new Date(2022, NaN, 1)` returns Invalid Date. This propagates through merge/detect math silently. **Fix:** After constructing the Date, check `if (isNaN(date.getTime())) return null`.

4. **[LOW]** `lib/sea-time.ts:17-33` — `mergeOverlappingRanges` has no guard for inverted ranges (`start > end`). Can occur from malformed CV data. `calculateSeaTimeDays` already clamps via `Math.max(0, ...)`, but inverted ranges can confuse `detectOverlaps` pair detection. **Fix:** Add early filter: `ranges.filter(r => r.start.getTime() <= r.end.getTime())` before sorting.

5. **[LOW]** `components/cv/steps/StepExperience.tsx:716-730` — Overlap warning shows only `maxOverlapDays` from a single pair. With 3+ cards and multiple overlaps (40d + 10d), only 40 is reported. Cards with sub-28-day overlaps show the info banner but get no amber ring highlight, leaving users to guess which cards overlap. **Fix:** Change copy to "Some of your roles overlap. The longest overlap is {N} days." Consider extending the ring highlight to all overlapping cards when the info banner shows, not just ≥28-day pairs.

### Pre-existing issues (backlog, not blockers)
_Issues on main that this diff didn't introduce or worsen. The worker correctly identified and documented all of these._

- **[BUG]** `supabase/migrations — get_sea_time()` SQL RPC — Sums `(ended_at - started_at)` across all attachments with no overlap handling. This is the source of incorrect totals on the profile hero card, public profile, and SeaTimeSummary. Needs a new migration with union-based interval logic. **Highest-priority post-merge fix** as it affects the most visible sea time displays.
- **[BUG]** `app/(protected)/app/profile/sea-time/page.tsx:33` — Breakdown page footer sums per-row days from `get_sea_time_detailed` naively. Creates a third divergent sea time number for users with overlapping stints. Downstream of the SQL RPC fix.
- **[BUG]** `app/(protected)/app/network/saved/page.tsx:65-72` — Inline naive sea time sum for saved profiles' sea time cards. Should use `calculateSeaTimeDays` or the fixed RPC.
- **[DEBT]** `components/cv/steps/StepExperience.tsx:543` — `updateStatus` nulls `confirmedYachtId` unconditionally. Un-skipping a confirmed card loses the matched yacht. Pre-existing, not introduced by this diff.
- **[DEBT]** `components/cv/steps/StepExperience.tsx` — 900 LOC hotspot. Pre-existing.

### Discovered Issues
_Out-of-scope problems found during review. Worker already documented all of these in their report — the review confirms them._

- **[BUG]** `get_sea_time()` SQL RPC double-counts overlapping stints (see pre-existing above)
- **[BUG]** Sea time breakdown page naive sum (see pre-existing above)
- **[BUG]** Saved profiles page naive sum (see pre-existing above)
- **[DEBT]** `formatSeaTimeCompact` divisor inconsistency (fixed in fix list #2 above)

---

## Round 2 — Re-Review After Fixes

**Verdict: PASS**

### Verification method
- Read all diffs for the 5 fix areas
- Re-ran `npx tsc --noEmit` — PASS (zero errors)
- Re-ran `npm run drift-check` — PASS (1 pre-existing warning)
- Full `/yl-review` re-run skipped — fixes were targeted one-liners

### Fix verification

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | MEDIUM | detectOverlaps needs generic type | ✅ Now `<T extends DateRange>`, cast removed from StepExperience |
| 2 | MEDIUM | formatSeaTimeCompact divisor mismatch | ✅ Deleted entirely, replaced with `formatSeaTime().displayShort` |
| 3 | MEDIUM | parseCVDate NaN guard | ✅ `isNaN(date.getTime())` check added, returns null |
| 4 | LOW | Inverted range guard | ✅ `ranges.filter(r => r.start <= r.end)` at top of merge |
| 5 | LOW | Overlap warning copy + highlight | ✅ Copy updated, all overlapping cards highlighted (not just ≥28d) |

### New issues introduced by fixes
None. All fixes are clean and targeted.
