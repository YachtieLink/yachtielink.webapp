# Ralph Loop — Sprint Planning Automation

> **What this is:** A self-directing prompt for Claude Code's `/loop` command that sequentially plans all remaining sprints (14–26) across Phases 1C, 2, 3, and 4. Each iteration writes one file, reading the preceding sprint(s) first so every plan builds on what came before.
>
> **How to run:** Paste the prompt below into Claude Code, then run `/loop 5m`. Takes ~85 minutes (17 files at ~5 min each). Go to sleep.
>
> **What it produces:** Phase READMEs + sprint READMEs with scope, deliverables, dependencies, and exit criteria. These are PLANNING documents — not build specs. Once the founder reviews and approves a sprint plan, a separate session hardens it into a full `build_plan.md` with migration SQL, component specs, API routes, and success criteria.

---

## Status Tracker

Check progress by running: `ls sprints/major/phase-*/sprint-*/README.md sprints/major/phase-*/README.md`

| # | File | Status |
|---|------|--------|
| 1 | `phase-1c/README.md` | |
| 2 | `phase-1c/sprint-14/README.md` | |
| 3 | `phase-1c/sprint-15/README.md` | |
| 4 | `phase-1c/sprint-16/README.md` | |
| 5 | `phase-1c/sprint-17/README.md` | |
| 6 | `phase-2/README.md` | |
| 7 | `phase-2/sprint-18/README.md` | |
| 8 | `phase-2/sprint-19/README.md` | |
| 9 | `phase-2/sprint-20/README.md` | |
| 10 | `phase-3/README.md` | |
| 11 | `phase-3/sprint-21/README.md` | |
| 12 | `phase-3/sprint-22/README.md` | |
| 13 | `phase-3/sprint-23/README.md` | |
| 14 | `phase-4/README.md` | |
| 15 | `phase-4/sprint-24/README.md` | |
| 16 | `phase-4/sprint-25/README.md` | |
| 17 | `phase-4/sprint-26/README.md` | |

---

## The Prompt

