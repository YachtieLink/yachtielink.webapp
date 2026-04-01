# Rally 008 — Documentation & Skill System Redesign

**Status:** 🔧 In Progress
**Started:** 2026-04-01
**Trigger:** Audit found 85K lines of docs, 10-file shipslog, 3 decision systems, 4-skill review chain, ~25K token session start cost
**Goal:** Cut agent context load by ~80% at session start, reduce skill chain from 4→2, consolidate doc structure, eliminate drift vectors

---

## Resolved Decisions (from /grill-me session)

These decisions are FINAL. Do not re-debate.

1. **Primary constraint:** Token efficiency first, discoverability second, maintenance follows
2. **Module docs 3→1:** Consolidate `{module}.md` + `{module}.activity.md` + `{module}.decisions.md` into single `{module}.md` with sections. Activity entries are one-liners (format prevents bloat, no trimming mechanism needed)
3. **CHANGELOG gets an index header:** Table at top summarizing every entry (date, sprint, one-line summary). Agents read index (~60 lines), dive into specific entries by offset. Archive full entries older than 30 days to `CHANGELOG-archive/YYYY-MM.md`
4. **Maintenance policy centralized:** Lives in AGENTS.md registry, not per-file footers. Periodic `/housekeep` reads it
5. **Skills are thin orchestration, repo holds rules:** Skills never hardcode file paths or rules. They read from AGENTS.md / repo docs. Skills survive doc restructures
6. **Registry lives in AGENTS.md:** Expanded Tier 1/Tier 2 section becomes the documentation structure registry. No new file
7. **Decision routing — 3 systems, crisp boundaries:**
   - `yl_decisions.json` → constitutional + architectural
   - `docs/design-system/decisions/` → visual/UX (frontend)
   - `docs/ops/feedback.md` → process + behavioral (how to work)
   - Routing rule codified in AGENTS.md + yl-shipslog
8. **Design decisions get explicit shipslog step:** Not optional, not "if you remember"
9. **Skill chain: 4→2 post-build skills:**
   - `/yl-review` = type-check + drift-check + Sonnet scan + Opus deep review + YL drift patterns + interactive QA
   - `/yl-shipslog` = redesigned with decision routing, index CHANGELOG, consolidated module docs
   - Chain: `BUILD → /yl-review → /yl-shipslog → WAIT → commit`
10. **Sprint skills merge:** `/yl-sprint` replaces sprint-start-yl + sprint-build-yl with auto stage detection
11. **Worktree simplified:** Lane files are ephemeral (deleted at cleanup). Worktree session file IS the session log (lives in `sessions/`, not `worktrees/sessions/`)
12. **Overnight simplified:** Chain is now build → /yl-review → /yl-shipslog → commit → push → next unit
13. **Naming:** `yl-` prefix for all YL-specific skills. Generic skills keep current names
14. **Context loading tiers:**
    - Tier 1 (always, ~3K tokens): STATUS.md, CHANGELOG index, AGENTS.md
    - Tier 2 (on demand, ~5-10K): Active sprint, module doc for touched modules, feedback.md, design-system (if frontend)
    - Tier 3 (reference, grep only): lessons-learned, yl_decisions.json, archived CHANGELOG, completed sprints
15. **Backlog index:** Formalize triage into `sprints/backlog/README.md` with 6 categories
16. **Schema dedup:** Registry points to `docs/yl_schema.md` only. Canonical/intake copies are historical, not consulted

---

## Execution Plan — 3 Phases

### Phase 1: Doc Structure (safe, no skill changes needed)
Current skills keep working against old structure during this phase.

- [ ] **1.1** Update AGENTS.md — replace Tier 1/Tier 2 section with documentation registry table. Include file patterns, purpose, maintained-by, maintenance rules, and the 3-tier loading instructions
- [ ] **1.2** Add decision routing rule to AGENTS.md — the 3-way routing table (architectural → yl_decisions.json, visual/UX → design-system/decisions, behavioral → feedback.md)
- [ ] **1.3** CHANGELOG index — add index table to top of CHANGELOG.md summarizing every existing entry. Keep all full entries below. Future entries get an index row added by shipslog
- [ ] **1.4** Backlog formalization — update `sprints/backlog/README.md` with the 6-category triage structure. Remove shipped items (10). Consolidate duplicate files (save-yachts.md / saved-yachts.md)
- [ ] **1.5** Schema dedup — no file changes, just ensure AGENTS.md registry points to `docs/yl_schema.md` as the sole canonical source

**Test:** Agent starts a session, reads only AGENTS.md + STATUS.md + CHANGELOG index. Can it understand project state and know where to find everything? Verify Tier 1 is ~3K tokens.

### Phase 2: File Consolidation
- [ ] **2.1** Consolidate module docs (3→1) for all 11 modules. New format:
  ```
  ---
  module: {name}
  updated: YYYY-MM-DD
  status: shipped|wip|backlog
  ---
  ## Current State
  ## Key Files
  ## Decisions (append-only, newest first, reference D-xxx)
  ## Recent Activity (one-liners, newest first)
  ```
  Merge content from `.activity.md` and `.decisions.md` into the consolidated file. Delete the separate files.
