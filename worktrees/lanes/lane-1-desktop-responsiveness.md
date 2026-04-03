# Lane 1 — Desktop Responsiveness Audit + Fixes

**Branch:** `fix/desktop-responsiveness`
**Model:** Sonnet | **Effort:** high

## Objective

Audit all key pages at iPad/desktop breakpoints and fix layout issues. Development has been mobile-first — desktop likely has stretched content, awkward whitespace, and misaligned grids.

## Strategy

iPad-first responsive (768-1024px primary target). Desktop (1280px+) inherits the same layout centered with persistent sidebar. No separate desktop layout for Phase 1.

## Tasks

### Task 1: Audit at breakpoints
Test at **768px** (iPad portrait), **1024px** (iPad landscape — primary), **1280px** (laptop — verify inheritance).

Pages (priority order):
1. `/u/:handle` — public profile
2. `/app/profile` — landing page
3. `/app/network` — yacht accordion (Session 3)
4. `/app/insights` — dashboard (Session 4)
5. `/app/cv/preview` — PDF preview
6. `/app/more` — utility page
7. `/app/endorsement/request` — Session 5 redesign
8. Onboarding flow
9. `/welcome` — marketing/welcome
10. Auth pages (login, signup, verify)

Check per page:
- Content renders cleanly at 1024px — no overflow, no cramped layouts
- Sidebar nav persistent and functional at `md:` (768px+)
- Cards don't stretch too wide — maintain readable line lengths
- Typography scales appropriately
- Images don't distort
- Modals/sheets center properly
- No horizontal scroll at any breakpoint
- 1280px+: content stays centered, whitespace on sides acceptable

### Task 2: Fix issues
- Ensure `max-w-2xl` or equivalent keeps content readable
- `SidebarNav.tsx` persistent at `md:` breakpoint
- Content wrapper in app layout adds proper `md:pl-16` offset
- Fix overflow or cramping at 768-1024px
- Public profile bento grid: clean at iPad widths, don't add more columns

### Task 3: Breakpoint consistency
- `md:` (768px) — sidebar appears, iPad portrait adjustments
- `lg:` (1024px) — iPad landscape, primary desktop target
- No `xl:` overrides needed for Phase 1

## Allowed Files
- Any `page.tsx` or component needing responsive fixes
- `app/(protected)/app/layout.tsx` — content wrapper breakpoints
- `components/layout/SidebarNav.tsx` — sidebar polish
- `tailwind.config.ts` — only if custom breakpoints needed (unlikely)

## Forbidden Files
- `supabase/migrations/*`
- `app/api/*`
- Component logic (only CSS/layout changes)
- Any files owned by Lane 2 or Lane 3

## Patterns to Follow
- Read `docs/design-system/patterns/page-layout.md` for mobile-first layout patterns
- Read `docs/design-system/patterns/frontend-design-guide.md` for component patterns
- Use existing Tailwind responsive classes (`md:`, `lg:`)
- Section color wayfinding stays — don't change color schemes

## Do NOT
- Widen layouts beyond what iPad needs
- Add multi-column card grids
- Create desktop-specific components
- Over-engineer for 1920px
