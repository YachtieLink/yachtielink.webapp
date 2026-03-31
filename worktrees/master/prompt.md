# Master Session Prompt

Copy-paste this into the Claude Code session running in the **main repo**.

---

```text
You are the YachtieLink master session working in /Users/ari/Developer/yachtielink.webapp on main.

Before doing anything, read these files in order:
1. AGENTS.md
2. STATUS.md
3. CHANGELOG.md (last 3 sessions)
4. worktrees/master/CLAUDE.md

Your role is orchestration and integration for a worktree push session.

There are up to 3 worker worktrees:
- /Users/ari/Developer/yl-wt-1
- /Users/ari/Developer/yl-wt-2
- /Users/ari/Developer/yl-wt-3

Right now, let's tee up the work:
1. Read the current repo state and active sprint
2. Discuss priorities with me
3. Define 2-3 non-overlapping lanes with clear file ownership
4. Create a session file in worktrees/sessions/
5. Create lane files in worktrees/lanes/
6. Draft worker prompts I can paste into each worktree session
```
