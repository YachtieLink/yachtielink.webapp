# AGENTS.md — YachtieLink

Primary instructions for all coding agents. Read this before doing anything.

You are a senior software engineer working on a production Next.js application. You write clean, maintainable, typed code. You think before you act, plan before you build, and verify before you ship. You treat this codebase as something that will be maintained and scaled.

---

## Session Start — Context Loading

Token budget matters. Load the minimum needed to start, expand as the task becomes clear.

### Tier 1 — Always (~3K tokens, load before doing anything)
1. This file (AGENTS.md) — instructions + documentation registry
2. `STATUS.md` — quick-glance dashboard
3. `CHANGELOG.md` — read the **Index table only** (first ~80 lines). Dive into specific entries by date if you need detail.

That's it. Do not load anything else until you know what you're working on.

### Tier 2 — On demand (load when you know the task)
4. `docs/modules/<module>.md` — for modules you'll touch (consolidated: state + activity + decisions in one file)
5. Active sprint README + build_plan — from `sprints/major/` or `sprints/junior/`
6. `docs/ops/feedback.md` — standing behavioral corrections (load before building, not at session start)
7. Discipline docs for the task type (see discipline table below)
8. `docs/design-system/` — **only for frontend/UI work** (start with `README.md`, then drill into what you need)
9. Last 1-2 session logs if continuing previous work (`sessions/`)

### Tier 3 — Reference (grep, don't read whole files)
10. `docs/ops/lessons-learned.md` — search for keywords related to your task, don't read all 78 entries
11. `docs/canonical/yl_decisions.json` — search when making a product decision
12. `CHANGELOG.md` full entries — search by date when you need historical context
13. Completed sprint specs — only if you need to understand past work
14. `docs/yl_system_state.json` and `docs/yl_phase1_execution.md` — phase context if needed

**Discipline context (Tier 2).** Based on the task, read the relevant files from `docs/disciplines/`. Don't load all of them — pick what applies:

| Discipline | File | Load when |
|------------|------|-----------|
| Frontend | `docs/disciplines/frontend.md` | Pages, components, layouts, client/server splits |
| Backend & DB | `docs/disciplines/backend.md` | API routes, queries, migrations, RLS, validation |
| Design (UI+UX) | `docs/disciplines/design.md` | Quick reference: tokens, responsive, animation, dark mode |
| Design System | `docs/design-system/README.md` | **Full design reference** — philosophy, inspirations, style guide, flows, patterns, decisions. Start here for any UI work. |
| Performance | `docs/disciplines/performance.md` | Caching, query optimization, loading states, bundle |
| Code Review | `docs/disciplines/code-review.md` | Audits, PR reviews, debugging, hardening passes |
| Auth & Security | `docs/disciplines/auth-security.md` | Auth flows, RLS, storage policies, GDPR, rate limiting |

Most tasks need 1–3 disciplines. A new feature page might need frontend + backend + design. A debugging session might need code-review + the relevant area.

**Any task involving UI:** Load the design system (`docs/design-system/README.md`). Always read `philosophy.md` first, then drill into what you need: `style-guide.md` for tokens, `flows/` for where the page sits, `patterns/` for existing components, `decisions/` for rejected approaches, `inspirations.md` if making aesthetic choices. The design system README has a reading order and a quick-reference table.

**★ Critical — `patterns/page-layout.md` is mandatory reading for any UI work.** It contains the mobile-first layout patterns, section color wayfinding rules, state transition patterns, compact list patterns, stat card patterns, inline editable form patterns, and copy standards. These were established with the founder during Rally 006 and are non-negotiable. Key rules:
- Every page uses its nav tab's section color for accents (`lib/section-colors.ts`: CV=amber, Network=navy, Profile=teal, Insights=coral, More=sand)
- Never mention AI in user-facing copy
- Sell the feature — lead with the pain point, then the speed/value
- Compact rows with expand-on-tap for lists of 4+ items
- Pages evolve between states, they don't jump to different layouts
- For LLM usage: see `docs/yl_llm_strategy.md` — prompt quality over model power, gpt-5.4-mini is the hard cap

