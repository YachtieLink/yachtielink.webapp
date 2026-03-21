# Sprint 12 — Yacht Graph

> **DRAFT** — This sprint plan is a draft outline. Scope, deliverables, and build plan are subject to change before work begins.

**Phase:** 1B
**Status:** 📋 Draft
**Started:** —
**Completed:** —

## Goal

Make the yacht graph — YachtieLink's core differentiator — tangible and browsable. Yachts become first-class entities with crew histories. Crew can see their network of colleagues across yachts. The colleague graph becomes something you can explore, not just something that exists in the database.

## Scope

In:
- Yacht detail page (full build — photo, specs, crew list past + present)
- Crew network on yacht ("who else worked here" with mutual endorsement highlights)
- Colleague graph view (your network — degrees of connection, shared yacht count)
- Yacht search/autocomplete improvements (fuzzy matching, dedup, merge flow)
- Sea time calculator UI (using existing `get_sea_time()` DB function)

Out:
- Recruiter search / NLP search (future phase)
- Availability broadcast / discovery (future phase)
- D3.js or force-directed graph visualisation (nice-to-have, not required — a clean list view is fine for MVP)
- New yacht creation flow redesign (existing flow works)
- Yacht verification / establishment workflow changes

## Dependencies

- Sprint 10.1 + Sprint 11 complete
- `yachts` table, `attachments` table, `endorsements` table all exist
- `get_sea_time()` database function exists
- `YachtPicker` component exists (for search improvements)

## Key Deliverables

### Yacht Detail Page — `/app/yacht/[id]`
- ⬜ Yacht hero section: photo (if uploaded), name, type, size category, length, flag state, year built
- ⬜ Yacht photo upload/management (storage bucket exists)
- ⬜ Crew list: all users with attachments to this yacht, sorted by date
  - Current crew (no `ended_at`) vs. alumni (has `ended_at`)
  - Show: photo, name, role, dates served
  - Tap → navigate to their profile
- ⬜ Mutual connections highlight: "You both worked on M/Y Example" badge on crew cards
- ⬜ Endorsement cross-references: show endorsements written between crew who shared this yacht
- ⬜ Yacht stats: total crew who've worked here, average tenure, active endorsements

### Colleague Graph View — `/app/network/colleagues`
- ⬜ List of all your colleagues (computed from shared yacht attachments)
- ⬜ Grouped by yacht (accordion pattern — "M/Y Example — 4 colleagues")
- ⬜ Each colleague card: photo, name, current role, shared yacht(s), mutual endorsement status
- ⬜ 1st degree: direct colleagues (shared a yacht)
- ⬜ 2nd degree: colleagues of colleagues (stretch goal — may defer)
- ⬜ "Endorse" quick-action on unendorsed colleagues
- ⬜ Search/filter within your network

### Sea Time Calculator
- ⬜ Sea time summary on profile page (total months/years at sea)
- ⬜ Per-yacht breakdown (yacht name, role, duration)
- ⬜ Gap analysis (periods between yachts, useful for CV)
- ⬜ UI: clean table or timeline view in profile accordion

### Yacht Search Improvements
- ⬜ Fuzzy matching in YachtPicker (handle typos, partial names)
- ⬜ Deduplication detection: flag when a new yacht name closely matches existing yachts
- ⬜ Merge flow: when two yacht entries are the same vessel, allow merge (transfers all attachments + endorsements)
- ⬜ Established yacht indicator (is_established flag, shows "verified" badge)

### API Routes (if needed)
- ⬜ `GET /api/yacht/[id]/crew` — list all crew attached to a yacht (with roles, dates)
- ⬜ `GET /api/network/colleagues` — computed colleague list from shared attachments
- ⬜ `GET /api/user/sea-time` — sea time breakdown from `get_sea_time()`
- ⬜ `POST /api/yacht/merge` — merge duplicate yacht entries (admin-gated or self-serve with confirmation)

## Exit Criteria

- Yacht detail page renders with crew list, stats, and photo
- Users can browse their colleague network grouped by yacht
- Sea time displays on profile (total + per-yacht breakdown)
- Yacht search handles typos and flags potential duplicates
- All new pages work in dark mode and at 375px width
- No performance regressions (colleague queries must be indexed)

## Estimated Effort

7–10 days

## Notes

The yacht graph is the product's wedge. This sprint makes it visible. Even without a fancy force-directed D3 visualisation, a well-designed list view showing "these are all the people you've worked with, grouped by yacht, with endorsement status" is powerful and unique.

The merge flow for duplicate yachts is important for graph integrity. Crew entering "MY Example" vs "M/Y Example" vs "Example" fragments the graph. A merge tool (even if initially manual/admin-only) prevents this.

2nd-degree connections (colleagues of colleagues) would be impressive but is a stretch goal. The query is expensive and the UX needs careful thought. Can be deferred without impacting launch.
