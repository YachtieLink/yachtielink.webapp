# Rally 003 — Agent 1: Schema & Query Integrity Audit

**Date:** 2026-03-22
**Agent:** Agent 1 (schema-query)
**Scope:** All Supabase queries in app/, lib/, and components/ vs migration-derived schema

---

## Schema Reference (built from migrations)

### Tables and their columns (authoritative)

**public.users**
id, email, full_name, display_name, handle, bio, profile_photo_url,
onboarding_complete, departments, primary_role,
phone, whatsapp, location_country, location_city,
show_phone, show_whatsapp, show_email, show_location,
available_for_work, available_from, available_notes,
template_id, custom_subdomain, show_watermark,
subscription_status, subscription_plan, subscription_ends_at, stripe_customer_id,
created_at, updated_at, last_seen_at,
deleted_at (added sprint 8),
analytics_nudge_sent, founding_member (added sprint 7),
cv_storage_path, cv_parsed_at, cv_parse_count_today, cv_parse_count_reset_at,
latest_pdf_path, latest_pdf_generated_at (added sprint 6),
ai_summary, ai_summary_edited, section_visibility, social_links (added sprint 10),
cv_public, cv_public_source (added sprint 11.2)

**public.yachts**
id, name, name_normalized (generated), yacht_type, size_category,
length_meters (NOT length_m), flag_state, year_built,
is_established, established_at, created_at, created_by,
cover_photo_url (added sprint 4)

**public.attachments**
id, user_id, yacht_id, role_id, role_label,
started_at, ended_at, notes, created_at, updated_at, deleted_at

**public.certifications**
id, user_id, certification_type_id, custom_cert_name,
certificate_number, issuing_body, issued_at, expires_at, document_url,
created_at, updated_at,
expiry_reminder_60d_sent, expiry_reminder_30d_sent (added sprint 7)
NOTE: NO deleted_at column on certifications

**public.endorsements**
id, endorser_id, recipient_id, yacht_id, content,
endorser_role_label, recipient_role_label,
worked_together_start, worked_together_end,
is_pinned, created_at, updated_at, deleted_at

**public.endorsement_requests**
id, requester_id, yacht_id, recipient_user_id, recipient_email,
token, status, expires_at, created_at, accepted_at,
recipient_phone, cancelled_at (added sprint 5),
is_shareable (added sprint 8 virality migration)
NOTE: NO deleted_at column on endorsement_requests

**public.saved_profiles**
id, user_id, saved_user_id, folder_id, created_at,
notes, watching (added sprint 11.3)

**public.profile_folders**
id, user_id, name, emoji, sort_order, created_at

**public.user_photos** — id, user_id, photo_url, sort_order, created_at
**public.user_gallery** — id, user_id, image_url, caption, yacht_id, sort_order, created_at
**public.user_hobbies** — id, user_id, name, emoji, sort_order
**public.user_skills** — id, user_id, name, category, sort_order
**public.user_education** — id, user_id, institution, qualification, field_of_study, started_at, ended_at, sort_order, created_at
**public.certification_types** — id, name, short_name, category, issuing_bodies, keywords, typical_validity_years, created_at
**public.roles** — id, name, department, is_senior, sort_order, created_at
**public.yachts** — (see above)
**public.profile_analytics** — id, user_id, event_type, occurred_at, viewer_role, viewer_location
**public.yacht_near_miss_log** — id, search_term, candidate_ids, action, chosen_id, created_by, created_at
**public.other_role_entries** — id, value, department, submitted_by, created_at
**public.other_cert_entries** — id, value, category, submitted_by, created_at
**internal.flags** — (admin table, not queried in app code)

---

## Findings

## Finding 1 — GHOST COLUMN: length_m inserted into yachts table

