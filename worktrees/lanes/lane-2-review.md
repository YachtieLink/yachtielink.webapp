## Review: fix/display-polish (yl-wt-2)

**Verdict: BLOCK**

### /yl-review results
- Type-check: **PASS**
- Drift-check: **PASS** (0 new warnings)
- Sonnet scan: 1 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW
- Opus deep review: confirmed all, found 5 additional
- YL drift patterns: Partial refactor detected (ghost path not updated)
- QA: Skipped — no browser tools

### Fix List (ordered by severity)

#### 1. Ghost path in EndorsementCard not updated — partial refactor
`components/public/EndorsementCard.tsx:91-103`
The non-ghost path was restructured ("Role on Yacht" + date on separate line). The ghost path still uses the old "Yacht · Date" single-line format. This is a partial refactor introduced by this diff.
**Fix:** Mirror the non-ghost restructure in the ghost path. Put yacht on its own line, date on a separate line. Ghost endorsers don't have a `role` to show (GhostEndorserBadge handles that), so just "on {yachtName}" + separate date.

#### 2. SavedProfileCard seaTimeDays/yachtCount — dead feature code
`components/network/SavedProfileCard.tsx:29-62`
Props are never passed by the only caller (`SavedProfilesClient.tsx`). The `formatSeaTime` import is unused in practice. The detail line IIFE branches are permanently unreachable. Also has a bug: `seaTimeDays=0` with `yachtCount>0` renders "0d at sea · 3 yachts".
**Fix:** Remove the `seaTimeDays`/`yachtCount` props, the `formatSeaTime` import, and the detail line IIFE. Restore the original `subtitle` variable. Add these props back when the data plumbing (SavedProfilesClient query) is ready.

#### 3. Private EndorsementsSection — dead code modifications
`components/profile/EndorsementsSection.tsx`
Component is not imported by any active route. The `role_label` prop was added but `getProfileSections` doesn't select `role_label`. The `endorser_id: string` in the interface doesn't match the query (which returns `endorser` as a nested object, not `endorser_id` as a raw column). The `isOwn` check will never work.
**Fix:** Do not modify dead components. Revert changes to this file. When the component is activated in a future sprint, fix the interface + query together.

#### 4. Private YachtsSection — dead code modifications
`components/profile/YachtsSection.tsx`
Same issue — component not imported anywhere. The `prefixedYachtName` change and `yacht_type` removal are unreachable.
**Fix:** Revert changes to this file. Apply when activated.

#### 5. DOB sublabel regression
`app/(protected)/app/profile/settings/page.tsx`
The DOB toggle sublabel was changed from "Calculated from date of birth" (useful — explains that age is shown, not the actual DOB) to "Your age (not date of birth) will appear on your public profile" (generic pattern). The original was more informative.
**Fix:** Keep the new wording "Your age (not date of birth) will appear on your public profile" — it's actually clearer than the original. ~~Revert~~ This is acceptable. **DISMISSED on review — the new copy is fine.**

#### 6. prefixedYachtName with empty string yacht name
`lib/yacht-prefix.ts`
`prefixedYachtName('', null)` returns "M/Y " (prefix + empty). Edge case — unlikely in practice since all call sites use `?? 'Unknown Yacht'` fallback.
**Fix:** Add a guard in `prefixedYachtName`: if name is empty/whitespace, return name as-is (no prefix). Pre-existing issue but this diff expands its surface area.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits
- [x] No scope creep

### Recommendation
~~Send back to worker. Fix items 1-4 and 6. Item 5 dismissed.~~

---

### Round 2 — Fix Verification

**Verdict: PASS**

- Type-check: **PASS** (verified in Round 1)
- Drift-check: **PASS** (verified in Round 1)

| # | Original Finding | Status |
|---|-----------------|--------|
| 1 | Ghost path in EndorsementCard not updated | **RESOLVED** — ghost path now mirrors non-ghost: "on {yacht}" + separate date line |
| 2 | SavedProfileCard dead feature code | **RESOLVED** — removed props, import, IIFE; restored `subtitle` |
| 3 | Private EndorsementsSection dead code | **RESOLVED** — reverted to main; `role_label` prop removed |
| 4 | Private YachtsSection dead code | **RESOLVED** — clean revert to main |
| 5 | DOB sublabel | DISMISSED in Round 1 |
| 6 | prefixedYachtName empty string | **RESOLVED** — `if (!name.trim()) return name` guard added |

No new issues introduced. Lane 2 is clean. Ready to ship.
