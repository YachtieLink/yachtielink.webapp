# Rally 003 — Final Proposal

**Date:** 2026-03-22
**Status:** Awaiting founder approval
**Prepared by:** Orchestrator, synthesised from 6 Pass 1 agents + 3 Pass 2 challengers

---

## Executive Summary

**Total confirmed findings:** 52 unique bugs (after deduplication and false-positive removal)
**Severity breakdown:** 10 HIGH, 24 MEDIUM, 18 LOW/INFO

**Top 5 most impactful issues:**

1. **CV parse path traversal** (A5-F9) — Any authenticated user can exfiltrate another user's uploaded CV by supplying their storage path. Security vulnerability with immediate data-exposure risk.
2. **Account deletion silently fails on 3 tables + skips 7 more** (A1-F4, A1-F5, A5-F11/F12/F13) — Certifications and endorsement requests use ghost `deleted_at` columns that don't exist. Five Sprint 10 tables plus profile_folders and saved_profiles are never cleaned up. GDPR compliance gap.
3. **Deleted users remain publicly visible** (A2-F2) — The RLS `users: public read` policy has no `deleted_at IS NULL` filter. Anonymised deleted accounts are enumerable by anyone, appear in the sitemap, and render as public profile pages.
4. **`length_m` ghost column family** (A1-F1/F2/F3/F6/F7/F8) — The `yachts.length_meters` column is referenced as `length_m` across 6 files. Yacht length is silently discarded on CV save, never displayed on public profiles, and missing from generated PDFs.
5. **Cron endpoints publicly accessible without secret** (A2-F7) — If `CRON_SECRET` is not set, both cron routes skip auth entirely, allowing unauthenticated mass email triggers.

---

## Proposed Fix Sprints

---

### Sprint 1 — Security: CV Path Traversal + Cron Auth + Rate Limit Hardening

**Priority:** P0 (ship today)
**Blast radius:** `app/api/cv/parse/route.ts`, `app/api/cron/analytics-nudge/route.ts`, `app/api/cron/cert-expiry/route.ts`, `lib/rate-limit/limiter.ts`. These files are isolated API routes with no shared component dependencies.
**Regression risk:** Low. The path check is an additive guard. The cron secret inversion is a one-line logic flip. Rate-limit fail-closed only affects expensive routes.
**Safe ordering:** No dependencies. Ship first.
**Rollback strategy:** Revert the commit. No migrations involved.
**Findings included:** A5-F9 (CV path traversal), A2-F7 (cron optional secret), A2-F6 (rate limit fails open)

**Changes:**

- `app/api/cv/parse/route.ts`: After schema validation and auth, add guard: if `!storagePath.startsWith(user.id + '/')`, return 403. This prevents any user from accessing another user's CV files via the service client.
- `app/api/cron/analytics-nudge/route.ts:11-13`: Invert the guard to `if (!process.env.CRON_SECRET || cronSecret !== \`Bearer ${process.env.CRON_SECRET}\`)` so the secret is mandatory.
- `app/api/cron/cert-expiry/route.ts:11-13`: Same inversion.
- `lib/rate-limit/limiter.ts`: Add a `failOpen: boolean` parameter (default `true` for backward compat). For the three expensive routes (`cv/parse`, `cv/generate-pdf`, `profile/ai-summary`), pass `failOpen: false`. When `failOpen` is false and Redis is unavailable, return `{ allowed: false }`.

**Verification:**
- Test: call `/api/cv/parse` with a `storagePath` that starts with a different user's UUID. Expect 403.
- Test: call `/api/cron/analytics-nudge` without `Authorization` header when `CRON_SECRET` is set. Expect 401.
- Test: call `/api/cron/analytics-nudge` when `CRON_SECRET` env var is absent. Expect 401.
- Test: call `/api/cv/parse` when Redis is down. Expect 429 (rate limited), not 200.

---

### Sprint 2 — Security: RLS Policy for Deleted Users + Analytics Abuse + Contact Field Exposure

