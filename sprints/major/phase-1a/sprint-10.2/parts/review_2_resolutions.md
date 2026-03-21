# Build Plan Review Round 2 — Final Resolutions

## Remaining Conflicts Resolved

### Resolution 1: Button tokens — keep shadcn tokens, update README
The Button uses shadcn tokens (`bg-primary`). These bridge correctly to our teal palette via globals.css. Changing them would risk breaking the 8 existing imports for zero user-facing benefit. **Decision: Keep Button on shadcn tokens. Update README to match the build plan.**

### Resolution 2: Hero height — 60vh (founder preference)
The founder specified 60vh in the initial request. Style guide says 65vh. Going with **60vh** — the founder's call overrides the doc. Style guide will be updated post-implementation.

### Resolution 3: Section color approach — Tailwind class lookup map
Using a static map of Tailwind classes per section rather than inline styles. This keeps the Tailwind JIT compiler happy and avoids style-prop overhead:

```ts
// In section-colors.ts:
export const sectionClassMap: Record<SectionColor, { text: string; bg: string; border: string }> = {
  teal:  { text: 'text-[var(--color-teal-700)]',  bg: 'bg-[var(--color-teal-50)]',  border: 'border-[var(--color-teal-700)]' },
  coral: { text: 'text-[var(--color-coral-500)]', bg: 'bg-[var(--color-coral-50)]', border: 'border-[var(--color-coral-500)]' },
  // etc.
}
```

### Resolution 4: Bento grids — adding to Part 5
Founder confirmed bento grids should be included. Adding to:
- **Profile page** — photo card large (2-col span), stat cards side-by-side
- **Insights page** — one big chart card + 2-3 small stat cards
- Implementation: CSS Grid with `grid-cols-2` and `col-span-2` for featured cards

### Resolution 5: Confirmed bugs from audits — adding Part 0
Adding pre-work bug fixes:
- Theme localStorage key mismatch (`yl-theme` vs `theme`)
- Welcome page legal links path verification
- CookieBanner z-index fix (overlapping BottomTabBar)
- Audit all `var(--teal-N)` usage in 10+ components for dark mode

### Resolution 6: Accessibility items — adding to relevant parts
- `focus:` → `focus-visible:` in new components (Textarea, Select) — Part 1
- `prefers-reduced-motion` support in new animations — Part 7
- App layout `max-w-2xl mx-auto` for desktop — Part 5

## Final Part Structure

```
Part 0: Bug Fixes (pre-work, ~1 hour)
Part 1: Component Foundation (~1 day)
Part 2: Section Color Infrastructure (0.5 day — system only, no application)
Part 3: Form System Rewrite (~2 days, parallel agents)
Part 4: Public Profile Overhaul (~1.5 days)
Part 5: Main App Pages + Bento Grids (~1.5 days)
Part 6: Color & Warmth Application Pass (~1 day)
Part 7: Animation & Interaction Polish (~0.5 day)
Part 8: Documentation Updates (~0.5 hour)
```

## All Review Issues — Final Status

| # | Issue | Status |
|---|-------|--------|
| 1 | nav-config.ts icon system | FIXED |
| 2 | PublicProfileContent server component | FIXED |
| 3 | Hero parallax height | FIXED (60vh) |
| 4 | Teal dark mode overrides | FIXED |
| 5 | Loading pattern markup | FIXED |
| 6 | ProfileAccordion old_string | FIXED |
| 7 | SocialLinksRow type change | FIXED |
| 8 | CvActions scoped radius | FIXED |
| 9 | Delete account no window.confirm | FIXED |
| 10 | Delete account button text | FIXED |
| 11 | FormField/IconButton/icon variant | RESTORED |
| 12 | Page title 28px/700 | FIXED |
| 13 | Letter spacing | ADDED |
| 14 | Bento grids | ADDED (was deferred, founder wants it) |
| 15 | EmptyState accentColor | RESTORED |
| 16 | Badge with colorScheme | ADDED |
| 17 | ProfileAvatar component | ADDED |
| 18 | Endorsement card pattern doc | ADDED |
| 19 | Button token conflict | RESOLVED (keep shadcn) |
| 20 | Accessibility gaps | ADDED to relevant parts |
| 21 | Confirmed bugs | ADDED as Part 0 |
| 22 | Desktop max-width | ADDED to Part 5 |
| 23 | BottomSheet animation | ADDED to Part 7 |
| 24 | README alignment | Part 8 |
