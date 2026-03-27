# Settings Preview UX — Show Don't Tell

**Source:** Founder direction during Sprint 11 planning (2026-03-28)
**Priority:** P1
**Category:** UX, Design System

---

## Problem

When users make choices in settings (view mode, scrim preset, accent colour, visibility toggles, etc.), they see labels and controls but no preview of what their choice actually does. This is poorly done across the app.

Users need to see the effect of their choice **before** committing to it. A radio button labelled "Rich Portfolio" means nothing if they can't see what Rich Portfolio looks like with their content.

## Principle

**Show, don't tell.** Every setting that affects visual presentation must include a preview or demonstration of what the user is choosing. The preview should use the user's actual data (their photo, their name, their content) — not generic examples.

## Surfaces to address

### Sprint 11 (immediate)
- **View mode selector** (Profile / Portfolio / Rich Portfolio): Show miniature mockup cards of each layout, ideally with the user's actual profile content. Include a "Preview" button that opens their public profile in the selected mode.
- **Scrim preset** (Dark / Light / Teal / Warm): Show thumbnails of the user's hero photo with each scrim applied. Not abstract colour dots.
- **Accent colour**: Show how the accent appears on section icons/accents using the user's profile layout.

### App-wide (backlog audit)
- **Visibility toggles** (show_phone, show_email, etc.): What does toggling this actually change? Show a before/after or highlight the affected area.
- **CV visibility** (cv_public, cv_public_source): What does "Generated" vs "Uploaded" mean visually? Show a preview of each.
- **Any other setting that affects presentation**: Audit all settings pages and add previews where missing.

## Implementation patterns

1. **Inline preview**: The setting control itself shows the effect (e.g. scrim preset thumbnails using the user's photo)
2. **Side-by-side preview**: Setting on left, live preview on right (desktop) or below (mobile)
3. **"Preview" action**: A button that opens the affected page/view with the selected setting applied temporarily (not saved until confirmed)

## Notes

- This is a design system principle, not a one-off fix
- Should be documented in `docs/design-system/patterns/settings-preview.md` once established
- Applies to future settings too — any new setting that affects visual output needs a preview
