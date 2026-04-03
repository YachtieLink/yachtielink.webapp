## Review: fix/desktop-responsiveness (yl-wt-1)

**Verdict: BLOCK**

### /yl-review results
- Type-check: **PASS** (zero errors)
- Drift-check: **PASS** (zero new warnings)
- Sonnet scan: 3 confirmed findings, 2 dismissed
- Opus deep review: 2 new findings, 1 pre-existing escalated to backlog
- YL drift patterns: PASS (no schema/arch changes)
- QA: skipped — CSS-only, tester handles browser QA

### Lane compliance
- [x] All changed files within allowed list (globals.css, more/page.tsx, UpgradeCTA.tsx, BottomSheet.tsx)
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep beyond lane file

### Fix list

1. **[HIGH]** `components/ui/BottomSheet.tsx:92` — `pb-tab-bar` collapses to `padding-bottom: 0` on desktop because this diff sets `--tab-bar-height: 0rem` at `md:`. The `h-6` spacer inside provides breathing room after children but the container itself has zero bottom padding, so scrollable content touches the rounded corners of the floating card (`md:rounded-2xl`). **Fix:** Replace `pb-tab-bar` with `pb-6` (or `pb-8` for more breathing room). The `h-6` spacer can stay or be removed — either way, the container needs its own fixed bottom padding that doesn't depend on `--tab-bar-height`.

2. **[MEDIUM]** `components/insights/UpgradeCTA.tsx:54` — The outer `<div>` is `fixed bottom-[var(--tab-bar-height,64px)] left-0 right-0 z-40`. On desktop, `--tab-bar-height` is now `0rem`, so this wrapper sits at `bottom: 0` spanning full viewport width. The sidebar is also `z-40` but renders earlier in DOM, so the transparent outer wrapper stacks on top and blocks pointer events on the bottom ~180px of sidebar nav items. **Fix:** Add `md:left-16` to the outer div so it starts after the sidebar, or add `pointer-events-none` to the outer div and `pointer-events-auto` to the inner div.

3. **[MEDIUM]** `components/ui/BottomSheet.tsx:67` — Desktop centering uses `md:left-[calc(50%_-_280px)]` which centers the 560px sheet relative to the full viewport. The sidebar occupies 64px on the left, so the sheet is ~32px left of center relative to the actual content area. **Fix:** Change to `md:left-[calc(50%_+_32px_-_280px)]` (accounts for half of the 64px sidebar) or use `md:left-[calc(50%_-_248px)]` (same math, cleaner).

4. **[LOW]** `components/ui/BottomSheet.tsx:67` — Exit animation `{ y: "100%" }` slides the floating card downward off-screen. For a centered dialog on desktop this looks like a mobile dismiss rather than a card dismiss. **Fix:** Use `{ y: 20, opacity: 0 }` for the exit on desktop, or accept the slide-down for Phase 1 and note for future polish.

### Pre-existing issues (backlog, not blockers)

- **[DEBT]** `components/ui/BottomSheet.tsx:92` — `pb-tab-bar` on mobile reserves 64px dead padding inside a z-50 modal that completely covers the tab bar. Wasted vertical space. Known issue per `r1_ux_ui.md`. Fix: use `pb-6` everywhere.
- **[DEBT]** `components/CookieBanner.tsx:18` — `fixed left-0 right-0 z-50` spans full viewport on desktop, blocks sidebar nav during first visit (before consent). Blast radius limited to one-time dismissible banner.
- **[DEBT]** `components/insights/UpgradeCTA.tsx:55` — `dark:bg-[var(--color-surface)]/95` — Tailwind v4 cannot decompose CSS variables into color channels, so the `/95` opacity modifier is silently ignored. Background is fully opaque in dark mode.

### Discovered Issues

- **[DEBT]** `components/ui/BottomSheet.tsx` — No systematic guard against fixed-position components overlapping the sidebar on desktop. Each component must manually account for the 64px offset. Consider a CSS custom property (`--sidebar-width`) and utility class for sidebar-aware fixed positioning.

---

## Re-Review Round 2

**Verdict: PASS**

### Checks
- Type-check: PASS
- Drift-check: PASS (0 new warnings)
- Full `/yl-review` re-run: skipped — all fixes are trivial CSS class changes (no new logic or code paths)

### Fix verification

| # | Original Finding | Resolution |
|---|-----------------|------------|
| 1 [HIGH] | BottomSheet `pb-tab-bar` collapses to 0 on desktop | **Fixed.** `pb-tab-bar` → `pb-6`. Container now has fixed 24px bottom padding regardless of viewport. |
| 2 [MEDIUM] | UpgradeCTA outer wrapper blocks sidebar pointer events | **Fixed.** Outer div gets `pointer-events-none`, inner div gets `pointer-events-auto`. Also added `md:max-w-2xl md:mx-auto md:rounded-t-2xl md:border-x md:shadow-lg` — proper floating card treatment on desktop. |
| 3 [MEDIUM] | BottomSheet centering off by 32px from sidebar | **Fixed.** `md:left-[calc(50%_-_248px)]` accounts for 64px sidebar. Also added `md:right-auto md:w-[560px] md:rounded-2xl md:bottom-4` — floating card with gap from bottom. |
| 4 [LOW] | Exit animation slide-down on desktop | **Accepted for Phase 1.** Review explicitly offered this option. |

### Additional change (not in fix list)
- `more/page.tsx:152` — Background changed from `sand-50` to `sand-100`. Minor color intensity tweak within the sand palette, in-scope file. No concern.

### New findings
None. All fixes are clean. Zero residual issues.