- [ ] **2.2** Merge worktree session docs — move any content from `worktrees/sessions/` into `sessions/` format. Remove `worktrees/sessions/` as a separate location. Update `worktrees/master/CLAUDE.md` to reference `sessions/` directly
- [ ] **2.3** Clean up `worktrees/lanes/` — ensure templates exist but no stale lane files from past sessions remain
- [ ] **2.4** Update all cross-references — any file that references `{module}.activity.md` or `{module}.decisions.md` needs updating (AGENTS.md, CLAUDE.md, WORKFLOW.md, skill files)

**Test:** Verify all module docs are single files. Verify no broken references. Run `grep -r "activity.md\|decisions.md" docs/ sprints/ worktrees/ AGENTS.md CLAUDE.md` — should return zero hits to old file patterns.

### Phase 3: Skill Rewrites
Each skill rewritten to read structure from AGENTS.md registry, not hardcoded paths.

- [ ] **3.1** Write `/yl-review` — 6-phase merged skill (type-check → drift-check → Sonnet scan → Opus deep review → YL drift patterns → interactive QA). Absorbs: review (YL-specific parts), yachtielink-review, test-yl
- [ ] **3.2** Write `/yl-shipslog` — redesigned with: CHANGELOG index maintenance, consolidated module doc updates, explicit design-decision routing step, decision routing rule (3-way), Sonnet audit pass
- [ ] **3.3** Write `/yl-sprint` — merged sprint-start + sprint-build with auto stage detection (nothing exists → README exists → build plan exists → partially executed → rally findings)
- [ ] **3.4** Simplify `/yl-worktree` — remove doc layer (no more worktrees/sessions/), lane files marked ephemeral, session log goes to sessions/ directly
- [ ] **3.5** Simplify `/yl-overnight` — chain becomes build → /yl-review → /yl-shipslog → commit → push. Keep: preflight, blocker handling, /loop safety net, skip-and-continue
- [ ] **3.6** Update CLAUDE.md — new mandatory chain: `BUILD → /yl-review → /yl-shipslog → WAIT → commit`
- [ ] **3.7** Update `sprints/WORKFLOW.md` — reflect new skill names and chain
- [ ] **3.8** Retire old skills — remove or rename: shipslog → yl-shipslog, yachtielink-review → archived, test-yl → archived, sprint-start-yl → archived, sprint-build-yl → archived, worktree-yl → yl-worktree, overnight → yl-overnight

**Test per skill:** Run each new skill on a test branch. Verify it reads from AGENTS.md registry (not hardcoded paths). Verify output matches expected format.

---

## Files Changed (predicted)

### Modified
- `AGENTS.md` — registry, tiers, decision routing
- `CLAUDE.md` — new chain, new skill names
- `CHANGELOG.md` — index header added
- `STATUS.md` — reflect rally 008
- `sprints/WORKFLOW.md` — new skill names, simplified chain
- `sprints/backlog/README.md` — triage categories
- `worktrees/master/CLAUDE.md` — session log location
- `worktrees/reviewer/CLAUDE.md` — new skill name
- `worktrees/worker/CLAUDE.md` — new skill name
- All 11 `docs/modules/*.md` files — consolidated format

### Created
- `CHANGELOG-archive/` directory (for future archival)
- `~/.claude/skills/yl-review/SKILL.md`
- `~/.claude/skills/yl-shipslog/SKILL.md`
- `~/.claude/skills/yl-sprint/SKILL.md`
- `~/.claude/skills/yl-worktree/SKILL.md`
- `~/.claude/skills/yl-overnight/SKILL.md`

### Deleted
- 22 files: `docs/modules/*.activity.md` (11) + `docs/modules/*.decisions.md` (11)
- `worktrees/sessions/` contents (merged into `sessions/`)

### Archived (not deleted, moved or renamed)
- `~/.claude/skills/shipslog/` → kept as reference during transition
- `~/.claude/skills/yachtielink-review/` → kept as reference
- `~/.claude/skills/test-yl/` → kept as reference
- `~/.claude/skills/sprint-start-yl/` → kept as reference
- `~/.claude/skills/sprint-build-yl/` → kept as reference

---

## Token Budget (expected)

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| Session start (Tier 1 only) | ~25K tokens | ~3K tokens | **88%** |
| Frontend sprint session | ~40K tokens | ~8K tokens | **80%** |
| Post-build review chain | 4 skill loads + 4 context reads | 1 skill load + 1 context read | **75%** |
| Shipslog execution | 10 file types | 6 file types (consolidated) | **40%** |

---

## Progress Tracker

Last updated: 2026-04-01

**Phase 1:** [x] 1.1 [x] 1.2 [x] 1.3 [x] 1.4 [x] 1.5 — COMPLETE
**Phase 2:** [x] 2.1 [x] 2.2 [x] 2.3 [x] 2.4 — COMPLETE
**Phase 3:** [x] 3.1 [x] 3.2 [x] 3.3 [x] 3.4 [x] 3.5 [x] 3.6 [x] 3.7 [x] 3.8 — COMPLETE
