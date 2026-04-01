## Review: feat/inner-page-header (yl-wt-1)

**Verdict: PASS** (blockers resolved on re-review)

### /yl-review results
- Type-check: PASS (0 errors)
- Drift-check: PASS (0 new warnings)
- Sonnet scan: completed — no remaining blockers
- Opus deep review: completed — no remaining blockers
- YL drift patterns: PASS (section color conflict resolved, dead code removed)
- QA: Skipped — visual verification recommended post-merge

### Findings

**BLOCK — fix before merge:**

1. **Section color conflict: `endorsement: navy` in PageHeader vs `endorsements: coral` in lib/section-colors.ts.**
   File: `components/ui/PageHeader.tsx` lines 22-39, `pathToSection` map.
   PageHeader has its own `pathToSection` map that conflicts with the canonical `sectionColors` in `lib/section-colors.ts`. Endorsement pages get navy instead of coral. This is a wayfinding violation.
   Fix: Replace `pathToSection` with a lookup that uses the canonical `sectionColors` map from `lib/section-colors.ts`. Don't maintain a second source of truth.

2. **Sticky bar bleed breaks on 3 pages with double `px-4` wrapping.**
   Files: `app/(protected)/app/yacht/[id]/page.tsx` line 229, `app/(protected)/app/yacht/[id]/photo/page.tsx` line 58, `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx` line 294.
   These pages wrap PageHeader in a container with `px-4`, while the layout already provides `px-4`. The `-mx-4` only cancels one layer — sticky bar is inset 16px from each edge instead of full-bleed.
   Fix: Remove the page-level `px-4` wrapper on these pages (let the layout handle padding), or move PageHeader above the padding wrapper.

3. **`count={0}` renders `(0)` in the title.**
   File: `components/ui/PageHeader.tsx` line 107.
   `{count !== undefined && (<span>({count})</span>)}` renders when count is 0. `SavedProfilesClient` passes `count={profiles.length}` — empty state shows "Saved Profiles (0)".
   Fix: Change to `{count !== undefined && count > 0 && ...}` or `{!!count && ...}`.

**WARNING — fix before or shortly after merge:**

4. **Fragment output + parent `gap-*` = inconsistent spacing.**
   PageHeader returns a Fragment (two sibling elements). Parents with `gap-4` or `gap-6` flex containers add gap between the sticky bar and title row, on top of the title's own `pt-4`. Spacing varies by page. Not visually broken but inconsistent.
   Fix: Audit during QA — may need to remove `pt-4` from title row or standardize parent gaps.

5. **`pathToLabel` has only 6 entries — unlisted paths fall back to "Back".**
   All 27 current callers resolve correctly. But future callers for `gallery`, `sea-time`, etc. get generic "Back" with no warning. The fallback is silent.
   Fix: Either add all path segments or emit a dev warning in the fallback branch.

6. **`BackButton.tsx` is orphaned dead code.**
   No file imports it. Should be deleted or explicitly retained with a comment.

7. **Profile settings page double `-mx-4` nesting works by accident.**
   `PageTransition` wrapper already has `-mx-4 px-4`, then PageHeader's sticky bar does it again. Correct result by coincidence — fragile.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep — multi-step flow conversion was in spec

### Blockers
1. Replace `pathToSection` with canonical `sectionColors` lookup (or at minimum fix endorsement: navy → coral)
2. Fix sticky bar bleed on 3 double-wrapped pages
3. Fix `count={0}` rendering

### Warnings
1. Fragment + parent gap spacing inconsistency
2. Silent `pathToLabel` fallback
3. Orphaned `BackButton.tsx`
4. Fragile double negative-margin on settings page

### Recommendation
Fix 3 blockers (~20-30 min). Blocker 1 is the most important — two section-color registries is a drift hazard. Re-review after fixes (type-check + drift-check + visual spot-check, no full /yl-review).
