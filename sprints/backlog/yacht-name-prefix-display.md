# Yacht Names Missing Vessel Type Prefix

**Status:** idea
**Priority guess:** P2 (visual inconsistency — some yachts show "TS" prefix, others show nothing)
**Date captured:** 2026-04-02

## Summary
Sea Time page shows "Big Sky" instead of "M/Y Big Sky", "Param Jamuna IV" instead of "M/Y Param Jamuna IV". Some yachts like "TS Jade Wave" and "TS Iris" have their prefix because it's part of the stored name, not rendered from the vessel_type field. The vessel type prefix (M/Y, S/Y, TS, etc.) should be displayed alongside the yacht name everywhere yachts appear.

## Affected pages
- Sea Time (`/app/profile/sea-time`)
- Yacht detail pages
- Network colleagues (grouped by yacht)
- Endorsement request (yacht picker)
- Public profile experience section
- CV PDF

## Fix
Render `${vessel_type_prefix} ${name}` wherever a yacht name is displayed. The prefix comes from the `vessel_type` column (Motor Yacht → M/Y, Sailing Yacht → S/Y, etc.) which already exists in the DB.
