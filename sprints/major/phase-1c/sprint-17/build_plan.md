# Sprint 17 — Attachment Confirmation + Smart Yacht Autocomplete: Build Plan

## Context

Sprint 17 closes Phase 1C by hardening graph integrity. Two complementary features ship: attachment confirmation prevents false claims on established yachts, and semantic yacht autocomplete prevents duplicate yacht entries. Together they address the two main threats to graph quality — fake attachments and fragmented yacht entities.

### What Already Exists (No Build Needed)

| Dependency | Status | Notes |
|-----------|--------|-------|
| `yachts` table with `is_established`, `established_at`, `name_normalized` | Exists | Sprint 3-4 — `is_established` boolean + `established_at` timestamptz already on schema |
| `attachments` table with `user_id`, `yacht_id`, `started_at`, `ended_at`, `deleted_at` | Exists | Sprint 2-4 |
| `endorsements` table with `endorser_id`, `recipient_id`, `yacht_id` | Exists | Sprint 5 |
| `search_yachts(p_query, p_limit)` RPC — trigram fuzzy search | Exists | Sprint 4 — becomes fallback for semantic search |
| `YachtPicker` component with duplicate detection | Exists | `components/yacht/YachtPicker.tsx` — Sprint 4, near-miss log |
| `yacht_near_miss_log` table | Exists | Sprint 4 — tracks duplicate prevention decisions |
| Yacht detail page `/app/yacht/[id]` | Exists | Already shows `is_established` badge |
| Attachment creation page `/app/attachment/new` | Exists | Uses `YachtPicker`, inserts into `attachments` directly |
| `sendNotifyEmail()` via Resend | Exists | `lib/email/notify.ts` |
| `createServiceClient()` admin Supabase client | Exists | `lib/supabase/admin.ts` |
| Rate limiting (`lib/rate-limit/helpers.ts`) | Exists | Sprint 8 |
| Validation (`lib/validation/validate.ts`, Zod schemas) | Exists | Sprint 5 |
| PostHog client + server analytics | Exists | `lib/analytics/events.ts`, `lib/analytics/server.ts` |
| `handleApiError()` | Exists | `lib/api/errors.ts` |
| Cron job infrastructure (vercel.json, CRON_SECRET pattern) | Exists | Sprint 8 |
| OpenAI API key + `lib/ai/moderation.ts` | Exists | Sprint 8 (moderation), Sprint 16 adds full `lib/ai/` layer |
| `are_coworkers_on_yacht(user_a, user_b, yacht)` RPC | Exists | Sprint 4 |

### Codebase Patterns to Follow

- Server components fetch data via `createClient()` from `@/lib/supabase/server` — no API routes for reads
- Independent queries wrapped in `Promise.all()` for performance
- RPCs use `security definer` (codebase convention) — all existing RPCs use this
- `GRANT EXECUTE ON FUNCTION ... TO authenticated` on every new RPC
- Client-side analytics: `trackEvent(event, properties)` from `lib/analytics/events.ts`
- Server-side analytics: `trackServerEvent(userId, event, properties)` from `lib/analytics/server.ts`
- Email: import `sendNotifyEmail` from `lib/email/notify.ts`, sender is `notifications@mail.yachtie.link`
- Cron auth: check `authorization` header against `Bearer ${process.env.CRON_SECRET}`
- All colour references use semantic CSS custom properties from `globals.css`
- Mobile-first: 375px base, `md:` breakpoints for tablet/desktop
- API routes: Zod validation via `validateBody()`, rate limiting via `applyRateLimit()`, error handling via `handleApiError()`
- Cron routes use `createServiceClient()` (service role, bypasses RLS)
- OpenAI client: singleton pattern (see `lib/ai/moderation.ts`) — Sprint 16 expands this to `lib/ai/openai-client.ts`

### Dependencies

- Sprint 16 complete: `lib/ai/openai-client.ts`, `lib/ai/rate-limiter.ts`, `lib/ai/cost-tracker.ts`, `ai_usage_log` table
- Sprint 14 complete: availability toggle, endorsement signals
- Sprint 12 complete: yacht detail pages, colleague explorer

### Important Schema Note

The `yachts` table already has `is_established boolean DEFAULT false` and `established_at timestamptz` columns (from Sprint 3 core_tables.sql). Sprint 17 does NOT add a new `yacht_status` text column — it uses the existing `is_established` boolean. The README's reference to a `yacht_status` column is superseded by the existing schema. This avoids a redundant column and keeps queries simple.

Similarly, the `attachments` table needs a new `attachment_status` text column (does not exist yet).

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/YYYYMMDD000001_sprint17_confirmation_embeddings.sql`

Use the next sequential timestamp after the latest migration. As of now, the latest is `20260321000001_fix_storage_buckets.sql`.

### 1.1 — pgvector Extension

```sql
-- Sprint 17: Attachment Confirmation + Smart Yacht Autocomplete
-- Adds confirmation flow tables, yacht embedding infrastructure,
-- trust check RPCs, and confirmation resolution logic.
-- See sprints/major/phase-1c/sprint-17/build_plan.md for full specification.

-- ═══════════════════════════════════════════════════════════
-- 0. ENABLE pgvector EXTENSION
-- ═══════════════════════════════════════════════════════════

-- pgvector is natively supported on Supabase (all plans).
-- Required for yacht embedding storage and cosine similarity search.
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.2 — Attachment Status Column

```sql
-- ═══════════════════════════════════════════════════════════
-- 1. ATTACHMENT STATUS COLUMN
-- ═══════════════════════════════════════════════════════════

-- Add status column to attachments table.
-- Existing attachments default to 'active' (backwards compatible).
-- New attachments to established yachts will be 'pending_confirmation'.
ALTER TABLE public.attachments
  ADD COLUMN IF NOT EXISTS attachment_status text NOT NULL DEFAULT 'active';

ALTER TABLE public.attachments
  ADD CONSTRAINT valid_attachment_status
  CHECK (attachment_status IN ('active', 'pending_confirmation', 'confirmed', 'rejected'));

-- Index for filtering pending confirmations (cron job, UI queries)
CREATE INDEX IF NOT EXISTS idx_attachments_pending_status
  ON public.attachments (attachment_status, created_at)
  WHERE attachment_status = 'pending_confirmation';
```

### 1.3 — Attachment Confirmations Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. ATTACHMENT CONFIRMATIONS TABLE
-- ═══════════════════════════════════════════════════════════

-- Records individual confirm/reject decisions from eligible crew.
CREATE TABLE public.attachment_confirmations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id  uuid NOT NULL REFERENCES public.attachments (id) ON DELETE CASCADE,
  confirmer_id   uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  decision       text NOT NULL,
  comment        text,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_confirmation_decision
    CHECK (decision IN ('confirm', 'reject')),
  CONSTRAINT comment_length
    CHECK (char_length(comment) <= 500)
);

-- One decision per confirmer per attachment
CREATE UNIQUE INDEX idx_attachment_confirmations_unique
  ON public.attachment_confirmations (attachment_id, confirmer_id);

-- For fetching all decisions on an attachment
CREATE INDEX idx_attachment_confirmations_attachment
  ON public.attachment_confirmations (attachment_id);

-- For fetching a user's confirmation history
CREATE INDEX idx_attachment_confirmations_confirmer
  ON public.attachment_confirmations (confirmer_id, created_at DESC);

-- RLS
ALTER TABLE public.attachment_confirmations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read confirmations for attachments they're involved in
-- (either as the requester or as an eligible confirmer on the yacht).
-- Simplified: all authenticated users can read. Confirmations are not sensitive.
CREATE POLICY "attachment_confirmations: authenticated read"
  ON public.attachment_confirmations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only insert their own confirmation decisions
CREATE POLICY "attachment_confirmations: own insert"
  ON public.attachment_confirmations FOR INSERT
  WITH CHECK (auth.uid() = confirmer_id);

