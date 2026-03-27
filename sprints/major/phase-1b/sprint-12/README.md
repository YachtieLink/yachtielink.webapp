# Sprint 12 — Yacht Graph Foundation

**Phase:** 1B
**Priority:** P0 — core product differentiator, enables network browsing
**Status:** 📋 Ready for execution
**Runs after:** Sprint 11 complete (onboarding polish done)
**Runs before:** Sprint 13 (launch polish)
**Estimated effort:** 6–8 days
**Type:** Feature sprint — make the yacht graph navigable and central

---

## Why This Sprint Exists

YachtieLink's wedge is the yacht graph: every profile links to yachts, every yacht links to crew, every crew links back to profiles. With onboarding now fast and bugfixes applied, this sprint makes the graph tangible. Users can click through network without search — explore by following links between people and yachts.

This sprint doesn't build search or visualization. It builds **navigation:** yacht detail pages with crew context, colleague explorer grouped by yacht, sea time displays, and lightweight "wrong yacht?" correction flow. The graph is usable through links alone.

---

## Scope

### In — Graph Navigation & Context

**A. Yacht Detail Page Enhancement** (`/app/yacht/[id]`)
- Current crew vs alumni split (based on `ended_at`)
- Crew cards with profile links (tap → navigate to `/u/[handle]`)
- Mutual connections badge: "Also worked with you on M/Y Horizon"
- Endorsement relationship indicators on crew cards
- Endorsement cross-references: endorsements written between crew of this yacht (expandable, 3 shown)
- Enhanced stats: crew count, avg tenure (months), endorsement count, length
- Promise.all() for independent queries (performance)

**B. Colleague Explorer** (`/app/network/colleagues`)
- 1st-degree network grouped by yacht (accordion: "M/Y Example — 4 colleagues")
- Colleague cards: photo, name, role, shared yacht count, endorsement status
- "Endorse" quick-action button
- Mutual colleagues on public profiles: "3 of your colleagues have worked with Sam" → expand → see who
- New RPC: `get_mutual_colleagues(viewer, profile)`
- Search/filter within network
- Summary stats: total colleagues, yachts, endorsements

**C. Sea Time Display**
- New RPC: `get_sea_time_detailed()` — per-yacht breakdown
- Profile page: sea time summary card (total years+months, yacht count)
- Breakdown page: `/app/profile/sea-time` (per-yacht table)
- Public profile: total sea time stat line

**D. Yacht Search — Natural Deduplication**
- Show crew count in search results + duplicate detection
- Crew count as canonical signal (yacht with more crew is the real one)
- Better duplicate detection dialog (side-by-side comparison)
- Improved fuzzy match presentation
- Established yacht badge
- Broader match threshold for inclusive suggestions

**E. Attachment Transfer — "Wrong Yacht?" Correction**
- `attachment_transfers` table (audit log) + `reports` table (trust foundation)
- `transfer_attachment()` RPC — atomic: validate ownership, move, cascade endorsements, log
- `submit_report()` RPC
- API route: `POST /api/attachment/transfer`
- "Wrong yacht?" section on attachment edit page
- TransferSheet: BottomSheet with YachtPicker → impact preview → confirm
- Impact preview: what stays (role, dates), what changes (endorsements)
- 5-transfer lifetime limit per attachment

### In — Database Foundation (No UI Yet)

**F. Database Layer**
- Fix existing `get_sea_time()` date arithmetic bug
- `get_sea_time_detailed(p_user_id)` — per-yacht breakdown
- `get_yacht_endorsement_count(p_yacht_id)`
- `get_yacht_avg_tenure_days(p_yacht_id)`
- `get_mutual_colleagues(viewer, profile)`
- Handle index verification
- GRANT EXECUTE on all new functions

### Out — Deferred

- Full graph visualization (D3, force-directed)
- Yacht merge flow (not needed; graph self-heals via crew count signal)
- Yacht search as browsing/discovery tool (monetization candidate for paid tier)
- Report UI (tables + RPCs ship, UI deferred)
- Gap analysis in sea time
- Recruiter search / NLP search (future phase)
- Availability broadcast / discovery (future phase)
- Yacht verification changes
- API routes for reads (codebase uses server components)
- Dark mode work (sidelined, force light mode for now)

