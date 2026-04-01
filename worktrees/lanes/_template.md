# Lane {{N}} — {{Name}}

**Session:** {{link to session file}}
**Worktree:** yl-wt-{{N}}
**Branch:** {{branch-name}}
**Model:** sonnet | opus _(see worktrees/master/CLAUDE.md for guidance)_
**Status:** planning | active | done | merged

---

## Task

{{Clear description of what this worker builds. 2-3 sentences max.}}

## Scope

- {{scope item 1}}
- {{scope item 2}}
- {{scope item 3}}

## Allowed Files

These are the files/directories this worker may edit:

```
{{path/to/directory/*}}
{{path/to/specific-file.tsx}}
```

## Forbidden Files

Do not edit these under any circumstances:

```
CHANGELOG.md
STATUS.md
sprints/ (planning docs)
docs/ops/
{{other lane-specific exclusions}}
```

## Definition of Done

- [ ] {{concrete deliverable 1}}
- [ ] {{concrete deliverable 2}}
- [ ] {{concrete deliverable 3}}
- [ ] Type check passes
- [ ] /yl-review passes (run by reviewer)
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._
