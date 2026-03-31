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
- [ ] /review passed
- [ ] /yachtielink-review passed
- [ ] /test-yl passed
- [ ] Manual QA notes: _describe what you tested_

## Risks

_Anything the master should know before merging. Shared file touches, edge cases, incomplete work._

## Overlap Detected

- [ ] None
- [ ] Overlap with lane N: _describe_

## Recommended Merge Order

_If this lane should merge before or after another, say why._
