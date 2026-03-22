# Sprint 20 — Agency Plans + NLP Search (AI-07): Build Plan

## Context

Sprint 20 closes Phase 2 by adding two high-revenue features: agency accounts (multi-seat recruiter plans with shared credit pools, shortlists, and bulk operations) and NLP crew search (natural language query to semantic vector search with AI-generated match explanations).

Both features build directly on Sprint 19's recruiter infrastructure (accounts, credits, unlocks) and Sprint 17's pgvector infrastructure (embeddings, IVFFlat index). Sprint 16's AI integration layer (`lib/ai/`) is reused for OpenAI embedding and completion calls.

After this sprint, YachtieLink has a working two-sided marketplace: crew-side identity and graph-based hiring, plus demand-side revenue through individual and agency recruiter access with intelligent search.

### What Already Exists (No Build Needed)

| Dependency | Status | Notes |
|-----------|--------|-------|
| `recruiters` table with `email`, `company_name`, `contact_name`, `stripe_customer_id`, `subscription_status`, `subscription_id` | Exists | Sprint 19 |
| `recruiter_credits` table with `recruiter_id`, `credits_purchased`, `credits_remaining`, `price_eur`, `expires_at` | Exists | Sprint 19 |
| `recruiter_unlocks` table with `recruiter_id`, `crew_user_id`, unique constraint | Exists | Sprint 19 |
| `search_crew_recruiter()` RPC with recruiter-specific filters and locked/unlocked shaping | Exists | Sprint 19 |
| `unlock_crew_profile()` RPC with atomic credit deduction + unlock creation | Exists | Sprint 19 |
| `get_recruiter_credit_balance()` RPC | Exists | Sprint 19 |
| `search_crew()` RPC with multi-filter pagination | Exists | Sprint 15 |
| pgvector extension enabled (`CREATE EXTENSION vector`) | Exists | Sprint 17 |
| `yacht_embeddings` table with `embedding vector(1536)`, IVFFlat index | Exists | Sprint 17 |
| `search_yachts_semantic()` RPC pattern | Exists | Sprint 17 |
| Nightly batch re-index cron pattern for yacht embeddings | Exists | Sprint 17 |
| `lib/ai/moderation.ts` with OpenAI client singleton pattern | Exists | Sprint 16 |
| `ai_usage_log` table for cost tracking | Exists | Sprint 16 |
| `lib/stripe/client.ts` — lazy Stripe singleton | Exists | Sprint 7 |
| `lib/stripe/pro.ts` — `getProStatus()` | Exists | Sprint 7 |
| `app/api/stripe/checkout/route.ts` — Stripe Checkout session creation | Exists | Sprint 7 |
| `app/api/stripe/webhook/route.ts` — Stripe webhook handler | Exists | Sprint 7 |
| `app/api/stripe/portal/route.ts` — Stripe Customer Portal | Exists | Sprint 7 |
| `lib/supabase/admin.ts` — `createServiceClient()` service role client | Exists | Sprint 8 |
| `lib/rate-limit/helpers.ts` — `applyRateLimit()` with pre-configured tiers | Exists | Sprint 8 |
| `lib/validation/validate.ts` — `validateBody()` with Zod | Exists | Sprint 5 |
| `lib/api/errors.ts` — `handleApiError()` | Exists | Sprint 5 |
| `lib/analytics/events.ts` — client-side `trackEvent()` | Exists | Sprint 8 |
| `lib/analytics/server.ts` — server-side `trackServerEvent()` | Exists | Sprint 8 |
| `users` table with `recruiter_visible`, `availability_status`, `bio`, `primary_role`, `departments`, `location_country`, `location_city` | Exists | Sprints 2–19 |
| `endorsements` table with `endorser_id`, `recipient_id`, `yacht_id`, `content` (free-text) | Exists | Sprint 5 |
| `certifications` table with `user_id`, `certification_type_id` | Exists | Sprint 3 |
| `attachments` table with `user_id`, `yacht_id`, `started_at`, `ended_at`, `role_label` | Exists | Sprint 2–4 |
| `yachts` table with `id`, `name`, `yacht_type`, `length_metres` | Exists | Sprint 4 |
| PostHog integration (client + server) | Exists | Sprint 8 |
| Vercel cron infrastructure (`vercel.json`, `CRON_SECRET` auth pattern) | Exists | Sprint 8 |

### Codebase Patterns to Follow

- Server components fetch data via `createClient()` from `@/lib/supabase/server` — no API routes for reads
- Independent queries wrapped in `Promise.all()` for performance
- RPCs use `security definer` — all existing RPCs use this pattern
- `GRANT EXECUTE ON FUNCTION ... TO authenticated` on every new RPC
- Client-side analytics: `trackEvent(event, properties)` from `lib/analytics/events.ts`
- Server-side analytics: `trackServerEvent(userId, event, properties)` from `lib/analytics/server.ts`
- Cron auth: check `authorization` header against `Bearer ${process.env.CRON_SECRET}`
- API routes: Zod validation via `validateBody()`, rate limiting via `applyRateLimit()`, error handling via `handleApiError()`
- All colour references use semantic CSS custom properties from `globals.css`
- Mobile-first: 375px base, `md:` breakpoints for tablet/desktop
- Recruiter routes live under `/recruiter/` namespace with separate middleware check (Sprint 19 pattern)
- OpenAI client: lazy singleton via `getOpenAI()` from `lib/ai/moderation.ts` pattern — extend into dedicated `lib/ai/openai-client.ts`

### Key Decisions

- **D-024:** Recruiters get read-only access. They cannot endorse, create attachments, post positions, signal on endorsements, or affect the trust graph.
- **D-025:** Direct profile links show full profile. Search results show locked profiles — name and contact require credits.
- **D-026:** Recruiters can sort by endorsement count — this is ordering, not trust weighting.

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260322000004_sprint20_agency_nlp.sql`

### 1.1 — Agencies Table

```sql
-- Sprint 20: Agency Plans + NLP Search (AI-07)
-- Extends Sprint 19 recruiter infrastructure with multi-seat agencies,
-- shared credit pools, shortlists, and profile embedding for NLP search.

-- ═══════════════════════════════════════════════════════════
-- 1. AGENCIES TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.agencies (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  admin_recruiter_id   uuid NOT NULL REFERENCES public.recruiters (id) ON DELETE RESTRICT,
  stripe_customer_id   text,
  credit_purchase_restricted boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Only one agency per admin recruiter
CREATE UNIQUE INDEX idx_agencies_admin
  ON public.agencies (admin_recruiter_id);

-- Auto-update updated_at
CREATE TRIGGER set_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Agency members can read their own agency
CREATE POLICY "agencies: member read"
  ON public.agencies FOR SELECT
  USING (
    id IN (
      SELECT r.agency_id FROM public.recruiters r
      WHERE r.auth_user_id = auth.uid()
    )
  );

-- Only admin can update agency settings
CREATE POLICY "agencies: admin update"
  ON public.agencies FOR UPDATE
  USING (admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid()));

-- Recruiters can create an agency (they become admin)
CREATE POLICY "agencies: recruiter insert"
  ON public.agencies FOR INSERT
  WITH CHECK (admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid()));
```

### 1.2 — Recruiter Agency Columns

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. AGENCY COLUMNS ON RECRUITERS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.recruiters
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

ALTER TABLE public.recruiters
  ADD COLUMN IF NOT EXISTS agency_role text;

ALTER TABLE public.recruiters
  ADD CONSTRAINT valid_agency_role
  CHECK (agency_role IS NULL OR agency_role IN ('admin', 'member'));

-- Ensure agency_role is set when agency_id is set, and vice versa
ALTER TABLE public.recruiters
  ADD CONSTRAINT agency_role_consistency
  CHECK (
    (agency_id IS NULL AND agency_role IS NULL) OR
    (agency_id IS NOT NULL AND agency_role IS NOT NULL)
  );

-- Index for looking up agency members
CREATE INDEX IF NOT EXISTS idx_recruiters_agency
  ON public.recruiters (agency_id)
  WHERE agency_id IS NOT NULL;
```

### 1.3 — Agency Invitations Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. AGENCY INVITATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.agency_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email       text NOT NULL,
  invited_by  uuid NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,

  CONSTRAINT valid_invitation_status
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- One pending invitation per email per agency
CREATE UNIQUE INDEX idx_agency_invitations_unique_pending
  ON public.agency_invitations (agency_id, email)
  WHERE status = 'pending';

-- For listing invitations by agency
CREATE INDEX idx_agency_invitations_agency
  ON public.agency_invitations (agency_id, status, created_at DESC);

-- RLS
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

-- Agency admin can read all invitations for their agency
CREATE POLICY "agency_invitations: agency admin read"
  ON public.agency_invitations FOR SELECT
  USING (
    agency_id IN (
      SELECT a.id FROM public.agencies a
      JOIN public.recruiters r ON r.id = a.admin_recruiter_id
      WHERE r.auth_user_id = auth.uid()
    )
  );

-- Agency admin can insert invitations
CREATE POLICY "agency_invitations: admin insert"
  ON public.agency_invitations FOR INSERT
  WITH CHECK (
    invited_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    AND agency_id IN (
      SELECT a.id FROM public.agencies a
      WHERE a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );

-- Agency admin can update (cancel) invitations
CREATE POLICY "agency_invitations: admin update"
  ON public.agency_invitations FOR UPDATE
  USING (
    agency_id IN (
      SELECT a.id FROM public.agencies a
      WHERE a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );

-- Invited recruiter can read their own invitation (for accept flow)
CREATE POLICY "agency_invitations: invitee read"
  ON public.agency_invitations FOR SELECT
  USING (
    email = (SELECT r.email FROM public.recruiters r WHERE r.auth_user_id = auth.uid())
  );
```

### 1.4 — Agency Credit Pool Extension

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. SHARED CREDIT POOL
-- ═══════════════════════════════════════════════════════════

-- Nullable agency_id on recruiter_credits — null means individual credits
ALTER TABLE public.recruiter_credits
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Index for FIFO deduction within agency pool
CREATE INDEX IF NOT EXISTS idx_recruiter_credits_agency_fifo
  ON public.recruiter_credits (agency_id, expires_at ASC)
  WHERE credits_remaining > 0 AND agency_id IS NOT NULL;
```

### 1.5 — Shortlists Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 5. SHORTLISTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.shortlists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  recruiter_id uuid REFERENCES public.recruiters(id) ON DELETE CASCADE,
  name         text NOT NULL,
  created_by   uuid NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Either agency_id or recruiter_id must be set, not both
  CONSTRAINT shortlist_scope
    CHECK (
      (agency_id IS NOT NULL AND recruiter_id IS NULL) OR
      (agency_id IS NULL AND recruiter_id IS NOT NULL)
    )
);

-- Index for listing shortlists by agency
CREATE INDEX idx_shortlists_agency
  ON public.shortlists (agency_id, created_at DESC)
  WHERE agency_id IS NOT NULL;

-- Index for listing shortlists by individual recruiter
CREATE INDEX idx_shortlists_recruiter
  ON public.shortlists (recruiter_id, created_at DESC)
  WHERE recruiter_id IS NOT NULL;

-- RLS
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

-- Agency members can read agency shortlists
CREATE POLICY "shortlists: agency member read"
  ON public.shortlists FOR SELECT
  USING (
    agency_id IN (
      SELECT r.agency_id FROM public.recruiters r
      WHERE r.auth_user_id = auth.uid() AND r.agency_id IS NOT NULL
    )
    OR recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
  );

-- Any agency member or individual recruiter can create shortlists
CREATE POLICY "shortlists: recruiter insert"
  ON public.shortlists FOR INSERT
  WITH CHECK (created_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid()));

