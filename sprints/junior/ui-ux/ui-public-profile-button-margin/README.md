# UI: Public profile — top buttons have no margin

**Started:** 2026-03-22
**Status:** 🎨 In Progress
**Severity:** Low

## Problem

On the public profile page, the top bar buttons (back `<`, edit pencil, share) sit flush against the top of the screen with no margin. On mobile they butt up against the browser/OS chrome.

## Location

`components/public/PublicProfileContent.tsx` — the top bar button row needs `pt-safe-top` or a fixed top margin.

## Fix

Add top padding to the button container that accounts for the safe area inset on mobile:

```tsx
// Before
<div className="absolute top-4 left-4 ...">

// After — use safe area or increase fixed offset
<div className="absolute top-[calc(env(safe-area-inset-top)+16px)] left-4 ...">
// or simpler:
<div className="absolute top-4 left-4 ... pt-safe-top">
```

Note: `pt-safe-top` was previously removed as a non-existent utility (Sprint 10.3). Use `env(safe-area-inset-top)` inline in a `calc()` or add a viewport-meta-aware top offset instead.

## Verification

- On mobile (375px): back button and action buttons have visible breathing room from top of screen
- On desktop: unchanged or slightly more padding, acceptable
