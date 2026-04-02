# CLAUDE.md — YachtieLink (Claude Code)

Read `AGENTS.md` first. That file contains all primary instructions, workflow, build target, and doc references. This file adds Claude Code-specific behaviour only.

---

## Claude-Specific

- Use subagents for codebase-wide exploration — return summaries to main context rather than reading every file inline.
- `notes/` is for ideation and strategy. Sprint work lives in `sprints/`. If something in `notes/` becomes a real decision, promote it into the appropriate `docs/` file and log it in `CHANGELOG.md`.
- When creating or closing a junior sprint, update both the sprint's own README and the parent index (`sprints/junior/README.md`).

## Sprint Procedure — Mandatory Chain

After building code, follow this chain exactly. Do NOT skip steps. Do NOT commit without completing the chain.

```
BUILD → /yl-review → /yl-shipslog → WAIT FOR FOUNDER → commit + push → PR
```

`/yl-review` includes type-check, drift-check, Sonnet scan, Opus deep review, YL drift patterns, and interactive QA — all in one skill. No need to run these separately.

**Hard rules:**
- NEVER merge PRs — founder merges
- NEVER commit/push without founder's explicit permission
- ALWAYS run `/yl-shipslog` before commit (even if QA was done manually)
- If the founder says "commit and push", run `/yl-shipslog` first, then commit

## Design & Frontend — Required Reading

When building or modifying **anything the user sees**, read these before writing code:

1. **`docs/design-system/patterns/page-layout.md`** — Mobile-first layout, thumb zones, section color wayfinding, state transitions, compact lists, stat cards, inline editable forms, copy standards. **This is the most important design doc.**
1b. **`docs/design-system/patterns/frontend-design-guide.md`** — Per-tab redesign specs (Rally 009), component patterns, universal principles, quality bar. **Read this for any tab redesign work.**
2. **`docs/design-system/philosophy.md`** — The "why" behind design choices. Five principles.
3. **`docs/design-system/style-guide.md`** — Colours, typography, components, CSS tokens.
4. **`docs/design-system/decisions/README.md`** — Every design choice and rejection. Check before proposing something that may have been tried.
5. **`lib/section-colors.ts`** — Section color mapping (CV=amber, Network=navy, Profile=teal, Insights=coral, More=sand).
6. **`docs/yl_llm_strategy.md`** — LLM model choices, pricing, prompt engineering standards.

**Key rules (from founder):**
- Section color wayfinding — every page uses its nav tab's color for accents
- Never mention AI in user-facing copy
- Sell the feature, don't describe it — lead with the pain point, then the speed/value
- Positive framing — missing data is an opportunity, not a failure
- Compact lists with expand-on-tap for 4+ items
- Same-page state transitions — pages evolve, they don't jump

---

## Idea Capture — Feature Conversations

When the founder talks about features, improvements, or things to build — **do not start coding**. These are ideas to capture, not tasks to execute immediately.

1. **Check `docs/yl_features.md` first.** This is the feature registry — the source of truth for all known features. If the feature already exists there, reference it, discuss it, and update it in place if the founder adds new details or changes scope/status.
2. **If it's genuinely new** (not in `yl_features.md`), check `sprints/backlog/`. If a proposal exists there, flesh it out with the new details.
3. **If it's new and not in either place,** create a file in `sprints/backlog/` using the template from that folder's README. Name it with a short slug (e.g. `crew-chat.md`). This is for ideas that haven't earned a spot in the feature registry yet.
4. **Never assume "build this" means "build this now."** The founder plans work in sprints. Ideas go to backlog → get fleshed out → get promoted to a sprint when ready.
5. **Only code when explicitly told to execute a sprint** or when the founder says something clearly immediate like "fix this bug right now" or "let's build this today."

This applies to any conversation that sounds like: "we should add...", "I want a...", "what about...", "let's plan...", "can we do...", "I was thinking about...".
