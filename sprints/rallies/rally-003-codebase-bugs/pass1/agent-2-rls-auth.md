# Rally 003 — Agent 2: RLS & Auth Security Audit

**Date:** 2026-03-22
**Scope:** All migration files in `supabase/migrations/`, all routes in `app/api/`, public pages `app/(public)/u/[handle]/page.tsx`, and supporting libraries.

---

## Summary

The codebase has a generally solid auth posture: every API route calls `auth.getUser()` before proceeding, RLS is enabled on all tables, and the identity mapping is consistent (`auth.uid() = users.id` throughout — there is no separate `auth_user_id` column). However, several real issues were found ranging from a silent data corruption bug in account deletion, to analytics abuse, to a TOCTOU race on the CV-parse rate limiter.

---

## Finding 1 — Account Deletion References Non-Existent Column

**Severity:** HIGH
**File:** `app/api/account/delete/route.ts:83`
**Issue:** The account deletion handler calls `update({ deleted_at: ... })` on `endorsement_requests`, but that table has no `deleted_at` column. The migration that adds `deleted_at` to tables (sprint 8) only adds it to `users` — `endorsement_requests` never had this column added. The Supabase update will silently fail or throw, and since every step uses `await` without a success check, the subsequent step (deleting auth user) will still execute. The result is that `endorsement_requests` are NOT cleaned up on account deletion, leaving active deep-link tokens pointing to a deleted requester.

**Evidence:**
```ts
// app/api/account/delete/route.ts line 83-85
await admin.from('endorsement_requests')
  .update({ deleted_at: new Date().toISOString() })
  .eq('requester_id', user.id);
```
Cross-check: `endorsement_requests` schema in `20260313000003_core_tables.sql` has no `deleted_at` column. Sprint 8 migration `20260315000020_sprint8_launch_prep.sql` adds `deleted_at` only to `users`.

**Fix:** Either add `deleted_at` to `endorsement_requests` via a new migration and handle it in RLS, or replace the update with `update({ status: 'cancelled', cancelled_at: new Date().toISOString() })` which are columns that do exist. Also add explicit error checks after each admin operation in the deletion sequence so partial failures are surfaced.

---

## Finding 2 — Deleted Users Remain Fully Visible via Public RLS Read Policy

**Severity:** HIGH
**File:** `supabase/migrations/20260313000005_rls.sql:41–42`
**Issue:** The `users` table RLS policy is `USING (true)` — it allows anyone to read any row. Sprint 8 added a `deleted_at` column to `users` for GDPR soft-deletion, and the account deletion handler sets it. However, the public read policy was never updated to exclude soft-deleted users. A deleted user's anonymised row (with name `[Deleted User]` and handle `deleted-<id-prefix>`) is still returned by any `SELECT * FROM users` query, including the handle lookup on public profile pages and the endorsement display queries. More critically, contact data is nulled out but the row (including the derived handle and any linked endorsements) remains publicly enumerable.

**Evidence:**
```sql
-- 20260313000005_rls.sql line 41
create policy "users: public read"
  on public.users for select using (true);
```
```sql
-- 20260315000020_sprint8_launch_prep.sql line 5
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
```
No migration updates the read policy to add `AND deleted_at IS NULL`.

**Fix:** Replace the `users: public read` policy with `USING (deleted_at IS NULL)`. Add a separate service-role-only policy for admin lookups that need to see deleted accounts.

---

## Finding 3 — Unauthenticated Analytics Writes Accept Arbitrary user_id Values

**Severity:** HIGH
**File:** `supabase/migrations/20260313000005_rls.sql:163–166` and `supabase/migrations/20260315000018_sprint7_payments.sql:19–35`
**Issue:** The `profile_analytics` table has an insert policy `WITH CHECK (true)` — any unauthenticated caller can insert analytics events for any `user_id`. The `record_profile_event` function is a `SECURITY DEFINER` function also granted to `anon` with no validation of `p_user_id`. This means a malicious actor can:
1. Inflate any user's profile view count by repeatedly calling the RPC with a victim's `user_id`.
2. Trigger the analytics nudge email for a victim (since the cron job uses `analytics_nudge_sent = false` as a one-shot gate — once inflated counts trigger it, the flag is set and the real nudge is never sent).
3. Flood the analytics table with garbage data for any user.

