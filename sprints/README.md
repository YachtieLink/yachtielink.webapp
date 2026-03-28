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
| 1 | [Sprint 10.1](./major/phase-1a/sprint-10.1/README.md) | 1A | 📋 Ready | Phase 1A closeout — dark mode, animations, public layout, missing pages |
| 2 | [CV Parse Bugfix](./major/phase-1b/sprint-cv-parse-bugfix/README.md) | 1B | 📋 Ready | Fix 37 QA bugs in 5 waves — data integrity, public profile, wizard, profile page, network |
| 3 | [Sprint 11](./major/phase-1b/sprint-11/README.md) | 1B | 🔧 In Progress | Public Profile Rewrite — profile mode fixes, schema foundation, editorial layout |
| 4 | [Sprint 12](./major/phase-1b/sprint-12/README.md) | 1B | 📋 Ready | Yacht graph foundation — yacht detail, colleagues, sea time, transfer flow |
| 5 | [Sprint 13](./major/phase-1b/sprint-13/README.md) | 1B | 📋 Ready | Launch polish — public layout, marketing page, production ops, legal sign-off |

**Next action:** Sprint 11a overnight build in progress (2026-03-28)

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
