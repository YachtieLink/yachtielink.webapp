# YachtPicker — Render-Body setTimeout → useEffect

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-04-03

## Summary
`components/yacht/YachtPicker.tsx:114-118` uses `setTimeout(() => searchYachts(...), 0)` in the render body instead of a `useEffect`. This fires twice in StrictMode (React dev) and can cause abandoned render issues in production.

## Scope
- Move initial search trigger to `useEffect` with `[initialQuery]` dependency
- Clean up any double-fire effects in StrictMode

## Files Likely Affected
- `components/yacht/YachtPicker.tsx`

## Notes
- Source: Lane 3 worker discovered issue, Rally 009 Session 6
- Low urgency — only affects dev StrictMode and edge cases; no known user-facing bug