The RPC is called directly from the server-side profile page render, so there is no rate limiting on it at the API layer.

**Evidence:**
```sql
-- 20260313000005_rls.sql line 164
create policy "analytics: public insert"
  on public.profile_analytics for insert
  with check (true);
```
```sql
-- 20260315000018_sprint7_payments.sql line 34-35
GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text, text, text) TO anon;
```

**Fix:** The `record_profile_event` function should verify that `p_user_id` references a real, non-deleted user. The `anon` grant is appropriate for tracking public profile views, but the insert policy should require `WITH CHECK (user_id IN (SELECT id FROM public.users WHERE deleted_at IS NULL))` rather than `true`. Consider adding a per-IP rate limit on the RPC via the PostgREST layer or moving the analytics write to a server-side API route with IP-based throttling.

---

## Finding 4 — CV Parse Rate Limiter is Subject to TOCTOU Race

**Severity:** MEDIUM
**File:** `supabase/migrations/20260315000017_sprint6_cv_storage.sql:70–102` and `app/api/cv/parse/route.ts:24–28`
**Issue:** The `check_cv_parse_limit` function reads the count, checks it, then updates it in two separate statements inside a `plpgsql` function. This is not wrapped in `SELECT ... FOR UPDATE` or any advisory lock. A user who fires two concurrent parse requests will both read the same `cv_parse_count_today` value (e.g., 2) simultaneously, both pass the `>= 3` check, both increment, ending up at 4 — one over the limit. On a serverless platform where concurrent invocations are common, this is exploitable to bypass the 3/day limit.

**Evidence:**
```sql
-- 20260315000017_sprint6_cv_storage.sql line 78-99
SELECT cv_parse_count_today, cv_parse_count_reset_at INTO v_count, v_reset_at FROM public.users WHERE id = p_user_id;
-- ... (no lock held between SELECT and UPDATE)
IF v_count >= 3 THEN RETURN false; END IF;
UPDATE public.users SET cv_parse_count_today = cv_parse_count_today + 1 WHERE id = p_user_id;
```

**Fix:** Add `FOR UPDATE` to the initial `SELECT` to acquire a row-level lock, or replace the check-then-increment logic with a single atomic `UPDATE ... RETURNING` using a `CASE` expression that only increments if under the limit and returns the new count.

---

## Finding 5 — Endorsement Request GET Endpoint Uses Client-Auth for a "Token-as-Credential" Route

**Severity:** MEDIUM
**File:** `app/api/endorsement-requests/[id]/route.ts:14–51`
**Issue:** The GET handler for `/api/endorsement-requests/:id` (used by the `/r/:token` deep link page) uses `createClient()` — the user-scoped Supabase client — to query `endorsement_requests` by token. The RLS policies on `endorsement_requests` only allow reads by the requester (`auth.uid() = requester_id`) or recipient (`auth.uid() = recipient_user_id` or `auth.email() = recipient_email`). An unauthenticated visitor following a deep link would have `auth.uid() = null`, so the RLS policy would block the read, and the endpoint would always return 404 for unauthenticated users — breaking the core deep-link endorsement flow.

The intention documented in migration 013 is that `get_endorsement_request_by_token()` (the `SECURITY DEFINER` RPC) should be used for this flow. The API route instead queries the table directly with the user-scoped client.

**Evidence:**
```ts
// app/api/endorsement-requests/[id]/route.ts line 21-22
const supabase = await createClient()
const { data: request, error } = await supabase
  .from('endorsement_requests')
  .select(`...`)
  .eq('token', token)
  .single()
```
The RLS policies never grant `anon` read access to `endorsement_requests` directly.

**Fix:** Replace the direct table query in the GET handler with a call to `supabase.rpc('get_endorsement_request_by_token', { p_token: token })`. This uses the existing SECURITY DEFINER function that was specifically built for this purpose and is already granted to `anon`.

