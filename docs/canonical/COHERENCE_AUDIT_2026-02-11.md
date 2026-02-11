# YachtieLink Planning Coherence Audit (2026-02-11)

Scope audited: active `vNext` planning docs in `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11`.

## Verdict
- Planning is mostly coherent and implementation-ready at product/system level.
- Main remaining work is operational hardening (thresholds, owners, exact limits), not conceptual redesign.

## Findings To Resolve

1. `TBD` limits are still open in security and metrics.
- Affects:
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_security.vNext.md`
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_phase1_actionables.vNext.json`
- Impact: cannot enforce moderation/rate-limit policy consistently.
- Action: define concrete values for post/comment/interaction limits and timeline-abuse tripwires.

2. Terminology is mostly aligned but still mixed in places (`co-worker`, `coworker`, `colleague`).
- Affects:
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_schema.vNext.md`
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_mobile_first_ux_spec_for_pm_v1.vNext.md`
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_system_state.vNext.json`
- Impact: avoidable confusion for product + engineering teams.
- Action: standardize glossary rule:
  - `Colleague` = shared employment graph edge
  - `IRL connection` = verified in-person graph edge
  - `Contact` = messaging/timeline-only, non-graph
  - Keep `coworker` only as a technical function alias if needed.

3. Endorsement count visibility needs explicit audience split.
- Affects:
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_decisions.vNext.json` (recruiter sorting allowed)
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_mobile_first_ux_spec_for_pm_v1.vNext.md` (prefer hidden/neutral in Phase 1)
- Impact: possible product ambiguity on which surfaces can show counts.
- Action: add one rule line: recruiter search may show sortable counts; crew-facing timeline/profile must avoid quality labels and keep neutral phrasing.

4. Encoding issue in cost lines (`~â‚¬`) should be corrected to `~EUR`.
- Affects:
  - `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/yl_tech_stack.vNext.md`
- Impact: presentation quality and copy hygiene.
- Action: replace mojibake symbols with ASCII-safe currency notation (`EUR`).

## Confirmed Coherent Areas
- Graph model is consistent: graph edges are colleagues + IRL only; contacts are non-graph.
- Timeline model is consistent: chronological, graph-bounded, no algorithmic surfacing.
- Moderation model is consistent with timeline additions and right-of-exit protections.
- Non-goals tone now aligns with flexibility objective (Phase 1 boundaries, not permanent bans).

## Recommended Refinement Sequence
1. Lock threshold values and owners in `yl_phase1_actionables.vNext.json`.
2. Mirror those limits directly into `yl_security.vNext.md`.
3. Normalize terminology in all active `vNext` docs.
4. Fix encoding/copy hygiene in `yl_tech_stack.vNext.md`.
5. Re-run this audit and mark items closed.
