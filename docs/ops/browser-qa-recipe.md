# Browser QA Recipe — Dev Server + Chrome

Agents: read this every time you need to run browser QA. Don't waste tokens figuring out PATH issues.

## Start Dev Server

```bash
# PATH is not inherited in Claude Code shell — always set it explicitly
export PATH="/opt/homebrew/bin:$PATH"

# Start in the target worktree (or main repo)
cd /Users/ari/Developer/yl-wt-{N}    # or yachtielink.webapp for main
npx next dev --port 3000 &

# Wait for compilation
sleep 15

# Verify it's running
lsof -i :3000 | head -3
```

**Only one dev server at a time on port 3000.** Kill it before testing the next worktree:
```bash
kill $(lsof -ti :3000) 2>/dev/null
```

## Open Chrome

```
1. tabs_context_mcp (createIfEmpty: true)     — get/create tab
2. navigate to http://localhost:3000           — load the app
3. wait 5 seconds                             — let it compile + render
4. screenshot                                 — verify it loaded
```

## Key Paths to Test

| Area | URL | What to check |
|------|-----|---------------|
| Profile | /app/profile | Sections render, endorsements show names |
| Settings | /app/profile/settings | Toggles, layout selector, social links |
| Public profile | /u/{handle} | Full public view, endorsement cards, experience |
| CV preview | /app/cv/preview | Endorsements, ghost names |
| Network | /app/network | Saved profiles, colleague cards |

## Mobile Viewport

```
resize_window: width 375, height 812
```

## Switch Worktrees

```bash
kill $(lsof -ti :3000) 2>/dev/null
sleep 2
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/ari/Developer/yl-wt-{N}
npx next dev --port 3000 &
sleep 15
```

## Common Gotchas

- **`npx: command not found`** — PATH not set. Always `export PATH="/opt/homebrew/bin:$PATH"` first.
- **`env: node: No such file or directory`** — Same PATH issue.
- **Tab doesn't exist** — Call `tabs_context_mcp(createIfEmpty: true)` to get a fresh tab.
- **Page blank after navigate** — Wait 5s for Next.js to compile, then screenshot.
- **Port already in use** — `kill $(lsof -ti :3000)` then retry.