-- No update or delete — decisions are final once submitted.
```

### 1.4 — Attachment Rejections Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. ATTACHMENT REJECTIONS TABLE (penalty tracking)
-- ═══════════════════════════════════════════════════════════

-- Tracks rejection events per user for penalty threshold checks.
-- Separate from attachment_confirmations because this needs fast
-- time-windowed counting (3 in 30 days, 5 in 60 days).
CREATE TABLE public.attachment_rejections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  attachment_id  uuid NOT NULL REFERENCES public.attachments (id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Optimised for penalty threshold queries: "count rejections for user in last N days"
CREATE INDEX idx_attachment_rejections_user_window
  ON public.attachment_rejections (user_id, created_at DESC);

-- RLS
ALTER TABLE public.attachment_rejections ENABLE ROW LEVEL SECURITY;

-- Only service role writes to this table (via RPCs and cron).
-- Users can read their own rejections.
CREATE POLICY "attachment_rejections: own read"
  ON public.attachment_rejections FOR SELECT
  USING (auth.uid() = user_id);

-- Insert via service role only (RPCs with security definer handle this).
-- No direct user insert policy — rejections are system-generated.
```

### 1.5 — User Penalty Columns

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. USER PENALTY COLUMNS
-- ═══════════════════════════════════════════════════════════

-- Shadow-constrain: new attachments silently reviewed. Not visible to user.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS shadow_constrained boolean NOT NULL DEFAULT false;

-- Attachment frozen: user cannot create new attachments. Visible to user.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS attachment_frozen boolean NOT NULL DEFAULT false;

-- Timestamp for when the penalty was applied (for admin review)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS penalty_applied_at timestamptz;
```

### 1.6 — Yacht Embeddings Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 5. YACHT EMBEDDINGS TABLE
-- ═══════════════════════════════════════════════════════════

-- Stores vector embeddings for yacht names + metadata.
-- Used for semantic search in YachtPicker.
-- Dimension 1536 matches text-embedding-3-small output.
CREATE TABLE public.yacht_embeddings (
  yacht_id       uuid PRIMARY KEY REFERENCES public.yachts (id) ON DELETE CASCADE,
  embedding      vector(1536) NOT NULL,
  metadata_text  text NOT NULL,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- IVFFlat index for fast cosine similarity queries.
-- lists = 100 is appropriate for up to ~50K yachts.
-- IMPORTANT: IVFFlat requires at least `lists` rows to exist
-- before the index is useful. For initial data with <100 yachts,
-- queries will still work but scan sequentially. The nightly
-- re-index cron creates the index after sufficient data exists.
-- For now, create the index — it degrades gracefully on small data.
CREATE INDEX idx_yacht_embeddings_cosine
  ON public.yacht_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS
ALTER TABLE public.yacht_embeddings ENABLE ROW LEVEL SECURITY;

-- Embeddings are read-only for all authenticated users (used in search).
CREATE POLICY "yacht_embeddings: authenticated read"
  ON public.yacht_embeddings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert/update via service role only (API routes and cron).
-- No direct user write policies.
```

### 1.7 — check_yacht_establishment RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 6. CHECK YACHT ESTABLISHMENT
-- ═══════════════════════════════════════════════════════════

