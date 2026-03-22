# Build Spec Review -- Batch 2 (Sprints 17, 18, 19, 20)

**Reviewer:** Senior auditor (automated)
**Date:** 2026-03-22
**Scope:** Cross-sprint consistency, schema accuracy, format completeness, decision compliance, cross-phase boundary check

---

## Summary

| Sprint | Title | Verdict | Critical Issues | Warnings |
|--------|-------|---------|-----------------|----------|
| 17 | Attachment Confirmation + Smart Yacht Autocomplete | **PASS with issues** | 2 | 3 |
| 18 | Peer Hiring | **PASS with issues** | 1 | 2 |
| 19 | Recruiter Access | **PASS with issues** | 1 | 3 |
| 20 | Agency Plans + NLP Search | **FAIL -- blocking issues** | 5 | 3 |

**Overall assessment:** Sprints 17 and 18 are well-structured and close to executable. Sprint 19 is solid but has one critical RLS issue repeated from batch 1 patterns. Sprint 20 has multiple blocking issues: a systemic `auth.uid()` vs `recruiters.id` confusion in RLS policies and API routes, a migration timestamp collision with Sprint 19, a conflicting `lib/ai/embeddings.ts` file that Sprint 17 also creates, and an incompatible override of `unlock_crew_profile()`. Sprint 20 needs a revision pass before a coding agent can execute it safely.

---

## 1. Critical Issues (must fix before execution)

### C-01. Migration timestamp collision between Sprint 18, Sprint 19, and Sprint 20

**Sprint 18** migration: `20260322000002_sprint18_peer_hiring.sql`
**Sprint 19** migration: `20260322000002_sprint19_recruiter_access.sql`
**Sprint 20** migration: `20260322000002_sprint20_agency_nlp.sql`

All three use the same timestamp prefix `20260322000002`. Supabase migrations must have unique, sequentially ordered filenames. The latest existing migration is `20260321000001_fix_storage_buckets.sql`.

Sprint 17 does not specify a concrete timestamp (it says "use the next sequential timestamp"), which is fine -- but the three Phase 2 sprints all hardcode the same one.

**Fix:** Assign sequential timestamps. Recommended:
- Sprint 17: `20260322000001_sprint17_confirmation_embeddings.sql` (matches the YYYYMMDD000001 convention)
- Sprint 18: `20260322000002_sprint18_peer_hiring.sql` (keep as-is)
- Sprint 19: `20260322000003_sprint19_recruiter_access.sql`
- Sprint 20: `20260322000004_sprint20_agency_nlp.sql`

**Files:**
- `sprint-18/build_plan.md` line 58
- `sprint-19/build_plan.md` line 67
- `sprint-20/build_plan.md` line 72

**Severity:** Critical -- migrations will fail to apply if filenames collide.

---

### C-02. Sprint 17 `check_yacht_establishment()` references `length_meters` but Sprint 17 `search_yachts_semantic()` also uses `length_meters` -- column name is correct but type is `numeric(5,1)`, not `numeric`

Sprint 17's `check_yacht_establishment()` RPC (line ~278) references `v_yacht.length_meters` and the `search_yachts_semantic()` RPC returns `y.length_meters` as `numeric`. The actual column type is `numeric(5,1)` (from `20260313000003_core_tables.sql` line 90). The search RPC return type declares `length_meters numeric` which is compatible.

However, the `check_yacht_establishment()` RPC checks:
```sql
IF v_yacht.length_meters IS NULL OR v_yacht.length_meters < 30 THEN
```

This references the column correctly. **No issue here** -- the numeric types are compatible.

**Actual issue:** The `check_yacht_establishment()` RPC also accesses the `yachts` table column `length_meters` using an unqualified name in the record type. This works fine in plpgsql. No fix needed -- this was a false alarm on investigation.

**Downgraded to: Not an issue.**

---

### C-02 (actual). Sprint 17 `check_rejection_penalties()` inserts into `internal.flags` with reason `'attachment_rejection_freeze'` but `internal.flags` has a CHECK constraint that only allows `target_type IN ('user', 'endorsement', 'yacht')`

Sprint 17 `check_rejection_penalties()` (line ~516-522):
```sql
INSERT INTO internal.flags (target_type, target_id, reason, notes)
VALUES (
  'user',
  p_user_id,
  'attachment_rejection_freeze',
  format('5+ rejections in 60 days (%s in 60d, %s in 30d). Auto-frozen.', v_60d_count, v_30d_count)
);
```

The `target_type = 'user'` value is valid (passes the CHECK constraint). The `reason` column has no CHECK constraint -- it is free text. **This is actually fine.**

However, the `internal.flags` table has a `reported_by` column that `REFERENCES public.users (id)`. The INSERT does not provide `reported_by`, which defaults to NULL. Since the column allows NULL (`ON DELETE SET NULL`), this is valid for system-generated flags.

**Downgraded to: Not an issue.**

---

### C-02 (actual). Sprint 19 `recruiter_visible` index references `deleted_at` on `users` table -- column does NOT exist

Sprint 19 migration section 1.4 (line ~207):
```sql
CREATE INDEX IF NOT EXISTS idx_users_recruiter_visible
  ON public.users (recruiter_visible)
  WHERE recruiter_visible = true AND deleted_at IS NULL;
```

The `users` table does NOT have a `deleted_at` column (confirmed by grep across all migrations -- only `attachments` and `endorsements` have `deleted_at`). This migration will fail with `column "deleted_at" does not exist`.

