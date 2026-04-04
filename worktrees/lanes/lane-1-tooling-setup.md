# Lane 1 — Tooling Setup

**Session:** Rally 010 Session 1
**Branch:** `feat/r010-s1-tooling`
**Worktree:** `yl-wt-1`
**Effort:** Sonnet, medium (~1h)

## Scope

Install frontend UX tooling and create the TourProvider wrapper for Onborda.

## Tasks

1. **Install Onborda** — `npm install onborda` (product tour library for Next.js App Router)
2. **Install eslint-plugin-jsx-a11y** — `npm install -D eslint-plugin-jsx-a11y`, add to `eslint.config.mjs`
3. **Install vitest-axe** — `npm install -D vitest-axe` (a11y testing helpers)
4. **Create TourProvider** — `components/tour/TourProvider.tsx`:
   - Wrap Onborda with app-level context
   - Read `yl_tour_complete` from localStorage
   - Provide `startTour()` and `completeTour()` methods
   - Skip tour if already completed
   - Mobile-optimized step positioning

## Allowed Files

- `package.json` (dependency additions only)
- `package-lock.json` (auto-generated)
- `eslint.config.mjs` (add a11y plugin)
- `components/tour/TourProvider.tsx` (new)
- `components/tour/tour-steps.ts` (new — step config, placeholder for Session 3)

## Forbidden Files

- Any page files
- Any existing component files
- Layout files

## Acceptance Criteria

- `npm install` succeeds
- `npx tsc --noEmit` passes
- `npx next lint` passes (including new a11y rules — fix any new violations)
- TourProvider compiles and exports correctly
- Onborda steps are a separate config file for easy editing in Session 3
