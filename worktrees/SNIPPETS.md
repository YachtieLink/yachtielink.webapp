# Worktree Launch Snippets

Save these as keyboard snippets. Same command every time — agents read their instructions from files.

---

## Workers (W1-W3) — Claude

**Snippet keyword:** `ylworker`
**Launch:** `cd /Users/ari/Developer/yl-wt-{N} && claude --model sonnet`
**Paste:**

```
Go. Read worktrees/worker/CLAUDE.md for your instructions.
```

## Worker 4 — Codex

**Snippet keyword:** `ylcodex`
**Launch:** `cd /Users/ari/Developer/yl-wt-4 && codex`
**Paste:**

```
Go. Read docs/agents/codex.md then worktrees/worker/CLAUDE.md for your instructions.
```

## Reviewer

**Snippet keyword:** `ylreviewer`
**Launch:** `cd /Users/ari/Developer/yachtielink.webapp && claude --model opus`
**Paste:**

```
Go. Read worktrees/reviewer/CLAUDE.md for your instructions.
```

## Logger

**Snippet keyword:** `yllogger`
**Launch:** `cd /Users/ari/Developer/yachtielink.webapp && claude --model sonnet`
**Paste:**

```
Go. Read worktrees/logger/CLAUDE.md for your instructions.
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
| Send to reviewer | Tell reviewer: "review lane N" |
| Reviewer passed | Tell master: "lane N passed" |
| Reviewer blocked | Tell worker: "check review file, fix" |
| Worker fixed | Tell reviewer: "re-review lane N" |
| Ready to merge | Tell master: "merge lane N" |
| Merged | Tell logger: "lane N merged" |
| Logger done | Tell master: "logger done" |
