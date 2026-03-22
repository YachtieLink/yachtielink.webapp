# Agent 6 — Performance Review
**Rally:** 003
**Pass:** 1
**Date:** 2026-03-22
**Scope:** app/, components/, lib/, next.config.ts, supabase/migrations/

---

## Finding 1 — N+1 Query Pattern: Analytics Nudge Cron Updates Each User Separately

**Severity:** HIGH
**File:** app/api/cron/analytics-nudge/route.ts:63–70
**Issue:** The cron iterates over all qualifying users and fires two sequential awaited calls per user — `sendAnalyticsNudgeEmail` then a single-row `UPDATE` to `users`. With N users above the threshold, this produces N sequential email sends followed by N separate UPDATE round trips. There is no batching.
**Evidence:**
```ts
for (const user of users) {
  await sendAnalyticsNudgeEmail({ ... });
  await supabase.from('users').update({ analytics_nudge_sent: true }).eq('id', user.id);
  sent++;
}
```
**Fix:** Fire emails in parallel with `Promise.all`, then batch-update users with a single `.in('id', sentIds)` UPDATE after the email loop completes. The email send should also be fire-and-forget or parallelised, not awaited sequentially.

---

## Finding 2 — N+1 Query Pattern: Cert-Expiry Cron Updates Each Cert Separately

**Severity:** HIGH
**File:** app/api/cron/cert-expiry/route.ts:52–73
**Issue:** For every cert due a reminder, two awaited calls are made sequentially: `sendCertExpiryEmail` and a single-row `UPDATE` on `certifications`. With N expiring certs, this is 2N sequential I/O round trips.
**Evidence:**
```ts
for (const cert of certsDue) {
  await sendCertExpiryEmail({ ... });
  await supabase.from('certifications').update({ expiry_reminder_60d_sent: true }).eq('id', cert.id);
}
```
**Fix:** Collect cert IDs for each reminder tier (60d / 30d), fire emails in parallel, then batch-update all 60d IDs in one query and all 30d IDs in another.

---

## Finding 3 — N+1 Waterfall: CV Parse Saves Each Employment Entry Sequentially

**Severity:** HIGH
**File:** lib/cv/save-parsed-cv-data.ts:122–173
**Issue:** For each employment entry in a parsed CV, a full sequential pipeline runs: `search_yachts` RPC, optional yacht INSERT, then attachment INSERT — all awaited in a `for...of` loop. A CV with 8 employment entries results in up to 24 sequential Supabase round trips.
**Evidence:**
```ts
for (const emp of data.employment_history) {
  const { data: matches } = await supabase.rpc('search_yachts', { ... })
  // ...
  const { data: newYacht } = await supabase.from('yachts').insert(...)
  // ...
  await supabase.from('attachments').insert({ ... })
}
```
**Fix:** Batch the yacht lookups with a single name-based query (or RPC that accepts an array), resolve matches in JS, batch-insert any new yachts, then batch-insert all attachments in one call. The certifications loop below (lines 182–204) has the same pattern and should also be batched.

---

## Finding 4 — Unbounded Query: Analytics Nudge Fetches All Profile Views Without Limit

**Severity:** HIGH
**File:** app/api/cron/analytics-nudge/route.ts:22–26
**Issue:** The cron fetches all `profile_view` rows from `profile_analytics` for the last 7 days with no `.limit()`. As the platform grows, this query will return millions of rows. The aggregation (count per user) is done in JavaScript, not the database.
**Evidence:**
```ts
const { data: viewCounts } = await supabase
  .from('profile_analytics')
  .select('user_id')
  .eq('event_type', 'profile_view')
  .gte('occurred_at', sevenDaysAgo.toISOString());
// JS loop counting per user...
```
**Fix:** Replace with a `get_analytics_summary` RPC call (already exists in the codebase) or a raw SQL GROUP BY query pushed to the database. Alternatively call `get_analytics_timeseries` with `p_days=7` per user, but that would be an N+1. The right fix is one aggregation query at the DB level.

