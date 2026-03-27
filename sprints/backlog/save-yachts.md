# Save Yachts — Bookmark Yachts Like Profiles

**Status:** proposed
**Priority guess:** P3 (after yacht tab exists)
**Date captured:** 2026-03-27
**Depends on:** Sprint 12 (Yacht Graph Foundation — yacht detail pages + network yacht tab)

## Summary
Allow users to save/bookmark yachts the same way they can save crew profiles. Useful for crew tracking boats they want to work on, and recruiters/agents tracking fleet movements.

## Implementation Notes
- New `saved_yachts` table (or extend `saved_profiles` with a polymorphic `entity_type` column)
- Save button on yacht detail pages (coming in Sprint 12)
- Saved yachts visible in a sub-tab or section within `/app/network/saved`
- Same features as saved profiles: notes, watching, folders
- Watch on a yacht could later notify when crew changes are detected

## Open Questions
- Separate table (`saved_yachts`) or polymorphic (`saved_entities` with type column)?
- Should saved yachts share folders with saved profiles, or have their own?
- Does "watching" a yacht mean notifications when crew join/leave?
