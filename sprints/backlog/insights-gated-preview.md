# Insights — Gated Preview for Free Users

**Source:** Founder feedback during QA (2026-04-03)
**Priority:** High
**Module:** insights

## Problem

Free users on the Insights tab see an empty state with a big upgrade CTA. They can't see what metrics they're missing, so the upsell feels abstract rather than concrete.

## Proposed UX

Show ALL metric cards (Profile Views, Downloads, Shares, Who Viewed You, etc.) to free users, but **gate the actual values**:

- Show the metric label and card layout so users see what's available
- Replace the actual number with a **lock icon** (🔒) or blur/fuzz the value
- Or overlay a small "PRO" badge on each locked metric
- Include a single "Upgrade to Crew Pro" prompt somewhere on the page (not per-metric)
- The user sees the shape of what they're missing — much more compelling than a blank page

## Design Options

1. **Lock icon over value**: Each metric card renders normally but the number is replaced with 🔒. Clean, minimal.
2. **Blurred numbers**: Show fake/placeholder numbers but blur them (CSS `filter: blur(4px)`). Creates FOMO.
3. **PRO badge overlay**: Small "PRO" chip on each gated card. Consistent with other Pro-gated features.

Founder leaning toward option 1 or 3.

## Files Likely Involved

- `app/(protected)/app/insights/page.tsx` — free user view
- `components/insights/` — metric card components
- `components/insights/UpgradeCTA.tsx` — may be simplified or relocated
