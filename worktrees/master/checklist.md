# Master Checklist

Use this every worktree push session.

## Pre-Flight

- [ ] Read CHANGELOG.md, STATUS.md, active sprint
- [ ] Confirm priorities with founder
- [ ] Define lanes (2-3 max)
- [ ] Verify no file overlap between lanes
- [ ] Check: does any lane need migrations? If >1, reconsider the split
- [ ] Create session file in `sessions/`
- [ ] Create lane files in `worktrees/lanes/`
- [ ] Draft worker prompts
- [ ] Founder creates worktrees and launches worker sessions

## During Execution

- [ ] Monitor for overlap reports from workers
- [ ] Answer worker questions about scope boundaries
- [ ] Track which workers are done

## Merge Sequence

- [ ] Identify cleanest/smallest branch to merge first
- [ ] Review worker report (files changed, tests, risks)
- [ ] Merge branch
- [ ] Rebase remaining worktrees
- [ ] Repeat for next branch

## Post-Merge

- [ ] Run /yl-shipslog
- [ ] Update CHANGELOG.md with all work from all lanes
- [ ] Update STATUS.md
- [ ] Update module state files for touched modules
- [ ] Update docs/ops/test-backlog.md
- [ ] Clean up merged worktrees and branches
- [ ] Update session file status to "complete"

## Cleanup Commands

```bash
# Remove a merged worktree
git worktree remove ../yl-wt-1
git branch -d feat/lane-1-name

# List all worktrees
git worktree list

# Prune stale worktree references
git worktree prune
```