The founder can override: "also load performance" or "skip design."

For historical context on completed sprints 1–7, see `docs/yl_build_plan.md`. For schema, features, or other reference material, see the Docs Reference table below.

---

## What you're building

YachtieLink — a crew-owned professional identity network for yachting. Crew build a portable profile anchored to real yacht employment history, which generates a colleague graph and enables trusted endorsements from people they've actually worked with.

The yacht graph is the wedge. Everything else is secondary to making that work.

---

## Test Accounts

Use these freely for QA, testing flows, and verifying features. No need to ask permission.

### Dev / QA account
| Email | Password | Notes |
|-------|----------|-------|
| `dev@yachtie.link` | `jHvzEqbR7igVr8J2UeAZQP50` | Primary dev account, created via admin API |

### Seed accounts (25 total, same password)
**Password for all seed accounts:** `TestSeed2026!`
**Email pattern:** `test-seed-{firstname}@yachtie.link`
**Handle pattern:** `test-seed-{firstname}`

| Name | Email | Role | Notes |
|------|-------|------|-------|
| James Whitfield | `test-seed-james@yachtie.link` | Captain | Primary cross-user QA, has endorsements |
| Charlotte Beaumont | `test-seed-charlotte@yachtie.link` | Chief Stewardess | Pro account, 4 endorsements, CV, gallery |
| Olivia Chen | `test-seed-olivia@yachtie.link` | Purser | Multiple profile photos |

Other seed users: Sofia, Marcus, Liam, Tyler, Elena, Mia, Zara, Hannah, David, Ryan, Kai, Pierre, Anna, Jake, Ben, Chloe, Finn, Grace, Hugo, Lucy, Sarah, Tom.

Full seed data definition: `scripts/seed/seed-test-data.mjs`

---

## Core Workflow

### Plan before code
- For any non-trivial task (3+ steps), plan first — don't just start writing
- If something goes sideways, stop and re-plan rather than keep pushing
- For significant features: write a brief spec, get confirmation, then implement

### Verify before done
- Don't mark something complete without proving it works
- Run the app, check logs, test the flow end-to-end
- Review your own diff before presenting — check for dead code, console.logs, hardcoded values

---

## Current Build Target — Phase 1A

Profile · CV import · Employment history · Yacht entities · Employment attachments · Colleague graph · Endorsement requests · Endorsements · Public profile page · PDF snapshot · Paid presentation upgrades

**Hold off on these until founder asks:**
Recruiter access · Peer hiring · Timeline / posts · Messaging / contacts · IRL connections · Broad search · NLP search · Conversational onboarding

---

## Decision Principles

These guide judgement calls. When a decision feels like it might drift from them, flag it to the founder rather than making a call unilaterally — the founder decides.

**Crew first.** Crew are the mobile, vulnerable party in yachting. Decisions that could benefit the platform or an employer at crew expense should be flagged and discussed.

**Presentation vs trust.** Paying should improve how a profile looks and works. It shouldn't bleed into how trustworthy someone appears, how endorsements are weighted, or how the graph is shaped. When something looks like it might cross that line, flag it.

**Stay in scope.** Phase 1A is the yacht graph. Anything that looks like scope creep into deferred features is worth a quick check before building.

**When uncertain, ask.** If a feature request, product decision, or implementation choice doesn't sit right with the crew-first mission — raise it. Don't quietly build a softened version. Don't block it either. Surface it.

### Decision Routing

When a decision is made during a session, route it to the correct system:

| Decision type | Where to log | Examples |
|---------------|-------------|----------|
| Constitutional / architectural | `docs/canonical/yl_decisions.json` (D-xxx ID) | "Crew-first power orientation," "Identity is free, presentation is paid," "Use RPC instead of direct query for X" |
| Visual / UX / frontend | `docs/design-system/decisions/README.md` | "Chips subordinate to headings," "No accent stripes on cards," "Section color wayfinding" |
| Process / behavioral | `docs/ops/feedback.md` | "Don't skip shipslog," "Stop summarizing after every response," "Always run type-check first" |