**Severity:** CRITICAL
**File:** lib/cv/save-parsed-cv-data.ts:146
**Issue:** The `yachts` table column is named `length_meters` (defined in migration 003, line 90). The CV save function inserts `length_m` — a column that does not exist. Supabase PostgREST will silently ignore unknown columns in an INSERT payload, meaning the length is discarded and never stored.
**Evidence:**
```
// save-parsed-cv-data.ts line 146:
length_m: emp.length_m ?? null,

// migration 003 line 90:
length_meters  numeric(5,1),
```
**Fix:** Change `length_m` to `length_meters` in the insert object at line 146.

---

## Finding 2 — GHOST COLUMN: length_m selected from yachts in public profile page

**Severity:** HIGH
**File:** app/(public)/u/[handle]/page.tsx:60
**Issue:** The public profile page selects `length_m` from the `yachts` relation inside the attachments join. The real column name is `length_meters`. PostgREST returns null for non-existent columns in a select list, so the attachment yacht length is always null on the public profile.
**Evidence:**
```
// u/[handle]/page.tsx line 60:
yachts ( id, name, yacht_type, length_m, flag_state )

// Schema: column is length_meters
```
**Fix:** Change `length_m` to `length_meters` in the select string.

---

## Finding 3 — GHOST COLUMN: length_m selected from yachts in PDF generate route

**Severity:** HIGH
**File:** app/api/cv/generate-pdf/route.ts:58
**Issue:** The PDF generation route selects `length_m` from the `yachts` relation. The real column is `length_meters`. The PDF renderer will receive null for yacht length on all generated CVs.
**Evidence:**
```
// generate-pdf/route.ts line 58:
yachts ( id, name, yacht_type, length_m, flag_state )
```
**Fix:** Change `length_m` to `length_meters`.

---

## Finding 4 — GHOST COLUMN: deleted_at update on certifications (no such column)

**Severity:** CRITICAL
**File:** app/api/account/delete/route.ts:73
**Issue:** The account deletion route attempts to soft-delete certifications by setting `deleted_at`. The `certifications` table has no `deleted_at` column — only `updated_at` exists. This UPDATE will fail or silently do nothing via PostgREST (unknown column), meaning certifications are NOT cleaned up on account deletion, violating GDPR intent.
**Evidence:**
```
// account/delete/route.ts line 72-74:
await admin.from('certifications')
  .update({ deleted_at: new Date().toISOString() })
  .eq('user_id', user.id);

// certifications schema (migration 003 + 007): no deleted_at column
```
**Fix:** Either add a `deleted_at` migration to certifications, or hard-delete certifications during account deletion instead. If retaining as hard-delete, change `.update({ deleted_at: ... })` to `.delete()`.

---

## Finding 5 — GHOST COLUMN: deleted_at update on endorsement_requests (no such column)

**Severity:** CRITICAL
**File:** app/api/account/delete/route.ts:84
**Issue:** The account deletion route attempts to soft-delete endorsement_requests by setting `deleted_at`. The `endorsement_requests` table has no `deleted_at` column. This UPDATE silently fails, meaning pending endorsement requests from a deleted user are never cleaned up.
**Evidence:**
```
// account/delete/route.ts line 83-85:
await admin.from('endorsement_requests')
  .update({ deleted_at: new Date().toISOString() })
  .eq('requester_id', user.id);

// endorsement_requests schema (migration 003 + 005 + 012 + 014 + 016 + 019): no deleted_at column
// Valid cancellation pattern already exists: { status: 'cancelled', cancelled_at: ... }
```
**Fix:** Change the delete operation to use the canonical cancellation pattern: `.update({ status: 'cancelled', cancelled_at: new Date().toISOString() })`.

---

## Finding 6 — GHOST COLUMN: length_m in ParsedEmployment interface used for yachts insert

