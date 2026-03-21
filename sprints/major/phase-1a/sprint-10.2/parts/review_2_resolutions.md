# Build Plan Review Round 2 — Final Resolutions

## Remaining Conflicts Resolved

### Resolution 1: Button tokens — keep shadcn tokens, update README
The Button uses shadcn tokens (`bg-primary`). These bridge correctly to our teal palette via globals.css. Changing them would risk breaking the 8 existing imports for zero user-facing benefit. **Decision: Keep Button on shadcn tokens. Update README to match the build plan.**

### Resolution 2: Hero parallax — 60vh → 34vh framed card with shape transition

**The interaction (mobile only, desktop stays at sticky 40%):**
- **60vh (initial load):** Full-bleed, edge-to-edge photo — immersive Bumble-style
- **As user scrolls (0-200px):** Photo container smoothly gains margins + rounded corners + border, transitioning from full-bleed to a framed portrait card
- **34vh (scrolled):** Photo sits in a `rounded-2xl` card with `mx-4` margins and `border border-[var(--color-border-subtle)]` — matches app card language. Reduced width + 34vh = roughly portrait/square aspect, not a squat landscape strip.

**Animated properties (all via `useTransform` mapped to scrollY 0→200):**
- `height`: 60vh → 34vh
- `marginInline`: 0px → 16px
- `borderRadius`: 0px → 16px
- `border`: transparent → `var(--color-border-subtle)`

**Toggle (user preference):**
- "Immersive profile photo" toggle in profile settings
- Stored in `section_visibility` JSONB (key: `immersive_hero`, default: `true`)
- When off: photo starts and stays at 34vh framed card — no scroll animation
- Implementation: read preference from user data, pass as prop to `HeroSection`

**Style guide updated to 60vh post-implementation (was 65vh).**

### Resolution 2b: Photo reorder in profile photos page
Photo reorder was previously broken. Needs to be fixed in this sprint:
- `app/(protected)/app/profile/photos/page.tsx` — investigate the reorder mechanism (likely drag-and-drop or sort_order field)
- Verify the API supports updating `sort_order` on `user_photos` records
- If drag-and-drop: ensure it works on mobile (touch events) and updates sort_order via API
- If manual up/down buttons: wire them to PATCH/PUT endpoint
- Add to Part 4 scope (public profile overhaul, since photo order affects the gallery)

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
| 25 | Hero shape transition (full-bleed → framed card on scroll) | ADDED to Part 4 |
| 26 | Hero toggle ("Immersive profile photo" setting) | ADDED to Part 4 |
| 27 | Photo reorder broken — fix in profile photos page | ADDED to Part 4 |
