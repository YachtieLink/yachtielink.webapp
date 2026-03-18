# Rallies

A rally is investigate-then-plan. Analyze a problem thoroughly, build a comprehensive strategy, then execute as sprints. No code changes during the rally — the output is a plan.

Every rally follows the same two-pass pattern, regardless of scale.

---

## The Two-Pass Pattern

This is the core of every rally:

**Pass 1 — Deep analysis.** Thorough investigation of the scope. Read the code, trace the flows, surface every issue. Don't rush to solutions — understand the problem fully first.

**Pass 2 — Challenge and refine.** Review pass 1 findings with fresh eyes. Push back on shallow conclusions, catch what was missed, question assumptions, find deeper structural issues hiding behind surface symptoms.

**Plan.** Built from both passes. Structured, prioritised, ready to execute as sprints.

The scale changes (one agent or six, one file or the whole app), but the two-pass discipline is always the same.

---

## Rally Types

Rallies scale to fit the problem:

### PR Rally
Analyze everything a PR touched — surface bugs, regressions, missed edge cases.
- **Scope:** One PR or a set of related changes
- **Pass 1:** Trace every file changed, check for regressions, edge cases, broken flows
- **Pass 2:** Re-examine with broader context — did the PR break anything upstream/downstream? Missed interactions?
- **Output:** A single plan doc with prioritised fixes
- **Example prompt:** "Bug fix the changes from the last PR — analyze everything touched and build a plan"

### System Rally
Deep-dive on one subsystem or concern. Auth flow, performance, data model, a specific feature area.
- **Scope:** One subsystem or cross-cutting concern
- **Pass 1:** Map the current state, identify problems, trace root causes
- **Pass 2:** Stress-test the findings — are these symptoms or root causes? What was overlooked?
- **Output:** Findings doc + action plan
- **Example prompt:** "Rally on performance — profile page is slow, figure out why and plan the fix"

### Full Audit
Multi-agent, multi-angle review of the whole app.
- **Scope:** Entire codebase
- **Pass 1:** Parallel agents, each assigned a different angle (e.g. UX/UI, features/value, performance/tech)
- **Pass 2:** Challenger agents review pass 1 findings, contradict shallow recommendations, surface deeper structural issues
- **Output:** Multiple agent reports + synthesized final proposal
- **Example prompt:** "Full audit — spin up agents for UX, features, and tech, then run challengers"

---

## How a Rally Works

1. **Founder defines the scope** — what to investigate and how deep to go
2. **Pass 1 — deep analysis** — thorough investigation, no shortcuts
3. **Pass 2 — challenge and refine** — review findings, push back, catch what was missed
4. **Build the plan** — structured, prioritised action plan from both passes
5. **Founder reviews** — nothing gets built until the founder signs off
6. **Execute as sprints** — findings become major sprint scope, junior sprint bugs, or both. Link resulting sprints back to the rally.

---

## Active Rallies

| Slug | Status | Scope |
|------|--------|-------|
| — | — | None active |

---

## Completed Rallies

| Slug | Date | Type | Scope | Proposal |
|------|------|------|-------|----------|
| [rally-001-full-audit](./rally-001-full-audit/) | 2026-03-16 | Full Audit | Full app, 6 agents, 2 rounds | [final_proposal.md](./rally-001-full-audit/final_proposal.md) |
| [rally-002-pr-example](./rally-002-pr-example/) | example | PR Rally | **Reference template** — example of a lightweight PR rally | [README.md](./rally-002-pr-example/README.md) |

---

## Rally Template

Create a subfolder like `rally-NNN-<short-slug>/` and add a `README.md`:

```markdown
# Rally: [Short description]

**Date:** YYYY-MM-DD
**Type:** PR Rally / System Rally / Full Audit
**Status:** 🔍 In Progress / ✅ Complete
**Scope:** What's being investigated

## Trigger
What prompted this rally (e.g. "PR #42 merged with regressions", "profile page load time >2s").

## Pass 1 — Deep Analysis
Findings from the first pass. For full audits, link to individual agent reports.

## Pass 2 — Challenge & Refine
What changed after the second look. What was wrong, shallow, or missing from pass 1.

## Plan
Prioritised list of what needs to happen, grouped by urgency. Built from both passes.

## Resulting Work
What sprints (major or junior) were created from this rally.
```
