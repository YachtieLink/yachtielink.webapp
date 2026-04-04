# Lane 2 — StickyBottomBar Component + Page Wiring

**Session:** Rally 010 Session 1
**Branch:** `feat/r010-s1-sticky-bar`
**Worktree:** `yl-wt-2`
**Effort:** Sonnet, high (~2h)

## Scope

Build shared `<StickyBottomBar>` component and wire it into Profile, CV, and Network pages per thumb-zone audit.

## Component Spec

```tsx
interface StickyBottomBarProps {
  children: React.ReactNode
  visible: boolean
  className?: string
}
```

**Positioning:** `fixed bottom-20 left-0 right-0 z-30`
**Safe area:** `bottom-[calc(5rem+env(safe-area-inset-bottom))]`
**Animation:** `springSnappy` enter/exit with Framer Motion AnimatePresence
**Background:** `bg-[var(--color-surface-primary)]` with subtle top shadow
**Desktop:** `md:left-[calc(50%-248px)] md:w-[560px] md:rounded-t-2xl` (match BottomSheet pattern)

## Page Wiring

### Profile (teal) — Coaching Bar
- **Condition:** Profile Strength < 80%
- **Content:** Compact strength ring (small) + next action text + [CTA button]
- **Data:** Already computed in page.tsx: `score`, `label`, `nextPrompt`, `strengthCta`
- **New client component:** `components/profile/ProfileCoachingBar.tsx`
- Pass strength data as props from server page
- Update `pb-24` → `pb-36` when bar visible

### CV (amber) — Document Action Bar
- **Condition:** Generated PDF exists (`profile.latest_pdf_path` truthy)
- **Content:** [Preview] [Download] [Regenerate] buttons in a row
- **Stale indicator:** If `pdfStale`, highlight Regenerate
- **New client component:** `components/cv/CvDocumentBar.tsx`
- Update `pb-24` → `pb-36` when bar visible

### Network (navy) — Endorsement Request Bar
- **Condition:** endorsements received < 5 AND colleague count >= 1
- **Content:** "X/5 endorsements" progress + [Request one] link
- **New client component:** `components/network/EndorsementRequestBar.tsx`
- Update `pb-24` → `pb-36` when bar visible

## Allowed Files

- `components/ui/StickyBottomBar.tsx` (new)
- `components/profile/ProfileCoachingBar.tsx` (new)
- `components/cv/CvDocumentBar.tsx` (new)
- `components/network/EndorsementRequestBar.tsx` (new)
- `app/(protected)/app/profile/page.tsx` (add bar + update padding)
- `app/(protected)/app/cv/page.tsx` (add bar + update padding)
- `app/(protected)/app/network/page.tsx` (add bar + update padding)

## Forbidden Files

- Tab bar component
- Layout files
- Any API routes
- Any DB migrations

## Acceptance Criteria

- StickyBottomBar animates in/out smoothly
- Profile: coaching bar appears when strength < 80%, hides at >= 80%
- CV: action bar appears when generated PDF exists
- Network: endorsement bar appears when < 5 endorsements AND >= 1 colleague
- All bars sit above tab bar (z-30 under z-40)
- Safe area respected on iOS
- `npx tsc --noEmit` passes
- Desktop: bars are centered/capped width (not full-bleed)