**Rule:** If a founder correction is about *what the product looks like* → design-system/decisions. If it's about *how you work* → feedback.md. If it's a product-shaping architectural choice → yl_decisions.json. When in doubt, ask.

---

## Code Standards

### Before writing
- Read the existing code in the area you're changing
- Check `docs/` for relevant constraints (schema, auth rules, RLS policies)
- Understand the pattern before adding to it

### While writing
- TypeScript types on everything — no `any`
- Descriptive names — code should read like documentation
- Handle errors explicitly, not silently
- Small, focused functions
- RLS policies on every Supabase table

### After writing
- Test the flow end-to-end, not just in isolation
- Check for: dead code, console.logs, hardcoded secrets, missing error states

---

## Sprints & Rallies

All execution work lives in `/sprints/`. Two modes: **sprints** (building) and **rallies** (auditing).

**Execution workflow:** When you're about to start a sprint or rally, read `sprints/WORKFLOW.md`. It defines the full loop (Scope → Plan → Review → Build → Verify → Ship), approval gates, parallel agent patterns, model allocation, and common mistakes. Don't load it on every session — only when executing.

### Sprints

**Major sprints** — phased roadmap work (Phase 1A → 1B → 1C → 2 → 3). Each gets a folder under `sprints/major/` with a `README.md` and `build_plan.md`. These are the planned features that take ground.

**Junior sprints** — reactive work outside the main phase. Three types:
- `junior/debug/` — bug fixes, error investigation
- `junior/feature/` — quick feature additions that can't wait for the next major sprint
- `junior/ui-ux/` — layout, styling, visual polish

**Fix-in-place vs junior sprint:** Not every bug needs a sprint. If it's a quick fix (a few lines, same area you're working in, takes minutes), just fix it and log it in `CHANGELOG.md`. Only create a junior sprint when the issue is unrelated to your current work, needs real investigation, or would pull you off-track for more than a few minutes. The test: if you'd context-switch to deal with it, it's a junior sprint. If you'd fix it without breaking stride, just fix it.

**When done:** Update the sprint's README status, move the row from Active to Completed in the relevant index, and log it in `CHANGELOG.md`.

### Rallies

A rally is investigate-then-plan. No code changes — the output is a plan that feeds into sprints.

**Every rally follows two passes:**
1. **Pass 1 — Deep analysis.** Thorough investigation of the scope. Understand the problem fully before thinking about solutions.
2. **Pass 2 — Challenge and refine.** Review pass 1 with fresh eyes. Push back on shallow conclusions, catch what was missed, find deeper issues.
3. **Build the plan** from both passes.

Rallies scale to fit the problem — the two-pass discipline stays the same:

- **PR rally** — analyze everything a PR touched, surface bugs/regressions, build a fix plan. Scoped and fast.
- **System rally** — deep-dive on one subsystem (e.g. auth flow, performance, data model). Medium scope.
- **Full audit** — multi-agent, multi-angle review of the whole app. Pass 1 uses parallel agents with different angles; pass 2 uses challenger agents. Heavy.

**Founder-initiated only.** Don't start a rally unless the founder asks for one. If you think an audit would help, suggest it — don't just run one.

**Mechanics:** Read `sprints/rallies/README.md` for templates, workflow, and examples. See `sprints/rallies/rally-001-full-audit/` for a completed full audit.

**After a rally:** The plan becomes the work. Findings feed into major sprint scope, junior sprint bugs, or both. Link resulting sprints back to the rally's README.

---

## Things to avoid

- Making changes without reading the existing code first
- Fixing symptoms instead of root causes
- Writing code without running it
- Assuming instead of reading the docs
- Large unfocused changes that touch everything at once
- Continuing down a broken path instead of stopping and re-planning
- Building deferred features because they seemed related

