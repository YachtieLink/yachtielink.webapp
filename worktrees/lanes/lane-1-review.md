## Review: fix/ghost-closeout (yl-wt-1)

### Round 1 — Ghost Join Gap (committed as ea2bcfb)

**Verdict: PASS**

Original ghost_endorser join work — reviewed and passed. See git log for details.

---

### Round 2 — Ghost Flow Fixes (current uncommitted work)

**Verdict: BLOCK**

### /yl-review results
- Type-check: **PASS** (exit 0)
- Drift-check: **PASS** (0 new warnings)
- Sonnet scan: 1 HIGH, 1 MEDIUM, 2 LOW
- Opus deep review: 3 P1, 3 P2
- YL drift patterns: **PASS** — no new drift
- QA: Skipped — would benefit from end-to-end flow testing

### Blockers — ALL MUST BE FIXED

#### 1. Password-based login does not trigger ghost auto-claim
`app/auth/callback/route.ts:45`: The `claim_ghost_profile` RPC fires after `exchangeCodeForSession` — but password login uses `signInWithPassword` on the client (in `/login/page.tsx`) and never hits the auth callback. Users who sign in with a password (the primary auth path) won't get ghost endorsements auto-merged.
**Fix:** Call `claim_ghost_profile` after `signInWithPassword` succeeds in the login page, or call the `/api/ghost-profiles/claim` endpoint from the login success handler.

#### 2. Account enumeration via anon client
`endorse/[token]/page.tsx:142-157` and `guest/route.ts:108-123`: The page-load check queries `users` by email/phone with the anon client. A valid token holder can determine whether a specific email/phone is registered. The pre-existing email check at the API route (lines 90-105) has the same issue.
**Fix:** Move the user-existence checks to the service-role admin client (already available in both files), or create a SECURITY DEFINER RPC that returns only a boolean.

#### 3. `claim_ghost_profile` only matches by email, not phone
The RPC matches `ghost_profiles.email = auth.email()`. Phone-only ghosts (WhatsApp flow) will never be auto-claimed. The diff creates a path where phone-detected users sign in but their ghosts stay orphaned.
**Fix:** Extend the RPC to also match `ghost_profiles.phone` against the user's phone, or ensure ghost creation always populates email when available from the endorsement request.

#### 4. No index on `users.phone`
Phone check does a sequential scan. Needs an index before WhatsApp flow goes live.
**Fix:** `CREATE INDEX users_phone_idx ON public.users(phone) WHERE phone IS NOT NULL;`

#### 5. `no_self_endorsement` constraint bypassed by NULL endorser_id
Ghost endorsements insert with `endorser_id = NULL`. PostgreSQL CHECK passes on NULL. A captain could self-endorse via the ghost flow. At claim time, if `claiming_user_id = recipient_id`, the constraint crashes.
**Fix:** Add a check in the API route that the ghost endorser is not the recipient. Add handling in the claim RPC for the case where `v_claiming_user_id = recipient_id`.

#### 6. `returnTo` vs `next` parameter inconsistency
The endorse page links to `/login?returnTo=/r/{token}`. The login page reads `returnTo` (works for password login). The auth callback reads `next` (used for PKCE/OAuth). If OAuth is ever enabled, the redirect breaks.
**Fix:** Standardise on one parameter name across login page and auth callback, or have the callback check both.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [x] No scope creep beyond lane file

### Recommendation
Send back to worker. Fix all 6 blockers, re-run type-check and drift-check, update the completion report with a "Review Fixes — Round 1" section.

---

### Round 3 — Re-review of Round 2 Fixes

**Verdict: BLOCK**

- Type-check: **PASS**
- Drift-check: **PASS**

#### Round 2 Blocker Verification

| # | Original Blocker | Status |
|---|-----------------|--------|
| 1 | Password login doesn't trigger ghost auto-claim | **RESOLVED** — middleware one-time claim via `yl_ghost_checked` cookie |
| 2 | Account enumeration via anon client | **RESOLVED** — switched to `createServiceClient()` in both endorse page and API route |
| 3 | `claim_ghost_profile` only matches by email | **RESOLVED** — RPC now fetches `v_claiming_phone` and matches `ghost_profiles.phone` |
| 4 | No index on `users.phone` | **RESOLVED** — partial index in migration `20260402000002` |
| 5 | Self-endorsement bypass via NULL endorser_id | **RESOLVED** — API guard + RPC Step A soft-delete |
| 6 | `returnTo` vs `next` parameter inconsistency | **RESOLVED** — auth callback checks both params |

All 6 original blockers resolved.

#### New Findings

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | HIGH | `middleware.ts:74` | Ghost claim RPC call is not wrapped in try-catch. A Supabase timeout or 5xx will crash middleware for all authenticated users. Known failure pattern from lessons-learned. | Wrap lines 74-75 in try-catch matching the `getUser()` pattern at lines 50-59 |
| 2 | MEDIUM | `middleware.ts:76-80` | `yl_ghost_checked` cookie has no `maxAge` — it's a session cookie. Claim RPC fires again every new browser session. Idempotent but unnecessary Supabase load at scale. | Add `maxAge: 60 * 60 * 24 * 365` to the cookie options |

### Recommendation
~~Send back to worker. Fix both items — both are in `middleware.ts`, 2-minute fix.~~

---

### Round 4 — Final Verification

**Verdict: PASS**

Both Round 3 findings verified resolved:
1. RPC call now wrapped in try-catch — matches `getUser()` error handling pattern
2. Cookie now has `maxAge: 60 * 60 * 24 * 365` (1 year)

Bonus: cookie sets outside the try-catch, so transient RPC failure doesn't cause repeated retries on subsequent navigations. Correct.

Lane 1 is clean. Ready to ship.
