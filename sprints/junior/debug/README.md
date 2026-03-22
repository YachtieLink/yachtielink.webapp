# Debug Sprints

For when something is broken and needs fixing. Could be a single bug, a cluster of related errors, or a stability investigation.

Keep these focused — one problem (or one group of related problems) per sprint. If it's ballooning, it may deserve a major sprint.

---

## Active Debug Sprints

| Slug | Started | Issue |
|------|---------|-------|
| — | — | None active |

---

## Sprint Template

Create a subfolder like `debug-<short-slug>/` and add a `README.md`:

```markdown
# Debug: [Short description]

**Started:** YYYY-MM-DD
**Status:** 🐛 In Progress / ✅ Resolved
**Severity:** High / Medium / Low

## Problem
What's broken. What the user sees. When it happens.

## Reproduction Steps
1. ...
2. ...

## Root Cause (once known)
What caused it.

## Fix
What was changed and where.

## Verification
How we confirmed it's fixed.
```

---

## Completed Debug Sprints

| Slug | Completed | Summary |
|------|-----------|---------|
| [sprint-11.1](./sprint-11.1/) | 2026-03-22 | CV parse, photo limits, regenerate date — bundled fix (PR #55) |
| [debug-cv-parse-extraction](./debug-cv-parse-extraction/) | 2026-03-22 | Fixed via `serverExternalPackages` in Sprint 11.1 |
| [debug-photo-upload-limit](./debug-photo-upload-limit/) | 2026-03-22 | Fixed via subscription check in Sprint 11.1 |
| [debug-cv-regenerate-date](./debug-cv-regenerate-date/) | 2026-03-22 | Fixed via local state in Sprint 11.1 |