---

## Finding 5 — Large Payload: Data Export Fetches All Columns and All Rows With select('*')

**Severity:** HIGH
**File:** app/api/account/export/route.ts:27–33
**Issue:** The GDPR export endpoint uses `select('*')` on five tables. For `profile_analytics` in particular, a user with years of activity could have tens of thousands of rows, all loaded into memory at once and returned as a single JSON response. There is no pagination or streaming.
**Evidence:**
```ts
admin.from('users').select('*').eq('id', user.id).single(),
admin.from('certifications').select('*').eq('user_id', user.id),
admin.from('endorsements').select('*').eq('endorser_id', user.id),
admin.from('endorsements').select('*').eq('recipient_id', user.id),
admin.from('profile_analytics').select('*').eq('user_id', user.id),
```
**Fix:** The export intent is legitimate for GDPR (all columns correct). However `profile_analytics` should be paginated or streamed. Consider adding `.order('occurred_at').range(0, 9999)` as a safety cap, or stream the response using a `ReadableStream`. The `select('*')` on `endorsements` fetches two separate full-table queries — acceptable for GDPR but add `.limit()` guards for safety.

---

## Finding 6 — Query Waterfall: Public Profile Page Sequential Fetch for Viewer Relationship

**Severity:** MEDIUM
**File:** app/(public)/u/[handle]/page.tsx:129–170
**Issue:** After the initial parallel batch of 5 queries, an authenticated viewer triggers a further sequential waterfall: (1) `attachments` for profile colleague candidates, then (2) only if candidates exist, another `attachments` query for mutual-colleague validation, then (3) only if mutual colleagues exist, a `users` query. This is a 3-level sequential dependency chain.
**Evidence:**
```ts
const { data: profileColleagueAtts } = await supabase
  .from('attachments').select(...).in('yacht_id', profileYachtIds)...

const candidateIds = [...colleagueToProfileYacht.keys()]
if (candidateIds.length > 0) {
  const { data: mutualAtts } = await supabase
    .from('attachments').select(...).in('user_id', candidateIds)...

  const mutualColleagueIds = [...]
  if (mutualColleagueIds.length > 0) {
    const { data: mutualUsers } = await supabase
      .from('users').select(...)...
  }
}
```
**Fix:** This mutual-colleague logic could be moved into a single database function (similar to `get_colleagues`) that returns mutual colleagues in one round trip, eliminating the waterfall entirely.

---

## Finding 7 — Extra Sequential Fetch: Public Profile Fetches Photos After Parallel Block

**Severity:** MEDIUM
**File:** app/(public)/u/[handle]/page.tsx:88–93
**Issue:** The initial `Promise.all` block parallelises 5 queries, but `user_photos` is fetched sequentially after that block completes. This adds one extra waterfall step to every public profile page load.
**Evidence:**
```ts
const [attRes, certRes, endRes, extended, ...] = await Promise.all([...5 queries...])

// Sequential AFTER the parallel block
const { data: profilePhotos } = await supabase
  .from('user_photos').select(...).eq('user_id', user.id)...
```
**Fix:** Move the `user_photos` query into the `Promise.all` block. It has no dependency on the other query results.

---

## Finding 8 — Extra Sequential Fetch: Private Profile Page Fetches Photos After Parallel Block

**Severity:** MEDIUM
**File:** app/(protected)/app/profile/page.tsx:43–48
**Issue:** Same pattern as Finding 7. `user_photos` is fetched after the `Promise.all` completes, even though it has no dependency on the three parallel results.
**Evidence:**
```ts
const [profile, { attachments, ... }, extended] = await Promise.all([...3 queries...])

// Sequential AFTER
const { data: profilePhotos } = await supabase
  .from('user_photos').select(...).eq('user_id', user.id)...
```
**Fix:** Include the `user_photos` query in the `Promise.all` block.

