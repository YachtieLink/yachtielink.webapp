# Endorsement Request — Yacht Context & Crew List

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-04-01

## Summary
After selecting a yacht on the endorsement request page, the page should be rich with context — not just a text header and share link. Show the yacht, who's currently on board, and who overlapped with you during your time there. This is the crew you'd actually want endorsements from.

## Scope

### 1. Show the yacht
- Yacht card/hero: photo (if available), name with M/Y/S/Y prefix, yacht type, length
- The user's dates on this yacht (from their experience entries)

### 2. Crew who overlapped with your time period
- Query colleagues whose experience dates on this yacht overlap with yours
- Show as a list with name, role, and overlapping date range
- One-tap "Request endorsement" per crew member
- This is the primary value — these are the people who can actually vouch for you

### 3. Current crew on this yacht
- People whose experience on this yacht has no end date (still on board)
- Separate section or badge indicating "Currently on board"
- Even if they didn't overlap with you, they may know your work by reputation

### 4. General share (existing)
- Keep the WhatsApp/Copy Link/Share controls for people not in the system
- Move below the crew lists — crew-in-system should be the primary path

## Data Available
- `sea_time_entries` has yacht_id + user_id + start_date + end_date — this gives overlap
- `get_colleagues` RPC already finds shared-yacht colleagues — may need extending for date overlap
- Yacht details from `yachts` table

## Files Likely Affected
- `app/(protected)/app/endorsement/request/page.tsx` — main page redesign after yacht selection
- Possibly a new RPC or extension of `get_colleagues` to return date-overlap colleagues for a specific yacht
- Yacht card component (may exist or need creation)

## Notes
- Founder feedback: "show the yacht, who works there currently, people who worked on that yacht in the same time period you did"
- This turns the endorsement request from a generic share page into a smart crew discovery tool
- Ties into M/Y/S/Y prefix format backlog item
