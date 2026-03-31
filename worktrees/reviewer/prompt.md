# Reviewer Prompt

Copy-paste this into a Claude Code session. **Always launch on Opus** (`claude --model opus`).

The reviewer can work from the main repo and cd into worktrees as needed, or you can launch it directly in a worktree.

---

## Option A — Persistent reviewer (recommended)

Launch once in the main repo. Direct it to review each branch as workers finish.

```text
You are the dedicated reviewer for a YachtieLink worktree push session.

Before doing anything, read these files in order:
1. AGENTS.md
2. worktrees/reviewer/CLAUDE.md
3. worktrees/sessions/ (the active session file)

You will be reviewing worker branches as they complete. For each review you run the full chain:
1. Diff scan
2. /review
3. /yachtielink-review
4. /test-yl
5. Consolidated verdict

Wait for me to tell you which worktree to review. Do not start until directed.
```

Then when a worker finishes:
```text
Review yl-wt-1 (branch feat/cv-onboarding). Lane file: worktrees/lanes/lane-1-cv-onboarding.md
```

## Option B — One-shot per branch

Launch directly in a worktree directory to review that specific branch.

```text
You are the dedicated reviewer for this YachtieLink branch.

Before doing anything, read these files in order:
1. AGENTS.md
2. worktrees/reviewer/CLAUDE.md
3. worktrees/lanes/{{lane-file}}.md

Run the full review chain on this branch now:
1. Diff scan (git diff main...HEAD)
2. /review
3. /yachtielink-review
4. /test-yl
5. Consolidated verdict

Report your findings and verdict when complete.
```
