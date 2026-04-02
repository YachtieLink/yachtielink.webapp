# Lane 1 — Ghost Endorsement Flow Fix (Amendment)

**Session:** sessions/2026-04-02-ghost-closeout-ux-polish.md
**Worktree:** yl-wt-1
**Branch:** fix/ghost-closeout
**Model:** Opus (upgraded from Sonnet)
**Status:** active — PRIORITY

---

## Context

The original Lane 1 work (ghost join gap) is complete. This amendment fixes critical flow bugs in the ghost endorsement system that make the feature not ready for launch.

## Problem

Three flow bugs that will break the ghost endorsement experience for real users:

### Bug 1: Existing users hit a wall at submit time
When someone with an existing YachtieLink account receives a ghost endorsement request (email link), they can:
- Click the link → see the ghost form → write their entire endorsement → hit submit → get rejected with "An account with this email already exists"

The check at `/api/endorsements/guest/route.ts:84-105` catches this, but only at submit time. The user wasted their time.

**Fix:** Add a page-load check to `/app/(public)/endorse/[token]/page.tsx`. If `recipient_email` matches an existing user, don't render GhostEndorseForm — show a "You already have an account" message with a sign-in button that preserves the token via `returnTo`.

### Bug 2: No auto-merge on signup
When someone signs up for YachtieLink and their email matches a `ghost_profiles.email`, nothing happens. Their ghost endorsements stay orphaned with the old `ghost_endorser_id`. The ghost and real account coexist as separate identities.

Currently `claim_ghost_profile()` RPC exists and works, but it's only triggered from `/claim/{id}` — someone has to explicitly visit that page. Regular signup doesn't trigger it.

**Fix:** Add ghost claim to the auth callback or post-signup flow. After a user's email is confirmed, call `claim_ghost_profile()` automatically. This ensures that anyone who signs up and happens to have ghost endorsements gets them merged seamlessly — they don't need to know about the claim page.

Where to add it:
- Check `middleware.ts` or the auth callback route for post-signup hooks
- OR add it to the onboarding flow entry point (first page load after signup)
- The RPC is idempotent — safe to call multiple times

### Bug 3: Phone-only dedup gap
If a request was sent via phone (WhatsApp), the email check doesn't catch existing users. Someone who registered with email `sarah@example.com` but received a ghost request via phone `+44...` will create a ghost profile even though they have an account.

**Fix:** Extend the page-load check and the API submit check to also match `recipient_phone` against `users.phone` (if the column exists) or against the phone stored in the user record.

## Scope

### Files to modify

```
app/(public)/endorse/[token]/page.tsx     — page-load email/phone check
app/api/endorsements/guest/route.ts       — extend phone check at submit
```

### Files to find and modify (investigate which handles post-signup)

```
middleware.ts                              — OR
app/api/auth/callback/route.ts            — OR
app/(protected)/app/onboarding/*/page.tsx  — auto-claim after signup
```

### Reference files (read, don't modify)

```
lib/ghost/merge.ts                        — claimGhostProfile() helper
supabase/migrations/20260401000002_endorsements_ghost.sql — claim RPC
app/(public)/claim/[id]/page.tsx          — existing claim page (pattern reference)
app/api/ghost-profiles/claim/route.ts     — existing claim API route
```

## Allowed Files

```
app/(public)/endorse/[token]/page.tsx
app/(public)/endorse/[token]/success/page.tsx
app/api/endorsements/guest/route.ts
app/api/auth/callback/route.ts
middleware.ts
app/(protected)/app/onboarding/**
lib/ghost/merge.ts (if needs extending)
components/ghost/GhostEndorseForm.tsx (if needs error state)
```

## Forbidden Files

```
CHANGELOG.md
STATUS.md
docs/ops/
components/public/EndorsementCard.tsx (Lane 2)
components/network/ (Lane 2)
app/(protected)/app/profile/settings/ (Lane 3)
```

## Definition of Done

- [ ] `/endorse/{token}` page-load check: if recipient_email matches existing user → show sign-in prompt (not ghost form)
- [ ] Phone number check at page-load (same logic, if phone available)
- [ ] Auto-claim on signup: new user with confirmed email → `claim_ghost_profile()` called automatically
- [ ] API submit check extended to phone (if not already covered by page-load)
- [ ] All existing ghost endorsement tests still pass
- [ ] Type check passes
- [ ] Completion report filled out with Discovered Issues section

## Test Cases (worker must verify)

1. **Existing user gets ghost link** → page shows "sign in" prompt, not ghost form
2. **New person gets ghost link** → ghost form renders, can submit, ghost profile created
3. **New person signs up after ghost endorsement** → ghost profile auto-claimed, endorsements merged
4. **Same person submits twice** → "already submitted" error
5. **Expired link** → expired message
6. **Cancelled request** → cancelled message

---

## Worker Report

_Worker appends their completion report here when done._
