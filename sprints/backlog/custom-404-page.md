# Custom 404 Page

**Status: RESOLVED** — Shipped in PR #142 (branded 404 page, 2026-04-02)

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-03-26

## Summary
Replace the generic Next.js 404 page with a branded YachtieLink 404. Founder suggested the copy: "Even the best navigators get lost." Current 404 is a plain "Page not found" with a "Go home" link — no branding, no nav, no personality.

## Scope
- Custom `app/not-found.tsx` with YachtieLink branding, nav bar, and nautical-themed copy
- Link back to home or profile (context-dependent if possible)
- Mobile-first layout matching existing design system
- Consider: compass/anchor illustration or emoji

## Notes
- Discovered during Wave 4 QA when dev server crashed and showed the generic 404 repeatedly
- Should match the style guide voice — professional but warm
