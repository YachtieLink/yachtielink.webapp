# Build Plan Review Round 1 — Fixes Applied

Two review agents scrutinized the build plan. This document records every issue found and the fix applied.

---

## Critical Fixes

### Fix 1: nav-config.ts must use existing custom icon system, not Lucide
**Issue:** Nav components use paired custom SVGs (outline + filled) from `./icons.tsx`. The build plan used Lucide single-icons which would break the active/inactive visual distinction.
**Fix:** `nav-config.ts` exports route/label data only. Icon components stay in their respective nav files. The `NavTab` interface has `icon: React.ComponentType` and `activeIcon: React.ComponentType`, imported from the existing `./icons` files.

### Fix 2: PublicProfileContent.tsx is a server component — extract hero to client component
**Issue:** Adding `useScroll`/`useTransform` requires client-side hooks, but `PublicProfileContent.tsx` has no `'use client'` directive.
**Fix:** Extract the hero section into `components/public/HeroSection.tsx` with `'use client'`. The parent stays as a server component. HeroSection receives photo URLs and profile data as props.

### Fix 3: Hero parallax — intentionally increase from 34vh to 60vh, then shrink on scroll
**Issue:** Build plan assumed hero was already at 60vh. It's actually 34vh.
**Fix:** This is the founder's requested feature: start at 60vh on first load, shrink to 34vh on scroll, stay at 34vh until fresh load. The HeroSection component explicitly sets initial height to 60vh and uses `useTransform` to shrink to 34vh over 200px of scroll. Desktop stays at sticky 40% — no change.

### Fix 4: Teal section colors need dark mode overrides
**Issue:** Coral/navy/amber/sand get dark overrides but teal-50/100 would stay at light values (#F0FDFC) on dark backgrounds.
**Fix:** Add teal dark mode overrides to `.dark` block:
```css
--color-teal-50: #0a2424;
--color-teal-100: #0f3636;
```

---

## Moderate Fixes

### Fix 5: "Loading..." pattern uses `<div>` and Unicode `…`, not `<p>` and `...`
**Fix:** Update build plan old_string to match: `<div className="p-4 text-[var(--color-text-secondary)]">Loading…</div>`

### Fix 6: ProfileAccordion card wrapper — actual has `overflow-hidden`, no `p-4`
**Fix:** Correct old_string to: `"bg-[var(--color-surface)] rounded-2xl shadow-sm overflow-hidden"`

### Fix 7: SocialLinksRow icon type change from `string` to `React.ReactNode`
**Fix:** Build plan now explicitly includes the type change in the PLATFORM_CONFIG interface.

### Fix 8: CvActions — only change card container `rounded-lg`, not button `rounded-lg`
**Fix:** Specify exact elements to change. Card containers (outer wrapper divs) get `rounded-2xl`. Inner buttons keep their radius.

### Fix 9: Delete account page — no `window.confirm` exists
**Fix:** Remove the Dialog replacement instruction. The existing confirmation pattern (type "DELETE MY ACCOUNT") is good.

### Fix 10: Delete account button text is "Delete Account" not "Delete my account"
**Fix:** Correct the old_string and preserve onClick/disabled/loading behavior.

---

## Completeness Fixes

### Fix 11: Restore FormField, IconButton, and Button `icon` variant from README
**Issue:** These were in the README but dropped from the detailed build plan.
**Fix:** Add back to Part 1:
- `FormField.tsx` — wrapper for label + description + error + children (DRY for date inputs)
- `IconButton.tsx` — square button for icon-only actions (extends Button with square sizing)
- Button `icon` variant — `"p-0 h-10 w-10 rounded-xl"` (no text padding, square)

### Fix 12: Page title size — style guide says 28px/700, plan said 20px/600
**Issue:** The plan's `text-xl font-semibold` (20px/600) contradicts the style guide's 28px/700.
**Fix:** Standardize page titles to:
- `text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]` (DM Sans)
- This matches the style guide exactly: 28px, 700 weight, -0.02em tracking
- Create a utility in the style system or use a `PageTitle` component

### Fix 13: Letter spacing — never addressed
**Issue:** Style guide specifies exact tracking for each typography level. Zero files enforce it.
**Fix:** Add to Part 3C standardization rules:
- Hero headline: `tracking-tight` (-0.02em equivalent)
- Page title: `tracking-tight`
- Section heading: add `tracking-[-0.01em]` (custom tracking via arbitrary value)
- Body/caption/button: `tracking-normal` (default, no change needed)

### Fix 14: Bento grids — completely missing
**Issue:** Style guide calls for mixed card sizes on profile, insights, and marketing pages.
**Fix:** Add to Part 5 or defer to Sprint 11. Bento grids are a layout architecture change, not a component enforcement task. **Decision: Defer to Sprint 11.** The current sprint focuses on component consistency and color. Bento requires rethinking page layouts which is a different kind of work. Note this as an explicit deferral in the README.

### Fix 15: EmptyState `accentColor` prop dropped
**Fix:** Restore to Part 1D. Add optional `accentColor?: SectionColor` prop that applies section-colored icon tint. Default remains neutral.

### Fix 16: Badge component — use shadcn Badge with colorScheme instead of inline classes
**Fix:** Instead of hand-coding `bg-[var(--color-coral-100)] text-[var(--color-coral-700)]` everywhere, extend the shadcn Badge component with a `colorScheme` prop that maps to section colors. Add to Part 1.

### Fix 17: Avatar component — use shadcn Avatar with hash-based fallback
**Fix:** Instead of hand-coding the hash-based color in EndorsementCard, create a reusable `ProfileAvatar` component that wraps shadcn Avatar with the hash-based color fallback. Add to Part 1.

### Fix 18: Endorsement card pattern doc says `rounded-lg` intentionally
**Fix:** Update the cards pattern doc to match the style guide (`rounded-2xl`) when implementing the card radius fix. Log this as a doc update task.

---

## Deferrals (explicitly out of scope for 10.2)

- **Bento grids** — layout architecture change, Sprint 11
- **Geist Mono import** — no current use case for mono display in Phase 1A
- **Salty mascot illustrations** — Sprint 11 per existing plan
- **Sand gradient on welcome page** — needs brand assets/design direction
- **Tag/pill section coloring** — minor, can be added when section colors are live
