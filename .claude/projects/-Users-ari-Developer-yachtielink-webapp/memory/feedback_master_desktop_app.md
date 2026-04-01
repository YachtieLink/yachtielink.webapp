---
name: Master runs on Desktop app
description: Master session must run on Claude Desktop app for browser QA access — workers/reviewer/logger run on CLI
type: feedback
---

Master session runs on Claude Desktop app, not CLI. Desktop app gives access to the Chrome MCP plugin for browser QA. CLI sessions cannot drive a browser.

**Why:** Session 2026-04-01 discovered CLI has no browser automation. Country flag fixes, display name changes, and date picker UI all needed visual verification but couldn't be tested from CLI.

**How to apply:**
- Master: Claude Desktop app (Opus, high effort) — orchestrates, reviews diffs, runs browser QA via Chrome MCP plugin
- Workers (W1-W3): CLI terminals (`claude --model sonnet`)
- Worker 4 (Codex): CLI terminal (`codex`)
- Reviewer: CLI terminal (`claude --model opus`)
- Logger: CLI terminal (`claude --model sonnet`)

Browser QA uses Chrome with the Claude MCP plugin (not the Desktop app's built-in browser — founder says it's not as good). Dev server always on localhost:3000. One worktree at a time — kill server before switching.
