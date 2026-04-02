# CV Preview: Ghost Endorser Join Missing

**Status:** idea
**Priority guess:** P1 (bug — user-visible)
**Date captured:** 2026-04-02
**Source:** Lane 1 reviewer (worktree session)

## Summary
`app/(protected)/app/cv/preview/page.tsx:21` has a stale inline endorsements query that doesn't include `ghost_endorser:ghost_endorser_id`. The owner sees "Anonymous" for ghost endorsements in their CV preview. Should be replaced with a `getCvSections()` call to stay in sync.

## Scope
- Replace inline query with `getCvSections()` call
- Verify ghost endorser names render correctly in CV preview
- ~1 file, small fix
