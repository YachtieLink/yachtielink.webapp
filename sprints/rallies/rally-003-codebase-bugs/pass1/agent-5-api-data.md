# Agent 5 — API & Data Integrity Audit
**Rally 003 — Pass 1**
**Date:** 2026-03-22
**Scope:** All files in `app/api/`, all migration files in `supabase/migrations/`, and `lib/validation/schemas.ts`, `lib/storage/upload.ts`

---

## Finding 1 — Reorder-then-read Race Condition in Photo Reorder

**Severity:** HIGH
**File:** `app/api/user-photos/route.ts:88-101`
**Issue:** The PUT (reorder) handler fires N concurrent `update` calls with `Promise.all`, then immediately reads back `photo_ids[0]` to sync `profile_photo_url`. Because all updates are independent DB round-trips there is no transaction boundary. If any one update fails silently (Supabase client swallows non-throwing errors unless explicitly checked), `sort_order` in the DB becomes partially written — some photos have new indices, others keep old ones. Additionally the follow-up `.select('photo_url').eq('id', photo_ids[0])` runs concurrently with the updates, so it may read a stale or partially-written `sort_order`. The final `profile_photo_url` then points to whichever photo *happened* to be first in DB at read time rather than the intended first.

**Evidence:**
```ts
const updates = photo_ids.map((id, idx) =>
  supabase.from('user_photos').update({ sort_order: idx }).eq('id', id).eq('user_id', user.id)
)
await Promise.all(updates)   // N concurrent writes, no transaction

const { data: firstPhoto } = await supabase  // reads immediately after, no wait for all writes
  .from('user_photos')
  .select('photo_url')
  .eq('id', photo_ids[0])
  ...
```
**Fix:** Wrap all `sort_order` updates in a single RPC function that runs in a transaction, or use a sequential update pattern. Alternatively, suppress partial failures by checking each result before the subsequent read.

---

## Finding 2 — Reorder-then-read Race Condition in Gallery Reorder (same pattern)

**Severity:** HIGH
**File:** `app/api/user-gallery/route.ts:80-83`
**Issue:** Identical pattern to Finding 1 — concurrent `Promise.all` updates with no transaction. If any individual update fails, `sort_order` ends up partially written with no rollback and no error returned to the caller. The response is `{ ok: true }` regardless of how many individual updates actually succeeded.

**Evidence:**
```ts
const updates = item_ids.map((id, idx) =>
  supabase.from('user_gallery').update({ sort_order: idx }).eq('id', id).eq('user_id', user.id)
)
await Promise.all(updates)
return NextResponse.json({ ok: true })
```
**Fix:** Check each update result for errors, or move to a single transactional RPC. Return an error if any update fails rather than always returning `{ ok: true }`.

---

## Finding 3 — Skills Bulk Replace: Rollback Does Not Restore IDs

**Severity:** HIGH
**File:** `app/api/user-skills/route.ts:37-56`
**Issue:** The PUT handler does a "snapshot → delete all → re-insert" pattern. The rollback path captures `name, category, sort_order` but **not `id`**. If the re-insert fails mid-batch and the rollback fires, the restored rows get new UUIDs. Any external reference (bookmarks, client-side state, future foreign keys) that pointed to the old skill IDs silently breaks. Furthermore, there is a window between the `delete` and the successful `insert` where all skills are gone — a concurrent GET request during that window returns an empty list, and a concurrent second PUT could also fire against an empty table and succeed, causing the second write's data to be overwritten by the rollback.

**Evidence:**
```ts
const { data: existing } = await supabase
  .from('user_skills').select('name, category, sort_order').eq('user_id', user.id)
// id is NOT captured

const { error: deleteError } = await supabase
  .from('user_skills').delete().eq('user_id', user.id)
// ... if insertError:
await supabase.from('user_skills').insert(
  existing.map((r) => ({ ...r, user_id: user.id }))  // new IDs assigned
)
```
**Fix:** Use an upsert strategy keyed on a stable identity (e.g. name+user_id), or wrap delete+insert in a Postgres function/transaction. The hobbies route (`app/api/user-hobbies/route.ts`) has the same issue.

