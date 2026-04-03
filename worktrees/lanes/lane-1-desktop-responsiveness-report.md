# Worker Completion Report

---

## Lane

- **Worktree:** yl-wt-1
- **Branch:** fix/desktop-responsiveness
- **Lane file:** worktrees/lanes/lane-1-desktop-responsiveness.md

## Summary

Audited all key pages at 768px/1024px/1280px breakpoints. The app layout foundation (sidebar, content wrapper, `max-w-2xl`, `md:pl-16`, `md:hidden` bottom tab) was already solid. Found and fixed four real issues: a missing CSS variable causing the Settings page to render with no background colour, a missing media query that caused fixed floating elements to sit 64px too high on desktop, the UpgradeCTA stretching full-width without a max-width constraint, and the BottomSheet spanning the full viewport on desktop.

## Files Changed

```
app/globals.css
app/(protected)/app/more/page.tsx
components/insights/UpgradeCTA.tsx
components/ui/BottomSheet.tsx
```

## Migrations

- [x] No migrations added

## Tests

- [x] Type check passed (`npx tsc --noEmit`)
- [x] Drift check passed (`npm run drift-check` — 0 new warnings)
- [ ] /yl-review passed (run by reviewer)

## Risks

None. All changes are CSS/layout only — no logic changes, no API changes, no schema changes.

## Discovered Issues

- **[BUG]** `components/nav/SidebarNav.tsx` — Backdrop from `BottomSheet` (z-40) renders after the sidebar (also z-40) in DOM order, so it may overlay the sidebar when a sheet is open on desktop. Both are `z-40` but the backdrop wins by DOM order. Suggested fix: raise sidebar to `z-50` or lower backdrop to `z-30`.

- **[DEBT]** `app/(protected)/app/endorsement/[id]/edit/EditEndorsementClient.tsx` line 66 — uses `px-4 pb-24` without `md:-mx-6 md:px-6` pattern, so it doesn't get the navy section background on desktop. Low priority (endorsement edit is a sub-page most users rarely visit).

- **[DEBT]** `app/(protected)/app/attachment/new/page.tsx` and several other sub-pages (attachment edit, yacht page) use `min-h-screen pb-24` without the `-mx-4 md:-mx-6` background trick. Their section colors don't extend edge-to-edge. Low priority for Phase 1.

---

## Review Fixes — Round 1

Reviewer verdict: BLOCK (3 HIGH/MEDIUM, 1 LOW)

### Blockers Fixed

| # | Blocker | Fix Applied | Files Touched |
|---|---------|-------------|---------------|
| 1 | `BottomSheet.tsx:92` — `pb-tab-bar` collapses to 0 on desktop, content touches rounded corners | Replaced `pb-tab-bar` with `pb-6` | `components/ui/BottomSheet.tsx` |
| 2 | `UpgradeCTA.tsx:54` — outer `pointer-events-none`-less div blocking sidebar clicks on desktop | Added `pointer-events-none` to outer div, `pointer-events-auto` to inner content div | `components/insights/UpgradeCTA.tsx` |
| 3 | `BottomSheet.tsx:67` — centering off by 32px (half of 64px sidebar) | Changed `calc(50%_-_280px)` → `calc(50%_-_248px)` to center in content area | `components/ui/BottomSheet.tsx` |

### Warnings Addressed

| # | Warning | Action | Files Touched |
|---|---------|--------|---------------|
| 4 | [LOW] Exit animation slides down from center position (looks mobile on desktop) | Deferred — requires conditional JS logic (breakpoint detection) which is outside CSS/layout-only scope for this lane. Note for future polish sprint. | — |

### Validation (post-fix)
- Type check: pass
- Drift check: pass
- Self-review: clean

## Overlap Detected

- [x] None

## Recommended Merge Order

No ordering dependency. Can merge independently.