---

## Dependencies

- **Sprint 11 complete** (onboarding done, users have profiles)
- **All base tables exist:** `yachts`, `attachments`, `endorsements`, `users` with RLS
- **RPCs exist:** `get_colleagues()`, `get_sea_time()`, `search_yachts()`, `are_coworkers_on_yacht()`
- **Component exists:** `YachtPicker` (fuzzy search + near-miss detection)
- **Page exists:** `/app/yacht/[id]` (basic: cover photo, name, metadata, flat crew list)
- **Page exists:** `/app/network` with `AudienceTabs`

---

## Key Deliverables

### A. Yacht Detail Page (`/app/yacht/[id]`)

**Note:** Directory exists at `/app/(protected)/app/yacht/[id]/` but `page.tsx` is missing. This sprint will CREATE the page (not enhance existing).

- ⬜ Create `page.tsx` for yacht detail page (new file)
- ⬜ Query: fetch yacht + current crew (ended_at IS NULL) + alumni (ended_at IS NOT NULL)
- ⬜ Current/alumni tabs or accordion split
- ⬜ Crew cards: photo, name, role, years on yacht, endorsement status badge
- ⬜ Card click → navigate to `/u/[handle]`
- ⬜ Mutual connections: "3 of your colleagues also worked here" (call `get_mutual_colleagues` for each crew member)
- ⬜ Endorsement cross-refs: query endorsements where both endorser and recipient are crew of this yacht
- ⬜ Stats card: crew count, avg tenure (call `get_yacht_avg_tenure_days`), endorsement count (call `get_yacht_endorsement_count`), yacht length/flag/established
- ⬜ Use `Promise.all()` for all independent queries

### B. Colleague Explorer (`/app/network/colleagues`)

- ⬜ Query user's colleagues (via `get_colleagues`)
- ⬜ Group by yacht (map colleagues to their shared yachts with user)
- ⬜ Accordion: "M/Y Example — 4 colleagues" (collapsed by default, expand to show cards)
- ⬜ Colleague card: photo, name, role, count of shared yachts, endorsement status (requested/given/none)
- ⬜ "Endorse" button → link to existing endorsement request flow
- ⬜ Search/filter: text search by name or yacht
- ⬜ Summary stats: total unique colleagues, total yachts worked on with user, endorsements given/received
- ⬜ Entry point from AudienceTabs + profile page
- ⬜ New RPC: `get_mutual_colleagues(viewer_id, profile_id)` — returns array of viewer's colleagues who also worked with profile_id

### C. Sea Time Display

- ⬜ Profile page: new card showing "Total sea time: X years Y months, Z yachts"
- ⬜ Card links to `/app/profile/sea-time` (breakdown page)
- ⬜ Breakdown page: table with columns [Yacht | Role | Start | End | Days | Years]
- ⬜ Public profile: add stat line "X years sea time" in hero stats
- ⬜ New RPC: `get_sea_time_detailed(p_user_id)` — returns array of {yacht_name, role, start_date, end_date, days, years}

### D. Yacht Search UX (YachtPicker enhancement)

- ⬜ Search results: add crew count badge ("M/Y Example · 12 crew · Established")
- ⬜ Crew count as canonical signal: show in duplicate detection dialog (side-by-side)
- ⬜ Match quality indicator: "Strong match" vs "Possible match"
- ⬜ "Established" badge if yacht has 5+ crew or created >1 year ago
- ⬜ Improved duplicate detection dialog: side-by-side cards with crew count, date added, established status
- ⬜ Broader fuzzy match threshold: accept more fuzziness to catch typos and variations

### E. Attachment Transfer — "Wrong Yacht?" Flow

