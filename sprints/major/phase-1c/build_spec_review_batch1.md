# Build Spec Review — Batch 1 (Sprints 14, 15, 16)

**Reviewer:** Senior auditor (automated)
**Date:** 2026-03-22
**Scope:** Cross-sprint consistency, schema accuracy, format completeness, decision compliance

---

## Summary

| Sprint | Title | Verdict | Critical Issues | Warnings |
|--------|-------|---------|-----------------|----------|
| 14 | Availability Toggle + Endorsement Signals | **PASS with issues** | 1 | 3 |
| 15 | Crew Search + Expanded Analytics | **PASS with issues** | 1 | 4 |
| 16 | AI Pack 1 | **PASS with issues** | 2 | 3 |

**Overall assessment:** The three build specs are well-structured and largely ready for a coding agent to execute. The SQL is real (not pseudocode), RLS policies are specified, GRANT statements are present, and file paths match the codebase layout. However, there are several issues that would cause runtime failures if not fixed before execution. No decision violations were found.

---

## 1. Critical Issues (must fix before execution)

### C-01. Migration timestamp collision between Sprint 14 and Sprint 16

**Sprint 14** specifies migration file: `20260322000001_sprint14_availability_signals.sql`
**Sprint 16** specifies migration file: `20260322000001_sprint16_ai_pack1.sql`

Both use the exact same timestamp prefix `20260322000001`. Supabase migrations must have unique, sequentially ordered filenames. If Sprint 15 uses `20260323000001` (as suggested in its build plan), then Sprint 16 must use a timestamp after that, e.g. `20260324000001`.