---

## Finding 4 — User-hobbies Bulk Replace: Same Rollback Pattern

**Severity:** HIGH
**File:** `app/api/user-hobbies/route.ts:37-56`
**Issue:** Identical structural problem to Finding 3 — rollback does not preserve original UUIDs and there is a concurrent-read window where all hobbies appear deleted.

**Evidence:** Same pattern as `user-skills` route — `select('name, emoji, sort_order')` omits `id`, then delete-all + re-insert with rollback.

**Fix:** Same as Finding 3.

---

## Finding 5 — `cv-settings` PATCH Has No Input Schema Validation

**Severity:** HIGH
**File:** `app/api/user/cv-settings/route.ts:9`
**Issue:** This PATCH handler calls `req.json()` directly without using `validateBody` or any Zod schema. The fields `cv_public` and `cv_public_source` are validated with hand-rolled `if` checks, but there is no structural validation of the request body. If `req.json()` throws (malformed JSON), the error propagates uncaught to the generic handler. The `cv_public_source` check only validates when the field is *truthy* — an explicit `null` or `undefined` would pass the guard and be added to the `update` object. There is also no check that `cv_public` is actually a boolean before using it (`typeof cv_public === 'boolean'` is present, but the body is not pre-validated, so a stringified `"true"` would silently be ignored rather than rejected or coerced).

**Evidence:**
```ts
const body = await req.json()           // no try/catch, no schema
const { cv_public, cv_public_source } = body

if (cv_public_source && !['generated', 'uploaded'].includes(cv_public_source)) {
  // only runs when truthy — null passes this guard
```
**Fix:** Wrap in a `try/catch` or adopt `validateBody` with a Zod schema for this route, consistent with every other PATCH/PUT route in the codebase.

---

## Finding 6 — Section-Visibility PATCH: Read-Modify-Write Without Concurrency Guard

**Severity:** MEDIUM
**File:** `app/api/profile/section-visibility/route.ts:18-30`
**Issue:** The handler reads the entire `section_visibility` JSON object, mutates one key in JS, then writes the whole object back. Under concurrent requests (e.g. two browser tabs toggling different sections simultaneously), the second write overwrites the first — the classic lost-update problem on a JSONB column. No optimistic locking, ETag, or atomic JSONB merge is used.

**Evidence:**
```ts
const { data: profile } = await supabase
  .from('users').select('section_visibility').eq('id', user.id).single()

const current = (profile?.section_visibility ?? {}) as Record<string, boolean>
current[section] = visible      // mutate in JS

await supabase.from('users').update({ section_visibility: current }).eq('id', user.id)
```
**Fix:** Use a Postgres `jsonb_set` expression via an RPC or raw SQL update, e.g.: `UPDATE users SET section_visibility = jsonb_set(section_visibility, '{section}', 'true') WHERE id = $1`. This makes the update atomic at the DB level.

---

## Finding 7 — Photo Limit Check Is a TOCTOU Race

**Severity:** MEDIUM
**File:** `app/api/user-photos/route.ts:44-50` and `app/api/user-gallery/route.ts:43-48`
**Issue:** Both routes check the current photo/gallery count, then conditionally allow the insert. Between the count check and the insert, a concurrent request can slip through. Two concurrent POST requests can both read count=2 (under the limit of 3), both conclude the limit has not been reached, and both insert — ending up with 4 items when the limit is 3. There is no UNIQUE constraint, trigger, or DB-level check to enforce the limit atomically.

**Evidence:**
```ts
const { count } = await supabase
  .from('user_photos')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
if ((count ?? 0) >= limit) { return 403 }

// ... concurrent request passes same check ...
await supabase.from('user_photos').insert(...)
```
**Fix:** Move the limit enforcement to a Postgres trigger or a serializable transaction. A simpler mitigation is a DB constraint `CHECK (sort_order < 9)` with a trigger that counts rows per user and rejects inserts over the limit.

---

## Finding 8 — `endorsement_requests_no_duplicate_pending` Index Does Not Cover Phone-Only Requests

