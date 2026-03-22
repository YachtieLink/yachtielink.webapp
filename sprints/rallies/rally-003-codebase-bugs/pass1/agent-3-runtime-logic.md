# Agent 3 — Runtime Logic Bugs
**Rally:** 003 — Codebase Bugs
**Pass:** 1
**Scope:** Client-side and server-side logic bugs that pass the build but break at runtime

---

## Finding 1 — Cert Expiry Cron: 60-Day Email Fires at Wrong Day Count

**Severity:** HIGH
**File:** `app/api/cron/cert-expiry/route.ts:57-65`
**Issue:** The DB query fetches all certs expiring within 60 days. The first per-cert condition is `if (daysLeft <= 60 && !cert.expiry_reminder_60d_sent)`. Because anything ≤ 60 satisfies this, a cert that is only 10 days away (never seen by the cron before) triggers the "60-day" email, telling the user their cert expires "soon" with a subject line implying 60 days of runway. The user then gets the correct 30-day email the next day. The `in30` variable computed on lines 24–25 is dead code — it is never used in the query or logic.
**Evidence:**
```ts
const in30 = new Date(); // computed but unused in query
in30.setDate(in30.getDate() + 30);

// DB query only uses in60 as upper bound:
.lte('expires_at', in60.toISOString())

// Then at runtime:
if (daysLeft <= 60 && !cert.expiry_reminder_60d_sent) {
  // fires at ANY day ≤ 60 — including 5, 10, 15 days
  await sendCertExpiryEmail(...)
```
**Fix:** Change the 60-day branch condition to `daysLeft > 30 && daysLeft <= 60` so a cert first encountered at 20 days remaining goes directly to the 30-day branch rather than firing a misleading 60-day email.

---

## Finding 2 — SavedProfileNoteEditor: `while(true)` Loop Can Fire Multiple HTTP Requests Unawaitedly

**Severity:** HIGH
**File:** `components/network/SavedProfileNoteEditor.tsx:37-44`
**Issue:** The `doSave` function runs a `while(true)` loop that calls `onSave(textToSave)` without awaiting it. `onSave` triggers `updateProfile` in `SavedProfilesClient`, which issues a `fetch` PATCH. Each iteration of the loop fires another HTTP request before the previous one completes. If the user types continuously for several seconds, this loop fires a burst of concurrent PATCH requests to the server. The loop only exits when `latestValueRef.current === textToSave`, but since `onSave` is not awaited, two rapid updates could leave the server with requests arriving out of order.
**Evidence:**
```ts
while (true) {
  onSave(textToSave)  // fires HTTP PATCH, NOT awaited
  await new Promise((r) => setTimeout(r, 50))
  if (latestValueRef.current === textToSave) break
  textToSave = latestValueRef.current
}
```
**Fix:** The loop should either await the HTTP call, or `onSave` should return a Promise that `doSave` awaits before checking `latestValueRef`. Alternatively, the loop should be removed and replaced with a single save of the latest value after the debounce settles.

---

## Finding 3 — SavedProfilesClient: `unsave` Has No Rollback on API Failure

**Severity:** MEDIUM
**File:** `app/(protected)/app/network/saved/SavedProfilesClient.tsx:71-81`
**Issue:** The `unsave` function immediately removes the profile from local state (`setProfiles filter`), then calls the API. If the API fails, the profile stays removed from the UI even though it was not deleted on the server. A `// TODO: rollback on failure` comment acknowledges this. The equivalent function `updateProfile` also has the same comment on line 67. Both optimistic updates can silently corrupt local state on API failure.
**Evidence:**
```ts
async function unsave(id: string) {
  ...
  setProfiles((prev) => prev.filter((p) => p.id !== id)) // optimistic remove
  const res = await fetch('/api/saved-profiles', { method: 'DELETE', ... })
  if (!res.ok) toast('Could not unsave', 'error')
  // profile does NOT get re-added on failure
}
```
**Fix:** Capture the removed profile before the optimistic update and restore it on `!res.ok`. Same pattern needed in `updateProfile` for all patch fields.

