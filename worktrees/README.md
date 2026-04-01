# Worktree Operating Model

Run parallel Claude Code sessions on isolated branches to compress sprint work.

**Model:** 1 master (Opus) + 1 reviewer (Opus) + 2-3 workers (Sonnet/Opus) + 1 Codex worker (optional, correctness lanes) + 1 logger (Sonnet, optional).

**Quick launch:** Run `/yl-worktree` in any Claude Code session to bootstrap everything.

---

## Communication Protocol

**Docs are the communication layer.** Agents read/write files — the founder relays short triggers, not content.

| Agent produces | File location | Who reads it |
|---------------|---------------|-------------|
| Lane assignment | `worktrees/lanes/lane-N-slug.md` | Worker, Reviewer |
| Completion report | `worktrees/lanes/lane-N-report.md` | Reviewer, Logger, Master |
| Review verdict | `worktrees/lanes/lane-N-review.md` | Master, Worker (if blocked), Logger |
| Session plan | `sessions/YYYY-MM-DD-slug.md` | All agents |
| Canonical docs | `CHANGELOG.md`, `STATUS.md`, module docs | Next session |

**What the founder says to each terminal:**

| Trigger | Example | What the agent does |
|---------|---------|-------------------|
| Worker done | "lane 1 complete" | → Tell reviewer: "review lane 1" |
| Review done | "lane 1 passed" / "lane 1 blocked" | → Tell master to merge, or tell worker to check review file |
| Merge done | "lane 1 merged" | → Tell logger: "lane 1 merged" |
| Reassign | "lane 1 worker: do X next" | → Worker reads new lane file |

**No pasting reports between terminals.** Each agent reads the files directly. The founder's role is timing and decisions, not relay.

---

## Desktop Layout

You need 5 things visible. Recommended: iTerm2 with tabs/splits + one Chrome window.

```
┌──────────────────────────────────────────────────────────────────────┐
│  iTerm2                                                              │
│  ┌────────┬──────────┬──────────┬──────────┬──────────┬────────────┐ │
│  │ Master │ Reviewer │ Worker 1 │ Worker 2 │ Worker 3 │ W4 (Codex) │ │
│  │ (Opus) │ (Opus)   │ (Sonnet) │ (Sonnet) │ (S/O)    │ (GPT 5.4)  │ │
│  │ Tab 1  │ Tab 2    │ Tab 3    │ Tab 4    │ Tab 5    │ Tab 6      │ │
│  └────────┴──────────┴──────────┴──────────┴──────────┴────────────┘ │
│  Tab 7: Logger (Sonnet, optional)                                    │
├──────────────────────────────────────────────────────────────────────┤
│  Chrome — localhost:3000 (reviewer uses this for QA)                 │
└──────────────────────────────────────────────────────────────────────┘
```

| Tab | Directory | Model | Role |
|-----|-----------|-------|------|
| 1 | `/Users/ari/Developer/yachtielink.webapp` | **Opus** | Master — plan lanes, orchestrate, merge |
| 2 | `/Users/ari/Developer/yachtielink.webapp` | **Opus** | Reviewer — /yl-review (unified 6-phase gate) |
| 3 | `/Users/ari/Developer/yl-wt-1` | **Sonnet** | Worker 1 — UI/feature lanes |
| 4 | `/Users/ari/Developer/yl-wt-2` | **Sonnet** | Worker 2 — UI/feature lanes |
| 5 | `/Users/ari/Developer/yl-wt-3` | **Sonnet/Opus** | Worker 3 — complex lanes |
| 6 | `/Users/ari/Developer/yl-wt-4` | **Codex (GPT 5.4)** | Worker 4 — correctness/backend lanes |
| 7 | `/Users/ari/Developer/yachtielink.webapp` | **Sonnet** | Logger (optional) — doc updates after merges |

**Chrome:** Keep one tab on `localhost:3000`. The reviewer's /yl-review QA phase drives it for screenshots and interactive testing.

---

## Quick Start

### 1. Plan with master (Tab 1)

Open Claude Code **on Opus** in the main repo. Paste: `Run /yl-worktree`. Together:

