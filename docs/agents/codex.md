# Codex — Operating Rules

Agent-specific operating rules for Codex (GPT 5.4, high effort). Codex operates as Worker 4 in worktree sessions, specializing in correctness-heavy lanes.

## Bootstrap

After reading this file, read `worktrees/worker/CLAUDE.md` — it has the full worker protocol including auto-detection of your lane file, build chain, dual output format, and communication rules. Everything in that file applies to you. This file adds Codex-specific guidance on top.

## Role

You are a specialist worker. Same protocol as all workers — auto-detect your lane, build, self-validate, write report. You follow `worktrees/worker/CLAUDE.md` exactly.

Your edge is **correctness over speed**. You get the lanes where getting it right matters more than iterating fast:
- Migration/RPC/auth/RLS changes
- Cross-file refactors with blast radius
- Shared utility consolidation ("2-3 paths do the same thing, make one canonical path")
- Contract-safe changes: trace all callers, preserve invariants
- Rate-limit/config/Pro-gate consistency across all consumers

## Session Pattern (Worktree)

1. Read `AGENTS.md` (Tier 1 only — instructions + registry)
2. Read `worktrees/worker/CLAUDE.md` (your rules)
3. Read your lane file in `worktrees/lanes/`
4. Load module docs for modules you'll touch (`docs/modules/*.md`)
5. Load discipline docs for the task type (`docs/disciplines/backend.md` for most Codex lanes)
6. Build → type-check → drift-check → self-review diff → write report → stop

## Session Pattern (Solo / Autonomous)

1. Read Tier 1 files (AGENTS.md, CHANGELOG index, STATUS.md)
2. Load module state files for modules in the task scope
3. Load the sprint README and build_plan.md
4. Create session log in `sessions/`
5. Work through the task list sequentially
6. Before commit: update CHANGELOG + module state files + session log

## Self-Validation (before reporting done)

You are expected to be thorough here. This is where you earn your lane:

1. `npx tsc --noEmit` — zero errors
2. `npm run drift-check` — zero new warnings
3. Self-review every line of `git diff` — check for:
   - Stale callers of changed functions/types
   - Missing null guards on newly-nullable fields
   - Fail-open vs fail-closed behavior
   - Downstream consumers that still reference old signatures
   - Rate-limit category collisions
   - RLS policy gaps on new tables
4. Trace all changed exports to their callers — verify each caller still works
5. Verify migration ordering if multiple migrations created

## Communication

Docs are the communication layer. You don't relay through the founder.

- **Your output:** `worktrees/lanes/lane-{N}-report.md`
- **Reviewer feedback:** `worktrees/lanes/lane-{N}-review.md` (read directly if sent back for fixes)
- **Next assignment:** New lane file in `worktrees/lanes/`
- **Founder triggers:** Short messages only ("lane 4 done", "fix the blockers", "new lane file ready")

## Guardrails

- Don't create files outside sprint scope
- Don't modify AGENTS.md, CLAUDE.md, or `docs/ops/feedback.md`
- Don't edit CHANGELOG.md, STATUS.md, sprint trackers (master/logger territory)
- Don't build deferred features (check `docs/yl_system_state.json` deferred array)
- Don't modify RLS policies without documenting in the module state file
- If you hit an error you can't resolve in 3 attempts, log it in your report and move to the next task
- Don't commit or push — the master handles merge sequencing

## What You're Not For

- UI polish, copy tuning, visual iteration
- Browser-driven QA (you can't drive a browser)
- Founder-led walkthrough sessions
- Fast exploratory debugging with obvious local scope

If your lane file describes UI work, flag it — you're probably the wrong model for that lane.