---

## Finding 4 — Section Visibility API: Read-Modify-Write Race Condition

**Severity:** MEDIUM
**File:** `app/api/profile/section-visibility/route.ts:17-30`
**Issue:** The PATCH handler reads `section_visibility`, merges one key, then writes back the whole object. Two concurrent PATCH requests (e.g., user rapidly toggles two sections) can both read the same stale `section_visibility`, each apply their own change, and then one write overwrites the other. The section toggled by the first request is lost when the second write completes.
**Evidence:**
```ts
const { data: profile } = await supabase
  .from('users')
  .select('section_visibility')
  .eq('id', user.id)
  .single()

const current = (profile?.section_visibility ?? {}) as Record<string, boolean>
current[section] = visible

await supabase.from('users').update({ section_visibility: current }).eq('id', user.id)
```
**Fix:** Use a Postgres JSON merge update (e.g., `jsonb_set` via a raw query or RPC) that operates atomically on a single key without reading the full object first.

---

## Finding 5 — Fail-Open: PDF Template Gate Falls Back to Allowing Pro Templates on Query Error

**Severity:** MEDIUM
**File:** `app/api/cv/generate-pdf/route.ts:27-37`
**Issue:** The check for non-standard (Pro) templates fetches the user's `subscription_status`. If the query succeeds but returns `null` data (`profile` is null), the check `profile?.subscription_status !== 'pro'` evaluates to `true` (since `undefined !== 'pro'`), correctly blocking the user. However, if the query entirely errors (network/DB issue) and the code doesn't check the error, `profile` is `null` and the guard fires a 403. This is actually fail-closed and correct for this path. BUT the CV page itself (`app/(protected)/app/cv/page.tsx:30`) passes `isPro={profile.subscription_status === 'pro'}` directly without using `getProStatus`. If the DB returns stale/unexpected data for `subscription_status`, the CvActions component shows Pro templates as unlocked even though the backend guard still enforces correctly. This is a UI inconsistency rather than a direct bypass, but it could show Pro UI affordances to free users during a session.
**Evidence:**
```ts
// cv/page.tsx — uses raw field, not getProStatus
isPro={profile.subscription_status === 'pro'}

// generate-pdf/route.ts — uses raw field check for template gate
if (profile?.subscription_status !== 'pro') {
  return NextResponse.json({ error: 'Pro subscription required...' }, { status: 403 })
}
```
**Fix:** Consistent usage: either use `getProStatus()` everywhere (which has belt-and-suspenders expiry check) or accept that the page uses the raw field. The server-side gate in `generate-pdf` is authoritative, so the main risk is misleading UI. Consider using `getProStatus` in the CV page as well.

---

## Finding 6 — Wizard Onboarding: `setTimeout` Redirect Not Cancelled on Unmount

**Severity:** MEDIUM
**File:** `components/onboarding/Wizard.tsx:624,649`
**Issue:** Two `setTimeout(() => router.push("/app/profile"), 2200)` calls are fire-and-forget. If the user navigates away during the 2200ms countdown (e.g., taps the back button), the push fires on an unmounted component and will override the user's chosen navigation. There is no `useEffect` cleanup or ref to cancel these timeouts.
**Evidence:**
```ts
function handleCvComplete(data: ParsedCvData, _stats: SaveStats) {
  ...
  setStepIndex(3)
  setTimeout(() => router.push("/app/profile"), 2200) // not cancelled on unmount
}

async function handleHandleNext(data: { handle: string }) {
  ...
  setStepIndex(3)
  setTimeout(() => router.push("/app/profile"), 2200) // not cancelled on unmount
}
```
**Fix:** Store the timeout ID in a `useRef` and cancel it in a `useEffect` cleanup function.

---

## Finding 7 — Attachment New Page: `handleSave` Proceeds with Empty `userId`