---

## Finding 6 — Rate Limiting Fails Open on Redis Unavailability

**Severity:** MEDIUM
**File:** `lib/rate-limit/limiter.ts:43–45` and `lib/rate-limit/limiter.ts:60–63`
**Issue:** The rate limiter fails open in two scenarios: (1) if `REDIS_URL` is not set, and (2) if Redis throws any error during an `INCR` or `EXPIRE` call. In production, a Redis outage or misconfiguration removes all rate limiting for PDF generation (expensive), AI summary generation (OpenAI API calls), CV parsing (OpenAI API calls), and endorsement creation. An attacker who can cause Redis errors (e.g., via connection exhaustion) would bypass all rate limits. The fail-open is intentional for developer convenience but should not apply to expensive AI/PDF operations in production.

**Evidence:**
```ts
// lib/rate-limit/limiter.ts line 43-45
const redis = getRedis();
if (!redis) {
  return { allowed: true, remaining: limit, resetAt }; // fail open
}
// ...
} catch {
  return { allowed: true, remaining: limit, resetAt }; // fail open on any Redis error
}
```

**Fix:** For routes that call OpenAI or trigger PDF generation (`/api/cv/parse`, `/api/cv/generate-pdf`, `/api/profile/ai-summary`), fail closed on Redis errors rather than open. Add a `failOpen: boolean` option to `checkRateLimit` and pass `false` for expensive operations.

---

## Finding 7 — Cron Endpoints Use Optional Secret Verification

**Severity:** MEDIUM
**File:** `app/api/cron/analytics-nudge/route.ts:11–13` and `app/api/cron/cert-expiry/route.ts:11–13`
**Issue:** The cron secret check is guarded by `if (process.env.CRON_SECRET && ...)` — if `CRON_SECRET` is not set in the environment, the check is skipped entirely and the endpoint is publicly accessible. Both cron routes use the service client and execute sensitive operations: sending emails to users and reading/writing user subscription data. An unauthenticated GET request to these endpoints would trigger mass email sends and analytics writes.

