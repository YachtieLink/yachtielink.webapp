# Rally 003 — Challenger A: Schema & API Integrity (Pass 2)

**Date:** 2026-03-22
**Challenger reviews:** Agent 1 (schema-query, 12 findings) + Agent 5 (api-data, 22 findings)
**Method:** Every cited file and line was read directly. Every migration claim was verified against the actual SQL file.

---

## Verified Findings

### From Agent 1

**A1-F1 — CONFIRMED CRITICAL: `length_m` ghost insert in yachts**
`lib/cv/save-parsed-cv-data.ts:146` — Line 146 reads `length_m: emp.length_m ?? null`. Migration 003 line 90 defines the column as `length_meters`. The insert field name is wrong. Severity CRITICAL stands.

**A1-F2 — CONFIRMED HIGH: `length_m` ghost select in public profile page**
`app/(public)/u/[handle]/page.tsx:60` — Line 60 selects `yachts ( id, name, yacht_type, length_m, flag_state )`. Column is `length_meters`. Severity HIGH stands.

**A1-F3 — CONFIRMED HIGH: `length_m` ghost select in PDF generate route**
`app/api/cv/generate-pdf/route.ts:58` — Line 58 selects `yachts ( id, name, yacht_type, length_m, flag_state )`. Same ghost column. This is also Agent 5 F21 — see Duplicates. Severity HIGH stands.

**A1-F4 — CONFIRMED CRITICAL: `deleted_at` update on certifications**
`app/api/account/delete/route.ts:72-74` — Code sets `{ deleted_at: new Date().toISOString() }` on the `certifications` table. Migration 003 confirms no `deleted_at` column on certifications; migration 018 adds only `expiry_reminder_60d_sent` and `expiry_reminder_30d_sent`. No migration in the full sequence adds `deleted_at` to certifications. The UPDATE silently discards the column. Severity CRITICAL stands.

**A1-F5 — CONFIRMED CRITICAL: `deleted_at` update on endorsement_requests**
`app/api/account/delete/route.ts:83-85` — Code sets `{ deleted_at: ... }` on `endorsement_requests`. Migration 003, 005, 012, 014, 016, 019 were all checked. No `deleted_at` column is ever added to `endorsement_requests`. The canonical cancellation pattern (`status: 'cancelled', cancelled_at: ...`) exists but is not used here. Severity CRITICAL stands.

**A1-F6 — CONFIRMED HIGH: `length_m` interface misalignment**
`lib/cv/save-parsed-cv-data.ts:8` — Interface field `length_m` is confirmed at line 8. This is the root cause behind F1, F7, and F8. All downstream consumers inherit the wrong name. Severity HIGH stands.

**A1-F7 — CONFIRMED MEDIUM: `length_m` read in PublicProfileContent**
`components/public/PublicProfileContent.tsx:362` — Line 362 reads `att.yachts.length_m`. This is downstream of the bad SELECT in F2. Both the query and the component read must be fixed together. Severity MEDIUM stands — it is a rendering-only consequence of F2, not independently critical.

**A1-F8 — CONFIRMED MEDIUM: `length_m` in ProfilePdfDocument type**
`components/pdf/ProfilePdfDocument.tsx:32` — Line 32 declares `length_m?: number | null`. Confirmed. Severity MEDIUM stands.

**A1-F9 — CONFIRMED MEDIUM: sitemap exposes deleted users**
`app/sitemap.ts:8-9` — The query filters `.not('handle', 'is', null)` but has no `.is('deleted_at', null)` filter. Deleted users have their handle set to `deleted-{uid}` (confirmed in `account/delete/route.ts:62`). These handles will appear in the sitemap. Severity MEDIUM stands.

**A1-F10 — CONFIRMED NOT A BUG: DeepLinkFlow uses correct `length_meters`**
`components/endorsement/DeepLinkFlow.tsx:31` and `app/(public)/r/[token]/page.tsx:20` — Both correctly use `length_meters`. The endorsement-requests route at line 28 also selects `length_meters`. This is correctly aligned. Agent 1's conclusion is correct.