- ⬜ Migration: create `attachment_transfers` table (audit log: user_id, attachment_id, from_yacht_id, to_yacht_id, transfer_reason, created_at)
- ⬜ Migration: create `reports` table (foundation: user_id, reported_user_id, report_type, reason, status, created_at)
- ⬜ `transfer_attachment()` RPC: atomic transaction
  - Validate ownership (attachment belongs to user)
  - Fetch existing endorsements on attachment
  - Move attachment to new yacht + role
  - Cascade endorsements: keep endorsements where both endorser & recipient remain crew; skip others
  - Log transfer to `attachment_transfers`
  - Return: {moved_count, skipped_count, skipped_endorsements[]}
  - 5-transfer lifetime limit per attachment (check count)
- ⬜ `submit_report()` RPC: insert into `reports` (prevent duplicates)
- ⬜ API route: `POST /api/attachment/transfer` — call RPC, return result
- ⬜ Edit attachment page: add "Wrong yacht?" section → link to TransferSheet
- ⬜ TransferSheet: BottomSheet with YachtPicker → confirm new yacht
- ⬜ Impact preview: "Role: {role}, Dates: {dates}, Endorsements: moving with attachment, skipping X that don't have both people on new yacht"
- ⬜ Confirm button: calls transfer RPC, updates attachment, shows result toast

### F. Database Layer

- ⬜ Fix `get_sea_time()` date arithmetic (extract(day) → date subtraction)
- ⬜ Implement `get_sea_time_detailed(p_user_id)` — returns per-yacht breakdown
- ⬜ Implement `get_yacht_endorsement_count(p_yacht_id)` — count endorsements where both are yacht crew
- ⬜ Implement `get_yacht_avg_tenure_days(p_yacht_id)` — average crew tenure
- ⬜ Implement `get_mutual_colleagues(viewer, profile)` — which of viewer's colleagues worked with profile
- ⬜ Handle index verification (search performance)
- ⬜ GRANT EXECUTE on all new RPCs to authenticated role

---

## Build Order (Dependency-Validated)

```
Wave 1 — Database Foundation (~1 day)
  ├─ Fix get_sea_time() bug
  ├─ Implement 4 new RPCs (sea_time_detailed, endorsement_count, avg_tenure, mutual_colleagues)
  ├─ Create attachment_transfers + reports tables
  ├─ Handle index verification
  ├─ GRANT EXECUTE
  └─ Result: all queries ready for UI layer

Wave 2 — Yacht Detail + Sea Time (~1.5 days)
  ├─ Yacht detail page: current/alumni split, crew cards, mutual connections, endorsement refs, stats
  ├─ Sea time card on profile + breakdown page (/app/profile/sea-time)
  ├─ Public profile sea time stat
  └─ Result: yacht navigation works, sea time visible everywhere

Wave 3 — Colleague Explorer (~1.5 days)
  ├─ Colleague page grouped by yacht
  ├─ Search/filter
  ├─ Endorse quick-action
  ├─ Mutual colleagues display on public profile
  └─ Result: network is browsable

Wave 4 — Yacht Search + Transfer Flow (~1.5 days)
  ├─ YachtPicker enhancements (crew count, match quality, established badge)
  ├─ Duplicate detection dialog improvements
  ├─ "Wrong yacht?" section on edit page
  ├─ TransferSheet BottomSheet component
  ├─ API route + RPC wiring
  └─ Result: users can self-correct wrong yacht entries

Wave 5 — Testing + Polish (~1 day)
  ├─ E2E: yacht → crew → profile → yacht (multi-hop navigation)
  ├─ Sea time accuracy check (dates, calculations)
  ├─ Transfer RPC edge cases (5-limit, endorsement cascade)
  ├─ Mobile responsive (375px)
  └─ Ready for merge
```

---

## Exit Criteria — All Required