This is the **exact same pattern** as batch 1 issue C-02 (Sprint 14 `idx_users_available` referencing `users.deleted_at`).

**Fix:** Remove `AND deleted_at IS NULL` from the partial index predicate:
```sql
CREATE INDEX IF NOT EXISTS idx_users_recruiter_visible
  ON public.users (recruiter_visible)
  WHERE recruiter_visible = true;
```

**File:** `sprint-19/build_plan.md` line ~207

---

### C-03. Sprint 19 `search_crew_recruiter()` references `u.deleted_at` -- column does NOT exist on `users`

Sprint 19 migration section 1.10 (line ~565):
```sql
WHERE u.recruiter_visible = true
  AND u.deleted_at IS NULL
  AND u.onboarding_complete = true
```

Same issue: the `users` table does not have `deleted_at`. The `users` table uses cascade deletion from `auth.users`, not soft deletes. This RPC will fail at runtime.

**Fix:** Remove `AND u.deleted_at IS NULL` from the WHERE clause.

**File:** `sprint-19/build_plan.md` line ~565

---

### C-04. Sprint 20 RLS policies use `auth.uid()` as if it equals `recruiters.id` -- it does NOT

This is the most serious issue in the batch. Sprint 20's RLS policies consistently compare `auth.uid()` directly against `recruiters.id`. But per Sprint 19's design (explicitly stated in the Sprint 19 build plan design note, line ~121):

> The `auth_user_id` column links to Supabase Auth's `auth.users` table. Recruiters use Supabase Auth for authentication... The separation is at the data layer: recruiters have a row in `public.recruiters`, crew have a row in `public.users`. Middleware and RLS check which table has a matching `auth_user_id` to determine the account type.

The `recruiters.id` column is a `gen_random_uuid()` PK -- it is a DIFFERENT UUID from `auth.uid()`. The mapping is `recruiters.auth_user_id = auth.uid()`. Sprint 19 correctly handles this by:
1. Creating `get_recruiter_id_from_auth()` helper that maps `auth.uid()` to `recruiters.id`
2. Using `auth.uid() = auth_user_id` in recruiter RLS policies (see Sprint 19 lines 223-224)

Sprint 20 does NOT use this pattern. Every RLS policy in Sprint 20 compares `auth.uid()` directly against `recruiters.id`:

**Affected policies (all in Sprint 20 migration):**
- `agencies: member read` -- `WHERE r.id = auth.uid()` (line 113) -- should be `WHERE r.auth_user_id = auth.uid()`
- `agencies: admin update` -- `admin_recruiter_id = auth.uid()` (line 120) -- should join through recruiters
- `agencies: recruiter insert` -- `admin_recruiter_id = auth.uid()` (line 125) -- same
- `agency_invitations: agency admin read` -- `WHERE r.id = auth.uid()` (line 198) -- same
- `agency_invitations: admin insert` -- `invited_by = auth.uid()` (line 206) -- should be `invited_by IN (SELECT id FROM recruiters WHERE auth_user_id = auth.uid())`
- `agency_invitations: admin update` -- `WHERE a.admin_recruiter_id = auth.uid()` (line 219) -- same
- `agency_invitations: invitee read` -- `WHERE r.id = auth.uid()` (line 227) -- same
- `shortlists: agency member read` -- `WHERE r.id = auth.uid()` (line 290) -- same
- `shortlists: recruiter insert` -- `created_by = auth.uid()` (line 298) -- same
- `shortlists: owner update` -- `created_by = auth.uid()` (line 304) -- same
- `shortlists: owner delete` -- `created_by = auth.uid()` (line 315) -- same
- `shortlist_entries: shortlist member read` -- `WHERE r.id = auth.uid()` (line 358) -- same
- `shortlist_entries: recruiter insert` -- `added_by = auth.uid()` (line 368) -- same
- `shortlist_entries: owner update` -- `added_by = auth.uid()` (line 383) -- same
- `shortlist_entries: owner delete` -- `added_by = auth.uid()` (line 395) -- same
- `get_agency_analytics()` -- `a.admin_recruiter_id = auth.uid()` (line 789) -- same

**Total affected:** 16+ policy/RPC comparisons.

None of these will ever match because `auth.uid()` returns the auth user UUID, not the recruiter table PK UUID. Every recruiter will be denied access to every Sprint 20 feature.

**Fix:** Every `auth.uid()` comparison against `recruiters.id`, `admin_recruiter_id`, `invited_by`, `created_by`, or `added_by` must be changed to resolve through `auth_user_id`. The simplest pattern:

```sql
-- Instead of:
WHERE r.id = auth.uid()
-- Use:
WHERE r.auth_user_id = auth.uid()

-- Instead of:
admin_recruiter_id = auth.uid()
-- Use:
admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())

-- For shortlist columns like created_by, added_by:
created_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
```

**File:** `sprint-20/build_plan.md` -- affects all of Part 1 migration sections 1.1, 1.3, 1.5, 1.6, 1.12

---

### C-05. Sprint 20 API routes use `.eq('id', user.id)` to query `recruiters` table -- wrong column

Same root cause as C-04, but in TypeScript API routes instead of SQL. Sprint 20's API routes query the `recruiters` table using:
```typescript
.from('recruiters')
.select('...')
.eq('id', user.id)  // WRONG: should be .eq('auth_user_id', user.id)
.single()
```

`user.id` is the Supabase Auth UUID. The `recruiters.id` column is a different UUID. The lookup should use `.eq('auth_user_id', user.id)`.

