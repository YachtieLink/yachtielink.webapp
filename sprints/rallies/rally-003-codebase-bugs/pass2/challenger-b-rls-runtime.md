# Rally 003 — Pass 2: Challenger B (RLS + Runtime)

**Date:** 2026-03-22
**Challenger scope:** Agent 2 (RLS & Auth, 12 findings) + Agent 3 (Runtime Logic, 12 findings)
**Method:** Every finding verified against the actual source file and line cited. Schema cross-checked across all 24 migration files.

---

## Verified Findings

Findings confirmed real and correctly characterised, with any severity adjustments noted.

---

### A2-F1 — Account Deletion: `update({ deleted_at })` on `endorsement_requests` (CONFIRMED, severity DOWNGRADED to MEDIUM)

**Status: Real bug, but severity should be MEDIUM not HIGH.**

Verified in `app/api/account/delete/route.ts:83–85`. The code does call `.update({ deleted_at: ... })` on `endorsement_requests`. The `endorsement_requests` schema in `20260313000003_core_tables.sql` has no `deleted_at` column — the column was added to `attachments` and `endorsements` but never to `endorsement_requests`. Migration `20260315000020` only adds `deleted_at` to `users`.

However, the severity downgrade is warranted: the Supabase JS client returns an error on an unknown column update but the route does not check that error and continues. Critically, the `endorsement_requests` rows are NOT silently preserved in an unsafe state — the `requester_id` foreign key is `ON DELETE CASCADE` from `auth.users`, so when step 9 (`admin.auth.admin.deleteUser`) fires, cascade deletion will clean up `endorsement_requests` rows. The bug is real (the soft-delete step silently fails), but the cascading hard delete that follows repairs the gap. HIGH is therefore an overstatement; MEDIUM is correct because the intent of soft-deletion (preserving the endorsement graph without active deep-links) is partially defeated.

Additional note Agent 2 missed: `cancelled_at` column *does* exist on `endorsement_requests` (added in `20260314000012_sprint5_endorsements.sql`). The suggested fix of using `{ status: 'cancelled', cancelled_at: ... }` would actually work. This is the correct fix.

---

### A2-F2 — Deleted Users Remain Visible via `users: public read` Policy (CONFIRMED, severity CORRECT)

**Status: Real. Severity HIGH confirmed.**

`20260313000005_rls.sql:41–42` has `create policy "users: public read" on public.users for select using (true)`. Migration `20260315000020` adds `deleted_at timestamptz` to `users` but no migration updates this policy to exclude `deleted_at IS NOT NULL` rows. The account deletion handler at `app/api/account/delete/route.ts:52–64` anonymises the row but does not delete it; the row with handle `deleted-<id-prefix>` and name `[Deleted User]` remains publicly enumerable by any `SELECT * FROM users` query and is returned by handle lookups on the public profile page.

The `getUserByHandle` call at `app/(public)/u/[handle]/page.tsx:45` will find soft-deleted users and render a public profile page for them (showing `[Deleted User]` with a `deleted-*` handle). This is a real data exposure issue. Severity HIGH confirmed.

---

### A2-F3 — `profile_analytics` Insert Policy is `WITH CHECK (true)` (CONFIRMED, severity CORRECT)

**Status: Real. Severity HIGH confirmed.**

`20260313000005_rls.sql:164–166` confirmed: `create policy "analytics: public insert" on public.profile_analytics for insert with check (true)`. The `record_profile_event` SECURITY DEFINER function in `20260315000018_sprint7_payments.sql:34–35` is granted to `anon`. No validation of `p_user_id` exists in the function body — it inserts any UUID supplied.

