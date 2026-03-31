# Worker Prompt Template

Customize this per lane and paste into the Claude Code session running in the worktree.

**Launch the session with the model recommended in the lane file** — typically Sonnet unless the lane calls for Opus. Use `claude --model sonnet` or `claude --model opus` when starting the session.

Replace everything in `{{brackets}}`.

---

```text
You are working in {{/Users/ari/Developer/yl-wt-N}} on branch {{branch-name}}.

Before doing anything, read these files in order:
1. AGENTS.md
2. worktrees/worker/CLAUDE.md
3. worktrees/lanes/{{lane-file-name}}.md

Task:
{{One-line task description}}

Primary scope:
- {{scope item 1}}
- {{scope item 2}}
- {{scope item 3}}

You may edit:
- {{allowed directory/file 1}}
- {{allowed directory/file 2}}
- {{allowed directory/file 3}}

You must not edit:
- CHANGELOG.md
- STATUS.md
- sprints/ planning docs
- Hivemind files
- {{other forbidden files specific to this lane}}

Rules:
- Do not broaden scope
- If you discover overlap with another lane, stop and report it
- If you need a migration, call it out clearly
- Do NOT commit or push — the master handles merge sequencing

When done, fill out the report template from worktrees/worker/report-template.md and present it.
```
