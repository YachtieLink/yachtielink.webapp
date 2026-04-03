# CV Page — Button Color + Upload UX

**Source:** Founder observations during QA (2026-04-03)
**Priority:** Medium
**Module:** cv

## Problem 1: Teal button on amber page

The "Build profile from CV" button on the CV tab (`/app/cv`) uses the default teal button color instead of the amber section color. Violates section color wayfinding.

## Problem 2: Upload UX regression

The founder preferred the old clickable drop-zone icon for CV upload over the current large button approach. The dashed upload area with a tap target felt more natural than a standalone CTA button.

## Suggested Fix

- Update the CV upload page to use amber-colored CTA buttons
- May need a `variant` or `context` prop on the Button component to support section-colored CTAs
- Or use `className` override with amber tokens from `lib/section-colors.ts`

## Files Likely Involved

- `app/(protected)/app/cv/upload/page.tsx` or equivalent
- `components/ui/Button.tsx` — may need section color variant
- `lib/section-colors.ts` — amber token reference