-- Recalculates whether a yacht should be established based on:
-- 1. Yacht age >= 60 days
-- 2. Crew count meets size-based threshold
-- Returns the yacht's current establishment status.
-- Establishment is one-way: once established, stays established.
CREATE OR REPLACE FUNCTION public.check_yacht_establishment(p_yacht_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yacht record;
  v_crew_count int;
  v_threshold int;
  v_age_days int;
  v_already_established boolean;
BEGIN
  -- Fetch yacht
  SELECT id, name, length_meters, is_established, created_at
  INTO v_yacht
  FROM yachts
  WHERE id = p_yacht_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Yacht not found');
  END IF;

  -- If already established, return immediately (one-way transition)
  IF v_yacht.is_established THEN
    RETURN jsonb_build_object(
      'yacht_id', v_yacht.id,
      'is_established', true,
      'was_already_established', true
    );
  END IF;

  -- Calculate age in days
  v_age_days := extract(day from (now() - v_yacht.created_at))::int;

  -- Count distinct attached crew (non-deleted attachments)
  SELECT count(DISTINCT user_id) INTO v_crew_count
  FROM attachments
  WHERE yacht_id = p_yacht_id
    AND deleted_at IS NULL;

  -- Determine threshold based on yacht size
  -- Yachts without length default to lowest threshold (3 crew)
  IF v_yacht.length_meters IS NULL OR v_yacht.length_meters < 30 THEN
    v_threshold := 3;
  ELSIF v_yacht.length_meters < 50 THEN
    v_threshold := 5;
  ELSIF v_yacht.length_meters < 80 THEN
    v_threshold := 8;
  ELSE
    v_threshold := 12;
  END IF;

  -- Check both conditions
  IF v_age_days >= 60 AND v_crew_count >= v_threshold THEN
    -- Transition to established
    UPDATE yachts
    SET is_established = true,
        established_at = now()
    WHERE id = p_yacht_id;

    RETURN jsonb_build_object(
      'yacht_id', v_yacht.id,
      'is_established', true,
      'was_already_established', false,
      'crew_count', v_crew_count,
      'threshold', v_threshold,
      'age_days', v_age_days
    );
  ELSE
    RETURN jsonb_build_object(
      'yacht_id', v_yacht.id,
      'is_established', false,
      'crew_count', v_crew_count,
      'threshold', v_threshold,
      'age_days', v_age_days,
      'needs_age', GREATEST(0, 60 - v_age_days),
      'needs_crew', GREATEST(0, v_threshold - v_crew_count)
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_yacht_establishment(uuid) TO authenticated;
```

### 1.8 — is_trusted_user RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 7. IS TRUSTED USER (simplified verification proxy)
-- ═══════════════════════════════════════════════════════════

-- Lightweight trust heuristic for Sprint 17 confirmer eligibility.
-- NOT a full verified status system (that's D-016, Sprint 26).
-- Requirements:
--   1. Account age >= 90 days
--   2. >= 3 endorsements received from >= 2 different yachts
--   3. Not shadow-constrained or attachment-frozen
-- Known limitation: new-but-legitimate users can't confirm.
-- Acceptable tradeoff: prevents sock puppet confirmation.
CREATE OR REPLACE FUNCTION public.is_trusted_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = p_user_id
      -- Account age >= 90 days
      AND u.created_at <= now() - interval '90 days'
      -- Not penalised
      AND u.shadow_constrained = false
      AND u.attachment_frozen = false
      -- >= 3 endorsements from >= 2 different yachts
      AND (
        SELECT count(*) FROM endorsements e
        WHERE e.recipient_id = p_user_id AND e.deleted_at IS NULL
      ) >= 3
      AND (
        SELECT count(DISTINCT e.yacht_id) FROM endorsements e
        WHERE e.recipient_id = p_user_id AND e.deleted_at IS NULL
      ) >= 2
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_trusted_user(uuid) TO authenticated;
```

### 1.9 — get_eligible_confirmers RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 8. GET ELIGIBLE CONFIRMERS
-- ═══════════════════════════════════════════════════════════

-- Returns users who can confirm/reject a pending attachment.
-- Eligibility: trusted user AND (overlapping dates on yacht OR current attachment to yacht).
-- Excludes the requester themselves.
CREATE OR REPLACE FUNCTION public.get_eligible_confirmers(p_attachment_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  full_name text,
  profile_photo_url text,
  email text,
  has_overlap boolean,
  is_current boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attachment record;
BEGIN
  -- Fetch the pending attachment
  SELECT a.user_id, a.yacht_id, a.started_at, a.ended_at
  INTO v_attachment
  FROM attachments a
  WHERE a.id = p_attachment_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    u.id AS user_id,
    u.display_name,
    u.full_name,
    u.profile_photo_url,
    u.email,
    -- Has overlapping dates with the requester on this yacht
    (
      a.started_at <= COALESCE(v_attachment.ended_at, CURRENT_DATE)
      AND COALESCE(a.ended_at, CURRENT_DATE) >= v_attachment.started_at
    ) AS has_overlap,
    -- Currently attached (no end date)
    (a.ended_at IS NULL) AS is_current
  FROM attachments a
  JOIN users u ON u.id = a.user_id
  WHERE a.yacht_id = v_attachment.yacht_id
    AND a.deleted_at IS NULL
    AND a.user_id != v_attachment.user_id  -- Exclude the requester
    AND a.attachment_status IN ('active', 'confirmed')  -- Only confirmed/active crew
    AND public.is_trusted_user(a.user_id)  -- Must be trusted
    AND (
      -- Overlapping dates
      (
        a.started_at <= COALESCE(v_attachment.ended_at, CURRENT_DATE)
        AND COALESCE(a.ended_at, CURRENT_DATE) >= v_attachment.started_at
      )
      -- OR currently attached (no end date)
      OR a.ended_at IS NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_eligible_confirmers(uuid) TO authenticated;
```

### 1.10 — check_rejection_penalties RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 9. CHECK REJECTION PENALTIES
-- ═══════════════════════════════════════════════════════════

-- Called after each rejection. Checks penalty thresholds and
-- applies penalties if met. Returns the current penalty state.
-- Thresholds (from yl_moderation.md):
--   3 rejections in 30 days → shadow_constrained
--   5 rejections in 60 days → attachment_frozen + escalation
CREATE OR REPLACE FUNCTION public.check_rejection_penalties(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_30d_count int;
  v_60d_count int;
  v_penalty_applied text := 'none';
BEGIN
  -- Count rejections in last 30 days
  SELECT count(*) INTO v_30d_count
  FROM attachment_rejections
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '30 days';

  -- Count rejections in last 60 days
  SELECT count(*) INTO v_60d_count
  FROM attachment_rejections
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '60 days';

  -- Apply penalties (escalating)
  IF v_60d_count >= 5 THEN
    -- Freeze + escalate
    UPDATE users
    SET attachment_frozen = true,
        shadow_constrained = true,
        penalty_applied_at = now()
    WHERE id = p_user_id
      AND attachment_frozen = false;  -- Don't re-apply

    -- Log escalation for admin review
    INSERT INTO internal.flags (target_type, target_id, reason, notes)
    VALUES (
      'user',
      p_user_id,
      'attachment_rejection_freeze',
      format('5+ rejections in 60 days (%s in 60d, %s in 30d). Auto-frozen.', v_60d_count, v_30d_count)
    );

    v_penalty_applied := 'frozen';

  ELSIF v_30d_count >= 3 THEN
    -- Shadow constrain
    UPDATE users
    SET shadow_constrained = true,
        penalty_applied_at = now()
    WHERE id = p_user_id
      AND shadow_constrained = false;  -- Don't re-apply

    v_penalty_applied := 'shadow_constrained';
  END IF;

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'rejections_30d', v_30d_count,
    'rejections_60d', v_60d_count,
    'penalty_applied', v_penalty_applied,
    'shadow_constrained', (SELECT shadow_constrained FROM users WHERE id = p_user_id),
    'attachment_frozen', (SELECT attachment_frozen FROM users WHERE id = p_user_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rejection_penalties(uuid) TO authenticated;
```

### 1.11 — search_yachts_semantic RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 10. SEMANTIC YACHT SEARCH
-- ═══════════════════════════════════════════════════════════

-- Searches yacht_embeddings using cosine similarity.
-- The query embedding is passed in as a parameter (generated server-side via OpenAI API).
-- Returns yachts ranked by similarity above a threshold.
-- Falls through to empty result set if no matches — caller handles trigram fallback.
CREATE OR REPLACE FUNCTION public.search_yachts_semantic(
  p_query_embedding vector(1536),
  p_limit int DEFAULT 10,
  p_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id uuid,
  name text,
  yacht_type text,
  length_meters numeric,
  flag_state text,
  is_established boolean,
  crew_count bigint,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    y.id,
    y.name,
    y.yacht_type,
    y.length_meters,
    y.flag_state,
    y.is_established,
    (
      SELECT count(DISTINCT a.user_id)
      FROM attachments a
      WHERE a.yacht_id = y.id AND a.deleted_at IS NULL
    ) AS crew_count,
    (1 - (ye.embedding <=> p_query_embedding))::float AS similarity
  FROM yachts y
  JOIN yacht_embeddings ye ON y.id = ye.yacht_id
  WHERE (1 - (ye.embedding <=> p_query_embedding)) >= p_threshold
  ORDER BY similarity DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_yachts_semantic(vector(1536), int, float) TO authenticated;
```

**Design note on search_yachts_semantic:** The RPC accepts a pre-computed embedding vector rather than raw text. This is intentional — embedding generation requires the OpenAI API call, which must happen server-side in an API route. The API route generates the embedding, then passes it to the RPC. This keeps the RPC a pure SQL function with no external dependencies.

### 1.12 — Complete Migration Summary

All sections 1.1–1.11 above are concatenated into a single migration file in order. The file begins with the header comment from 1.1 and ends with the last GRANT statement.

---

## Part 2: API Routes

### 2.1 — POST /api/attachments/confirm — Submit Confirmation Decision

**File to create:** `app/api/attachments/confirm/route.ts`

```typescript
// POST /api/attachments/confirm
// Body: { attachment_id: string, decision: 'confirm' | 'reject', comment?: string }
// Response: { confirmation: { id, attachment_id, decision, created_at } }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const confirmationSchema = z.object({
  attachment_id: z.string().uuid(),
  decision: z.enum(['confirm', 'reject']),
  comment: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'endorsementEdit', user.id)
    if (limited) return limited

    const result = await validateBody(req, confirmationSchema)
    if ('error' in result) return result.error
    const { attachment_id, decision, comment } = result.data

    // Verify attachment exists and is pending
    const { data: attachment } = await supabase
      .from('attachments')
      .select('id, user_id, yacht_id, attachment_status')
      .eq('id', attachment_id)
      .single()

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }
    if (attachment.attachment_status !== 'pending_confirmation') {
      return NextResponse.json({ error: 'This attachment is not pending confirmation' }, { status: 400 })
    }
    if (attachment.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot confirm your own attachment' }, { status: 403 })
    }

    // Verify eligibility via RPC
    const { data: confirmers } = await supabase.rpc('get_eligible_confirmers', {
      p_attachment_id: attachment_id,
    })
    const isEligible = (confirmers ?? []).some(
      (c: { user_id: string }) => c.user_id === user.id
    )
    if (!isEligible) {
      return NextResponse.json(
        { error: 'You are not eligible to confirm this attachment' },
        { status: 403 }
      )
    }

    // Insert confirmation decision
    const { data: confirmation, error: insertError } = await supabase
      .from('attachment_confirmations')
      .insert({
        attachment_id,
        confirmer_id: user.id,
        decision,
        comment: comment ?? null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted a decision for this attachment' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to submit confirmation' }, { status: 500 })
    }

    // Process resolution immediately after each decision
    const adminClient = createServiceClient()

    if (decision === 'confirm') {
      // 1 confirm is sufficient in Phase 1C — approve immediately
      await adminClient
        .from('attachments')
        .update({ attachment_status: 'confirmed' })
        .eq('id', attachment_id)

      // Check yacht establishment (the new confirmed attachment may push the yacht over threshold)
      await supabase.rpc('check_yacht_establishment', { p_yacht_id: attachment.yacht_id })

      trackServerEvent(attachment.user_id, 'attachment_confirmed', {
        yacht_id: attachment.yacht_id,
        confirmed_by: user.id,
      })
    } else if (decision === 'reject') {
      // Record rejection for penalty tracking (use service role — no direct user insert policy)
      await adminClient
        .from('attachment_rejections')
        .insert({
          user_id: attachment.user_id,
          attachment_id,
        })

      // Check if majority reject (need to wait for 7-day window in cron,
      // but track the rejection event immediately)
      trackServerEvent(attachment.user_id, 'attachment_rejection_received', {
        yacht_id: attachment.yacht_id,
        rejected_by: user.id,
      })

      // Check penalty thresholds
      const { data: penaltyResult } = await supabase.rpc('check_rejection_penalties', {
        p_user_id: attachment.user_id,
      })

      if (penaltyResult?.penalty_applied !== 'none') {
        trackServerEvent(attachment.user_id, 'attachment_rejection_penalty_applied', {
          penalty_type: penaltyResult.penalty_applied,
          rejections_30d: penaltyResult.rejections_30d,
          rejections_60d: penaltyResult.rejections_60d,
        })
      }
    }

    trackServerEvent(user.id, 'attachment_confirmation_submitted', {
      attachment_id,
      decision,
      yacht_id: attachment.yacht_id,
    })

    return NextResponse.json({ confirmation }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 2.2 — POST /api/yacht-search/semantic — Semantic Yacht Search

**File to create:** `app/api/yacht-search/semantic/route.ts`

This route generates an embedding for the user's query, then calls the `search_yachts_semantic` RPC.

```typescript
// POST /api/yacht-search/semantic
// Body: { query: string, limit?: number }
// Response: { results: YachtSearchResult[], source: 'semantic' | 'trigram' }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'
import { generateEmbedding } from '@/lib/ai/embeddings'

export const runtime = 'nodejs'

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(20).optional().default(10),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'search', user.id)
    if (limited) return limited

    const result = await validateBody(req, searchSchema)
    if ('error' in result) return result.error
    const { query, limit } = result.data

    // Generate embedding for the search query
    const embedding = await generateEmbedding(query)

    let results: any[] = []
    let source: 'semantic' | 'trigram' = 'semantic'

    if (embedding) {
      // Semantic search
      const { data: semanticResults } = await supabase.rpc('search_yachts_semantic', {
        p_query_embedding: embedding,
        p_limit: limit,
        p_threshold: 0.7,
      })
      results = semanticResults ?? []

      trackServerEvent(user.id, 'yacht_search_semantic', {
        query,
        result_count: results.length,
        top_similarity_score: results[0]?.similarity ?? 0,
      })
    }

    // Fallback to trigram search if semantic returns no results
    if (results.length === 0) {
      const { data: trigramResults } = await supabase.rpc('search_yachts', {
        p_query: query,
        p_limit: limit,
      })
      results = trigramResults ?? []
      source = 'trigram'

      trackServerEvent(user.id, 'yacht_search_fallback_trigram', {
        query,
        result_count: results.length,
      })
    }

    return NextResponse.json({ results, source })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 2.3 — POST /api/attachments — Create Attachment (Modified)

**File to modify:** `app/(protected)/app/attachment/new/page.tsx`

The existing attachment creation page directly inserts into `attachments` via the Supabase client. Sprint 17 modifies this flow to:
1. Check if the yacht is established
2. If established, set `attachment_status = 'pending_confirmation'`
3. Trigger confirmation request notifications

Rather than creating a separate API route for attachment creation (the current flow uses direct Supabase insert from the client component), create a new API route that handles the establishment check and notification logic:

**File to create:** `app/api/attachments/route.ts`

```typescript
// POST /api/attachments
// Body: { yacht_id: string, role_label: string, started_at: string, ended_at?: string }
// Response: { attachment: {...}, status: 'active' | 'pending_confirmation', confirmers_notified?: number }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { sendNotifyEmail } from '@/lib/email/notify'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'
import { generateEmbedding } from '@/lib/ai/embeddings'

export const runtime = 'nodejs'

const createAttachmentSchema = z.object({
  yacht_id: z.string().uuid(),
  role_label: z.string().min(1).max(100),
  started_at: z.string(), // ISO date
  ended_at: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'profileEdit', user.id)
    if (limited) return limited

    const result = await validateBody(req, createAttachmentSchema)
    if ('error' in result) return result.error
    const { yacht_id, role_label, started_at, ended_at } = result.data

    // Check if user is frozen
    const { data: userData } = await supabase
      .from('users')
      .select('attachment_frozen')
      .eq('id', user.id)
      .single()

    if (userData?.attachment_frozen) {
      return NextResponse.json(
        { error: 'Your ability to create attachments has been temporarily suspended. Please contact support.' },
        { status: 403 }
      )
    }

    // Check yacht establishment
    const { data: yachtData } = await supabase
      .from('yachts')
      .select('id, name, is_established')
      .eq('id', yacht_id)
      .single()

    if (!yachtData) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 })
    }

    const attachmentStatus = yachtData.is_established ? 'pending_confirmation' : 'active'

    // Insert attachment with appropriate status
    const { data: attachment, error: insertError } = await supabase
      .from('attachments')
      .insert({
        user_id: user.id,
        yacht_id,
        role_label,
        started_at,
        ended_at: ended_at ?? null,
        attachment_status: attachmentStatus,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create attachment' }, { status: 500 })
    }

    // If the yacht is NOT established, check if this new attachment
    // pushes it over the establishment threshold
    if (!yachtData.is_established) {
      const { data: establishResult } = await supabase.rpc('check_yacht_establishment', {
        p_yacht_id: yacht_id,
      })

      if (establishResult?.is_established && !establishResult?.was_already_established) {
        trackServerEvent(user.id, 'yacht_established', {
          yacht_id,
          crew_count: establishResult.crew_count,
          age_days: establishResult.age_days,
        })
      }
    }

    let confirmersNotified = 0

    // If pending confirmation, notify eligible confirmers
    if (attachmentStatus === 'pending_confirmation') {
      const { data: confirmers } = await supabase.rpc('get_eligible_confirmers', {
        p_attachment_id: attachment.id,
      })

      trackServerEvent(user.id, 'attachment_confirmation_requested', {
        yacht_id,
        eligible_confirmer_count: confirmers?.length ?? 0,
      })

      // Send notification emails (non-fatal)
      const { data: requester } = await supabase
        .from('users')
        .select('display_name, full_name, profile_photo_url, primary_role')
        .eq('id', user.id)
        .single()

      const requesterName = requester?.display_name ?? requester?.full_name ?? 'A crew member'
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'

      for (const confirmer of (confirmers ?? [])) {
        try {
          await sendNotifyEmail({
            to: confirmer.email,
            subject: `Confirm ${requesterName}'s attachment to ${yachtData.name}`,
            html: buildConfirmationRequestHtml(
              requesterName,
              yachtData.name,
              role_label,
              started_at,
              ended_at ?? null,
              `${APP_URL}/app/confirmations/${attachment.id}`
            ),
            text: `${requesterName} claims to have worked on ${yachtData.name} as ${role_label}. Please confirm or reject: ${APP_URL}/app/confirmations/${attachment.id}`,
          })
          confirmersNotified++
        } catch (e) {
          console.error('Confirmation notification email failed:', e)
        }
      }
    }

    return NextResponse.json({
      attachment,
      status: attachmentStatus,
      confirmers_notified: confirmersNotified,
    }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

function buildConfirmationRequestHtml(
  requesterName: string,
  yachtName: string,
  role: string,
  startDate: string,
  endDate: string | null,
  confirmUrl: string,
) {
  const period = endDate
    ? `${new Date(startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – ${new Date(endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
    : `${new Date(startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – Present`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">YachtieLink</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            Confirm crew attachment
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            <strong>${requesterName}</strong> claims to have worked on <strong>${yachtName}</strong> as <strong>${role}</strong> (${period}).
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Do you recognise this person? Your confirmation helps maintain the integrity of the yacht graph.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Review &amp; Confirm →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
            If you don't respond within 7 days, the attachment will be auto-approved.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because you are an established crew member on ${yachtName}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
```

### API Route Summary

| Method | Path | Auth | Rate Limit | Request Body | Response |
|--------|------|------|------------|-------------|----------|
| `POST` | `/api/attachments` | Required | `profileEdit` (30/min) | `{ yacht_id, role_label, started_at, ended_at? }` | `{ attachment, status, confirmers_notified? }` |
| `POST` | `/api/attachments/confirm` | Required | `endorsementEdit` (20/hr) | `{ attachment_id, decision, comment? }` | `{ confirmation }` |
| `POST` | `/api/yacht-search/semantic` | Required | `search` (60/min) | `{ query, limit? }` | `{ results, source }` |

---

## Part 3: AI / Embedding Infrastructure

### 3.1 — Embedding Generation Utility

**File to create:** `lib/ai/embeddings.ts`

```typescript
import OpenAI from 'openai'

// Embedding model and dimensions — used by Sprint 17 (yacht autocomplete)
// and future Sprint 20 (NLP crew search). Centralised as constants.
export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

let openai: OpenAI | null = null

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openai
}

/**
 * Generate a single embedding vector for text.
 * Returns null on failure (caller should fall back to alternative search).
 * Cost: ~$0.02 per 1M tokens (text-embedding-3-small).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getOpenAI()
  if (!client) return null

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    })

    return response.data[0]?.embedding ?? null
  } catch (err) {
    console.error('Embedding generation failed:', err)
    return null
  }
}

/**
 * Generate embeddings for multiple texts in a single batch call.
 * Returns array of { text, embedding } pairs.
 * Texts that fail to embed are returned with null embedding.
 * Max batch size: 2048 (OpenAI limit).
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<Array<{ text: string; embedding: number[] | null }>> {
  const client = getOpenAI()
  if (!client) return texts.map((t) => ({ text: t, embedding: null }))

  try {
    // OpenAI allows up to 2048 inputs in a single call
    const BATCH_SIZE = 2048
    const results: Array<{ text: string; embedding: number[] | null }> = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      })

      for (let j = 0; j < batch.length; j++) {
        results.push({
          text: batch[j],
          embedding: response.data[j]?.embedding ?? null,
        })
      }
    }

    return results
  } catch (err) {
    console.error('Batch embedding generation failed:', err)
    return texts.map((t) => ({ text: t, embedding: null }))
  }
}

/**
 * Compose metadata text for a yacht embedding.
 * Format: "[name] [yacht_type] [length]m [flag_state]"
 * Example: "Lady M Motor Yacht 62m Cayman Islands"
 */
export function composeYachtMetadataText(yacht: {
  name: string
  yacht_type?: string | null
  length_meters?: number | null
  flag_state?: string | null
}): string {
  const parts = [
    yacht.name,
    yacht.yacht_type,
    yacht.length_meters ? `${yacht.length_meters}m` : null,
    yacht.flag_state,
  ]
  return parts.filter(Boolean).join(' ')
}
```

### 3.2 — Yacht Embedding Service

**File to create:** `lib/ai/yacht-embeddings.ts`

```typescript
import { createServiceClient } from '@/lib/supabase/admin'
import { generateEmbedding, generateEmbeddingsBatch, composeYachtMetadataText } from './embeddings'

/**
 * Generate and store embedding for a single yacht.
 * Called on yacht creation (from YachtPicker.doCreate flow).
 */
export async function embedSingleYacht(yacht: {
  id: string
  name: string
  yacht_type?: string | null
  length_meters?: number | null
  flag_state?: string | null
}): Promise<boolean> {
  const metadataText = composeYachtMetadataText(yacht)
  const embedding = await generateEmbedding(metadataText)

  if (!embedding) return false

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('yacht_embeddings')
    .upsert({
      yacht_id: yacht.id,
      embedding: embedding,
      metadata_text: metadataText,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Failed to store yacht embedding:', error)
    return false
  }

  return true
}

/**
 * Re-index all yacht embeddings in batch.
 * Called by nightly cron job.
 * Uses OpenAI batch embedding API for cost efficiency (standard API, not Batch API files).
 * For <10K yachts, direct batch calls are more practical than the async Batch API.
 */
export async function reindexAllYachtEmbeddings(): Promise<{
  total: number
  embedded: number
  failed: number
}> {
  const supabase = createServiceClient()

  // Fetch all yachts
  const { data: yachts, error } = await supabase
    .from('yachts')
    .select('id, name, yacht_type, length_meters, flag_state')
    .order('created_at', { ascending: true })

  if (error || !yachts) {
    console.error('Failed to fetch yachts for re-indexing:', error)
    return { total: 0, embedded: 0, failed: 0 }
  }

  const total = yachts.length
  let embedded = 0
  let failed = 0

  // Compose metadata texts
  const metadataTexts = yachts.map((y) => composeYachtMetadataText(y))

  // Generate embeddings in batch
  const results = await generateEmbeddingsBatch(metadataTexts)

  // Upsert into yacht_embeddings (batch in groups of 500 to avoid payload limits)
  const UPSERT_BATCH = 500
  for (let i = 0; i < results.length; i += UPSERT_BATCH) {
    const batch = results.slice(i, i + UPSERT_BATCH)
    const upsertData = batch
      .map((r, j) => {
        const yachtIndex = i + j
        if (!r.embedding) {
          failed++
          return null
        }
        embedded++
        return {
          yacht_id: yachts[yachtIndex].id,
          embedding: r.embedding,
          metadata_text: r.text,
          updated_at: new Date().toISOString(),
        }
      })
      .filter(Boolean)

    if (upsertData.length > 0) {
      const { error: upsertError } = await supabase
        .from('yacht_embeddings')
        .upsert(upsertData as any[])

      if (upsertError) {
        console.error('Batch upsert failed:', upsertError)
        failed += upsertData.length
        embedded -= upsertData.length
      }
    }
  }

  return { total, embedded, failed }
}
```

---

## Part 4: Cron Jobs

### 4.1 — Confirmation Resolution Cron

**File to create:** `app/api/cron/confirmation-resolution/route.ts`

Runs daily. Checks pending confirmations older than 7 days and resolves them:
- Auto-approve if no responses
- Reject if majority of respondents rejected

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { sendNotifyEmail } from '@/lib/email/notify'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization')
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Find pending attachments older than 7 days
    const { data: pendingAttachments } = await supabase
      .from('attachments')
      .select('id, user_id, yacht_id, created_at')
      .eq('attachment_status', 'pending_confirmation')
      .lte('created_at', sevenDaysAgo.toISOString())

    if (!pendingAttachments?.length) {
      return NextResponse.json({ resolved: 0, auto_approved: 0, rejected: 0 })
    }

    let autoApproved = 0
    let rejected = 0
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'

    for (const attachment of pendingAttachments) {
      // Fetch all decisions for this attachment
      const { data: decisions } = await supabase
        .from('attachment_confirmations')
        .select('decision')
        .eq('attachment_id', attachment.id)

      const confirms = (decisions ?? []).filter(d => d.decision === 'confirm').length
      const rejects = (decisions ?? []).filter(d => d.decision === 'reject').length
      const totalResponses = confirms + rejects

      if (totalResponses === 0) {
        // No responses after 7 days → auto-approve (prevent griefing via inaction)
        await supabase
          .from('attachments')
          .update({ attachment_status: 'confirmed' })
          .eq('id', attachment.id)

        autoApproved++

        trackServerEvent(attachment.user_id, 'attachment_auto_approved', {
          yacht_id: attachment.yacht_id,
          days_pending: 7,
        })

        // Check yacht establishment
        await supabase.rpc('check_yacht_establishment', {
          p_yacht_id: attachment.yacht_id,
        })

      } else if (rejects > confirms && totalResponses >= 2) {
        // Majority reject with minimum 2 respondents → reject
        await supabase
          .from('attachments')
          .update({ attachment_status: 'rejected' })
          .eq('id', attachment.id)

        rejected++

        // Record rejections for penalty tracking
        await supabase
          .from('attachment_rejections')
          .insert({
            user_id: attachment.user_id,
            attachment_id: attachment.id,
          })

        // Check penalties
        await supabase.rpc('check_rejection_penalties', {
          p_user_id: attachment.user_id,
        })

        trackServerEvent(attachment.user_id, 'attachment_rejected', {
          yacht_id: attachment.yacht_id,
          confirms,
          rejects,
        })

        // Notify requester of rejection
        try {
          const { data: requester } = await supabase
            .from('users')
            .select('email, display_name, full_name')
            .eq('id', attachment.user_id)
            .single()

          const { data: yacht } = await supabase
            .from('yachts')
            .select('name')
            .eq('id', attachment.yacht_id)
            .single()

          if (requester?.email) {
            const name = requester.display_name ?? requester.full_name ?? 'there'
            await sendNotifyEmail({
              to: requester.email,
              subject: `Attachment to ${yacht?.name ?? 'yacht'} was not confirmed`,
              html: buildRejectionEmailHtml(name, yacht?.name ?? 'the yacht', APP_URL),
              text: `Hi ${name}, your attachment to ${yacht?.name ?? 'the yacht'} was not confirmed by existing crew. If you believe this is an error, please contact support at hello@yachtie.link.`,
            })
          }
        } catch (e) {
          console.error('Rejection notification email failed:', e)
        }

      } else if (confirms > 0) {
        // Has at least 1 confirm and confirms >= rejects → approve
        await supabase
          .from('attachments')
          .update({ attachment_status: 'confirmed' })
          .eq('id', attachment.id)

        autoApproved++ // Counted with auto-approved for simplicity

        trackServerEvent(attachment.user_id, 'attachment_confirmed', {
          yacht_id: attachment.yacht_id,
          confirms,
          rejects,
          resolved_by: 'cron_majority',
        })

        await supabase.rpc('check_yacht_establishment', {
          p_yacht_id: attachment.yacht_id,
        })
      }
      // else: has responses but not enough to decide → leave pending for now
      // This handles the edge case of 1 reject with 0 confirms (need minimum 2 respondents for rejection)
    }

    return NextResponse.json({
      resolved: autoApproved + rejected,
      auto_approved: autoApproved,
      rejected,
    })
  } catch (e) {
    return handleApiError(e)
  }
}

function buildRejectionEmailHtml(name: string, yachtName: string, appUrl: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">YachtieLink</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            Attachment not confirmed
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${name}, your attachment to <strong>${yachtName}</strong> was not confirmed by existing crew members.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            This can happen if the crew on board don't recognise you from their time on the yacht. If you believe this is an error, please contact us at <a href="mailto:hello@yachtie.link" style="color:#0a1628;">hello@yachtie.link</a>.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${appUrl}/app/profile" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                View your profile →
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because you created an attachment on YachtieLink.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
```

### 4.2 — Yacht Embedding Re-Index Cron

**File to create:** `app/api/cron/yacht-embeddings/route.ts`

Runs nightly. Regenerates all yacht embeddings to catch metadata updates and yachts missed by the on-creation hook.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api/errors'
import { reindexAllYachtEmbeddings } from '@/lib/ai/yacht-embeddings'

export const runtime = 'nodejs'

// Generous timeout for batch embedding — 10K yachts should take ~30s
export const maxDuration = 120

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization')
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await reindexAllYachtEmbeddings()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return handleApiError(e)
  }
}
```

### 4.3 — vercel.json Cron Schedule Update

**File to modify:** `vercel.json`

Add two new cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/cert-expiry",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/analytics-nudge",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/cron/confirmation-resolution",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/yacht-embeddings",
      "schedule": "0 3 * * *"
    }
  ]
}
```

- **Confirmation resolution:** Daily at 08:00 UTC (before business hours). Checks 7-day-old pending confirmations.
- **Yacht embeddings:** Daily at 03:00 UTC (low-traffic window). Re-indexes all yacht embeddings.

---

## Part 5: Components

### 5.1 — Confirmation Page

**File to create:** `app/(protected)/app/confirmations/[attachment_id]/page.tsx`

Server component that loads the pending attachment details and renders a confirmation form.

```
┌─────────────────────────────────────────────────┐
│ ← Back                                          │
│                                                 │
│ Confirm crew attachment                         │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [photo]  Requester Name                     │ │
│ │          Role Label                         │ │
│ │          Claimed: Jan 2024 – Dec 2024       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ On yacht:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Yacht Name                                  │ │
│ │ Motor Yacht · 62m · Cayman Islands          │ │
│ │ Your tenure: Mar 2023 – Present             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Do you recognise this person from               │
│ your time on [yacht name]?                      │
│                                                 │
│ [✓ Yes, I confirm]     (green/primary)          │
│ [✗ I don't recognise]  (red/destructive)        │
│                                                 │
│ ┌ Optional: rejection reason ─────────────────┐ │
│ │ [text area, shown only after reject tap]    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Already decided? "You've already submitted      │
│ your response for this attachment."             │
│                                                 │
│ Not eligible? "You're not eligible to confirm   │
│ this attachment."                               │
└─────────────────────────────────────────────────┘
```

**Implementation details:**

```typescript
// Server component — fetches attachment, requester, yacht, viewer eligibility
// Client component child — handles confirm/reject actions with API call

interface PageProps {
  params: Promise<{ attachment_id: string }>
}

export default async function ConfirmationPage({ params }: PageProps) {
  const { attachment_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  // Fetch attachment + requester + yacht in parallel
  const [attachmentRes, confirmersRes] = await Promise.all([
    supabase
      .from('attachments')
      .select(`
        id, user_id, yacht_id, role_label, started_at, ended_at, attachment_status,
        users!inner(id, display_name, full_name, profile_photo_url, primary_role),
        yachts!inner(id, name, yacht_type, length_meters, flag_state)
      `)
      .eq('id', attachment_id)
      .single(),
    supabase.rpc('get_eligible_confirmers', { p_attachment_id: attachment_id }),
  ])

  // ... render with state checks (already decided, not eligible, etc.)
}
```

**Client component:** `components/confirmation/ConfirmationActions.tsx`

```typescript
'use client'

interface Props {
  attachmentId: string
  onComplete: (decision: 'confirm' | 'reject') => void
}

// Two-button UI: Confirm (primary), Reject (destructive)
// Reject reveals optional comment field
// Calls POST /api/attachments/confirm
// Shows loading state during API call
// Shows success/error toast
// Redirects to /app/network on success
```

**Key behaviors:**
- If attachment is not `pending_confirmation`, show "This attachment has already been resolved"
- If viewer has already submitted a decision, show their decision with "You've already responded"
- If viewer is not in the eligible confirmers list, show "You're not eligible to confirm this attachment"
- After successful confirm: show success toast, redirect to `/app/network`
- After successful reject: show confirmation toast, redirect to `/app/network`
- Mobile: full-width buttons stacked vertically
- Desktop (md+): buttons side by side

### 5.2 — YachtPicker Upgrade

**File to modify:** `components/yacht/YachtPicker.tsx`

Replace the trigram-first search with semantic-first:

**Changes:**
1. Search flow becomes: type -> debounce 300ms -> POST `/api/yacht-search/semantic` -> display results
2. If semantic returns empty or API fails, fall back to existing `search_yachts()` RPC (trigram)
3. Each search result shows crew count and established badge
4. Near-miss duplicate check on create also uses semantic search (similarity > 0.85 triggers enhanced warning)

```typescript
// Updated search function
async function searchYachts(q: string) {
  if (!q.trim()) { setResults([]); setSearching(false); return }
  setSearching(true)

  try {
    // Try semantic search first
    const res = await fetch('/api/yacht-search/semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, limit: 8 }),
    })

    if (res.ok) {
      const { results, source } = await res.json()
      if (results.length > 0) {
        setResults(results)
        setSearching(false)
        return
      }
    }
  } catch {
    // Fall through to trigram
  }

  // Trigram fallback
  const { data } = await supabase.rpc('search_yachts', { p_query: q, p_limit: 8 })
  setResults((data as YachtOption[]) ?? [])
  setSearching(false)
}
```

**Updated YachtOption interface:**

```typescript
export interface YachtOption {
  id: string
  name: string
  yacht_type: string | null
  length_meters: number | null
  flag_state: string | null
  is_established?: boolean
  crew_count?: number
  similarity?: number
}
```

**Result card upgrade — show crew count and established badge:**

```typescript
{results.map((r) => (
  <button key={r.id} onClick={() => onSelect(r)} className="...">
    <div className="flex items-center justify-between">
      <p className="font-medium text-sm text-[var(--color-text-primary)]">{r.name}</p>
      {r.is_established && (
        <span className="text-[10px] bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] px-1.5 py-0.5 rounded-full font-medium">
          Established
        </span>
      )}
    </div>
    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
      {yachtMeta(r)}
      {r.crew_count != null && ` · ${r.crew_count} crew`}
    </p>
  </button>
))}
```

**Enhanced duplicate warning:**

When the user creates a new yacht and the top semantic result has similarity > 0.85, show an enhanced comparison in the BottomSheet:

```typescript
// In handleCreate, replace trigram dupe check with semantic:
const res = await fetch('/api/yacht-search/semantic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: newName.trim(), limit: 3 }),
})

if (res.ok) {
  const { results } = await res.json()
  const highSimilarity = results.filter((r: any) => r.similarity >= 0.85)
  if (highSimilarity.length > 0) {
    setDupeCandidates(highSimilarity)
    setDupeSheetOpen(true)
    trackEvent('yacht_duplicate_warning_shown', {
      search_term: newName.trim(),
      top_similarity: highSimilarity[0].similarity,
      candidate_count: highSimilarity.length,
    })
    return
  }
}
```

Log `yacht_duplicate_warning_overridden` when user proceeds to create despite warning.

**On yacht creation — embed the new yacht:**

After successfully creating a yacht in `doCreate()`, trigger embedding generation:

```typescript
async function doCreate() {
  // ... existing create logic ...

  // Embed the new yacht (non-blocking, fire-and-forget)
  fetch('/api/yacht-embeddings/single', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      yacht_id: yacht.id,
      name: yacht.name,
      yacht_type: yacht.yacht_type,
      length_meters: yacht.length_meters,
      flag_state: yacht.flag_state,
    }),
  }).catch(() => {}) // Non-fatal

  onSelect(yacht as YachtOption)
}
```

### 5.3 — Single Yacht Embedding API Route

**File to create:** `app/api/yacht-embeddings/single/route.ts`

Called on yacht creation to embed the new yacht immediately.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { embedSingleYacht } from '@/lib/ai/yacht-embeddings'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const schema = z.object({
  yacht_id: z.string().uuid(),
  name: z.string(),
  yacht_type: z.string().nullable().optional(),
  length_meters: z.number().nullable().optional(),
  flag_state: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, schema)
    if ('error' in result) return result.error

    const success = await embedSingleYacht(result.data as any)

    return NextResponse.json({ success })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 5.4 — Attachment New Page Modification

**File to modify:** `app/(protected)/app/attachment/new/page.tsx`

Change the `handleSave` function to call the new `POST /api/attachments` route instead of direct Supabase insert. This is necessary to trigger establishment checks, confirmation flow, and email notifications.

```typescript
async function handleSave() {
  if (!yacht || !roleLabel || !startDate) return
  setSaving(true)

  try {
    const res = await fetch('/api/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        yacht_id: yacht.id,
        role_label: roleLabel,
        started_at: startDate,
        ended_at: isCurrent ? null : endDate || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast(data.error ?? 'Failed to save attachment. Please try again.', 'error')
      setSaving(false)
      return
    }

    if (data.status === 'pending_confirmation') {
      toast(
        `Yacht added — pending confirmation from existing crew. ${data.confirmers_notified} crew member${data.confirmers_notified === 1 ? '' : 's'} notified.`,
        'info'
      )
    } else {
      toast('Yacht added to your profile.', 'success')
    }

    router.push('/app/profile')
  } catch {
    toast('Failed to save attachment. Please try again.', 'error')
  } finally {
    setSaving(false)
  }
}
```

### 5.5 — Establishment Badge Component

**File to create:** `components/yacht/EstablishedBadge.tsx`

Reusable badge component for yacht detail pages, search results, and YachtPicker.

```typescript
interface Props {
  size?: 'sm' | 'md'
  className?: string
}

