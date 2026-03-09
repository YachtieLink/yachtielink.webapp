# CHANGELOG.md — Cross-Agent Handover Log

All coding agents (Claude Code, Codex, etc.) must read this file at session start and update it throughout the session.

**Format:** Reverse chronological. One entry per session. Heading: `## YYYY-MM-DD — Agent Name`. Two sessions on the same day get separate entries with the same date. Sections: Done / Context / Next / Flags.

**Reading rules:**
- Read the last 3 sessions before doing any work
- Read older sessions only if the current task needs deeper historical context

**Writing rules:**
- This is a running log — update it as work happens, not just at session end
- Update after any meaningful decision, significant file change, or flag raised to the founder
- Confirm it's current before committing and pushing
- Confirm it's complete at session end
- Be concise but specific — the next agent needs to understand what happened and what's next

---

## 2026-03-10 — Claude Code (Codex GUI session)

### Done
- Created `docs/yl_features.md` — feature registry covering all 25 features across Phase 1A/1B/1C/2+ with what, why, phase assignment, and crew-first notes. New canonical reference doc.
- Restructured `AGENTS.md` — now the primary instruction set for all coding agents (Claude Code, Cursor, Codex, Copilot). Includes persona, workflow, code standards, and decision principles.
- Restructured `CLAUDE.md` — now a thin Claude Code-specific wrapper that defers to `AGENTS.md`.
- Softened language across all agent-facing docs — replaced hard prohibitions ("never", "irreversible", "constitutional", "rejected/never-build") with crew-first principles and flag-and-ask behaviour. Agents surface concerns to founder rather than blocking unilaterally.
- Updated `yl_phase1_execution.md` — "Hard Constraints" → "Guiding Principles", language softened throughout.
- Updated `yl_system_state.json` — `phase_invariants` softened.
- Created `notes/delta_canonical_vs_root_2026-03-09.md` — full diff of docs/canonical/ (from PR #9) vs root-level docs. Documents all meaningful differences for founder review before any content is merged.
- Added `.claude/worktrees/` to `.gitignore`.
- Discovered and resolved branch staleness — our branch was behind by 4 PRs. Merged origin/main, no manual conflicts.
- Switched GitHub remote from SSH to HTTPS — SSH keys weren't configured, GitHub CLI now handles auth.
- Opened PR #11 — all session work pushed to `feat/project-setup`.
- Clarified changelog format: one entry per session (not per day, not per alteration), reading rule is "last 3 sessions", updated both `AGENTS.md` and `CHANGELOG.md` header to reflect this.

### Context
- `docs/canonical/` (from PR #9) is a historical baseline from 2026-02-11. Root-level `docs/` is the working set. Do not overwrite root docs with canonical versions without founder review.
- The delta notes doc flags specific conflicts to resolve — notably D-016 (paid verified status path exists in canonical, removed in root as crew-first violation), recruiter pricing detail, and bootstrapping plan missing from root.
- `yl_features.md` was built from the root docs. Some Phase 1C details (recruiter pricing, full Crew Pro feature list) are more complete in `docs/canonical/` — pending founder review of delta notes before incorporating.

### Next
- Founder to review `notes/delta_canonical_vs_root_2026-03-09.md` and decide what to adopt
- Merge PR #11 once reviewed
- Set up git global user.name and user.email (commits currently attributed to ari@MacBookAir.net)
- Begin Sprint 1: database migrations, RLS policies, app shell, base components

### Flags
- `yl_features.md` is a good working doc but Phase 1C descriptions (recruiter access, Crew Pro full feature list) should be reconciled against `docs/canonical/yl_phase_scope.json` once delta review is done
- The 2026-03-08 warning about constitutional principles being non-negotiable has been intentionally softened — principles are now guidelines with flag-and-ask behaviour, founder makes final calls

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