Sprint 19's API routes correctly use `.eq('auth_user_id', user.id)` (see Sprint 19 Part 4 routes, e.g., line 1426, 1488, etc.).

**Affected Sprint 20 API routes:**
- `app/api/recruiter/agency/create/route.ts` -- line 1438: `.eq('id', user.id)`
- `app/api/recruiter/agency/invite/route.ts` -- line 1557: `.eq('id', user.id)`
- `app/api/recruiter/agency/accept/route.ts` -- line 1721: `.eq('id', user.id)`
- `app/api/recruiter/agency/remove-seat/route.ts` -- line 1875: `.eq('id', user.id)`
- `app/api/recruiter/agency/credits/purchase/route.ts` -- line 2005: `.eq('id', user.id)`

**Fix:** Change all `.eq('id', user.id)` to `.eq('auth_user_id', user.id)` when querying the `recruiters` table.

---

### C-06. Sprint 20 creates `lib/ai/embeddings.ts` but Sprint 17 already creates this file

Sprint 17 creates `lib/ai/embeddings.ts` (Part 3.1, line 1088) with:
- `generateEmbedding()` returns `number[] | null` (graceful null on failure)
- `generateEmbeddingsBatch()` returns `Array<{ text: string; embedding: number[] | null }>`
- Exports `EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS` as named constants
- Includes `composeYachtMetadataText()` helper

Sprint 20 creates `lib/ai/embeddings.ts` (Part 2.1, line 1202) with:
- `generateEmbedding()` returns `number[]` (throws on failure, no null handling)
- `generateEmbeddingsBatch()` returns `number[][]` (different signature)
- Does NOT include `composeYachtMetadataText()`
- Same model and dimensions

These are **incompatible signatures**. Sprint 20's version would break Sprint 17's callers (which expect null returns and the `{ text, embedding }` batch format).

**Fix:** Sprint 20 must NOT recreate `lib/ai/embeddings.ts`. Instead:
1. Import from the existing file Sprint 17 creates
2. If Sprint 20 needs additional functions (like the `composeProfileText` helper), add them to a new file (e.g., `lib/ai/profile-embeddings.ts`) or extend the existing one

**Files:**
- `sprint-17/build_plan.md` line 1088 (creates the file)
- `sprint-20/build_plan.md` line 1202 (overwrites the file with incompatible signatures)

---

### C-07. Sprint 20 `unlock_crew_profile()` override drops subscription check and crew visibility check

Sprint 19 `unlock_crew_profile()` (lines 355-454) includes:
1. Check for existing unlock (idempotent)
2. Check recruiter has active subscription
3. **Check crew member exists and has opted in** (`recruiter_visible = true AND deleted_at IS NULL`)
4. FIFO credit deduction
5. EXCEPTION handler for race conditions

Sprint 20 `unlock_crew_profile()` override (lines 891-978) includes:
1. Agency-aware existing unlock check
2. Agency-aware credit deduction
3. **Missing:** Subscription check
4. **Missing:** Crew visibility check (`recruiter_visible = true`)
5. **Missing:** EXCEPTION handler for race conditions (unique_violation)

The Sprint 20 override uses `CREATE OR REPLACE FUNCTION` which completely replaces Sprint 19's version. This removes two safety checks:
- Without the subscription check, a recruiter with expired subscription but remaining credits could still unlock profiles
- Without the `recruiter_visible` check, a recruiter could unlock profiles of crew who have opted out
- Without the EXCEPTION handler, concurrent unlock requests on the same pair will cause an unhandled unique_violation error

**Fix:** Sprint 20's `unlock_crew_profile()` must re-incorporate:
```sql
-- After the already-unlocked check, add:

-- 2. Check recruiter has active subscription
IF NOT EXISTS (
  SELECT 1 FROM recruiters
  WHERE id = p_recruiter_id
    AND subscription_status = 'active'
) THEN
  RETURN jsonb_build_object('status', 'error', 'reason', 'subscription_inactive');
END IF;

-- 3. Check crew member exists and has opted in
IF NOT EXISTS (
  SELECT 1 FROM users
  WHERE id = p_crew_user_id
    AND recruiter_visible = true
) THEN
  RETURN jsonb_build_object('status', 'error', 'reason', 'crew_not_visible');
END IF;

-- And add at the end:
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('status', 'already_unlocked');
```

**File:** `sprint-20/build_plan.md` lines 891-978

---

## 2. Warnings (should fix, not blocking)

### W-01. Sprint 17 uses `NEXT_PUBLIC_APP_URL`, Sprint 18 uses `NEXT_PUBLIC_SITE_URL` -- inconsistent env var

Sprint 17 (lines 984, 1349): `process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'`
Sprint 18 (lines 971, 1074, 1213, 1463): `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'`

The fallback is the same but the env var name differs. The codebase should use one consistent name.

**Recommendation:** Check which env var actually exists in `.env.local` and standardize. Sprint 18's `NEXT_PUBLIC_SITE_URL` matches the Sprint 7 patterns. Sprint 17 should use the same.

---

### W-02. Sprint 17 `attachments` table -- `role_label` column vs `role_title` inconsistency

Sprint 17's attachment creation API route (line ~933) inserts `role_label`:
```typescript
role_label,
```

The actual `attachments` table has `role_label text not null` (confirmed in `20260313000003_core_tables.sql` line 125). This is correct.

