# Session Logs

Working documents — written as work happens, not post-session summaries. The next agent reads these to understand what was tried, what failed, and what was discovered.

## Format

```markdown
---
date: YYYY-MM-DD
agent: Claude Code (Opus 4.6) | Codex | etc.
sprint: <sprint number or "ad-hoc">
modules_touched: [module1, module2]
---

## Summary

1-3 lines. Written early, updated as session progresses.

---

## Session Log

**HH:MM** — What you're about to do or just did. Include decisions, failures, and discoveries.
**HH:MM** — Next entry...
```

## Naming

`YYYY-MM-DD-<slug>.md` where slug is a short description (e.g., `2026-03-21-sprint-10.1.md`)

## Retention

- < 14 days: in `sessions/`
- 14-30 days: moved to `sessions/archive/`
- > 30 days: deleted (git history is backup)

Extract any durable lessons to `docs/ops/lessons-learned.md` before archival.

## Relationship to CHANGELOG

- **CHANGELOG** = what was accomplished (executive summary, Done/Context/Next/Flags)
- **Session log** = what was attempted, discovered, and decided (working notes)

Both are updated during work. They serve different purposes.

## Also update when writing here

- `CHANGELOG.md` — if not already current (Done/Context/Next/Flags)
- `docs/modules/<module>.md` — if you touched any module's code (consolidated: state + activity + decisions)
- `docs/ops/lessons-learned.md` — if you discovered a gotcha worth capturing
- `docs/ops/feedback.md` — if the founder corrected your approach (append-only)
