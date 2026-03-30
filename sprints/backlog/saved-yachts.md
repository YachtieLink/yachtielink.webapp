# Saved Yachts

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-29

## Summary

Users should be able to save yachts they're interested in, the same way they can save profiles. A heart icon on yacht cards and yacht detail pages adds the yacht to a saved list. This supports both crew (tracking yachts they want to work on) and future employer/recruiter use cases.

## Context

Saved Profiles currently lives as a tab inside the Network page. As part of Rally 006, we're moving it out of Network and into the More menu. The long-term plan is a dedicated Saved section under More with two sub-sections:

- **Saved Profiles** — existing feature, relocated from Network
- **Saved Yachts** — this feature

This separation recognises that "saving" is a different intent from "networking." Saving is closer to recruitment/hiring/job-hunting behaviour, and will eventually sit within a dedicated employment section.

## Scope

### Build
- Heart/save icon on `YachtCard` component (used in search results, Network Yachts tab, colleague yacht lists)
- Heart/save icon on `YachtDetailPage` (yacht profile page)
- `saved_yachts` table in Supabase (user_id, yacht_id, created_at) — same pattern as `saved_profiles`
- RPC or query to fetch user's saved yachts
- Saved Yachts list view under More → Saved → Yachts
- Yacht cards in saved list should show: name, builder, length, photo (if available), crew count
- Unsave action (tap heart again to remove)

### Don't build yet
- Push notifications when saved yacht has new crew activity
- "Yachts hiring" or availability signals on saved yachts
- Employer/recruiter-specific saved views

## Files Likely Affected
- New: `saved_yachts` migration
- New: Saved Yachts list page (under More or Settings)
- `components/yacht/YachtCard.tsx` — add heart icon
- `app/(protected)/app/yacht/[id]/page.tsx` — add heart icon
- `components/nav/` — More menu update to include Saved section
- `lib/queries/` — new saved yachts query

## Notes
- Same interaction pattern as Saved Profiles — consistency matters
- Heart icon should be identical in style/position to the one used on profile cards
- Consider a shared `SaveButton` component that works for both profiles and yachts (pass entity type + ID)
- The More menu Saved section should show counts: "Saved Profiles (3)" / "Saved Yachts (7)"