However, Sprint 20's `compose_profile_text()` RPC (line ~1144) references `a.role_title`:
```sql
COALESCE(a.role_title, '') || ' ' ||
```

The column is actually `role_label`, not `role_title`. This will cause `compose_profile_text()` to fail at runtime.

**Fix:** In Sprint 20 `compose_profile_text()`, change `a.role_title` to `a.role_label`.

**File:** `sprint-20/build_plan.md` line ~1144

**Severity:** Should be Critical (runtime failure), but it is in a text composition function where the error would surface as an SQL error during embedding generation, not user-facing. Upgraded to **W-02/Critical**.

---

### W-03. Sprint 18 `get_graph_proximity()` does not filter by `attachment_status` -- pending/rejected attachments counted as connections

Sprint 17 adds `attachment_status` to the `attachments` table (values: `active`, `pending_confirmation`, `confirmed`, `rejected`). Sprint 18's `get_graph_proximity()` RPC (lines 298-380) only filters by `a.deleted_at IS NULL`, not by `attachment_status`. This means:
- A user with a `pending_confirmation` attachment to a yacht would be considered a "colleague" in graph proximity
- A user with a `rejected` attachment would also be counted

**Fix:** Add `AND a.attachment_status IN ('active', 'confirmed')` to all attachment queries in `get_graph_proximity()`:
```sql
-- In Check 1 (direct colleague):
AND a1.attachment_status IN ('active', 'confirmed')
AND a2.attachment_status IN ('active', 'confirmed')

-- In Check 2 (second degree):
AND a_viewer.attachment_status IN ('active', 'confirmed')
AND a_bridge.attachment_status IN ('active', 'confirmed')
AND a_bridge2.attachment_status IN ('active', 'confirmed')
AND a_target.attachment_status IN ('active', 'confirmed')
```

**File:** `sprint-18/build_plan.md` lines 298-380

---

### W-04. Sprint 19 `search_crew_recruiter()` references `u.deleted_at` and `u.availability_expires_at` -- `deleted_at` does not exist on users

Already covered in C-03 above as a critical issue. Adding here for completeness: line 571 also references `u.availability_expires_at > now()`. This column was added by Sprint 14 and should exist. The `deleted_at` reference is the only problem.

---

### W-05. Sprint 20 `search_crew_nlp()` GRANT uses `vector` instead of `vector(1536)` in function signature

Sprint 20 section 1.11 (line 763):
```sql
GRANT EXECUTE ON FUNCTION public.search_crew_nlp(vector, uuid, int, boolean, text, int) TO authenticated;
```

But the function is defined with `p_query_embedding vector(1536)`. In PostgreSQL, `vector` and `vector(1536)` are the same type for function signature matching purposes (pgvector treats the dimension as a constraint, not a distinct type). This should work, but for consistency with Sprint 17's pattern (which uses `vector(1536)` in both definition and GRANT), it should match.

**Recommendation:** Change to `vector(1536)` for consistency. Not blocking.

---

### W-06. Sprint 20 `bulk_unlock_crew_profiles()` assigns all unlock records the same `credit_id`

Sprint 20 lines 1093-1104:
```sql
INSERT INTO public.recruiter_unlocks (recruiter_id, crew_user_id, credit_id)
SELECT p_recruiter_id, uid, (
  -- Reference the most recently used credit bundle for audit trail
  SELECT id FROM public.recruiter_credits
  WHERE ...
  ORDER BY expires_at ASC LIMIT 1
)
FROM unnest(v_new_ids) AS uid
```

This assigns ALL unlock records the same `credit_id` (the first credit bundle by expiry). But credits may have been deducted across multiple bundles in the FIFO loop above. The audit trail is misleading -- some unlocks will reference a credit bundle that wasn't actually the one debited.

**Fix:** Track which credit bundles were used during deduction and assign correctly, or accept the inaccuracy and add a comment noting this is approximate.

---

### W-07. Sprint 20 `lib/ai/cost-logger.ts` uses `user_id` column to store `recruiter_id`

Sprint 20 (line 1379):
```typescript
user_id: entry.recruiter_id ?? null,
```

The `ai_usage_log` table (created by Sprint 16) has a `user_id` column that references `public.users(id)`. A recruiter's ID (from `public.recruiters`) is NOT a valid foreign key for `public.users(id)`. This INSERT will fail with a foreign key violation.

**Fix:** Either:
- (a) Add a nullable `recruiter_id uuid REFERENCES public.recruiters(id)` column to `ai_usage_log` (requires a migration addition)
- (b) Store `NULL` for `user_id` and put the recruiter ID in the `metadata` JSONB field

---

### W-08. Sprint 20 references `gpt-5` as completion model (line 1277)

Sprint 20 `lib/ai/match-explanation.ts` uses `COMPLETION_MODEL = 'gpt-5'`. As of this review, OpenAI's latest model is GPT-4o/GPT-4-turbo. `gpt-5` may not exist or may have a different API contract.

**Recommendation:** Use `gpt-4o` or `gpt-4-turbo` as the completion model, or add a comment that this should be updated when the model is available.

---

## 3. Cross-Sprint Dependency Verification

### 3.1. Sprint 17 -> Sprint 18 (Phase Boundary)

