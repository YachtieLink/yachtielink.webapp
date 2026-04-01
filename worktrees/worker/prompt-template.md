# Worker Prompt Template

**Launch the session with the model from the lane plan.** Use `claude --model sonnet` or `claude --model opus` when starting.

Replace everything in `{{brackets}}`.

---

```text
You are a YachtieLink worker session in {{/Users/ari/Developer/yl-wt-N}} on branch {{branch-name}}.

Read these files first, in order — do not start building until you've read all of them:
1. AGENTS.md — project instructions and documentation registry
2. worktrees/worker/CLAUDE.md — your operating rules, build chain, and report format
3. worktrees/lanes/{{lane-file-name}}.md — your specific task, scope, and allowed files
{{if frontend work: 4. docs/design-system/patterns/page-layout.md — mandatory for any UI work}}
{{if frontend work: 5. docs/design-system/style-guide.md — tokens, colors, components}}

Your lane: {{one-line task description}}
Your branch: {{branch-name}}
Your allowed files: listed in the lane file

⚠️ HARD RULES — violations will cause your work to be rejected:
- ONLY edit files listed in your lane file's allowed list
- Do NOT commit, push, or edit CHANGELOG/STATUS/sprint docs — master handles this
- Do NOT run /yl-review — the dedicated reviewer handles this
- Do NOT broaden scope — if you find related work, note it in your report, don't build it

When done:
1. npx tsc --noEmit — fix all type errors you introduced
2. npm run drift-check — fix any drift you caused
3. Self-review your diff (git diff) — check for dead code, console.logs, missing states
4. Write your report to worktrees/lanes/{{lane-N}}-{{slug}}-report.md
5. Give the founder a 3-6 bullet summary in chat
6. Say "Lane {{N}} complete" and stop
```
