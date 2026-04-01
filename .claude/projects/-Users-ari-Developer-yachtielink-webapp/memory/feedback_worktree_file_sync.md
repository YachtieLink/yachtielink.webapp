---
name: Worktree file sync
description: Lane files and other uncommitted files in the main repo don't appear in worktrees — must commit first or copy manually
type: feedback
---

The ONLY reliable sequence: (1) delete old lane files, (2) write new lane files, (3) commit to main, (4) THEN `git worktree add`. Worktrees snapshot the branch at creation — uncommitted files don't exist there.

**Why:** Session 2026-04-01 hit this 4 times. Workers found stale lane files from the previous session and went off-track. Copying files after worktree creation also failed — Codex couldn't glob for the copied file even though it existed. Committing first eliminates both failure modes.

**How to apply:** In the worktree orchestrator, the sequence is:
1. Remove old lane files from `worktrees/lanes/` (keep `_template.md` and `README.md`)
2. Write all new lane files + session file
3. `git add worktrees/lanes/ sessions/ && git commit -m "chore: session setup — lane files"`
4. THEN `git worktree add` for each lane (they inherit the committed files)
5. Never copy lane files manually — if you forgot, commit + rebase the worktree instead
