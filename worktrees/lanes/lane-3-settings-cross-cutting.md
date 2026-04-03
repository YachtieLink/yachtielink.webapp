# Lane 3 — Settings Polish + Cross-Cutting

**Branch:** `fix/settings-cross-cutting`
**Model:** Sonnet | **Effort:** high

## Objective

Settings improvements plus platform-wide cross-cutting items: visibility toggle sublabels, back-nav audit, and skeleton loading for all new Session 3-6 components.

## Tasks

### Task 1: Visibility Toggle Sublabels

Add sublabels to every visibility toggle in settings explaining what it shows/hides on public profile.

Examples:
- **Experience** — "Your yacht positions and date ranges on your public profile"
- **Certifications** — "Your qualifications and expiry dates on your public profile"
- **Endorsements** — "Endorsements from colleagues on your public profile"
- **Skills** — "Your skill tags on your public profile"
- **Hobbies** — "Your interests and hobbies on your public profile"
- **Gallery** — "Your work photos on your public profile"
- **Languages** — "Languages you speak on your public profile"

**File:** Wherever visibility toggles are rendered (likely `app/(protected)/app/profile/settings/page.tsx` or a settings component)

### Task 2: Back Navigation — Platform-Wide Audit

Back navigation must show WHERE you're going, not generic "Back." Label format: "← [Parent Page Name]".

Pages to audit:
- `/app/more/roadmap` — "← Settings" (but don't touch this file — Lane 2 owns it. Only audit OTHER pages.)
- `/app/endorsement/request` — "← Network"
- `/app/network/saved` — "← Network"
- Yacht detail pages — "← Network"
- Profile section edit pages — "← Profile"
- CV preview — "← CV"
- Any other inner pages added in Sessions 1-6

Format: top-left, `text-[var(--color-interactive)]`. Never "← Back".

### Task 3: Skeleton Loading for New Components

Add skeleton loading states to all new Session 3-6 components:
- Network accordion (navy pulse) — Session 3
- Insights dashboard metrics (coral pulse) — Session 4
- Endorsement request flow (navy pulse) — Session 5
- Any new Settings/More pages (sand pulse) — Session 6

Pattern:
- Skeleton shapes match actual content layout (not generic rectangles)
- Pulse animation uses section color (navy-200, coral-200, sand-200, etc.)
- Skeleton appears immediately, content fades in when loaded
- Create shared `<SectionSkeleton color="navy" />` if useful

### Task 4: Display Settings — View Mode Polish (if needed)

Keep the 3 view mode options (Profile, Portfolio, Rich Portfolio). Only touch if the selector needs visual polish to match sand section color. Likely a no-op.

**CV Staleness Nudge: DEFERRED to Phase 2. Do not build.**

## Allowed Files
- `app/(protected)/app/profile/settings/page.tsx` — visibility sublabels
- Display settings components — view mode polish only
- All page files with back navigation — contextual back labels
- All new Session 3-6 components — skeleton loading states
- Shared skeleton component if created
- `components/` — any component needing back-nav or skeleton updates

## Forbidden Files
- `supabase/migrations/*` (no migration needed)
- `app/(protected)/app/more/roadmap/*` (Lane 2 territory)
- `app/api/*` (no API changes)
- Layout/responsive CSS for page wrappers (Lane 1 territory)
- `app/(protected)/app/layout.tsx` (Lane 1)
- `components/layout/SidebarNav.tsx` (Lane 1)

## Patterns to Follow
- Read `docs/design-system/patterns/page-layout.md` — section colors, state transitions
- Read `docs/design-system/patterns/frontend-design-guide.md` — Back Navigation section
- Read `lib/section-colors.ts` — section color mapping
- Use InnerPageHeader with `onBack` prop for contextual back nav
- Match existing skeleton patterns if any exist in the codebase

## Edge Cases
- Back nav on pages reachable from multiple parents (use most common parent)
- Skeleton states for conditionally rendered sections (show skeleton for the expected layout)
- Visibility toggles that are Pro-only — still show sublabel