**Severity:** MEDIUM
**File:** `supabase/migrations/20260314000016_request_improvements.sql:76-78`
**Issue:** The unique partial index that prevents duplicate pending requests only covers `(requester_id, yacht_id, recipient_email)`. It does not include `recipient_phone`. A requester can therefore send unlimited pending requests to the same phone number for the same yacht — the deduplication constraint is silently bypassed for phone-based requests.

**Evidence:**
```sql
create unique index if not exists endorsement_requests_no_duplicate_pending
  on public.endorsement_requests (requester_id, yacht_id, recipient_email)
  where cancelled_at is null and status != 'accepted';
-- recipient_phone not included in the index
```
**Fix:** Add a parallel unique partial index for `(requester_id, yacht_id, recipient_phone)` where `recipient_phone IS NOT NULL`, similar to the existing email index. Also consider a composite index or a trigger-based check to prevent duplication via `recipient_user_id`.

---

## Finding 9 — `parseCVSchema` Does Not Validate That the Storage Path Belongs to the Current User

**Severity:** HIGH
**File:** `app/api/cv/parse/route.ts:19-21` / `lib/validation/schemas.ts:43-45`
**Issue:** The `parseCVSchema` accepts any string for `storagePath` (only validated as non-empty, max 500 chars). The handler then uses the service client to download from `cv-uploads/{storagePath}` — meaning an authenticated user can supply the storage path of *another user's CV* (e.g. `other-user-id/cv.pdf`) and force the server to parse and return the text contents of that file. This is a data-exfiltration path.

**Evidence:**
```ts
// Schema:
export const parseCVSchema = z.object({
  storagePath: z.string().min(1).max(500),   // no ownership check in schema
})

// Route:
const serviceClient = createServiceClient()  // bypasses RLS
const { data: fileData } = await serviceClient.storage
  .from('cv-uploads')
  .download(storagePath)                     // storagePath is user-controlled
```
**Fix:** After validating the schema, assert that `storagePath` starts with `${user.id}/`. Reject the request with 403 if it does not. The schema could enforce this with `.startsWith()` refinement, but the user ID is not available at schema-parse time, so the check must be in the route handler.

---

## Finding 10 — `profile_photo_url` Can Point to a Deleted Storage Object

**Severity:** MEDIUM
**File:** `app/api/user-photos/[id]/route.ts:31-42`
**Issue:** When a photo is deleted and it was `sort_order === 0`, the code promotes the next photo to `profile_photo_url`. However, the storage object is deleted *before* the DB row is deleted, and the next-photo query runs *after* both deletes. If the DB row delete fails silently (unchecked error in Supabase JS client), `profile_photo_url` is updated to `null` but the old DB row still exists with a now-deleted storage object URL. Subsequent renders will display a broken image for `profile_photo_url` until the inconsistency is repaired.

More importantly, the storage deletion failure is entirely silent — `supabase.storage.from('user-photos').remove([storagePath])` is awaited but its return value is not checked. If storage deletion fails, the DB row is deleted anyway, leaving an orphaned storage file.

**Evidence:**
```ts
if (storagePath) {
  await supabase.storage.from('user-photos').remove([storagePath])  // error ignored
}
await supabase.from('user_photos').delete().eq('id', id).eq('user_id', user.id)  // continues regardless
```
**Fix:** Check the storage removal result. If storage removal fails, either abort the deletion or log and retry. The same unchecked pattern appears in `app/api/user-gallery/[id]/route.ts:49-54`.

---

## Finding 11 — Account Delete Does Not Remove User from `saved_profiles` as the Saved Subject

**Severity:** MEDIUM
**File:** `app/api/account/delete/route.ts:52-64`
**Issue:** The account deletion flow anonymises the `users` row and soft-deletes `attachments`, `certifications`, `endorsement_requests`, and analytics data. However, it does not delete or nullify `saved_profiles` rows where `saved_user_id = user.id`. After deletion, other users' saved-profiles lists will still contain a reference to the deleted (now anonymised) user. The `saved_profiles` table has `ON DELETE CASCADE` for `saved_user_id`, but the `users` row is *not hard-deleted* — it is anonymised in-place (`deleted_at` is set). CASCADE does not fire. The saved profile entries persist indefinitely and will render "[Deleted User]" in the UI.

