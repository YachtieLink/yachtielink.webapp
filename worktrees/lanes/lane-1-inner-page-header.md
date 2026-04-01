# Lane 1 — Inner Page Header Redesign

## Objective

Replace the current `PageHeader` component with a two-part design: a **sticky back bar** (navigation) separated from a **standalone title row** (content identity + actions). Apply across all ~25 inner pages.

## Design Spec (from founder grill-me)

### Structure
```
┌─────────────────────────────┐
│ ← Profile                   │  ← sticky, section-color bottom border
├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤
│ About                [Save] │  ← serif title + actions
│ Tell people about your...   │  ← optional subtitle
├─────────────────────────────┤
│ [page content scrolls]      │
```

### Decisions
| Decision | Choice |
|----------|--------|
| Layout | Back button in thin sticky nav bar, title standalone below |
| Scroll | Sticky — back bar stays pinned on scroll |
| Actions | Inline with title row (counts, badges, buttons) — NOT in the back bar |
| Color | Section-color bottom border on sticky bar (navy for Network, amber for CV, teal for Profile, etc.) |

### Implementation Details

1. **Sticky back bar:**
   - `position: sticky; top: 0; z-index: 10`
   - Background: `var(--color-surface-primary)` (matches page bg so content doesn't show through)
   - Bottom border: 2px solid, using the section color for the current nav tab
   - Back button: `ChevronLeft` icon + parent page name (e.g. "← Network", "← Profile")
   - Minimum touch target: 44px height
   - No actions in this bar — navigation only

2. **Title row (below bar, scrolls with content):**
   - `h1` with `font-serif text-xl tracking-tight`
   - Optional `count` shown as `(N)` after title
   - Optional `subtitle` below in `text-sm text-secondary`
   - Optional `actions` slot right-aligned on the title line
   - Spacing: `pt-4 mb-4` (breathing room between bar and content)

3. **Section color mapping:**
   - Import from `lib/section-colors.ts`
   - The back bar needs a `sectionColor` prop (or derive it from `backHref` path)
   - Colors: Profile=teal, Network=navy, CV=amber, Insights=coral, More=sand

4. **Multi-step flows (certification/new, etc.):**
   - These use `onClick` handlers for back instead of `href`
   - Support both: `backHref` (link) and `onBack` (callback) props
   - When using `onBack`, the back label should say the previous step name

## Required Reading Before Coding
- `docs/design-system/patterns/page-layout.md`
- `docs/design-system/style-guide.md`
- `lib/section-colors.ts`
- Current `components/ui/PageHeader.tsx` and `components/ui/BackButton.tsx`

## Tasks
1. Read all required files above
2. Redesign `PageHeader.tsx` — new two-part layout with sticky back bar
3. Update `BackButton.tsx` if needed (or inline it)
4. Update all ~25 pages that import `PageHeader` to pass the new props (sectionColor, backLabel showing parent name)
5. Handle the multi-step flows in `certification/new/page.tsx` — convert ad-hoc headers to use PageHeader with `onBack`
6. `npx tsc --noEmit` — zero type errors
7. `npm run drift-check` — zero drift
8. Self-review diff, write report

## Allowed Files
- `components/ui/PageHeader.tsx`
- `components/ui/BackButton.tsx`
- `components/ui/index.ts` (only if export changes)
- `app/(protected)/app/about/edit/page.tsx`
- `app/(protected)/app/attachment/page.tsx`
- `app/(protected)/app/attachment/new/page.tsx`
- `app/(protected)/app/attachment/[id]/edit/page.tsx`
- `app/(protected)/app/certification/new/page.tsx`
- `app/(protected)/app/certification/[id]/edit/page.tsx`
- `app/(protected)/app/cv/preview/page.tsx`
- `app/(protected)/app/education/new/page.tsx`
- `app/(protected)/app/education/[id]/edit/page.tsx`
- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx`
- `app/(protected)/app/endorsement/[id]/edit/EditEndorsementClient.tsx`
- `app/(protected)/app/hobbies/edit/page.tsx`
- `app/(protected)/app/languages/edit/page.tsx`
- `app/(protected)/app/more/account/page.tsx`
- `app/(protected)/app/more/delete-account/page.tsx`
- `app/(protected)/app/more/roadmap/page.tsx`
- `app/(protected)/app/network/colleagues/page.tsx`
- `app/(protected)/app/network/saved/SavedProfilesClient.tsx`
- `app/(protected)/app/profile/gallery/page.tsx`
- `app/(protected)/app/profile/photos/page.tsx`
- `app/(protected)/app/profile/sea-time/page.tsx`
- `app/(protected)/app/profile/settings/page.tsx`
- `app/(protected)/app/settings/plan/PlanPageClient.tsx`
- `app/(protected)/app/skills/edit/page.tsx`
- `app/(protected)/app/social-links/edit/page.tsx`
- `app/(protected)/app/yacht/[id]/page.tsx`
- `app/(protected)/app/yacht/[id]/photo/page.tsx`

## Forbidden Files
- Any file not in the allowed list
- CHANGELOG.md, STATUS.md, sprint docs
- Supabase migrations
- API routes
- Public profile pages (app/(public)/)
