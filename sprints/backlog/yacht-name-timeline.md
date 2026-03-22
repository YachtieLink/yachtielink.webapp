# Yacht Name Timeline — Full UI

**Status:** idea (database foundation shipping in Sprint 12)
**Priority guess:** P2 (important — prevents duplicate yachts, improves data accuracy)
**Date captured:** 2026-03-22

## Summary

Yachts change names frequently in the superyacht industry. M/Y Dilbar became M/Y Radiant, etc. The `yacht_names` table (shipping in Sprint 12 as foundation) tracks name history. This backlog item covers the full UI for managing and displaying name history.

## What the foundation gives us (Sprint 12)

- `yacht_names` table with name, started_at, ended_at per yacht
- Seeded from existing `yachts.name` (every yacht gets one row)
- Trigram index on historical names for search
- RLS: public read, crew insert
- Unique index enforcing one current name per yacht

## What this sprint would add

### Display
- Yacht detail page: "formerly M/Y Dilbar" subtext under current name (if name history exists)
- Attachment cards on profiles: show the yacht name at time of service (not the current name)
- Search: `search_yachts()` RPC expanded to also search `yacht_names.name_normalized` — old names resolve to the current yacht entity

### Editing
- "Report a name change" action on yacht detail page (crew-only)
- Form: new name, effective date
- Previous name row gets `ended_at` set to the effective date
- `yachts.name` + `yachts.name_normalized` updated to new name (denormalized)

### Deduplication
- When searching for a yacht, if "M/Y Dilbar" matches a historical name on an existing yacht, show: "This yacht is now called M/Y Radiant" instead of "similar yacht found"
- This eliminates a major class of duplicate entries

## Open Questions

- Who can record a name change? Any crew member with an active attachment? Or quorum-based (multiple crew confirm)?
- Should name changes be admin-approved or instant?
- How to handle disputes (crew disagree about whether yacht was renamed)?
- Should attachments store `yacht_name_at_time` denormalized, or always join to `yacht_names` by date range?

## Files Likely Affected

- `supabase/migrations/` — RPC updates to `search_yachts()` for historical name matching
- `app/(protected)/app/yacht/[id]/page.tsx` — "formerly" subtext
- `components/yacht/YachtPicker.tsx` — historical name matching in search results
- `components/profile/YachtsSection.tsx` — time-appropriate name display
- `app/(public)/u/[handle]/page.tsx` — time-appropriate name in public profile