- Read STATUS.md, CHANGELOG.md, active sprint
- Decide 2-3 non-overlapping lanes
- Master creates session file in `sessions/`
- Master creates lane files in `worktrees/lanes/`
- Master outputs ready-to-paste prompts for all terminals

### 2. Create worktrees

```bash
cd /Users/ari/Developer/yachtielink.webapp
git fetch origin
git worktree add ../yl-wt-1 -b feat/lane-1-name origin/main
git worktree add ../yl-wt-2 -b feat/lane-2-name origin/main
git worktree add ../yl-wt-3 -b chore/lane-3-name origin/main
git worktree add ../yl-wt-4 -b chore/lane-4-name origin/main   # Codex, when correctness lane exists
```

### 3. Launch all terminals

Paste the prompts from the master into each terminal. Workers, reviewer, and logger all read their lane/role files directly — no content relay needed.

### 4. Build → Review → Merge cycle

```
Workers build in parallel
    ↓ (worker finishes)
Worker writes report to worktrees/lanes/lane-N-report.md
You tell reviewer: "review lane 1"
    ↓ (reviewer reads lane file + report, runs /yl-review)
Reviewer writes verdict to worktrees/lanes/lane-N-review.md
You tell master: "lane 1 passed"
    ↓ (master merges, rebases remaining worktrees)
You tell logger: "lane 1 merged"
    ↓ (logger reads report + verdict, updates canonical docs)
```

### 5. Cleanup

```bash
git worktree remove ../yl-wt-1
git branch -d feat/lane-1-name
```

Lane files deleted. Session log stays (permanent record in `sessions/`).

---

## Directory Layout

```
worktrees/
  README.md              <-- you are here
  master/
    CLAUDE.md            <-- master agent: orchestration, merge decisions
    prompt.md            <-- one-line prompt: "Run /yl-worktree"
    checklist.md         <-- pre-flight and merge checklist
  reviewer/
    CLAUDE.md            <-- reviewer agent: runs /yl-review
    prompt.md            <-- copy-paste prompt (persistent or one-shot)
  logger/
    CLAUDE.md            <-- logger agent: doc updates after merges
  worker/
    CLAUDE.md            <-- worker agent: bounded execution
    prompt-template.md   <-- template prompt, customized per lane
    report-template.md   <-- workers fill this out when done
  lanes/
    _template.md         <-- blank lane assignment (master populates)
```

Session logs live in `sessions/` (repo root), not `worktrees/sessions/`.

---

## Rules That Make This Work

1. **Docs are the protocol** — agents communicate through files, founder provides triggers
2. **Only the master (or logger) edits shared docs** — CHANGELOG.md, STATUS.md, sprint trackers
3. **Workers always use worktree branches** — never main, even for docs-only work
4. **Clear file ownership** — if you can't describe which files each worker owns, the split is wrong
5. **No scope creep in workers** — workers execute their lane, nothing more
6. **Nothing merges without reviewer verdict** — the reviewer is the quality gate
7. **Short merge cycles** — merge the cleanest branch first, rebase the rest, repeat
8. **Migrations are high-risk** — ideally one worker creates migrations at a time

---

## Session Flow at a Glance

```
FOUNDER              MASTER                REVIEWER              WORKERS               LOGGER
───────              ──────                ────────              ───────               ──────
"let's push"         /yl-worktree          (waiting)             (not started)         (waiting)
                     Plans lanes
                     Creates session file
                     Creates lane files
                     Outputs prompts
paste prompts →                                                  Building...
                                                                 Building...
"lane 1 done" →      Notes status                                Report written →
"review lane 1" →                          Reads report
                                           /yl-review
                                           Verdict written →
"lane 1 passed" →    Merges wt-1
                     Rebases wt-2,3
"lane 1 merged" →                                                                     Reads report
                                                                                      Reads verdict
                                                                 Worker 2 done →       Logs it ✓
"review lane 2" →                          Reads report
                     ...                   ...                                         ...
"wrap up" →          Cleanup worktrees                                                 /yl-shipslog
```
