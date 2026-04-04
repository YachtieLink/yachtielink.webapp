# Lane 1 — Activate Tooltips

**Session:** Rally 010 Session 4
**Branch:** `feat/r010-s4-tooltips`
**Worktree:** `yl-wt-1`
**Effort:** Sonnet, medium (~1.5h)

## Scope

Wire the existing `components/ui/tooltip.tsx` (currently unused!) into fields and features that need explanation. The component exists, just needs activating.

## Tooltip Placements

### Profile tab
1. **Profile Strength ring** — "Your profile completeness. Higher scores get more visibility."
2. **Sea time stat** — "Total time at sea, calculated from your yacht history. Overlapping dates are counted once."

### Network tab
3. **Endorsement count** — "Profiles with 5+ endorsements get noticed by captains."

### CV tab
4. **Staleness warning** (when pdfStale) — "Your profile has changed since this CV was generated. Regenerate to include updates."

### Insights tab
5. **Each metric card title** (Pro) — Brief tooltip: "People who visited your public profile" / "Times your CV was downloaded" / etc.

## Implementation Pattern

Use a simple `InfoTooltip` wrapper component that standardizes the pattern:
```tsx
function InfoTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}
```

Wrap target elements with this. The tooltip provider should be added once at the layout level or in each page that uses tooltips.

## Allowed Files

- `components/ui/InfoTooltip.tsx` (new — convenience wrapper)
- `components/profile/ProfileHeroCard.tsx` (strength ring, sea time tooltips)
- `components/network/EndorsementSummaryCard.tsx` (endorsement count tooltip)
- `components/cv/CvActions.tsx` (staleness tooltip)
- `components/insights/MetricCard.tsx` (metric title tooltips)
- `app/(protected)/app/layout.tsx` (add TooltipProvider if needed)

## Forbidden Files

- tooltip.tsx base component (don't modify the base)
- Page-level files (unless adding TooltipProvider)
- API routes, migrations

## Acceptance Criteria

- At least 5 tooltip placements across different tabs
- Tooltips appear on hover/long-press
- Copy is helpful, not redundant
- No AI mentions
- `npx tsc --noEmit` passes