-- Creator or agency admin can update shortlist name
CREATE POLICY "shortlists: owner update"
  ON public.shortlists FOR UPDATE
  USING (
    created_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    OR agency_id IN (
      SELECT a.id FROM public.agencies a
      WHERE a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );

-- Creator or agency admin can delete shortlist
CREATE POLICY "shortlists: owner delete"
  ON public.shortlists FOR DELETE
  USING (
    created_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    OR agency_id IN (
      SELECT a.id FROM public.agencies a
      WHERE a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );
```

### 1.6 — Shortlist Entries Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 6. SHORTLIST ENTRIES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.shortlist_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id  uuid NOT NULL REFERENCES public.shortlists(id) ON DELETE CASCADE,
  crew_user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  added_by      uuid NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One crew member per shortlist
CREATE UNIQUE INDEX idx_shortlist_entries_unique
  ON public.shortlist_entries (shortlist_id, crew_user_id);

-- For listing entries in a shortlist
CREATE INDEX idx_shortlist_entries_list
  ON public.shortlist_entries (shortlist_id, created_at DESC);

-- RLS
ALTER TABLE public.shortlist_entries ENABLE ROW LEVEL SECURITY;

-- Readable if the parent shortlist is readable
CREATE POLICY "shortlist_entries: shortlist member read"
  ON public.shortlist_entries FOR SELECT
  USING (
    shortlist_id IN (
      SELECT s.id FROM public.shortlists s
      WHERE s.agency_id IN (
        SELECT r.agency_id FROM public.recruiters r
        WHERE r.auth_user_id = auth.uid() AND r.agency_id IS NOT NULL
      )
      OR s.recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );

-- Any agency member or shortlist owner can insert entries
CREATE POLICY "shortlist_entries: recruiter insert"
  ON public.shortlist_entries FOR INSERT
  WITH CHECK (
    added_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    AND shortlist_id IN (
      SELECT s.id FROM public.shortlists s
      WHERE s.agency_id IN (
        SELECT r.agency_id FROM public.recruiters r
        WHERE r.auth_user_id = auth.uid() AND r.agency_id IS NOT NULL
      )
      OR s.recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );

-- Entry adder or agency admin can update notes
CREATE POLICY "shortlist_entries: owner update"
  ON public.shortlist_entries FOR UPDATE
  USING (
    added_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    OR shortlist_id IN (
      SELECT s.id FROM public.shortlists s
      JOIN public.agencies a ON a.id = s.agency_id
      WHERE a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );

-- Entry adder or agency admin can delete entries
CREATE POLICY "shortlist_entries: owner delete"
  ON public.shortlist_entries FOR DELETE
  USING (
    added_by IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    OR shortlist_id IN (
      SELECT s.id FROM public.shortlists s
      JOIN public.agencies a ON a.id = s.agency_id
      WHERE a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
    )
  );
```

### 1.7 — Crew Profile Embeddings Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 7. CREW PROFILE EMBEDDINGS (pgvector)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.crew_profile_embeddings (
  user_id      uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  embedding    vector(1536) NOT NULL,
  profile_text text NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- IVFFlat index for cosine similarity search
-- lists = 100 is fine for up to 50K profiles (same as yacht_embeddings)
CREATE INDEX idx_crew_profile_embeddings_vector
  ON public.crew_profile_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS: service role writes, recruiter reads for search
ALTER TABLE public.crew_profile_embeddings ENABLE ROW LEVEL SECURITY;

-- Recruiters with active subscriptions can read embeddings (via RPC, not direct access)
-- Direct table access is restricted — all vector search goes through search_crew_nlp() RPC
-- which runs as SECURITY DEFINER. No direct SELECT policy needed for end users.

-- Service role has full access (bypasses RLS) for batch embedding jobs
```

### 1.8 — NLP Match Explanation Cache Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 8. NLP MATCH EXPLANATION CACHE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.nlp_match_cache (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash   text NOT NULL,
  crew_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  explanation  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL
);

-- Lookup by query_hash + user_id
CREATE UNIQUE INDEX idx_nlp_match_cache_lookup
  ON public.nlp_match_cache (query_hash, crew_user_id);

-- For cache cleanup cron
CREATE INDEX idx_nlp_match_cache_expiry
  ON public.nlp_match_cache (expires_at)
  WHERE expires_at < now();

-- RLS
ALTER TABLE public.nlp_match_cache ENABLE ROW LEVEL SECURITY;

-- No direct user access — cache is read/written by search_crew_nlp() RPC (SECURITY DEFINER)
-- and by the API route running as service role
```

### 1.9 — Embedding Queue Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 9. EMBEDDING RE-INDEX QUEUE
-- ═══════════════════════════════════════════════════════════
-- Queue table for incremental profile re-embedding.
-- Profile changes insert a row; the cron job processes the queue.

CREATE TABLE public.embedding_queue (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed  boolean NOT NULL DEFAULT false
);

-- Dequeue: unprocessed items, oldest first
CREATE INDEX idx_embedding_queue_pending
  ON public.embedding_queue (created_at ASC)
  WHERE processed = false;

-- Prevent duplicate queue entries for the same user
-- (process existing before queuing again)
CREATE INDEX idx_embedding_queue_user_pending
  ON public.embedding_queue (user_id)
  WHERE processed = false;

-- RLS
ALTER TABLE public.embedding_queue ENABLE ROW LEVEL SECURITY;
-- No direct user access — service role only
```

### 1.10 — Trigger: Queue Re-Embedding on Profile Change

```sql
-- ═══════════════════════════════════════════════════════════
-- 10. TRIGGER: QUEUE RE-EMBEDDING ON PROFILE CHANGE
-- ═══════════════════════════════════════════════════════════

-- When a user's searchable fields change, queue a re-embed
CREATE OR REPLACE FUNCTION public.queue_profile_reembed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only queue if the user is recruiter-visible
  IF NEW.recruiter_visible = true THEN
    -- Only queue if relevant fields changed
    IF (
      OLD.bio IS DISTINCT FROM NEW.bio OR
      OLD.primary_role IS DISTINCT FROM NEW.primary_role OR
      OLD.departments IS DISTINCT FROM NEW.departments OR
      OLD.location_country IS DISTINCT FROM NEW.location_country OR
      OLD.location_city IS DISTINCT FROM NEW.location_city
    ) THEN
      -- Don't queue if there's already a pending entry for this user
      INSERT INTO public.embedding_queue (user_id, reason)
      SELECT NEW.id, 'profile_update'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.embedding_queue
        WHERE user_id = NEW.id AND processed = false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_queue_profile_reembed
  AFTER UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.queue_profile_reembed();

-- When a new endorsement is created, queue re-embed for the recipient
CREATE OR REPLACE FUNCTION public.queue_endorsement_reembed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.embedding_queue (user_id, reason)
  SELECT NEW.recipient_id, 'new_endorsement'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.embedding_queue
    WHERE user_id = NEW.recipient_id AND processed = false
  )
  AND EXISTS (
    SELECT 1 FROM public.users WHERE id = NEW.recipient_id AND recruiter_visible = true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_queue_endorsement_reembed
  AFTER INSERT ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION public.queue_endorsement_reembed();

-- When a new attachment is created, queue re-embed for the user
CREATE OR REPLACE FUNCTION public.queue_attachment_reembed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.embedding_queue (user_id, reason)
  SELECT NEW.user_id, 'new_attachment'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.embedding_queue
    WHERE user_id = NEW.user_id AND processed = false
  )
  AND EXISTS (
    SELECT 1 FROM public.users WHERE id = NEW.user_id AND recruiter_visible = true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_queue_attachment_reembed
  AFTER INSERT ON public.attachments
  FOR EACH ROW EXECUTE FUNCTION public.queue_attachment_reembed();

-- When a new certification is created, queue re-embed for the user
CREATE OR REPLACE FUNCTION public.queue_cert_reembed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.embedding_queue (user_id, reason)
  SELECT NEW.user_id, 'new_certification'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.embedding_queue
    WHERE user_id = NEW.user_id AND processed = false
  )
  AND EXISTS (
    SELECT 1 FROM public.users WHERE id = NEW.user_id AND recruiter_visible = true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_queue_cert_reembed
  AFTER INSERT ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.queue_cert_reembed();
```

### 1.11 — search_crew_nlp() RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 11. NLP CREW SEARCH RPC
-- ═══════════════════════════════════════════════════════════

-- Called from the API route which provides the query embedding.
-- The RPC performs vector similarity search + filter enforcement.
-- The API route handles: embedding the query, generating match explanations,
-- and returning the full response.

CREATE OR REPLACE FUNCTION public.search_crew_nlp(
  p_query_embedding vector(1536),
  p_recruiter_id uuid,
  p_limit int DEFAULT 20,
  p_availability_only boolean DEFAULT false,
  p_department text DEFAULT NULL,
  p_min_endorsements int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results jsonb;
  v_agency_id uuid;
BEGIN
  -- Check recruiter has active subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.recruiters
    WHERE id = p_recruiter_id AND subscription_status = 'active'
  ) THEN
    RETURN jsonb_build_object('error', 'Active subscription required');
  END IF;

  -- Get agency_id if recruiter is in an agency
  SELECT agency_id INTO v_agency_id
  FROM public.recruiters
  WHERE id = p_recruiter_id;

  SELECT jsonb_agg(row_to_json(t)) INTO v_results
  FROM (
    SELECT
      u.id,
      u.handle,
      u.profile_photo_url,
      u.primary_role,
      u.departments,
      u.location_country,
      u.location_city,
      u.availability_status,
      u.bio,
      -- Similarity score
      1 - (cpe.embedding <=> p_query_embedding) AS similarity_score,
      -- Profile text used for embedding (for match explanation generation)
      cpe.profile_text,
      -- Sea time
      COALESCE((
        SELECT sum(COALESCE(a.ended_at, current_date) - a.started_at)::int
        FROM public.attachments a
        WHERE a.user_id = u.id AND a.deleted_at IS NULL
      ), 0) AS total_sea_time_days,
      -- Yacht count
      (
        SELECT count(DISTINCT a.yacht_id)::int
        FROM public.attachments a
        WHERE a.user_id = u.id AND a.deleted_at IS NULL
      ) AS yacht_count,
      -- Endorsement counts
      (
        SELECT count(*)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorsement_count,
      (
        SELECT count(DISTINCT e.endorser_id)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorser_count,
      (
        SELECT count(DISTINCT e.yacht_id)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorsement_yacht_count,
      -- Unlock status (check both individual and agency unlocks)
      EXISTS (
        SELECT 1 FROM public.recruiter_unlocks ru
        WHERE ru.crew_user_id = u.id
          AND (
            ru.recruiter_id = p_recruiter_id
            OR (v_agency_id IS NOT NULL AND ru.recruiter_id IN (
              SELECT r2.id FROM public.recruiters r2 WHERE r2.agency_id = v_agency_id
            ))
          )
      ) AS is_unlocked,
      -- Locked fields: only show if unlocked
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.recruiter_unlocks ru
          WHERE ru.crew_user_id = u.id
            AND (
              ru.recruiter_id = p_recruiter_id
              OR (v_agency_id IS NOT NULL AND ru.recruiter_id IN (
                SELECT r2.id FROM public.recruiters r2 WHERE r2.agency_id = v_agency_id
              ))
            )
        ) THEN u.full_name
        ELSE NULL
      END AS full_name,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM public.recruiter_unlocks ru
          WHERE ru.crew_user_id = u.id
            AND (
              ru.recruiter_id = p_recruiter_id
              OR (v_agency_id IS NOT NULL AND ru.recruiter_id IN (
                SELECT r2.id FROM public.recruiters r2 WHERE r2.agency_id = v_agency_id
              ))
            )
        ) THEN u.display_name
        ELSE NULL
      END AS display_name
    FROM public.users u
    JOIN public.crew_profile_embeddings cpe ON cpe.user_id = u.id
    WHERE u.recruiter_visible = true
      AND u.onboarding_complete = true
      AND (NOT p_availability_only OR u.availability_status = 'available')
      AND (p_department IS NULL OR p_department = ANY(u.departments))
      AND (
        SELECT count(*)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) >= p_min_endorsements
    ORDER BY cpe.embedding <=> p_query_embedding ASC
    LIMIT p_limit
  ) t;

  RETURN jsonb_build_object(
    'results', COALESCE(v_results, '[]'::jsonb),
    'count', COALESCE(jsonb_array_length(v_results), 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_crew_nlp(vector, uuid, int, boolean, text, int) TO authenticated;
```

### 1.12 — get_agency_analytics() RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 12. AGENCY ANALYTICS RPC
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_agency_analytics(
  p_agency_id uuid,
  p_period text DEFAULT 'month'
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamptz;
  v_result jsonb;
BEGIN
  -- Verify caller is agency admin
  IF NOT EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = p_agency_id
      AND a.admin_recruiter_id IN (SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid())
  ) THEN
    RETURN jsonb_build_object('error', 'Admin access required');
  END IF;

  -- Determine period
  v_start_date := CASE p_period
    WHEN 'week' THEN now() - interval '7 days'
    WHEN 'month' THEN now() - interval '30 days'
    WHEN 'quarter' THEN now() - interval '90 days'
    WHEN 'year' THEN now() - interval '365 days'
    WHEN 'all' THEN '1970-01-01'::timestamptz
    ELSE now() - interval '30 days'
  END;

  SELECT jsonb_build_object(
    -- Total unlocks
    'unlocks_period', (
      SELECT count(*)::int
      FROM public.recruiter_unlocks ru
      JOIN public.recruiters r ON r.id = ru.recruiter_id
      WHERE r.agency_id = p_agency_id
        AND ru.unlocked_at >= v_start_date
    ),
    'unlocks_all_time', (
      SELECT count(*)::int
      FROM public.recruiter_unlocks ru
      JOIN public.recruiters r ON r.id = ru.recruiter_id
      WHERE r.agency_id = p_agency_id
    ),
    -- Credit usage
    'credits_purchased_period', (
      SELECT COALESCE(sum(rc.credits_purchased), 0)::int
      FROM public.recruiter_credits rc
      WHERE rc.agency_id = p_agency_id
        AND rc.purchased_at >= v_start_date
    ),
    'credits_remaining', (
      SELECT COALESCE(sum(rc.credits_remaining), 0)::int
      FROM public.recruiter_credits rc
      WHERE rc.agency_id = p_agency_id
        AND rc.credits_remaining > 0
        AND rc.expires_at > now()
    ),
    'credits_expiring_30d', (
      SELECT COALESCE(sum(rc.credits_remaining), 0)::int
      FROM public.recruiter_credits rc
      WHERE rc.agency_id = p_agency_id
        AND rc.credits_remaining > 0
        AND rc.expires_at > now()
        AND rc.expires_at <= now() + interval '30 days'
    ),
    -- Seat count
    'seat_count', (
      SELECT count(*)::int
      FROM public.recruiters r
      WHERE r.agency_id = p_agency_id
    ),
    -- Per-seat breakdown
    'per_seat', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'recruiter_id', r.id,
          'contact_name', r.contact_name,
          'unlocks_period', (
            SELECT count(*)::int
            FROM public.recruiter_unlocks ru
            WHERE ru.recruiter_id = r.id
              AND ru.unlocked_at >= v_start_date
          ),
          'credits_purchased_period', (
            SELECT COALESCE(sum(rc.credits_purchased), 0)::int
            FROM public.recruiter_credits rc
            WHERE rc.recruiter_id = r.id
              AND rc.agency_id = p_agency_id
              AND rc.purchased_at >= v_start_date
          )
        )
      ), '[]'::jsonb)
      FROM public.recruiters r
      WHERE r.agency_id = p_agency_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_agency_analytics(uuid, text) TO authenticated;
