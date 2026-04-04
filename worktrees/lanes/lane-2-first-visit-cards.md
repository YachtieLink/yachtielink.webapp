# Lane 2 — Per-Tab First-Visit Cards

**Session:** Rally 010 Session 3
**Branch:** `feat/r010-s3-first-visit-cards`
**Worktree:** `yl-wt-2`
**Effort:** Sonnet, high (~2h)

## Scope

Build dismissible education cards that show once per tab for first-time visitors. Helps users who skip the tour or need a refresher on what each tab does.

## Component Spec

```tsx
interface FirstVisitCardProps {
  storageKey: string     // e.g. 'yl_first_visit_network'
  accentColor: 'teal' | 'navy' | 'amber' | 'coral' | 'sand'
  icon: React.ReactNode  // emoji or icon
  title: string
  description: string
}
```

- Checks `localStorage.getItem(storageKey)` — if set, doesn't render
- Dismissible with X button — sets localStorage key
- Card hierarchy: content card tier (rounded, border, section-colored)
- Smooth exit animation (AnimatePresence)

## Per-Tab Cards

### Network (first visit)
- **Key:** `yl_first_visit_network`
- **Color:** navy
- **Title:** "How your network works"
- **Description:** "We connect you with crew through shared yacht history. Add a yacht, see colleagues, and request endorsements."

### Insights — Free (first visit)
- **Key:** `yl_first_visit_insights_free`
- **Color:** coral
- **Title:** "Career Insights"
- **Description:** "See how your profile performs. Upgrade to Pro to see who's viewing you and track downloads."

### Insights — Pro (first visit)
- **Key:** `yl_first_visit_insights_pro`
- **Color:** coral
- **Title:** "Your analytics dashboard"
- **Description:** "Views, downloads, shares, and saves — track how your profile performs over time."

### CV (first visit)
- **Key:** `yl_first_visit_cv`
- **Color:** amber
- **Title:** "How your CV works"
- **Description:** "Your YachtieLink CV is built from your profile. Edit your experience on the Profile tab — the CV updates automatically."

## Tasks

1. **Create shared FirstVisitCard** — `components/ui/FirstVisitCard.tsx`
2. **Wire into Network page** — show card at top of NetworkUnifiedView or in page.tsx
3. **Wire into Insights page** — show card, different content for Pro vs Free
4. **Wire into CV page** — show card above CvActions (warm state only)

## Allowed Files

- `components/ui/FirstVisitCard.tsx` (new)
- `app/(protected)/app/network/page.tsx` (add first-visit card)
- `app/(protected)/app/insights/page.tsx` (add first-visit card)
- `app/(protected)/app/cv/page.tsx` (add first-visit card)

## Forbidden Files

- Profile page (tour handles profile intro)
- TourProvider, tour-steps
- Tab bar, layout files
- API routes, migrations

## Acceptance Criteria

- FirstVisitCard shows on first page load
- Dismissing sets localStorage key, card never shows again
- Each tab has section-appropriate color
- Smooth dismiss animation
- No AI mentions in copy
- `npx tsc --noEmit` passes
