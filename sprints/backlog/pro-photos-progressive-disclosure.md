# Pro Photos: Progressive Disclosure UX

**Status:** Idea
**Priority:** P2 — Pro UX
**Source:** Walkthrough QA (Rally 010, 2026-04-04)

## Founder Feedback

> "A pro person is rewarded with complexity rather than simplicity. They should have a simple experience first with the ability to fold in complexity."

> "Hero needs to be defined — tell people what a hero photo is."

## Problem

The current Pro photos page shows everything at once: 3 photo slots, context assignment toggles, 3 context previews with focal links. This is overwhelming. Pro users pay for power features but the UX should guide them, not dump everything on screen.

## Proposed Approach

### Simple Default
- Show profile photos in a grid (same as now)
- Below: a single "Customize where photos appear" expandable section (collapsed by default)
- The simple view just shows photos with upload/delete — same as free users but with 3 slots

### Expanded Pro Section (tap to reveal)
- Context previews (Avatar, Hero, CV) with descriptions:
  - **Avatar** — "The circular photo used in your profile card and endorsements"
  - **Hero** — "The banner image at the top of your public profile page"
  - **CV** — "The square photo on your generated CV document"
- Per-context photo assignment
- Per-context focal point setting

### InfoTooltips
- Add InfoTooltip on "Hero" label explaining what it is
- Consider a first-time education card for context assignment

## Notes

- The DB, API, and core logic are built — this is purely a layout/interaction redesign
- Consider using the same collapsible pattern used elsewhere in the app
- The focal point modal with context tabs is already good — just the main page layout needs simplification
