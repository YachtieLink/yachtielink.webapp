# CHANGELOG.md — Cross-Agent Handover Log

All coding agents (Claude Code, Codex, etc.) must read this file at session start and update it at session end.

**Format:** Reverse chronological. Most recent entry first. One entry per session.

**Rules:**
- Read the latest 3 entries before doing any work
- Read older entries only if the current task needs deeper historical context
- Add an entry when your session ends or when you complete meaningful work
- Be concise but specific — the next agent (which may not be you) needs to understand what happened and what's next
- Flag anything the next agent should watch out for

---

## 2026-03-09 — Claude Code

### Done
- Created 5-year revenue strategy doc (`notes/5yr_plan_10m_arr.md`) — brainstorming, non-canonical
- Created `notes/` directory with README explaining it's non-critical brainstorming
- Created `docs/yl_build_plan.md` — canonical sprint-by-sprint build plan for Phase 1A (8 sprints, ~16 weeks), Phase 1B (3 sprints), and Phase 1C (4 sprints)
- Added `yl_build_plan.md` to canonical docs in `CLAUDE.md` and `AGENTS.md` startup sequences
- Updated `yl_system_state.json` status from "Pre-build" to "Building" with build plan reference
- Added build plan cross-reference in `yl_phase1_execution.md`
- Added `notes/` to repository map in `CLAUDE.md`

### Context
- Founder confirmed Phase 1A target: ship by end of June 2026 for Med season
- Build plan breaks 1A into 8 sequential sprints with clear dependencies and deliverables
- Sprints 3 (Profile) and 4 (Yacht Graph) can overlap if a second developer joins
- Revenue strategy explores path to €10M ARR via verification API + enterprise contracts (Years 3–5), but this is brainstorming only — current build is crew-side only

### Next
- Start Sprint 1: database migrations, RLS policies, Supabase Auth config, app shell, base components
- Apple Developer Account setup needed early (blocks Apple OAuth)
- Commit existing uncommitted work (Supabase client, health check) before starting Sprint 1

### Warnings
- `notes/` folder is explicitly non-canonical — do not treat strategy sketches as build requirements
- `docs/yl_build_plan.md` IS canonical — treat it as the execution sequence for current work
- The build plan references the UX spec (`yl_mobile_first_ux_spec_for_pm_v1.md`) as design source of truth — some screens in that spec (timeline, IRL interactions, messaging) are deferred and should not be built

---

## 2026-03-08 — Codex

### Done
- Rewrote the planning set around the yacht graph wedge: profile, yacht entities, attachments, colleague graph, endorsement requests, endorsements, and paid presentation upgrades
- Split the roadmap into Phase 1A / 1B / 1C and deferred recruiter access, hiring, timeline, messaging, and IRL interactions out of the current build target
- Removed the paid path to verified status and tightened monetisation language to forbid payment-based moderation power
- Added `AGENTS.md` at repo root to force a consistent Codex startup flow
- Rewrote `CLAUDE.md` into a compact operating manual that points to the canonical Phase 1A docs
- Changed startup guidance so agents read only the latest 3 `CHANGELOG.md` entries by default instead of the entire file

### Next
- Review the narrowed scope with the founder and confirm whether recruiter access stays fully deferred to Phase 1C
- Align any remaining secondary docs that still describe recruiter or timeline features as active near-term scope
- If build work starts next session, treat `docs/yl_system_state.json` and `docs/yl_phase1_execution.md` as the implementation source of truth

### Warnings
- The decision log still contains future-state recruiter and timeline decisions for later phases; treat the rewritten canonical docs as the source of truth for the current build target
- If recruiter access is reintroduced earlier, preserve the boundary that payment may buy efficiency, never trust creation, moderation power, or credibility outcomes
- `AGENTS.md` now instructs agents to read `CLAUDE.md`, the latest 3 `CHANGELOG.md` entries, `docs/yl_system_state.json`, and `docs/yl_phase1_execution.md` before substantive work

## 2026-03-08 — Claude Code

### Done
- Consolidated project structure: planning docs moved from separate `Project Files/` directory into `docs/` within the webapp repo
- Archived superseded `ops/STACK.md`, `ops/TODO.md`, `ops/test.md` to `ops/archived/`
- Created `CLAUDE.md` at repo root — operating manual for all coding agents
- Created `CHANGELOG.md` (this file) — centralized cross-agent handover log
- Replaced boilerplate `README.md` with project-specific version
- Previously: promoted vNext files (relationship model update, timeline system), archived pre-vNext originals

### Context
- Founder confirmed Phase 1 focus: presentation layer (shareable digital profile and CV for crew). This is the validated entry point — useful with zero network effects.
- Graph, endorsements, recruiter search come later as organic consequences of adoption.
- Timeline/posts/interactions system is designed (in docs) but parked — not Phase 1 launch scope.
- NLP search, conversational onboarding, multilingual support also parked.
- Prior to this session: Phases A (DNS/identity) and B (code/deployment) complete. Phase C (backend/auth) partially done — Supabase projects created, auth enabled, RLS and env var connection still pending.

### Next
- No production features built yet. Next session should focus on whatever the founder prioritizes for build start.
- Existing uncommitted changes in repo: Supabase client setup (`lib/supabase/`), API health check (`app/api/health/`), package.json updates. These should be reviewed and committed.

### Warnings
- Do not build parked features (timeline, NLP search, conversational onboarding) without explicit founder approval
- The relationship taxonomy changed: "connection" is now split into colleague (graph edge), IRL connection (graph edge), and contact (messaging only). Use current terminology.
- Constitutional principles are non-negotiable. Read `docs/yl_principles.md` before touching anything trust-related.
- `.env.local` exists with Supabase credentials — never commit this file.
