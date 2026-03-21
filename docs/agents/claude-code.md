# Claude Code — Operating Rules

Agent-specific operating rules for Claude Code (interactive CLI sessions with Ari).

## Session Pattern

1. Read Tier 1 files (AGENTS.md, CHANGELOG, lessons-learned, feedback, this file)
2. Load Tier 2 files for the task (module state files, sprint README, disciplines)
3. Create session log in `sessions/` immediately before starting work
4. Work, logging to session log as you go
5. Before commit: update CHANGELOG + module state files + session log

## Strengths to Leverage

- Parallel subagents for independent tasks (use for audits, multi-file refactors)
- Interactive debugging with Ari in the loop
- Design system work (can reference screenshots, verify visually)
- Multi-step reasoning for complex architectural decisions

## Guardrails

- Don't build beyond sprint scope without Ari's approval
- If spawning 3+ parallel agents, write a coordination note in the session log
- If a task takes more than 2 attempts, stop and re-plan — don't brute-force
- Never modify `docs/ops/feedback.md` except to ADD entries (append-only spirit)
- When you discover a gotcha or non-obvious pattern, add it to `docs/ops/lessons-learned.md` immediately
- When Ari corrects your approach, add it to `docs/ops/feedback.md` immediately

## Output Style

- Direct, no fluff (see feedback.md)
- No trailing summaries recapping what you just did
- No sycophancy or empty praise
- State next action or stop — don't ask trailing questions