**Severity:** MEDIUM
**File:** `app/(protected)/app/attachment/new/page.tsx:73-82`
**Issue:** `userId` is initialised to `''` and populated asynchronously via `useEffect` (from `supabase.auth.getUser()`). The `handleSave` function guards against `!yacht || !roleLabel || !startDate` but does NOT guard against an empty `userId`. If `handleSave` fires before the auth call resolves (e.g., immediate form submission after page render on slow connection), the insert will attempt to use `user_id: ''`, which will either fail at the DB/RLS level or produce a corrupt row. The `YachtPicker` component is correctly gated behind `{userId && ...}` on the first step, so this is only reachable if auth resolves partially.
**Evidence:**
```ts
const [userId, setUserId] = useState('') // empty until effect resolves

async function handleSave() {
  if (!yacht || !roleLabel || !startDate) return  // userId not checked
  const { error } = await supabase.from('attachments').insert({
    user_id: userId,  // could be '' if auth hasn't resolved
    ...
  })
}
```
**Fix:** Add `!userId` to the early return guard in `handleSave`.

---

## Finding 8 — DeepLinkFlow useEffect: `supabase` Client Not in Dependency Array

**Severity:** LOW
**File:** `components/endorsement/DeepLinkFlow.tsx:84,131`
**Issue:** The `useEffect` that fetches user profile, attachments, and endorsements uses `supabase` (created by `createClient()` directly in the component body on render) but does not include it in the dependency array `[currentUserId, request.yacht_id, request.requester_id]`. In practice `createClient()` returns a stable client instance, so this is unlikely to cause actual re-fetch issues. However, it creates a lint warning and is a pattern that could cause stale data if the client were ever recreated between renders.
**Evidence:**
```ts
const supabase = createClient()  // created during render
useEffect(() => {
  Promise.all([
    supabase.from('users').select(...)  // uses supabase
    ...
  ])
}, [currentUserId, request.yacht_id, request.requester_id])  // supabase missing
```
**Fix:** Either move `createClient()` outside the component (module level or via a hook) or add `supabase` to the dependency array.

---

## Finding 9 — Account Page: `setFullName(profile.full_name)` Without Null Guard

**Severity:** LOW
**File:** `app/(protected)/app/more/account/page.tsx:63`
**Issue:** The Supabase client has no generated TypeScript database types, so all query results are typed as `any`. `profile.full_name` is `NOT NULL` in the database schema but the TypeScript compiler sees it as `any`. `setFullName` accepts `string`, and the state is initialised to `''`, but if `profile.full_name` were ever `null` (e.g., a race during account creation before the trigger fires), `fullName` state would be set to `null`. The save handler then calls `fullName.trim()` which would throw `TypeError: Cannot read properties of null (reading 'trim')`.
**Evidence:**
```ts
setFullName(profile.full_name)  // no ?? '' fallback

// later:
if (!fullName.trim()) { ... }  // crashes if fullName is null
```
**Fix:** Change to `setFullName(profile.full_name ?? '')`.

---

## Finding 10 — CvReviewClient: `JSON.parse(stored)` Without Error Handling

**Severity:** LOW
**File:** `components/cv/CvReviewClient.tsx:44`
**Issue:** The `useEffect` reads `sessionStorage.getItem('cv_parsed_data')` and parses it with `JSON.parse(stored) as ParsedCvData`. If the stored string is malformed JSON (e.g., truncated due to storage limits, or corrupted), `JSON.parse` throws an uncaught synchronous exception inside a `useEffect`, crashing the component with an unhandled error rather than showing a graceful fallback. The router redirect only fires if `stored` is null/absent — not on parse failure.
**Evidence:**
```ts
useEffect(() => {
  const stored = sessionStorage.getItem('cv_parsed_data')
  if (!stored) {
    router.replace('/app/cv/upload')
    return
  }
  const parsed = JSON.parse(stored) as ParsedCvData  // throws on malformed JSON
  setData(parsed)
  ...
}, [existingProfile, router])
```
**Fix:** Wrap `JSON.parse(stored)` in a try/catch and redirect to `/app/cv/upload` on parse failure.

---

## Finding 11 — Badge Count Route: Unparameterised `.or()` Filter Injection Risk

