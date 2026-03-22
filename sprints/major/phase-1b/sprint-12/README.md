# Sprint 12 — Yacht Graph

> **DRAFT** — Scope refined from initial outline. Build plan at `build_plan.md`. Subject to change before work begins.

**Phase:** 1B
**Status:** 📋 Draft
**Started:** —
**Completed:** —

## Goal

Make the yacht graph — YachtieLink's core differentiator — tangible and browsable. The graph is the navigation: every profile links to yachts, every yacht links to crew, every crew member links to their profile. Users explore the network by clicking through — no search needed, no visualization. Just links between people and yachts.

Enhance the yacht detail page with crew context and endorsement cross-references. Give crew a dedicated colleague explorer grouped by yacht. Surface sea time and mutual colleagues as social proof on profiles. Improve yacht search UX to reduce graph fragmentation.

## Scope

**In:**
- Yacht detail page enhancement (current/alumni crew split, profile links, mutual connections, endorsement cross-refs, richer stats)
- Colleague explorer page — `/app/network/colleagues` (grouped by yacht, endorsement status, quick endorse action)
- Sea time display — profile summary card + per-yacht breakdown page + public profile stat
- Yacht search UX improvements (better fuzzy match presentation, improved duplicate detection dialog)
- Attachment transfer — "Wrong yacht?" correction flow on attachment edit page (move work history to correct yacht, endorsement cascade)
- Trust infrastructure (database only) — `attachment_transfers` + `reports` tables, `transfer_attachment()` + `submit_report()` RPCs. Report UI deferred.
- Yacht name timeline (database only) — `yacht_names` table tracking name history. Yachts change names frequently; this prevents duplicate yacht entries and lets attachments show the name the yacht had when crew worked there. Seeded from existing `yachts.name`. UI deferred.

**Out:**
- Yacht merge flow — not needed; graph self-heals via crew count signal + attachment transfer lets users self-correct
- Yacht search as browsing/discovery tool (intentionally deferred — monetisation candidate for paid tier)
- Report UI (tables + RPCs ship, UI is a future sprint)
- Gap analysis in sea time (out for now, can be added later)
- Recruiter search / NLP search (future phase)
- Availability broadcast / discovery (future phase)
- D3.js / force-directed graph visualisation (clean list/accordion view is fine for MVP)
- New yacht creation flow redesign (existing flow works)
- Yacht verification / establishment workflow changes
- API routes for reads (codebase uses server-component queries)
- Dark mode work (sidelined in Sprint 10.3 — force light mode)

## Dependencies

- Sprint 10.1 complete (Phase 1A closed)
- Sprint 11 complete (section colours, Salty, public profile polish)
- `yachts`, `attachments`, `endorsements`, `users` tables exist with RLS
- RPCs exist: `get_colleagues()`, `get_sea_time()`, `search_yachts()`, `are_coworkers_on_yacht()`
- `YachtPicker` component exists with fuzzy search + near-miss detection
- `/app/yacht/[id]` page exists (basic: cover photo, name, metadata, flat crew list)
- `/app/network` page exists with `AudienceTabs` (colleagues tab, endorsement tabs)

## Key Deliverables

### Yacht Detail Page Enhancement — `/app/yacht/[id]`
- ⬜ Current crew vs alumni split (based on `ended_at`)
- ⬜ Crew cards tap → navigate to `/u/[handle]`
- ⬜ Mutual connections badge: "Also worked with you on M/Y Horizon" (shared yachts beyond current one)
- ⬜ Endorsement relationship indicators on crew cards
- ⬜ Endorsement cross-references section: endorsements written between crew of this yacht (expandable, 3 shown initially)
- ⬜ Enhanced stats row: crew count, avg tenure (months), endorsement count, length
- ⬜ `Promise.all()` for all independent queries (performance)

### Colleague Explorer — `/app/network/colleagues`
- ⬜ 1st-degree: grouped by yacht (accordion: "M/Y Example — 4 colleagues")
- ⬜ Colleague card: photo, name, role, shared yacht count, endorsement status
- ⬜ "Endorse" quick-action → links to existing endorsement request flow
- ⬜ Mutual colleagues on public profiles: "3 of your colleagues have worked with Sam" → expand → see who → tap to explore
- ⬜ New RPC: `get_mutual_colleagues(viewer, profile)` — returns which of your colleagues have also worked with this person
- ⬜ Search/filter within your network
- ⬜ Summary stats: total colleagues, yachts, endorsements
- ⬜ Entry points from AudienceTabs colleagues section + profile page