| Dependency | Created in Sprint 17 | Referenced in Sprint 18 | Match? |
|------------|----------------------|-------------------------|--------|
| `attachments.attachment_status` column | `text NOT NULL DEFAULT 'active'` with CHECK constraint | NOT referenced in Sprint 18 `get_graph_proximity()` (see W-03) | PARTIAL -- Sprint 18 should filter by status |
| `is_trusted_user()` RPC | Returns boolean, checks account age, endorsement count, penalty status | Not referenced in Sprint 18 | N/A (no dependency) |
| `yacht_embeddings` table | Created with `vector(1536)`, IVFFlat index | Not referenced in Sprint 18 | N/A |
| `check_yacht_establishment()` RPC | Updates `yachts.is_established` | Not referenced in Sprint 18 | N/A |
| `attachment_confirmations` table | Created | Not referenced in Sprint 18 | N/A |
| `users.shadow_constrained`, `users.attachment_frozen` columns | Added to users table | Not referenced in Sprint 18 | N/A |

**Verdict:** Phase boundary is clean. Sprint 18 does not directly depend on Sprint 17's new tables/columns. The only issue is Sprint 18 should be aware of `attachment_status` for graph proximity (W-03).

### 3.2. Sprint 17 -> Sprint 19

| Dependency | Created in Sprint 17 | Referenced in Sprint 19 | Match? |
|------------|----------------------|-------------------------|--------|
| `is_trusted_user()` RPC | Sprint 17 creates it | Sprint 19 does not reference it | N/A -- Sprint 19 is recruiter-focused, no confirmation |

### 3.3. Sprint 17 -> Sprint 20 (pgvector infrastructure)

| Dependency | Created in Sprint 17 | Referenced in Sprint 20 | Match? |
|------------|----------------------|-------------------------|--------|
| pgvector extension | `CREATE EXTENSION IF NOT EXISTS vector` | Sprint 20 assumes it exists | YES |
| `yacht_embeddings` table | `embedding vector(1536)`, IVFFlat with `lists = 100` | Sprint 20 references as existing dependency | YES |
| Embedding dimension | 1536 (text-embedding-3-small) | Sprint 20 `crew_profile_embeddings` uses `vector(1536)` | YES |
| IVFFlat config | `lists = 100`, `vector_cosine_ops` | Sprint 20 `crew_profile_embeddings` uses same: `lists = 100`, `vector_cosine_ops` | YES |
| `search_yachts_semantic()` RPC pattern | Returns table with similarity score | Sprint 20 `search_crew_nlp()` follows same pattern | YES |
| Nightly re-index cron pattern | Sprint 17 creates yacht embedding cron | Sprint 20 creates profile embedding cron following same pattern | YES |
| `lib/ai/embeddings.ts` | Sprint 17 creates with null-safe returns | Sprint 20 OVERWRITES with incompatible signatures | **NO -- see C-06** |

### 3.4. Sprint 18 -> Sprint 19

| Dependency | Created in Sprint 18 | Referenced in Sprint 19 | Match? |
|------------|----------------------|-------------------------|--------|
| `get_graph_proximity()` RPC | `(p_viewer_id uuid, p_target_id uuid) RETURNS jsonb` | Not directly used in Sprint 19 RPCs | N/A |
| `positions` table | Created | Not referenced in Sprint 19 (recruiters cannot post positions per D-024) | N/A -- correct |

**Note:** Sprint 18 says `get_graph_proximity()` is "designed as a general-purpose utility that Sprint 19 (recruiter search)... will reuse." However, Sprint 19 does not actually call `get_graph_proximity()` anywhere in its build plan. This is a documentation inaccuracy but not a bug -- graph proximity between recruiter and crew doesn't make sense (recruiters are not in the graph).

### 3.5. Sprint 19 -> Sprint 20 (Recruiter Schema)

| Dependency | Created in Sprint 19 | Referenced in Sprint 20 | Match? |
|------------|----------------------|-------------------------|--------|
| `recruiters` table schema | `id, auth_user_id, email, company_name, contact_name, phone, email_verified, stripe_customer_id, subscription_status, subscription_id, subscription_ends_at, created_at, updated_at` | Sprint 20 adds `agency_id`, `agency_role` columns | YES -- ALTERs are compatible |
| `recruiter_credits` table | `id, recruiter_id, credits_purchased, credits_remaining, price_eur, stripe_payment_intent_id, purchased_at, expires_at` | Sprint 20 adds `agency_id` column | YES |
| `recruiter_unlocks` table | `id, recruiter_id, crew_user_id, credit_id, unlocked_at` | Sprint 20 reuses for agency shared unlocks | YES |
| `unlock_crew_profile()` RPC | Full version with subscription check, visibility check, EXCEPTION handler | Sprint 20 REPLACES with agency-aware version missing safety checks | **NO -- see C-07** |
| `get_recruiter_credit_balance()` RPC | Returns JSONB with total_credits, next_expiry, bundle_count | Sprint 20 does not override -- reuses as-is | YES |
| `search_crew_recruiter()` RPC | Full version with locked/unlocked shaping | Sprint 20 does not override -- adds `search_crew_nlp()` as separate RPC | YES |
| `get_recruiter_id_from_auth()` helper | Maps auth.uid() to recruiters.id | Sprint 20 does NOT use this helper in RLS policies | **NO -- see C-04** |
| `is_recruiter()` helper | Returns boolean | Sprint 20 does not reference | N/A |
| Recruiter RLS pattern | Uses `auth.uid() = auth_user_id` | Sprint 20 RLS uses `r.id = auth.uid()` (wrong) | **NO -- see C-04** |

---

## 4. Schema Consistency with Existing Codebase

### 4.1. SQL Style