**A1-F11 — CONFIRMED INFORMATIONAL: No spurious `deleted_at` on certifications queries**
Correct. No query in the codebase attempts `.is('deleted_at', null)` on certifications except the account delete route (F4). Finding is informational and accurate.

**A1-F12 — CONFIRMED LOW: `expiry_reminder` columns missing NOT NULL**
Migration 018 (`20260315000018_sprint7_payments.sql:13-14`) confirms: `ADD COLUMN IF NOT EXISTS expiry_reminder_60d_sent boolean DEFAULT false` — no `NOT NULL`. The cron at `cert-expiry/route.ts:62` checks `!cert.expiry_reminder_60d_sent`, which coerces null to true and could re-trigger sends on rows where the column was never written. The risk is low but real. Severity LOW stands.

---

### From Agent 5

**A5-F1 — CONFIRMED HIGH: Race condition in photo reorder**
`app/api/user-photos/route.ts:88-101` — `Promise.all(updates)` fires N concurrent writes. The subsequent `.select('photo_url')` on `photo_ids[0]` runs after `await Promise.all`, so it does not execute concurrently with the writes — the read is sequentially after all writes complete. The agent's claim that the read "runs concurrently with the updates" is slightly inaccurate (it runs after `await Promise.all`). However, the real risk remains: if any individual write fails silently (Supabase JS does not throw on `.update()` errors — error is only in the return value, and here it is discarded), `sort_order` ends up partially written with no detection. Severity HIGH stands, but the race description should be corrected: the issue is silent failure, not a literal read-write race.

**A5-F2 — CONFIRMED HIGH: Race condition in gallery reorder**
`app/api/user-gallery/route.ts:80-83` — Same pattern. `Promise.all(updates)` with no error checking on individual results, always returns `{ ok: true }`. Confirmed.

**A5-F3 — CONFIRMED HIGH: Skills bulk replace loses IDs in rollback**
`app/api/user-skills/route.ts:37-56` — Snapshot selects `name, category, sort_order` without `id`. If rollback fires, rows get new UUIDs. The dirty-window problem is also real: a concurrent GET during the delete+insert window returns empty. Confirmed.

**A5-F4 — CONFIRMED HIGH: Hobbies bulk replace same rollback pattern**
`app/api/user-hobbies/route.ts:37-56` — Identical. Confirmed.

**A5-F5 — CONFIRMED HIGH: cv-settings PATCH lacks schema validation**
`app/api/user/cv-settings/route.ts:9` — `req.json()` is called with no try/catch and no Zod schema. The `cv_public_source` null-passing vulnerability is confirmed: `if (cv_public_source && ...)` — an explicit `null` passes the guard and would be included in the update object. However, the update object also checks `if (cv_public_source) update.cv_public_source = cv_public_source` at line 31, so `null` would NOT be added to the update (falsy guard again). This partially mitigates the concern. The missing try/catch on `req.json()` remains a real issue. Severity should be downgraded from HIGH to MEDIUM — the null leakage the agent describes is partially blocked, but the uncaught parse error is real.

**A5-F6 — CONFIRMED MEDIUM: Section visibility read-modify-write lost update**
`app/api/profile/section-visibility/route.ts:18-30` — Read-modify-write without any optimistic lock or JSONB atomic update. Confirmed. In practice, two tabs toggling different keys simultaneously is a realistic scenario (user opens settings on phone and desktop). Severity MEDIUM stands.

**A5-F7 — CONFIRMED MEDIUM: Photo/gallery limit check is TOCTOU**
`app/api/user-photos/route.ts:44-50` and `app/api/user-gallery/route.ts:43-48` — Count-then-insert with no atomicity. Severity MEDIUM stands.

**A5-F8 — CONFIRMED MEDIUM: Duplicate pending request index missing phone**
`supabase/migrations/20260314000016_request_improvements.sql:76-78` — The unique partial index is on `(requester_id, yacht_id, recipient_email)` only. `recipient_phone` is excluded. Migration 019 adds a phone-recipient index for lookup but not a uniqueness constraint. Confirmed.