**Severity:** HIGH
**File:** lib/cv/save-parsed-cv-data.ts:8
**Issue:** The `ParsedEmployment` interface uses `length_m` as the field name (line 8), and the CV extraction prompt (lib/cv/prompt.ts line 16) also instructs the AI to return `length_m`. This is an internally consistent naming convention but it maps to the wrong database column name `length_meters` at insert time (Finding 1). Additionally, the `CvReviewClient.tsx` at line 177 displays `emp.length_m` — this is a UI-only read of parsed data so it is cosmetically correct, but the end-to-end round-trip discards the value at the DB layer.
**Evidence:**
```
// save-parsed-cv-data.ts line 8:
length_m?: number | null

// save-parsed-cv-data.ts line 146 (the DB insert):
length_m: emp.length_m ?? null,   // WRONG column name for yachts table
```
**Fix:** Rename the interface field `length_m` to `length_meters` throughout: `save-parsed-cv-data.ts`, `lib/cv/prompt.ts`, `components/cv/CvReviewClient.tsx`, and `components/pdf/ProfilePdfDocument.tsx`. Align the AI prompt to return `length_meters`.

---

## Finding 7 — GHOST COLUMN: length_m read in PublicProfileContent component

**Severity:** MEDIUM
**File:** components/public/PublicProfileContent.tsx:362
**Issue:** The component reads `att.yachts.length_m` to display yacht length in the public profile. Because the SELECT query in `u/[handle]/page.tsx` uses `length_m` (a non-existent column, see Finding 2), this will always be falsy and the length will never display. The component itself is internally consistent with the wrong field name; fixing Finding 2 at the query level alone is insufficient — the component prop type must also use `length_meters`.
**Evidence:**
```
// PublicProfileContent.tsx line 362:
{att.yachts.length_m ? ` · ${att.yachts.length_m}m` : ''}
```
**Fix:** After fixing the SELECT query (Finding 2) to use `length_meters`, update this component reference to `att.yachts.length_meters`.

---

## Finding 8 — GHOST COLUMN: length_m in ProfilePdfDocument component type

**Severity:** MEDIUM
**File:** components/pdf/ProfilePdfDocument.tsx:32
**Issue:** The PDF document component declares `length_m?: number | null` in its props type for attachment yachts. This is consistent with the query in generate-pdf route (which also uses `length_m`), but both are wrong — the schema column is `length_meters`.
**Evidence:**
```
// ProfilePdfDocument.tsx line 32:
length_m?: number | null
```
**Fix:** Rename to `length_meters` and fix the corresponding query (Finding 3).

---

## Finding 9 — MISSING NOT NULL FILTER: sitemap exposes deleted users

**Severity:** MEDIUM
**File:** app/sitemap.ts:8
**Issue:** The sitemap query does not filter `deleted_at IS NULL`. Soft-deleted users (who have had their handle changed to `deleted-{uid}`) could appear in the sitemap under their anonymised handle `deleted-XXXXXXXX`, since the `handle` column is set to that value on deletion. This leaks information about deleted accounts to search engines.
**Evidence:**
```
// sitemap.ts line 7-9:
const { data: users } = await supabase
  .from('users')
  .select('handle, updated_at')
  .not('handle', 'is', null)
  // Missing: .is('deleted_at', null)
```
**Fix:** Add `.is('deleted_at', null)` to the sitemap query.

---

## Finding 10 — INCORRECT COLUMN NAME: length_m in DeepLinkFlow component type

**Severity:** LOW
**File:** components/endorsement/DeepLinkFlow.tsx:31
**Issue:** The `DeepLinkFlow` component declares `length_meters: number | null` in its yacht type interface (correctly named), but the data feeding it comes from the `/api/endorsement-requests/:id` route which selects `length_meters` correctly (line 28 of that route). This specific instance is correctly aligned. Noted for completeness as part of the length_m/length_meters audit trail.
**Evidence:**
```
// DeepLinkFlow.tsx line 31:
length_meters: number | null   // correct
// endorsement-requests/[id]/route.ts line 28:
yacht:yachts!yacht_id(id, name, yacht_type, length_meters, flag_state, year_built)  // correct
```
**Fix:** No fix needed. Documenting as confirmed-correct to close the audit trail.