| Convention | Existing Migrations | Sprint 17 | Sprint 18 | Sprint 19 | Sprint 20 |
|-----------|-------------------|-----------|-----------|-----------|-----------|
| Case style | Mixed (core = lowercase, Sprint 7 = uppercase) | UPPERCASE | UPPERCASE | UPPERCASE | UPPERCASE |
| `gen_random_uuid()` for PKs | Yes | Yes | Yes | Yes | Yes |
| `security definer` on RPCs | Yes | Yes | Yes | Yes | Yes |
| `GRANT EXECUTE` on RPCs | Yes | Yes (all 6 functions) | Yes (all 5 functions) | Yes (all 6 functions) | Yes (all listed) |
| `SET search_path = public` | Yes | Yes | Yes | Yes | Yes |
| RLS on every new table | Yes | Yes (3 tables) | Yes (2 tables) | Yes (3 tables) | Yes (6 tables) |
| `set_updated_at()` trigger | Yes | Not needed (no update on new tables) | Yes (positions, applications) | Yes (recruiters) | Yes (agencies) |

**Consistency:** Good. All four sprints use UPPERCASE SQL, which is consistent with Sprint 7+ patterns.

### 4.2. Table/Column Names Verified Against Schema

| Reference | Build Plan | Actual Schema | Match? |
|-----------|-----------|---------------|--------|
| `yachts.is_established` | Sprint 17 check_yacht_establishment | Exists: `is_established boolean not null default false` (line 95) | YES |
| `yachts.established_at` | Sprint 17 check_yacht_establishment | Exists: `established_at timestamptz` (line 96) | YES |
| `yachts.length_meters` | Sprint 17 RPC, Sprint 18 join, Sprint 20 compose | Exists: `length_meters numeric(5,1)` (line 90) | YES |
| `yachts.flag_state` | Sprint 17 search_yachts_semantic | Exists: `flag_state text` (line 91) | YES |
| `attachments.role_label` | Sprint 17 API route | Exists: `role_label text not null` (line 125) | YES |
| `attachments.role_title` | Sprint 20 compose_profile_text | Does NOT exist -- column is `role_label` | **NO -- see W-02** |
| `attachments.started_at` | Sprint 17, 18, 19, 20 | Exists: `started_at date not null` (line 128) | YES |
| `attachments.ended_at` | Sprint 17, 18, 19, 20 | Exists: `ended_at date` (line 129) | YES |
| `attachments.deleted_at` | Sprint 17, 18, 19, 20 | Exists: `deleted_at timestamptz` (line 137) | YES |
| `users.deleted_at` | Sprint 19 index, Sprint 19 search_crew_recruiter | Does NOT exist | **NO -- see C-02, C-03** |
| `users.full_name` | Sprint 17 get_eligible_confirmers | Exists: `full_name text not null` (line 13) | YES |
| `users.email` | Sprint 17 get_eligible_confirmers | Exists: `email text unique not null` (line 12) | YES |
| `users.onboarding_complete` | Sprint 18 profile check, Sprint 19 search | Exists: `onboarding_complete boolean not null default false` (line 20) | YES |
| `users.subscription_status` | Sprint 18 position limits | Exists: `subscription_status text not null default 'free'` (line 49) | YES |
| `users.bio` | Sprint 18 profile check, Sprint 20 compose | Exists: `bio text` (line 16) | YES |
| `users.show_phone`, `show_email`, `show_whatsapp` | Sprint 19 search result shaping | Exists (lines 33-35) | YES |
| `endorsements.content` | Sprint 20 compose_profile_text | Exists: `content text not null` (line 160) | YES |
| `certifications.user_id` | Sprint 20 compose_profile_text | Exists: `user_id uuid not null` (line 231) | YES |
| `certifications.certification_type_id` | Sprint 20 compose_profile_text | Exists: `certification_type_id uuid` (line 232) | YES |

### 4.3. RPC References Verified

| RPC | Claimed to Exist | Verified? |
|-----|-----------------|-----------|
| `search_yachts(p_query, p_limit)` | Sprint 17 fallback | YES -- `20260314000011_yacht_sprint4.sql` |
| `get_colleagues(p_user_id)` | Sprint 18 dependency | YES -- `20260313000004_functions.sql` |
| `set_updated_at()` trigger | Sprint 18 triggers | YES -- `20260313000004_functions.sql` |
| `get_mutual_colleagues()` | Sprint 18 claims "Sprint 12 build plan -- defined in migration" | **NOT FOUND** in any existing migration file (grep returned no matches). May exist only in Sprint 12's build plan but not yet applied. If Sprint 12 hasn't been executed yet, this will be missing. |
| `are_coworkers_on_yacht()` | Sprint 17 dependency | YES -- `20260313000004_functions.sql` |

---

## 5. Decision Compliance

