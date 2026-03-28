# Colleague Graph Explorer

## Problem
Viewers can see a "Colleagues" count in the stats tile but can't explore who those colleagues are or how they're connected. The yacht graph is unexplorable from the profile.

## Proposed Solution
Clicking the "Colleagues" stat (or a dedicated "Colleagues" section) opens a modal showing all colleagues grouped by yacht:

### Layout
```
COLLEAGUES · 35

M/Y Eclipse Star (2023-Present)
  [avatar] James Whitfield — Captain
  [avatar] Sofia Marinova — First Officer
  [avatar] Pierre Laurent — Head Chef

M/Y Driftwood (2019-2022)
  [avatar] Marcus Du Plessis — Bosun
  [avatar] Elena Rossi — Second Stewardess
  ...
```

### Features
- Grouped by yacht (most recent first)
- Each colleague shows: avatar, name (clickable → their profile), role on that yacht
- "Leaving this profile" confirmation when navigating to a colleague
- Back button returns to the original profile
- Mutual colleagues highlighted for logged-in viewers

### Data
- Query: for each of Charlotte's yachts, find all other `attachments` on the same `yacht_id` and join to `users` for profile info
- Could use an RPC function for efficiency: `get_colleagues(user_id)`
- Cache-friendly since yacht rosters rarely change

## Notes
- This is a key graph exploration feature — the social proof network
- Captains can see who else was on the same yacht (reference checking)
- Makes the "Colleagues" number in the stats tile meaningful
- Future: mutual colleague highlighting for logged-in viewers
