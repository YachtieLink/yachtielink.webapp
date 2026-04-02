# Lane 1 — Ghost Profiles Closeout

**Session:** sessions/2026-04-02-ghost-closeout-ux-polish.md
**Worktree:** yl-wt-1
**Branch:** fix/ghost-closeout
**Model:** Sonnet
**Status:** active

---

## Task

Fix the ghost join gap: private profile dashboard and CV queries show "Anonymous" for ghost endorsements because `ghost_endorser` join is missing. Add the join to `getProfileSections` and `getCvSections` to match what `getPublicProfileSections` already has.

## Scope

- Add `ghost_endorser:ghost_endorser_id` join to `getProfileSections` endorsements query
- Add `ghost_endorser:ghost_endorser_id` join to `getCvSections` endorsements query
- Ensure display components consuming these queries handle the ghost_endorser field gracefully (fallback to "Anonymous" when both endorser and ghost_endorser are null)
- Update PHASE1-CLOSEOUT.md checkboxes for completed items

## Allowed Files

```
lib/queries/profile.ts
lib/queries/types.ts
components/profile/EndorsementsSection.tsx
components/cv/*.tsx
sprints/PHASE1-CLOSEOUT.md
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
docs/ops/
components/public/ (Lane 2 territory)
components/network/ (Lane 2 territory)
app/(protected)/app/profile/settings/ (Lane 3 territory)
```

## Reference

The public profile query already has the correct join. Use it as the pattern:

```typescript
// In getPublicProfileSections (line ~265):
ghost_endorser:ghost_endorser_id ( id, full_name, primary_role ),
```

For `getProfileSections` (line ~106), add:
```typescript
ghost_endorser:ghost_endorser_id ( id, full_name, primary_role ),
```

For `getCvSections` (line ~311), add:
```typescript
ghost_endorser:ghost_endorser_id ( full_name ),
```

## PHASE1-CLOSEOUT Checkboxes to Tick

These are already done but unchecked:
- [ ] Date pickers — text + calendar on mobile (done in PR #138)
- [ ] Progress tick timing — vary delays (done in PR #138)
- [ ] Wire GhostEndorserBadge into profile views (done in PR #143)

## Definition of Done

- [ ] `getProfileSections` returns ghost_endorser data for endorsements
- [ ] `getCvSections` returns ghost_endorser data for endorsements
- [ ] Display components show ghost endorser name instead of "Anonymous"
- [ ] PHASE1-CLOSEOUT checkboxes updated
- [ ] Type check passes
- [ ] /yl-review passes (run by reviewer)
- [ ] Completion report filled out

---

## Worker Report

_Worker appends their completion report here when done._