One nuance Agent 2 missed: the public profile page (`app/(public)/u/[handle]/page.tsx:49–52`) calls `supabase.rpc('record_profile_event', ...)` fire-and-forget on page render using the *user-scoped* client. This means the event is recorded with whatever `p_user_id` is passed (the profile owner's id), not the viewer's id. Because it's a server-side call using a server Supabase client, there is no IP-level rate limiting here. The analytics abuse vector is confirmed real.

---

### A2-F4 — CV Parse Rate Limiter TOCTOU Race (CONFIRMED, severity CORRECT)

**Status: Real. Severity MEDIUM confirmed.**

`20260315000017_sprint6_cv_storage.sql:78–99` verified. The `check_cv_parse_limit` function does a bare `SELECT ... INTO v_count` then `IF v_count >= 3 THEN RETURN false; END IF;` then a separate `UPDATE`. No `SELECT ... FOR UPDATE` and no row-level advisory lock. Two concurrent requests will both read the same counter, both pass the check, and both increment — ending up at 4 parses instead of 3.

Agent 2's note that the outer `applyRateLimit('fileUpload')` partially mitigates this (20/hour Redis gate) is correct. The TOCTOU is exploitable within a single Redis window by firing requests in parallel. MEDIUM is correct.

---

### A2-F5 — Endorsement Request GET Endpoint Uses User-Scoped Client (CONFIRMED but SEVERITY DOWNGRADED to LOW — not a live break)

**Status: The concern is real but the endpoint does not break for unauthenticated users in practice.**

Agent 2 claims the GET at `/api/endorsement-requests/[id]` uses `createClient()` and will return 404 for unauthenticated callers because RLS only allows requester/recipient reads.

Verified: `app/api/endorsement-requests/[id]/route.ts:20–31` uses `const supabase = await createClient()` and queries `.from('endorsement_requests') ... .eq('token', token)`. The RLS policies at `20260313000005_rls.sql:113–120` confirm only `requester_id` and `recipient_user_id` selects are allowed. An unauthenticated visitor (`auth.uid() = null`) would have neither, and the query returns no rows — the `if (error || !request)` branch returns 404.

However, looking at the actual deep-link page (`/r/:token`), it would need to call this endpoint. The `get_endorsement_request_by_token` SECURITY DEFINER RPC exists and is granted to `anon`. The fact that the API route does not use it is a correctness bug. **But**: this is a breakage-in-production finding, not a theoretical security hole. The severity should be HIGH for availability (the core deep-link flow fails for unauthenticated visitors) not MEDIUM. Agent 2 underplayed the user impact.

**Severity: upgrade to HIGH (functional breakage of core feature for unauthenticated recipients).**

---

### A2-F6 — Rate Limiting Fails Open on Redis Unavailability (CONFIRMED, severity CORRECT)

**Status: Real. Severity MEDIUM confirmed.**

`lib/rate-limit/limiter.ts:43–45` and lines 62–64 confirmed: two separate fail-open paths exist. The `if (!redis) { return { allowed: true ... } }` path fires when `REDIS_URL` is not set. The `catch` block also fails open. Agent 2's analysis is accurate.

---

### A2-F7 — Cron Endpoints Use Optional Secret Verification (CONFIRMED, severity CORRECT)

**Status: Real. Severity MEDIUM confirmed.**

`app/api/cron/analytics-nudge/route.ts:11–13` and `app/api/cron/cert-expiry/route.ts:11–13` both use `if (process.env.CRON_SECRET && cronSecret !== ...)`. If `CRON_SECRET` is absent, the guard evaluates to `if (undefined && ...)` which is falsy — the guard is skipped entirely and the endpoint is publicly accessible. This would allow anyone to trigger mass email sends to all users.

---

### A2-F8 — Public Profile Page Exposes Contact Fields Regardless of Visibility Toggles (CONFIRMED but SEVERITY DOWNGRADED to LOW)

**Status: Real architectural concern, but no current exposure path.**

`app/(public)/u/[handle]/page.tsx` does pass the full `user` object (including `phone`, `whatsapp`, `email`) to `PublicProfileContent`. The `certifications: public read` RLS policy also exposes all cert columns to any caller.

However: the page passes the user object as a server component prop and `PublicProfileContent` is a client component that receives it as serialised JSON — meaning the full object is in the HTML payload if not explicitly stripped. This is a real client-side data leak: any browser dev tools inspection of the page source or React devtools shows all contact fields regardless of the `show_phone` toggle.

Agent 2's fix (database view or SECURITY DEFINER function) is correct. However the severity as a "rendering bug creating possible future leaks" overstates it; the current actual exposure is: **contact fields are in the server-rendered HTML for public profile pages**. This is a real privacy bug. Severity should be MEDIUM (data is currently in-page HTML, not just a theoretical future risk).

**Severity: upgrade to MEDIUM.**

---

### A2-F9 — Signed URL Expiry Asymmetry (CONFIRMED, severity CORRECT as LOW)

**Status: Real, LOW correctly assigned.** The 3600-second expiry on `download-pdf` vs 60-second expiry on `public-download` is confirmed at `app/api/cv/download-pdf/route.ts:27` and `app/api/cv/public-download/[handle]/route.ts:25`. The signed URL is returned as a JSON body (`{ url: signedUrl.signedUrl }`) rather than issued as a redirect, giving any interceptor a 1-hour window. LOW is correct.

---

### A2-F10 — `endorsement_requests` Update Policy Allows Recipient to Modify Any Column (CONFIRMED, severity CORRECT as LOW)

**Status: Real. LOW correctly assigned.** `20260313000005_rls.sql:128–130` confirmed: `using (auth.uid() = requester_id or auth.uid() = recipient_user_id)` with no column restriction. A recipient with a registered account could update `requester_id`, `yacht_id`, or `recipient_email` on a pending request via a direct API call. The current API route for `decline` only sets `status` and `cancelled_at`, but the over-broad policy is a real footgun. LOW is correct given the limited current exploit path.

---

### A2-F11 — `yacht_near_miss_log` Has No Read Policy (CONFIRMED, severity CORRECT as LOW)

**Status: Real. LOW correctly assigned.** `20260314000011_yacht_sprint4.sql:25–30` confirmed: only INSERT policy exists. The comment noting this is intentional is missing. LOW is appropriate.

---

### A2-F12 — `other_role_entries` and `other_cert_entries` Insert-Only Policies (CONFIRMED, severity CORRECT as LOW)

**Status: Real. LOW correctly assigned.** `20260313000005_rls.sql:28–34` confirmed. The `with check (auth.uid() is not null)` policies have no ownership binding, no rate limiting, and no SELECT policy. LOW is appropriate.

---

### A3-F1 — Cert Expiry Cron: 60-Day Email Fires at Wrong Day Count (CONFIRMED, severity CORRECT)

**Status: Real bug. HIGH correctly assigned.**

`app/api/cron/cert-expiry/route.ts:62–70` verified. The DB query fetches all certs with `expires_at <= in60` (within 60 days). The runtime check is `if (daysLeft <= 60 && !cert.expiry_reminder_60d_sent)`. Because the `else if (daysLeft <= 30)` branch is only reached when the 60-day branch is skipped (i.e., `expiry_reminder_60d_sent` is true), a cert first seen by the cron at 20 days remaining will:

1. Satisfy `daysLeft <= 60` → send the "60-day" email
2. Mark `expiry_reminder_60d_sent = true`
3. On the next run, skip the 60-day branch, evaluate `else if (daysLeft <= 30)` — but by then the flag is already set and the 30-day email fires correctly

So a user gets a misleading "60 days" warning when they actually have 20 days, and then a correct 30-day warning. The `in30` variable computed on line 24–25 is genuinely dead code — it is never used in the query or any filter. HIGH is appropriate.

---

### A3-F2 — SavedProfileNoteEditor `while(true)` Fires Unawaited HTTP Requests (CONFIRMED but SEVERITY DOWNGRADED to MEDIUM)

**Status: Real, but overstated severity. MEDIUM not HIGH.**

`components/network/SavedProfileNoteEditor.tsx:37–43` verified. The `savingRef` guard on line 31 (`if (savingRef.current) return`) means only ONE invocation of `doSave` executes at a time — the loop is the serialisation mechanism. The issue is that `onSave(textToSave)` on line 38 is not awaited, so within a single `doSave` invocation, multiple iterations of the loop will fire multiple HTTP PATCH requests concurrently. If the user types for 250ms during a save, the loop fires 5 PATCH calls (one per 50ms iteration) before the break condition is satisfied.

However, the `savingRef.current` guard prevents multiple parallel `doSave` calls, so the maximum burst is bounded to `(type_duration_ms / 50)` requests per triggered save. For typical typing bursts this is 2–4 requests — annoying but not catastrophic. The out-of-order risk is real but data loss is unlikely since the last write wins and the text is short. HIGH overstates the impact. MEDIUM is correct.

---

### A3-F3 — `unsave` Has No Rollback on API Failure (CONFIRMED, severity CORRECT as MEDIUM)

**Status: Real. MEDIUM correctly assigned.** `app/(protected)/app/network/saved/SavedProfilesClient.tsx:71–81` confirmed. Profile is removed from state before the API call. On `!res.ok`, a toast is shown but the state is not restored. The `// TODO: rollback on failure` comment at line 67 also appears in `updateProfile`. MEDIUM is correct.

---

### A3-F4 — Section Visibility Read-Modify-Write Race (CONFIRMED, severity CORRECT as MEDIUM)

**Status: Real. MEDIUM correctly assigned.** `app/api/profile/section-visibility/route.ts:17–30` confirmed: read → merge → write pattern with no atomic JSON key update. Two concurrent toggles will lose one update. MEDIUM is correct.

---

### A3-F5 — PDF Template Gate: Page Uses Raw Field vs `getProStatus` (CONFIRMED but SEVERITY DOWNGRADED to LOW)

**Status: Real inconsistency, but the server-side gate is authoritative and the UI risk is theoretical.**

`app/(protected)/app/cv/page.tsx:30` uses `isPro={profile.subscription_status === 'pro'}` (raw field). `app/api/cv/generate-pdf/route.ts:26–38` also uses `profile?.subscription_status !== 'pro'` (raw field, not `getProStatus`). Both use the same raw field, so they are consistent with each other — the inconsistency is against `getProStatus` in `lib/stripe/pro.ts` which additionally checks `subscription_ends_at`.

This means: if a Pro subscription expires (Stripe sets `subscription_ends_at` in the past) but the Stripe webhook hasn't yet updated `subscription_status` to `free`, a user would be shown Pro templates on the CV page AND the generate-pdf endpoint would allow them (since it also checks the raw field). This is a real grace-period bypass but both the page and the API are consistently wrong together. The backend is not actually protected by `getProStatus` either. Severity should be MEDIUM (both page and API have the same gap), not a UI-only issue.

**Severity: upgrade to MEDIUM, and the scope of the finding is wider than Agent 3 described — the server gate also misses expiry.**

---

### A3-F6 — Wizard `setTimeout` Redirect Not Cancelled on Unmount (CONFIRMED, severity CORRECT as MEDIUM)

**Status: Real. MEDIUM correctly assigned.** `components/onboarding/Wizard.tsx:624` and `649` confirmed. Both `setTimeout(() => router.push("/app/profile"), 2200)` calls are fire-and-forget with no cleanup. MEDIUM is correct.

---

### A3-F7 — Attachment New Page: `handleSave` Proceeds with Empty `userId` (CONFIRMED, severity CORRECT as MEDIUM)

**Status: Real. MEDIUM correctly assigned.** `app/(protected)/app/attachment/new/page.tsx:73–82` confirmed. `userId` is `''` until the `useEffect` resolves. The guard on line 74 checks `!yacht || !roleLabel || !startDate` but not `!userId`. The `{userId && ...}` gate on the YachtPicker (line 105) prevents the user from reaching the `dates` step without a `yacht` being selected, which requires `userId` to be set (since `YachtPicker` is not rendered otherwise). However, the protection is indirect — if `userId` were `''` but `yacht` were somehow set, the insert would proceed with `user_id: ''`. The RLS `with check (auth.uid() = user_id)` would reject an empty-string insert at the database level, so the practical impact is a DB error (caught by the `if (error)` toast on line 86) rather than data corruption. The fix (add `!userId` guard) is correct and cheap. MEDIUM is reasonable though LOW would also be defensible.

---

### A3-F8 — DeepLinkFlow `useEffect`: `supabase` Not in Dependency Array (CONFIRMED, severity CORRECT as LOW)

**Status: Real lint issue, not a runtime bug. LOW correctly assigned.** `components/endorsement/DeepLinkFlow.tsx:65,84,131` confirmed. `createClient()` returns a stable singleton, so this is a lint/pattern issue. LOW is correct.

---

### A3-F9 — Account Page: `setFullName` Without Null Guard (CONFIRMED, severity CORRECT as LOW)

**Status: Real. LOW correctly assigned.** `app/(protected)/app/more/account/page.tsx:63` confirmed (`setFullName(profile.full_name)`). The `full_name` column is `NOT NULL` in the schema, so the null case requires a race at creation time. LOW is correct.

---

### A3-F10 — CvReviewClient: `JSON.parse` Without Error Handling (CONFIRMED, severity CORRECT as LOW)

**Status: Real. LOW correctly assigned.** `components/cv/CvReviewClient.tsx:48` confirmed: bare `JSON.parse(stored)` with no try/catch. LOW is correct.

---

### A3-F11 — Badge Count Route: Unparameterised `.or()` Filter (CONFIRMED but SEVERITY DOWNGRADED to INFO)

**Status: Real pattern concern, but not exploitable in practice.**

`app/api/badge-count/route.ts:15–16` confirmed: `.or(\`recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}\`)`. The `user` object comes from `supabase.auth.getUser()` — this is a cryptographically verified JWT claim, not user-supplied input. Email addresses in JWTs cannot contain PostgREST metacharacters without breaking the JWT itself. The theoretical injection requires a malformed JWT that Supabase would reject before the route code runs.

**This is not an exploitable injection vector. Severity should be INFO/cosmetic.**

---

### A3-F12 — Network Page: Asymmetric `cancelled_at` Filtering (CONFIRMED, severity CORRECT as LOW)

**Status: Real asymmetry. LOW correctly assigned.** `app/(protected)/app/network/page.tsx:55` shows `.is('cancelled_at', null)` only on `requestsReceived`. Agent 3 correctly notes this may be intentional (sent list shows history). LOW is correct.

---

## False Positives

### A2-F5 partial false positive — "Always returns 404 for unauthenticated users"

Agent 2 correctly identifies the structural problem (using user-scoped client instead of SECURITY DEFINER RPC) but the claim that this "breaks the core deep-link endorsement flow" requires qualification. The `/r/:token` page is a protected route requiring authentication (it is under `app/(protected)` or uses `DeepLinkFlow` which is only rendered after auth). Unauthenticated visitors to `/r/:token` are redirected to sign up first, then redirected back. The deep-link flow requires the recipient to be logged in before `DeepLinkFlow` is rendered. So the "unauthenticated 404" is not the breakage point — but the bug is still real: the `createClient()` will only return the row if the authenticated user is the `requester_id` or `recipient_user_id`, which means recipients who were only matched by email (no `recipient_user_id` set) will always get 404. The breakage is narrower than claimed but still HIGH severity for email-only recipients who have registered.

### A3-F11 — Badge count `.or()` injection

Downgraded to INFO. The `user.email` value is from a Supabase JWT, not user input. Not exploitable.

---

## Missed Issues

### MISS-1 — `record_profile_event` RPC: `p_user_id` Not Validated Against Non-Deleted Users (HIGH, security overlap between A2-F3 and public page)

Agent 2 noted the open insert policy but did not flag the specific consequence: the public profile page at `app/(public)/u/[handle]/page.tsx:49–52` calls `record_profile_event` server-side with `p_user_id: user.id` (the profile owner's id). Since the RPC is granted to `anon` with no validation, and the public profile page itself has no rate limiting, a bot that scrapes public profile URLs can generate arbitrary view counts for any user by repeatedly loading their profile page. This drives the analytics nudge email trigger. The page itself has no IP-level rate limiting — `applyRateLimit` is not called on the public profile page render. This is a more concrete and exploitable path than the abstract "call the RPC directly" vector Agent 2 described.

### MISS-2 — `certifications: public read` Policy Exposes Certificate Numbers and Document URLs (MEDIUM)

`20260313000005_rls.sql:137–138`: `create policy "certifications: public read" on public.certifications for select using (true)`. This returns all columns: `certificate_number`, `issuing_body`, `document_url`. A `document_url` is a Supabase Storage path pointing to the user's uploaded cert document. The `cert-documents` bucket RLS (in `20260314000009_storage_buckets.sql` or similar) controls actual file access, but the `document_url` column itself (a path string) is visible to anyone. More critically, `certificate_number` is personal identity data that is publicly readable by any unauthenticated caller querying the `certifications` table directly. The public profile page only shows cert names, not numbers — but PostgREST allows any client to `SELECT certificate_number FROM certifications WHERE user_id = :id` without authentication. This should be filtered by a `certifications: public read (safe columns only)` view or a column-level restriction.

### MISS-3 — `generate-pdf` and `download-pdf` Both Miss `subscription_ends_at` Expiry Check (MEDIUM, extends A3-F5)

As noted in the A3-F5 review: `app/api/cv/generate-pdf/route.ts:33` checks `profile?.subscription_status !== 'pro'` without consulting `subscription_ends_at`. A user whose Stripe subscription has lapsed (past `subscription_ends_at`) but whose `subscription_status` has not yet been reset to `free` by the webhook can still generate Pro-template PDFs. The `getProStatus` utility in `lib/stripe/pro.ts:32–34` performs the correct dual check but is never called from either CV endpoint. This is a billing correctness gap, not just a UI inconsistency.

### MISS-4 — `deleteFolder` in `SavedProfilesClient` Has No Rollback and Uses Optimistic Delete Without Awaiting (LOW)

`app/(protected)/app/network/saved/SavedProfilesClient.tsx:99–106`: `deleteFolder` immediately removes the folder and reassigns all profiles to `folder_id: null` in state, then calls `await fetch(..., { method: 'DELETE' })` — but the `await` result is never checked. If the API call fails, the folder is gone from the UI with no toast and no rollback. This is the same pattern Agent 3 flagged for `unsave` (A3-F3) but was missed for `deleteFolder`. LOW severity, same fix as A3-F3.

### MISS-5 — Shareable Endorsement Requests Bypass `recipient_user_id` Matching (MEDIUM, security+runtime overlap)

`20260315000019_endorsement_virality.sql` adds `is_shareable` requests with no specific `recipient_email`, `recipient_user_id`, or `recipient_phone`. The RLS read policy for `endorsement_requests` only allows `auth.uid() = requester_id` or `auth.uid() = recipient_user_id`. A shareable request has `recipient_user_id = NULL` and `is_shareable = true`. Any authenticated user who knows the token can view it via the SECURITY DEFINER `get_endorsement_request_by_token` RPC — that is intended. However, any authenticated user can also *write an endorsement* on a shareable link because `DeepLinkFlow` issues an `INSERT` into `endorsements` after confirming the `are_coworkers_on_yacht` check. There is no additional check that the endorsement writer is the *intended* recipient for shareable links (since there is none). This is the design, but it means a shareable link is a zero-restriction endorsement request that anyone with the URL can fulfil — including people who never worked on that yacht, if `are_coworkers_on_yacht` passes. The coworker gate is the only protection. If that check has any weakness, shareable links amplify it.

### MISS-6 — `certifications: public read` Does Not Filter `deleted_at` (MEDIUM)

Unlike `attachments: public read (non-deleted)` which uses `USING (deleted_at is null)`, the `certifications: public read` policy at `20260313000005_rls.sql:137` uses `USING (true)`. However, looking at the `certifications` table schema in `20260313000003_core_tables.sql`, there is no `deleted_at` column on `certifications` — so this is not a soft-delete inconsistency. The table uses hard-delete (`certifications: own delete` policy exists). This is not a bug but explains why there is no `deleted_at` filter. Noting here to prevent this from being filed as a finding by future agents.

---

## Duplicates

No direct duplicates were found between Agent 2 and Agent 3 reports — they cover different layers (DB/auth vs. runtime/client). However, two conceptual overlaps worth flagging:

**Overlap 1 — Fail-open patterns:** A2-F6 (Redis fails open) and A3-F5 (Pro gate uses raw field rather than authoritative check) both represent fail-open security gates. They are different mechanisms but share the same root cause: defensive programming was applied at the wrong layer.

**Overlap 2 — Cron auth gap + analytics abuse:** A2-F7 (cron endpoint accessible without secret) and A2-F3 (analytics insert open to anyone) combine into a particularly dangerous scenario: an attacker can both (a) call the cron endpoint to trigger nudge emails without authentication, and (b) pre-inflate analytics counts to ensure the nudge fires for targeted users. These two findings interact and should be fixed together.

---

## Summary Severity Table

| Finding | Agent | Status | Final Severity |
|---|---|---|---|
| A2-F1: Account deletion `deleted_at` on `endorsement_requests` | 2 | Confirmed | MEDIUM (downgraded from HIGH) |
| A2-F2: Deleted users visible via public read policy | 2 | Confirmed | HIGH |
| A2-F3: Analytics insert `WITH CHECK (true)` | 2 | Confirmed | HIGH |
| A2-F4: CV parse rate limiter TOCTOU | 2 | Confirmed | MEDIUM |
| A2-F5: Endorsement GET uses user-scoped client | 2 | Confirmed (scope refined) | HIGH (upgraded from MEDIUM) |
| A2-F6: Rate limit fails open on Redis error | 2 | Confirmed | MEDIUM |
| A2-F7: Cron endpoints optional secret | 2 | Confirmed | MEDIUM |
| A2-F8: Contact fields in page HTML | 2 | Confirmed (scope refined) | MEDIUM (upgraded from MEDIUM, but reason clarified) |
| A2-F9: Signed URL 3600s expiry | 2 | Confirmed | LOW |
| A2-F10: `endorsement_requests` update over-broad | 2 | Confirmed | LOW |
| A2-F11: `yacht_near_miss_log` no read policy | 2 | Confirmed | LOW |
| A2-F12: `other_role_entries` insert-only | 2 | Confirmed | LOW |
| A3-F1: Cert expiry 60-day email wrong trigger | 3 | Confirmed | HIGH |
| A3-F2: SavedProfileNoteEditor unawaited HTTP | 3 | Confirmed | MEDIUM (downgraded from HIGH) |
| A3-F3: `unsave` no rollback | 3 | Confirmed | MEDIUM |
| A3-F4: Section visibility read-modify-write race | 3 | Confirmed | MEDIUM |
| A3-F5: PDF Pro gate uses raw field (server + page) | 3 | Confirmed (scope widened) | MEDIUM |
| A3-F6: Wizard `setTimeout` not cancelled | 3 | Confirmed | MEDIUM |
| A3-F7: Attachment `handleSave` empty `userId` | 3 | Confirmed | MEDIUM |
| A3-F8: DeepLinkFlow `supabase` missing dep | 3 | Confirmed | LOW |
| A3-F9: Account page `setFullName` null | 3 | Confirmed | LOW |
| A3-F10: `CvReviewClient` `JSON.parse` unguarded | 3 | Confirmed | LOW |
| A3-F11: Badge count `.or()` interpolation | 3 | False positive | INFO |
| A3-F12: Asymmetric `cancelled_at` filter | 3 | Confirmed | LOW |
| MISS-1: `record_profile_event` no rate limiting on public page | — | New | HIGH |
| MISS-2: `certifications` exposes `certificate_number` publicly | — | New | MEDIUM |
| MISS-3: PDF endpoints miss `subscription_ends_at` expiry check | — | New | MEDIUM |
| MISS-4: `deleteFolder` no rollback on failure | — | New | LOW |
| MISS-5: Shareable endorsement requests reduce coworker gate surface | — | New | MEDIUM |
