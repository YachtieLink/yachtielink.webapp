# Major Sprints

Major sprints are the planned, phased work that builds the core YachtieLink product. Each one takes ground — new features, new infrastructure, new capabilities.

---

## Phase Map

```
Phase 1A  →  Profile robustness, photo-forward UX, CV parsing polish
Phase 1B  →  Public polish, yacht graph, launch readiness
Phase 1C  →  Availability, crew search, AI pack 1, graph integrity (DRAFT)
Phase 2   →  Peer hiring, recruiter access, agency plans, NLP search (DRAFT)
Phase 3   →  Messaging, notifications, multilingual, timeline, IRL connections (DRAFT)
Phase 4   →  AI career tools, advanced AI, verified status, community moderation (DRAFT)
```

---

## Sprint Template

When creating a new major sprint folder, add a `README.md` with this structure:

```markdown
# Sprint [N] — [Name]

**Phase:** 1A / 1B / etc
**Status:** Planned / In Progress / Complete
**Started:** YYYY-MM-DD
**Completed:** YYYY-MM-DD (or —)

## Goal
One sentence: what does this sprint achieve?

## Scope
What's in. What's explicitly out.

## Key Files
- build_plan.md — full implementation spec
- [any other docs]

## Exit Criteria
How do we know this sprint is done?

## Notes
Anything worth capturing for next time.
```

### Build Plan Quality Checklist

Before marking a major sprint as **ready for execution**, verify its build plan passes these checks. These exist because past sprints drifted — agents completed builds that passed `tsc` but missed half the intended changes.

**1. Every file is named.**
- No "12+ files" — list every file path that will be created or modified.
- Use `find` or `glob` to enumerate *before* writing the spec, not during execution.

**2. Exit criteria are runnable commands, not prose.**
- Bad: "All cards use rounded-2xl"
- Good: `grep -rn 'rounded-lg' app/ --include='*.tsx' | grep -v components/` → expected: zero results
- Include the expected output. If a human can't copy-paste it and verify, it's not a real criterion.

**3. One source of truth.**
- The build plan is ONE file (or README + one `build_plan.md`). Review fixes get merged back in, not left as separate documents.
- If a review contradicts the plan, update the plan. Don't leave both versions alive.

**4. New components get full specs.**
- Interface definition (props + types)
- Implementation code (or enough detail that an agent doesn't have to design it)
- If two components at the same detail level differ by 5x in spec length, the short one is underspecified.

**5. Contradictions are resolved, not noted.**
- If the README says X and the build plan says Y, pick one and update both.
- Search for the same value (e.g., page title size) across all sprint documents — it must be consistent.

**6. Schema/API changes are flagged.**
- If the sprint adds a new DB column, user preference, or API endpoint, say so explicitly and confirm whether a migration is needed.
- "No migration needed because X" is a valid answer. Silence is not.

**7. Scope boundary for automated checks is defined.**
- "Zero raw `<button>` in page files" — what counts as a "page file"? `app/**/*.tsx` excluding `components/`? Say it.
- Grep commands should include the `--include` and exclusion patterns.

---

## Active Phases

- [Phase 1A](./phase-1a/README.md) — Profile robustness (Sprint 10 + 10.1) — In Progress
- [Phase 1B](./phase-1b/README.md) — Public polish, yacht graph & launch (Sprints 11–13) — Draft, build plans written

## Planned Phases (Ralph Loop Drafts — 2026-03-22)

- [Phase 1C](./phase-1c/README.md) — Availability, search, AI pack 1, graph integrity (Sprints 14–17) — Draft, build plans written + reviewed
- [Phase 2](./phase-2/README.md) — Peer hiring, recruiter access, agency plans, NLP search (Sprints 18–20) — Draft, build plans written + reviewed
- [Phase 3](./phase-3/README.md) — Messaging, notifications, multilingual, timeline, IRL connections (Sprints 21–23) — Draft, build plans not yet written
- [Phase 4](./phase-4/README.md) — AI career tools, advanced AI, verified status, community moderation (Sprints 24–26) — Draft, build plans not yet written

## Archive

Completed sprints → [archive/](./archive/)
