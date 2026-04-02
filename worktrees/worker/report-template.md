# Worker Completion Report

Fill this out when your lane is done. The master needs this to merge safely.

---

## Lane

- **Worktree:** yl-wt-N
- **Branch:** branch-name
- **Lane file:** worktrees/lanes/lane-N-slug.md

## Summary

_One paragraph: what did you build?_

## Files Changed

_List every file you created or modified._

```
path/to/file1.tsx
path/to/file2.ts
```

## Migrations

- [ ] No migrations added
- [ ] Migration added: `supabase/migrations/TIMESTAMP_description.sql`

_If migration added: describe what it does and any ordering concerns._

## Tests

- [ ] Type check passed (`npx tsc --noEmit`)
- [ ] Lint passed
- [ ] /yl-review passed (run by reviewer, not worker)
- [ ] Manual QA notes: _describe what you tested_

## Risks

_Anything the master should know before merging. Shared file touches, edge cases, incomplete work._

## Discovered Issues

_Out-of-scope problems you noticed in files you touched. File path + what's wrong. Logger promotes these to backlog. Think proactively — check adjacent code for bugs, dead code, inconsistent patterns, duplicated logic. Finding issues is as valuable as the lane work._

- **[BUG]** `path/to/file.tsx` — description. Suggested fix: ...
- **[DEBT]** `path/to/file.tsx` — description. Suggested fix: ...
- **[UX]** `path/to/file.tsx` — description. Suggested fix: ...

_Delete the examples above and replace with real findings, or write "None discovered" if genuinely clean._

## Overlap Detected

- [ ] None
- [ ] Overlap with lane N: _describe_

## Recommended Merge Order

_If this lane should merge before or after another, say why._
