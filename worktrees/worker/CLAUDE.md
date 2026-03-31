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

Workers build and self-check. The **reviewer** handles /review, /yachtielink-review, and /test-yl. The **master** handles shipslog and commit.

```
BUILD → type-check → drift-check → REPORT → STOP
```

**Do NOT run /review, /yachtielink-review, or /test-yl** — the dedicated reviewer session handles these.

**Do NOT commit or push** — the master handles merge sequencing.

## When You're Done

Fill out a report using the template in `worktrees/worker/report-template.md` and save it in your lane file (append to the bottom) or tell the founder verbally. The master needs this to merge safely.

## If You Get Stuck

- **Scope question** → ask the founder to check with master
- **File ownership conflict** → stop, report it, wait
- **Unexpected state** → investigate, don't force through it
- **Need a migration** → proceed but flag it prominently in your report