| Decision | Rule | S17 | S18 | S19 | S20 | Compliant? |
|----------|------|-----|-----|-----|-----|------------|
| D-003 | Never monetise influence over trust outcomes | Confirmation is free trust mechanism | Hiring is free, no paid listings | Recruiter credits unlock profiles (presentation), not trust | Agency credits same model | YES |
| D-007 | Identity free, presentation paid | Attachment confirmation is free identity | Positions are free (per D-022). No paid boost. | Recruiter sub + credits for search access | Agency sub + credits | YES |
| D-017 | Yacht establishment rule: 60 days + crew threshold | Sprint 17 `check_yacht_establishment()` implements exactly this: 60 days + size-based crew threshold | N/A | N/A | N/A | YES |
| D-022 | Free peer hiring, no paid listings, poster must have full profile | N/A | Full profile required. No payment. No algorithmic matching. 1 free / 3 Pro limit is for quantity, not access. | Recruiters cannot post positions (D-024 read-only) | Agencies cannot post positions | YES |
| D-023 | Pro tier with search access | N/A | Position post limit: 1 free / 3 Pro | Not applicable (recruiter, not crew Pro) | Not applicable | YES |
| D-024 | Recruiter pays EUR 29/month + credits, read-only | N/A | N/A | EUR 29/month sub. Credits EUR 75-1200. Read-only (no write RLS on crew tables). | Agency extends same model with shared pools | YES |
| D-025 | Direct links show full profile, search results locked | N/A | N/A | `search_crew_recruiter()` returns locked/unlocked fields based on unlock status. Graph browsing stays open. | `search_crew_nlp()` same pattern | YES |
| D-026 | Recruiter sorting by endorsement count allowed | N/A | N/A | `search_crew_recruiter()` supports `endorsement_count` sort. Display shows "X endorsements from Y people across Z yachts". | `search_crew_nlp()` returns endorsement counts | YES |
| D-027 | Crew availability opt-in with expiry | N/A | N/A | `recruiter_visible` column. Default false. Independent of availability toggle. | Reuses `recruiter_visible` | YES |

**No decision violations found.**

---

## 6. Format and Completeness Check

### 6.1. Migration SQL Quality

| Criterion | S17 | S18 | S19 | S20 |
|-----------|-----|-----|-----|-----|
| Complete SQL (not pseudocode) | YES | YES | YES | YES |
| RLS on every new table | YES (3/3) | YES (2/2) | YES (3/3) | YES (6/6) |
| GRANT EXECUTE on every new RPC | YES (6/6: check_yacht_establishment, is_trusted_user, get_eligible_confirmers, check_rejection_penalties, search_yachts_semantic, + implicit set_updated_at) | YES (5/5: get_graph_proximity, get_graph_proximity_batch, get_position_post_count, get_position_feed, + set_updated_at trigger) | YES (6/6: get_recruiter_id_from_auth, is_recruiter, get_recruiter_credit_balance, unlock_crew_profile, search_crew_recruiter, get_endorsement_summary) | YES (5+ functions granted, duplicate grants in section 1.16) |
| Indexes specified | YES (7 indexes) | YES (7 indexes) | YES (9 indexes) | YES (8+ indexes) |
| Constraint checks | YES (attachment_status, confirmation_decision, comment_length) | YES (status, duration, role_length, department_length, description_length, application_status, message_length) | YES (subscription_status, company_name_length, email_format, credit constraints) | YES (agency_role, agency_role_consistency, invitation_status, shortlist_scope) |

### 6.2. File Path Consistency

| Path Pattern | Convention | S17 | S18 | S19 | S20 |
|-------------|-----------|-----|-----|-----|-----|
| API routes | `app/api/[resource]/route.ts` | `app/api/attachments/confirm/route.ts` OK, `app/api/yacht-search/semantic/route.ts` OK, `app/api/attachments/route.ts` OK | `app/api/positions/route.ts` OK, `app/api/positions/[id]/route.ts` OK, `app/api/positions/[id]/apply/route.ts` OK | `app/api/recruiter/me/route.ts` OK, `app/api/recruiter/unlock/route.ts` OK, `app/api/recruiter/search/route.ts` OK, `app/api/recruiter/stripe/checkout/route.ts` OK | `app/api/recruiter/agency/create/route.ts` OK, `app/api/recruiter/agency/invite/route.ts` OK |
| Recruiter auth pages | `app/recruiter/[page]/page.tsx` | N/A | N/A | `app/recruiter/signup/page.tsx` OK, `app/recruiter/login/page.tsx` OK | `app/recruiter/agency/accept/page.tsx` -- implied but not explicitly created |
| Lib files | `lib/[category]/[file].ts` | `lib/ai/embeddings.ts` OK, `lib/ai/yacht-embeddings.ts` OK | `lib/email/position-application.ts` OK, `lib/email/application-status.ts` OK, `lib/email/position-expiry.ts` OK | `lib/recruiter/auth-guard.ts` OK, `lib/recruiter/credit-bundles.ts` OK | `lib/ai/embeddings.ts` CONFLICT (see C-06), `lib/ai/match-explanation.ts` OK, `lib/ai/cost-logger.ts` OK |
| Cron routes | `app/api/cron/[name]/route.ts` | `app/api/cron/confirmation-resolution/route.ts` OK | `app/api/cron/position-expiry/route.ts` OK, `app/api/cron/position-expiry-warning/route.ts` OK | N/A | Cron routes implied for embedding queue processing |

---

## 7. Comparison with Batch 1 Issues

### Recurring Patterns

| Batch 1 Issue | Recurs in Batch 2? | Details |
|---------------|-------------------|---------|
| C-01: Migration timestamp collision | **YES -- C-01** | Three sprints (18, 19, 20) all use `20260322000002`. Same pattern as Sprint 14/16 collision in batch 1. |
| C-02: `users.deleted_at` referenced but doesn't exist | **YES -- C-02, C-03** | Sprint 19 references `users.deleted_at` in an index and an RPC, exactly as Sprint 14 did. This is now a systemic pattern that should be caught by a pre-commit schema validation. |
| C-03: Overly permissive RLS | No direct recurrence | Sprint 19 and 20 RLS policies are appropriately scoped. However, Sprint 20 has the opposite problem -- policies are too restrictive (will match nothing) due to the `auth.uid()` confusion. |
| W-02: GIN index vs `= ANY()` mismatch | Not recurring | Sprint 19 uses `= ANY()` for department filtering, same pattern as Sprint 15, but no GIN index is created on it -- filtering is inline in the CTE. |
| W-07: Direct DB query instead of `getProStatus()` | Not recurring | Sprint 18 correctly uses `subscription_status = 'pro'` check via RPC, not direct query. |

