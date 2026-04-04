# InfoTooltip — Platform-Wide Rollout & Infrastructure

**Status:** fleshed-out
**Priority guess:** P2 (important)
**Date captured:** 2026-04-04

## Summary
Roll out the `InfoTooltip` component across every tab and page in the platform, and add it to the component infrastructure so it's used consistently in all future features. Tooltips should follow section color wayfinding (teal on Profile, amber on CV, coral on Insights, navy on Network, sand on More).

## What We Built (Rally 010)
- Custom `InfoTooltip` component at `components/ui/InfoTooltip.tsx`
- Tap-friendly: click to toggle on mobile, hover on desktop
- Outside click/touch dismisses
- Viewport-aware positioning: detects edge overflow via `getBoundingClientRect()` and shifts the tooltip body horizontally, with the arrow counter-shifting to always point at the trigger
- Dark background (`--color-text-primary`) with light text (`--color-surface`), 220px max-width
- Currently deployed on Profile page only: strength ring, Pro link, YachtieLink

## Implementation Lessons (carry forward)
1. **Tap + hover dual mode** — `onClick` toggles, `onMouseEnter`/`onMouseLeave` for desktop hover. Both needed.
2. **Viewport edge detection** — `requestAnimationFrame` after open to measure position. Shift tooltip body, counter-shift arrow. 12px minimum padding from viewport edge.
3. **Arrow must track the trigger** — when tooltip body shifts by `offset`, arrow gets `translateX(calc(-50% + ${-offset}px))` to stay pointed at the (i) button.
4. **Outside dismiss** — listen for `mousedown` + `touchstart` on `document`, check `containerRef.contains()`. Clean up listeners on close.
5. **Don't use library tooltips** — @base-ui/react tooltip was hover-only and broke on mobile. Custom implementation is small and works perfectly.
6. **Copy style** — short, benefit-oriented. "Your custom Pro link — a cleaner, more professional URL for CVs and business cards." Not technical descriptions.

## Scope

### Phase 1: Section Color Wayfinding
- Add a `color` prop to `InfoTooltip` that accepts `'teal' | 'amber' | 'coral' | 'navy' | 'sand'` (defaulting to current dark style or section-appropriate color)
- Background and arrow should use the section's accent color (from `lib/section-colors.ts`): e.g., `accent500` for bg, white or dark text depending on contrast
- Profile pages = teal, CV pages = amber, Insights pages = coral, Network pages = navy, More/Settings pages = sand

### Phase 2: Platform-Wide Deployment
Audit every page and add InfoTooltips where users would benefit from a brief explanation:

**Profile tab (teal):**
- Already done: strength ring, Pro link, YachtieLink
- Section visibility toggles (what "visible" means — CV + public profile)
- Endorsement count / what endorsements do
- Sea time calculation explanation
- Skills section (how skills affect search visibility)

**CV tab (amber):**
- CV generation status (what triggers a rebuild)
- PDF download vs share link
- "Stale" indicator (what makes a CV stale)
- Template selection (what each template emphasises)

**Network tab (navy):**
- Connection strength indicators
- Mutual yacht connections
- How connections are discovered (yacht overlap)
- Endorsement requests

**Insights tab (coral):**
- Profile views (who counts, what's anonymous)
- Search appearances (what this metric means)
- Trending up/down indicators
- Time period selectors

**More/Settings tab (sand):**
- Pro plan features breakdown
- Visibility settings (public vs crew-only vs hidden)
- Data export
- Account deletion consequences

### Phase 3: Infrastructure / Future-Proofing
- Add `InfoTooltip` to the design system docs (`docs/design-system/style-guide.md`)
- Add to component library exports (`components/ui/index.ts` if not already)
- Document usage pattern: when to use (explaining non-obvious features), when NOT to use (obvious actions, already-labelled buttons)
- Ensure all new features going forward include InfoTooltips where appropriate — add to the design review checklist
- Consider a `useInfoTooltip` hook or context if we need to dismiss all tooltips globally (e.g., on page navigation)

## Files Likely Affected
- `components/ui/InfoTooltip.tsx` — add `color` prop, map to section colors
- `lib/section-colors.ts` — may need tooltip-specific color tokens (bg + text for sufficient contrast)
- Every page component across all 5 tabs — add InfoTooltip instances
- `docs/design-system/style-guide.md` — document the component
- `docs/design-system/patterns/page-layout.md` — add tooltip guidelines

## Notes
- The current dark navy tooltip works well on the teal Profile page, but will need contrast-checking when we introduce colored variants per tab.
- Keep tooltip copy short (1-2 sentences max). Lead with what it does for the user, not what it is technically.
- Mobile is the primary target — always test tap behavior and viewport positioning on 375px width.
- The founder specifically called out that this should be infrastructure-level: every future feature should include tooltips where helpful, not just a one-time retrofit.