**A5-F9 — CONFIRMED HIGH: CV parse accepts any user's storage path**
`app/api/cv/parse/route.ts:19-37` — The `parseCVSchema` at `lib/validation/schemas.ts:43` validates only `z.string().min(1).max(500)`. No ownership check exists in the route after schema validation. The `serviceClient` bypasses RLS and downloads from `cv-uploads/{storagePath}` without verifying the path prefix matches `user.id`. This is a genuine data-exfiltration path. Severity HIGH stands.

**A5-F10 — CONFIRMED MEDIUM: Storage delete result not checked**
`app/api/user-photos/[id]/route.ts:24-25` — `await supabase.storage.from('user-photos').remove([storagePath])` result is not checked. Confirmed. Same pattern at `app/api/user-gallery/[id]/route.ts:51`. Severity MEDIUM stands.

**A5-F11 — PARTIALLY CONFIRMED, SEVERITY DOWNGRADED: Account delete skips saved_profiles as saved subject**
The agent claims `ON DELETE CASCADE` doesn't fire because the users row is not hard-deleted. This is correct. However, looking at migration 021 (`20260317000021_profile_robustness.sql:101`): `saved_user_id uuid not null references users(id) on delete cascade`. The CASCADE is `on delete cascade` — it fires on hard DELETE of the users row, not on soft-delete. Since account deletion anonymises (not hard-deletes) the users row, CASCADE never fires. The saved_profiles entries pointing to the anonymised user do persist. However, the practical impact is softer than presented: the anonymised user record still exists with `full_name: '[Deleted User]'`, so the UI renders "[Deleted User]" — this is arguably the correct GDPR-compliant behaviour (the endorsement graph is preserved intentionally, per the code comment at line 51 of the delete route). The saved_profiles entries are not a privacy leak since PII has been stripped. Severity should be downgraded from MEDIUM to LOW — this is a UX concern (stale entries), not a privacy violation.

**A5-F12 — CONFIRMED MEDIUM: Account delete skips profile_folders and saved_profiles as owner**
`app/api/account/delete/route.ts:42-93` — Neither `profile_folders` nor `saved_profiles` (where `user_id = user.id`) are deleted. These tables have `ON DELETE CASCADE` in the migration but CASCADE never fires because the users row is not hard-deleted. The rows are orphaned. Severity MEDIUM stands.

**A5-F13 — CONFIRMED MEDIUM: Account delete skips Sprint 10 tables**
`app/api/account/delete/route.ts:42-93` — Storage is wiped at step 2 (confirmed: `user-photos` and `user-gallery` buckets). But DB rows for `user_photos`, `user_gallery`, `user_education`, `user_skills`, `user_hobbies` are never deleted. Migration 021 confirms all five tables have `ON DELETE CASCADE` from `users(id)` — but CASCADE doesn't fire on soft-delete. The DB rows for deleted users persist indefinitely with broken storage URLs. Severity MEDIUM stands.

**A5-F14 — CONFIRMED MEDIUM: badge-count uses string-interpolated email in .or()**
`app/api/badge-count/route.ts:16` — `` .or(`recipient_user_id.eq.${user.id},recipient_email.eq.${user.email}`) `` — confirmed. The email is drawn from the Supabase auth token (which Supabase validates), but the filter string construction is fragile. Severity MEDIUM stands.

**A5-F15 — CONFIRMED LOW: Migration ordering dependency undocumented**
Migration 003 and 019 relationship confirmed. The constraint is dropped and replaced correctly. Low risk. Severity LOW stands.

**A5-F16 — CONFIRMED MEDIUM: Photo reorder allows partial ID array, no duplicate sort_order prevention**
`app/api/user-photos/route.ts:83-108` — No check that `photo_ids` covers all of the user's photos. No UNIQUE constraint on `(user_id, sort_order)` in the migration (confirmed in `20260317000021_profile_robustness.sql`). Duplicate sort_order values can persist. Severity MEDIUM stands.

