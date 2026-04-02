# Worker Completion Report

---

## Lane

- **Worktree:** yl-wt-1
- **Branch:** fix/ghost-closeout
- **Lane file:** worktrees/lanes/lane-1-ghost-flow-fix.md

## Summary

Fixed three critical ghost endorsement flow bugs that would break the real-user experience at launch:

1. **Bug 1 — Existing users hit a wall at submit time.** Added a page-load check to `/endorse/[token]` that queries `users` by `recipient_email` before rendering the ghost form. If a match is found, the page shows a "You already have an account" message with a sign-in button that preserves the token via `returnTo=/r/{token}`. Existing users never see the ghost form.

2. **Bug 2 — No auto-merge on signup.** Added `claim_ghost_profile()` RPC call to the auth callback route (`app/auth/callback/route.ts`). After successful `exchangeCodeForSession`, the RPC fires automatically. It's idempotent and non-fatal — if no matching ghosts exist, it's a no-op. This covers email verification, OAuth, and password reset flows.

3. **Bug 3 — Phone-only dedup gap.** Extended both the page-load check (endorse page) and the API submit check (guest route) to also match `recipient_phone` against `users.phone`. Catches WhatsApp-based requests where the person registered with email but received the request via phone.

## Files Changed

```
app/(public)/endorse/[token]/page.tsx        — page-load email/phone existing-user check + sign-in UI
app/api/endorsements/guest/route.ts          — phone dedup + self-endorsement guard + admin client for user checks
app/auth/callback/route.ts                   — auto-claim ghost profiles after code exchange + returnTo param support
middleware.ts                                — one-time ghost claim on first authenticated navigation (covers password login)
supabase/migrations/20260402000002_ghost_claim_phone_and_safeguards.sql — phone index + RPC phone matching + self-endorsement guard
```

## Migrations

- [x] Migration added: `supabase/migrations/20260402000002_ghost_claim_phone_and_safeguards.sql`

**What it does:**
1. Creates partial index `users_phone_idx` on `users.phone WHERE phone IS NOT NULL` (for phone dedup queries)
2. Replaces `claim_ghost_profile()` RPC to also match ghosts by `phone` (not just email)
3. Adds self-endorsement guard to claim migration: Step A now soft-deletes ghost endorsements where `recipient_id = v_claiming_user_id` before migrating

**Ordering:** Must run after `20260402000001_ghost_profiles_public_read.sql`. No other ordering concerns.

## Tests

- [x] Type check passed (`npx tsc --noEmit`)
- [x] Drift check passed (`npm run drift-check`)
- [ ] /yl-review passed (run by reviewer, not worker)
- [x] Manual QA notes: Self-reviewed all diffs. Verified:
  - Shareable links (recipient_email=null, recipient_phone=null) bypass both checks — ghost form renders normally
  - Auth callback auto-claim uses the same `supabase` instance that already holds the session from `exchangeCodeForSession`
  - Middleware ghost claim fires once per browser session via `yl_ghost_checked` session cookie — no repeated DB calls
  - Self-endorsement guard uses admin client to fetch requester email/phone before insert
  - RPC self-endorsement Step A runs before duplicate check Step B, preventing constraint crashes

## Risks

- **Middleware latency on first navigation:** The ghost claim RPC adds one round-trip to the first protected navigation after login. The RPC is fast (single CTE query) and subsequent navigations skip it via cookie. If latency becomes a concern, it could be deferred to a background job.

- **Admin client in server component:** The endorse page now imports `createServiceClient` for the user-existence check. This is safe (server component, key never exposed to client) but is a slightly unusual pattern. The API route already uses it.

## Overlap Detected

- [x] None

## Recommended Merge Order

This amendment builds on lane-1-ghost-closeout (already complete). Both should merge together on the same branch (`fix/ghost-closeout`). Migration must run after existing ghost migrations. No ordering constraints with other lanes.

---

## Review Fixes — Round 1

Reviewer verdict: 6 BLOCK

### Blockers Fixed

| # | Blocker | Fix Applied | Files Touched |
|---|---------|-------------|---------------|
| 1 | Password login doesn't trigger ghost auto-claim | Added one-time ghost claim in middleware on first authenticated navigation; uses `yl_ghost_checked` session cookie to prevent repeated calls | `middleware.ts` |
| 2 | Account enumeration via anon client | Switched user-existence checks from anon `supabase` client to admin `createServiceClient()` in both endorse page and API route | `app/(public)/endorse/[token]/page.tsx`, `app/api/endorsements/guest/route.ts` |
| 3 | `claim_ghost_profile` only matches by email, not phone | Extended RPC to also fetch `users.phone` and match `ghost_profiles.phone` in the claim loop | `supabase/migrations/20260402000002_ghost_claim_phone_and_safeguards.sql` |
| 4 | No index on `users.phone` | Added partial index `users_phone_idx ON users(phone) WHERE phone IS NOT NULL` | `supabase/migrations/20260402000002_ghost_claim_phone_and_safeguards.sql` |
| 5 | `no_self_endorsement` constraint bypassed by NULL endorser_id | Two layers: (a) API route checks ghost email/phone against requester's before insert, (b) RPC Step A soft-deletes endorsements where `recipient_id = claiming_user` before migration | `app/api/endorsements/guest/route.ts`, `supabase/migrations/20260402000002_ghost_claim_phone_and_safeguards.sql` |
| 6 | `returnTo` vs `next` parameter inconsistency | Auth callback now checks both `next` and `returnTo` params with fallback chain | `app/auth/callback/route.ts` |

### Warnings Addressed

_No warnings in review._

### Validation (post-fix)
- Type check: pass
- Drift check: pass
- Self-review: clean — no dead code, no debug artifacts, no unused imports

---

## Review Fixes — Round 2

Reviewer verdict: 1 HIGH, 1 MEDIUM

### Blockers Fixed

| # | Blocker | Fix Applied | Files Touched |
|---|---------|-------------|---------------|
| 1 | Ghost claim RPC not wrapped in try-catch — Supabase timeout crashes middleware | Wrapped RPC call in try-catch matching the `getUser()` error handling pattern | `middleware.ts` |

### Warnings Addressed

| # | Warning | Action | Files Touched |
|---|---------|--------|---------------|
| 1 | `yl_ghost_checked` session cookie fires claim every browser session | Added `maxAge: 60 * 60 * 24 * 365` — claim fires once per year per device | `middleware.ts` |

### Validation (post-fix)
- Type check: pass
- Drift check: pass
- Self-review: clean