**Evidence:**
```ts
// users row is anonymised, not deleted:
await admin.from('users').update({
  full_name: '[Deleted User]',
  ...
  deleted_at: new Date().toISOString(),
}).eq('id', user.id);

// saved_profiles where saved_user_id = user.id are NOT cleaned up
// ON DELETE CASCADE on saved_user_id only fires on hard DELETE
```
**Fix:** Explicitly delete all `saved_profiles` rows where `saved_user_id = user.id` in the deletion sequence (step 3.5, before auth user deletion).

---

## Finding 12 — Account Delete Does Not Clean Up `profile_folders` or `saved_profiles` as Owner

**Severity:** MEDIUM
**File:** `app/api/account/delete/route.ts:42-93`
**Issue:** The deletion flow omits cleanup of `profile_folders` and `saved_profiles` owned by the deleted user (`user_id = user.id`). These tables have `ON DELETE CASCADE` from `users.id`, but since the `users` row is anonymised (not hard-deleted), CASCADE never fires. The anonymised user's folder and saved-profile data persists in the database. These rows reference a soft-deleted user and may surface in admin queries or future orphan scans.

**Evidence:** Neither `profile_folders` nor `saved_profiles` (as owner) appear in the deletion flow steps 2–8 in `account/delete/route.ts`.

**Fix:** Add explicit deletes for `profile_folders` and `saved_profiles` (where `user_id = user.id`) in the deletion sequence. Also add `user_education`, `user_skills`, `user_hobbies`, `user_photos`, `user_gallery` — none of these are in the deletion sequence and will be orphaned.

---

## Finding 13 — Account Delete Does Not Clean Up `user_education`, `user_skills`, `user_hobbies`, `user_photos`, `user_gallery`

**Severity:** MEDIUM
**File:** `app/api/account/delete/route.ts:42-93`
**Issue:** Extension of Finding 12. The five tables added in Sprint 10 (`user_education`, `user_skills`, `user_hobbies`, `user_photos`, `user_gallery`) are all defined with `ON DELETE CASCADE` from `users(id)`, but because the `users` row is never hard-deleted, no CASCADE fires. These rows and any associated storage files persist after account deletion. Storage files in `user-photos` and `user-gallery` buckets are wiped in step 2, but their DB rows remain, causing broken image URLs if the DB is ever queried.

**Evidence:**
```ts
// Step 2 wipes storage:
admin.storage.from('user-photos').remove([`${user.id}/`]),
admin.storage.from('user-gallery').remove([`${user.id}/`]),

// But DB rows for user_photos, user_gallery, user_education,
// user_skills, user_hobbies are never deleted — they reference
// a soft-deleted user with broken storage URLs.
```
**Fix:** Add explicit deletes for all five tables in the deletion flow, between the storage wipe (step 2) and the auth user deletion (step 9).

---

## Finding 14 — `badge-count` Route Builds an Unparameterised `.or()` Filter with User-Controlled Email

**Severity:** MEDIUM
**File:** `app/api/badge-count/route.ts:14-17`
**Issue:** The badge count query builds its `.or()` filter by string-interpolating `user.email` directly from the auth token payload. While Supabase JS client does parameterise the final SQL, the `.or()` string is assembled as: `` `recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}` ``. If `user.email` contains a comma or PostgREST filter operators (e.g. `a@b.com,recipient_email.eq.admin@example.com`), this could produce an unintended filter. In practice, Supabase Auth normalises emails, but this pattern is fragile and inconsistent with the rest of the codebase which uses structured query builders.

**Evidence:**
```ts
const { count } = await supabase
  .from('endorsement_requests')
  .select('id', { count: 'exact', head: true })
  .or(`recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}`)
```
**Fix:** Split into two separate queries and union the counts, or use `.or('recipient_user_id.eq.' + user.id).or('recipient_email.eq.' + supabase.rpc(...))`. At minimum, encode the email value so that special characters cannot break the filter string.