**A5-F17 — CONFIRMED LOW: Folder sort_order uses COUNT, vulnerable to post-delete duplicates**
`app/api/profile-folders/route.ts:35-43` — Uses `count` not `MAX(sort_order) + 1`. Same pattern confirmed at `app/api/user-education/route.ts:42`. Severity LOW stands.

**A5-F18 — DUPLICATE (same as A1-F4, see Duplicates section)**

**A5-F19 — CONFIRMED LOW: Inconsistent response envelope keys**
Confirmed by reading routes: `{ photos }`, `{ items }`, `{ education }`, `{ skills }`, `{ hobbies }`, `{ folders }`, `{ endorsements }`. Not a data integrity bug. Severity LOW stands.

**A5-F20 — CONFIRMED LOW: profile_photo_url sync condition ambiguous on POST sort_order=0**
`app/api/user-photos/route.ts:64` — `if (sort_order === 0 || (count ?? 0) === 0)` — confirmed. If a client uploads with `sort_order: 0` when photos already exist, `profile_photo_url` is overwritten. Severity LOW stands.

**A5-F21 — DUPLICATE (same as A1-F3, see Duplicates section)**

**A5-F22 — CONFIRMED MEDIUM: Soft-deleted endorsement blocks re-endorsement**
Migration 003 line 180: `constraint unique_endorsement unique (endorser_id, recipient_id, yacht_id)` — table-level UNIQUE constraint, not a partial index. When `deleted_at` is set, the row remains and blocks a new insert. The endorsement creation route's 23505 handler would return "You've already endorsed this person" permanently. Severity MEDIUM stands.

---

## False Positives

**A5-F1 (partial): "Read runs concurrently with updates" is inaccurate**
The agent writes that `profile_photo_url` sync "runs concurrently" with the updates. This is wrong. The read is after `await Promise.all(updates)`, so it executes sequentially after all writes complete. The real issue is silent write failures going undetected, not a read-write race. The finding is real but the mechanism description is incorrect. The severity (HIGH) is still appropriate given the silent failure risk.

**A5-F5 (partial): `cv_public_source` null leakage is blocked**
The agent claims `null` for `cv_public_source` would pass the guard and be added to the update. Looking at the code: `if (cv_public_source && !['generated', 'uploaded'].includes(cv_public_source))` — null is falsy, passes the guard. But then at line 31: `if (cv_public_source) update.cv_public_source = cv_public_source` — null is again falsy, so it is NOT added to the update object. The null leakage path the agent describes does not materialise. The uncaught `req.json()` parse error is real, but the specific null-bypass concern is incorrect.

**A5-F11 (partial severity): GDPR privacy severity overstated**
The agent classes this as a MEDIUM privacy issue, but the anonymised user retains no PII — `full_name`, `bio`, `phone`, `email`, etc. are all nulled. The saved_profiles entries pointing to the anonymised record are a UX concern (stale "[Deleted User]" entries) rather than a data exposure issue. Downgrade to LOW.

---

## Missed Issues

**MISS-1 — MISSING AUTH CHECK on `cv/generate-pdf` uses user's own data, but cron path not gated**
No new issue here — the PDF route correctly checks `supabase.auth.getUser()`. However, the route does NOT check `deleted_at` on the user's record. A user who initiates deletion but whose auth session is still valid could generate a PDF of their anonymised `[Deleted User]` record. Low severity, but a gap.

**MISS-2 — `sitemap.ts` uses service client but no rate-limiting and no pagination**
`app/sitemap.ts:6-9` — The sitemap query fetches all users with no `.limit()` or pagination. As the user base grows, this query will return an unbounded result set on every sitemap request. Next.js sitemaps are revalidated periodically. A large dataset here could cause memory pressure or slow cold starts. Neither agent flagged this.