**Evidence:**
```ts
// app/api/cron/analytics-nudge/route.ts line 11-13
const cronSecret = req.headers.get('authorization');
if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
If `CRON_SECRET` is absent, the `if` condition is falsy and the guard is never evaluated.

**Fix:** Invert the guard: `if (!process.env.CRON_SECRET || cronSecret !== \`Bearer ${process.env.CRON_SECRET}\`) { return 401 }`. This makes the secret mandatory in all environments. Set `CRON_SECRET` in Vercel environment variables with a cryptographically random value.

---

## Finding 8 — Public Profile Page Exposes Private Contact Fields Regardless of Visibility Toggles

**Severity:** MEDIUM
**File:** `app/(public)/u/[handle]/page.tsx:55–85`
**Issue:** The public profile page fetches the full user record via `getUserByHandle(handle)` and passes it to `PublicProfileContent`. The `users: public read` RLS policy allows reading all columns including `phone`, `whatsapp`, `email`, `location_country`, `location_city`. While the `show_phone`, `show_whatsapp`, `show_email`, `show_location` toggle columns exist, the enforcement of those toggles is in the component layer (`PublicProfileContent`) — not in the query or at the database level. If the component has any rendering bug, or if a client-side caller queries the `users` table directly (which is permitted by RLS), the private contact fields are exposed.

**Evidence:**
```ts
// app/(public)/u/[handle]/page.tsx line 45
const user = await getUserByHandle(handle)
// getUserByHandle returns all public columns including phone/email/etc.
// Visibility enforcement is delegated to the component.
```
The `users: public read` policy in `20260313000005_rls.sql` does not filter out contact fields.

**Fix:** Create a database view `public.user_public_profile` that only selects the safe public columns (excluding `phone`, `whatsapp`, `email` unconditionally, and including `location_country`/`location_city` only with a join condition against the visibility flags). Use this view for public profile queries. Alternatively, use column-level security or a `SECURITY DEFINER` function that applies the visibility filters server-side.

---

## Finding 9 — Signed URL Expiry is 3600 Seconds for User-Downloaded PDFs but Only 60 Seconds for Public CV Download

**Severity:** LOW
**File:** `app/api/cv/public-download/[handle]/route.ts:25` vs `app/api/cv/generate-pdf/route.ts:139` and `app/api/cv/download-pdf/route.ts:27`
**Issue:** The public CV download endpoint creates a signed URL with a 60-second expiry, then immediately issues an HTTP redirect to it. This is actually tighter than the private download (3600 seconds), which is correct for security. However, the 60-second window may be too short if the redirect chain involves slow intermediate hops or if the client follows the redirect slowly. More importantly, the private download endpoint returns the signed URL as a JSON body (`{ url: signedUrl }`), giving the client a URL that remains valid for a full hour — meaning anyone who obtains that URL (e.g., via browser history, logs, or referrer headers) can download the PDF for up to an hour after generation.

**Evidence:**
```ts
// app/api/cv/download-pdf/route.ts line 27
const { data: signedUrl } = await serviceClient.storage
  .from('pdf-exports')
  .createSignedUrl(profile.latest_pdf_path, 3600) // 1 hour
```
```ts
// app/api/cv/public-download/[handle]/route.ts line 25
const { data } = await serviceClient.storage.from(bucket).createSignedUrl(path, 60) // 1 minute
```

**Fix:** Reduce the private PDF signed URL expiry from 3600 to 300 seconds (5 minutes), which is sufficient for a user to complete a download while limiting the exposure window for leaked URLs. Consider streaming the PDF directly through the API route rather than returning a signed URL, which eliminates the exposure window entirely.

---

## Finding 10 — `endorsement_requests` Update Policy Allows Recipient to Cancel Requester's Request

**Severity:** LOW
**File:** `supabase/migrations/20260313000005_rls.sql:129–131`
**Issue:** The `endorsement_requests` update RLS policy uses `USING (auth.uid() = requester_id OR auth.uid() = recipient_user_id)`. This means a recipient can update any column on the request — not just status to "declined". A malicious recipient could, for example, update `recipient_email`, `yacht_id`, `requester_id`, or `expires_at`. In practice the API route for the `decline` action only sets `status` and `cancelled_at`, but if any future code path performs an update using the user-scoped client without tightly scoped column restrictions, the over-broad policy is a silent footgun.

**Evidence:**
```sql
-- 20260313000005_rls.sql line 129-131
create policy "endorsement_requests: own update"
  on public.endorsement_requests for update
  using (auth.uid() = requester_id or auth.uid() = recipient_user_id);
```
No column restriction is specified in the policy.

**Fix:** Split into two policies: one for the requester (full update) and one for the recipient (restricted to updating only `status` and `cancelled_at`). Alternatively, add a `WITH CHECK` clause that prevents modification of identity fields (`requester_id`, `yacht_id`, `recipient_email`, `recipient_user_id`, `token`) regardless of who is updating.

---

## Finding 11 — `yacht_near_miss_log` Has No Read Policy — Data is Not Accessible But Not Documented

**Severity:** LOW
**File:** `supabase/migrations/20260314000011_yacht_sprint4.sql:25–30`
**Issue:** `yacht_near_miss_log` has RLS enabled with only an `INSERT` policy (authenticated + `created_by = auth.uid()`). There are no SELECT, UPDATE, or DELETE policies. This means users cannot read back their own entries and the data is only accessible via service role. This is likely intentional (internal analytics), but it is undocumented in the migration comment, and the absence of a SELECT policy means the insert result cannot be queried by the app without a service client — which may cause silent failures if code ever tries to do so.

**Evidence:**
```sql
-- 20260314000011_yacht_sprint4.sql line 25-30
alter table public.yacht_near_miss_log enable row level security;
create policy "near_miss_log: own insert"
  on public.yacht_near_miss_log for insert
  to authenticated
  with check (created_by = auth.uid());
-- No SELECT policy
```

**Fix:** Add a comment in the migration explicitly noting that no read policy is intentional and this table is admin/service-role-only. If users should be able to read their own entries, add a `SELECT USING (auth.uid() = created_by)` policy.

---

## Finding 12 — `other_role_entries` and `other_cert_entries` Have Insert-Only Policies With No Ownership Binding

**Severity:** LOW
**File:** `supabase/migrations/20260313000005_rls.sql:28–34`
**Issue:** The insert policies for `other_role_entries` and `other_cert_entries` only check `auth.uid() is not null` — any authenticated user can insert any row. There is no `submitted_by` column or ownership field enforced in the `WITH CHECK`. There are no SELECT, UPDATE, or DELETE policies. The tables are reference tables for "other" free-text entries, so the lack of ownership may be intentional, but the absence of any anti-spam control means an authenticated user can flood these tables with garbage entries.

**Evidence:**
```sql
-- 20260313000005_rls.sql line 28-34
create policy "other_roles: authenticated insert"
  on public.other_role_entries for insert
  with check (auth.uid() is not null);

create policy "other_certs: authenticated insert"
  on public.other_cert_entries for insert
  with check (auth.uid() is not null);
```

**Fix:** Add a rate-limit check at the API layer for any route that inserts into these tables. Consider adding a `submitted_by` column and using it in the `WITH CHECK` clause to aid moderation. Add a SELECT policy (public read is probably appropriate, mirroring the parent `roles` and `certification_types` tables) so the app can query submitted entries.

---

## Tables Without RLS — Status Check

The following tables were checked and confirmed to have RLS enabled:

| Table | RLS Enabled | Policies Correct |
|-------|------------|-----------------|
| `departments` | Yes | Public read only |
| `roles` | Yes | Public read only |
| `certification_types` | Yes | Public read only |
| `templates` | Yes | Public read only |
| `other_role_entries` | Yes | Insert only (see Finding 12) |
| `other_cert_entries` | Yes | Insert only (see Finding 12) |
| `users` | Yes | Public read + own write (see Findings 2, 8) |
| `yachts` | Yes | Public read + authenticated create |
| `attachments` | Yes | Public read (non-deleted) + own write |
| `endorsements` | Yes | Public read (non-deleted) + coworker insert + own update |
| `endorsement_requests` | Yes | Requester/recipient read+write |
| `certifications` | Yes | Public read + own write |
| `profile_analytics` | Yes | Own read + open insert (see Finding 3) |
| `internal.flags` | Yes | No policies (service role only) |
| `yacht_near_miss_log` | Yes | Insert only (see Finding 11) |
| `user_photos` | Yes | Public read + own write |
| `user_gallery` | Yes | Public read + own write |
| `profile_folders` | Yes | Own read+write |
| `saved_profiles` | Yes | Own read+write |
| `user_hobbies` | Yes | Public read + own write |
| `user_education` | Yes | Public read + own write |
| `user_skills` | Yes | Public read + own write |

No tables found without RLS enabled.

---

## Notes on What Was NOT Found

- No IDOR vulnerabilities in the API routes: every mutating route uses `auth.getUser()` and scopes its DB queries to `user.id`. Routes using URL params as IDs (e.g., `[id]`) always add `.eq('user_id', user.id)` or equivalent.
- No `createServiceClient()` misuse: service client is used only for storage operations, account deletion, export, cron jobs, and Stripe webhook — all appropriate use cases.
- No missing auth checks: every route in `app/api/` calls `auth.getUser()` and returns 401 before proceeding. The exception is `/api/endorsement-requests/[id]` GET (intentionally public) and `/api/cv/public-download/[handle]` (intentionally public) and `/api/health/supabase` (health check).
- The `are_coworkers_on_yacht` function correctly uses `deleted_at IS NULL` so soft-deleted attachments do not count toward coworker eligibility.
- Stripe webhook correctly verifies the signature before processing.
- The `check_cv_parse_limit` race (Finding 4) is partially mitigated by the outer `applyRateLimit('fileUpload')` call which Redis-gates the route at 20/hour, limiting the practical impact of the TOCTOU.
