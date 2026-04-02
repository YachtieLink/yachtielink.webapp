# QA Report — 2026-04-03 (Rally 009 Session 2)

**Tester:** Claude Code (Opus) — Tester
**Session:** sessions/2026-04-03-rally009-session2.md
**Lanes tested:** Lane 1 (feat/land-experience, yl-wt-1), Lane 2 (fix/sea-time-overlap, yl-wt-2)
**Verdict:** PASS (all issues resolved)

## Tested (every input -> output pair)

| # | Lane | Feature | Input | Expected Output | Actual | Status |
|---|------|---------|-------|-----------------|--------|--------|
| 1 | 2 | Sea time stat cards in StepExperience | Upload CV, advance to Step 2 | Union-based sea time, yacht count, since year | 8 yachts, 3y 7mo, since 2007 — correct | pass |
| 2 | 2 | No overlap = no warning | CV with non-overlapping yacht dates | No overlap warning shown | No warning rendered | pass |
| 3 | 2 | Duplicate yacht warning | CV with 2 stints on M/Y WTR | Amber warning about same yacht match | Warning shown correctly | pass |
| 4 | 2 | Shore-based roles message (Lane 2 branch) | CV with 4 non-yacht roles | Info message about shore roles | "We also found 4 shore-based roles" shown | pass |
| 5 | 2 | parseCVDate NaN guard | Code review: malformed date strings | Returns null for NaN dates | isNaN(date.getTime()) check on line 875 | pass |
| 6 | 2 | mergeOverlappingRanges inverted range guard | Code review | Filters ranges where start > end | Filter on line 19 | pass |
| 7 | 2 | detectOverlaps generic type | Code review | Preserves subtypes (cardIndex) | Generic <T extends DateRange> — no cast needed | pass |
| 8 | 2 | formatSeaTimeCompact replaced | Code review: profile-summaries.ts | Uses canonical formatSeaTime().displayShort | Line 53 uses displayShort | pass |
| 9 | 2 | computeSeaTime union-based | Code review: profile-summaries.ts | calculateSeaTimeDays replaces naive sum | Line 37: calculateSeaTimeDays(ranges) | pass |
| 10 | 1 | Wizard step count | Open CV wizard on Lane 1 | 6 steps (was 5) | "Step 2 of 6" confirmed | pass |
| 11 | 1 | StepLandExperience renders | Advance past StepExperience | Step 3 shows shore-side roles | 4 roles with company, role, dates, descriptions | pass |
| 12 | 1 | StepLandExperience edit | Click edit pencil on first card | Edit form with fields | Form rendered: Company, Role, Start, End, Description | pass |
| 13 | 1 | StepLandExperience confirm count | View confirm button | Count matches non-empty roles | "Confirm 4 shore-side roles" — correct | pass |
| 14 | 1 | StepReview shore-side section | Advance to Step 6 | Shore-Side Experience section listed | "Shore-Side Experience (4)" with all 4 roles | pass |
| 15 | 1 | Import celebration includes shore-side | Click Import | Celebration shows land experience count | "4 shore-side roles" in badge line | pass |
| 16 | 1 | Land experience saved to DB | After import, query land_experience | 4 rows with correct data | 4 rows: 1 Hotel, Chateau Rigaud, Coast, E'cco | pass |
| 17 | 1 | Career timeline anchor icons (yacht) | View profile Career section | Navy anchor icon for yacht entries | Anchor in navy circle — correct | pass |
| 18 | 1 | Career timeline briefcase icons (land) | View profile Career section | Amber briefcase icon for shore-side | Briefcase in amber circle for "1 Hotel" | pass |
| 19 | 1 | Career timeline sort order | View profile Career section | Reverse chronological, current first | Entries sorted correctly | pass |
| 20 | 1 | GDPR export includes land_experience | Code review: export/route.ts | land_experience queried and included | Lines 33, 49, 68 confirmed | pass |
| 21 | 1 | Public profile experience detail | /u/dev-qa/experience | Shore-side roles in position list | FIXED — was missing, now shows 16 positions | pass (fixed) |

## Toggle Matrix

No new toggles introduced by either lane.

## Copy Review

- "Shore-Side Experience" heading — clear, accurate
- "We found some non-yachting roles in your CV. These show up on your profile timeline alongside your yacht career." — accurate, good framing
- "4 shore-side roles" celebration badge — consistent with step naming
- "Some of your roles overlap. The longest overlap is {N} days." — clear, non-alarming
- "This is common for handover periods." — reassuring, appropriate

## Visual Consistency

- Anchor icons: Navy circle (color-navy-50 bg, color-navy-500 icon) — matches navy palette
- Briefcase icons: Amber circle (color-amber-50 bg, color-amber-600 icon) — matches CV amber palette
- Icon distinction: Different shape AND color — no confusion possible
- StepLandExperience cards: Amber briefcase icons, consistent with CV section

## Journey Tests

- **Full CV import (Lane 1)**: Upload -> Personal -> Experience -> Shore-Side -> Qualifications -> Extras -> Review -> Import -> Celebration -> Profile with mixed timeline. **PASS**
- **Public profile (Lane 1)**: /u/dev-qa -> Experience -> "See all 16 positions" with land experience included. **PASS** (after fix)
- **CV import (Lane 2)**: Upload -> Personal -> Experience with stat cards + overlap detection. **PASS** (no overlaps in test data — correct no-warning behavior)

## Architecture Check

- Land experience null-date sorting: entries with null start/end dates sort as "current" in CareerTimeline.tsx (null end_date = Present). Semantically wrong — null dates = unknown, not active. Medium severity.
- get_sea_time() SQL RPC remains naive — pre-existing, documented by worker as highest-priority post-merge fix.

## Fixed (applied in yl-wt-1 during QA)

| # | Lane | File | What was wrong | What was fixed |
|---|------|------|----------------|----------------|
| 1 | 1 | `app/(public)/u/[handle]/experience/page.tsx` | Experience detail page did not call getLandExperience — shore-side roles missing from public "See all N positions" view | Added getLandExperience to Promise.all, merged entries with yacht/land icons (anchor/briefcase), proper date sorting. Now shows 16 positions. |
| 2 | 1 | `CareerTimeline.tsx` + `profile/page.tsx` | Career was a separate card from Sea Time, fully expanded (12+ entries), making page very long. Founder: merge, collapsible. | Merged Career into Sea Time card. Shows 3 entries collapsed + "Show N more". Removed standalone SeaTimeSummary, inlined stats in combined card. |
| 3 | 1 | `CareerTimeline.tsx` | Land experience with null start/end dates sorted as "current" (above 2025 yacht entries). Null dates = unknown, not active. | Added hasStartDate() guard. Only entries with start_date but no end_date sort as current. No-date entries sort at end. |

## Escalated (high — needs worker fix)

None — all issues resolved during QA.

## Backlog items created

None.

## Discovered Issues

- **[PRE-EXISTING]** Hydration mismatch error on CV page — date formatting renders differently server vs client. Not introduced by either lane.
- **[PRE-EXISTING]** get_sea_time() SQL RPC uses naive sum — profile hero card and SeaTimeSummary don't account for overlaps. Lane 2 fixes client-side calcs but DB function remains naive. Worker documented as highest-priority post-merge fix.