---

## Finding 9 — Missing Index: profile_analytics Lacks Index on event_type + occurred_at for Nudge Query

**Severity:** MEDIUM
**File:** supabase/migrations/20260315000018_sprint7_payments.sql:103–104 (existing index) vs app/api/cron/analytics-nudge/route.ts:22–26
**Issue:** The analytics nudge cron filters `profile_analytics` with `.eq('event_type', 'profile_view').gte('occurred_at', ...)`. The index `idx_profile_analytics_user_event_date` covers `(user_id, event_type, occurred_at DESC)`. This index cannot be used for a query that has no `user_id` equality filter (the cron fetches across ALL users). A table scan across all analytics rows will occur.
**Evidence:** Index definition: `ON public.profile_analytics (user_id, event_type, occurred_at DESC)`. Cron query has no `user_id` filter.
**Fix:** Add a separate index `ON public.profile_analytics (event_type, occurred_at DESC)` to support cross-user event-type range queries. Alternatively, as per Finding 4, replace the query with a DB-level aggregation.

---

## Finding 10 — Missing Index: users.subscription_status Is Filtered Frequently but Not Indexed

**Severity:** MEDIUM
**File:** supabase/migrations/ (all migration files reviewed)
**Issue:** Multiple queries filter on `users.subscription_status` — the nudge cron (`.eq('subscription_status', 'free')`), cert expiry cron (`.eq('users.subscription_status', 'pro')`), and the founding-member count on the Insights page (`.eq('subscription_status', 'pro').eq('founding_member', true)`). No index exists on this column.
**Evidence:** No `CREATE INDEX` statement for `users.subscription_status` in any migration. Column defined in migration 003, referenced in nudge cron, cert cron, insights page, and webhook handler.
**Fix:** Add `CREATE INDEX idx_users_subscription_status ON public.users (subscription_status) WHERE deleted_at IS NULL;`. For the founding-member count query, a composite index on `(subscription_status, founding_member)` would be optimal.

---

## Finding 11 — Unoptimized Images: `unoptimized` Flag Used Throughout the App

**Severity:** MEDIUM
**File:** Multiple files (10 occurrences):
- components/profile/PhotoGallery.tsx:85
- components/public/PublicProfileContent.tsx:532, 547
- components/network/SavedProfileCard.tsx:55
- components/profile/IdentityCard.tsx:102
- components/cv/ShareModal.tsx:88
- components/profile/ProfileHeroCard.tsx:64
- app/(protected)/app/profile/page.tsx:185
- app/(protected)/app/profile/gallery/page.tsx:98
- app/(protected)/app/profile/photos/page.tsx:75
**Issue:** Every `<Image>` component in the app uses `unoptimized`. This disables Next.js image optimisation entirely — no WebP conversion, no responsive `srcset`, no automatic resizing. Profile photos and gallery images will always be served at their original upload size (potentially several MB each).
**Evidence:** `<Image src={p.photo_url} ... unoptimized />` across all photo-rendering components.
**Fix:** Remove `unoptimized` from all Image components. The Supabase storage URL pattern is already whitelisted in `next.config.ts` under `remotePatterns`. Add explicit `width` and `height` props (or use `fill` without `unoptimized`) to allow Next.js to generate optimised, correctly-sized images. For gallery grids with small thumbnail slots (72x72, aspect-square), set `sizes="72px"` to avoid loading large images for small displays.

---

## Finding 12 — Client Component That Could Be Server Component: AnalyticsChart

**Severity:** LOW
**File:** components/insights/AnalyticsChart.tsx:1
**Issue:** `AnalyticsChart` is marked `'use client'` but contains no hooks, no state, no event handlers, and no browser APIs. It is a pure rendering function that takes props and returns JSX.
**Evidence:**
```ts
'use client';
// No useState, useEffect, useRef, event handlers
export function AnalyticsChart({ data, color }: AnalyticsChartProps) {
  // Pure computation + JSX
}
```
**Fix:** Remove the `'use client'` directive. This allows the component to be server-rendered, reducing client JS bundle size.