- [ ] Yacht detail page shows current/alumni crew split with profile links
- [ ] Crew cards show mutual connections ("X of your colleagues work here")
- [ ] Endorsement cross-references display on yacht pages
- [ ] Colleague explorer loads with colleagues grouped by yacht
- [ ] Colleague search/filter works
- [ ] Sea time displays on profile (summary + breakdown page)
- [ ] Sea time displays on public profile
- [ ] Yacht search shows crew count, match quality, established badge
- [ ] Duplicate detection dialog side-by-side comparison works
- [ ] "Wrong yacht?" flow end-to-end: edit page → sheet → yacht picker → impact preview → confirm → transfer
- [ ] Transfer RPC enforces 5-transfer limit
- [ ] Transfer RPC cascades endorsements correctly (keeps mutual, skips one-sided)
- [ ] `attachment_transfers` + `reports` tables exist with RLS
- [ ] All new RPCs have GRANT EXECUTE
- [ ] Multi-hop navigation works (profile → yacht → crew → profile, at least 3 hops)
- [ ] Sea time calculations accurate (days, years, months)
- [ ] Crew card component extensible for future overflow menu / report button
- [ ] All pages responsive at 375px
- [ ] No performance regressions (Promise.all on independent queries)
- [ ] `npm run build` zero errors, `npm run drift-check` PASS

---

## Estimated Effort

- **Wave 1:** 1 day (database foundation)
- **Wave 2:** 1.5 days (yacht detail + sea time)
- **Wave 3:** 1.5 days (colleague explorer)
- **Wave 4:** 1.5 days (yacht search + transfer)
- **Wave 5:** 1 day (testing + polish)
- **Total:** 6–8 days

---

## Notes

**The yacht graph is the navigation.** This isn't a visualization (no D3, no force-directed layout). It's pure links: profile → yacht, yacht → crew, crew → profile. Users explore the network by clicking through. At 20-50 crew, this is more useful than search.

**No yacht merge flow needed.** The graph self-heals: the yacht entry with more crew is naturally canonical. Showing crew count in search and duplicate detection steers users to the right entry. Prevention > correction. Merge is deferred to Phase 2 if ever needed at scale.

**Sea time is social proof.** When you view a profile: "5 years sea time, 12 yachts". When you click a yacht: "Avg tenure 8 months, 43 endorsements written between crew". This context makes the network trustworthy.

**Transfer flow is lightweight.** Users will upload the same yacht twice (typos, "M/Y Example" vs "M/Y Example II"). The "Wrong yacht?" section and 5-transfer limit let them self-correct without support tickets. The transfer cascade is smart: endorsements move with attachments only if both people stay on the new yacht. If one person isn't crew of the new yacht, that endorsement stays on the old one (user can manually delete). Prevents data loss.

**Database foundation first.** All queries are shared across yacht detail, colleague explorer, sea time, search. Building RPCs once and testing them thoroughly prevents bugs and performance issues later.

**Save yachts:** Once yacht detail pages exist, users should be able to save/bookmark yachts the same way they save profiles (heart button, notes, watching, folders). This could live on the yacht detail page and appear in a "Yachts" sub-section of `/app/network/saved`. See `sprints/backlog/save-yachts.md` for full spec.

**Deferred bugs from CV-Parse-Bugfix sprint (pick up here):**
These were originally filed as QA bugs (2026-03-24) but belong in this sprint's scope:
- Bug 34: Network tab missing yacht graph/exploration → Sprint 12 Section A+B
- Bug 37: Colleagues not grouped by yacht → Sprint 12 Section B (colleague explorer)
- Bug 10: Yacht matching unclear ("new" badge on everything) → Sprint 12 Section D (match quality indicator)
- Bug 31: Yacht names not clickable on profile/CV → wire links to `/app/yacht/[id]` in ExperienceSection
- Bug 32: Yacht ensign flags show plain text → render flag in yacht stats/experience cards
- Bug 36: Endorsements not grouped by yacht → Sprint 12 Section A (endorsement cross-refs on yacht detail)
- Bug 35: Can't save/bookmark yachts → already noted above, backlog spec at `sprints/backlog/save-yachts.md`

**Post-launch:** After launch, Ghost Profiles + Claimable Accounts unblocks crew who've never created a profile (received endorsements, appeared on yachts). That's the next major feature after this sprint.