```
You are planning sprints for YachtieLink, a crew-owned professional identity network for yachting. Each sprint must build on the one before it — understanding what infrastructure was created, what patterns were established, what was deferred, and what the previous sprint's "Next" section recommended.

**Step 1: Orient yourself.**
Read these foundational files (skim if you've read them before):
- `AGENTS.md` — project principles, decision framework
- `docs/yl_features.md` — full feature registry (ALL sections including AI)
- `docs/yl_decisions.json` — product decisions (reference D-XXX numbers)
- `docs/yl_phase1_execution.md` — phase structure and gates

**Step 2: Check progress.**
Use Glob on `sprints/major/phase-*/sprint-*/README.md` and `sprints/major/phase-*/README.md` to see what's already written.

Find the FIRST missing file in this sequence:
1. phase-1c/README.md → sprint-14 → sprint-15 → sprint-16 → sprint-17
2. phase-2/README.md → sprint-18 → sprint-19 → sprint-20
3. phase-3/README.md → sprint-21 → sprint-22 → sprint-23
4. phase-4/README.md → sprint-24 → sprint-25 → sprint-26

If everything exists, report "All sprint plans complete" and stop.

**Step 3: Read what came before.**
Before writing the next file, read the 2 PRECEDING sprint READMEs (or phase README + last sprint of prior phase if crossing a phase boundary). Understand:
- What was built — features, components, infrastructure, database changes
- What patterns were established — UI patterns, data fetching patterns, API conventions
- What was explicitly deferred — items pushed to "next sprint" or "future"
- What dependencies the next sprint inherits
- What the exit criteria were — the next sprint's starting state

For the first sprint in each phase, also read the phase README of the PREVIOUS phase to understand the transition.

The chain of preceding context:
- Sprint 14 builds on: Sprint 12 (yacht graph) + Sprint 13 (launch/marketing)
- Sprint 15 builds on: Sprint 14 (availability, endorsement signals)
- Sprint 16 builds on: Sprint 15 (crew search, analytics)
- Sprint 17 builds on: Sprint 16 (AI infrastructure)
- Sprint 18 builds on: Sprint 17 (graph integrity) — new phase, read Phase 1C README
- Sprint 19 builds on: Sprint 18 (peer hiring patterns)
- Sprint 20 builds on: Sprint 19 (recruiter infrastructure)
- Sprint 21 builds on: Sprint 20 (recruiter/search) — new phase, read Phase 2 README
- Sprint 22 builds on: Sprint 21 (messaging infrastructure)
- Sprint 23 builds on: Sprint 22 (notification system, multilingual)
- Sprint 24 builds on: Sprint 23 (community features) — new phase, read Phase 3 README
- Sprint 25 builds on: Sprint 24 (AI career tools infrastructure)
- Sprint 26 builds on: Sprint 25 (advanced AI patterns)

**Step 4: Write the file.**

If writing a PHASE README, include:
- Phase theme and thesis (why this phase exists, what gate must be met to enter it)
- Sprint table with status
- What the previous phase delivered (starting state)
- Phase exit criteria
- Key decisions that govern this phase (reference D-XXX)

If writing a SPRINT README, use this exact format:

---

# Sprint [N] — [Title]

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** [phase]
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint [N-1] ([what it delivered])

## Goal

[2-3 sentences: what this sprint accomplishes and WHY it matters at this stage of the product. Reference what the preceding sprint set up that makes this possible.]

## Scope

**In:**
- [specific features with details from yl_features.md]
- [note what preceding sprint infrastructure this reuses]

**Out:**
- [what's explicitly excluded and why]
- [what's deferred to a later sprint — name which one]

## Dependencies

- [specific sprint numbers and what they must have delivered]
- [external requirements: APIs, credentials, legal, etc.]

## Key Deliverables

### [Area 1]
- ⬜ [specific deliverable — name components, pages, tables, RPCs]
- ⬜ [note reuse from prior sprints where applicable]

### [Area 2]
- ⬜ ...

## Exit Criteria

- [testable statements]
- [reference the graph-is-the-navigation principle where relevant]

## Estimated Effort

[X–Y days]

## Notes

[Context, key decisions (reference D-XXX), what was considered but excluded, what the NEXT sprint should pick up. Call out the hardest technical challenge.]

**Next sprint picks up:** [1-2 sentences on what Sprint N+1 should build on from this sprint's output]

---

Sprint mapping:

**Phase 1C — Post-Launch Crew Features** (gate: graph loop healthy, 500+ profiles)
- 14: Availability Toggle + Endorsement Signals
- 15: Crew Search (Pro) + Expanded Analytics
- 16: AI Pack 1 (endorsement writer AI-04, cert OCR AI-02, multilingual requests AI-03, profile suggestions AI-17)
- 17: Attachment Confirmation + Smart Yacht Autocomplete (AI-11)

**Phase 2 — Hiring & Revenue** (gate: 10K+ crew, recruiter demand confirmed)
- 18: Peer Hiring (crew-to-crew, graph-adjacent, D-022/D-023)
- 19: Recruiter Access (EUR 29/mo + credits, crew opt-in, D-024/D-025/D-026)
- 20: Agency Plans + NLP Search (multi-seat, AI-07 semantic search)

**Phase 3 — Communication & Social**
- 21: Messaging & Contacts (DMs, contacts ≠ graph edges per D-029)
- 22: Notifications + Multilingual (push, AI-10 profile translation)
- 23: Timeline & Community (chronological D-031, network-bounded D-030, IRL connections)

**Phase 4 — Intelligence & Scale**
- 24: AI Career Tools (AI-05 cert intelligence, AI-06 season readiness, AI-09 portfolio advisor, AI-12 gap analyzer)
- 25: Advanced AI (AI-14 voice onboarding, AI-18 photo coach, AI-19 cover letter, AI-20 interview prep)
- 26: Verified Status + Community Moderation (earned verification, moderation delegation, AI-21 sentiment analysis)

Key principles for ALL plans:
- Crew first. Paid improves convenience, never trust.
- The graph is the navigation — click through profiles ↔ yachts ↔ crew endlessly. No dead ends. Every new feature must preserve this.
- Reference specific decisions (D-XXX). Don't violate them. If tension exists, note it.
- Be concrete: name actual components, pages, database tables, RPCs. Don't be vague.
- Note what infrastructure from prior sprints gets reused vs what's new.
- Call out the hardest technical challenge in each sprint.
- "Next sprint picks up" section is critical — this is what makes the chain work.

Write ONE file per iteration. Report what you wrote and what's next.
```

---

## After the Loop Completes

1. **Founder reviews** all 17 files, adjusts scope, re-sequences if needed
2. **For each sprint ready to build:** a new Claude Code session reads the sprint README + preceding sprint's build_plan.md and hardens it into a full `build_plan.md` (same process used for Sprint 12 and 13 — subagent review, founder feedback, iteration)
3. **Build specs are NOT written during the ralph loop** — planning and implementation specs are separate passes