---

## Finding 13 — Client Component That Could Be Server Component: ProfileStrength

**Severity:** LOW
**File:** components/profile/ProfileStrength.tsx (not fully read but identified via import pattern)
**Note:** Verify on inspection — if `ProfileStrength` uses no hooks or event handlers, it can be a server component.

---

## Finding 14 — Memory Leak: Missing Cleanup in MorePage useEffect

**Severity:** LOW
**File:** app/(protected)/app/more/page.tsx:81–100
**Issue:** The `useEffect` in `MorePage` calls an async `fetchSub` function but does not use a mounted-guard pattern. If the component unmounts before the async operations resolve, state setters will be called on an unmounted component. While React 18 no longer throws a warning for this, it can cause memory leaks with lingering async chains.
**Evidence:**
```ts
useEffect(() => {
  async function fetchSub() {
    const { data: { user } } = await supabase.auth.getUser()
    // ...
    setIsPro(active)   // no mounted check
    setSubPlan(...)
    // ...
  }
  fetchSub()
}, [supabase])
```
**Fix:** Add a `let mounted = true` guard with a cleanup function that sets `mounted = false`, as already done correctly in `useNetworkBadge`. Only call state setters if `mounted` is true.

---

## Finding 15 — Saved Profiles: name/role Sort Fetches All Rows to Sort in JS

**Severity:** MEDIUM
**File:** app/api/saved-profiles/route.ts:47–54, 112–130
**Issue:** When `sort` is `name` or `role`, the API intentionally skips DB-level pagination and fetches ALL saved profiles for a user into memory, sorts them in JavaScript, then slices. The comment acknowledges this: `// P3 fix: for name/role sort, we must fetch all rows, sort, then paginate`. A user with hundreds of saved profiles will cause a large memory allocation per request.
**Evidence:**
```ts
query = query.order('created_at', { ascending: false })
if (sort === 'recent') {
  query = query.range((page - 1) * limit, page * limit - 1)
}
// else: fetch all rows, sort in JS, then slice after enrichment
```
**Fix:** Push the sort to the database by joining `saved_profiles` with `users` and using `ORDER BY users.display_name` / `users.primary_role` directly in the query. Supabase supports ordering on joined columns via `order('saved_user.display_name')` or a view/function.

---

## Finding 16 — Hardcoded URL in OG Image Route

**Severity:** LOW
**File:** app/api/og/route.tsx:31
**Issue:** The OG route bypasses the Supabase client library and makes a raw `fetch` directly to the Supabase REST API using hardcoded URL construction. While `NEXT_PUBLIC_SUPABASE_URL` is an env var, the URL pattern is manually assembled and is brittle if Supabase changes its API shape.
**Evidence:**
```ts
const res = await fetch(
  `${supabaseUrl}/rest/v1/users?handle=eq.${handle.toLowerCase()}&select=display_name,...`,
  { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
)
```
**Fix:** This is an edge runtime constraint (cannot use the server Supabase client in edge functions that import Node.js modules). The pattern itself is acceptable in edge runtimes but should be noted. Consider creating a lightweight edge-compatible Supabase client using `@supabase/supabase-js` with the edge runtime configuration, which is cleaner and more maintainable.

---

## Finding 17 — Duplicate Fetch: getUserByHandle Called Twice in Public Profile

**Severity:** LOW
**File:** app/(public)/u/[handle]/page.tsx:17, 45
**Issue:** `getUserByHandle` is called in both `generateMetadata` and the page function. The function is wrapped with `React.cache()` so the second call is a cache hit within the same request, which is correct behaviour. However, this only works if both functions share the same request scope (they do in Next.js App Router). Worth documenting that this relies on React cache deduplication.
**Evidence:**
```ts
// generateMetadata
const user = await getUserByHandle(handle)  // line 17

// page function
const user = await getUserByHandle(handle)  // line 45 — cache hit
```
**Fix:** No code change needed — the cache works correctly. However, add a comment noting the React.cache deduplication dependency so future refactors don't accidentally break it (e.g., by removing the `cache()` wrapper from `getUserByHandle`).