---

## Finding 15 — `endorsement_requests` Original Constraint Remains Incompatible with Shareable Links

**Severity:** LOW
**File:** `supabase/migrations/20260313000003_core_tables.sql:214` vs `20260315000019_endorsement_virality.sql:19-28`
**Issue:** The original `has_recipient` constraint was `CHECK (recipient_email IS NOT NULL OR recipient_user_id IS NOT NULL)`. Migration 019 drops and replaces this with a constraint that also allows `is_shareable = true`. The migration is additive and correct. However, the original migration (003) is still present in the migrations folder and if migrations are replayed from scratch (e.g. in a fresh environment) the constraint from 003 will be created first, then overridden by 019. This is the intended pattern, but if 019 were ever rolled back without 003 being aware, shareable-link inserts would start failing with a constraint violation. This is a migration ordering dependency that is undocumented.

**Evidence:** Migration 003 defines the original `has_recipient` constraint; migration 019 drops it and creates a new one with the shareable-link exception. No rollback script exists.

**Fix:** Document the dependency in a migration comment. Low risk as-is since there are no rollback scripts and migrations are applied sequentially.

---

## Finding 16 — `PUT /api/user-photos` Reorder Does Not Validate That All Provided IDs Belong to the User

**Severity:** MEDIUM
**File:** `app/api/user-photos/route.ts:83-108`
**Issue:** `reorderPhotosSchema` validates that `photo_ids` is an array of UUIDs, but does not check that the array covers *all* existing photos. The update applies `.eq('user_id', user.id)` on each photo, so a user cannot reorder someone else's photos. However, if a user submits a partial `photo_ids` array (e.g. only 2 of their 3 photos), the omitted photo retains its old `sort_order` value, which may now conflict with one of the newly-assigned values. There is no UNIQUE constraint on `(user_id, sort_order)` in the `user_photos` table, so duplicate `sort_order` values are silently persisted.

**Evidence:**
```ts
// Schema allows any subset of valid UUIDs:
export const reorderPhotosSchema = z.object({
  photo_ids: z.array(z.string().uuid()).min(1).max(9),
})
// No check that the array matches the full set of user's photos
```
**Fix:** In the route handler, fetch the user's current photo IDs and assert that `photo_ids` contains exactly the same set (no omissions, no additions). If the sets differ, return a 400 error.

---

## Finding 17 — `profile_folders` `sort_order` Assigned by Count, Vulnerable to Gaps

**Severity:** LOW
**File:** `app/api/profile-folders/route.ts:35-43`
**Issue:** New folders are assigned `sort_order = count` (current folder count). If a folder is deleted, the count decreases but existing `sort_order` values are not renumbered. Creating a new folder then assigns a `sort_order` that may duplicate an existing one. There is no UNIQUE constraint on `(user_id, sort_order)` in `profile_folders`. The same pattern exists in `user-education` (`sort_order: count ?? 0`).

**Evidence:**
```ts
const { count } = await supabase
  .from('profile_folders')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)

await supabase.from('profile_folders').insert({ ..., sort_order: count ?? 0 })
```
**Fix:** Assign `sort_order` as `MAX(sort_order) + 1` rather than `COUNT(*)`. This avoids gaps causing duplicates. Alternatively add a UNIQUE constraint on `(user_id, sort_order)` and let the DB enforce ordering integrity.

---

## Finding 18 — `certifications` Table Has No `deleted_at` But Account Delete Soft-Deletes It

**Severity:** MEDIUM
**File:** `app/api/account/delete/route.ts:71-74` vs `supabase/migrations/20260313000003_core_tables.sql:229-253`
**Issue:** The `certifications` table schema (migration 003) has no `deleted_at` column. The account deletion code at step 5 attempts to `update({ deleted_at: ... })` on the `certifications` table. This will silently fail (Supabase JS returns no error for an update that sets a non-existent column — the column is ignored) — or in strict mode, throw a schema error. Certs are therefore *not* soft-deleted during account deletion, leaving live cert records attached to an anonymised user.

