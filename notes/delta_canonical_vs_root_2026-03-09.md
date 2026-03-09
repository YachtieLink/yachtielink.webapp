# Delta: docs/canonical/ vs docs/ (root)

**Date:** 2026-03-09
**Purpose:** Capture all meaningful differences between the canonical docs (from PR #9, 2026-02-11) and the root-level docs we were working from this session. Review these and decide what to pull into the active doc set.

**Status:** Unreviewed — founder to decide on each item before incorporating.

---

## How to use this doc

For each delta below, decide one of:
- **Adopt** — pull this into the active docs
- **Reject** — our version is correct, canonical is stale on this point
- **Merge** — both versions have unique value, combine them

---

## 1. yl_decisions.json

### D-016 — Verified Status (CONFLICT)

**Canonical says:** Verified status can be earned via seed set, endorsements from verified users, tenure+density, OR paid subscription.

**Root (our version) says:** Paid subscription path was removed on 2026-03-08. Earned only, never purchased.

**Our CLAUDE.md constitutional rule says:** Payment must never grant verified status.

**Decision needed:** Root version is constitutionally correct. Canonical appears to contradict the constitutional rule. Reject canonical on this point — but worth confirming with founder.

---

### D-036 — Phase 1A Scope Narrowing (MISSING FROM CANONICAL)

**Root has:** D-036 (2026-03-08) — build target narrowed to yacht graph wedge. Recruiter access, hiring, timeline deferred.

**Canonical doesn't have this decision at all.**

**Decision needed:** D-036 is a recent founder decision. Should be adopted into canonical. Low risk.

---

## 2. yl_system_state.json

### Status field
- Canonical: `"Pre-build"`
- Root: `"Building"` ✓ (correct as of 2026-03-09)

### Current phase label
- Canonical: `"Phase 1 — Identity Anchors + Revenue MVP"`
- Root: `"Phase 1A - Portable Profile + Yacht Graph + Endorsements"` ✓ (more precise, reflects D-036)

### North star
- Canonical: includes "paid presentation upgrades **and recruiter access**" in the north star
- Root: "paid presentation upgrades" only (recruiter access removed as per D-036 narrowing)

**Decision needed:** Is recruiter access still in the north star even though it's deferred? Probably yes — it's a long-term revenue pillar. Worth restoring to north star while keeping it out of current build target.

### Handoff section (MISSING FROM ROOT)
Canonical has a full version history section tracking:
- v1.0 (2025-11-15) — founding decisions
- v2.0 (2026-02-01) — additions of D-021 through D-027 (CV import, peer hiring, Crew Pro, recruiter access, contextual visibility, endorsement sorting, availability toggle)

**Decision needed:** Adopt. This lineage is useful. Should be added to root version.

### Problem definition section (MISSING FROM ROOT)
Canonical has a `problem_definition` section explaining the industry failures YachtieLink solves.

**Decision needed:** Review and adopt if still accurate.

### Identity layer — categorisation difference
- Canonical: CV import and yacht entities treated differently (not cleanly in free identity layer)
- Root: Both clearly in free identity layer ✓

**Decision needed:** Root is clearer and more constitutionally correct. Keep root version here.

---

## 3. yl_phase1_execution.md

### Revenue streams table (MISSING FROM ROOT)
Canonical has an explicit revenue streams table:

| Stream | Price | Notes |
|--------|-------|-------|
| Crew Pro | €12/month | Presentation + search access |
| Recruiter Subscription | €29/month | Unlimited search |
| Recruiter Credits | €75–1200 bundles | Profile unlocks |

**Decision needed:** Adopt. This is useful reference even if recruiter access is deferred.

### Crew Pro feature list (MORE DETAILED IN CANONICAL)
Canonical lists Crew Pro features as:
- Search access (crew searching crew)
- 3 job posts/month (vs 1 free)
- Availability broadcast to 2nd-degree network
- Analytics
- Recruiter visibility toggle
- Cert expiry alerts
- Higher endorsement request allowance
- Premium templates + subdomain

Root has a shorter list that omits: search access, job posts, availability broadcast, cert expiry alerts.

**Decision needed:** Canonical is more complete. Adopt the full list — but verify job posts and search access are correctly scoped to Phase 1C not 1A.

### Phase structure removed in canonical
Canonical removes the 1A/1B/1C split — just calls it "Phase 1".
Root has explicit 1A/1B/1C with gates.

**Decision needed:** Root is better here — the 1A/1B/1C structure is the working model. Keep root.

---

## 4. yl_phase_scope.json

### Canonical is ~10x larger — key additions missing from root:

**Recruiter subscription tier** (fully specced in canonical):
- €29/month unlimited search
- Full profile access in search results
- Endorsement count sorting
- Availability broadcast to recruiter pool
- Advanced analytics
- Note: crew opt-in required, default off

**Recruiter credits** (fully specced in canonical):
- €75 = 10 unlocks
- €200 = 30 unlocks
- €500 = 100 unlocks
- €1200 = 300 unlocks
- 1 credit = 1 permanent profile unlock per recruiter-crew pair
- Credits expire 1 year from purchase

**Crew Pro search access** (canonical):
- Limited crew search included in Pro tier (not just in recruiter tier)
- 2nd-degree availability reach

**Growth controls** (canonical has more detail on monetisation boundaries)

**Decision needed:** Adopt recruiter pricing and credits structure. Adopt Crew Pro search scope. This is all Phase 1B/1C material but useful to have specced.

---

## 5. yl_phase1_actionables.json

### In canonical but NOT in root:
- WebSocket concurrent sessions metric (tripwire: 150, hard limit: 200, Cloudflare migration plan)
- Interaction exit rate metric
- Reports per 1000 posts metric
- Time-to-first-IRL metric
- High reputation user grace period handling rules

### In root but NOT in canonical:
- Attachment creation rate metric
- Users with valid attachment metric
- Endorsement request send rate metric
- Endorsement request completion rate metric
- False attachment dispute rate metric

**Decision needed:** Merge both. Root metrics are more relevant to Phase 1A graph formation. Canonical metrics are more relevant to Phase 1B/2 (IRL, posts). Both sets should exist in the final version.

---

## 6. yl_moderation.md

### Crew Pro as verification path (CONFLICT)
Canonical v1.0 includes "Crew Pro subscriber" as one path to earning verified status.
Root v1.1 does not include this (consistent with our constitutional rule that payment never grants verified status).

**Decision needed:** Root is constitutionally correct. Reject canonical on this point.

### Bootstrapping plan (MISSING FROM ROOT)
Canonical has a detailed founder bootstrapping plan:
- Founder personally verifies 20–50 initial crew (seed set)
- Criteria for selection
- Timeline

**Decision needed:** Adopt. Operationally important for launch.

### Crew threshold table (MISSING FROM ROOT)
Canonical has a table defining crew thresholds by yacht size for "established yacht" status.

**Decision needed:** Adopt into root version.

---

## 7. yl_schema.md

### verified_via field
- Canonical: `verified_via ENUM('seed', 'endorsement', 'tenure', 'subscription')`
- Root: `verified_via ENUM('seed', 'endorsement', 'tenure')` — no 'subscription'

**Decision needed:** Aligns with D-016 conflict above. If we reject the paid verification path (constitutionally correct), remove 'subscription' from this enum. Root is correct.

---

## 8. yl_non_goals.md

### Title and framing (SIGNIFICANT)
- Root: "Non-Goals" — treats these as permanent blocks
- Canonical: "Phase 1 Boundaries (Flexible by Design)" — explicitly defers rather than permanently blocks

**Decision needed:** Canonical framing is better. These are sequencing decisions, not permanent prohibitions. Adopt canonical title and framing.

### Recruiter access framing
- Root: "Not a recruiter product in the first build" — blocks it
- Canonical: Reframed as a Phase 1 boundary — "What this allows: Read-only recruiter access once crew-side product stands on its own"

**Decision needed:** Canonical is correct per D-035/D-036. Adopt.

### Peer hiring framing
- Root: "Not an employer-pays hiring platform"
- Canonical: Same constraint, but adds "What this allows: Free job postings by users with full profiles, applications via profile" and explicitly notes "Captains and HODs are crew too"

**Decision needed:** Adopt canonical framing.

### Timeline framing
- Root: Blocks timeline
- Canonical: "Not a public social feed" but "What this allows: A graph-bounded timeline visible only to people you know"

**Decision needed:** Adopt canonical framing — consistent with D-030/D-031.

---

## 9. yl_security.md

Only difference is internal file references (`.vNext` vs base filenames). No substantive content difference.

**Decision needed:** No action needed once file reference conventions are sorted.

---

## Summary of decisions needed

| Item | Recommendation | Priority |
|------|---------------|----------|
| D-016 paid verification path | Reject canonical — root is constitutionally correct | High |
| D-036 missing from canonical | Add to canonical | Medium |
| system_state: status + phase label | Keep root | Done |
| system_state: recruiter in north star | Restore to root | Low |
| system_state: handoff/version history | Adopt from canonical | Low |
| phase1_execution: revenue streams table | Adopt from canonical | Medium |
| phase1_execution: Crew Pro full feature list | Adopt from canonical | Medium |
| phase_scope: recruiter pricing + credits | Adopt from canonical | Medium |
| phase1_actionables: merge both metric sets | Merge | Low |
| moderation: Crew Pro verification path | Reject canonical — root is correct | High |
| moderation: bootstrapping plan | Adopt from canonical | Medium |
| moderation: crew threshold table | Adopt from canonical | Medium |
| schema: verified_via 'subscription' enum | Reject canonical — remove 'subscription' | High |
| non_goals: reframe as "Phase 1 Boundaries" | Adopt canonical framing | Medium |
| non_goals: recruiter/hiring/timeline framing | Adopt canonical framing | Medium |
