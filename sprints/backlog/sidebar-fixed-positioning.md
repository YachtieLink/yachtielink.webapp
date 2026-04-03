# Sidebar-Aware Fixed Positioning

**Status:** idea
**Priority guess:** P3 (developer experience / polish)
**Date captured:** 2026-04-04
**Source:** Lane 1 reviewer (Rally 009 Session 7)

## Summary
There is no systematic pattern for fixed-position UI elements (bottom CTAs, dialogs, banners) to account for the 64px sidebar on desktop. Each component currently hard-codes the offset manually (e.g. `md:left-[calc(50%_-_248px)]`). This creates maintenance risk — adding a new fixed component requires remembering the magic number.

## Scope
- Add `--sidebar-width: 64px` CSS custom property in `globals.css` at the `md:` breakpoint (0 at mobile)
- Create a Tailwind utility or helper class (`sidebar-offset`, `sidebar-aware-left`) that uses `calc(... + var(--sidebar-width, 0px))` pattern
- Refactor existing consumers: `BottomSheet.tsx`, `UpgradeCTA.tsx`, `CookieBanner.tsx` to use the utility instead of the magic number

## Files Likely Affected
- `app/globals.css` — add CSS variable
- `components/ui/BottomSheet.tsx` — refactor centering calc
- `components/insights/UpgradeCTA.tsx` — refactor left offset
- `components/CookieBanner.tsx` — uses fixed full-width, blocks sidebar on first visit

## Notes
`CookieBanner.tsx` also spans full viewport on desktop and blocks sidebar during first visit (before consent). Low blast radius since it's one-time dismissible, but worth fixing in the same pass.
