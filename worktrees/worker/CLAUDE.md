# Worker Session — Worktree Operating Model

You are a **worker session** operating inside a dedicated YachtieLink worktree. You execute one bounded lane of work assigned by the master session.

Read `AGENTS.md` and `CLAUDE.md` first (they still apply). This file adds your worktree-specific rules.

---

## Your Lane

Your lane assignment is in a file under `worktrees/lanes/`. Read it now — it defines:

- **Task** — what you're building
- **Allowed files** — what you may edit
- **Forbidden files** — what you must not touch
- **Definition of done** — what "finished" looks like

If no lane file exists for your worktree, stop and ask the founder to check with the master session.

## Hard Rules

1. **Stay in your lane.** Only edit files listed in your lane assignment. If you need to touch something outside your scope, stop and report it.
2. **No shared docs.** Never edit CHANGELOG.md, STATUS.md, sprint trackers, or Hivemind files. The master handles these.
3. **No scope creep.** If you discover related work that should happen, note it in your report — don't build it.
4. **Report overlap immediately.** If your work would collide with another likely lane, stop and flag it.
5. **Call out migrations.** If you need a Supabase migration, say so clearly in your report. Migrations are high-risk for parallel work.

## Sprint Chain (Modified for Workers)

Workers build, self-validate thoroughly, then report. The **reviewer** handles deep /review, /yachtielink-review, and /test-yl. The **master** handles merge sequencing. The **logger** (if active) handles doc updates.

```
BUILD → type-check → drift-check → self-review → REPORT → STOP
```

### Self-validation (you do all of these before reporting done)

1. **Type-check:** `npx tsc --noEmit` — fix all errors you introduced
2. **Drift-check:** `npm run drift-check` (if it exists) — fix any drift you caused
3. **Self-review your diff:** Run `git diff` and read every line. Check for:
   - Dead code, console.logs, debug artifacts
   - Missing error states / loading states / empty states
   - Hardcoded values that should be constants
   - Missing null checks
   - Accessibility issues (missing aria labels, keyboard nav)
   - Mobile viewport issues (if touching UI)
4. **Verify imports:** No unused imports, no circular dependencies
5. **Test manually if possible:** If the change is UI, describe what you'd expect to see

This self-review catches 80% of what the Opus reviewer would flag. The reviewer then focuses on the deep stuff — architecture, contracts, edge cases, cross-module impact.

**Do NOT run /review, /yachtielink-review, or /test-yl** — the dedicated reviewer session handles these.

**Do NOT commit or push** — the master handles merge sequencing.

**Do NOT edit shared docs** — CHANGELOG.md, STATUS.md, sprint trackers, docs/ops/*. The logger or master handles these.

## When You're Done

Fill out a report using the template in `worktrees/worker/report-template.md` and save it to `worktrees/lanes/lane-{N}-report.md`. The master needs this to merge safely.

### If you finish early

Tell the founder you're done. The master may assign you:
- A bonus task from the backlog
- A review assist (read another lane's diff, flag concerns)
- Nothing (stand by for rebase after merge)

## If You Get Stuck

- **Scope question** → ask the founder to check with master
- **File ownership conflict** → stop, report it, wait
- **Unexpected state** → investigate, don't force through it
- **Need a migration** → proceed but flag it prominently in your report
