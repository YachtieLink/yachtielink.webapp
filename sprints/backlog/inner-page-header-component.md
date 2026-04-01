# Inner Page Header — Consistent Layout for Sub-Pages

**Status:** proposed
**Priority guess:** P1 (founder-flagged, affects every sub-page)
**Date captured:** 2026-03-27

## Problem
The 5 main tab pages (Profile, Network, CV, Insights, More) have consistent headers — serif h1, proper spacing, clean top margin. But every inner/detail page has a rough, inconsistent header:

- Back button jammed against the top with no margin
- Heading font doesn't match main pages (sans-serif, often bold instead of serif)
- Inconsistent spacing between back button and heading
- No shared pattern — each page rolls its own header layout

Affected pages include:
- `/app/network/saved` — "Saved Profiles" in sans bold
- `/app/education/[id]/edit` — edit page header
- `/app/certification/[id]/edit` — edit page header
- `/app/certification/new` — new cert header
- `/app/about/edit` — about edit header
- `/app/profile/settings` — settings header
- `/app/profile/photos` — photos header
- `/app/profile/gallery` — gallery header
- `/app/attachment` — experience list header
- `/app/attachment/new` — add experience header
- `/app/billing` — billing placeholder
- Any future detail/edit/sub-pages

## Proposed Fix
Create a shared `PageHeader` component:

```tsx
interface PageHeaderProps {
  title: string
  backHref?: string      // shows back button if provided
  backLabel?: string     // defaults to "Back"
  actions?: React.ReactNode  // right-side slot for buttons/badges
}
```

Design:
- Consistent top padding (`pt-4` or `pt-6`)
- Back button: left-aligned, proper vertical alignment with title
- Title: `font-serif text-xl` (smaller than main page h1s at `text-[28px]`, but still serif)
- Actions slot: right-aligned (for things like Pro badge on Insights, count on Saved Profiles)
- Bottom margin before content (`mb-4` or `mb-6`)

Then refactor all inner pages to use `<PageHeader>` instead of their ad-hoc headers.

## Scope
- Create `components/ui/PageHeader.tsx`
- Refactor all ~12 inner pages to use it
- Verify on mobile (375px) — back button and title must not overlap
- Dark mode support from day one

## Notes
- This is the kind of polish that makes the app feel intentional vs cobbled together
- Could be part of Sprint 13 (Launch Polish) or done as a standalone junior sprint
- The main tab pages do NOT need this — they have their own layout via the tab bar
- **2026-04-01 founder feedback:** "the back button with headings all over the app looks bad. needs better synergy" — bumped to P1. The back button and heading sitting side by side with no visual relationship is a recurring eyesore (e.g. endorsement request page). The fix needs to feel cohesive, not just aligned.
