# YachtieLink — Sprints & Rallies

This is the canonical home for all execution work — building (sprints) and auditing (rallies). For strategy, competitive research, and exploratory thinking, see `/notes`.

**Before starting a sprint or rally:** Read [WORKFLOW.md](./WORKFLOW.md) — the full execution loop, approval gates, parallel agent patterns, and common mistakes.

---

## Phase 1 Close-Out

**[PHASE1-CLOSEOUT.md](./PHASE1-CLOSEOUT.md)** — Master checklist for the full Phase 1 ship. Start every session here.

---

## Execution Sequence (Locked)

Phase 1B execution runs sequentially through these 4 sprints. See [PHASE1-CLOSEOUT.md](./PHASE1-CLOSEOUT.md) for the complete checklist.

| Order | Sprint | Phase | Status | Focus |
|-------|--------|-------|--------|-------|
| 1 | [Sprint 10.1](./major/phase-1a/sprint-10.1/README.md) | 1A | ✅ Complete | Phase 1A closeout — dark mode, animations, public layout, missing pages |
| 2 | [CV Parse Bugfix](./major/phase-1b/sprint-cv-parse-bugfix/README.md) | 1B | ✅ Complete | Fix 37 QA bugs in 5 waves — data integrity, public profile, wizard, profile page, network |
| 3 | [Sprint 11](./major/phase-1b/sprint-11/README.md) | 1B | ✅ Complete | Public Profile Rewrite — bento grid, 3 view modes, scroll reveal |
| 4 | [Sprint 12](./major/phase-1b/sprint-12/README.md) | 1B | ✅ Complete | Yacht graph foundation — yacht detail, colleagues, sea time, yachts tab |
| 5 | [Sprint 13](./major/phase-1b/sprint-13/README.md) | 1B | 🔧 Code Complete | Launch polish — SEO/OG/cookie/robots merged. Ops + legal blocked on founder. |

**All major sprints complete.** Sprint 13 code-complete, ops/legal blocked on founder.

**Active rally:** [Rally 009 — Pre-MVP Polish](./rallies/rally-009-premvp-polish/) — 4 sessions, 18 items. Session 1 ready to launch.

> Junior sprints in flight → see [junior/README.md](./junior/README.md)

---

## Sprint Hierarchy

### Major Sprints
Planned, phased work that takes ground in the core app build. Mapped to the long-term roadmap (Phase 1A → 1B → 1C → 2 → 3).

→ [major/README.md](./major/README.md)

### Junior Sprints
Unplanned or reactive work that sits outside the main phase structure. Three types:

- **Debug** — bug fixing, error investigation, stability work
- **Feature** — quick feature tweaks, underplanned additions that need shipping now
- **UI/UX** — layout, styling, polish, visual improvements

→ [junior/README.md](./junior/README.md)

### Backlog
The idea inbox. Feature ideas, bug fix proposals, and improvement thoughts captured during conversations. Items here get fleshed out over time, then promoted into a sprint when ready.

→ [backlog/README.md](./backlog/README.md)

### Rallies
Intensive audit sessions — not building, but investigating. Multiple agents research in parallel across different angles (UX, features, tech), then challengers stress-test the findings. Produces a proposal that feeds into real sprints.

→ [rallies/README.md](./rallies/README.md)

---

## Completed Rallies

| Rally | Date | Scope |
|-------|------|-------|
| [Rally 008 — Doc & Skill Redesign](./rallies/rally-008-doc-skill-redesign/) | 2026-04-01 | 11 module docs collapsed, 5 new skills, 7 archived |
| [Rally 006 — Pre-Launch Polish](./rallies/rally-006-prelaunch/) | 2026-04-02 | Bug sweep + polish — 18 items, all complete |
| [Rally 005 — Auth Resilience](./rallies/rally-005-auth-resilience/) | 2026-03-29 | Auth incident response — 12 fixes |
| [Rally 003 — Codebase Bugs](./rallies/rally-003-codebase-bugs/) | 2026-03-22 | Full codebase bug audit — 52 confirmed bugs |
| [Rally 001 — Full Audit](./rallies/rally-001-full-audit/) | 2026-03-16 | Full app, 6 agents, 2 rounds → fed Phase 1A |

---

## Completed Sprints

| Sprint | Phase | Summary |
|--------|-------|---------|
| Sprint 9 | Pre-1A | [Archive](./major/archive/) |
| Sprint 8 | Pre-1A | [Archive](./major/archive/) |
| Sprint 7 | Pre-1A | [Archive](./major/archive/) |
| Sprint 6 | Pre-1A | [Archive](./major/archive/) |
| Sprints 1–5 | Foundation | [Archive](./major/archive/) |

---

## How to Start a Sprint

**Major sprint** — create a folder under `major/` or inside the current phase folder, add a `README.md` using the template in `major/README.md`, and log it in the table above.

**Junior sprint** — go to the relevant type folder (`junior/debug/`, `junior/feature/`, or `junior/ui-ux/`), create a subfolder with a short slug (e.g. `debug-nav-crash/`), add a `README.md`, and log it in `junior/README.md`.

**Rally** — create a folder under `rallies/` with a numbered slug (e.g. `rally-002-perf-deep-dive/`), add a `README.md` using the template in `rallies/README.md`, and log it in the Completed Rallies table above when done.