**Priority:** P0 (ship today)
**Blast radius:** `supabase/migrations/` (new migration), `app/sitemap.ts`, `app/(public)/u/[handle]/page.tsx`. The RLS change affects every `SELECT` on `users` from unauthenticated clients. The sitemap fix is additive. The profile page change strips fields server-side.
**Regression risk:** MEDIUM. Changing the `users: public read` policy to exclude `deleted_at IS NOT NULL` rows will immediately hide soft-deleted users from all public queries. If any legitimate code path needs to read deleted users via the anon/authenticated client (not service role), it will break. Review all `users` queries that use the user-scoped client to confirm none intentionally read deleted rows. The analytics policy change adds a subquery which could slightly increase insert latency.
**Safe ordering:** No dependencies on Sprint 1. Can ship in parallel.
**Rollback strategy:** New migration has a DOWN path: restore the original `users: public read` policy with `USING (true)`.
**Findings included:** A2-F2 (deleted users visible), A2-F3 (analytics abuse), A1-F9 (sitemap exposes deleted users), A2-F8/CB-MISS-2 (contact fields in HTML, cert numbers public)

**Changes:**

- New migration: Drop and recreate `users: public read` policy as `USING (deleted_at IS NULL)`. Add a service-role-only policy for admin access to deleted accounts.
- New migration: Update `profile_analytics` insert policy from `WITH CHECK (true)` to `WITH CHECK (user_id IN (SELECT id FROM public.users WHERE deleted_at IS NULL))`.
- New migration: Restrict `certifications: public read` to exclude `certificate_number` and `document_url` columns. Either use a view-based approach or create a SECURITY DEFINER function for public cert reads that omits sensitive columns.
- `app/sitemap.ts:8`: Add `.is('deleted_at', null)` to the query.
- `app/(public)/u/[handle]/page.tsx`: Strip `phone`, `whatsapp`, `email` from the user object before passing to `PublicProfileContent`. Only include them when the corresponding `show_*` flag is true. This ensures contact fields are not in the serialised HTML.

**Verification:**
- Test: query `users` table from an unauthenticated client after soft-deleting a test user. Expect 0 rows for that user.
- Test: navigate to `/u/deleted-XXXXX` — expect 404 or redirect, not a rendered profile.
- Test: check sitemap XML output. Expect no `deleted-*` handles.
- Test: view page source of a public profile where `show_phone = false`. Expect no phone number in the HTML.
- Test: call `record_profile_event` with a non-existent UUID. Expect insert failure.
- Test: query `certifications` from unauthenticated client. Expect `certificate_number` is not returned.

---

### Sprint 3 — Security: Endorsement Deep-Link Fix + Endorsement Request RLS Tightening

**Priority:** P0 (this week)
**Blast radius:** `app/api/endorsement-requests/[id]/route.ts`, `supabase/migrations/` (new migration for endorsement_requests update policy). The deep-link flow is a core feature; this change must be tested end-to-end.
**Regression risk:** MEDIUM. Switching from direct table query to RPC changes the response shape. The RPC `get_endorsement_request_by_token` must return all columns the component expects. The RLS policy split for endorsement_requests may break existing update paths if any code updates fields beyond `status` and `cancelled_at` as a recipient.
**Safe ordering:** Independent of Sprints 1-2.
**Rollback strategy:** Revert the commit + revert migration (restore original update policy).
**Findings included:** A2-F5/CB-F5 (endorsement GET uses wrong client — HIGH for email-only recipients), A2-F10 (endorsement_requests update policy over-broad)

**Changes:**

- `app/api/endorsement-requests/[id]/route.ts`: Replace the direct `.from('endorsement_requests')` query with `supabase.rpc('get_endorsement_request_by_token', { p_token: token })`. This uses the existing SECURITY DEFINER function granted to `anon`, restoring the deep-link flow for unauthenticated and email-only recipients.
- New migration: Split `endorsement_requests: own update` into two policies:
  - Requester policy: `USING (auth.uid() = requester_id)` — full update.
  - Recipient policy: `USING (auth.uid() = recipient_user_id)` with `WITH CHECK` restricting updatable columns to `status` and `cancelled_at` only (or use a column-level approach).

**Verification:**
- Test: as an unauthenticated user, follow a deep-link `/r/:token`. Expect the endorsement request data loads correctly.
- Test: as a recipient, attempt to update `requester_id` on an endorsement request via PostgREST. Expect failure.
- Test: as a recipient, decline a request (setting `status: 'declined'`). Expect success.

---

### Sprint 4 — Data Integrity: Account Deletion Cleanup

