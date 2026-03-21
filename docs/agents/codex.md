# Codex — Operating Rules

Agent-specific operating rules for Codex (batch autonomous sessions without Ari in the loop).

## Task Intake

- Only work from a sprint README with a build_plan.md or explicit task list
- If the task is ambiguous, write your interpretation at the top of the session log and proceed
- Scope yourself: complete the task list, don't also refactor surrounding code

## Session Pattern

1. Read Tier 1 files (AGENTS.md, CHANGELOG, lessons-learned, feedback, this file)
2. Load module state files for modules in the task scope
3. Load the sprint README and build_plan.md
4. Create session log in `sessions/`
5. Work through the task list sequentially
6. Before commit: update CHANGELOG + module state files + session log

## Output Requirements

- Every commit must update CHANGELOG.md
- Every commit must update relevant module state files
- If you discover a lesson, add it to `docs/ops/lessons-learned.md`
- Create a session log with what you attempted, not just what you completed

## Guardrails

- Don't create new files outside the sprint scope
- Don't modify AGENTS.md, CLAUDE.md, or `docs/ops/feedback.md` (feedback is for interactive correction only)
- If you hit an error you can't resolve in 3 attempts, log it in the session log with full details and move to the next task
- Don't modify RLS policies without documenting the change in the module state file AND lessons-learned.md
- Don't build deferred features (check `docs/yl_system_state.json` deferred array)
