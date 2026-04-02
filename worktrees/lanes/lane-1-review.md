## Review: fix/ghost-closeout (yl-wt-1)

**Verdict: WARNING**

### /yl-review results
- Type-check: **PASS** (exit 0)
- Drift-check: **PASS** (0 new warnings)
- Sonnet scan: 1 HIGH, 2 MEDIUM, 2 LOW
- Opus deep review: 0 P1, 3 P2
- YL drift patterns: **PASS** — no new drift introduced
- QA: Skipped — pure data-layer change (query joins + fallback chains), no UI surface changes

### Findings

**HIGH — Stale inline query in CV preview (OUT OF SCOPE)**
`app/(protected)/app/cv/preview/page.tsx:21` has its own inline endorsements query that does NOT include `ghost_endorser:ghost_endorser_id`. The owner will see 'Anonymous' for ghost endorsements in their CV preview. This is a **pre-existing drift** — not introduced by this lane, and the file is outside the allowed list. Should be fixed in a follow-up.

**MEDIUM — Dead code in EndorsementsSection interface (PRE-EXISTING)**
`components/profile/EndorsementsSection.tsx:8` declares `endorser_id: string` (non-nullable) and `yacht_id: string` (non-nullable), but neither is selected by the query. The `isOwn` check on line 65 is dead code. This component is not imported by any route. Pre-existing, not introduced by this lane.

**MEDIUM — Ghost name after claim (MITIGATED)**
After `claim_ghost_profile()` runs, `ghost_endorser_id` is set to NULL and `endorser_id` is set to the claiming user. The RPC is atomic. The RLS gap (claimed ghosts invisible to non-claimants) is a no-op because the FK is already nulled. No action needed.

**LOW — `endorserName` prop in public sections doesn't include ghost fallback (MITIGATED)**
`components/public/sections/EndorsementsSection.tsx:30` and `app/(public)/u/[handle]/endorsements/page.tsx:58` pass `endorserName` without ghost fallback. Mitigated because `EndorsementCard` uses separate `ghostEndorserId`/`ghostEndorserName` props and renders `GhostEndorserBadge` instead. No user-visible defect.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep beyond lane file

### Blockers
None.

### Warnings
1. **Stale inline query** in `app/(protected)/app/cv/preview/page.tsx` — should be replaced with `getCvSections()` call in a follow-up. Ghost endorsements will show 'Anonymous' in owner CV preview until fixed.

### Recommendation
Merge as-is. The one HIGH finding is pre-existing drift outside this lane's scope — track as a follow-up fix.