**Severity:** LOW
**File:** `app/api/badge-count/route.ts:15-19`
**Issue:** The badge count query uses `.or(\`recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}\`)` with `user.email` interpolated directly into the filter string. While Supabase's PostgREST `.or()` filter is not a raw SQL injection vector, if `user.email` contains commas or special PostgREST characters (e.g., `user@example.com,recipient_user_id.eq.some-uuid`), the filter could be malformed and return incorrect counts. Auth-issued emails are not user-controlled for existing accounts, but it is still an unusual pattern.
**Evidence:**
```ts
.or(`recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}`)
```
**Fix:** Use separate `.eq()` chained with `.or()` builder syntax rather than string interpolation, or at minimum assert that `user.email` cannot contain PostgREST filter metacharacters.

---

## Finding 12 — Network Page: `requestsReceived` Filter Uses `.is('cancelled_at', null)` But Also Checks `cancelled_at` Client-Side

**Severity:** LOW
**File:** `app/(protected)/app/network/page.tsx:36-39`
**Issue:** The `requestsReceived` query includes `.is('cancelled_at', null)` which filters out cancelled requests at the DB level. However, `AudienceTabs` and `ReceivedRequestCard` both also check `cancelled_at` client-side. This is not a bug per se, but the server filter means no cancelled requests ever arrive in `requestsReceived`, so the `isCancelled` guard in `ReceivedRequestCard` for `requestsReceived` entries is dead code. More importantly, the filter `.is('cancelled_at', null)` is applied to `requestsReceived` but NOT to `requestsSent`. This means cancelled sent requests do appear in the "sent" list, which is intentional, but the asymmetry may cause confusion if future code assumes both lists are filtered consistently.
**Evidence:**
```ts
// requestsReceived — cancelled_at filtered OUT at DB level
supabase.from('endorsement_requests')
  .or(...)
  .is('cancelled_at', null)  // only for received

// requestsSent — no cancelled_at filter, returns all including cancelled
supabase.from('endorsement_requests')
  .eq('requester_id', user.id)
  // no .is('cancelled_at', null)
```
**Fix:** This is defensible (sent requests may want to show cancelled history) but should be documented. The dead `isCancelled` guard in `ReceivedRequestCard` for the received tab can be removed for clarity.

---

## Summary

| # | Title | Severity | File |
|---|-------|----------|------|
| 1 | Cert expiry cron: 60d email fires at wrong day count | HIGH | `app/api/cron/cert-expiry/route.ts` |
| 2 | SavedProfileNoteEditor while(true) fires unawaitied HTTP requests | HIGH | `components/network/SavedProfileNoteEditor.tsx` |
| 3 | unsave has no rollback on API failure | MEDIUM | `app/(protected)/app/network/saved/SavedProfilesClient.tsx` |
| 4 | Section visibility read-modify-write race condition | MEDIUM | `app/api/profile/section-visibility/route.ts` |
| 5 | PDF template gate inconsistency (page uses raw field vs getProStatus) | MEDIUM | `app/(protected)/app/cv/page.tsx` + `app/api/cv/generate-pdf/route.ts` |
| 6 | Wizard setTimeout redirect not cancelled on unmount | MEDIUM | `components/onboarding/Wizard.tsx` |
| 7 | Attachment new page: handleSave proceeds with empty userId | MEDIUM | `app/(protected)/app/attachment/new/page.tsx` |
| 8 | DeepLinkFlow useEffect: supabase not in dependency array | LOW | `components/endorsement/DeepLinkFlow.tsx` |
| 9 | Account page: setFullName without null fallback | LOW | `app/(protected)/app/more/account/page.tsx` |
| 10 | CvReviewClient: JSON.parse without error handling | LOW | `components/cv/CvReviewClient.tsx` |
| 11 | Badge count route: unparameterised .or() filter | LOW | `app/api/badge-count/route.ts` |
| 12 | Network page: asymmetric cancelled_at filtering | LOW | `app/(protected)/app/network/page.tsx` |
