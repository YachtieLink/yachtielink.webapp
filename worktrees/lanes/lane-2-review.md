## Review: fix/display-polish (yl-wt-2)

**Verdict: PASS**

### /yl-review results
- Type-check: **PASS** (exit 0)
- Drift-check: **PASS** (0 new warnings)
- Sonnet scan: 0 CRITICAL, 0 HIGH, 2 MEDIUM, 3 LOW
- Opus deep review: 0 P1, 1 P2
- YL drift patterns: **PASS** — uses existing helpers, no new drift
- QA: Skipped — pure display formatting changes, no new interactive surfaces

### Findings

**MEDIUM — Ghost endorser path layout inconsistency**
`components/public/EndorsementCard.tsx` lines 91-103: The non-ghost branch was restructured to show "Role on Yacht" on one line and date on a separate line. The ghost endorser branch still uses the old "Yacht · Date" format on one line. Visual asymmetry between ghost and non-ghost endorsement cards on the same profile. Cosmetic, not a crash.

**MEDIUM — SavedProfileCard seaTimeDays/yachtCount props are dead (ACKNOWLEDGED)**
`components/network/SavedProfileCard.tsx`: The new `seaTimeDays` and `yachtCount` props are never passed by the only caller (`SavedProfilesClient.tsx`). The detail line always falls back to role + departments. Worker acknowledged this in their report — the calling code is outside Lane 2's allowed files. Feature is ready but inert until wired.

**LOW — Private EndorsementsSection + YachtsSection have no active callers (PRE-EXISTING)**
Both modified components are not imported by any live app route. Changes are logically correct and ready for future use, but zero production impact right now.

**LOW — `prefixedYachtName('Unknown yacht', null)` returns "M/Y Unknown yacht" (PRE-EXISTING)**
The utility defaults to "M/Y" when yacht_type is null. Now applied to 3 more surfaces. Edge case where yacht data is null would show "M/Y Unknown Yacht" — misleading but pre-existing behavior.

**LOW — formatSeaTime naming collision (PRE-EXISTING)**
`lib/profile-summaries.ts` and `lib/sea-time.ts` both export `formatSeaTime` with different signatures. Not introduced by this branch.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep beyond lane file

### Blockers
None.

### Warnings
1. Ghost endorser path in EndorsementCard should mirror the new layout structure — follow-up fix
2. SavedProfileCard props need wiring from SavedProfilesClient — follow-up task

### Merge note
This lane modifies `settings/page.tsx` lines 368-420 (ToggleRow sublabels). Lane 3 also modifies this file (different sections). Merge Lane 2 first — smaller, cleaner changes. Lane 3 may need a trivial conflict resolution.

### Recommendation
Merge as-is.
