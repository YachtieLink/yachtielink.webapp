---
title: Scroll position restoration on back navigation
status: idea
source: founder (2026-04-03)
priority: high
modules: [infrastructure]
estimated_effort: 3-4 hours (Sonnet, high effort)
---

# Scroll Position Restoration on Back Navigation

## Problem

When a user navigates from a page to a detail page (e.g., public profile → colleague list → back), the back button returns them to the top of the previous page. They lose their scroll position. This is frustrating on long pages — the user was mid-scroll, tapped something, and now has to find where they were.

## Vision

Pressing the contextual back button ("← Profile", "← Network", etc.) returns the user to the exact scroll position they were at when they left. This should work across almost all page transitions.

## Notes

- Next.js App Router has `scroll: false` on `<Link>` and `router.push` — but this prevents scrolling to top on forward navigation, which is usually wanted
- The pattern is: **forward navigation scrolls to top, back navigation restores position**
- Browser native back button already does this in many cases (bfcache). The issue is our custom contextual back buttons which use `router.push` instead of `router.back()`
- Need to decide: use `router.back()` (browser history) or store scroll position manually (more control)

## Exceptions where scroll restoration may not make sense

- After a form submission (user completed an action, context changed)
- After deleting/removing the item they were viewing
- When the source page data has changed significantly since they left
