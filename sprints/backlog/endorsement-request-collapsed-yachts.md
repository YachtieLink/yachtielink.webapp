# Endorsement Request Page — Redesign + External Contact Priority

**Status:** proposed
**Priority guess:** P2 (UX + growth)
**Date captured:** 2026-03-27

## Problem
Two issues with the endorsement request page:

1. **Flat colleague list:** When a user has worked on multiple yachts, the list gets long and hard to scan. Needs yacht-grouped collapsible sections.

2. **Wrong priority weighting:** The page currently leads with on-platform colleagues. But external contacts (email/WhatsApp invites) are the growth loop — they bring new users onto the platform. The page should weight more heavily towards contacting people outside YachtieLink.

## Proposed Fix

### Layout priority (top to bottom):
1. **External invite CTA (primary)** — "Invite a former colleague" with email/WhatsApp input, prominent placement. This is the growth action. Make it the hero of the page.
2. **Recent/suggested contacts** — people the user has worked with who aren't on the platform yet (if detectable from yacht crew data / ghost profiles)
3. **On-platform colleagues (secondary)** — grouped by yacht with collapsible accordions:
   - "M/Y Driftwood — 4 colleagues" (collapsed by default)
   - Expand to see colleague cards with "Request" button
   - A colleague who appears on multiple shared yachts shows under each yacht

### Why external-first matters:
- Every external endorsement request is a signup funnel entry point
- The recipient gets a personalised invite: "[Name] wants you to endorse their work on M/Y Example"
- On-platform colleagues can be nudged passively (notification badge, in-app prompt)
- External contacts require active outreach — the page should make this frictionless

## Notes
- Sprint 12 builds the colleague explorer with yacht-grouped accordions — this should use the same grouping logic and component pattern
- May want to build the shared yacht-grouping component in Sprint 12 and retrofit it here
- Currently the endorsement request flow uses `RequestEndorsementClient.tsx`
- Ghost Profiles (Phase 2) will make "suggested contacts not on platform" much richer — crew who appear on shared yachts but haven't signed up
