---
lane: 1
branch: feat/network-phase1
session: 3
model: opus
effort: high
---

# Lane 1: Network Tab Phase 1

**Objective:** Transform the Network tab from 3 confusing flat-list tabs into a unified yacht-grouped view with rich visual design. Navy wayfinding.

## Scope
- Endorsement summary stat card + CTA card (0/5 fraction, dynamic copy)
- Yacht-grouped unified view (accordion, 1 expanded)
- Rich yacht mini cards in accordion headers
- Colleague rows with avatars + "Request" (not "Endorse")
- Ghost suggestions inline per yacht
- "Invite former crew" CTA per yacht
- Saved Profiles bookmark icon in header
- Yacht search at bottom
- Navy section color throughout
- Empty states (zero yachts, zero endorsements, zero colleagues)
- Remove AudienceTabs.tsx

## Allowed Files
- `app/(protected)/app/network/page.tsx`
- `components/audience/AudienceTabs.tsx` (remove)
- `components/network/NetworkUnifiedView.tsx` (new)
- `components/network/EndorsementSummaryCard.tsx` (new)
- `components/network/EndorsementCTACard.tsx` (new)
- `components/network/YachtAccordion.tsx` (new)
- `components/network/ColleagueRow.tsx` (new)
- `app/(protected)/app/more/page.tsx` (remove "Saved Profiles" row)

## Forbidden Files
- `supabase/migrations/*`
- `components/public/*`
- `app/api/*`