**MISS-3 — `user-education` route: same sort_order COUNT bug as profile-folders (Agent 5 F17)**
Agent 5 mentioned `user-education` in the F17 description text but only listed `profile-folders` in the finding title. The `app/api/user-education/route.ts:42` has `sort_order: count ?? 0` — confirmed. This was mentioned in F17 body but should be called out explicitly as the same bug. Both routes need the same fix.

**MISS-4 — Account delete does not revoke active Stripe subscription sessions or portal links**
`app/api/account/delete/route.ts:26-39` — Stripe subscriptions are cancelled. However, if the Stripe customer portal was open in another tab, it may still show as active until Stripe webhook confirms. This is a minor timing gap, not a code bug. Informational only.

**MISS-5 — `parseCVSchema` ownership check gap also affects the parse count increment**
`app/api/cv/parse/route.ts:24` — The daily parse limit RPC `check_cv_parse_limit` is called with `p_user_id: user.id`. If an attacker exfiltrates another user's CV (MISS per A5-F9), the parse count is charged to the attacker, not the victim. This means the attacker is limited by their own parse quota (3/day) — so the exfiltration is rate-limited but not blocked. The A5-F9 fix (path prefix check) fully resolves this.

**MISS-6 — `user-photos/route.ts` PUT reorder: `profile_photo_url` is updated even when `photo_ids[0]` write may have silently failed**
Extending A5-F1 further: after `Promise.all(updates)`, the code reads back `photo_ids[0]`'s `photo_url` and updates `profile_photo_url`. If the update for `photo_ids[0]` failed silently, the row still exists with its old `sort_order`. The read of `photo_ids[0]` will succeed and return its URL, but that photo may not actually be at `sort_order=0`. So `profile_photo_url` is updated to a URL that the reorder intended to make first, but whose `sort_order` was not actually updated. In practice this often produces the right result by coincidence, but it is logically incorrect. Neither agent called this out explicitly.

---

## Duplicates

The following findings across both agents describe the same underlying bug:

| Agent 1 Finding | Agent 5 Finding | Underlying Bug |
|-----------------|-----------------|----------------|
| F3 (HIGH) — `length_m` ghost select in generate-pdf route | F21 (HIGH) — same file, same line | Same bug: `generate-pdf/route.ts:58` selects `length_m` instead of `length_meters` |
| F4 (CRITICAL) — `deleted_at` update on certifications | F18 (MEDIUM) — same file, same lines | Same bug: `account/delete/route.ts:72-74` — certifications have no `deleted_at` column |

**Notes on duplicate severity discrepancies:**
- F4 vs F18: Agent 1 rates this CRITICAL, Agent 5 rates it MEDIUM. The CRITICAL rating from Agent 1 is better justified — certifications are never cleaned up on account deletion, which is a GDPR compliance failure. MEDIUM underrates the impact.
- F3 vs F21: Both rate HIGH. Agreement is correct.

---

## Summary Assessment

**Agent 1 accuracy: 11/12 confirmed real, 0 false positives, 1 informational (F10 is not a bug)**
Strong report. The `length_m` audit is thorough and systematic. The account deletion ghost columns are correctly classified as CRITICAL.

**Agent 5 accuracy: 20/22 confirmed real, 2 partial false positives (F1 mechanism, F5 null leak), 1 severity overstatement (F11)**
Good coverage. The account deletion cleanup gaps (F11-F13) are the most impactful findings. The cv parse ownership vulnerability (F9) is the most severe security finding in the entire rally. The minor inaccuracies in F1 and F5 do not invalidate those findings — the bugs are real, the explanations have errors.

**Highest priority findings confirmed by both agents independently (strongest signal):**
1. `length_m` ghost column family (A1-F1/F2/F3, A5-F21) — data silently lost across three surfaces
2. `certifications.deleted_at` doesn't exist (A1-F4, A5-F18) — GDPR failure on account deletion
3. `endorsement_requests.deleted_at` doesn't exist (A1-F5) — pending requests survive account deletion
4. CV parse ownership bypass (A5-F9) — security: any user's CV can be exfiltrated by another user