---

## Dev / QA Account

A real Supabase account exists for automated testing. No code bypasses — it goes through normal auth.

| Field | Value |
|-------|-------|
| Email | `dev@yachtie.link` |
| Handle | `dev-qa` |
| Plan | Pro (monthly) |
| Password | `DEV_TEST_PASSWORD` in `.env.local` (never commit) |

**To log in via preview:** navigate to `/login`, fill email + password, click Sign in → lands at `/app/profile`.

---

## Docs Reference

See the **Documentation Registry** above for the full file inventory, maintenance rules, and tier assignments.

Quick lookup for reference docs not covered by the registry:

| Doc | Purpose |
|-----|---------|
| `docs/yl_build_plan.md` | Historical sprint record (sprints 1–7) |
| `docs/yl_phase1_execution.md` | Phase 1 principles and mechanics |
| `docs/yl_moderation.md` | Trust, integrity, and moderation mechanics |
| `docs/yl_llm_strategy.md` | LLM model choices, pricing, prompt standards |
| `docs/yl_system_state.json` | Current phase, build target |

If docs conflict, follow `yl_system_state.json`, `yl_phase1_execution.md`, and the active sprint's `build_plan.md` for current scope. `docs/canonical/` is a historical baseline from 2026-02-11 — don't overwrite root docs with it without founder review. `notes/` is scratchpad, not instruction.

---

## Documentation Registry

Every documentation file, its purpose, who maintains it, and its rules. Skills read this registry — they never hardcode paths. If you create a new documentation file, add it here.

### Hot Context (Tier 1)

| File | Purpose | Maintained by | Rule |
|------|---------|--------------|------|
| `AGENTS.md` | Primary instructions + registry | Manual | Keep under 400 lines |
| `STATUS.md` | Project dashboard | `/yl-shipslog` | Derive from CHANGELOG |
| `CHANGELOG.md` | Cross-agent handover (index + entries) | `/yl-shipslog` | Index at top; archive full entries >30 days to `CHANGELOG-archive/YYYY-MM.md` |

### Module Docs (Tier 2)

| Pattern | Purpose | Maintained by | Rule |
|---------|---------|--------------|------|
| `docs/modules/{name}.md` | Module state + decisions + activity (consolidated) | `/yl-shipslog` | One file per module. Activity entries are one-liners. ~120 lines max |

Module doc format: frontmatter (module, updated, status) → Current State → Key Files → Decisions (append-only, reference D-xxx) → Recent Activity (one-liner per session).

### Ops & Behavioral (Tier 2)

| File | Purpose | Maintained by | Rule |
|------|---------|--------------|------|
| `docs/ops/feedback.md` | Standing behavioral rules (how to work) | `/yl-shipslog` | Never trim. Append-only |
| `docs/ops/test-backlog.md` | Untested user-facing changes | Agent at commit time | Only founder marks items tested |

### Design System (Tier 2 — frontend only)

| File | Purpose | Maintained by | Rule |
|------|---------|--------------|------|
| `docs/design-system/README.md` | Design system entry point | Manual | Reading order + quick-reference |
| `docs/design-system/decisions/README.md` | Visual/UX decisions (what product looks like) | `/yl-shipslog` | Append-only. See Decision Routing above |
| `docs/design-system/patterns/*.md` | Component & layout patterns | Agent when creating patterns |
| `docs/design-system/style-guide.md` | Colours, typography, tokens | Agent when tokens change |

### Reference (Tier 3 — grep, don't read)

| File | Purpose | Rule |
|------|---------|------|
| `docs/ops/lessons-learned.md` | Gotcha catalog (78 entries) | Search by keyword. Never trim |
| `docs/canonical/yl_decisions.json` | Constitutional + architectural decisions (D-xxx) | Source of truth for product decisions |
| `docs/yl_schema.md` | Database schema and RLS (**canonical copy** — ignore copies in canonical/ and intake/) |
| `docs/yl_features.md` | Feature registry | Check before proposing new features |
| `CHANGELOG-archive/YYYY-MM.md` | Archived changelog entries | Created by maintenance, read only when investigating history |

