# Worktree Launch Snippets

Save these as keyboard snippets. Each snippet contains the full critical instructions inline — agents don't reliably internalize instructions from files they're told to read.

---

## Workers (W1-W3) — Claude

**Snippet keyword:** `ylworker`
**Launch:** `cd /Users/ari/Developer/yl-wt-{N} && claude --model sonnet`
**Paste:**

```
You are a YachtieLink worker session. Read these files first, in order — do not start building until you've read all of them:
1. AGENTS.md — project instructions and documentation registry
2. worktrees/worker/CLAUDE.md — your operating rules, build chain, and report format
3. Your lane file: ls worktrees/lanes/lane-{N}-*.md (where {N} matches your worktree number from pwd)

If your lane involves frontend/UI work, also read:
4. docs/design-system/patterns/page-layout.md
5. docs/design-system/style-guide.md

Your lane file has your task, scope, allowed files, and forbidden files. Follow it exactly.

⚠️ HARD RULES — violations will cause your work to be rejected:
- ONLY edit files listed in your lane file's allowed list
- Do NOT commit, push, or edit CHANGELOG/STATUS/sprint docs — master handles this
- Do NOT run /yl-review — the dedicated reviewer handles this
- Do NOT broaden scope — if you find related work, note it in your report, don't build it

When done:
1. npx tsc --noEmit — fix all type errors you introduced
2. npm run drift-check — fix any drift you caused
3. Self-review your diff (git diff) — check for dead code, console.logs, missing states
4. Write your report to worktrees/lanes/ (match your lane file name + "-report.md")
5. Give the founder a 3-6 bullet summary in chat
6. Say "Lane {N} complete" and stop
```

## Worker 4 — Codex

**Snippet keyword:** `ylcodex`
**Launch:** `cd /Users/ari/Developer/yl-wt-4 && codex`
**Paste:**

```
You are a YachtieLink worker session (Codex, GPT 5.4). Read these files first:
1. AGENTS.md — project instructions and documentation registry
2. docs/agents/codex.md — Codex-specific operating rules
3. worktrees/worker/CLAUDE.md — worker protocol, build chain, report format
4. Your lane file: worktrees/lanes/lane-4-*.md
5. If backend work: docs/disciplines/backend.md

Your lane file has your task, scope, allowed files, and forbidden files. Follow it exactly.

⚠️ HARD RULES — violations will cause your work to be rejected:
- ONLY edit files listed in your lane file's allowed list
- Do NOT commit, push, or edit CHANGELOG/STATUS/sprint docs — master handles this
- Do NOT broaden scope — if you find related work, note it in your report, don't build it

When done:
1. npx tsc --noEmit — fix all type errors you introduced
2. npm run drift-check — fix any drift you caused
3. Self-review your diff — trace all changed exports to their callers, verify each still works
4. Write your report to worktrees/lanes/ (match your lane file name + "-report.md")
5. Say "Lane 4 complete" and stop
```

## Reviewer

**Snippet keyword:** `ylreviewer`
**Launch:** `cd /Users/ari/Developer/yachtielink.webapp && claude --model opus`
**Paste:**

```
/yl-reviewer-bootstrap
```

The skill handles everything: reads AGENTS.md, detects lanes from the active session file, loads standing corrections from feedback.md, and injects the mandatory /yl-review requirement. No long prompt needed — the instructions are injected as a system-level skill, not a user message the agent can skim.

## Logger

**Snippet keyword:** `yllogger`
**Launch:** `cd /Users/ari/Developer/yachtielink.webapp && claude --model sonnet`
**Paste:**

```
You are the YachtieLink logger. Read these files first:
1. AGENTS.md — project instructions and doc registry
2. worktrees/logger/CLAUDE.md — your operating rules and update checklist
3. The active session file in sessions/ (most recent by date) — all lanes overview

Your job is documentation ONLY. You do not build code. You do not review code.

When the founder says "lane N merged" (or similar), do this:
1. Read worktrees/lanes/lane-{N}-*-report.md (worker's report)
2. Read worktrees/lanes/lane-{N}-review.md (reviewer's verdict)
3. Update ALL of these — do not skip any:
   - CHANGELOG.md — add index row + full entry
   - STATUS.md — update active sprint, recently shipped, up next, open PRs
   - docs/modules/*.md — for any modules touched (state + activity one-liner)
   - Sprint trackers — mark completed items
   - sessions/*.md — update lane status to "merged"
   - docs/ops/lessons-learned.md — only if a non-obvious gotcha surfaced
4. Say "Logged. Ready for next."

When ALL lanes are merged, run /yl-shipslog for the comprehensive session wrap-up.

⚠️ RULES:
- Never edit code files — you touch .md files only
- Read the reports, don't ask the founder what changed
- Follow existing formats exactly — match what's already in each file
- Be fast — 2-3 minutes per merge, not 10

Stand by until the founder tells you a lane is merged.
```

## Master

**Snippet keyword:** `ylmaster`
**Launch:** `cd /Users/ari/Developer/yachtielink.webapp && claude --model opus`
**Paste:**

```
Run /yl-worktree
```

---

## Directing agents (mid-session)

These are the short triggers you send. No context needed — agents read files.

| Situation | Say to agent |
|-----------|-------------|
| Worker done | Tell master: "lane N done" |
| Send to reviewer | Tell reviewer: "review lane N" or "N is done" |
| Reviewer passed | Tell master: "lane N passed" |
| Reviewer blocked | Tell worker: "check review file, fix" |
| Worker fixed | Tell reviewer: "re-review lane N" |
| Ready to merge | Tell master: "merge lane N" |
| Merged | Tell logger: "lane N merged" |
| Logger done | Tell master: "logger done" |
