# Worktree Operating Model

Run parallel Claude Code sessions on isolated branches to compress sprint work.

**Model:** 1 master (Opus) + 1 reviewer (Opus) + 2-3 workers (Sonnet, or Opus for complex lanes) + 1 logger (Sonnet, optional).

**Quick launch:** Run `/worktree-yl` in any Claude Code session to bootstrap everything.

---

## Desktop Layout

You need 5 things visible. Recommended: iTerm2 with tabs/splits + one Chrome window.

```
┌─────────────────────────────────────────────────────────┐
│  iTerm2                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ Master   │ Reviewer │ Worker 1 │ Worker 2 │ Worker │ │
│  │ (Opus)   │ (Opus)   │ (Sonnet) │ (Sonnet) │ 3 opt  │ │
│  │ Tab 1    │ Tab 2    │ Tab 3    │ Tab 4    │ Tab 5  │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
├─────────────────────────────────────────────────────────┤
│  Chrome — localhost:3000 (reviewer uses this for QA)    │
└─────────────────────────────────────────────────────────┘
```

| Tab | Directory | Model | Role |
|-----|-----------|-------|------|
| 1 | `/Users/ari/Developer/yachtielink.webapp` | **Opus** | Master — plan lanes, orchestrate, merge, update docs |
| 2 | `/Users/ari/Developer/yachtielink.webapp` | **Opus** | Reviewer — /review → /yachtielink-review → /test-yl |
| 3 | `/Users/ari/Developer/yl-wt-1` | **Sonnet** | Worker 1 — build lane 1 |
| 4 | `/Users/ari/Developer/yl-wt-2` | **Sonnet** | Worker 2 — build lane 2 |
| 5 | `/Users/ari/Developer/yl-wt-3` | **Sonnet/Opus** | Worker 3 (optional) — build lane 3 |
| 6 | `/Users/ari/Developer/yachtielink.webapp` | **Sonnet** | Logger (optional) — doc updates after merges |

**Chrome:** Keep one tab on `localhost:3000`. The reviewer's /test-yl step drives it for QA screenshots and interactive testing. Leave it visible — you'll see what the reviewer sees.

**Cost profile:** 2 Opus sessions (master + reviewer) + 2-3 Sonnet workers. Reviewer is the most token-heavy because it runs the full skill chain per branch.

---

## Quick Start

### 1. Plan with master (Tab 1)

Open Claude Code **on Opus** in the main repo. Paste the prompt from `worktrees/master/prompt.md`. Together:

- Read STATUS.md, CHANGELOG.md, active sprint
- Decide 2-3 non-overlapping lanes
- Master creates a session file in `worktrees/sessions/`
- Master creates lane files in `worktrees/lanes/`
- Master drafts worker prompts

### 2. Create worktrees

```bash
cd /Users/ari/Developer/yachtielink.webapp
git fetch origin
git worktree add ../yl-wt-1 -b feat/lane-1-name origin/main
git worktree add ../yl-wt-2 -b feat/lane-2-name origin/main
git worktree add ../yl-wt-3 -b chore/lane-3-name origin/main   # optional
```

### 3. Launch reviewer (Tab 2)

Open Claude Code **on Opus** in the main repo. Paste the prompt from `worktrees/reviewer/prompt.md`. It waits until you point it at a branch.

### 4. Launch workers (Tabs 3-5)

Open Claude Code **on Sonnet** in each worktree directory. Paste the customized worker prompt (from `worktrees/worker/prompt-template.md` with lane details filled in).

```bash
cd /Users/ari/Developer/yl-wt-1 && claude --model sonnet
cd /Users/ari/Developer/yl-wt-2 && claude --model sonnet
```

### 5. Build → Review → Merge cycle

```
Workers build in parallel
    ↓ (worker 1 finishes first)
You tell reviewer: "review yl-wt-1"
    ↓ (reviewer runs /review → /yachtielink-review → /test-yl)
Reviewer reports verdict
    ↓ (PASS)
Master merges, rebases remaining worktrees
    ↓ (worker 2 finishes)
You tell reviewer: "review yl-wt-2"
    ↓ ... repeat
Master runs /shipslog, updates docs
```

### 6. Cleanup

```bash
git worktree remove ../yl-wt-1
git branch -d feat/lane-1-name
```

---

## Directory Layout

```
worktrees/
  README.md              <-- you are here
  master/
    CLAUDE.md            <-- master agent: orchestration, docs, merge
    prompt.md            <-- copy-paste prompt
    checklist.md         <-- pre-flight and merge checklist
  reviewer/
    CLAUDE.md            <-- reviewer agent: runs full review chain
    prompt.md            <-- copy-paste prompt (persistent or one-shot)
  logger/
    CLAUDE.md            <-- logger agent: doc updates after merges
  worker/
    CLAUDE.md            <-- worker agent: bounded execution
    prompt-template.md   <-- template prompt, customized per lane
    report-template.md   <-- workers fill this out when done
  sessions/
    _template.md         <-- blank session plan (master populates)
  lanes/
    _template.md         <-- blank lane assignment (master populates)
```

---

## Rules That Make This Work

1. **Only the master (or logger) edits shared docs** — CHANGELOG.md, STATUS.md, sprint trackers
2. **Clear file ownership** — if you can't describe which files each worker owns, the split is wrong
3. **No scope creep in workers** — workers execute their lane, nothing more
4. **Nothing merges without reviewer verdict** — the reviewer is the quality gate
5. **Short merge cycles** — merge the cleanest branch first, rebase the rest, repeat
6. **Migrations are high-risk** — ideally one worker creates migrations at a time

---

## Session Flow at a Glance

```
YOU + MASTER                    REVIEWER              WORKERS               LOGGER
─────────────────               ─────────             ────────              ──────
Plan lanes, define ownership    (waiting)             (not started)         (waiting)
Create session + lane files
Draft worker prompts
Create worktrees
Launch workers                                        Building...
                                                      Building...
Monitor for overlap                                   Worker 1 done →
                                Review wt-1 ←──────── (report ready)
                                /review
                                /yachtielink-review
                                /test-yl
                                Verdict: PASS ──────→
Master merges wt-1                                    Worker 2 done →       Log lane 1 ←
Rebase wt-2, wt-3              Review wt-2 ←────────                       CHANGELOG ✓
                                ...chain...                                 STATUS ✓
                                Verdict: PASS ──────→                       modules ✓
Master merges wt-2                                                          Log lane 2 ←
Master plans next lanes                                                     /shipslog
Cleanup worktrees
```
