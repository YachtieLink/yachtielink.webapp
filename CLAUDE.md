# CLAUDE.md — YachtieLink (Claude Code)

Read `AGENTS.md` first. That file contains all primary instructions, workflow, build target, and doc references. This file adds Claude Code-specific behaviour only.

---

## Claude-Specific

- Use subagents for codebase-wide exploration — return summaries to main context rather than reading every file inline.
- `notes/` is for ideation and strategy. Sprint work lives in `sprints/`. If something in `notes/` becomes a real decision, promote it into the appropriate `docs/` file and log it in `CHANGELOG.md`.
- When creating or closing a junior sprint, update both the sprint's own README and the parent index (`sprints/junior/README.md`).

## Idea Capture — Feature Conversations

When the founder talks about features, improvements, or things to build — **do not start coding**. These are ideas to capture, not tasks to execute immediately.

1. **Check `docs/yl_features.md` first.** This is the feature registry — the source of truth for all known features. If the feature already exists there, reference it, discuss it, and update it in place if the founder adds new details or changes scope/status.
2. **If it's genuinely new** (not in `yl_features.md`), check `sprints/backlog/`. If a proposal exists there, flesh it out with the new details.
3. **If it's new and not in either place,** create a file in `sprints/backlog/` using the template from that folder's README. Name it with a short slug (e.g. `crew-chat.md`). This is for ideas that haven't earned a spot in the feature registry yet.
4. **Never assume "build this" means "build this now."** The founder plans work in sprints. Ideas go to backlog → get fleshed out → get promoted to a sprint when ready.
5. **Only code when explicitly told to execute a sprint** or when the founder says something clearly immediate like "fix this bug right now" or "let's build this today."

This applies to any conversation that sounds like: "we should add...", "I want a...", "what about...", "let's plan...", "can we do...", "I was thinking about...".