---

## Finding 11 — QUERY SCOPE: certifications lacks deleted_at but queries don't assume it

**Severity:** LOW (informational)
**File:** Multiple (certs queries throughout)
**Issue:** No code attempts `.is('deleted_at', null)` on the `certifications` table (the column doesn't exist), which is correct. The `certifications` table intentionally has no soft-delete in the schema. However, the account deletion route (Finding 4) incorrectly assumes it does. All other cert queries are correctly written without a deleted_at filter.
**Evidence:** Confirmed no spurious `deleted_at` filter on certifications anywhere except the account delete route.
**Fix:** No fix needed for queries. Fix needed only in `account/delete/route.ts` (covered in Finding 4).

---

## Finding 12 — MISSING NOT NULL HANDLING: certifications.expiry_reminder_60d_sent assumed non-null

**Severity:** LOW
**File:** app/api/cron/cert-expiry/route.ts:62
**Issue:** The cert expiry cron checks `!cert.expiry_reminder_60d_sent` and `!cert.expiry_reminder_30d_sent`. These columns are defined as `boolean DEFAULT false` (nullable via PostgREST return — the column is `DEFAULT false` but not `NOT NULL` as per migration 007). In practice `DEFAULT false` means all rows will have `false` unless null was explicitly inserted, so this is low risk. However, the type coercion `!cert.expiry_reminder_60d_sent` handles null (coerces to true, which could re-trigger sends). Confirm the migration adds these as `NOT NULL DEFAULT false` if strict correctness is required.
**Evidence:**
```
// migration 007 line 12-13:
ADD COLUMN IF NOT EXISTS expiry_reminder_60d_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS expiry_reminder_30d_sent boolean DEFAULT false;
// No NOT NULL constraint — existing rows will have null until backfilled
```
**Fix:** Add `NOT NULL` constraint to these columns in a new migration, or confirm a backfill was run.

---

## Summary

| # | Severity | Table / Column | File |
|---|----------|---------------|------|
| 1 | CRITICAL | yachts.length_m (ghost insert) | lib/cv/save-parsed-cv-data.ts:146 |
| 2 | HIGH | yachts.length_m (ghost select) | app/(public)/u/[handle]/page.tsx:60 |
| 3 | HIGH | yachts.length_m (ghost select) | app/api/cv/generate-pdf/route.ts:58 |
| 4 | CRITICAL | certifications.deleted_at (column doesn't exist) | app/api/account/delete/route.ts:73 |
| 5 | CRITICAL | endorsement_requests.deleted_at (column doesn't exist) | app/api/account/delete/route.ts:84 |
| 6 | HIGH | length_m vs length_meters interface alignment | lib/cv/save-parsed-cv-data.ts:8 + prompt.ts |
| 7 | MEDIUM | length_m component read never populated | components/public/PublicProfileContent.tsx:362 |
| 8 | MEDIUM | length_m component type mismatch | components/pdf/ProfilePdfDocument.tsx:32 |
| 9 | MEDIUM | users.deleted_at not filtered in sitemap | app/sitemap.ts:8 |
| 10 | LOW | length_meters in DeepLinkFlow — confirmed correct | components/endorsement/DeepLinkFlow.tsx:31 |
| 11 | LOW | certifications has no deleted_at — queries correct | Multiple |
| 12 | LOW | expiry_reminder columns missing NOT NULL | app/api/cron/cert-expiry/route.ts:62 |

**Ghost column report (per task brief):**
- `users.deleted_at` — EXISTS (added in migration 020 sprint8). Queries using it are correct.
- `users.subscription_plan` — EXISTS (defined in migration 003 line 50). Queries using it are correct.
- `certifications.sort_order` — DOES NOT EXIST. No code was found querying this column (not a live bug).
- `certifications.name` — DOES NOT EXIST. Code correctly uses `custom_cert_name` or the `certification_types(name)` relation. No bug.
