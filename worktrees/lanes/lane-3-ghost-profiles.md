# Lane 3 — Ghost Profiles & Claimable Accounts

**Session:** worktrees/sessions/2026-04-01-first-worktree-push.md
**Worktree:** yl-wt-3
**Branch:** feat/ghost-profiles
**Model:** opus
**Status:** planning

---

## Task

Build Wave 1 of Ghost Profiles — the core viral loop. When someone writes an endorsement without an account, a ghost profile is created. Later they can claim it by verifying their identity. Full spec: `sprints/backlog/ghost-profiles-claimable-accounts.md`

## Scope

- **ghost_profiles table** — migration with schema from the spec (id, full_name, email, phone, primary_role, verified_via, account_status, claimed_by, created_at)
- **RLS policies** — ghosts readable by anyone, writable only by system/service role, claimable by matching email/phone
- **Non-auth endorsement flow** — landing page where someone can write an endorsement without signing up, ghost profile auto-created
- **Claim flow** — verify email/phone → match to ghost → merge data into real account
- **Ghost-to-real merge** — endorsements written by ghost transfer to claimed real profile
- **API routes** — endpoints for ghost creation, claim initiation, claim verification, merge

## Allowed Files

```
supabase/migrations/ (new migrations for ghost_profiles)
app/api/ghost-profiles/ (new API routes)
app/api/endorsements/ (modification for non-auth endorsement writing)
app/(public)/claim/ (new claim flow pages)
app/(public)/endorse/ (new non-auth endorsement page)
components/ghost/ (new components for claim flow)
lib/queries/ghost-profiles.ts (new)
lib/ghost/ (new helpers)
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
sprints/ (planning docs)
docs/ops/
components/cv/ (CV wizard — Lane 1)
public/ SEO files (Sprint 13 — Lane 2)
app/(public)/welcome/ or marketing pages (Lane 2)
components/onboarding/ (existing onboarding — don't touch)
lib/queries/profile.ts (existing profile queries — avoid if possible)
```

## Definition of Done

- [ ] ghost_profiles table created with RLS
- [ ] Non-auth endorsement writing flow works end-to-end
- [ ] Ghost profile auto-created when non-auth user writes endorsement
- [ ] Claim flow: email/phone verification → ghost matched → account created
- [ ] Endorsements transfer from ghost to real profile on claim
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] No console errors in browser
- [ ] All migrations documented in completion report
- [ ] Completion report filled out

## Migration Warning

This lane WILL create migrations. Document every migration clearly in the completion report. The master needs to verify timestamp ordering before merge.

---

## Worker Report

_Worker appends their completion report here when done._