**Fix:** Sprint 16 migration should be renamed to `20260324000001_sprint16_ai_pack1.sql` (or any timestamp after Sprint 15's `20260323000001`).

**Files:** `sprint-14/build_plan.md` line 53, `sprint-16/build_plan.md` line 62

---

### C-02. `users.deleted_at` column referenced in Sprint 14 index but does not exist

Sprint 14 migration section 1.1 creates this index:

```sql
CREATE INDEX IF NOT EXISTS idx_users_available
  ON public.users (availability_status)
  WHERE availability_status = 'available' AND deleted_at IS NULL;
```

The `users` table (defined in `20260313000003_core_tables.sql`) does **not** have a `deleted_at` column. Only `attachments` and `endorsements` have `deleted_at`. This migration will fail with `column "deleted_at" does not exist`.

**Fix:** Remove the `AND deleted_at IS NULL` clause from the `idx_users_available` index. The `users` table uses cascade deletion from `auth.users`, not soft deletes.

**File:** `sprint-14/build_plan.md` line 92

---

### C-03. Sprint 16 `ai_usage_log` RLS insert policy is overly permissive

The insert policy is:

```sql
create policy "Service role can insert AI usage"
  on public.ai_usage_log for insert
  with check (true);
```

This allows **any** role (including `anon`) to insert rows into `ai_usage_log`. The comment says "Insert happens server-side via service client in API routes" — but service role bypasses RLS entirely, so this policy only affects `authenticated` and `anon` roles. As written, anonymous users could insert arbitrary cost records.

**Fix:** Either:
- (a) Change to `with check (auth.uid() = user_id)` to restrict to authenticated users inserting their own records, OR
- (b) Remove the insert policy entirely and rely on service role (which bypasses RLS) for all inserts. This is safer if inserts only happen in API routes via `createServiceClient()`.

**File:** `sprint-16/build_plan.md` lines 98-99

---

## 2. Warnings (should fix, not blocking)

### W-01. Sprint 15 `search_crew()` RPC references `u.departments` as an array but filters with `= ANY()`

Sprint 15 search_crew filter:
```sql
AND (v_department IS NULL OR v_department = ANY(u.departments))
```

This is correct syntax if `departments` is `text[]` (which it is — confirmed in `20260313000003_core_tables.sql` line 23). However, the Sprint 15 README says "Department: multi-select dropdown" but the RPC only accepts a single `v_department text`. The filter clause can only match one department at a time.

**Recommendation:** This is a V1 limitation, not a bug. Document that multi-department filtering requires multiple calls or a future RPC enhancement.

---

### W-02. Sprint 15 `search_crew()` GIN index on `departments` uses wrong operator class

Sprint 15 creates:
```sql
CREATE INDEX IF NOT EXISTS idx_users_departments_gin
  ON public.users USING gin (departments);
```

For `text[]` columns, the default GIN operator class is `array_ops`, which supports `@>`, `<@`, and `&&` operators. However, the `search_crew()` RPC uses `v_department = ANY(u.departments)`, which does NOT use a GIN index — it uses a sequential scan because `= ANY()` is effectively an unnest comparison, not an array containment operator.

**Fix:** Either:
- (a) Change the filter to `AND (v_department IS NULL OR u.departments @> ARRAY[v_department])` and keep the GIN index, OR
- (b) Drop the GIN index and add a regular btree index (but btree doesn't support array columns well).

Option (a) is recommended.

**File:** `sprint-15/build_plan.md` lines 122, 194

---

### W-03. Sprint 15 `search_crew()` composite index column name mismatch

Sprint 15 README (line 127) says: `users(availability_status, department, location_country)`

Sprint 15 build plan (line 117) creates:
```sql
CREATE INDEX IF NOT EXISTS idx_users_search_composite
  ON public.users (availability_status, location_country)
  WHERE onboarding_complete = true;
```

The index omits `department` — which is actually correct because `departments` is an array column that can't be in a composite btree index. But the README says "department" which is misleading. Minor documentation inconsistency.

---

### W-04. Sprint 15 `primary_role` trigram index may fail if `pg_trgm` extension scope is wrong

Sprint 15 creates:
```sql
CREATE INDEX IF NOT EXISTS idx_users_primary_role_trgm
  ON public.users USING gin (primary_role gin_trgm_ops);
```

The `pg_trgm` extension is enabled in `20260313000001_extensions.sql`. Confirm the extension is in the `public` schema (or `extensions` schema with search_path set). This should work but is worth a smoke test.

---

### W-05. Sprint 14 `availability_events` insert RLS policy conflict with cron job

Sprint 14 creates this RLS policy:
```sql
CREATE POLICY "availability_events: own insert"
  ON public.availability_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

But the cron jobs (expiry cron, reminder cron) insert events using `createServiceClient()` — which bypasses RLS. This is fine. However, the toggle_availability RPC is `SECURITY DEFINER` and runs as the function owner, which also bypasses RLS. So the RLS insert policy only applies if a client inserts directly via the Supabase JS client. This is correct behavior but worth noting: the `auth.uid() = user_id` check is effectively only used for direct client inserts (which don't happen in the build plan — all inserts go through the RPC or cron).

**Recommendation:** No change needed, but add a comment to the migration noting that most inserts bypass this policy via RPC/service role.

---

### W-06. Sprint 16 `preferred_language` column uses `NOT NULL DEFAULT 'en'` on existing rows

```sql
alter table public.users
  add column if not exists preferred_language text not null default 'en';
```

Adding a `NOT NULL` column with a default to an existing table will set all existing rows to `'en'`. This is correct and intentional — but worth flagging because it means all existing users will appear to "prefer English" even if they haven't made that choice. The README acknowledges this: "Default 'en' (English) — users can change in profile settings."

**Recommendation:** No change needed. Consider adding a `preferred_language_set_by_user boolean DEFAULT false` if you ever need to distinguish "chose English" from "never set preference."

---

### W-07. Sprint 16 cert OCR Pro gate uses direct DB query instead of `getProStatus()`

Sprint 16's `/api/ai/cert-ocr` route checks Pro status via:
```typescript
const { data: profile } = await supabase
  .from('users')
  .select('subscription_status')
  .eq('id', user.id)
  .single()

if (profile?.subscription_status !== 'pro') { ... }
```

But the codebase convention (established in Sprint 7 and used in Sprint 15) is `getProStatus()` from `lib/stripe/pro.ts`. The direct query approach works but bypasses any grace period or caching logic in `getProStatus()`.

**Fix:** Replace with `const proStatus = await getProStatus(user.id); if (!proStatus.isPro) { ... }` for consistency.

**File:** `sprint-16/build_plan.md` lines 668-679

---

## 3. Cross-Sprint Dependency Verification

### 3.1. Sprint 14 -> Sprint 15 Column Dependencies

| Column / Table | Defined in Sprint 14 | Referenced in Sprint 15 | Match? |
|----------------|----------------------|-------------------------|--------|
| `users.availability_status` | `text NOT NULL DEFAULT 'not_available'` | `u.availability_status = 'available'` in search_crew, `availability_status` in composite index | YES |
| `users.availability_expires_at` | `timestamptz` | `u.availability_expires_at` in get_available_in_network | YES |
| `users.availability_contact_methods` | `jsonb NOT NULL DEFAULT '[]'::jsonb` | Not directly used in Sprint 15 (used in Sprint 14 public profile display) | N/A |
| `availability_events` table | `id, user_id, event_type, metadata, created_at` | Referenced by `get_availability_history()` RPC: `ae.event_type, ae.created_at` | YES |
| `endorsement_signals` table | `id, endorsement_id, user_id, signal, created_at, updated_at` | Not directly used in Sprint 15 (Sprint 15 doesn't extend signals) | N/A |
| `idx_users_availability_expiry` | `(availability_status, availability_expires_at) WHERE availability_status = 'available'` | Used by Sprint 15 `search_crew` and `get_available_in_network` | YES |

**Verdict: All Sprint 14 -> 15 dependencies match.**

### 3.2. Sprint 15 -> Sprint 16 Column Dependencies

| Column / Table | Defined in Sprint 15 | Referenced in Sprint 16 | Match? |
|----------------|----------------------|-------------------------|--------|
| `users.notification_preferences` | `jsonb DEFAULT '{}'::jsonb` | Sprint 16 README line 94 says "Requires `preferred_language` field" — this is a different column. Sprint 16 does **not** reference `notification_preferences` directly. | N/A (no dependency) |
| `users.endorsement_display_order` | `jsonb DEFAULT '[]'::jsonb` | Not referenced in Sprint 16 | N/A |

**Verdict: Sprint 16 has no direct dependency on Sprint 15's new columns.** Sprint 16's dependency on Sprint 15 is infrastructure stability, not specific column dependencies.

### 3.3. Sprint 16 `preferred_language` — Is It a New Column?

The Sprint 16 README (line 106) says: "Requires `preferred_language` field on user profiles (verify exists from Sprint 3 Languages feature — if not yet built, add a language preference dropdown to profile settings)."

**Verification:** `preferred_language` does NOT exist in any current migration. Grep across all migrations returned zero results. The column does not exist in `20260313000003_core_tables.sql`.

Sprint 16's build plan correctly identifies this and adds it via migration:
```sql
alter table public.users
  add column if not exists preferred_language text not null default 'en';
```

**Verdict: Sprint 16 correctly handles `preferred_language` as a new column.** No gap.

### 3.4. Sprint 14 `are_coworkers_on_yacht()` — Does It Exist?

Sprint 14 README (line 43) says: "`are_coworkers_on_yacht()` RPC — exists from Sprint 12 (reuse for signal eligibility check)."

**Verification:** The function exists in `20260313000004_functions.sql` (line 89), defined as `are_coworkers_on_yacht(user_a uuid, user_b uuid, yacht uuid)`. It was created in the original migration, not Sprint 12. The Sprint 14 build plan creates a new `can_signal_endorsement()` function instead of directly reusing `are_coworkers_on_yacht()` — this is correct because the signal eligibility check only needs to verify one user's attachment, not a pair.

**Verdict: Dependency satisfied.** Sprint 14 correctly uses the existing function as design reference and builds a purpose-specific alternative.

---

## 4. Schema Consistency with Existing Codebase

### 4.1. SQL Style

| Convention | Existing Migrations | Sprint 14 | Sprint 15 | Sprint 16 |
|-----------|-------------------|-----------|-----------|-----------|
| Lowercase keywords | Mixed (core tables use lowercase, Sprint 7 uses uppercase) | UPPERCASE | UPPERCASE | lowercase |
| `gen_random_uuid()` for PKs | Yes | Yes | N/A (no new tables) | Yes |
| `security definer` on RPCs | Yes (all existing) | Yes | Yes | Yes |
| `GRANT EXECUTE` on RPCs | Yes | Yes | Yes | Yes |
| `set search_path = public` | Yes (on functions) | Yes | Yes | Partially (present on `match_certification_type`, missing on `ai_usage_log` policies) |
| RLS on every new table | Yes | Yes | N/A | Yes |
| Soft delete pattern | `deleted_at timestamptz` on `attachments`, `endorsements` | Not applicable (new tables are append-only) | N/A | N/A |

**Inconsistency:** Sprint 16 uses lowercase SQL keywords (`create table`, `alter table`) while Sprints 14 and 15 use uppercase (`CREATE TABLE`, `ALTER TABLE`). The existing codebase is mixed — core tables use lowercase, Sprint 7 uses uppercase. This is cosmetic but worth standardizing.

### 4.2. Table/Column Names Verified Against Schema

| Reference | Build Plan | Actual Schema | Match? |
|-----------|-----------|---------------|--------|
| `users.available_for_work` | Sprint 14 toggle_availability updates it | Exists: `available_for_work boolean not null default false` (line 39) | YES |
| `users.onboarding_complete` | Sprint 15 search index uses it | Exists: `onboarding_complete boolean not null default false` (line 20) | YES |
| `users.departments` | Sprint 15 GIN index | Exists: `departments text[]` (line 23) | YES |
| `users.primary_role` | Sprint 15 trigram index | Exists: `primary_role text` (line 24) | YES |
| `users.location_country` | Sprint 15 composite index | Exists: `location_country text` (line 29) | YES |
| `users.location_city` | Sprint 15 search_crew filter | Exists: `location_city text` (line 30) | YES |
| `users.profile_photo_url` | Sprint 15 search result | Exists: `profile_photo_url text` (line 17) | YES |
| `users.display_name` | Sprint 14/15 RPCs | Exists: `display_name text` (line 14) | YES |
| `users.handle` | Sprint 14/15 RPCs | Exists: `handle text unique` (line 15) | YES |
| `users.subscription_status` | Sprint 15/16 Pro checks | Exists: `subscription_status text not null default 'free'` (line 49) | YES |
| `endorsements.endorser_id` | Sprint 14 signal RPCs | Exists (line 155) | YES |
| `endorsements.recipient_id` | Sprint 14 signal RPCs | Exists (line 156) | YES |
| `endorsements.yacht_id` | Sprint 14 signal RPCs | Exists (line 157) | YES |
| `endorsements.deleted_at` | Sprint 14 signal RPCs | Exists (line 174) | YES |
| `attachments.user_id` | Sprint 14/15 RPCs | Exists (line 120) | YES |
| `attachments.yacht_id` | Sprint 14/15 RPCs | Exists (line 121) | YES |
| `attachments.deleted_at` | Sprint 14/15 RPCs | Exists (line 137) | YES |
| `certifications.user_id` | Sprint 15 search filter | Exists (line 231) | YES |
| `certifications.certification_type_id` | Sprint 15 search filter | Exists (line 232) | YES |
| `certification_types.name` | Sprint 16 fuzzy match | Exists (line 39) | YES |
| `certification_types.short_name` | Sprint 16 match_certification_type return | Exists (line 40) | YES |
| `certification_types.category` | Sprint 16 match_certification_type return | Exists (line 41) | YES |
| `profile_analytics.user_id` | Sprint 15 viewer breakdown | Exists (line 265) | YES |
| `profile_analytics.event_type` | Sprint 15 viewer breakdown | Exists (line 266) | YES |
| `profile_analytics.viewer_role` | Sprint 15 viewer breakdown | Exists (line 271) | YES |
| `profile_analytics.viewer_location` | Sprint 15 viewer breakdown | Exists (line 272) | YES |

**All column references verified against actual schema. No mismatches found.**

### 4.3. RPC References Verified

| RPC Name | Claimed to Exist | Actual Location | Verified? |
|----------|-----------------|----------------|-----------|
| `are_coworkers_on_yacht(uuid, uuid, uuid)` | Sprint 14 | `20260313000004_functions.sql` line 89 | YES |
| `get_colleagues(uuid)` | Sprint 14, 15 | `20260313000004_functions.sql` line 169 | YES |
| `search_yachts(text, int)` | Sprint 15 | `20260314000011_yacht_sprint4.sql` line 37 | YES |
| `get_analytics_summary(uuid, int)` | Sprint 15 | `20260315000018_sprint7_payments.sql` line 38 | YES |
| `get_analytics_timeseries(uuid, text, int)` | Sprint 15 | `20260315000018_sprint7_payments.sql` line 62 | YES |
| `record_profile_event(uuid, text, text, text)` | Sprint 15 | `20260315000018_sprint7_payments.sql` line 19 | YES |
| `get_sea_time()` / `get_sea_time_detailed()` | Sprint 15 | `20260317000021_profile_robustness.sql` (or `20260321000001_fix_storage_buckets.sql`) | LIKELY (file exists, grep confirms) |

**All "existing" RPC references verified.**

---

## 5. Decision Compliance

| Decision | Rule | Sprint 14 | Sprint 15 | Sprint 16 | Compliant? |
|----------|------|-----------|-----------|-----------|------------|
| D-003 | Never monetise influence over trust outcomes | Signals are display-only, no paid boosting | Search sorts by endorsement count (D-026 allows this), pinning is display-only | AI drafts don't affect trust weight | YES |
| D-007 | Identity is free; presentation is paid cosmetic | Availability toggle is free (identity). Signals are free. | Search is Pro (presentation/discovery). Analytics is Pro. Pinning is Pro (cosmetic). | AI-04 endorsement draft is free. AI-02 cert OCR is Pro (presentation). AI-03 translate is free. AI-17 bio improve is free. | YES |
| D-011 | Absence of endorsements is neutral | No UI labels absence in Sprint 14 | Search shows endorsement count but 0 endorsements is displayed as absence of count, not negative language. No "poorly endorsed" or similar. | No auto-summary language. | YES |
| D-019 | Signals don't remove endorsements | Sprint 14 signals are display-only. No moderation trigger. Signal counts shown but no threshold-based action. | Not applicable. | Not applicable. | YES |
| D-023 | Search is Pro | Not applicable. | Search page accessible to all; results gated behind Pro. Free users see blurred cards with upgrade CTA. | Not applicable. | YES |
| D-027 | Availability opt-in with expiry | Toggle defaults to OFF. 7-day expiry. Day-6 reminder. Auto-expire via cron. | Availability filter in search respects the toggle — only users who opted in appear. | Not applicable. | YES |
| D-013 | No auto-summary language | Signal counts show raw numbers ("3 agree"), not summaries ("well endorsed") | Search results show "X endorsements from Y crew across Z yachts" — factual, not evaluative | No AI-generated trust summaries | YES |

**No decision violations found in any sprint.**

---

## 6. Format and Completeness Check

### 6.1. Migration SQL Quality

| Criterion | Sprint 14 | Sprint 15 | Sprint 16 |
|-----------|-----------|-----------|-----------|
| Complete SQL (not pseudocode) | YES — all DDL, indexes, RPCs, RLS, GRANTs specified | YES | YES |
| RLS on every new table | YES (`availability_events`, `endorsement_signals`) | N/A (no new tables, only new columns) | YES (`ai_usage_log`) |
| GRANT EXECUTE on every new RPC | YES (7 functions, all granted) | YES (5 functions, all granted) | YES (1 function, granted) |
| Indexes specified | YES (5 indexes) | YES (5 indexes) | YES (2 indexes) |

### 6.2. File Path Consistency

| Path Pattern | Convention | Sprint 14 | Sprint 15 | Sprint 16 |
|-------------|-----------|-----------|-----------|-----------|
| API routes | `app/api/[feature]/route.ts` | `app/api/availability/route.ts` OK | N/A (uses RPCs via server component) | `app/api/ai/[feature]/route.ts` OK |
| Protected pages | `app/(protected)/app/[page]/page.tsx` | `app/(protected)/app/profile/page.tsx` (modify) OK | `app/(protected)/app/search/page.tsx` OK | `app/(protected)/app/certification/new/page.tsx` (modify) OK |
| Components | `components/[category]/[Name].tsx` | `components/profile/AvailabilityToggle.tsx` OK | `components/search/SearchPageClient.tsx` OK | Components via modification OK |
| Lib files | `lib/[category]/[file].ts` | `lib/email/availability-reminder.ts` OK | `lib/section-colors.ts` (modify) OK | `lib/ai/openai-client.ts` OK |
| Cron routes | `app/api/cron/[name]/route.ts` | `app/api/cron/availability-expiry/route.ts` OK | N/A | N/A |

**All file paths follow existing codebase conventions.**

### 6.3. Missing Items vs. Sprint READMEs

#### Sprint 14 README vs. Build Plan

| README Deliverable | In Build Plan? |
|--------------------|---------------|
| `availability_status` column | YES |
| `availability_expires_at` column | YES |
| `availability_contact_methods` column | YES |
| Toggle UI on profile page | YES |
| Contact method selector | YES |
| Confirmation text | YES |
| Green "Available" badge on profile card | YES |
| Green "Available" badge on public profile | YES |
| Contact methods shown on public profile when available | YES |
| Badge on colleague explorer + yacht crew cards | YES (6.5) |
| Badge disappears on expiry (staleness guard) | YES |
| Cron job for expiry | YES |
| Day-6 reminder cron + email | YES |
| Deep link in email | YES |
| `availability_events` table | YES |
| `endorsement_signals` table | YES |
| Unique constraint | YES |
| RLS policies | YES |
| `can_signal_endorsement()` RPC | YES |
| `get_endorsement_signals()` RPC | YES |
| Signal UI on endorsement cards | YES |
| Eligibility check (hidden for non-eligible) | YES |
| Tap to signal toggle | YES |
| Aggregate display | YES |
| Tap aggregate to expand signaller list | YES |
| Optimistic UI | YES |
| PostHog events | YES (all 5 listed) |
| Batch eligibility RPC (`get_signalable_endorsements`) | YES (added as optimization in build plan) |
| Batch signal counts RPC (`get_endorsement_signal_counts`) | YES (added as optimization in build plan) |

**Sprint 14: No missing items.**

#### Sprint 15 README vs. Build Plan

| README Deliverable | In Build Plan? |
|--------------------|---------------|
| Search page at `/app/search` | YES |
| Pro gate with blurred results | YES |
| Filter bar (department, role, location, availability, cert, yacht) | YES |
| Results list, paginated, sorted | YES |
| Result card with all fields | YES |
| Card tap navigation | YES |
| Empty state | YES |
| Result count header | YES |
| `search_crew()` RPC | YES |
| `get_available_in_network()` RPC | YES |
| 2nd-degree availability display | YES |
| Expanded analytics (views, downloads, timeline, breakdown, availability history, completeness) | YES |
| Endorsement pinning | YES |
| Notification preferences page | YES |
| `notification_preferences` column | YES |
| `endorsement_display_order` column | YES |
| Indexes for search | YES |
| GRANT EXECUTE | YES |
| PostHog events | YES (all listed) |
| Navigation update for search | YES (network page card + more page link) |

**Sprint 15: No missing items.**

#### Sprint 16 README vs. Build Plan

| README Deliverable | In Build Plan? |
|--------------------|---------------|
| Shared AI layer (`lib/ai/`) | YES |
| `ai_usage_log` table | YES |
| AI-04: "Help me write" in endorsement form | YES |
| AI-04: 2-3 question mini-flow | YES |
| AI-04: API route | YES |
| AI-04: Rate limit (10/day) | YES |
| AI-04: Fallback | YES |
| AI-02: "Scan certificate" button (Pro) | YES |
| AI-02: Camera capture | YES |
| AI-02: Cert type matching | YES |
| AI-02: Review step | YES |
| AI-02: API route | YES |
| AI-02: Rate limit (20/day) | YES |
| AI-02: Fallback | YES |
| AI-03: Multilingual endorsement request emails | YES |
| AI-03: Language detection from `preferred_language` | YES |
| AI-03: Translation note in email | YES |
| AI-03: API route + shared function | YES |
| AI-03: Fallback | YES |
| AI-17: "Improve" button on bio | YES |
| AI-17: Inline suggestion with accept/dismiss | YES |
| AI-17: API route | YES |
| AI-17: Rate limit (20/day) | YES |
| AI-17: Fallback | YES |
| `preferred_language` column | YES |
| `match_certification_type()` RPC | YES |
| PostHog events | YES (all listed) |
| Prompt files in `lib/ai/prompts/` | YES |
| Cost tracking | YES |

**One notable omission:** Sprint 16 README (line 98) specifies "Original language version preserved (stored alongside translation for audit)" for AI-03. The build plan does not implement storage of the original language version — the translated email is sent, but the original text is not stored anywhere beyond the runtime variable. The AI usage log stores metadata (source/target language) but not the original email body.

**Recommendation:** Add a `metadata` field to the `ai_usage_log` insert for the `translate` feature that includes `{ original_subject, original_body }` for audit purposes. Or accept this as a V2 enhancement.

---

## 7. Recommended Fixes

### Must-fix (blocks execution)

1. **C-01:** Change Sprint 16 migration filename from `20260322000001_sprint16_ai_pack1.sql` to `20260324000001_sprint16_ai_pack1.sql`.

2. **C-02:** In Sprint 14 migration section 1.1, change:
   ```sql
   -- BEFORE:
   WHERE availability_status = 'available' AND deleted_at IS NULL;
   -- AFTER:
   WHERE availability_status = 'available';
   ```

3. **C-03:** In Sprint 16 migration, change the `ai_usage_log` insert policy to either:
   ```sql
   -- Option A: Restrict to authenticated users
   create policy "AI usage: own insert"
     on public.ai_usage_log for insert
     with check (auth.uid() = user_id);
   ```
   Or remove the insert policy entirely and document that all inserts use service role.

### Should-fix (improves correctness)

4. **W-02:** In Sprint 15 `search_crew()` RPC, change the department filter from:
   ```sql
   AND (v_department IS NULL OR v_department = ANY(u.departments))
   ```
   to:
   ```sql
   AND (v_department IS NULL OR u.departments @> ARRAY[v_department])
   ```
   This enables the GIN index to be used.

5. **W-07:** In Sprint 16 `/api/ai/cert-ocr/route.ts`, replace the direct DB query for Pro status with:
   ```typescript
   import { getProStatus } from '@/lib/stripe/pro'
   const proStatus = await getProStatus(user.id)
   if (!proStatus.isPro) { ... }
   ```

---

## 8. Notes for Coding Agent

1. **Execution order is strict:** Sprint 14 migration must run before Sprint 15, which must run before Sprint 16. The sprints have real data dependencies (Sprint 15's search indexes reference columns created by Sprint 14).

2. **The `set_updated_at()` trigger function** (referenced by Sprint 14 for `endorsement_signals`) already exists in `20260313000004_functions.sql` line 36. No need to create it.

3. **Sprint 15 references a `departments` table** in the search page's server component (`supabase.from('departments').select('id, name').order('sort_order')`). This table exists in `20260313000002_reference_tables.sql` and has `id`, `name`, and `sort_order` columns — the query is valid.

4. **Sprint 15's `search_yachts()` RPC call** in the search filters component uses `{ p_query: yachtQuery, p_limit: 5 }`. The actual function signature is `search_yachts(p_query text, p_limit int default 10)` — the param names match.

5. **Sprint 16's `match_certification_type()` RPC** depends on the `pg_trgm` extension and the `similarity()` function. Both are available via `20260313000001_extensions.sql`.

6. **All three sprints use `SECURITY DEFINER`** on RPCs, which is the codebase convention. This means the functions run as the owner (postgres) and bypass RLS. The `SET search_path = public` clause prevents search path manipulation attacks.

7. **Sprint 14's `vercel.json` modification** shows the complete crons array including the two existing entries. The coding agent should merge, not replace.