```

### 1.13 — Agency Credit Deduction RPCs

```sql
-- ═══════════════════════════════════════════════════════════
-- 13. AGENCY-AWARE CREDIT DEDUCTION
-- ═══════════════════════════════════════════════════════════

-- Override or extend the Sprint 19 unlock_crew_profile to be agency-aware.
-- If the recruiter is in an agency, deduct from the shared agency credit pool (FIFO).
-- If individual, deduct from personal credits (existing behavior).

CREATE OR REPLACE FUNCTION public.unlock_crew_profile(
  p_recruiter_id uuid,
  p_crew_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id uuid;
  v_credit_id uuid;
  v_already_unlocked boolean;
  v_unlock_id uuid;
BEGIN
  -- Check if already unlocked (by this recruiter OR any agency member)
  SELECT agency_id INTO v_agency_id
  FROM public.recruiters WHERE id = p_recruiter_id;

  IF v_agency_id IS NOT NULL THEN
    -- Agency: check if any agency member has unlocked this crew
    SELECT EXISTS (
      SELECT 1 FROM public.recruiter_unlocks ru
      JOIN public.recruiters r ON r.id = ru.recruiter_id
      WHERE ru.crew_user_id = p_crew_user_id
        AND r.agency_id = v_agency_id
    ) INTO v_already_unlocked;
  ELSE
    -- Individual: check this recruiter only
    SELECT EXISTS (
      SELECT 1 FROM public.recruiter_unlocks ru
      WHERE ru.recruiter_id = p_recruiter_id
        AND ru.crew_user_id = p_crew_user_id
    ) INTO v_already_unlocked;
  END IF;

  IF v_already_unlocked THEN
    RETURN jsonb_build_object('status', 'already_unlocked');
  END IF;

  -- Check recruiter has active subscription (Sprint 19 safety check)
  IF NOT EXISTS (
    SELECT 1 FROM public.recruiters
    WHERE id = p_recruiter_id
      AND subscription_status = 'active'
  ) THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'subscription_inactive');
  END IF;

  -- Check crew member exists and has opted in (Sprint 19 safety check)
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_crew_user_id
      AND recruiter_visible = true
  ) THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'crew_not_visible');
  END IF;

  -- Find oldest non-expired credit with remaining balance (FIFO)
  IF v_agency_id IS NOT NULL THEN
    -- Agency pool: deduct from shared credits
    SELECT id INTO v_credit_id
    FROM public.recruiter_credits
    WHERE agency_id = v_agency_id
      AND credits_remaining > 0
      AND expires_at > now()
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE;
  ELSE
    -- Individual: deduct from personal credits
    SELECT id INTO v_credit_id
    FROM public.recruiter_credits
    WHERE recruiter_id = p_recruiter_id
      AND agency_id IS NULL
      AND credits_remaining > 0
      AND expires_at > now()
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF v_credit_id IS NULL THEN
    RETURN jsonb_build_object('status', 'insufficient_credits');
  END IF;

  -- Deduct 1 credit
  UPDATE public.recruiter_credits
  SET credits_remaining = credits_remaining - 1
  WHERE id = v_credit_id;

  -- Create unlock record
  INSERT INTO public.recruiter_unlocks (recruiter_id, crew_user_id, credit_id)
  VALUES (p_recruiter_id, p_crew_user_id, v_credit_id)
  RETURNING id INTO v_unlock_id;

  RETURN jsonb_build_object(
    'status', 'unlocked',
    'unlock_id', v_unlock_id,
    'credit_id', v_credit_id
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: concurrent unlock requests for the same pair
    RETURN jsonb_build_object('status', 'already_unlocked');
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_crew_profile(uuid, uuid) TO authenticated;
```

### 1.14 — Bulk Unlock RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 14. BULK UNLOCK RPC
-- ═══════════════════════════════════════════════════════════

-- Atomic bulk unlock: all-or-nothing. Deduct N credits, create N unlock records.
-- Fails if insufficient credits for the full batch.

CREATE OR REPLACE FUNCTION public.bulk_unlock_crew_profiles(
  p_recruiter_id uuid,
  p_crew_user_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id uuid;
  v_needed int;
  v_new_ids uuid[];
  v_available_credits int;
  v_credit_row RECORD;
  v_remaining_to_deduct int;
BEGIN
  -- Get agency context
  SELECT agency_id INTO v_agency_id
  FROM public.recruiters WHERE id = p_recruiter_id;

  -- Filter out already-unlocked profiles
  IF v_agency_id IS NOT NULL THEN
    SELECT ARRAY(
      SELECT unnest(p_crew_user_ids)
      EXCEPT
      SELECT ru.crew_user_id
      FROM public.recruiter_unlocks ru
      JOIN public.recruiters r ON r.id = ru.recruiter_id
      WHERE r.agency_id = v_agency_id
        AND ru.crew_user_id = ANY(p_crew_user_ids)
    ) INTO v_new_ids;
  ELSE
    SELECT ARRAY(
      SELECT unnest(p_crew_user_ids)
      EXCEPT
      SELECT ru.crew_user_id
      FROM public.recruiter_unlocks ru
      WHERE ru.recruiter_id = p_recruiter_id
        AND ru.crew_user_id = ANY(p_crew_user_ids)
    ) INTO v_new_ids;
  END IF;

  v_needed := array_length(v_new_ids, 1);
  IF v_needed IS NULL OR v_needed = 0 THEN
    RETURN jsonb_build_object('status', 'all_already_unlocked', 'unlocked_count', 0);
  END IF;

  -- Check total available credits
  IF v_agency_id IS NOT NULL THEN
    SELECT COALESCE(sum(credits_remaining), 0)::int INTO v_available_credits
    FROM public.recruiter_credits
    WHERE agency_id = v_agency_id
      AND credits_remaining > 0
      AND expires_at > now();
  ELSE
    SELECT COALESCE(sum(credits_remaining), 0)::int INTO v_available_credits
    FROM public.recruiter_credits
    WHERE recruiter_id = p_recruiter_id
      AND agency_id IS NULL
      AND credits_remaining > 0
      AND expires_at > now();
  END IF;

  IF v_available_credits < v_needed THEN
    RETURN jsonb_build_object(
      'status', 'insufficient_credits',
      'needed', v_needed,
      'available', v_available_credits
    );
  END IF;

  -- Deduct credits FIFO
  v_remaining_to_deduct := v_needed;

  FOR v_credit_row IN
    SELECT id, credits_remaining
    FROM public.recruiter_credits
    WHERE (
      (v_agency_id IS NOT NULL AND agency_id = v_agency_id) OR
      (v_agency_id IS NULL AND recruiter_id = p_recruiter_id AND agency_id IS NULL)
    )
      AND credits_remaining > 0
      AND expires_at > now()
    ORDER BY expires_at ASC
    FOR UPDATE
  LOOP
    IF v_remaining_to_deduct <= 0 THEN EXIT; END IF;

    IF v_credit_row.credits_remaining >= v_remaining_to_deduct THEN
      UPDATE public.recruiter_credits
      SET credits_remaining = credits_remaining - v_remaining_to_deduct
      WHERE id = v_credit_row.id;
      v_remaining_to_deduct := 0;
    ELSE
      UPDATE public.recruiter_credits
      SET credits_remaining = 0
      WHERE id = v_credit_row.id;
      v_remaining_to_deduct := v_remaining_to_deduct - v_credit_row.credits_remaining;
    END IF;
  END LOOP;

  -- Create unlock records
  INSERT INTO public.recruiter_unlocks (recruiter_id, crew_user_id, credit_id)
  SELECT p_recruiter_id, uid, (
    -- Reference the most recently used credit bundle for audit trail
    SELECT id FROM public.recruiter_credits
    WHERE (
      (v_agency_id IS NOT NULL AND agency_id = v_agency_id) OR
      (v_agency_id IS NULL AND recruiter_id = p_recruiter_id AND agency_id IS NULL)
    )
    ORDER BY expires_at ASC LIMIT 1
  )
  FROM unnest(v_new_ids) AS uid
  ON CONFLICT (recruiter_id, crew_user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'status', 'unlocked',
    'unlocked_count', v_needed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_unlock_crew_profiles(uuid, uuid[]) TO authenticated;
```

### 1.15 — Compose Profile Text Helper

```sql
-- ═══════════════════════════════════════════════════════════
-- 15. COMPOSE PROFILE TEXT FOR EMBEDDING
-- ═══════════════════════════════════════════════════════════

-- Deterministic function that composes the text document for a user's embedding.
-- Used by both the batch embedding job and the incremental re-embed trigger.

CREATE OR REPLACE FUNCTION public.compose_profile_text(p_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT concat_ws(E'\n',
    -- Role and department
    COALESCE(u.primary_role, ''),
    COALESCE(array_to_string(u.departments, ', '), ''),
    -- Bio
    COALESCE(u.bio, ''),
    -- Location
    COALESCE(u.location_city, '') || ' ' || COALESCE(u.location_country, ''),
    -- Yacht history: yacht name + role + dates
    COALESCE((
      SELECT string_agg(
        COALESCE(y.name, '') || ' ' ||
        COALESCE(y.yacht_type, '') || ' ' ||
        COALESCE(a.role_label, '') || ' ' ||
        COALESCE(to_char(a.started_at, 'YYYY'), '') || '-' ||
        COALESCE(to_char(a.ended_at, 'YYYY'), 'present'),
        E'\n'
      )
      FROM public.attachments a
      JOIN public.yachts y ON y.id = a.yacht_id
      WHERE a.user_id = p_user_id AND a.deleted_at IS NULL
    ), ''),
    -- Certification types
    COALESCE((
      SELECT string_agg(ct.name, ', ')
      FROM public.certifications c
      JOIN public.certification_types ct ON ct.id = c.certification_type_id
      WHERE c.user_id = p_user_id
    ), ''),
    -- Endorsement text excerpts (first 200 chars each)
    COALESCE((
      SELECT string_agg(
        left(COALESCE(e.content, ''), 200),
        E'\n'
      )
      FROM public.endorsements e
      WHERE e.recipient_id = p_user_id AND e.deleted_at IS NULL
    ), '')
  )
  FROM public.users u
  WHERE u.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.compose_profile_text(uuid) TO authenticated;
```

### 1.16 — GRANTs for All New Functions

```sql
-- ═══════════════════════════════════════════════════════════
-- 16. GRANT EXECUTE
-- ═══════════════════════════════════════════════════════════

-- Already granted inline above, but ensure all are present:
GRANT EXECUTE ON FUNCTION public.search_crew_nlp(vector, uuid, int, boolean, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_analytics(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_crew_profile(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_unlock_crew_profiles(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compose_profile_text(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_profile_reembed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_endorsement_reembed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_attachment_reembed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_cert_reembed() TO authenticated;
```

---

## Part 2: OpenAI Client Extension

### 2.1 — Crew Profile Embedding Helpers

**File to create:** `lib/ai/crew-embeddings.ts`

> **Note:** Sprint 17 already creates `lib/ai/embeddings.ts` with `generateEmbedding()` (returns `number[] | null`),
> `generateEmbeddingsBatch()` (returns `Array<{ text: string; embedding: number[] | null }>`), and shared
> constants `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS`. Sprint 20 must NOT overwrite that file.
> Instead, this file re-exports from the Sprint 17 module and adds crew-profile-specific helpers.

```typescript
// Re-export Sprint 17's core embedding utilities — do NOT duplicate them
export {
  generateEmbedding,
  generateEmbeddingsBatch,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from '@/lib/ai/embeddings';
```

### 2.2 — Match Explanation Generator

**File to create:** `lib/ai/match-explanation.ts`

```typescript
import OpenAI from 'openai';
import { createHash } from 'crypto';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

const COMPLETION_MODEL = 'gpt-5';

export function hashQuery(query: string): string {
  return createHash('sha256').update(query.trim().toLowerCase()).digest('hex').slice(0, 32);
}

interface MatchExplanationInput {
  query: string;
  profileText: string;
  primaryRole: string | null;
  endorsementCount: number;
  yachtCount: number;
  seaTimeDays: number;
}

/**
 * Generate a 1–2 sentence match explanation for a single search result.
 * Returns the explanation text.
 */
export async function generateMatchExplanation(
  input: MatchExplanationInput,
): Promise<string> {
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: COMPLETION_MODEL,
    temperature: 0.3,
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content: `You are a recruitment assistant for the yachting industry. Given a recruiter's search query and a crew member's profile, write a concise 1–2 sentence match explanation. Focus on specific, factual matches: relevant experience, certifications, endorsements, yacht history, availability. Be direct and professional. Do not use marketing language or superlatives. If the match is weak, say so briefly.`,
      },
      {
        role: 'user',
        content: `Search query: "${input.query}"

Crew profile:
${input.profileText}

Stats: ${input.endorsementCount} endorsements, ${input.yachtCount} yachts, ${Math.round(input.seaTimeDays / 365)} years sea time.

Write the match explanation:`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? 'Match explanation unavailable.';
}

/**
 * Generate match explanations for multiple results in parallel.
 * Includes error handling per-result — failed explanations return a fallback.
 */
export async function generateMatchExplanationsBatch(
  query: string,
  results: MatchExplanationInput[],
): Promise<string[]> {
  const promises = results.map(async (result) => {
    try {
      return await generateMatchExplanation(result);
    } catch (err) {
      console.error('Match explanation generation failed:', err);
      return ''; // Empty string = no explanation shown
    }
  });

  return Promise.all(promises);
}
```

### 2.3 — AI Cost Logger Extension

**File to create:** `lib/ai/cost-logger.ts`

```typescript
import { createServiceClient } from '@/lib/supabase/admin';

type AIOperation = 'embedding' | 'match_explanation' | 'nlp_search_query';

interface CostLogEntry {
  operation: AIOperation;
  model: string;
  tokens_input: number;
  tokens_output: number;
  cost_eur: number;
  recruiter_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log AI usage to ai_usage_log table.
 * Fire-and-forget — does not block the caller.
 */
export function logAICost(entry: CostLogEntry): void {
  const supabase = createServiceClient();
  supabase.from('ai_usage_log').insert({
    operation: entry.operation,
    model: entry.model,
    tokens_input: entry.tokens_input,
    tokens_output: entry.tokens_output,
    cost_eur: entry.cost_eur,
    user_id: entry.recruiter_id ?? null,
    metadata: entry.metadata ?? {},
  }).then(({ error }) => {
    if (error) console.error('AI cost log failed:', error);
  });
}
```

---

## Part 3: Agency Account Model

### 3.1 — Agency Creation API Route

**File to create:** `app/api/recruiter/agency/create/route.ts`

```typescript
// POST /api/recruiter/agency/create
// Body: { name: string }
// Response: { agency: { id, name, admin_recruiter_id, created_at } }
//
// Creates an agency and promotes the calling recruiter to admin.
// Converts existing individual subscription to agency subscription.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const createAgencySchema = z.object({
  name: z.string().min(2).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'auth');
    if (limited) return limited;

    const result = await validateBody(req, createAgencySchema);
    if ('error' in result) return result.error;
    const { name } = result.data;

    const admin = createServiceClient();

    // Verify caller is a recruiter with active subscription
    const { data: recruiter, error: recruiterError } = await admin
      .from('recruiters')
      .select('id, email, company_name, contact_name, stripe_customer_id, subscription_status, agency_id')
      .eq('auth_user_id', user.id)
      .single();

    if (recruiterError || !recruiter) {
      return NextResponse.json({ error: 'Recruiter account not found' }, { status: 404 });
    }

    if (recruiter.agency_id) {
      return NextResponse.json({ error: 'Already part of an agency' }, { status: 409 });
    }

    if (recruiter.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 402 });
    }

    // Create or use existing Stripe customer for agency-level billing
    let agencyStripeCustomerId = recruiter.stripe_customer_id;
    if (!agencyStripeCustomerId) {
      const customer = await stripe.customers.create({
        email: recruiter.email,
        name: name,
        metadata: {
          type: 'agency',
          admin_recruiter_id: recruiter.id,
        },
      });
      agencyStripeCustomerId = customer.id;
    } else {
      // Update existing customer metadata
      await stripe.customers.update(agencyStripeCustomerId, {
        metadata: {
          type: 'agency',
          admin_recruiter_id: recruiter.id,
          agency_name: name,
        },
      });
    }

    // Create agency
    const { data: agency, error: agencyError } = await admin
      .from('agencies')
      .insert({
        name,
        admin_recruiter_id: recruiter.id,
        stripe_customer_id: agencyStripeCustomerId,
      })
      .select()
      .single();

    if (agencyError) {
      return NextResponse.json({ error: 'Failed to create agency' }, { status: 500 });
    }

    // Update recruiter to be agency admin
    await admin
      .from('recruiters')
      .update({
        agency_id: agency.id,
        agency_role: 'admin',
      })
      .eq('id', recruiter.id);

    trackServerEvent(recruiter.id, 'agency_created', {
      agency_id: agency.id,
      agency_name: name,
      seat_count: 1,
    });

    return NextResponse.json({ agency }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 3.2 — Agency Seat Invite API Route

**File to create:** `app/api/recruiter/agency/invite/route.ts`

```typescript
// POST /api/recruiter/agency/invite
// Body: { email: string }
// Response: { invitation: { id, email, status, expires_at } }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { sendNotifyEmail } from '@/lib/email/notify';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'auth');
    if (limited) return limited;

    const result = await validateBody(req, inviteSchema);
    if ('error' in result) return result.error;
    const { email } = result.data;

    const admin = createServiceClient();

    // Verify caller is agency admin
    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, agency_id, agency_role, contact_name')
      .eq('auth_user_id', user.id)
      .single();

    if (!recruiter?.agency_id || recruiter.agency_role !== 'admin') {
      return NextResponse.json({ error: 'Agency admin access required' }, { status: 403 });
    }

    // Get agency name for the email
    const { data: agency } = await admin
      .from('agencies')
      .select('name')
      .eq('id', recruiter.agency_id)
      .single();

    // Check if email is already in the agency
    const { data: existingMember } = await admin
      .from('recruiters')
      .select('id')
      .eq('email', email)
      .eq('agency_id', recruiter.agency_id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: 'This email is already a member of your agency' }, { status: 409 });
    }

    // Create invitation (7 day expiry)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invitation, error: inviteError } = await admin
      .from('agency_invitations')
      .insert({
        agency_id: recruiter.agency_id,
        email,
        invited_by: recruiter.id,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (inviteError) {
      if (inviteError.code === '23505') {
        return NextResponse.json({ error: 'Invitation already pending for this email' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invitation email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link';
    const acceptUrl = `${siteUrl}/recruiter/agency/accept?token=${invitation.id}`;

    await sendNotifyEmail({
      to: email,
      subject: `Join ${agency?.name ?? 'an agency'} on YachtieLink`,
      html: `<!DOCTYPE html>
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
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">You've been invited to join ${agency?.name ?? 'an agency'}</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            ${recruiter.contact_name} has invited you to join their agency on YachtieLink.
            As a member, you'll have access to shared crew search, shortlists, and the agency credit pool.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            This invitation expires in 7 days.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${acceptUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Accept invitation
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      text: `You've been invited to join ${agency?.name ?? 'an agency'} on YachtieLink.\n\n${recruiter.contact_name} has invited you to their agency. Accept here: ${acceptUrl}\n\nThis invitation expires in 7 days.`,
    }).catch((err) => console.error('Agency invite email failed:', err));

    trackServerEvent(recruiter.id, 'agency_seat_invited', {
      agency_id: recruiter.agency_id,
      invited_email: email,
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 3.3 — Agency Seat Accept API Route

**File to create:** `app/api/recruiter/agency/accept/route.ts`

```typescript
// POST /api/recruiter/agency/accept
// Body: { invitation_id: string }
// Response: { status: 'accepted', agency_id: string }
//
// Called by a recruiter (existing or new) to accept an agency invitation.
// Creates a per-seat Stripe subscription item for the new member.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const acceptSchema = z.object({
  invitation_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await validateBody(req, acceptSchema);
    if ('error' in result) return result.error;
    const { invitation_id } = result.data;

    const admin = createServiceClient();

    // Fetch invitation
    const { data: invitation, error: invError } = await admin
      .from('agency_invitations')
      .select('*, agencies(*)')
      .eq('id', invitation_id)
      .single();

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation is ${invitation.status}` }, { status: 409 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await admin.from('agency_invitations').update({ status: 'expired' }).eq('id', invitation_id);
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Verify the accepting user is a recruiter with matching email
    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, email, agency_id, stripe_customer_id, subscription_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter account required' }, { status: 403 });
    }

    if (recruiter.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invitation was sent to a different email' }, { status: 403 });
    }

    if (recruiter.agency_id) {
      return NextResponse.json({ error: 'Already part of an agency' }, { status: 409 });
    }

    // Get agency's Stripe customer for per-seat billing
    const agency = invitation.agencies;
    if (!agency?.stripe_customer_id) {
      return NextResponse.json({ error: 'Agency billing not configured' }, { status: 500 });
    }

    // Create per-seat subscription for this member
    // Use the recruiter monthly price ID
    const priceId = process.env.STRIPE_RECRUITER_MONTHLY_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: 'Recruiter price not configured' }, { status: 500 });
    }

    let subscriptionId: string | null = null;

    try {
      // Check if agency already has a subscription we can add an item to
      const subscriptions = await stripe.subscriptions.list({
        customer: agency.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        // Add a new item to existing agency subscription
        await stripe.subscriptionItems.create({
          subscription: subscriptions.data[0].id,
          price: priceId,
          quantity: 1,
          metadata: {
            recruiter_id: recruiter.id,
            seat_type: 'member',
          },
        });
        subscriptionId = subscriptions.data[0].id;
      } else {
        // Create new subscription on agency Stripe customer
        const subscription = await stripe.subscriptions.create({
          customer: agency.stripe_customer_id,
          items: [{ price: priceId, quantity: 1 }],
          metadata: {
            agency_id: invitation.agency_id,
            recruiter_id: recruiter.id,
            seat_type: 'member',
          },
        });
        subscriptionId = subscription.id;
      }
    } catch (stripeError) {
      console.error('Stripe subscription creation failed:', stripeError);
      return NextResponse.json({ error: 'Billing setup failed' }, { status: 500 });
    }

    // Cancel individual subscription if the recruiter had one
    if (recruiter.subscription_id) {
      try {
        await stripe.subscriptions.update(recruiter.subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (err) {
        console.error('Failed to cancel individual subscription:', err);
        // Non-blocking — proceed with agency join
      }
    }

    // Update recruiter to join agency
    await admin
      .from('recruiters')
      .update({
        agency_id: invitation.agency_id,
        agency_role: 'member',
        subscription_status: 'active', // Active via agency
      })
      .eq('id', recruiter.id);

    // Mark invitation as accepted
    await admin
      .from('agency_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation_id);

    trackServerEvent(recruiter.id, 'agency_seat_accepted', {
      agency_id: invitation.agency_id,
      agency_name: agency.name,
    });

    return NextResponse.json({
      status: 'accepted',
      agency_id: invitation.agency_id,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 3.4 — Remove Agency Seat API Route

**File to create:** `app/api/recruiter/agency/remove-seat/route.ts`

```typescript
// POST /api/recruiter/agency/remove-seat
// Body: { recruiter_id: string }
// Response: { status: 'removed' }
//
// Admin removes a member. Access revoked immediately,
// subscription item removed at end of billing period.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const removeSchema = z.object({
  recruiter_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await validateBody(req, removeSchema);
    if ('error' in result) return result.error;
    const { recruiter_id } = result.data;

    const admin = createServiceClient();

    // Verify caller is agency admin
    const { data: callerRecruiter } = await admin
      .from('recruiters')
      .select('id, agency_id, agency_role')
      .eq('auth_user_id', user.id)
      .single();

    if (!callerRecruiter?.agency_id || callerRecruiter.agency_role !== 'admin') {
      return NextResponse.json({ error: 'Agency admin access required' }, { status: 403 });
    }

    // Can't remove yourself (admin)
    if (recruiter_id === callerRecruiter.id) {
      return NextResponse.json({ error: 'Cannot remove yourself. Transfer admin first.' }, { status: 400 });
    }

    // Verify target is in the same agency
    const { data: targetRecruiter } = await admin
      .from('recruiters')
      .select('id, agency_id, agency_role')
      .eq('id', recruiter_id)
      .eq('agency_id', callerRecruiter.agency_id)
      .single();

    if (!targetRecruiter) {
      return NextResponse.json({ error: 'Recruiter not found in your agency' }, { status: 404 });
    }

    // Remove from agency (access revoked immediately)
    await admin
      .from('recruiters')
      .update({
        agency_id: null,
        agency_role: null,
        subscription_status: 'inactive', // No longer active via agency
      })
      .eq('id', recruiter_id);

    // Cancel their Stripe subscription item at period end
    // (handled via webhook when Stripe processes the cancellation)
    const { data: agency } = await admin
      .from('agencies')
      .select('stripe_customer_id')
      .eq('id', callerRecruiter.agency_id)
      .single();

    if (agency?.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: agency.stripe_customer_id,
          status: 'active',
        });

        for (const sub of subscriptions.data) {
          for (const item of sub.items.data) {
            if (item.metadata?.recruiter_id === recruiter_id) {
              await stripe.subscriptionItems.del(item.id, {
                proration_behavior: 'none', // Don't prorate — bill through end of period
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to remove Stripe subscription item:', err);
        // Non-blocking — access already revoked
      }
    }

    trackServerEvent(user.id, 'agency_seat_removed', {
      agency_id: callerRecruiter.agency_id,
      removed_recruiter_id: recruiter_id,
    });

    return NextResponse.json({ status: 'removed' });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 3.5 — Agency Credit Purchase API Route

**File to create:** `app/api/recruiter/agency/credits/purchase/route.ts`

```typescript
// POST /api/recruiter/agency/credits/purchase
// Body: { bundle: '10' | '25' | '50' | '100' | '200' }
// Response: { url: string } (Stripe Checkout URL)
//
// Any agency member can purchase credits (unless restricted by admin).
// Credits are tagged to the agency pool.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { handleApiError } from '@/lib/api/errors';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const CREDIT_BUNDLES: Record<string, { credits: number; price_eur: number }> = {
  '10':  { credits: 10,  price_eur: 75 },
  '25':  { credits: 25,  price_eur: 150 },
  '50':  { credits: 50,  price_eur: 250 },
  '100': { credits: 100, price_eur: 400 },
  '200': { credits: 200, price_eur: 1200 },
};

const purchaseSchema = z.object({
  bundle: z.enum(['10', '25', '50', '100', '200']),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'auth');
    if (limited) return limited;

    const result = await validateBody(req, purchaseSchema);
    if ('error' in result) return result.error;
    const { bundle } = result.data;

    const admin = createServiceClient();

    // Verify caller is an agency member
    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, agency_id, agency_role')
      .eq('auth_user_id', user.id)
      .single();

    if (!recruiter?.agency_id) {
      return NextResponse.json({ error: 'Agency membership required' }, { status: 403 });
    }

    // Check if credit purchases are restricted to admin
    const { data: agency } = await admin
      .from('agencies')
      .select('stripe_customer_id, credit_purchase_restricted')
      .eq('id', recruiter.agency_id)
      .single();

    if (agency?.credit_purchase_restricted && recruiter.agency_role !== 'admin') {
      return NextResponse.json({ error: 'Credit purchases restricted to admin' }, { status: 403 });
    }

    if (!agency?.stripe_customer_id) {
      return NextResponse.json({ error: 'Agency billing not configured' }, { status: 500 });
    }

    const bundleConfig = CREDIT_BUNDLES[bundle];

    const session = await stripe.checkout.sessions.create({
      customer: agency.stripe_customer_id,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${bundleConfig.credits} Crew Unlock Credits`,
            description: `${bundleConfig.credits} credits for unlocking crew profiles. Valid for 1 year.`,
          },
          unit_amount: bundleConfig.price_eur * 100, // cents
        },
        quantity: 1,
      }],
      metadata: {
        type: 'agency_credit_purchase',
        agency_id: recruiter.agency_id,
        recruiter_id: recruiter.id,
        bundle_size: bundle,
        credits: bundleConfig.credits.toString(),
        price_eur: bundleConfig.price_eur.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/recruiter/agency/seats?credits_purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/recruiter/agency/seats`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleApiError(err);
  }
}
```

---

## Part 4: Stripe Webhook Extension

### 4.1 — Add Agency Event Handling to Webhook

**File to modify:** `app/api/stripe/webhook/route.ts`

Add the following cases to the existing `switch (event.type)` block, **before** the closing `}` of the switch:

```typescript
    case 'checkout.session.completed': {
      const session = event.data.object;
      const metadata = session.metadata;

      // Handle agency credit purchase
      if (metadata?.type === 'agency_credit_purchase') {
        const agencyId = metadata.agency_id;
        const recruiterId = metadata.recruiter_id;
        const credits = parseInt(metadata.credits ?? '0', 10);
        const priceEur = parseFloat(metadata.price_eur ?? '0');

        if (agencyId && recruiterId && credits > 0) {
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

          const { error: creditError } = await supabase.from('recruiter_credits').insert({
            recruiter_id: recruiterId,
            agency_id: agencyId,
            credits_purchased: credits,
            credits_remaining: credits,
            price_eur: priceEur,
            stripe_payment_intent_id: session.payment_intent as string,
            expires_at: expiresAt,
          });

          if (creditError) {
            console.error('Failed to create agency credits:', creditError);
            return NextResponse.json({ error: 'Credit creation failed' }, { status: 500 });
          }

          trackServerEvent(recruiterId, 'agency_credits_purchased', {
            agency_id: agencyId,
            bundle_size: credits,
            price_eur: priceEur,
          });
        }
      }
      break;
    }
```

**Important:** Ensure the existing individual credit purchase webhook handling (from Sprint 19) is preserved. The `type` metadata distinguishes between individual (`recruiter_credit_purchase`) and agency (`agency_credit_purchase`) purchases.

---

## Part 5: Shortlist API Routes

### 5.1 — Shortlist CRUD

**File to create:** `app/api/recruiter/shortlists/route.ts`

```typescript
// GET /api/recruiter/shortlists — list all shortlists (agency or personal)
// POST /api/recruiter/shortlists — create new shortlist
// Body: { name: string }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const createShortlistSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createServiceClient();

    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, agency_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    let shortlists;
    if (recruiter.agency_id) {
      // Agency shortlists
      const { data } = await admin
        .from('shortlists')
        .select('*, shortlist_entries(count)')
        .eq('agency_id', recruiter.agency_id)
        .order('created_at', { ascending: false });
      shortlists = data;
    } else {
      // Personal shortlists
      const { data } = await admin
        .from('shortlists')
        .select('*, shortlist_entries(count)')
        .eq('recruiter_id', recruiter.id)
        .order('created_at', { ascending: false });
      shortlists = data;
    }

    return NextResponse.json({ shortlists: shortlists ?? [] });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'profileEdit', user.id);
    if (limited) return limited;

    const result = await validateBody(req, createShortlistSchema);
    if ('error' in result) return result.error;
    const { name } = result.data;

    const admin = createServiceClient();

    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, agency_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    const insertData = recruiter.agency_id
      ? { agency_id: recruiter.agency_id, name, created_by: recruiter.id }
      : { recruiter_id: recruiter.id, name, created_by: recruiter.id };

    const { data: shortlist, error } = await admin
      .from('shortlists')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create shortlist' }, { status: 500 });
    }

    trackServerEvent(recruiter.id, 'shortlist_created', {
      shortlist_id: shortlist.id,
      agency_id: recruiter.agency_id,
    });

    return NextResponse.json({ shortlist }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 5.2 — Shortlist Entry API

**File to create:** `app/api/recruiter/shortlists/[id]/entries/route.ts`

```typescript
// GET /api/recruiter/shortlists/[id]/entries — list entries with crew profile data
// POST /api/recruiter/shortlists/[id]/entries — add crew to shortlist
// Body: { crew_user_id: string, notes?: string }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const addEntrySchema = z.object({
  crew_user_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: shortlistId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createServiceClient();

    // Fetch entries with crew profile data (only unlocked fields)
    const { data: entries, error } = await admin
      .from('shortlist_entries')
      .select(`
        id, crew_user_id, added_by, notes, created_at,
        users:crew_user_id (
          id, full_name, display_name, handle, profile_photo_url,
          primary_role, departments, location_country, location_city,
          availability_status, bio
        )
      `)
      .eq('shortlist_id', shortlistId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    return NextResponse.json({ entries: entries ?? [] });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: shortlistId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await validateBody(req, addEntrySchema);
    if ('error' in result) return result.error;
    const { crew_user_id, notes } = result.data;

    const admin = createServiceClient();

    const { data: entry, error } = await admin
      .from('shortlist_entries')
      .insert({
        shortlist_id: shortlistId,
        crew_user_id,
        added_by: user.id,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already in this shortlist' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to add to shortlist' }, { status: 500 });
    }

    trackServerEvent(user.id, 'shortlist_entry_added', {
      shortlist_id: shortlistId,
      crew_user_id,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
```

---

## Part 6: Bulk Operations API Routes

### 6.1 — Bulk Unlock API

**File to create:** `app/api/recruiter/bulk-unlock/route.ts`

```typescript
// POST /api/recruiter/bulk-unlock
// Body: { crew_user_ids: string[] }
// Response: { status, unlocked_count, needed?, available? }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/api/errors';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const bulkUnlockSchema = z.object({
  crew_user_ids: z.array(z.string().uuid()).min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'search', user.id);
    if (limited) return limited;

    const result = await validateBody(req, bulkUnlockSchema);
    if ('error' in result) return result.error;
    const { crew_user_ids } = result.data;

    const { data, error } = await supabase.rpc('bulk_unlock_crew_profiles', {
      p_recruiter_id: user.id,
      p_crew_user_ids: crew_user_ids,
    });

    if (error) {
      return NextResponse.json({ error: 'Bulk unlock failed' }, { status: 500 });
    }

    const responseData = data as { status: string; unlocked_count?: number; needed?: number; available?: number };

    if (responseData.status === 'unlocked') {
      trackServerEvent(user.id, 'bulk_unlock_executed', {
        count: responseData.unlocked_count,
      });
    }

    return NextResponse.json(responseData);
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 6.2 — CSV Export API

**File to create:** `app/api/recruiter/export/csv/route.ts`

```typescript
// GET /api/recruiter/export/csv?shortlist_id=xxx (optional)
// Exports all unlocked profiles (or a specific shortlist) as CSV.
// Only includes profiles the recruiter/agency has legitimately unlocked.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';

export const runtime = 'nodejs';

function escapeCSV(value: string | null | undefined): string {
  if (!value) return '';
  const str = value.toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createServiceClient();

    // Get recruiter context
    const { data: recruiter } = await admin
      .from('recruiters')
      .select('id, agency_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!recruiter) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    const shortlistId = req.nextUrl.searchParams.get('shortlist_id');

    let crewUserIds: string[];

    if (shortlistId) {
      // Export a specific shortlist
      const { data: entries } = await admin
        .from('shortlist_entries')
        .select('crew_user_id')
        .eq('shortlist_id', shortlistId);

      crewUserIds = (entries ?? []).map((e) => e.crew_user_id);
    } else {
      // Export all unlocked profiles
      let query = admin.from('recruiter_unlocks').select('crew_user_id');

      if (recruiter.agency_id) {
        // Agency: all unlocks by agency members
        const { data: members } = await admin
          .from('recruiters')
          .select('id')
          .eq('agency_id', recruiter.agency_id);
        const memberIds = (members ?? []).map((m) => m.id);
        query = query.in('recruiter_id', memberIds);
      } else {
        query = query.eq('recruiter_id', recruiter.id);
      }

      const { data: unlocks } = await query;
      crewUserIds = (unlocks ?? []).map((u) => u.crew_user_id);
    }

    if (crewUserIds.length === 0) {
      return NextResponse.json({ error: 'No profiles to export' }, { status: 404 });
    }

    // Verify all profiles are actually unlocked
    const unlockedFilter = recruiter.agency_id
      ? admin
          .from('recruiter_unlocks')
          .select('crew_user_id')
          .in('recruiter_id', (await admin.from('recruiters').select('id').eq('agency_id', recruiter.agency_id)).data?.map((m) => m.id) ?? [])
      : admin
          .from('recruiter_unlocks')
          .select('crew_user_id')
          .eq('recruiter_id', recruiter.id);

    const { data: unlockedProfiles } = await unlockedFilter;
    const unlockedIds = new Set((unlockedProfiles ?? []).map((u) => u.crew_user_id));

    // Only export unlocked profiles
    const verifiedIds = crewUserIds.filter((id) => unlockedIds.has(id));

    if (verifiedIds.length === 0) {
      return NextResponse.json({ error: 'No unlocked profiles to export' }, { status: 404 });
    }

    // Fetch full profile data for verified IDs
    const { data: profiles } = await admin
      .from('users')
      .select(`
        full_name, display_name, primary_role, departments,
        location_country, location_city, email, phone, bio
      `)
      .in('id', verifiedIds);

    // Fetch endorsement counts
    const { data: endorsementCounts } = await admin
      .rpc('search_crew', {
        p_filters: {},
        p_page: 1,
        p_page_size: verifiedIds.length,
      });

    // Build CSV
    const GDPR_DISCLAIMER = '# This data is exported for recruitment purposes only. It contains personal data protected under GDPR. Do not share, distribute, or use for purposes other than recruitment.';

    const headers = ['Name', 'Role', 'Department', 'Location', 'Email', 'Phone', 'Endorsement Count', 'Bio'];
    const rows = (profiles ?? []).map((p) => [
      escapeCSV(p.full_name || p.display_name),
      escapeCSV(p.primary_role),
      escapeCSV(Array.isArray(p.departments) ? p.departments.join('; ') : ''),
      escapeCSV([p.location_city, p.location_country].filter(Boolean).join(', ')),
      escapeCSV(p.email),
      escapeCSV(p.phone),
      '', // Endorsement count placeholder
      escapeCSV(p.bio?.slice(0, 200)),
    ]);

    const csv = [
      GDPR_DISCLAIMER,
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    trackServerEvent(recruiter.id, 'csv_export_executed', {
      profile_count: verifiedIds.length,
      agency_id: recruiter.agency_id,
      shortlist_id: shortlistId,
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="yachtielink-crew-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
```

---

## Part 7: NLP Search API Route

### 7.1 — NLP Search Endpoint

**File to create:** `app/api/recruiter/search/nlp/route.ts`

```typescript
// POST /api/recruiter/search/nlp
// Body: { query: string, limit?: number, availability_only?: boolean,
//         department?: string, min_endorsements?: number }
// Response: { results: [...], count: number }
//
// Embeds the query, calls search_crew_nlp RPC,
// generates match explanations (with caching), returns ranked results.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { generateMatchExplanation, hashQuery } from '@/lib/ai/match-explanation';
import { logAICost } from '@/lib/ai/cost-logger';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';
import { validateBody } from '@/lib/validation/validate';

export const runtime = 'nodejs';

const nlpSearchSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(50).optional().default(20),
  availability_only: z.boolean().optional().default(false),
  department: z.string().optional(),
  min_endorsements: z.number().int().min(0).optional().default(0),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'search', user.id);
    if (limited) return limited;

    const result = await validateBody(req, nlpSearchSchema);
    if ('error' in result) return result.error;
    const { query, limit, availability_only, department, min_endorsements } = result.data;

    // 1. Embed the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (err) {
      console.error('Query embedding failed:', err);
      return NextResponse.json({ error: 'Search temporarily unavailable' }, { status: 503 });
    }

    logAICost({
      operation: 'nlp_search_query',
      model: 'text-embedding-3-small',
      tokens_input: Math.ceil(query.length / 4), // Approximate
      tokens_output: 0,
      cost_eur: 0.00002, // ~EUR 0.02/1M tokens
      recruiter_id: user.id,
      metadata: { query_length: query.length },
    });

    // 2. Vector search via RPC
    // Format embedding as Postgres vector literal
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const { data: searchData, error: searchError } = await supabase.rpc('search_crew_nlp', {
      p_query_embedding: embeddingStr,
      p_recruiter_id: user.id,
      p_limit: limit,
      p_availability_only: availability_only,
      p_department: department ?? null,
      p_min_endorsements: min_endorsements,
    });

    if (searchError) {
      console.error('NLP search RPC failed:', searchError);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const searchResults = (searchData as { results: any[]; count: number }) ?? { results: [], count: 0 };
    const results = searchResults.results ?? [];

    // 3. Generate match explanations (with caching)
    const queryHash = hashQuery(query);
    const admin = createServiceClient();

    // Check cache for existing explanations
    const { data: cachedExplanations } = await admin
      .from('nlp_match_cache')
      .select('crew_user_id, explanation')
      .eq('query_hash', queryHash)
      .in('crew_user_id', results.map((r: any) => r.id))
      .gt('expires_at', new Date().toISOString());

    const cachedMap = new Map(
      (cachedExplanations ?? []).map((c) => [c.crew_user_id, c.explanation]),
    );

    // Generate explanations for uncached results
    const explanations: Record<string, string> = {};
    const uncachedResults = results.filter((r: any) => !cachedMap.has(r.id));

    if (uncachedResults.length > 0) {
      const newExplanations = await Promise.allSettled(
        uncachedResults.map(async (r: any) => {
          try {
            const explanation = await generateMatchExplanation({
              query,
              profileText: r.profile_text ?? '',
              primaryRole: r.primary_role,
              endorsementCount: r.endorsement_count ?? 0,
              yachtCount: r.yacht_count ?? 0,
              seaTimeDays: r.total_sea_time_days ?? 0,
            });

            // Cache the explanation (24 hour TTL)
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            admin.from('nlp_match_cache').upsert({
              query_hash: queryHash,
              crew_user_id: r.id,
              explanation,
              expires_at: expiresAt,
            }, { onConflict: 'query_hash,crew_user_id' }).then(({ error }) => {
              if (error) console.error('Cache write failed:', error);
            });

            return { id: r.id, explanation };
          } catch (err) {
            return { id: r.id, explanation: '' };
          }
        }),
      );

      for (const result of newExplanations) {
        if (result.status === 'fulfilled') {
          explanations[result.value.id] = result.value.explanation;
        }
      }

      // Log AI cost for explanations
      const generatedCount = uncachedResults.length;
      logAICost({
        operation: 'match_explanation',
        model: 'gpt-5',
        tokens_input: generatedCount * 200, // Approximate
        tokens_output: generatedCount * 50,
        cost_eur: generatedCount * 0.001, // ~EUR 0.001/explanation
        recruiter_id: user.id,
        metadata: { query_hash: queryHash, result_count: generatedCount },
      });
    }

    // Merge explanations into results
    const enrichedResults = results.map((r: any) => ({
      ...r,
      match_explanation: cachedMap.get(r.id) ?? explanations[r.id] ?? '',
      // Remove profile_text from response (internal use only)
      profile_text: undefined,
    }));

    const latencyMs = Date.now() - startTime;

    trackServerEvent(user.id, 'nlp_search_executed', {
      query_length: query.length,
      result_count: searchResults.count,
      latency_ms: latencyMs,
      cached_explanations: cachedMap.size,
      generated_explanations: uncachedResults.length,
    });

    return NextResponse.json({
      results: enrichedResults,
      count: searchResults.count,
      latency_ms: latencyMs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
```

---

## Part 8: Cron Jobs

### 8.1 — Nightly Embedding Re-Index

**File to create:** `app/api/cron/embedding-reindex/route.ts`

```typescript
// Nightly cron: processes the embedding queue and re-embeds stale profiles.
// Also does a full sweep to catch any missed updates.
// Schedule: 3:00 UTC daily (low traffic period)

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { logAICost } from '@/lib/ai/cost-logger';
import { handleApiError } from '@/lib/api/errors';

export const runtime = 'nodejs';

const BATCH_SIZE = 100; // Process 100 profiles at a time

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization');
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    let processed = 0;
    let errors = 0;

    // Phase 1: Process the incremental queue
    const { data: queueItems } = await supabase
      .from('embedding_queue')
      .select('id, user_id')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(500);

    if (queueItems && queueItems.length > 0) {
      // Deduplicate by user_id
      const uniqueUserIds = [...new Set(queueItems.map((q) => q.user_id))];

      for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
        const batch = uniqueUserIds.slice(i, i + BATCH_SIZE);

        // Get profile texts
        const profileTexts: { userId: string; text: string }[] = [];
        for (const userId of batch) {
          const { data: textData } = await supabase.rpc('compose_profile_text', {
            p_user_id: userId,
          });
          if (textData && typeof textData === 'string' && textData.trim().length > 0) {
            profileTexts.push({ userId, text: textData });
          }
        }

        if (profileTexts.length === 0) continue;

        try {
          const embeddings = await generateEmbeddingsBatch(profileTexts.map((p) => p.text));

          for (let j = 0; j < profileTexts.length; j++) {
            const { error: upsertError } = await supabase
              .from('crew_profile_embeddings')
              .upsert({
                user_id: profileTexts[j].userId,
                embedding: `[${embeddings[j].join(',')}]`,
                profile_text: profileTexts[j].text,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });

            if (upsertError) {
              console.error(`Embedding upsert failed for ${profileTexts[j].userId}:`, upsertError);
              errors++;
            } else {
              processed++;
            }
          }
        } catch (err) {
          console.error('Batch embedding failed:', err);
          errors += batch.length;
        }
      }

      // Mark queue items as processed
      await supabase
        .from('embedding_queue')
        .update({ processed: true })
        .in('id', queueItems.map((q) => q.id));
    }

    // Phase 2: Full sweep — find recruiter-visible users without embeddings
    const { data: missingEmbeddings } = await supabase
      .from('users')
      .select('id')
      .eq('recruiter_visible', true)
      .eq('onboarding_complete', true)
      .not('id', 'in', `(SELECT user_id FROM crew_profile_embeddings)`)
      .limit(500);

    if (missingEmbeddings && missingEmbeddings.length > 0) {
      for (let i = 0; i < missingEmbeddings.length; i += BATCH_SIZE) {
        const batch = missingEmbeddings.slice(i, i + BATCH_SIZE);
        const profileTexts: { userId: string; text: string }[] = [];

        for (const user of batch) {
          const { data: textData } = await supabase.rpc('compose_profile_text', {
            p_user_id: user.id,
          });
          if (textData && typeof textData === 'string' && textData.trim().length > 0) {
            profileTexts.push({ userId: user.id, text: textData });
          }
        }

        if (profileTexts.length === 0) continue;

        try {
          const embeddings = await generateEmbeddingsBatch(profileTexts.map((p) => p.text));

          for (let j = 0; j < profileTexts.length; j++) {
            const { error: upsertError } = await supabase
              .from('crew_profile_embeddings')
              .upsert({
                user_id: profileTexts[j].userId,
                embedding: `[${embeddings[j].join(',')}]`,
                profile_text: profileTexts[j].text,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id' });

            if (!upsertError) processed++;
            else errors++;
          }
        } catch (err) {
          console.error('Sweep batch embedding failed:', err);
          errors += batch.length;
        }
      }
    }

    // Phase 3: Clean up expired match explanation cache
    await supabase
      .from('nlp_match_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Phase 4: Clean up old processed queue items (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('embedding_queue')
      .delete()
      .eq('processed', true)
      .lt('created_at', sevenDaysAgo);

    logAICost({
      operation: 'embedding',
      model: 'text-embedding-3-small',
      tokens_input: processed * 500, // Approximate
      tokens_output: 0,
      cost_eur: processed * 0.00001, // ~EUR 0.01 per 1000 profiles
      metadata: { processed, errors, source: 'nightly_cron' },
    });

    return NextResponse.json({ processed, errors });
  } catch (e) {
    return handleApiError(e);
  }
}
```

### 8.2 — Credit Expiry Cron Extension

**File to modify:** `app/api/cron/credit-expiry/route.ts` (Sprint 19 — extend for agency credits)

If this file does not yet exist, create it:

**File to create:** `app/api/cron/credit-expiry/route.ts`

```typescript
// Monthly cron: expires credits where expires_at < now()
// Notifies recruiter/agency admin of expired credits.
// Schedule: 1st of each month at 2:00 UTC

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { handleApiError } from '@/lib/api/errors';
import { trackServerEvent } from '@/lib/analytics/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization');
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Find expired credits with remaining balance
    const { data: expiredCredits, error } = await supabase
      .from('recruiter_credits')
      .select('id, recruiter_id, agency_id, credits_remaining')
      .gt('credits_remaining', 0)
      .lt('expires_at', new Date().toISOString());

    if (error || !expiredCredits?.length) {
      return NextResponse.json({ expired: 0 });
    }

    let expired = 0;
    for (const credit of expiredCredits) {
      const { error: updateError } = await supabase
        .from('recruiter_credits')
        .update({ credits_remaining: 0 })
        .eq('id', credit.id);

      if (!updateError) {
        expired += credit.credits_remaining;
        trackServerEvent(credit.recruiter_id, 'recruiter_credits_expired', {
          credits_expired: credit.credits_remaining,
          agency_id: credit.agency_id,
        });
      }
    }

    return NextResponse.json({ expired });
  } catch (e) {
    return handleApiError(e);
  }
}
```

### 8.3 — Vercel Cron Configuration

**File to modify:** `vercel.json`

Add the new cron entries to the existing `crons` array:

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
      "path": "/api/cron/embedding-reindex",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/credit-expiry",
      "schedule": "0 2 1 * *"
    }
  ]
}
```

**Schedule rationale:**
- Embedding re-index at 03:00 UTC daily — low traffic period, before recruiter working hours in Europe.
- Credit expiry at 02:00 UTC on 1st of each month — monthly cleanup before daily activity.

---

## Part 9: Rate Limit Extension

**File to modify:** `lib/rate-limit/helpers.ts`

Add new rate limit tier for NLP search:

```typescript
// Add to RATE_LIMITS object
nlpSearch:         { limit: 20,  window: 60,                scope: 'user' as const }, // 20/min/user (NLP is heavier than filter search)
```

Update the NLP search route to use `applyRateLimit(req, 'nlpSearch', user.id)` instead of the general `search` tier.

---

## Part 10: Component Specifications

### 10.1 — Agency Creation Page

**File to create:** `app/(protected)/recruiter/agency/create/page.tsx`

Server component. Only accessible to recruiters with active subscriptions who are not already in an agency.

**Props/state:**
- `recruiterData`: fetched server-side — `id`, `agency_id`, `subscription_status`
- Redirect to `/recruiter/dashboard` if already in an agency

**UI (375px):**
```
┌─────────────────────────────────────────────────┐
│ Create Agency Account                            │
│                                                 │
│ Upgrade your account to a multi-seat agency.     │
│ You'll become the admin with full control.       │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Agency Name                                 │ │
│ │ [                              ]            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ What you get:                                    │
│ · Invite team members (EUR 29/seat/month)        │
│ · Shared credit pool across your team            │
│ · Shared shortlists for candidate tracking       │
│ · Agency-level analytics dashboard               │
│ · Bulk unlock and CSV export                     │
│                                                 │
│ [ Create Agency ]                                │
└─────────────────────────────────────────────────┘
```

### 10.2 — Agency Seat Management Page

**File to create:** `app/(protected)/recruiter/agency/seats/page.tsx`

Server component. Admin-only page for managing agency members.

**Data fetches (Promise.all):**
- Agency details: `agencies` where `admin_recruiter_id = user.id`
- Agency members: `recruiters` where `agency_id = agency.id`
- Pending invitations: `agency_invitations` where `agency_id = agency.id` AND `status = 'pending'`
- Credit balance: `recruiter_credits` where `agency_id = agency.id` aggregate remaining

**UI (375px):**
```
┌─────────────────────────────────────────────────┐
│ Agency: [Agency Name]                            │
│                                                 │
│ Credits: 47 remaining · 12 expiring in 30 days  │
│ [ Purchase Credits ]                             │
│                                                 │
│ Team Members (3 seats · EUR 87/month)            │
│ ┌─────────────────────────────────────────────┐ │
│ │ 👤 You (Admin)           admin@agency.com   │ │
│ │ 👤 Sarah Jones           sarah@agency.com   │ │
│ │    12 unlocks this month     [ Remove ]     │ │
│ │ 👤 Mike Chen             mike@agency.com    │ │
│ │    8 unlocks this month      [ Remove ]     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Pending Invitations                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ new@agency.com    Expires: 28 Mar           │ │
│ │                            [ Cancel ]       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ Invite New Member ]                            │
│                                                 │
│ [ ] Restrict credit purchases to admin only      │
└─────────────────────────────────────────────────┘
```

### 10.3 — Agency Analytics Page

**File to create:** `app/(protected)/recruiter/agency/analytics/page.tsx`

Server component. Admin-only. Calls `get_agency_analytics()` RPC.

**Data fetches:**
- `get_agency_analytics(agency_id, period)` — all analytics data in one RPC call
- Period selector: week, month, quarter, year, all time

**Sections:**
1. **Summary cards** (grid): Total unlocks (period), Credits remaining, Seats, Credits expiring soon
2. **Per-seat breakdown** (table): Name, Unlocks this period, Credits purchased
3. **Credit usage bar** (visual): Purchased vs Used vs Remaining vs Expiring

### 10.4 — Shortlists Page

**File to create:** `app/(protected)/recruiter/shortlists/page.tsx`

Server component. Lists all shortlists for the recruiter's scope (agency or personal).

**Data fetches:**
- `GET /api/recruiter/shortlists` — list with entry counts

**UI:**
```
┌─────────────────────────────────────────────────┐
│ Shortlists                      [ + New List ]   │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Med Season Chief Stews           12 crew    │ │
│ │ Created by Sarah · 3 days ago        →      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Engineers — Refit Q3             8 crew      │ │
│ │ Created by you · 1 week ago          →      │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 10.5 — Shortlist Detail Page

**File to create:** `app/(protected)/recruiter/shortlists/[id]/page.tsx`

Server component. Shows crew profiles in the shortlist with notes and actions.

**Data fetches:**
- `GET /api/recruiter/shortlists/[id]/entries`

**Actions per entry:** View profile, Edit notes, Remove from shortlist
**Bulk actions:** Export CSV, Bulk unlock (for any locked entries)

### 10.6 — Enhanced Recruiter Search Page

**File to modify:** The existing recruiter search page from Sprint 19 (under `/recruiter/search`).

Add above the existing filter bar:

**NLP Search Input:**
```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔍 Describe the crew you're looking for...  │ │
│ │                                             │ │
│ │ e.g. "Chief stew, 60m charter, French,      │ │
│ │ silver service, available May"               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ AI Search ]     or use filters below ↓        │
│                                                 │
│ ── Existing filter bar (Sprint 19) ──           │
└─────────────────────────────────────────────────┘
```

**Client component additions (NLP search state):**

```typescript
interface NlpSearchState {
  query: string;
  isNlpMode: boolean;
  nlpResults: NlpSearchResult[];
  nlpLoading: boolean;
  latencyMs: number | null;
}

interface NlpSearchResult {
  id: string;
  handle: string | null;
  profile_photo_url: string | null;
  primary_role: string | null;
  departments: string[] | null;
  location_country: string | null;
  location_city: string | null;
  availability_status: string | null;
  similarity_score: number;
  match_explanation: string;
  total_sea_time_days: number;
  yacht_count: number;
  endorsement_count: number;
  endorser_count: number;
  endorsement_yacht_count: number;
  is_unlocked: boolean;
  full_name: string | null;
  display_name: string | null;
}
```

**Behaviour:**
- When NLP query is submitted: set `isNlpMode = true`, call `POST /api/recruiter/search/nlp`, display results with match explanations
- When filters are used (no NLP query): use existing `search_crew_recruiter()` flow
- Both modes share the same result card components (locked/unlocked states)
- NLP results show a similarity badge and match explanation text below the card

### 10.7 — NLP Search Result Card Enhancement

**File to modify:** The existing `RecruiterSearchResultCard` component from Sprint 19.

Add to each card when in NLP mode:

```typescript
{result.match_explanation && (
  <div className="mt-2 px-3 py-2 bg-[var(--color-navy-50)] rounded-lg">
    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
      {result.match_explanation}
    </p>
  </div>
)}

{result.similarity_score && (
  <span className="text-[10px] font-medium text-[var(--color-navy-500)] bg-[var(--color-navy-50)] px-2 py-0.5 rounded-full">
    {Math.round(result.similarity_score * 100)}% match
  </span>
)}
```

### 10.8 — Bulk Select Controls

**File to create:** `components/recruiter/BulkSelectBar.tsx`

Client component. Sticky bar at bottom of search results when multi-select is active.

```typescript
'use client';

interface BulkSelectBarProps {
  selectedCount: number;
  onUnlock: () => void;
  onAddToShortlist: () => void;
  onClear: () => void;
  isUnlocking: boolean;
  creditBalance: number;
}

export function BulkSelectBar({
  selectedCount,
  onUnlock,
  onAddToShortlist,
  onClear,
  isUnlocking,
  creditBalance,
}: BulkSelectBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] p-4 flex items-center justify-between gap-3 z-50 shadow-lg">
      <span className="text-sm font-medium text-[var(--color-text-primary)]">
        {selectedCount} selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="text-xs text-[var(--color-text-secondary)] px-3 py-2"
        >
          Clear
        </button>
        <button
          onClick={onAddToShortlist}
          className="text-xs font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] px-4 py-2 rounded-lg"
        >
          + Shortlist
        </button>
        <button
          onClick={onUnlock}
          disabled={isUnlocking || creditBalance < selectedCount}
          className="text-xs font-semibold bg-[var(--color-navy-500)] text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isUnlocking ? 'Unlocking...' : `Unlock ${selectedCount} — ${selectedCount} credits`}
        </button>
      </div>
    </div>
  );
}
```

---

## Part 11: Environment Variables

Add to `.env.local` (and Vercel environment settings):

```
# Sprint 20 — Agency Plans
STRIPE_RECRUITER_MONTHLY_PRICE_ID=price_xxx  # EUR 29/month recruiter seat price

# Already exists from Sprint 16/17:
# OPENAI_API_KEY=sk-xxx
# CRON_SECRET=xxx
```

No new environment variables are needed for the OpenAI integration (uses existing `OPENAI_API_KEY`).

---

## Part 12: PostHog Event Specifications

| Event | Properties | Trigger |
|-------|-----------|---------|
| `agency_created` | `agency_id`, `agency_name`, `seat_count` | Agency creation succeeds |
| `agency_seat_invited` | `agency_id`, `invited_email` | Invitation sent |
| `agency_seat_accepted` | `agency_id`, `agency_name` | Invitation accepted |
| `agency_seat_removed` | `agency_id`, `removed_recruiter_id` | Admin removes member |
| `agency_credits_purchased` | `agency_id`, `bundle_size`, `price_eur` | Stripe webhook confirms agency credit purchase |
| `nlp_search_executed` | `query_length`, `result_count`, `latency_ms`, `cached_explanations`, `generated_explanations` | NLP search completes |
| `nlp_match_explanation_generated` | `query_hash`, `result_count` | Batch explanation generation |
| `bulk_unlock_executed` | `count`, `agency_id` | Bulk unlock RPC succeeds |
| `csv_export_executed` | `profile_count`, `agency_id`, `shortlist_id` | CSV download initiated |
| `shortlist_created` | `shortlist_id`, `agency_id` | Shortlist created |
| `shortlist_entry_added` | `shortlist_id`, `crew_user_id` | Crew added to shortlist |
| `recruiter_credits_expired` | `credits_expired`, `agency_id` | Monthly cron expires credits |

---

## Part 13: File-by-File Implementation Order

Execute in this order. Each step builds on the previous — do not skip ahead.

### Phase A: Database Foundation (Day 1–2)

1. `supabase/migrations/20260322000004_sprint20_agency_nlp.sql` — full migration (sections 1.1–1.16)
2. Run migration: `npx supabase db push` or apply via dashboard
3. Verify: all tables created, indexes exist, RLS policies active, RPCs callable

### Phase B: AI Infrastructure (Day 2–3)

4. `lib/ai/crew-embeddings.ts` — crew-profile-specific embedding helpers (imports from Sprint 17's `lib/ai/embeddings.ts`)
5. `lib/ai/match-explanation.ts` — GPT-5 match explanation generator
6. `lib/ai/cost-logger.ts` — AI cost logging utility
7. Test: generate an embedding, generate a match explanation, verify cost log entries

### Phase C: Agency Account Model (Day 3–5)

8. `app/api/recruiter/agency/create/route.ts` — agency creation
9. `app/api/recruiter/agency/invite/route.ts` — seat invitations
10. `app/api/recruiter/agency/accept/route.ts` — invitation acceptance
11. `app/api/recruiter/agency/remove-seat/route.ts` — seat removal
12. `app/api/recruiter/agency/credits/purchase/route.ts` — agency credit purchase
13. Extend `app/api/stripe/webhook/route.ts` — add `checkout.session.completed` handler for agency credits
14. Test: create agency, invite seat, accept, purchase credits, remove seat

### Phase D: Shortlists (Day 5–6)

15. `app/api/recruiter/shortlists/route.ts` — list + create
16. `app/api/recruiter/shortlists/[id]/entries/route.ts` — entries CRUD
17. Test: create shortlist, add entries, list entries

### Phase E: Bulk Operations (Day 6–7)

18. `app/api/recruiter/bulk-unlock/route.ts` — bulk unlock endpoint
19. `app/api/recruiter/export/csv/route.ts` — CSV export endpoint
20. Test: bulk unlock 3 profiles, export CSV, verify GDPR disclaimer

### Phase F: NLP Search (Day 7–9)

21. `app/api/recruiter/search/nlp/route.ts` — NLP search endpoint
22. `app/api/cron/embedding-reindex/route.ts` — nightly embedding cron
23. `app/api/cron/credit-expiry/route.ts` — monthly credit expiry cron
24. Update `vercel.json` — add new cron entries
25. Extend `lib/rate-limit/helpers.ts` — add `nlpSearch` tier
26. Run initial embedding batch: trigger the cron manually or write a one-off script
27. Test: NLP search with various queries, verify <3s latency, verify match explanations

### Phase G: Agency UI Pages (Day 9–11)

28. `app/(protected)/recruiter/agency/create/page.tsx` — agency creation page
29. `app/(protected)/recruiter/agency/seats/page.tsx` — seat management page
30. `app/(protected)/recruiter/agency/analytics/page.tsx` — analytics dashboard
31. `app/(protected)/recruiter/shortlists/page.tsx` — shortlist list page
32. `app/(protected)/recruiter/shortlists/[id]/page.tsx` — shortlist detail page

### Phase H: Search UI Enhancement (Day 11–13)

33. Modify existing recruiter search page — add NLP search input bar
34. `components/recruiter/BulkSelectBar.tsx` — bulk selection controls
35. Modify existing search result cards — add match explanation display
36. Add multi-select checkboxes to result cards
37. Wire "Add to shortlist" flow from search results and bulk bar

### Phase I: Polish + Testing (Day 13–14)

38. Mobile responsiveness audit (375px) on all new pages
39. Error state handling for all new API routes
40. Loading states for all new async operations
41. PostHog event verification
42. End-to-end flow testing

---

## Part 14: Testing Checklist

### Agency Account Model

- [ ] Individual recruiter can create an agency (POST `/api/recruiter/agency/create`)
- [ ] Agency creation fails if recruiter already in an agency (409)
- [ ] Agency creation fails without active subscription (402)
- [ ] Stripe customer metadata updated with agency info
- [ ] Recruiter's `agency_id` and `agency_role = 'admin'` set after creation
- [ ] Agency admin can invite a seat by email
- [ ] Invitation email sent with correct agency name and accept link
- [ ] Duplicate pending invitation rejected (409)
- [ ] Invited recruiter can accept invitation
- [ ] Invitation expires after 7 days
- [ ] Accepting creates per-seat Stripe subscription item
- [ ] Individual subscription cancelled at period end on agency join
- [ ] Admin can remove a member (access revoked immediately)
- [ ] Admin cannot remove themselves
- [ ] Removed member's Stripe subscription item cancelled
- [ ] PostHog events fire: `agency_created`, `agency_seat_invited`, `agency_seat_accepted`, `agency_seat_removed`

### Shared Credit Pool

- [ ] Agency credit purchase creates Stripe Checkout with agency customer
- [ ] Webhook creates `recruiter_credits` row with `agency_id`
- [ ] Agency member unlock deducts from agency pool (not personal credits)
- [ ] FIFO deduction: oldest expiring credits used first
- [ ] Individual recruiter credits remain personal when joining agency
- [ ] Credit balance shows agency pool for agency members
- [ ] `credit_purchase_restricted` toggle blocks non-admin purchases
- [ ] PostHog: `agency_credits_purchased` fires with bundle_size

### Shortlists

- [ ] Agency member can create an agency shortlist
- [ ] Individual recruiter can create a personal shortlist
- [ ] All agency members can see agency shortlists
- [ ] Individual recruiter sees only personal shortlists
- [ ] Add crew to shortlist succeeds
- [ ] Duplicate crew in same shortlist rejected (409)
- [ ] Notes field saved and retrievable
- [ ] PostHog: `shortlist_created`, `shortlist_entry_added` fire

### Bulk Unlock

- [ ] Select 3 profiles, bulk unlock succeeds, 3 credits deducted
- [ ] Already-unlocked profiles excluded from credit charge
- [ ] Insufficient credits returns error with needed vs available counts
- [ ] Atomic: if any part fails, no credits deducted
- [ ] Agency member bulk unlock draws from agency pool
- [ ] PostHog: `bulk_unlock_executed` fires with correct count
- [ ] Max 50 profiles per bulk unlock request

### CSV Export

- [ ] Export returns CSV with correct headers
- [ ] GDPR disclaimer present as first line
- [ ] Only unlocked profiles included
- [ ] Locked profiles excluded even if in shortlist
- [ ] Agency export includes profiles unlocked by any agency member
- [ ] Shortlist-specific export works (`?shortlist_id=xxx`)
- [ ] Content-Disposition header sets correct filename
- [ ] PostHog: `csv_export_executed` fires

### NLP Search

- [ ] Natural language query returns semantically ranked results
- [ ] Query "Chief stew for 60m charter" returns relevant chief stews
- [ ] Query "French-speaking bosun" matches crew with French language mentions in endorsements
- [ ] Results include similarity score (0–1)
- [ ] Match explanations generated for each result
- [ ] Match explanations cached: second identical query uses cache (faster)
- [ ] Cache expires after 24 hours
- [ ] Filter-based search still works alongside NLP search
- [ ] `availability_only` filter applied correctly in NLP mode
- [ ] `department` filter applied correctly in NLP mode
- [ ] `min_endorsements` filter applied correctly in NLP mode
- [ ] Locked/unlocked profile states correct in NLP results
- [ ] Agency unlocks visible to all agency members in NLP results
- [ ] End-to-end latency <3 seconds (embedding + vector search + explanations)
- [ ] GPT-5 failure: results shown without explanations (graceful fallback)
- [ ] PostHog: `nlp_search_executed` fires with latency_ms
- [ ] AI cost logged in `ai_usage_log` for both embedding and explanation

### Embedding Pipeline

- [ ] `compose_profile_text()` returns correct concatenation of profile fields
- [ ] Profile text includes: role, department, bio, location, yacht history, certs, endorsement excerpts
- [ ] Trigger: profile bio update queues re-embed
- [ ] Trigger: new endorsement queues re-embed for recipient
- [ ] Trigger: new attachment queues re-embed
- [ ] Trigger: new certification queues re-embed
- [ ] Only `recruiter_visible = true` users are queued
- [ ] Nightly cron processes queue and embeds missing profiles
- [ ] Nightly cron cleans up expired match cache
- [ ] Nightly cron cleans up old processed queue items
- [ ] IVFFlat index exists on `crew_profile_embeddings`

### Credit Expiry Cron

- [ ] Cron finds credits with `expires_at < now()` and `credits_remaining > 0`
- [ ] Credits zeroed out on expiry
- [ ] PostHog: `recruiter_credits_expired` fires
- [ ] Cron authorized via CRON_SECRET

### RLS Policies

- [ ] Agency members can read their agency's data
- [ ] Agency members cannot read other agencies' data
- [ ] Individual recruiters cannot see agency-scoped data
- [ ] Agency admin can update agency settings
- [ ] Non-admin cannot update agency settings
- [ ] Shortlist entries readable by shortlist scope (agency or personal)
- [ ] `crew_profile_embeddings` not directly readable (accessed via RPC)
- [ ] `nlp_match_cache` not directly readable (accessed via service role)
- [ ] `embedding_queue` not directly readable (service role only)

### Responsive (375px)

- [ ] Agency creation page: form and benefits list fit without overflow
- [ ] Seat management page: member list readable, invite button accessible
- [ ] Analytics page: summary cards stack vertically, table scrolls horizontally
- [ ] Shortlist pages: list and detail views readable
- [ ] NLP search input: text area usable on mobile keyboard
- [ ] Bulk select bar: fixed bottom bar doesn't overlap nav
- [ ] Match explanation text: readable without truncation
- [ ] CSV export button accessible on mobile

### Cross-Feature

- [ ] Non-agency recruiter: all features work in personal mode (shortlists, credits, search)
- [ ] Agency recruiter: all features scoped to agency (shared pool, shared shortlists)
- [ ] NLP search and filter search coexist — switching between modes works
- [ ] Recruiter cannot access crew-side features (D-024)
- [ ] All new pages accessible from recruiter navigation

---

## Part 15: Rollback Plan

### If Migration Fails

```sql
-- Reverse Sprint 20 migration (run manually if needed)

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_queue_cert_reembed ON public.certifications;
DROP TRIGGER IF EXISTS trigger_queue_attachment_reembed ON public.attachments;
DROP TRIGGER IF EXISTS trigger_queue_endorsement_reembed ON public.endorsements;
DROP TRIGGER IF EXISTS trigger_queue_profile_reembed ON public.users;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.queue_cert_reembed();
DROP FUNCTION IF EXISTS public.queue_attachment_reembed();
DROP FUNCTION IF EXISTS public.queue_endorsement_reembed();
DROP FUNCTION IF EXISTS public.queue_profile_reembed();

-- Drop RPCs
DROP FUNCTION IF EXISTS public.compose_profile_text(uuid);
DROP FUNCTION IF EXISTS public.bulk_unlock_crew_profiles(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.unlock_crew_profile(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_agency_analytics(uuid, text);
DROP FUNCTION IF EXISTS public.search_crew_nlp(vector, uuid, int, boolean, text, int);

-- Drop tables (reverse dependency order)
DROP TABLE IF EXISTS public.embedding_queue;
DROP TABLE IF EXISTS public.nlp_match_cache;
DROP TABLE IF EXISTS public.crew_profile_embeddings;
DROP TABLE IF EXISTS public.shortlist_entries;
DROP TABLE IF EXISTS public.shortlists;
DROP TABLE IF EXISTS public.agency_invitations;

-- Remove columns from recruiter_credits
ALTER TABLE public.recruiter_credits DROP COLUMN IF EXISTS agency_id;

-- Remove columns from recruiters
ALTER TABLE public.recruiters DROP CONSTRAINT IF EXISTS agency_role_consistency;
ALTER TABLE public.recruiters DROP CONSTRAINT IF EXISTS valid_agency_role;
ALTER TABLE public.recruiters DROP COLUMN IF EXISTS agency_role;
ALTER TABLE public.recruiters DROP COLUMN IF EXISTS agency_id;

-- Drop agencies table last (other tables reference it)
DROP TABLE IF EXISTS public.agencies;
```

### If Agency Feature Breaks

1. Agency pages are additive — no existing recruiter pages depend on them. Remove agency routes from the navigation.
2. Individual recruiter features continue working — the `agency_id IS NULL` path is unchanged from Sprint 19.
3. Agency members lose agency-scoped features but can still use individual recruiter features.

### If NLP Search Breaks

1. NLP search is additive to filter-based search. Remove the NLP input bar from the search page.
2. Filter-based search (`search_crew_recruiter()` from Sprint 19) continues working.
3. The embedding pipeline can be paused by removing the cron entry from `vercel.json`.
4. Existing embeddings remain in the database but are unused.

### If Both Break

Roll back the Vercel deployment: `vercel rollback`

Database tables/columns remain but are unused. The Sprint 19 application code does not reference Sprint 20 additions.

**Data safety:** No existing data is modified by Sprint 20. The migration only adds new columns (with defaults) and new tables. The `unlock_crew_profile()` RPC is replaced (CREATE OR REPLACE) — the rollback SQL drops it, and the Sprint 19 version must be re-created from the Sprint 19 migration if a DB rollback is needed.

---

## Part 16: Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S20-01 | Agency credits are tagged with `agency_id`, not merged from individual balances on join | Keeps accounting clean. Personal credits purchased before agency join remain personal. Prevents disputes about who "brought" how many credits. |
| D-S20-02 | `unlock_crew_profile()` is CREATE OR REPLACE (overwrites Sprint 19 version) | The agency-aware version is a superset: it handles both individual and agency contexts. Maintaining two separate functions would be error-prone. |
| D-S20-03 | Embedding queue table instead of real-time re-embedding | Prevents API rate limits from blocking profile saves. The queue decouples profile changes from OpenAI API calls. Nightly cron catches stragglers. |
| D-S20-04 | Match explanations cached per `(query_hash, user_id)` with 24h TTL | Identical queries from different recruiters hit the same cache. 24h is long enough to avoid re-generation on pagination/revisit, short enough that profile changes are reflected within a day. |
| D-S20-05 | NLP search passes embedding vector as RPC parameter (not query text) | The RPC does not call OpenAI. Embedding is generated in the API route (TypeScript), keeping the database function pure SQL. This avoids making the RPC depend on external services. |
| D-S20-06 | Bulk unlock max 50 profiles per request | Prevents accidental mass credit deduction. 50 covers typical recruiter workflows (1–2 pages of results). Larger batches can be done in multiple requests. |
| D-S20-07 | CSV export includes GDPR disclaimer as comment line | Minimal compliance measure for V1. The disclaimer reminds recruiters that exported data is personal data subject to GDPR. Full compliance (DPA, data retention, right to erasure from exports) is future work. |
| D-S20-08 | Per-seat billing via Stripe subscription items (not separate subscriptions) | One agency subscription with N items is cleaner than N separate subscriptions. Consolidated billing, single invoice, easier for admin to manage. |
| D-S20-09 | `compose_profile_text()` as a SQL function | Single source of truth for what goes into the embedding. Both the nightly cron and the incremental triggers use the same function, preventing drift between batch and incremental embeddings. |
| D-S20-10 | IVFFlat index with `lists = 100` (same as yacht embeddings) | Consistent with Sprint 17. Fine for up to 50K profiles. If the user base exceeds 50K, tune `lists` to `sqrt(n)` per pgvector docs. |