### Sea Time Display
- ⬜ New RPC: `get_sea_time_detailed()` — per-yacht breakdown with role, dates, days
- ⬜ Profile page: sea time summary card (total years+months, yacht count)
- ⬜ Breakdown page at `/app/profile/sea-time` — per-yacht table
- ⬜ Public profile: total sea time stat line

### Yacht Search — Natural Deduplication
- ⬜ Show crew count in search results and duplicate detection ("M/Y Example · 12 crew · Established")
- ⬜ Crew count as the canonical signal — the yacht with more crew is the real one, no merge needed
- ⬜ Better duplicate detection dialog (side-by-side comparison, crew count, established status)
- ⬜ Improved fuzzy match presentation (match quality indicator)
- ⬜ Established yacht badge in search results
- ⬜ Broader match threshold for more inclusive suggestions

### Attachment Transfer — "Wrong yacht?" correction
- ⬜ `attachment_transfers` table (audit log) + `reports` table (trust foundation)
- ⬜ `transfer_attachment()` RPC — atomic: validate ownership, move attachment, cascade endorsements (opt-in), log transfer
- ⬜ `submit_report()` RPC — validate target, prevent duplicates, insert
- ⬜ API route: `POST /api/attachment/transfer`
- ⬜ "Wrong yacht?" section on attachment edit page
- ⬜ TransferSheet: BottomSheet with YachtPicker → impact preview → confirm
- ⬜ Impact preview shows: what stays (role, dates), what changes (endorsements, crew counts)
- ⬜ Skipped endorsements (endorser not on destination) shown as warning
- ⬜ 5-transfer lifetime limit per attachment

### Database Migration
- ⬜ Fix existing `get_sea_time()` date arithmetic bug (extract(day) → date subtraction)
- ⬜ `get_sea_time_detailed(p_user_id)` — per-yacht sea time breakdown
- ⬜ `get_yacht_endorsement_count(p_yacht_id)` — endorsement count on yacht
- ⬜ `get_yacht_avg_tenure_days(p_yacht_id)` — average crew tenure
- ⬜ `get_mutual_colleagues(viewer, profile)` — which of your colleagues have worked with this person
- ⬜ Handle index verification
- ⬜ GRANT EXECUTE on all new functions

## Exit Criteria

- Yacht detail page shows current/alumni crew split with profile links and mutual connection badges
- Endorsement cross-references section renders on yacht pages with endorsements
- Colleague explorer loads grouped by yacht with endorsement status and endorse action
- Sea time displays on profile (summary card) and public profile (stat line)
- Sea time breakdown page shows per-yacht details
- Yacht search shows match quality and improved duplicate comparison
- Attachment transfer: "Wrong yacht?" flow works end-to-end (BottomSheet → YachtPicker → impact preview → confirm → endorsement cascade)
- Transfer RPC enforces ownership, 5-transfer limit, returns moved/skipped endorsement details
- `reports` + `attachment_transfers` tables exist with RLS (reports: foundation only, no UI)
- Crew card component built with extensible props for future overflow menu / report button
- All new pages work at 375px width (mobile-first)
- No performance regressions — `Promise.all()` on all independent queries
- GRANT EXECUTE applied to all new RPCs
- PostHog events firing for key interactions

## Estimated Effort

6–8 days

## Notes

The yacht graph is the product's wedge. This sprint makes it visible. A well-designed list/accordion view showing "these are all the people you've worked with, grouped by yacht, with endorsement status" is powerful and unique — no D3 visualisation needed for MVP.

**Yacht merge is not needed.** The graph self-heals: the yacht entry with more crew attached is naturally canonical. Showing crew count in YachtPicker search results and duplicate detection steers users to the right entry. Prevention > correction. If merge is ever needed at scale, Phase 2+ can add quorum-based merge proposals.

**Mutual colleagues as social proof.** When you view someone's profile: "3 of your colleagues have worked with Sam" — tap to see who, tap one of them to visit their profile, see their yachts, tap a yacht, see its crew... the graph is the navigation. Every touchpoint links to the next. No search, no visualization — just click-click-click through the network.

**No new API routes for reads.** The codebase pattern is server-component data fetching via `createClient()`. Sprint 12 follows this pattern. RPCs are used for complex computed queries (sea time, stats). API routes would only be added for mutations if needed.

See `build_plan.md` for the full implementation specification.