**Evidence:**
```ts
// certifications schema (migration 003): no deleted_at column
create table public.certifications (
  id uuid primary key ...,
  user_id uuid ...,
  ...
  // no deleted_at
);

// account/delete/route.ts:
await admin.from('certifications')
  .update({ deleted_at: new Date().toISOString() })  // column doesn't exist
  .eq('user_id', user.id);
```
**Fix:** Either (a) add `deleted_at timestamptz` to the `certifications` table in a new migration, or (b) change the account deletion step to `delete()` (hard delete) certifications rather than soft-deleting them. The cert storage files are already wiped in step 2, so a hard delete of the DB rows is consistent.

---

## Finding 19 — Empty Array Response Shape Inconsistency Between Routes

**Severity:** LOW
**File:** Multiple routes
**Issue:** GET response shapes are inconsistent across the API:
- `GET /api/user-photos` → `{ photos: [] }`
- `GET /api/user-gallery` → `{ items: [] }`
- `GET /api/user-education` → `{ education: [] }`
- `GET /api/user-skills` → `{ skills: [] }`
- `GET /api/user-hobbies` → `{ hobbies: [] }`
- `GET /api/endorsements?user_id=` → `{ endorsements: [] }`
- `GET /api/profile-folders` → `{ folders: [] }`

This is not a data corruption issue, but the envelope key differs for every resource. A client consuming multiple endpoints must know each individual key name. A typo on any consumer results in `undefined` being treated as an empty array, causing silent display failures rather than surfaced errors.

**Fix:** Standardise on a single envelope key (`data`) or document the per-route contract explicitly. Consider adopting a shared response helper that enforces consistent shapes.

---

## Finding 20 — `user-photos/route.ts` `profile_photo_url` Sync Condition Is Ambiguous

**Severity:** LOW
**File:** `app/api/user-photos/route.ts:64-66`
**Issue:** On POST (new photo upload), `profile_photo_url` is updated to the new photo's URL if `sort_order === 0 OR count === 0`. When `sort_order === 0` but `count > 0` (i.e. the user explicitly uploads a new photo at position 0), the profile photo is updated even if there is already a photo at position 0 with a different URL. There is no sort_order uniqueness constraint, so two photos can both have `sort_order = 0`. The reorder PUT is the canonical way to change which photo is first, but POST can inadvertently overwrite `profile_photo_url` if the client supplies `sort_order: 0`.

**Evidence:**
```ts
if (sort_order === 0 || (count ?? 0) === 0) {
  await supabase.from('users').update({ profile_photo_url: photo_url }).eq('id', user.id)
}
```
**Fix:** Only set `profile_photo_url` when `count === 0` (the very first photo ever uploaded). For subsequent uploads, leave `profile_photo_url` alone; the reorder PUT is the right mechanism to change the primary photo.

---

## Finding 21 — `cv/generate-pdf` Joins `yachts` Column `length_m` Which Does Not Exist

**Severity:** HIGH
**File:** `app/api/cv/generate-pdf/route.ts:58`
**Issue:** The PDF generation query selects `length_m` from the `yachts` table: `yachts ( id, name, yacht_type, length_m, flag_state )`. The `yachts` schema (migration 003) defines this column as `length_meters`, not `length_m`. This will cause the Supabase query to silently return `null` for `length_m` on every yacht in the PDF export. Depending on how the PDF template renders this field, it will either show nothing or an empty value — the user's data is silently truncated.

**Evidence:**
```ts
supabase
  .from('attachments')
  .select(`
    id, role_label, started_at, ended_at,
    yachts ( id, name, yacht_type, length_m, flag_state )  // should be length_meters
  `)
```
```sql
-- migration 003:
length_meters  numeric(5,1),
```
**Fix:** Change `length_m` to `length_meters` in the select query.

---

## Finding 22 — `endorsements` Soft-Delete Does Not Update the Unique Constraint

