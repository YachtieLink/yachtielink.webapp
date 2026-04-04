# Lane 1 — Product Tour Wiring

**Session:** Rally 010 Session 3
**Branch:** `feat/r010-s3-tour-wiring`
**Worktree:** `yl-wt-1`
**Effort:** Opus, high (~2h)

## Scope

Wire the TourProvider (built in Session 1) into the app layout and add data-tour attributes to target elements so the 7-step product tour actually works.

## Tasks

1. **Wire TourProvider into layout** — `app/(protected)/app/layout.tsx`:
   - Import and wrap children with `<TourProvider>`
   - Must be inside the auth-protected boundary
   - Must be a client boundary (TourProvider is 'use client')

2. **Add data-tour attributes** to target elements across pages:
   - `data-tour="profile-hero"` — on ProfileHeroCard wrapper in `profile/page.tsx`
   - `data-tour="strength-ring"` — on the CompactStrengthRing in ProfileHeroCard
   - `data-tour="network-page"` — on the page header in `network/page.tsx`
   - `data-tour="cv-page"` — on the page header in `cv/page.tsx`
   - `data-tour="insights-page"` — on the page header in `insights/page.tsx`
   - `data-tour="settings-page"` — on the page header in `more/page.tsx`

3. **Verify tour step routing** — ensure each step's `nextRoute` and `prevRoute` match actual page paths:
   - Step 1-2: Profile (no route change)
   - Step 3: → /app/network
   - Step 4: → /app/cv
   - Step 5: → /app/insights
   - Step 6: → /app/more
   - Step 7: back to profile (prevRoute: /app/more, selector: profile-hero)

4. **Handle data-tour on server components** — The `data-tour` attribute is just a regular HTML attribute. It can be placed on a wrapper `<div>` in server components without needing 'use client'. Don't add 'use client' just for a data attribute.

## Allowed Files

- `app/(protected)/app/layout.tsx` (add TourProvider wrapper)
- `app/(protected)/app/profile/page.tsx` (add data-tour attributes)
- `app/(protected)/app/network/page.tsx` (add data-tour attribute)
- `app/(protected)/app/cv/page.tsx` (add data-tour attribute)
- `app/(protected)/app/insights/page.tsx` (add data-tour attribute)
- `app/(protected)/app/more/page.tsx` (add data-tour attribute)
- `components/profile/ProfileHeroCard.tsx` (add data-tour to strength ring)
- `components/tour/tour-steps.ts` (adjust step config if needed)

## Forbidden Files

- TourProvider.tsx (already built in Session 1)
- Tab bar component
- API routes, migrations

## Acceptance Criteria

- TourProvider wraps the app layout
- All 7 tour selectors have matching `data-tour` attributes on real DOM elements
- Tour auto-starts for new users (no localStorage key)
- Tour can be skipped/completed (localStorage key set)
- Tour navigates between tabs correctly
- `npx tsc --noEmit` passes
