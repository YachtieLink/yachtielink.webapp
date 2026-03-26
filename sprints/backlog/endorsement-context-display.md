---
slug: endorsement-context-display
status: backlog
priority: low
source: founder QA (2026-03-26)
modules: [endorsements, profile, cv]
---

# Endorsement Context Display

## Problem

Endorsements currently show only the endorser's display name:

> "Extremely skilled and great with guests."
> — Ryan

This gives no context about who Ryan is or how they know the recipient. A captain reading James's profile has no way to judge the weight of this endorsement.

## Desired Behaviour

Show the endorser's **role** and **yacht** alongside their name:

> "Extremely skilled and great with guests."
> — **Ryan Campbell**, Second Engineer on TS Driftwood

## Data Available

The `endorsements` table already stores:
- `endorser_role_label` (text) — e.g. "Second Engineer"
- `yacht_id` (uuid → yachts.name) — e.g. "TS Driftwood"
- `endorser_id` (uuid → users.full_name) — e.g. "Ryan Campbell"

No schema changes needed — this is a display-only fix.

## Surfaces to Update

1. **Public profile** (`PublicProfileContent.tsx` → Endorsements section)
2. **Public CV view** (`/u/[handle]/cv`)
3. **Private profile** (endorsements section in profile grid, if it shows endorsement text)

## Effort

Small — query already joins yacht name, just needs to render `endorser_role_label` and yacht name in the template.