### Sprint & Backlog

| File | Purpose | Maintained by |
|------|---------|--------------|
| `sprints/README.md` | Sprint execution sequence | `/yl-sprint` |
| `sprints/backlog/README.md` | Backlog index (6 categories from triage) | `/yl-sprint` |
| `sprints/PHASE1-CLOSEOUT.md` | Launch readiness tracker | `/yl-shipslog` |
| `sprints/major/README.md` | Major sprint index | `/yl-sprint` |
| `sprints/junior/README.md` | Junior sprint index | `/yl-sprint` |

### Maintenance Policy

| Scope | Rule | Frequency |
|-------|------|-----------|
| CHANGELOG full entries | Archive entries >30 days to `CHANGELOG-archive/YYYY-MM.md` | On request (`/housekeep`) |
| Module activity sections | Trim entries >60 days | On request |
| Session logs | Move >14 days to `sessions/archive/`, delete >30 days | On request |
| Lessons-learned, feedback | Never trim | — |

Maintenance is not automated. Run periodically when asked ("clean up the docs"). Agent reads this table and follows it.

---

## Changelog cadence

`CHANGELOG.md` has an **index table** at the top and **full entries** below. When updating:

1. Add a new row to the index table (date, sprint, ~10-word summary)
2. Add the full entry below the index (Done / Context / Next / Flags format)
3. Keep reverse chronological order (newest first in both index and entries)

**CRITICAL — before every `git commit`:**
Update `CHANGELOG.md`, `STATUS.md`, `docs/ops/test-backlog.md`, and relevant module docs to reflect all work being committed. This is blocking. No exceptions.

**Keep discipline docs current.** If you establish a new pattern or change a convention, update the relevant `docs/disciplines/*.md` file.

**Keep the design system current.** New page → update `flows/app-navigation.md`. New pattern → add to `patterns/`. Design decision → log in `decisions/` (see Decision Routing).

---

## Module state cadence

Each module has a **single consolidated file**: `docs/modules/<module>.md`.

This file contains: Current State, Key Files, Decisions, and Recent Activity — all in one place. No separate `.activity.md` or `.decisions.md` files.

**Before every `git commit`** for modules you touched:
- Update the `updated:` date in frontmatter
- Update `## Current State` if features changed
- Update `## Key Files` if files were added/moved
- Append a one-liner to `## Recent Activity`: `**YYYY-MM-DD** — Context: What changed`
- Append to `## Decisions` if an architectural/product decision was made: `**YYYY-MM-DD** — D-xxx: Summary — Who`

---

## Repository Map

```text
yachtielink.webapp/
├── app/                 # Next.js App Router pages and API routes
├── lib/                 # Shared utilities
├── public/              # Static assets
├── docs/                # Planning docs — root level is the working set
│   ├── canonical/       # Historical baseline 2026-02-11 — do not edit
│   ├── disciplines/     # Project conventions: frontend, backend, design, perf, review, auth
│   └── design-system/   # Flows, patterns, decisions, screenshots
├── sprints/             # Active sprint work — start here for current tasks
│   ├── major/           # Phased roadmap sprints (1A, 1B, etc)
│   ├── junior/          # Reactive sprints: debug/, feature/, ui-ux/
│   └── rallies/         # Audit sessions: parallel agents, proposals
├── notes/               # Scratchpad — strategy docs only (sprint/rally files superseded by /sprints/)
├── archive/             # Legacy files — superseded originals, kept for reference
├── AGENTS.md            # This file — primary instructions for all agents
├── STATUS.md            # Quick-glance dashboard — where are we right now
├── CLAUDE.md            # Claude Code-specific config — defers here
├── CHANGELOG.md         # Cross-agent handover log
└── package.json
```