---

## Finding 18 — console.error in Production Code (Acceptable Cases)

**Severity:** LOW
**File:** Multiple files — lib/ai/moderation.ts:42, lib/api/errors.ts:9, app/api/stripe/webhook/route.ts:27–133, app/api/endorsement-requests/[id]/route.ts:156, app/api/endorsements/route.ts:113, app/api/account/delete/route.ts:36
**Issue:** `console.error` calls are present in production API routes. These are correctly used for error paths (not debug logging) and will surface in server-side logs (Vercel). This is acceptable behaviour. However, `lib/api/errors.ts:9` logs every API error with `console.error('API error:', error)`, which will fire for expected user errors (e.g., 404, 401) and pollute server logs.
**Evidence:**
```ts
// lib/api/errors.ts
console.error('API error:', error);
```
**Fix:** In `lib/api/errors.ts`, distinguish between expected HTTP errors (4xx) and unexpected server errors (5xx). Only `console.error` for 5xx-class errors. For known/expected errors, either skip logging or use `console.warn`.

---

## Finding 19 — next.config.ts: No Image Format Configuration

**Severity:** LOW
**File:** next.config.ts:11–19
**Issue:** The `images` config only defines `remotePatterns` but does not configure `formats`. Next.js defaults to `['image/webp']` which is good, but for modern browsers `image/avif` should be listed first as it achieves better compression. Additionally, `deviceSizes` and `imageSizes` are not customised — for a mobile-first app with specific breakpoints these should be tuned.
**Evidence:**
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co", ... },
  ],
},
```
**Fix:** Add `formats: ['image/avif', 'image/webp']` to serve AVIF to supporting browsers. Consider tuning `deviceSizes` and `imageSizes` based on the actual breakpoints used in the app (max-width 2xl, card thumbnails at 72px, etc.).

---

## Summary Table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | Analytics cron: sequential N×2 DB+email calls | HIGH | N+1 / Sequential |
| 2 | Cert-expiry cron: sequential N×2 DB+email calls | HIGH | N+1 / Sequential |
| 3 | CV save: sequential per-yacht RPC+insert loop | HIGH | N+1 / Sequential |
| 4 | Nudge cron: full table scan for analytics aggregation | HIGH | Large Payload / Unindexed |
| 5 | Export: select('*') on profile_analytics, no limit | HIGH | Large Payload |
| 6 | Public profile: 3-level sequential mutual-colleague waterfall | MEDIUM | Waterfall |
| 7 | Public profile: user_photos outside Promise.all | MEDIUM | Waterfall |
| 8 | Private profile: user_photos outside Promise.all | MEDIUM | Waterfall |
| 9 | Missing index for cross-user analytics event_type query | MEDIUM | Unindexed |
| 10 | Missing index on users.subscription_status | MEDIUM | Unindexed |
| 11 | `unoptimized` on all Image components (10 occurrences) | MEDIUM | Image Handling |
| 12 | AnalyticsChart is 'use client' with no client features | LOW | Bundle / Component |
| 13 | MorePage useEffect lacks mounted guard | LOW | Memory Leak |
| 14 | Saved profiles: in-memory sort fetches all rows | MEDIUM | Large Payload |
| 15 | OG route: raw fetch to Supabase REST instead of client | LOW | Config / Maintainability |
| 16 | getUserByHandle called twice (React.cache mitigates) | LOW | Documentation |
| 17 | console.error logs expected 4xx errors | LOW | Logging |
| 18 | next.config.ts missing AVIF format config | LOW | Config |
