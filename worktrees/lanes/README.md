# Worktree Lanes

Each active lane gets a file here, created by the master agent during session planning.

**Naming:** `lane-N-<slug>.md` (e.g., `lane-1-cv-onboarding.md`)

**Template:** `_template.md`

The lane file defines:
- What the worker builds (scope)
- Which files they may edit (allowed)
- Which files are off-limits (forbidden)
- What "done" looks like (definition of done)

Workers read their lane file at session start. When done, they append their completion report to the bottom of the file.

**Lifecycle:** Lane files are created during planning, populated during execution, and archived (or deleted) after the session is complete.