### New Patterns in Batch 2

| Pattern | Sprints Affected | Description |
|---------|-----------------|-------------|
| `auth.uid()` vs table PK confusion | Sprint 20 (16+ occurrences) | When separate account tables exist (recruiters vs users), RLS policies must map `auth.uid()` through `auth_user_id`, not compare against the table's own `id` PK. This is a new category of error not seen in batch 1. |
| File ownership collision | Sprint 17 + 20 | Two sprints creating the same `lib/ai/embeddings.ts` file with incompatible signatures. This is a build-order dependency that batch 1 didn't encounter because no two sprints created the same file. |
| Safety check regression on function override | Sprint 19 -> 20 | `CREATE OR REPLACE FUNCTION` completely replaces the function body. Sprint 20 drops safety checks that Sprint 19 established. This pattern will recur whenever a later sprint overrides an earlier sprint's RPC. |

---

## 8. Recommended Fixes

### Must-fix (blocks execution)

1. **C-01:** Assign unique sequential migration timestamps:
   - Sprint 17: `20260322000001`
   - Sprint 18: `20260322000002` (keep)
   - Sprint 19: `20260322000003`
   - Sprint 20: `20260322000004`

2. **C-02:** Remove `AND deleted_at IS NULL` from Sprint 19's `idx_users_recruiter_visible` index.

3. **C-03:** Remove `AND u.deleted_at IS NULL` from Sprint 19's `search_crew_recruiter()` RPC.

4. **C-04:** Rewrite all Sprint 20 RLS policies to use `r.auth_user_id = auth.uid()` instead of `r.id = auth.uid()`. Use `get_recruiter_id_from_auth()` helper or direct join through `auth_user_id`.

5. **C-05:** Change all Sprint 20 API routes from `.eq('id', user.id)` to `.eq('auth_user_id', user.id)` when querying the `recruiters` table.

6. **C-06:** Remove Sprint 20's `lib/ai/embeddings.ts` file creation. Import from Sprint 17's version. Move any Sprint 20-specific helpers to `lib/ai/profile-embeddings.ts`.

7. **C-07:** Restore subscription check, crew visibility check, and EXCEPTION handler in Sprint 20's `unlock_crew_profile()` override.

### Should-fix (improves correctness)

8. **W-01:** Standardize env var to `NEXT_PUBLIC_SITE_URL` across all sprints.

9. **W-02:** Change `a.role_title` to `a.role_label` in Sprint 20's `compose_profile_text()`.

10. **W-03:** Add `attachment_status IN ('active', 'confirmed')` filter to Sprint 18's `get_graph_proximity()` RPC attachment queries.

11. **W-06:** Add comment to `bulk_unlock_crew_profiles()` noting that `credit_id` on unlock records is approximate.

12. **W-07:** Fix Sprint 20's `cost-logger.ts` to not insert recruiter IDs into the `user_id` FK column.

---

## 9. Notes for Coding Agent

1. **Execution order is strict:** Sprint 17 must run before Sprint 18, which must run before Sprint 19, which must run before Sprint 20. Sprint 20 depends on Sprint 19's recruiter tables, Sprint 17's pgvector extension, and Sprint 16's AI usage log table.

2. **Sprint 20 requires a revision pass.** The `auth.uid()` vs `recruiters.id` confusion is pervasive and would make all recruiter-facing features in Sprint 20 completely non-functional. This is not a minor fix -- it affects the fundamental access control model for all 6 new tables.

3. **The `get_mutual_colleagues()` RPC** referenced as existing by Sprint 18 does not appear in any migration file. Verify whether Sprint 12 has been executed. If not, Sprint 18 may need to create this function or remove the dependency.

4. **Sprint 17's `check_yacht_establishment()` RPC** uses `length_meters` which is `numeric(5,1)` in the schema. The RPC compares it against integer thresholds (30, 50, 80) -- this is fine because PostgreSQL auto-coerces numeric to int for comparison.

5. **The `internal` schema** is used by Sprint 17's `check_rejection_penalties()` to insert into `internal.flags`. This schema and table exist in `20260313000003_core_tables.sql`. No additional setup needed.

6. **Sprint 20's `queue_profile_reembed()` trigger** fires on every `users` UPDATE, not just recruiter-visible users. The function body checks `NEW.recruiter_visible = true` before queueing, which is correct -- but on a table with many updates (e.g., `last_seen_at` updates), this trigger will fire frequently and do nothing. Performance is acceptable for <50K users but worth monitoring.

7. **Sprint 19's `recruiter_visible` column** (default false) is independent of `availability_status`. D-027 says "Crew can hide from recruiters entirely while remaining visible to other crew." This is correctly implemented.

8. **Sprint 18's `NEXT_PUBLIC_SITE_URL`** and Sprint 17's `NEXT_PUBLIC_APP_URL` -- check `.env.local` to determine which is canonical. Both default to `https://yachtie.link`.
