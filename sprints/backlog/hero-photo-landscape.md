# Hero Photo — Landscape Viewport

**Source:** Founder observation during QA (2026-04-03)
**Priority:** Low (responsive design backlog)
**Module:** profile (public)

## Problem

Hero photo on public profile pages looks weird at landscape/desktop viewport widths (e.g. 1280×800). The photo stretches or crops awkwardly when the viewport is wide and short.

## Observed

- On Charlotte's profile (`/u/test-seed-charlotte`) at 1280×800, the hero image fills the full width but may not have appropriate aspect ratio constraints for landscape viewports.
- Mobile portrait (375×812) renders correctly.

## Partial Fix Applied (QA session)

- Added `md:max-h-[28rem] lg:max-h-[32rem]` to `HeroSection.tsx` — constrains height at wider viewports.
- However, `object-fit: cover` with generic `object-position` still crops faces at these constrained heights (Charlotte's face gets cut off).

## Full Fix Needed (responsive design sprint)

- Per-photo focal point data (already exists as `focal_point_x`/`focal_point_y` in the photo context API)
- Use focal point to set `object-position` dynamically so faces aren't cropped regardless of viewport aspect ratio
- Consider different hero aspect ratios at breakpoints (taller at mobile, wider at desktop)
- May need a "hero photo crop preview" in the photo upload flow

## Files Likely Involved

- `components/public/HeroSection.tsx` — hero container + image
- Photo upload/crop flow — focal point selection
- CSS for responsive hero container
