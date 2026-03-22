---
date: 2026-03-22
agent: Claude Code (Opus 4.6)
sprint: ad-hoc (backlog system + bug reporter proposal)
modules_touched: [] # no code modules touched — planning/docs only
---

## Summary

Founder came in with two ideas: add a bug reporter feature and check on a roadmap display. Roadmap was already fully built. The bug reporter became the first item filed into a new `sprints/backlog/` system — a standardized idea inbox for capturing feature thoughts without jumping to code.

---

## Session Log

- Explored codebase: confirmed roadmap page exists at `app/(protected)/app/more/roadmap/page.tsx` with 10 items, status badges, categories. Linked from Settings > Help. No work needed.
- Explored bug report patterns: no existing in-app feedback form, only mailto links. Identified all relevant UI components, API patterns, and form conventions.
- Entered plan mode: designed full bug reporter implementation (migration, schema, rate limit, API route, page, settings link — 6 files).
- Founder said "we are not coding today" — surfaced workflow preference: ideas should be captured for later sprint planning, not built immediately.
- Designed and built `sprints/backlog/` system with founder input (chose backlog location: `sprints/backlog/` over `notes/proposals/` or `notes/backlog.md`).
- Founder clarified: existing features live in `docs/yl_features.md` — backlog is only for genuinely new ideas not already in the feature registry.
- Updated `CLAUDE.md` with idea capture instructions (check yl_features.md → check backlog → create in backlog → never auto-code).
- Filed `sprints/backlog/bug-reporter.md` as first backlog item.

## Files Changed

| File | Change |
|------|--------|
| `sprints/backlog/README.md` | Created — backlog system README with template and lifecycle |
| `sprints/backlog/bug-reporter.md` | Created — fleshed-out bug reporter proposal |
| `sprints/README.md` | Added Backlog to sprint hierarchy |
| `CLAUDE.md` | Added Idea Capture section |
| `CHANGELOG.md` | Session entry |

## Decisions
- Backlog lives in `sprints/` not `notes/` — closer to where items graduate into sprints
- `docs/yl_features.md` remains source of truth for known features; backlog is for net-new ideas only
- Idea capture instructions go in `CLAUDE.md` so all agents see them automatically