**Priority:** P1 (this week)
**Blast radius:** `app/api/account/delete/route.ts`, `supabase/migrations/` (new migration to add `deleted_at` to certifications OR change to hard-delete). This touches the deletion flow which is critical and currently partially broken.
**Regression risk:** HIGH — this is the most sensitive sprint. Changes to the deletion sequence must be tested against every table. Adding hard-deletes where soft-deletes were intended could cause data loss if the sequence is interrupted partway through. The CASCADE from `auth.users` deletion (step 9) provides a safety net for some tables but not all.
**Safe ordering:** Must come after Sprint 2 (which fixes the RLS policy for deleted users). The account deletion flow anonymises the user row; the new RLS policy hides anonymised rows. Both must be in place for GDPR compliance.
**Rollback strategy:** Revert the commit. If a migration adds `deleted_at` to certifications, provide a DOWN migration that drops the column. For the expanded deletion steps (hard-deleting Sprint 10 tables), rollback is safe since the existing flow simply skipped these tables.
**Findings included:** A1-F4 (certifications ghost deleted_at), A1-F5 (endorsement_requests ghost deleted_at), A5-F11 (saved_profiles as subject), A5-F12 (profile_folders + saved_profiles as owner), A5-F13 (Sprint 10 tables not cleaned)

**Changes:**

