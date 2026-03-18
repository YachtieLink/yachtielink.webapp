# CLAUDE.md — YachtieLink (Claude Code)

Read `AGENTS.md` first. That file contains all primary instructions, workflow, build target, and doc references. This file adds Claude Code-specific behaviour only.

---

## Claude-Specific

- Use subagents for codebase-wide exploration — return summaries to main context rather than reading every file inline.
- `notes/` is for ideation and strategy. Sprint work lives in `sprints/`. If something in `notes/` becomes a real decision, promote it into the appropriate `docs/` file and log it in `CHANGELOG.md`.
- When creating or closing a junior sprint, update both the sprint's own README and the parent index (`sprints/junior/README.md`).