export function EstablishedBadge({ size = 'sm', className = '' }: Props) {
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5'

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full font-medium bg-[var(--color-interactive)]/10 text-[var(--color-interactive)] ${className}`}
    >
      Established
    </span>
  )
}
```

The yacht detail page (`app/(protected)/app/yacht/[id]/page.tsx`) already renders an "Established" badge inline. Replace the inline JSX with this component for consistency.

### 5.6 — Pending Attachment Display on Profile

**File to modify:** Profile page employment history section (wherever attachments are listed)

When rendering attachments, check `attachment_status` and display status indicators:

- `active` / `confirmed`: normal display (no indicator)
- `pending_confirmation`: show "Pending confirmation" label in amber
- `rejected`: show "Not confirmed" label in red, with reduced opacity

```typescript
{attachment.attachment_status === 'pending_confirmation' && (
  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
    Pending confirmation
  </span>
)}
{attachment.attachment_status === 'rejected' && (
  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
    Not confirmed
  </span>
)}
```

### 5.7 — Pending Endorsement Handling

When someone tries to endorse a user based on a yacht where the endorsee has a `pending_confirmation` attachment, the endorsement should still be allowed but display a note:

**File to modify:** Endorsement form / endorsement display logic

- At endorsement creation time: check if the relevant attachment is `pending_confirmation`. If so, store the endorsement normally but track it.
- On the endorsement display: if the underlying attachment is `pending_confirmation`, show "This endorsement will be fully active once the crew attachment is confirmed."
- On attachment confirmation: no special action needed — the endorsement is already stored. The display note simply disappears when the attachment status changes.
- On attachment rejection: the endorsement remains but the yacht context is weakened. For Phase 1C, no automatic voiding — just display the rejection status on the attachment. Full voiding logic is Phase 4 scope.

---

## Part 6: PostHog Event Specifications

| Event | Properties | When |
|-------|-----------|------|
| `yacht_established` | `{ yacht_id, crew_count, age_days }` | Yacht transitions from fresh to established |
| `attachment_confirmation_requested` | `{ yacht_id, requester_id, eligible_confirmer_count }` | User creates attachment to established yacht |
| `attachment_confirmed` | `{ yacht_id, confirmed_by }` | Confirmer approves attachment |
| `attachment_rejected` | `{ yacht_id, confirms, rejects }` | Cron resolves attachment as rejected |
| `attachment_auto_approved` | `{ yacht_id, days_pending }` | Cron auto-approves after 7 days of no response |
| `attachment_rejection_received` | `{ yacht_id, rejected_by }` | Individual reject decision submitted |
| `attachment_rejection_penalty_applied` | `{ user_id, penalty_type, rejections_30d, rejections_60d }` | Penalty threshold met |
| `attachment_confirmation_submitted` | `{ attachment_id, decision, yacht_id }` | Any confirmation decision submitted |
| `yacht_search_semantic` | `{ query, result_count, top_similarity_score }` | Semantic search returns results |
| `yacht_search_fallback_trigram` | `{ query, result_count }` | Semantic search returned nothing, fell back to trigram |
| `yacht_duplicate_warning_shown` | `{ search_term, top_similarity, candidate_count }` | Near-match warning shown during yacht creation |
| `yacht_duplicate_warning_overridden` | `{ search_term, top_similarity }` | User created new yacht despite near-match warning |

---

## Part 7: File-by-File Implementation Order

Build in this order. Each group depends on the previous group.

### Group 1: Database + Core Infrastructure (no UI dependencies)

| # | File | Type | Notes |
|---|------|------|-------|
| 1 | `supabase/migrations/YYYYMMDD000001_sprint17_confirmation_embeddings.sql` | Create | Full migration: extension, tables, columns, RPCs, indexes, RLS, GRANTs |
| 2 | `lib/ai/embeddings.ts` | Create | Embedding generation utility (model, dimensions, single + batch) |
| 3 | `lib/ai/yacht-embeddings.ts` | Create | Yacht-specific embedding service (single + reindex) |

### Group 2: API Routes (depends on Group 1)

| # | File | Type | Notes |
|---|------|------|-------|
| 4 | `app/api/attachments/route.ts` | Create | Create attachment with establishment check + confirmation flow |
| 5 | `app/api/attachments/confirm/route.ts` | Create | Submit confirmation decision |
| 6 | `app/api/yacht-search/semantic/route.ts` | Create | Semantic yacht search (embedding + RPC) |
| 7 | `app/api/yacht-embeddings/single/route.ts` | Create | Single yacht embedding on creation |

### Group 3: Cron Jobs (depends on Group 1)

| # | File | Type | Notes |
|---|------|------|-------|
| 8 | `app/api/cron/confirmation-resolution/route.ts` | Create | Daily resolution of pending confirmations |
| 9 | `app/api/cron/yacht-embeddings/route.ts` | Create | Nightly embedding re-index |
| 10 | `vercel.json` | Modify | Add two new cron schedules |

### Group 4: Components (depends on Groups 2-3)

| # | File | Type | Notes |
|---|------|------|-------|
| 11 | `components/yacht/EstablishedBadge.tsx` | Create | Reusable established badge |
| 12 | `components/confirmation/ConfirmationActions.tsx` | Create | Client component for confirm/reject buttons |
| 13 | `app/(protected)/app/confirmations/[attachment_id]/page.tsx` | Create | Confirmation review page |

### Group 5: Modifications (depends on Group 4)

| # | File | Type | Notes |
|---|------|------|-------|
| 14 | `components/yacht/YachtPicker.tsx` | Modify | Semantic-first search, crew count, established badge, enhanced dupe warning |
| 15 | `app/(protected)/app/attachment/new/page.tsx` | Modify | Call new API route instead of direct Supabase insert |
| 16 | `app/(protected)/app/yacht/[id]/page.tsx` | Modify | Use EstablishedBadge component (replace inline JSX) |
| 17 | Profile attachment list (wherever attachments render) | Modify | Show pending/rejected status indicators |

### Group 6: Finalization

| # | File | Type | Notes |
|---|------|------|-------|
| 18 | `lib/rate-limit/helpers.ts` | Modify | Add `attachmentConfirm` rate limit config if needed (can reuse `endorsementEdit`) |
| 19 | `CHANGELOG.md` | Modify | Log Sprint 17 work |
| 20 | `docs/modules/employment.md` | Modify | Update with confirmation flow |
| 21 | `docs/modules/employment.activity.md` | Modify | Append activity entry |

---

## Part 8: Testing Checklist

### Confirmation Flow State Machine

| Test | Expected |
|------|----------|
| Create attachment to fresh yacht (< 60 days, < threshold crew) | Status = `active`, no confirmation flow |
| Create attachment to established yacht | Status = `pending_confirmation`, emails sent to eligible confirmers |
| Confirm pending attachment (1 confirm) | Status transitions to `confirmed` |
| Reject pending attachment (single reject, < 7 days) | Status stays `pending_confirmation` |
| Reject pending attachment (majority reject, >= 2 respondents, after 7 days via cron) | Status transitions to `rejected`, requester notified |
| No response after 7 days (cron) | Status transitions to `confirmed` (auto-approve) |
| User tries to confirm own attachment | 403 error |
| Non-eligible user tries to confirm | 403 error |
| User submits duplicate decision | 409 error |
| Frozen user tries to create attachment | 403 error |
| 3 rejections in 30 days | `shadow_constrained` flag set |
| 5 rejections in 60 days | `attachment_frozen` flag set, escalation logged in `internal.flags` |

### Yacht Establishment

| Test | Expected |
|------|----------|
| Yacht with 2 crew, < 60 days old | `is_established = false` |
| Yacht with 3 crew, 60+ days old, length < 30m | `is_established = true` |
| Yacht with 4 crew, 60+ days old, length 40m | `is_established = false` (need 5) |
| Yacht with no length, 3 crew, 60+ days old | `is_established = true` (default threshold 3) |
| Already established yacht loses crew | `is_established` stays `true` (one-way) |
| New attachment pushes yacht over threshold | `check_yacht_establishment` transitions yacht |

### Semantic Search

| Test | Expected |
|------|----------|
| Search "Lady M" (exact match exists) | Returns Lady M with high similarity (>0.9) |
| Search "MY Lady S" (variation of "Motor Yacht Lady S") | Returns Motor Yacht Lady S |
| Search "Lday M" (misspelling) | Returns Lady M via semantic matching |
| Search "the 62m Benetti" (descriptive) | Returns matching yachts by length and builder context |
| Search "xyznotaboat" (no match) | Falls back to trigram, returns no results |
| Embedding API failure | Falls back to trigram search transparently |
| Search latency | < 500ms end-to-end (embedding generation + vector query) |

### YachtPicker Upgrade

| Test | Expected |
|------|----------|
| Type yacht name -> results appear | Semantic results with crew count and established badge |
| No semantic results | Falls back to trigram results |
| Create yacht with high-similarity match (>0.85) | Enhanced duplicate warning shown |
| Create yacht despite warning | `yacht_duplicate_warning_overridden` event fires |
| New yacht created | Embedding generated for new yacht |
| Works in onboarding flow | YachtPicker behaves identically |
| Works in add-attachment flow (`/app/attachment/new`) | Same semantic search + dupe detection |

### Confirmation Page

| Test | Expected |
|------|----------|
| Eligible confirmer visits `/app/confirmations/[id]` | Shows requester profile, yacht context, confirm/reject buttons |
| Non-eligible user visits | Shows "not eligible" message |
| Already-decided user visits | Shows their previous decision |
| Non-pending attachment visited | Shows "already resolved" message |
| Confirm action | API call, toast, redirect |
| Reject action | Comment field appears, API call, toast, redirect |

### Mobile Responsiveness

| Test | Expected |
|------|----------|
| Confirmation page at 375px | Full-width stacked buttons, no overflow |
| YachtPicker results at 375px | Cards fit without clipping, badges visible |
| Pending attachment label on profile at 375px | Wraps correctly |

---

## Part 9: Known Limitations & Migration Path

### Simplified Trust Check

The `is_trusted_user()` RPC is a pragmatic proxy for full verified status. Known gaps:
- **New legitimate users can't confirm.** A user who just joined (< 90 days) but genuinely worked on the yacht cannot serve as a confirmer. Mitigation: auto-approve after 7 days covers this case.
- **Gaming via slow endorsement farming.** A patient attacker could build 3+ endorsements over 90 days. Mitigation: endorsements require shared yacht attachment (are_coworkers_on_yacht), which requires the yacht to exist first.
- **Migration to full verification (Sprint 26, Phase 4):** Replace `is_trusted_user()` call in `get_eligible_confirmers()` with `is_verified_user()` when the chain-of-trust system ships. The RPC interface stays identical — only the internal check changes.

### pgvector IVFFlat Index

- IVFFlat index with `lists = 100` is optimal for 10K-50K rows. Below ~1K rows, sequential scan may outperform the index. This is fine for early stages.
- If yacht count exceeds 50K, increase `lists` parameter (sqrt of row count is a good heuristic).
- Alternative: HNSW index (`CREATE INDEX ... USING hnsw`) offers better recall at small scales but higher memory usage. IVFFlat is the better default for cost-conscious deployment.

### Pending Endorsements

Phase 1C takes a minimal approach: endorsements on pending attachments are stored normally. The pending status is displayed as a note but doesn't block endorsement creation or void endorsements on rejection. Full endorsement lifecycle management tied to attachment status is Phase 4 scope.

---

## Part 10: Rollback Plan

### If the migration fails:

- The migration is a single file. If it fails partway through, Supabase migrations roll back automatically (transactional DDL).
- If pgvector is not available on the Supabase plan, the entire migration fails at `CREATE EXTENSION`. In this case: remove the pgvector sections (1.1, 1.6, 1.11), ship confirmation flow without semantic search, and use enhanced trigram search as the yacht autocomplete upgrade instead.

### If semantic search has quality issues:

- The trigram fallback is always available. If semantic search returns poor results (low similarity, wrong matches), adjust the threshold in `search_yachts_semantic` (default 0.7).
- If the threshold is too high (misses valid matches), lower to 0.6.
- If the threshold is too low (returns noise), raise to 0.8.
- Monitor `yacht_search_fallback_trigram` events — if > 50% of searches fall back, the threshold or embedding quality needs tuning.

### If the confirmation flow causes friction:

- Auto-approve after 7 days prevents griefing. If legitimate users complain about the 7-day wait, the auto-approve window can be shortened to 3 days.
- If too many false rejections occur, raise the rejection threshold from majority to supermajority (> 2/3).
- If the feature causes significant signup friction, it can be disabled by setting all `pending_confirmation` attachments to `active` via a single SQL update:
  ```sql
  UPDATE attachments SET attachment_status = 'active' WHERE attachment_status = 'pending_confirmation';
  ```

### If embedding costs spike:

- Monitor via `ai_usage_log` table (Sprint 16 infrastructure).
- Nightly re-index for 10K yachts costs ~EUR 0.01. Even at 100K yachts, cost is ~EUR 0.10/night.
- If costs are unexpectedly high, disable the nightly cron and rely on on-creation embedding only.

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S17-01 | Reuse existing `is_established` boolean, not new `yacht_status` text column | Schema already has `is_established` + `established_at` on yachts table. Adding a redundant text enum creates confusion. |
| D-S17-02 | `search_yachts_semantic` accepts pre-computed embedding vector, not raw text | Embedding generation requires OpenAI API call which must happen server-side. Keeping the RPC as pure SQL with no external dependencies is cleaner. |
| D-S17-03 | New `POST /api/attachments` route instead of modifying direct Supabase insert | Attachment creation now involves establishment check, status assignment, and email notifications — too much logic for a client-side insert. |
| D-S17-04 | IVFFlat index over HNSW for yacht embeddings | Lower memory usage, better for cost-conscious deployment. Degrades gracefully on small datasets. |
| D-S17-05 | 1 confirm sufficient in Phase 1C | Keep friction low during early growth. Can increase to 2+ confirms as the platform scales. |
| D-S17-06 | Auto-approve on no response after 7 days | Prevents griefing via inaction. Without this, inactive confirmers could hold attachments hostage indefinitely. |
| D-S17-07 | Simplified trust check instead of full verified status | Full verification chain (D-016) is Sprint 26 scope. The 90-day + 3-endorsement heuristic is a pragmatic proxy. |
| D-S17-08 | Pending endorsements stored normally, not blocked | Blocking endorsements on pending attachments creates cascading friction. Display-only caveat is sufficient for Phase 1C. |
| D-S17-09 | Rejection penalty escalation logs to `internal.flags` | No admin dashboard yet. Founders/admins review escalations via Supabase dashboard. Admin UI is future scope. |
| D-S17-10 | Direct batch embedding API calls instead of OpenAI Batch API files | For < 10K yachts, synchronous batch calls are faster and simpler than the async file-based Batch API. The cost savings (50% off) don't justify the complexity at this scale. |
