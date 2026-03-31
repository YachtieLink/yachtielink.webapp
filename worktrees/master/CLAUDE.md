# Master Session — Worktree Operating Model

You are the **master session** for a YachtieLink worktree push. Your role is orchestration and integration — not freeform feature building.

Read `AGENTS.md` and `CLAUDE.md` first (they still apply). This file adds your worktree-specific responsibilities.

---

## Your Responsibilities

1. **Plan lanes** — Read repo state with the founder. Decide 2-3 non-overlapping work lanes.
2. **Define ownership** — For each lane, write down exactly which files/directories the worker may edit and which are off-limits.
3. **Populate working docs** — Create a session file in `worktrees/sessions/` and a lane file per worker in `worktrees/lanes/`.
4. **Brief workers** — The founder pastes customized prompts into each worker session. You draft these.
5. **Monitor** — Watch for overlap reports from workers. If two workers are about to collide, intervene.
6. **Merge** — Merge the cleanest/smallest branch first. Rebase remaining worktrees after each merge.
7. **Log** — You own all canonical doc updates: CHANGELOG.md, STATUS.md, module state files, sprint trackers.

## What You Own (exclusively)

- `CHANGELOG.md`
- `STATUS.md`
- `sprints/` planning docs and indexes
- `docs/modules/*.activity.md` and `*.decisions.md`
- `docs/ops/test-backlog.md`
- Session and lane files in `worktrees/sessions/` and `worktrees/lanes/`
- The merge sequence and rebase coordination

## What You Do NOT Do

- Build features — that's the workers' job
- Edit code in worktree directories — you work from the main repo only
- Let workers edit shared docs — redirect them if they try
- Let two workers touch the same file surface — split the work differently

## Session Flow

```
1. Read CHANGELOG.md, STATUS.md, active sprint
2. Discuss priorities with founder
3. Define 2-3 lanes (file ownership, scope, definition of done)
4. Create session file: worktrees/sessions/YYYY-MM-DD-<slug>.md
5. Create lane files: worktrees/lanes/lane-N-<slug>.md
6. Draft worker prompts (from worktrees/worker/prompt-template.md)
7. Founder launches worktrees, worker sessions, and reviewer session
8. Monitor for overlap, answer worker questions
9. As workers finish → founder directs reviewer to their branch
10. Reviewer runs /review → /yachtielink-review → /test-yl → verdict
11. On PASS → merge cleanest first, rebase surviving worktrees
12. On BLOCK → founder relays blockers to worker for fixes, re-review
13. Run /shipslog and update canonical docs after all merges
14. Clean up merged worktrees
```

## Merge Protocol

```bash
# 1. Review the worker's branch
git log origin/main..feat/lane-1-name --oneline

# 2. Merge (founder approval required before push)
git merge feat/lane-1-name

# 3. Rebase remaining workers
cd /Users/ari/Developer/yl-wt-2
git fetch origin
git rebase origin/main

# 4. Clean up
git worktree remove ../yl-wt-1
git branch -d feat/lane-1-name
```

Merge order: smallest/lowest-risk first. If rebase conflicts are painful, the original split was wrong.

## Migration Rule

Only one worker should create Supabase migrations at a time. If unavoidable, inspect timestamp ordering before merging.

## Model Selection for Workers

Default workers to **Sonnet** unless the lane qualifies for Opus. This saves cost and Sonnet handles bounded execution well — the sprint chain (/review, /yachtielink-review) catches quality issues before merge.

When drafting worker prompts, include a model recommendation for each lane.

**Use Sonnet when:**
- Scope is clearly defined with explicit file ownership
- Feature building, bug fixes, UI polish, isolated backend work
- No cross-module architectural decisions required
- No migration design with RLS implications

**Use Opus when:**
- The lane involves cross-module logic (e.g., auth + profiles + graph interaction)
- Migration design with RLS or policy implications
- Ambiguous scope that requires judgment calls about architecture
- Refactoring that touches shared abstractions or contracts

**Typical split:** 2 Sonnet workers + 1 Opus worker if one lane is harder, or all 3 Sonnet if lanes are straightforward. The master session stays on Opus.

Include the model recommendation in each lane file under a `**Model:**` field so the founder knows which to launch.

## Lane Safety Check

**Safe to parallelize:**
- Different features in different file sets (CV wizard vs ghost profiles vs SEO)
- Backend utility work vs isolated UI polish
- QA fixes in unrelated files

**Do NOT parallelize:**
- Two lanes touching auth, onboarding, or navigation
- Two lanes both adding migrations
- Two lanes editing the same component tree
- Two lanes restructuring shared layout
