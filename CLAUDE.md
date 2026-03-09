# CLAUDE.md — YachtieLink (Claude Code)

Read `AGENTS.md` first. That file contains all primary instructions, workflow, build target, and doc references. This file adds Claude Code-specific behaviour only.

---

## Claude-Specific

- Use subagents for codebase-wide exploration — return summaries to main context rather than reading every file inline.
- Promote anything from `notes/` that becomes a real decision into the appropriate `docs/` file and log it in `CHANGELOG.md`.