**Severity:** MEDIUM
**File:** `supabase/migrations/20260313000003_core_tables.sql:180`
**Issue:** The `endorsements` table has `UNIQUE (endorser_id, recipient_id, yacht_id)`. When an endorsement is soft-deleted (`deleted_at` is set), the unique constraint remains active on the soft-deleted row. This means a user who writes an endorsement, then retracts it (soft-delete), can never write a new endorsement for the same person on the same yacht — the second insert will hit a 23505 unique constraint violation. The DELETE route returns `{ ok: true }` on retraction, but the endorsement creation route will refuse re-endorsement with "You've already endorsed this person."

**Evidence:**
```sql
constraint unique_endorsement  unique (endorser_id, recipient_id, yacht_id)
-- no partial index to exclude soft-deleted rows
```
```ts
// endorsements/route.ts:
if (insertError.code === '23505') {
  return NextResponse.json({ error: "You've already endorsed this person for this yacht." }, { status: 409 })
}
```
**Fix:** Replace the table-level UNIQUE constraint with a partial unique index:
```sql
CREATE UNIQUE INDEX endorsements_unique_active
  ON endorsements (endorser_id, recipient_id, yacht_id)
  WHERE deleted_at IS NULL;
```

---

## Summary Table

| # | Title | Severity | File |
|---|-------|----------|------|
| 1 | Reorder photo race condition (PUT photos) | HIGH | `app/api/user-photos/route.ts:88` |
| 2 | Reorder gallery race condition (PUT gallery) | HIGH | `app/api/user-gallery/route.ts:80` |
| 3 | Skills bulk replace rollback loses IDs + dirty window | HIGH | `app/api/user-skills/route.ts:37` |
| 4 | Hobbies bulk replace same rollback pattern | HIGH | `app/api/user-hobbies/route.ts:37` |
| 5 | cv-settings PATCH lacks schema validation | HIGH | `app/api/user/cv-settings/route.ts:9` |
| 6 | Section visibility PATCH read-modify-write lost update | MEDIUM | `app/api/profile/section-visibility/route.ts:18` |
| 7 | Photo/gallery limit check is TOCTOU | MEDIUM | `app/api/user-photos/route.ts:44` |
| 8 | Duplicate request index missing phone column | MEDIUM | `supabase/migrations/20260314000016_request_improvements.sql:76` |
| 9 | CV parse accepts any user's storage path | HIGH | `app/api/cv/parse/route.ts:19` |
| 10 | Storage delete result not checked (orphaned files) | MEDIUM | `app/api/user-photos/[id]/route.ts:23` |
| 11 | Account delete skips saved_profiles where saved_user_id = deleted user | MEDIUM | `app/api/account/delete/route.ts:52` |
| 12 | Account delete skips profile_folders + saved_profiles owned by user | MEDIUM | `app/api/account/delete/route.ts:52` |
| 13 | Account delete skips Sprint 10 tables (education, skills, etc.) | MEDIUM | `app/api/account/delete/route.ts:42` |
| 14 | badge-count .or() string interpolates user email | MEDIUM | `app/api/badge-count/route.ts:14` |
| 15 | Migration ordering dependency for has_recipient undocumented | LOW | `supabase/migrations/20260313000003_core_tables.sql:214` |
| 16 | Photo reorder does not validate full set of IDs, allows duplicate sort_order | MEDIUM | `app/api/user-photos/route.ts:83` |
| 17 | Folder sort_order uses count — creates duplicates after delete | LOW | `app/api/profile-folders/route.ts:35` |
| 18 | certifications has no deleted_at; account delete soft-delete silently fails | MEDIUM | `app/api/account/delete/route.ts:71` |
| 19 | Inconsistent GET response envelope keys across routes | LOW | Multiple |
| 20 | profile_photo_url sync condition ambiguous on POST with sort_order=0 | LOW | `app/api/user-photos/route.ts:64` |
| 21 | PDF generate selects `length_m` but column is `length_meters` | HIGH | `app/api/cv/generate-pdf/route.ts:58` |
| 22 | Soft-deleted endorsement blocks re-endorsement (unique constraint not partial) | MEDIUM | `supabase/migrations/20260313000003_core_tables.sql:180` |