- `app/api/account/delete/route.ts`:
  - **Certifications (line 72-74):** Change from `.update({ deleted_at: ... })` to `.delete().eq('user_id', user.id)`. Certifications have no `deleted_at` column and cert storage files are already wiped in step 2. Hard-delete is the correct approach.
  - **Endorsement requests (line 83-85):** Change from `.update({ deleted_at: ... })` to `.update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('requester_id', user.id)`. These columns exist and match the canonical cancellation pattern.
  - **Add new cleanup steps** (between step 2 storage wipe and step 9 auth delete):
    - `admin.from('saved_profiles').delete().eq('user_id', user.id)` — owner's saved profiles
    - `admin.from('saved_profiles').delete().eq('saved_user_id', user.id)` — others' saves of this user
    - `admin.from('profile_folders').delete().eq('user_id', user.id)`
    - `admin.from('user_education').delete().eq('user_id', user.id)`
    - `admin.from('user_skills').delete().eq('user_id', user.id)`
    - `admin.from('user_hobbies').delete().eq('user_id', user.id)`
    - `admin.from('user_photos').delete().eq('user_id', user.id)`
    - `admin.from('user_gallery').delete().eq('user_id', user.id)`
  - **Add error checking:** After each admin operation, check the returned error. If any step fails, log the error and continue (don't abort the sequence) but report partial failure in the response.

**HIDDEN RISK FLAG:** Do NOT add `ON DELETE CASCADE` to these tables as an alternative fix. The users row is not hard-deleted (it is anonymised), so CASCADE would never fire. Additionally, adding CASCADE to tables like `saved_profiles.saved_user_id` could cause unexpected data loss if a user row is ever hard-deleted in the future (all other users' saved references to that profile would vanish).

**Verification:**
- Test: delete a test account that has certifications, endorsement requests, saved profiles, folders, education, skills, hobbies, photos, and gallery entries. After deletion, query each table for that user_id. Expect 0 rows in all tables.
- Test: check that `endorsement_requests` for the deleted user have `status: 'cancelled'` and `cancelled_at` is set.
- Test: check that storage buckets (`user-photos`, `user-gallery`, `cv-uploads`, `cert-documents`, `pdf-exports`) are empty for the deleted user.
- Test: verify the anonymised `users` row exists with `deleted_at` set and PII stripped.

---

### Sprint 5 — Data Integrity: `length_m` to `length_meters` Rename

**Priority:** P1 (this week)
**Blast radius:** 6 files across CV parsing, public profile, PDF generation, and components. No database migration needed — the column is already named `length_meters`. This is a code-only rename.
**Regression risk:** Low. The current code silently discards yacht length data everywhere. The fix restores correct behaviour. The only risk is a typo in the rename.
**Safe ordering:** Independent. No dependencies.
**Rollback strategy:** Revert the commit.
**Findings included:** A1-F1 (ghost insert), A1-F2 (ghost select public profile), A1-F3/A5-F21 (ghost select PDF — deduplicated), A1-F6 (interface), A1-F7 (PublicProfileContent read), A1-F8 (ProfilePdfDocument type)

**Changes:**

- `lib/cv/prompt.ts`: Change AI prompt instruction from `length_m` to `length_meters` so parsed CV data uses the correct field name.
- `lib/cv/save-parsed-cv-data.ts:8`: Rename `length_m` to `length_meters` in the `ParsedEmployment` interface.
- `lib/cv/save-parsed-cv-data.ts:146`: Change `length_m: emp.length_m` to `length_meters: emp.length_meters` in the yachts insert.
- `app/(public)/u/[handle]/page.tsx:60`: Change select string from `length_m` to `length_meters`.
- `app/api/cv/generate-pdf/route.ts:58`: Change select string from `length_m` to `length_meters`.
- `components/public/PublicProfileContent.tsx:362`: Change `att.yachts.length_m` to `att.yachts.length_meters`.
- `components/pdf/ProfilePdfDocument.tsx:32`: Change type from `length_m` to `length_meters`.
- `components/cv/CvReviewClient.tsx:177` (if referencing `length_m`): Update to `length_meters`.

**Verification:**
- Test: upload a CV with yacht length data. After parse + save, query the `yachts` table. Expect `length_meters` is populated (not null).
- Test: view the public profile of a user with yacht attachments. Expect yacht length displays (e.g., "55m").
- Test: generate a PDF for a user with yacht attachments. Expect yacht length appears in the PDF.

---

### Sprint 6 — Data Integrity: Endorsement Soft-Delete Constraint + Cert Expiry Logic + CV Rate Limiter

**Priority:** P1 (next sprint cycle)
**Blast radius:** `supabase/migrations/` (new migration for endorsement unique index), `app/api/cron/cert-expiry/route.ts`, `supabase/migrations/` (modify `check_cv_parse_limit` function).
**Regression risk:** MEDIUM. The endorsement constraint change (table-level UNIQUE to partial index) is a migration that drops and recreates the constraint. Any in-flight endorsement inserts during migration could fail. The cert expiry logic change alters email send timing. The CV rate limiter change adds `FOR UPDATE` locking which could increase contention.
**Safe ordering:** Independent of Sprints 1-5.
**Rollback strategy:** Migration has a DOWN path: drop the partial index, recreate the table-level UNIQUE constraint. Code changes revert cleanly.
**Findings included:** A5-F22 (endorsement unique constraint blocks re-endorsement), A3-F1 (cert expiry 60-day email fires at wrong day), A2-F4 (CV parse rate limiter TOCTOU)

**Changes:**

- New migration: Drop `unique_endorsement` constraint on `endorsements`. Create partial unique index: `CREATE UNIQUE INDEX endorsements_unique_active ON endorsements (endorser_id, recipient_id, yacht_id) WHERE deleted_at IS NULL;`
- `app/api/cron/cert-expiry/route.ts:62`: Change 60-day branch condition from `if (daysLeft <= 60 && ...)` to `if (daysLeft > 30 && daysLeft <= 60 && ...)`. This ensures certs first seen at 20 days go directly to the 30-day email. Remove the dead `in30` variable.
- New migration: Update `check_cv_parse_limit` function to use `SELECT ... FOR UPDATE` on the initial row read, making the check-then-increment atomic within the function's transaction.

**Verification:**
- Test: soft-delete an endorsement, then create a new endorsement for the same endorser/recipient/yacht. Expect success (no 23505 violation).
- Test: create a cert expiring in 20 days. Run the cron. Expect the 30-day email, not the 60-day email.
- Test: fire two concurrent CV parse requests. Expect at most one increments the counter past the limit.

---

### Sprint 7 — Data Integrity: Race Conditions + Validation Gaps

**Priority:** P2 (next sprint cycle)
**Blast radius:** Multiple API routes. Each fix is isolated to its own route file.
**Regression risk:** Low for each individual fix. The section-visibility atomic update requires an RPC/raw query, which is a pattern change.
**Safe ordering:** Independent.
**Rollback strategy:** Revert the commit.
**Findings included:** A5-F1/F2 (photo/gallery reorder silent failures), A5-F3/F4 (skills/hobbies rollback loses IDs), A5-F5 (cv-settings no schema validation), A3-F4/A5-F6 (section visibility race — deduplicated), A5-F7 (photo/gallery limit TOCTOU), A5-F8 (duplicate request index missing phone), A5-F16 (photo reorder partial ID array)

**Changes:**

- `app/api/user-photos/route.ts` PUT: Check each update result from `Promise.all` for errors. If any fail, return an error response instead of `{ ok: true }`. Validate that `photo_ids` array matches the full set of the user's photos before proceeding.
- `app/api/user-gallery/route.ts` PUT: Same error-checking pattern.
- `app/api/user-skills/route.ts` PUT: Include `id` in the snapshot select. On rollback, restore rows with original IDs using upsert. Better: wrap delete+insert in an RPC transaction.
- `app/api/user-hobbies/route.ts` PUT: Same fix as skills.
- `app/api/user/cv-settings/route.ts`: Wrap `req.json()` in try/catch. Add a Zod schema for the body, consistent with other PATCH routes.
- `app/api/profile/section-visibility/route.ts`: Replace read-modify-write with an atomic `jsonb_set` update via RPC or raw SQL.
- New migration: Add unique partial index `(requester_id, yacht_id, recipient_phone) WHERE recipient_phone IS NOT NULL AND cancelled_at IS NULL AND status != 'accepted'` on `endorsement_requests`.

**Verification:**
- Test: submit a photo reorder where one photo ID is invalid. Expect error response, not `{ ok: true }`.
- Test: submit a partial photo_ids array (missing one photo). Expect 400 error.
- Test: rapidly toggle two different section visibility flags. Both should persist.
- Test: send two endorsement requests to the same phone number for the same yacht. Expect the second to be rejected.

---

### Sprint 8 — Performance: N+1 Queries + Missing Indexes + Image Optimisation

**Priority:** P2 (next sprint cycle)
**Blast radius:** Cron routes, CV save logic, profile pages, `next.config.ts`, 10 component files (Image `unoptimized` removal). Image changes will change the rendered `<img>` markup and URL patterns.
**Regression risk:** MEDIUM for image changes — removing `unoptimized` will route images through Next.js image optimisation. Verify that the Supabase storage domain is correctly whitelisted in `next.config.ts` `remotePatterns` (it already is). The cron batching changes alter email-send timing.
**Safe ordering:** Independent. No migration dependencies.
**Rollback strategy:** Revert the commit.
**Findings included:** A6-F1 (analytics cron N+1), A6-F2 (cert cron N+1), A6-F3 (CV save sequential loop), A6-F4 (nudge cron full table scan), A6-F5 (export unbounded analytics), A6-F7/F8 (photos outside Promise.all), A6-F9 (missing analytics index), A6-F10 (missing subscription_status index), A6-F11 (unoptimized images), A6-F15 (saved profiles in-memory sort)

**Changes:**

- `app/api/cron/analytics-nudge/route.ts`: Replace JS-level aggregation with a DB-level `GROUP BY user_id` query (or use the existing `get_analytics_summary` RPC). Batch the flag-update into a single `.in('id', sentIds)` call after emails complete.
- `app/api/cron/cert-expiry/route.ts`: Collect cert IDs per tier, fire emails in parallel with `Promise.allSettled`, then batch-update all 60d IDs in one query and all 30d IDs in another.
- `lib/cv/save-parsed-cv-data.ts`: Batch yacht lookups and inserts where possible. At minimum, parallelise the attachment inserts.
- `app/api/account/export/route.ts`: Add `.limit(10000)` safety cap on `profile_analytics` and `endorsement_requests` queries.
- `app/(public)/u/[handle]/page.tsx:88-92`: Move `user_photos` query into the `Promise.all` block.
- `app/(protected)/app/profile/page.tsx:44-48`: Same — move `user_photos` into `Promise.all`.
- New migration: `CREATE INDEX idx_profile_analytics_event_date ON public.profile_analytics (event_type, occurred_at DESC);`
- New migration: `CREATE INDEX idx_users_subscription_status ON public.users (subscription_status) WHERE deleted_at IS NULL;`
- Remove `unoptimized` prop from all 10 Image component occurrences. Add explicit `width`/`height` or `sizes` props. Add `formats: ['image/avif', 'image/webp']` to `next.config.ts`.
- `app/api/saved-profiles/route.ts`: For `name`/`role` sort, push the sort to the DB by joining with `users` and using `ORDER BY` on the joined column, enabling DB-level pagination.

**Verification:**
- Test: run analytics nudge cron with 10 qualifying users. Verify only 2 DB queries are issued (one for aggregation, one for batch update) instead of 20+.
- Test: load a public profile page. Verify `user_photos` query is in the same waterfall group as the other parallel queries (check server timing).
- Test: load a profile with photos. Verify images are served as WebP (check response Content-Type).
- Test: EXPLAIN ANALYZE the nudge cron query. Verify it uses the new index instead of a sequential scan.

---

### Sprint 9 — UX Polish: Loading States, Empty States, Error Handling

**Priority:** P3 (backlog)
**Blast radius:** Multiple component and page files. All changes are UI-only with no data model impact.
**Regression risk:** Low. These are additive UX improvements.
**Safe ordering:** Independent.
**Rollback strategy:** Revert the commit.
**Findings included:** A4-F1 (More page flash of free plan), A4-F2 (back button hard-coded to /), A4-F5 (YachtPicker blank), A4-F6 (cert types silent failure), A4-F7 (share buttons unclear), A4-F8 (certs no loading.tsx), A4-F9 (photos silent error), A4-F10 (blank public profile content), A3-F6 (wizard setTimeout), A3-F7 (attachment empty userId), A3-F10 (CvReviewClient JSON.parse), A4-F18/CC-UX18 (CV page handle! assertion)

**Changes:**

- `app/(protected)/app/more/page.tsx`: Initialize `isPro` as `null`. Gate the billing section on `isPro !== null`.
- `components/public/HeroSection.tsx:86` + `PublicProfileContent.tsx:192`: Replace `href="/"` with `router.back()` in a client wrapper, or pass a context-aware `backHref` prop.
- `app/(protected)/app/attachment/new/page.tsx`: Add skeleton placeholder while `userId` loads. Add `!userId` to the `handleSave` early return guard.
- `app/(protected)/app/certification/new/page.tsx`: Add error state for cert types fetch failure with retry button.
- `app/(protected)/app/certs/`: Add `loading.tsx` skeleton.
- `app/(protected)/app/profile/photos/page.tsx`: Replace silent catch with error toast.
- `components/public/PublicProfileContent.tsx`: Add fallback message when all sections are hidden.
- `components/onboarding/Wizard.tsx:624,649`: Store timeout IDs in a `useRef`, clear in `useEffect` cleanup.
- `components/cv/CvReviewClient.tsx:44`: Wrap `JSON.parse` in try/catch, redirect on failure.
- `app/(protected)/app/cv/page.tsx:24`: Guard `profile.handle` — if null, show prompt to set handle instead of passing `null` to CvActions.

**Verification:**
- Test: as a Pro user, navigate to More page. Verify billing section shows a skeleton until data loads (no flash of "Free" plan).
- Test: from `/app/network`, navigate to a public profile, click Back. Expect to return to `/app/network`, not `/`.
- Test: on the certs page, verify a loading skeleton appears during navigation.

---

### Sprint 10 — UX Polish: Accessibility + Minor Fixes

**Priority:** P3 (backlog)
**Blast radius:** Component files only. No data model changes.
**Regression risk:** Low.
**Safe ordering:** Independent.
**Rollback strategy:** Revert the commit.
**Findings included:** A4-F3/F14 (SectionManager role=checkbox — deduplicated), A4-F4 (window.confirm), A4-F19 (Button spinner ARIA), A4-F20 (loading skeleton w-0), CC-MISS-2 (AnalyticsChart no SR content), CC-MISS-3 (ProfileStrength no ARIA), CC-MISS-6 (SaveProfileButton emoji), A3-F3/CB-MISS-4 (unsave/deleteFolder no rollback), A3-F9 (setFullName null guard), A4-F12 (endorsement form hint), A4-F17 (saved tab count badge)

**Changes:**

- `components/profile/SectionManager.tsx:62`: Change `role="checkbox"` to `role="switch"`.
- Replace `window.confirm()` calls in 5 files with styled confirmation dialog using BottomSheet or modal.
- `components/ui/Button.tsx`: Add `aria-busy={loading}` to the button element during loading state.
- `app/(protected)/app/more/loading.tsx:72`: Change `w-0` to `w-12` or remove the zero-width skeleton.
- `components/insights/AnalyticsChart.tsx`: Add an accessible data table alternative (visually hidden) alongside the SVG chart.
- `components/profile/ProfileStrength.tsx`: Add `role="img"` and `aria-label` to the SVG with the score percentage.
- `components/profile/SaveProfileButton.tsx`: Add `aria-hidden="true"` to emoji spans.
- `app/(protected)/app/network/saved/SavedProfilesClient.tsx`: Add rollback logic for `unsave` and `deleteFolder` on API failure.
- `app/(protected)/app/more/account/page.tsx:63`: Change to `setFullName(profile.full_name ?? '')`.
- `components/endorsement/WriteEndorsementForm.tsx`: Show "10 characters minimum" hint when textarea is empty.
- `components/audience/AudienceTabs.tsx`: Add count badge to the Saved tab.

**Verification:**
- Test: with a screen reader, navigate the SectionManager toggles. Expect "switch" role announced.
- Test: delete a certification. Expect a styled confirmation dialog, not a browser `confirm()` popup.
- Test: with a screen reader on the Insights page, verify analytics data is announced.

---

## Findings Not Included in Fix Sprints

The following confirmed findings were assessed as LOW/INFO severity with minimal user impact and are deferred to the backlog:

| Finding | Reason for deferral |
|---------|-------------------|
| A1-F12 (expiry_reminder NOT NULL) | DEFAULT false handles all current rows; backfill optional |
| A2-F9 (signed URL 3600s expiry) | Private download URL has limited exposure |
| A2-F11 (yacht_near_miss_log no read policy) | Intentional design, needs documentation only |
| A2-F12 (other_role/cert_entries insert-only) | Reference tables, rate-limiting at API layer sufficient |
| A3-F8 (DeepLinkFlow supabase dep array) | Stable client, lint warning only |
| A3-F12 (asymmetric cancelled_at filter) | Intentional asymmetry, document only |
| A5-F15 (migration ordering dependency) | No rollback scripts exist, low risk |
| A5-F17 (folder sort_order COUNT gaps) | Cosmetic ordering issue, no data loss |
| A5-F19 (inconsistent response envelope keys) | Existing clients work; standardise in a future API cleanup |
| A5-F20 (profile_photo_url sync ambiguity) | Edge case, reorder is the canonical path |
| A6-F6 (public profile mutual-colleague waterfall) | Authenticated-only, requires DB function refactor |
| A6-F12/CC (AnalyticsChart use client) | Negligible bundle impact |
| A6-F14 (MorePage useEffect mounted guard) | React 18 handles gracefully |
| A6-F16 (OG route raw fetch) | Edge runtime constraint, acceptable pattern |
| A4-F11 (network heading padding) | Cosmetic, minimal visual impact |
| A4-F13 (no success toast on unsave) | Optimistic UI provides implicit feedback |
| A4-F15 (attachment step padding) | Cosmetic spacing |
| A4-F16 (delete account two-step flow) | Current typed confirmation is already robust |
| CB-MISS-5 (shareable request coworker gate) | By design; coworker check is the intended gate |
| A5-F10 (storage delete unchecked) | Orphaned files are a storage cost, not a user-facing bug |
| CC-MISS-4 (endorsement form char count on edit load) | Edge case, counter works once typing starts |
| CC-MISS-5 (export endorsement_requests unbounded) | Behind rate limit, GDPR requires completeness |
| CC-MISS-7 (OG image full-res photo) | Performance optimisation, not a bug |

---

## Duplicate Findings Map

These findings describe the same underlying bug and are counted once in the sprints above:

| Canonical | Duplicate | Bug |
|-----------|-----------|-----|
| A1-F3 | A5-F21 | `generate-pdf` selects `length_m` |
| A1-F4 | A5-F18 | certifications ghost `deleted_at` |
| A3-F4 | A5-F6 | section visibility read-modify-write |
| A3-F11 | A5-F14 | badge-count `.or()` interpolation (downgraded to INFO) |
| A4-F3 | A4-F14 | SectionManager `role="checkbox"` |
| A3-F5 | CB-MISS-3 | PDF Pro gate missing `subscription_ends_at` check |

---

## Sprint Dependency Graph

```
Sprint 1 (P0) ─────┐
Sprint 2 (P0) ──┐  │
Sprint 3 (P0) ──┤  │  All independent, ship in parallel
                │  │
Sprint 4 (P1) ──┘  │  ← depends on Sprint 2 (RLS for deleted users)
Sprint 5 (P1) ─────┘  ← independent
Sprint 6 (P1) ────────── independent

Sprint 7 (P2) ────────── independent
Sprint 8 (P2) ────────── independent

Sprint 9 (P3) ────────── independent
Sprint 10 (P3) ───────── independent
```

**Recommended ship order:** 1 → 2 → 3 (in parallel) → 4 → 5 → 6 → 7 → 8 → 9 → 10
