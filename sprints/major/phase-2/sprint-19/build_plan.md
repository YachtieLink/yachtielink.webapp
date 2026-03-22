# Sprint 19 — Recruiter Access: Build Plan

## Context

Sprint 19 opens YachtieLink to external recruiters — the first non-crew users. Recruiters pay EUR 29/month subscription + credits (EUR 75-1200 bundles) to search crew and unlock profile details. This is the demand-side revenue channel. The constitutional guardrail is D-024: recruiters get read-only access. They cannot endorse, create attachments, post positions, signal on endorsements, or affect the trust graph in any way.

**Separate `recruiters` table** is the architectural choice (per README notes). Recruiters do NOT go into the `users` table. They get separate auth, separate middleware, separate RLS policies, and a separate route namespace (`/recruiter/*`). This prevents accidental cross-contamination between crew and recruiter features.

### What Already Exists (No Build Needed)

| Dependency | Status | Notes |
|-----------|--------|-------|
| `users` table with crew fields | Exists | Sprint 3 core tables |
| `yachts`, `attachments`, `endorsements` tables | Exists | Sprint 2-5 |
| Stripe client singleton (`lib/stripe/client.ts`) | Exists | Sprint 7 — lazy `Stripe` instance |
| Stripe checkout flow (`app/api/stripe/checkout/route.ts`) | Exists | Sprint 7 — subscription checkout for Crew Pro |
| Stripe portal flow (`app/api/stripe/portal/route.ts`) | Exists | Sprint 7 — billing management |
| Stripe webhook handler (`app/api/stripe/webhook/route.ts`) | Exists | Sprint 7 — subscription lifecycle events |
| Resend email pipeline (`lib/email/notify.ts`) | Exists | Sprint 2/5 — sender: `notifications@mail.yachtie.link` |
| Subscription welcome email pattern (`lib/email/subscription-welcome.ts`) | Exists | Sprint 7 — template to follow |
| Payment failed email (`lib/email/payment-failed.ts`) | Exists | Sprint 7 |
| PostHog client (`lib/analytics/events.ts`) + server (`lib/analytics/server.ts`) | Exists | Sprint 8 |
| Rate limiting (`lib/rate-limit/helpers.ts`) | Exists | Sprint 8 — `RATE_LIMITS` map |
| Validation (`lib/validation/validate.ts`) + Zod schemas (`lib/validation/schemas.ts`) | Exists | Sprint 5 |
| `handleApiError` utility (`lib/api/errors.ts`) | Exists | Sprint 5 |
| `createClient()` server (`lib/supabase/server.ts`) | Exists | Cookie-aware Supabase client |
| `createClient()` browser (`lib/supabase/client.ts`) | Exists | Browser Supabase client |
| `createServiceClient()` admin (`lib/supabase/admin.ts`) | Exists | Service role, bypasses RLS |
| `createMiddlewareClient()` (`lib/supabase/middleware.ts`) | Exists | For Next.js middleware |
| Supabase Auth (signup, email verification, PKCE callback) | Exists | Sprint 1 — `app/(auth)/signup`, `app/auth/callback` |
| Availability columns (`availability_status`, `availability_contact_methods`) on `users` | Exists | Sprint 14 |
| Cron infrastructure (`vercel.json`, `CRON_SECRET` pattern) | Exists | Sprint 8 |
| UI components: `Input`, `Button`, `Card`, `PageTransition`, `ProfileAvatar`, `EmptyState` | Exists | Various sprints |

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
- Stripe webhook: raw body + `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
- Stripe checkout: create Customer if not exists → create Checkout Session → return `session.url`
- Stripe portal: create billing portal session → return `session.url`
- Auth pages: client components under `app/(auth)/`, use `createClient()` from `@/lib/supabase/client`
- Protected pages: server components under `app/(protected)/app/`, layout checks `supabase.auth.getUser()` and redirects to `/welcome` if unauthenticated

### Key Decisions

| ID | Decision | Source |
|----|----------|--------|
| D-024 | Recruiters pay EUR 29/month + credits. Read-only access. Cannot influence the graph. | `docs/yl_decisions.json` |
| D-025 | Direct profile links show full profile. Search results are locked behind payment. Graph browsing stays open. | `docs/yl_decisions.json` |
| D-026 | Recruiters can sort by endorsement count — ordering, not trust weighting. Display "X endorsements from Y people across Z yachts". | `docs/yl_decisions.json` |
| D-027 | Crew opt-in for recruiter visibility. Separate from availability toggle. Default off. | `docs/yl_decisions.json` |

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260322000003_sprint19_recruiter_access.sql`

### 1.1 — Recruiters Table

```sql
-- Sprint 19: Recruiter Access
-- Separate table for recruiter accounts. Recruiters are NOT crew.
-- They have their own auth, their own data, their own RLS.
-- See D-024: read-only access, no graph influence.

-- ═══════════════════════════════════════════════════════════
-- 1. RECRUITERS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.recruiters (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id         uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email                text UNIQUE NOT NULL,
  company_name         text NOT NULL,
  contact_name         text NOT NULL,
  phone                text,
  email_verified       boolean NOT NULL DEFAULT false,

  -- Stripe
  stripe_customer_id   text UNIQUE,
  subscription_status  text NOT NULL DEFAULT 'inactive',
  subscription_id      text,
  subscription_ends_at timestamptz,

  -- System
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_recruiter_subscription_status
    CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled')),
  CONSTRAINT company_name_length CHECK (char_length(company_name) BETWEEN 1 AND 200),
  CONSTRAINT contact_name_length CHECK (char_length(contact_name) BETWEEN 1 AND 200),
  CONSTRAINT recruiter_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

CREATE INDEX idx_recruiters_email ON public.recruiters (email);
CREATE INDEX idx_recruiters_auth_user_id ON public.recruiters (auth_user_id);
CREATE INDEX idx_recruiters_stripe_customer_id ON public.recruiters (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_recruiters_subscription_status ON public.recruiters (subscription_status)
  WHERE subscription_status = 'active';

-- Auto-update updated_at
CREATE TRIGGER set_recruiters_updated_at
  BEFORE UPDATE ON public.recruiters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Design note:** The `auth_user_id` column links to Supabase Auth's `auth.users` table. Recruiters use Supabase Auth for authentication (email/password signup, email verification, password reset) — the same auth system as crew. The separation is at the data layer: recruiters have a row in `public.recruiters`, crew have a row in `public.users`. Middleware and RLS check which table has a matching `auth_user_id` to determine the account type.

### 1.2 — Recruiter Credits Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. RECRUITER CREDITS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.recruiter_credits (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id            uuid NOT NULL REFERENCES public.recruiters (id) ON DELETE CASCADE,
  credits_purchased       int NOT NULL,
  credits_remaining       int NOT NULL,
  price_eur               numeric(10,2) NOT NULL,
  stripe_payment_intent_id text,
  purchased_at            timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz NOT NULL,

  -- Constraints
  CONSTRAINT positive_credits_purchased CHECK (credits_purchased > 0),
  CONSTRAINT non_negative_credits_remaining CHECK (credits_remaining >= 0),
  CONSTRAINT remaining_lte_purchased CHECK (credits_remaining <= credits_purchased),
  CONSTRAINT positive_price CHECK (price_eur > 0),
  CONSTRAINT expires_after_purchase CHECK (expires_at > purchased_at)
);

-- FIFO credit deduction: find oldest non-expired bundle with remaining credits
CREATE INDEX idx_recruiter_credits_fifo
  ON public.recruiter_credits (recruiter_id, expires_at ASC)
  WHERE credits_remaining > 0;

-- For credit balance queries
CREATE INDEX idx_recruiter_credits_balance
  ON public.recruiter_credits (recruiter_id, credits_remaining)
  WHERE credits_remaining > 0;

-- For expiry cron
CREATE INDEX idx_recruiter_credits_expiry
  ON public.recruiter_credits (expires_at)
  WHERE credits_remaining > 0;
```

### 1.3 — Recruiter Unlocks Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. RECRUITER UNLOCKS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.recruiter_unlocks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id   uuid NOT NULL REFERENCES public.recruiters (id) ON DELETE CASCADE,
  crew_user_id   uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  credit_id      uuid NOT NULL REFERENCES public.recruiter_credits (id) ON DELETE RESTRICT,
  unlocked_at    timestamptz NOT NULL DEFAULT now()
);

-- One unlock per recruiter-crew pair — permanent
CREATE UNIQUE INDEX idx_recruiter_unlocks_unique
  ON public.recruiter_unlocks (recruiter_id, crew_user_id);

-- For listing a recruiter's unlocked profiles
CREATE INDEX idx_recruiter_unlocks_recruiter
  ON public.recruiter_unlocks (recruiter_id, unlocked_at DESC);

-- For checking if a specific profile is unlocked
CREATE INDEX idx_recruiter_unlocks_lookup
  ON public.recruiter_unlocks (recruiter_id, crew_user_id);
```

### 1.4 — Crew Recruiter Visibility Column

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. CREW OPT-IN FOR RECRUITER VISIBILITY
-- ═══════════════════════════════════════════════════════════

-- Default false: crew must actively opt in.
-- Independent of availability_status toggle.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS recruiter_visible boolean NOT NULL DEFAULT false;

-- Index for recruiter search: only return crew who opted in
CREATE INDEX IF NOT EXISTS idx_users_recruiter_visible
  ON public.users (recruiter_visible)
  WHERE recruiter_visible = true;
```

### 1.5 — RLS Policies for Recruiter Tables

```sql
-- ═══════════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════════

-- ── recruiters table ──────────────────────────────────────

ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- Recruiters can read their own record
CREATE POLICY "recruiters: own read"
  ON public.recruiters FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Recruiters can update their own record (phone, company_name, contact_name)
CREATE POLICY "recruiters: own update"
  ON public.recruiters FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Insert: only via service role (signup API creates the record)
-- No INSERT policy for authenticated users — prevents crew from creating recruiter records.

-- ── recruiter_credits table ───────────────────────────────

ALTER TABLE public.recruiter_credits ENABLE ROW LEVEL SECURITY;

-- Recruiters can read their own credits
CREATE POLICY "recruiter_credits: own read"
  ON public.recruiter_credits FOR SELECT
  USING (
    recruiter_id IN (
      SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE for authenticated users — credits are created by webhook/service role only.

-- ── recruiter_unlocks table ───────────────────────────────

ALTER TABLE public.recruiter_unlocks ENABLE ROW LEVEL SECURITY;

-- Recruiters can read their own unlocks
CREATE POLICY "recruiter_unlocks: own read"
  ON public.recruiter_unlocks FOR SELECT
  USING (
    recruiter_id IN (
      SELECT id FROM public.recruiters WHERE auth_user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE for authenticated users — unlocks are created by RPC (security definer).
```

**Note on recruiter read access to crew tables:** The existing RLS policies on `users`, `yachts`, `attachments`, and `endorsements` already allow public read (`USING (true)` or `USING (deleted_at IS NULL)`). Since recruiters authenticate via Supabase Auth (they have an `auth.uid()`), they can already read these tables. No additional policies needed for read access. The protection is that recruiters have NO write policies on any crew table — they cannot INSERT, UPDATE, or DELETE anything in `users`, `attachments`, `endorsements`, `yachts`, etc.

### 1.6 — Helper Function: Get Recruiter ID from Auth UID

```sql
-- ═══════════════════════════════════════════════════════════
-- 6. HELPER: AUTH UID → RECRUITER ID
-- ═══════════════════════════════════════════════════════════

-- Used by RPCs to resolve the current recruiter from auth.uid().
-- Returns NULL if the auth user is not a recruiter.
CREATE OR REPLACE FUNCTION public.get_recruiter_id_from_auth()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM recruiters WHERE auth_user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_recruiter_id_from_auth() TO authenticated;
```

### 1.7 — Helper Function: Check if Auth User is a Recruiter

```sql
-- ═══════════════════════════════════════════════════════════
-- 7. HELPER: IS RECRUITER CHECK
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM recruiters WHERE auth_user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.is_recruiter() TO authenticated;
```

### 1.8 — Get Recruiter Credit Balance RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 8. GET RECRUITER CREDIT BALANCE
-- ═══════════════════════════════════════════════════════════

-- Returns total available (non-expired) credits and next expiry date.
CREATE OR REPLACE FUNCTION public.get_recruiter_credit_balance(p_recruiter_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_build_object(
      'total_credits', coalesce(sum(credits_remaining), 0)::int,
      'next_expiry', min(expires_at),
      'bundle_count', count(*)::int
    ),
    '{"total_credits": 0, "next_expiry": null, "bundle_count": 0}'::jsonb
  )
  FROM recruiter_credits
  WHERE recruiter_id = p_recruiter_id
    AND credits_remaining > 0
    AND expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.get_recruiter_credit_balance(uuid) TO authenticated;
```

### 1.9 — Unlock Crew Profile RPC (Atomic Credit Deduction + Unlock)

```sql
-- ═══════════════════════════════════════════════════════════
-- 9. UNLOCK CREW PROFILE (atomic transaction)
-- ═══════════════════════════════════════════════════════════

-- Deducts 1 credit (FIFO from oldest non-expired bundle) and creates
-- an unlock record. Returns the unlock details or an error reason.
-- Handles:
-- - Already unlocked (no charge, returns existing unlock)
-- - Insufficient credits (returns error)
-- - Race condition (unique constraint catches concurrent requests)

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
  existing_unlock uuid;
  target_credit_id uuid;
  new_unlock_id uuid;
BEGIN
  -- 1. Check if already unlocked (idempotent — no double charge)
  SELECT id INTO existing_unlock
  FROM recruiter_unlocks
  WHERE recruiter_id = p_recruiter_id
    AND crew_user_id = p_crew_user_id;

  IF existing_unlock IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_unlocked',
      'unlock_id', existing_unlock
    );
  END IF;

  -- 2. Check recruiter has active subscription
  IF NOT EXISTS (
    SELECT 1 FROM recruiters
    WHERE id = p_recruiter_id
      AND subscription_status = 'active'
  ) THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'reason', 'subscription_inactive'
    );
  END IF;

  -- 3. Check crew member exists and has opted in
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_crew_user_id
      AND recruiter_visible = true
  ) THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'reason', 'crew_not_visible'
    );
  END IF;

  -- 4. Find oldest non-expired bundle with remaining credits (FIFO)
  SELECT id INTO target_credit_id
  FROM recruiter_credits
  WHERE recruiter_id = p_recruiter_id
    AND credits_remaining > 0
    AND expires_at > now()
  ORDER BY expires_at ASC, purchased_at ASC
  LIMIT 1
  FOR UPDATE;  -- Lock the row to prevent concurrent deduction

  IF target_credit_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'reason', 'insufficient_credits'
    );
  END IF;

  -- 5. Deduct 1 credit
  UPDATE recruiter_credits
  SET credits_remaining = credits_remaining - 1
  WHERE id = target_credit_id;

  -- 6. Create unlock record
  INSERT INTO recruiter_unlocks (recruiter_id, crew_user_id, credit_id)
  VALUES (p_recruiter_id, p_crew_user_id, target_credit_id)
  RETURNING id INTO new_unlock_id;

  RETURN jsonb_build_object(
    'status', 'unlocked',
    'unlock_id', new_unlock_id,
    'credit_id', target_credit_id
  );

EXCEPTION
  -- Handle race condition: unique constraint violation means another
  -- concurrent request already unlocked this pair
  WHEN unique_violation THEN
    SELECT id INTO existing_unlock
    FROM recruiter_unlocks
    WHERE recruiter_id = p_recruiter_id
      AND crew_user_id = p_crew_user_id;

    RETURN jsonb_build_object(
      'status', 'already_unlocked',
      'unlock_id', existing_unlock
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_crew_profile(uuid, uuid) TO authenticated;
```

### 1.10 — Recruiter Search RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 10. RECRUITER CREW SEARCH
-- ═══════════════════════════════════════════════════════════

-- Search crew who have opted in to recruiter visibility.
-- Returns locked/unlocked results based on whether the recruiter
-- has unlocked each profile.
-- Includes endorsement summary for sorting (D-026).

CREATE OR REPLACE FUNCTION public.search_crew_recruiter(
  p_recruiter_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_sort text DEFAULT 'relevance',
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset int;
  v_department text;
  v_role text;
  v_location_country text;
  v_availability text;
  v_min_endorsements int;
  v_min_sea_time_days int;
  v_min_yacht_length numeric;
  v_results jsonb;
  v_total_count int;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Extract filters from JSONB
  v_department := p_filters->>'department';
  v_role := p_filters->>'role';
  v_location_country := p_filters->>'location_country';
  v_availability := p_filters->>'availability';
  v_min_endorsements := (p_filters->>'min_endorsements')::int;
  v_min_sea_time_days := (p_filters->>'min_sea_time_days')::int;
  v_min_yacht_length := (p_filters->>'min_yacht_length')::numeric;

  -- Build result set
  WITH crew_with_stats AS (
    SELECT
      u.id,
      u.profile_photo_url,
      u.primary_role,
      u.departments,
      u.location_country,
      u.location_city,
      u.availability_status,
      u.availability_contact_methods,
      -- Endorsement summary (D-026)
      (
        SELECT count(*)::int
        FROM endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorsement_count,
      (
        SELECT count(DISTINCT e.endorser_id)::int
        FROM endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorser_count,
      (
        SELECT count(DISTINCT e.yacht_id)::int
        FROM endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorsement_yacht_count,
      -- Sea time (total days)
      (
        SELECT coalesce(sum(coalesce(a.ended_at, current_date) - a.started_at), 0)::int
        FROM attachments a
        WHERE a.user_id = u.id AND a.deleted_at IS NULL
      ) AS sea_time_days,
      -- Max yacht length (for yacht size preference filter)
      (
        SELECT coalesce(max(y.length_meters), 0)
        FROM attachments a
        JOIN yachts y ON y.id = a.yacht_id
        WHERE a.user_id = u.id AND a.deleted_at IS NULL
      ) AS max_yacht_length,
      -- Is this profile unlocked by this recruiter?
      EXISTS (
        SELECT 1 FROM recruiter_unlocks ru
        WHERE ru.recruiter_id = p_recruiter_id
          AND ru.crew_user_id = u.id
      ) AS is_unlocked,
      u.full_name,
      u.display_name,
      u.handle,
      u.email AS crew_email,
      u.phone AS crew_phone,
      u.whatsapp AS crew_whatsapp,
      u.show_phone,
      u.show_email,
      u.show_whatsapp,
      u.updated_at
    FROM users u
    WHERE u.recruiter_visible = true
      AND u.onboarding_complete = true
      -- Apply filters
      AND (v_department IS NULL OR v_department = ANY(u.departments))
      AND (v_role IS NULL OR u.primary_role ILIKE '%' || v_role || '%')
      AND (v_location_country IS NULL OR u.location_country ILIKE '%' || v_location_country || '%')
      AND (v_availability IS NULL OR (v_availability = 'available' AND u.availability_status = 'available' AND u.availability_expires_at > now()))
  ),
  filtered AS (
    SELECT *
    FROM crew_with_stats
    WHERE (v_min_endorsements IS NULL OR endorsement_count >= v_min_endorsements)
      AND (v_min_sea_time_days IS NULL OR sea_time_days >= v_min_sea_time_days)
      AND (v_min_yacht_length IS NULL OR max_yacht_length >= v_min_yacht_length)
  ),
  counted AS (
    SELECT count(*)::int AS total FROM filtered
  ),
  sorted AS (
    SELECT *
    FROM filtered
    ORDER BY
      CASE WHEN p_sort = 'endorsement_count' THEN endorsement_count END DESC NULLS LAST,
      CASE WHEN p_sort = 'sea_time' THEN sea_time_days END DESC NULLS LAST,
      CASE WHEN p_sort = 'recently_active' THEN updated_at END DESC NULLS LAST,
      -- Default: relevance = endorsement_count DESC, then sea_time DESC
      CASE WHEN p_sort = 'relevance' OR p_sort IS NULL THEN endorsement_count END DESC NULLS LAST,
      CASE WHEN p_sort = 'relevance' OR p_sort IS NULL THEN sea_time_days END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset
  )
  SELECT
    jsonb_build_object(
      'results', coalesce(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'profile_photo_url', s.profile_photo_url,
              'primary_role', s.primary_role,
              'departments', s.departments,
              'location_country', s.location_country,
              -- Locked fields: only shown if unlocked
              'location_city', CASE WHEN s.is_unlocked THEN s.location_city ELSE NULL END,
              'full_name', CASE WHEN s.is_unlocked THEN coalesce(s.display_name, s.full_name) ELSE NULL END,
              'handle', CASE WHEN s.is_unlocked THEN s.handle ELSE NULL END,
              'contact_email', CASE WHEN s.is_unlocked AND s.show_email THEN s.crew_email ELSE NULL END,
              'contact_phone', CASE WHEN s.is_unlocked AND s.show_phone THEN s.crew_phone ELSE NULL END,
              'contact_whatsapp', CASE WHEN s.is_unlocked AND s.show_whatsapp THEN s.crew_whatsapp ELSE NULL END,
              -- Always shown
              'endorsement_count', s.endorsement_count,
              'endorser_count', s.endorser_count,
              'endorsement_yacht_count', s.endorsement_yacht_count,
              'sea_time_days', s.sea_time_days,
              'availability_status', s.availability_status,
              'is_unlocked', s.is_unlocked,
              'max_yacht_length', s.max_yacht_length
            )
          )
          FROM sorted s
        ),
        '[]'::jsonb
      ),
      'total', (SELECT total FROM counted),
      'page', p_page,
      'page_size', p_page_size
    )
  INTO v_results;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_crew_recruiter(uuid, jsonb, text, int, int) TO authenticated;
```

### 1.11 — Recruiter Endorsement Summary RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 11. ENDORSEMENT SUMMARY FOR A CREW MEMBER
-- ═══════════════════════════════════════════════════════════

-- Returns "X endorsements from Y people across Z yachts" (D-026).
-- Used by recruiter search results and recruiter-facing profile view.

CREATE OR REPLACE FUNCTION public.get_endorsement_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_build_object(
      'endorsement_count', count(*)::int,
      'endorser_count', count(DISTINCT endorser_id)::int,
      'yacht_count', count(DISTINCT yacht_id)::int
    ),
    '{"endorsement_count": 0, "endorser_count": 0, "yacht_count": 0}'::jsonb
  )
  FROM endorsements
  WHERE recipient_id = p_user_id
    AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_endorsement_summary(uuid) TO authenticated;
```

### 1.12 — GRANT Summary

```sql
-- ═══════════════════════════════════════════════════════════
-- 12. GRANT SUMMARY (explicit for clarity)
-- ═══════════════════════════════════════════════════════════

-- All GRANTs are already inline above, but listed here for audit:
-- GRANT EXECUTE ON FUNCTION public.get_recruiter_id_from_auth() TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.is_recruiter() TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_recruiter_credit_balance(uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.unlock_crew_profile(uuid, uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.search_crew_recruiter(uuid, jsonb, text, int, int) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.get_endorsement_summary(uuid) TO authenticated;
```

---

## Part 2: Recruiter Auth Flow

Recruiters use Supabase Auth for authentication (same system as crew) but route to different tables and pages. The auth flow is: signup form → Supabase `auth.signUp()` → email verification → callback route → create recruiter record in `public.recruiters` → redirect to `/recruiter/dashboard`.

### 2.1 — Recruiter Auth Callback

**File to create:** `app/recruiter/auth/callback/route.ts`

Handles the email verification link for recruiter signups. After verifying, creates the recruiter record in `public.recruiters` using the service client.

```typescript
// GET /recruiter/auth/callback
// Handles email verification PKCE code exchange for recruiter signups.
// After verification, creates the recruiter record in public.recruiters.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const url = new URL('/recruiter/signup', origin)
    url.searchParams.set('error', error)
    if (errorDescription) {
      url.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(url)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/recruiter/signup', origin))
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const url = new URL('/recruiter/signup', origin)
    url.searchParams.set('error', 'auth_error')
    url.searchParams.set('error_description', exchangeError.message)
    return NextResponse.redirect(url)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/recruiter/signup', origin))
  }

  // Create recruiter record if it doesn't exist yet
  // The company_name and contact_name were stored in auth.users.raw_user_meta_data during signup
  const admin = createServiceClient()
  const { data: existingRecruiter } = await admin
    .from('recruiters')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!existingRecruiter) {
    const metadata = user.user_metadata ?? {}
    const { error: insertError } = await admin
      .from('recruiters')
      .insert({
        auth_user_id: user.id,
        email: user.email!,
        company_name: metadata.company_name ?? 'Unknown Company',
        contact_name: metadata.contact_name ?? 'Unknown',
        email_verified: true,
      })

    if (insertError) {
      console.error('Failed to create recruiter record:', insertError)
      // Still redirect — the record can be created on next login
    }
  } else {
    // Mark as verified if not already
    await admin
      .from('recruiters')
      .update({ email_verified: true })
      .eq('id', existingRecruiter.id)
  }

  return NextResponse.redirect(new URL('/recruiter/dashboard', origin))
}
```

### 2.2 — Recruiter Signup Page

**File to create:** `app/recruiter/signup/page.tsx`

Client component. Email + password + company name + contact name.

```typescript
'use client'

// State: email, password, companyName, contactName, showPassword, loading, error, done
// On submit:
//   1. supabase.auth.signUp({ email, password, options: {
//        emailRedirectTo: `${origin}/recruiter/auth/callback`,
//        data: { company_name: companyName, contact_name: contactName, account_type: 'recruiter' }
//      }})
//   2. Show "Check your email" confirmation
// UI: Same layout pattern as app/(auth)/signup/page.tsx but with recruiter branding:
//   - Heading: "Create your recruiter account"
//   - Subtext: "Search and connect with verified yachting professionals."
//   - Fields: Email, Password, Company Name, Contact Name (Your Name)
//   - Button: "Create account"
//   - Link: "Already have a recruiter account? Sign in" → /recruiter/login
//   - Link: "Are you crew? Sign up here" → /signup

interface RecruiterSignupFields {
  email: string
  password: string       // min 8 chars
  companyName: string    // required
  contactName: string    // required
}
```

**Validation schema (Zod, inline in component):**
```typescript
const recruiterSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  companyName: z.string().min(1, 'Company name is required').max(200),
  contactName: z.string().min(1, 'Your name is required').max(200),
})
```

### 2.3 — Recruiter Login Page

**File to create:** `app/recruiter/login/page.tsx`

Client component. Same pattern as `app/(auth)/login/page.tsx`.

```typescript
'use client'

// On submit:
//   1. supabase.auth.signInWithPassword({ email, password })
//   2. On success: check if user has a recruiter record (fetch from /api/recruiter/me)
//      - If yes → redirect to /recruiter/dashboard
//      - If no → show error "This account is not a recruiter account"
//   3. On error: show error message
// UI:
//   - Heading: "Sign in to your recruiter account"
//   - Fields: Email, Password
//   - Button: "Sign in"
//   - Link: "Forgot your password?" → /recruiter/reset-password
//   - Link: "Don't have a recruiter account? Sign up" → /recruiter/signup
//   - Link: "Are you crew? Sign in here" → /login
```

### 2.4 — Recruiter Password Reset Page

**File to create:** `app/recruiter/reset-password/page.tsx`

Client component. Uses `supabase.auth.resetPasswordForEmail()` with `redirectTo: /recruiter/update-password`.

### 2.5 — Recruiter Update Password Page

**File to create:** `app/recruiter/update-password/page.tsx`

Client component. Uses `supabase.auth.updateUser({ password })`. Same pattern as `app/(auth)/update-password/page.tsx`.

### 2.6 — Recruiter Layout

**File to create:** `app/recruiter/layout.tsx`

Server component. The recruiter layout does NOT use the crew `BottomTabBar` or `SidebarNav`. It has its own minimal nav.

```typescript
// Layout for all /recruiter/* pages
// Does NOT check auth — individual pages handle their own auth
// (signup and login pages must be accessible without auth)
// Protected pages use the RecruiterAuthGuard component (see Part 2.7)

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-surface)]">
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### 2.7 — Recruiter Auth Guard Utility

**File to create:** `lib/recruiter/auth-guard.ts`

Server-side utility used by protected recruiter pages to verify the current user is an authenticated recruiter with a valid record.

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface RecruiterSession {
  authUserId: string
  recruiterId: string
  email: string
  companyName: string
  contactName: string
  subscriptionStatus: string
  stripeCustomerId: string | null
}

/**
 * Server-side auth guard for recruiter pages.
 * Returns the recruiter session or redirects to /recruiter/login.
 */
export async function requireRecruiter(): Promise<RecruiterSession> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/recruiter/login')
  }

  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('id, email, company_name, contact_name, subscription_status, stripe_customer_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!recruiter) {
    // Auth user exists but no recruiter record — might be crew
    redirect('/recruiter/login?error=not_recruiter')
  }

  return {
    authUserId: user.id,
    recruiterId: recruiter.id,
    email: recruiter.email,
    companyName: recruiter.company_name,
    contactName: recruiter.contact_name,
    subscriptionStatus: recruiter.subscription_status,
    stripeCustomerId: recruiter.stripe_customer_id,
  }
}

/**
 * Check if recruiter has an active subscription.
 * Use this to gate search and unlock features.
 */
export function requireActiveSubscription(session: RecruiterSession): void {
  if (session.subscriptionStatus !== 'active' && session.subscriptionStatus !== 'past_due') {
    redirect('/recruiter/subscribe')
  }
}
```

---

## Part 3: Stripe Integration — Recruiter Subscription

### 3.1 — Environment Variables

Add to `.env.local`:
```
# Recruiter Stripe products (create in Stripe Dashboard)
STRIPE_RECRUITER_MONTHLY_PRICE_ID=price_xxx       # EUR 29/month
STRIPE_RECRUITER_WEBHOOK_SECRET=whsec_xxx          # Separate webhook endpoint or shared

# Credit bundle price IDs (one-time payments)
STRIPE_CREDIT_BUNDLE_10_PRICE_ID=price_xxx         # EUR 75
STRIPE_CREDIT_BUNDLE_25_PRICE_ID=price_xxx         # EUR 150
STRIPE_CREDIT_BUNDLE_50_PRICE_ID=price_xxx         # EUR 250
STRIPE_CREDIT_BUNDLE_100_PRICE_ID=price_xxx        # EUR 400
STRIPE_CREDIT_BUNDLE_200_PRICE_ID=price_xxx        # EUR 1200
```

### 3.2 — Credit Bundle Configuration

**File to create:** `lib/recruiter/credit-bundles.ts`

```typescript
export interface CreditBundle {
  id: string           // stable identifier for UI
  credits: number
  priceEur: number
  perCreditEur: number
  priceId: string      // Stripe Price ID from env
  label: string        // display label
}

export function getCreditBundles(): CreditBundle[] {
  return [
    {
      id: 'bundle_10',
      credits: 10,
      priceEur: 75,
      perCreditEur: 7.50,
      priceId: process.env.STRIPE_CREDIT_BUNDLE_10_PRICE_ID!,
      label: '10 credits',
    },
    {
      id: 'bundle_25',
      credits: 25,
      priceEur: 150,
      perCreditEur: 6.00,
      priceId: process.env.STRIPE_CREDIT_BUNDLE_25_PRICE_ID!,
      label: '25 credits',
    },
    {
      id: 'bundle_50',
      credits: 50,
      priceEur: 250,
      perCreditEur: 5.00,
      priceId: process.env.STRIPE_CREDIT_BUNDLE_50_PRICE_ID!,
      label: '50 credits',
    },
    {
      id: 'bundle_100',
      credits: 100,
      priceEur: 400,
      perCreditEur: 4.00,
      priceId: process.env.STRIPE_CREDIT_BUNDLE_100_PRICE_ID!,
      label: '100 credits',
    },
    {
      id: 'bundle_200',
      credits: 200,
      priceEur: 1200,
      perCreditEur: 6.00,
      priceId: process.env.STRIPE_CREDIT_BUNDLE_200_PRICE_ID!,
      label: '200 credits',
    },
  ]
}

/**
 * Resolve a bundle ID to its config. Returns null if invalid.
 */
export function getBundleByPriceId(priceId: string): CreditBundle | null {
  return getCreditBundles().find(b => b.priceId === priceId) ?? null
}

export function getBundleById(bundleId: string): CreditBundle | null {
  return getCreditBundles().find(b => b.id === bundleId) ?? null
}
```

### 3.3 — Recruiter Subscription Checkout API

**File to create:** `app/api/recruiter/stripe/checkout/route.ts`

```typescript
// POST /api/recruiter/stripe/checkout
// Body: { type: 'subscription' } | { type: 'credits', bundle_id: string }
// Response: { url: string } (Stripe Checkout URL)

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { validateBody } from '@/lib/validation/validate'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { getBundleById } from '@/lib/recruiter/credit-bundles'
import { z } from 'zod'

const checkoutSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('subscription') }),
  z.object({ type: z.literal('credits'), bundle_id: z.string() }),
])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'auth')
    if (limited) return limited

    const result = await validateBody(req, checkoutSchema)
    if ('error' in result) return result.error
    const body = result.data

    // Verify user is a recruiter
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id, stripe_customer_id, email, contact_name')
      .eq('auth_user_id', user.id)
      .single()

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter account' }, { status: 403 })
    }

    // Create or retrieve Stripe Customer
    let stripeCustomerId = recruiter.stripe_customer_id
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: recruiter.email,
        name: recruiter.contact_name,
        metadata: {
          recruiter_id: recruiter.id,
          auth_user_id: user.id,
          account_type: 'recruiter',
        },
      })
      stripeCustomerId = customer.id

      const admin = createServiceClient()
      await admin
        .from('recruiters')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', recruiter.id)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

    if (body.type === 'subscription') {
      const priceId = process.env.STRIPE_RECRUITER_MONTHLY_PRICE_ID
      if (!priceId) throw new Error('STRIPE_RECRUITER_MONTHLY_PRICE_ID is not set')

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl}/recruiter/dashboard?subscribed=true`,
        cancel_url: `${siteUrl}/recruiter/subscribe`,
        subscription_data: {
          metadata: {
            recruiter_id: recruiter.id,
            auth_user_id: user.id,
            account_type: 'recruiter',
          },
        },
      })

      return NextResponse.json({ url: session.url })
    }

    // Credit bundle checkout
    const bundle = getBundleById(body.bundle_id)
    if (!bundle) {
      return NextResponse.json({ error: 'Invalid bundle' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: bundle.priceId, quantity: 1 }],
      success_url: `${siteUrl}/recruiter/dashboard?credits_purchased=true`,
      cancel_url: `${siteUrl}/recruiter/credits`,
      payment_intent_data: {
        metadata: {
          recruiter_id: recruiter.id,
          auth_user_id: user.id,
          account_type: 'recruiter',
          bundle_id: bundle.id,
          credits: bundle.credits.toString(),
          price_eur: bundle.priceEur.toString(),
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 3.4 — Recruiter Stripe Portal API

**File to create:** `app/api/recruiter/stripe/portal/route.ts`

```typescript
// POST /api/recruiter/stripe/portal
// Response: { url: string } (Stripe Billing Portal URL)

import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('stripe_customer_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!recruiter?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription to manage' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: recruiter.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/recruiter/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return handleApiError(e)
  }
}
```

### 3.5 — Webhook Handler Extension

**File to modify:** `app/api/stripe/webhook/route.ts`

Extend the existing webhook handler to process recruiter subscription and credit purchase events. The key differentiator is the `account_type: 'recruiter'` metadata on Stripe subscriptions and payment intents.

```typescript
// Add these cases inside the existing switch(event.type) block:

// RECRUITER SUBSCRIPTION events use the same Stripe webhook endpoint.
// We differentiate by checking metadata.account_type === 'recruiter'.

case 'customer.subscription.created':
case 'customer.subscription.updated': {
  const subscription = event.data.object
  const accountType = subscription.metadata?.account_type

  if (accountType === 'recruiter') {
    // ── Recruiter subscription handling ──
    const recruiterId = subscription.metadata?.recruiter_id
    if (!recruiterId) {
      console.error('Webhook: missing recruiter_id on recruiter subscription', subscription.id)
      break
    }

    const isActive = ['active', 'trialing', 'past_due'].includes(subscription.status)
    const periodEnd =
      (subscription.items.data[0] as any)?.current_period_end ??
      (subscription as any).current_period_end
    const subscriptionEndsAt =
      isActive && periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null

    const newStatus = isActive
      ? (['past_due'].includes(subscription.status) ? 'past_due' : 'active')
      : 'inactive'

    const { error: updateError } = await supabase.from('recruiters').update({
      subscription_status: newStatus,
      subscription_id: subscription.id,
      subscription_ends_at: subscriptionEndsAt,
    }).eq('id', recruiterId)

    if (updateError) {
      console.error('Webhook: failed to update recruiter subscription', updateError)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    if (event.type === 'customer.subscription.created' && isActive) {
      trackServerEvent(recruiterId, 'recruiter_subscription_started', {})

      // Send recruiter welcome email
      const { data: rec } = await supabase
        .from('recruiters')
        .select('email, contact_name')
        .eq('id', recruiterId)
        .single()

      if (rec?.email) {
        const { sendRecruiterWelcomeEmail } = await import('@/lib/email/recruiter-welcome')
        await sendRecruiterWelcomeEmail({
          email: rec.email,
          name: rec.contact_name,
        }).catch((err: Error) => console.error('Recruiter welcome email failed:', err))
      }
    }

    break
  }

  // ── Existing crew subscription handling (unchanged) ──
  // ... existing code ...
  break
}

case 'customer.subscription.deleted': {
  const subscription = event.data.object
  const accountType = subscription.metadata?.account_type

  if (accountType === 'recruiter') {
    const recruiterId = subscription.metadata?.recruiter_id
    if (!recruiterId) break

    await supabase.from('recruiters').update({
      subscription_status: 'cancelled',
      subscription_ends_at: null,
    }).eq('id', recruiterId)

    trackServerEvent(recruiterId, 'recruiter_subscription_cancelled', {})
    break
  }

  // ── Existing crew subscription deletion (unchanged) ──
  // ... existing code ...
  break
}

// CREDIT PURCHASE — one-time payment success
case 'checkout.session.completed': {
  const session = event.data.object
  const paymentIntent = session.payment_intent as string | null
  const accountType = session.metadata?.account_type

  // Only handle recruiter credit purchases (mode === 'payment')
  if (session.mode !== 'payment' || accountType !== 'recruiter') break

  // Retrieve metadata from payment intent
  if (!paymentIntent) break
  const pi = await stripe.paymentIntents.retrieve(paymentIntent)
  const recruiterId = pi.metadata?.recruiter_id
  const bundleCredits = parseInt(pi.metadata?.credits ?? '0', 10)
  const priceEur = parseFloat(pi.metadata?.price_eur ?? '0')
  const bundleId = pi.metadata?.bundle_id

  if (!recruiterId || !bundleCredits || !priceEur) {
    console.error('Webhook: missing credit purchase metadata', pi.id)
    break
  }

  // Create credit record
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  const { error: creditError } = await supabase.from('recruiter_credits').insert({
    recruiter_id: recruiterId,
    credits_purchased: bundleCredits,
    credits_remaining: bundleCredits,
    price_eur: priceEur,
    stripe_payment_intent_id: paymentIntent,
    expires_at: oneYearFromNow.toISOString(),
  })

  if (creditError) {
    console.error('Webhook: failed to create credit record', creditError)
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
  }

  trackServerEvent(recruiterId, 'recruiter_credits_purchased', {
    bundle_id: bundleId,
    credits: bundleCredits,
    price_eur: priceEur,
  })

  // Send credit purchase confirmation email
  const { data: rec } = await supabase
    .from('recruiters')
    .select('email, contact_name')
    .eq('id', recruiterId)
    .single()

  if (rec?.email) {
    const { sendCreditPurchaseEmail } = await import('@/lib/email/recruiter-credit-purchase')
    await sendCreditPurchaseEmail({
      email: rec.email,
      name: rec.contact_name,
      credits: bundleCredits,
      priceEur,
    }).catch((err: Error) => console.error('Credit purchase email failed:', err))
  }

  break
}

case 'invoice.payment_failed': {
  const invoice = event.data.object
  const customerId = invoice.customer as string

  // Check if this is a recruiter customer
  const { data: recruiterRecord } = await supabase
    .from('recruiters')
    .select('id, email, contact_name')
    .eq('stripe_customer_id', customerId)
    .single()

  if (recruiterRecord) {
    console.error(`Recruiter payment failed: ${recruiterRecord.id}`)
    // Don't downgrade immediately — Stripe retries. Grace period is 3 days
    // (configured in Stripe billing settings).
    await sendPaymentFailedEmail({
      email: recruiterRecord.email,
      name: recruiterRecord.contact_name,
    }).catch((err) => console.error('Recruiter payment failed email failed:', err))
    break
  }

  // ── Existing crew payment failure handling (unchanged) ──
  // ... existing code ...
  break
}
```

**Important:** The webhook handler uses `createServiceClient()` which bypasses RLS. This is required because webhook events are not associated with a user session — they come from Stripe's servers.

---

## Part 4: Recruiter API Routes

### 4.1 — Get Current Recruiter Profile

**File to create:** `app/api/recruiter/me/route.ts`

```typescript
// GET /api/recruiter/me
// Returns the current recruiter's profile, credit balance, and subscription info.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: recruiter, error } = await supabase
      .from('recruiters')
      .select('id, email, company_name, contact_name, phone, subscription_status, subscription_ends_at, stripe_customer_id, created_at')
      .eq('auth_user_id', user.id)
      .single()

    if (error || !recruiter) {
      return NextResponse.json({ error: 'Not a recruiter account' }, { status: 404 })
    }

    // Fetch credit balance
    const { data: balance } = await supabase.rpc('get_recruiter_credit_balance', {
      p_recruiter_id: recruiter.id,
    })

    return NextResponse.json({
      ...recruiter,
      credits: balance ?? { total_credits: 0, next_expiry: null, bundle_count: 0 },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 4.2 — Unlock Crew Profile

**File to create:** `app/api/recruiter/unlock/route.ts`

```typescript
// POST /api/recruiter/unlock
// Body: { crew_user_id: string }
// Response: { status, unlock_id, credit_id } or { status: 'error', reason }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { validateBody } from '@/lib/validation/validate'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const unlockSchema = z.object({
  crew_user_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'recruiterUnlock', user.id)
    if (limited) return limited

    const result = await validateBody(req, unlockSchema)
    if ('error' in result) return result.error
    const { crew_user_id } = result.data

    // Get recruiter ID
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter account' }, { status: 403 })
    }

    // Call atomic unlock RPC
    const { data: unlockResult, error } = await supabase.rpc('unlock_crew_profile', {
      p_recruiter_id: recruiter.id,
      p_crew_user_id: crew_user_id,
    })

    if (error) {
      console.error('Unlock RPC failed:', error)
      return NextResponse.json({ error: 'Unlock failed' }, { status: 500 })
    }

    const status = (unlockResult as any)?.status

    if (status === 'unlocked') {
      trackServerEvent(recruiter.id, 'recruiter_profile_unlocked', {
        crew_user_id,
      })
    } else if (status === 'error' && (unlockResult as any)?.reason === 'insufficient_credits') {
      trackServerEvent(recruiter.id, 'recruiter_unlock_insufficient_credits', {
        crew_user_id,
      })
    }

    return NextResponse.json(unlockResult)
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 4.3 — Recruiter Search

**File to create:** `app/api/recruiter/search/route.ts`

```typescript
// GET /api/recruiter/search?department=Deck&role=Captain&page=1&sort=endorsement_count&...
// Response: { results: [...], total, page, page_size }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'search', user.id)
    if (limited) return limited

    // Get recruiter ID and check subscription
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id, subscription_status')
      .eq('auth_user_id', user.id)
      .single()

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter account' }, { status: 403 })
    }

    if (recruiter.subscription_status !== 'active' && recruiter.subscription_status !== 'past_due') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 402 })
    }

    // Parse query params into filters
    const params = req.nextUrl.searchParams
    const filters: Record<string, string | number> = {}
    const filterKeys = ['department', 'role', 'location_country', 'availability', 'min_endorsements', 'min_sea_time_days', 'min_yacht_length']
    for (const key of filterKeys) {
      const val = params.get(key)
      if (val) filters[key] = val
    }

    const sort = params.get('sort') ?? 'relevance'
    const page = parseInt(params.get('page') ?? '1', 10)
    const pageSize = Math.min(parseInt(params.get('page_size') ?? '20', 10), 50)

    const { data, error } = await supabase.rpc('search_crew_recruiter', {
      p_recruiter_id: recruiter.id,
      p_filters: filters,
      p_sort: sort,
      p_page: page,
      p_page_size: pageSize,
    })

    if (error) {
      console.error('Recruiter search RPC failed:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    trackServerEvent(recruiter.id, 'recruiter_search_executed', {
      filters,
      sort,
      result_count: (data as any)?.total ?? 0,
    })

    return NextResponse.json(data)
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 4.4 — Get Unlocked Profiles

**File to create:** `app/api/recruiter/unlocked/route.ts`

```typescript
// GET /api/recruiter/unlocked?page=1&page_size=20
// Returns the recruiter's unlocked profiles with crew details.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter account' }, { status: 403 })
    }

    const params = req.nextUrl.searchParams
    const page = parseInt(params.get('page') ?? '1', 10)
    const pageSize = Math.min(parseInt(params.get('page_size') ?? '20', 10), 50)
    const offset = (page - 1) * pageSize

    // Fetch unlocked profiles with crew details
    const { data: unlocks, error, count } = await supabase
      .from('recruiter_unlocks')
      .select(`
        id, unlocked_at,
        users!crew_user_id (
          id, full_name, display_name, handle, profile_photo_url,
          primary_role, departments, location_country, location_city,
          email, phone, whatsapp, show_email, show_phone, show_whatsapp,
          availability_status, availability_expires_at
        )
      `, { count: 'exact' })
      .eq('recruiter_id', recruiter.id)
      .order('unlocked_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Failed to fetch unlocked profiles:', error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    return NextResponse.json({
      results: unlocks ?? [],
      total: count ?? 0,
      page,
      page_size: pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 4.5 — Get Purchase History

**File to create:** `app/api/recruiter/purchases/route.ts`

```typescript
// GET /api/recruiter/purchases
// Returns credit purchase history and unlock history.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!recruiter) {
      return NextResponse.json({ error: 'Not a recruiter account' }, { status: 403 })
    }

    const [creditsRes, unlocksRes] = await Promise.all([
      supabase
        .from('recruiter_credits')
        .select('id, credits_purchased, credits_remaining, price_eur, purchased_at, expires_at')
        .eq('recruiter_id', recruiter.id)
        .order('purchased_at', { ascending: false }),
      supabase
        .from('recruiter_unlocks')
        .select(`
          id, unlocked_at,
          users!crew_user_id (id, display_name, full_name, primary_role, profile_photo_url, handle)
        `)
        .eq('recruiter_id', recruiter.id)
        .order('unlocked_at', { ascending: false })
        .limit(50),
    ])

    return NextResponse.json({
      credit_purchases: creditsRes.data ?? [],
      unlocks: unlocksRes.data ?? [],
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

---

## Part 5: Credit Expiry Cron Job

**File to create:** `app/api/cron/recruiter-credit-expiry/route.ts`

Runs monthly. Expires credit bundles where `expires_at < now()` and notifies recruiters.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { sendCreditExpiryEmail } from '@/lib/email/recruiter-credit-expiry'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization')
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    // Find expired bundles with remaining credits
    const { data: expiredBundles, error: fetchError } = await supabase
      .from('recruiter_credits')
      .select('id, recruiter_id, credits_remaining, expires_at')
      .gt('credits_remaining', 0)
      .lt('expires_at', now)

    if (fetchError) {
      console.error('Failed to fetch expired credit bundles:', fetchError)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    if (!expiredBundles?.length) {
      return NextResponse.json({ expired_bundles: 0, total_credits_expired: 0 })
    }

    // Group by recruiter for notification
    const recruiterCredits = new Map<string, number>()
    let totalExpired = 0

    for (const bundle of expiredBundles) {
      // Zero out remaining credits
      await supabase
        .from('recruiter_credits')
        .update({ credits_remaining: 0 })
        .eq('id', bundle.id)

      totalExpired += bundle.credits_remaining
      const current = recruiterCredits.get(bundle.recruiter_id) ?? 0
      recruiterCredits.set(bundle.recruiter_id, current + bundle.credits_remaining)
    }

    // Notify each affected recruiter
    for (const [recruiterId, expiredCount] of recruiterCredits) {
      const { data: recruiter } = await supabase
        .from('recruiters')
        .select('email, contact_name')
        .eq('id', recruiterId)
        .single()

      if (recruiter?.email) {
        await sendCreditExpiryEmail({
          email: recruiter.email,
          name: recruiter.contact_name,
          expiredCredits: expiredCount,
        }).catch((err: Error) => console.error(`Credit expiry email failed for ${recruiterId}:`, err))
      }

      trackServerEvent(recruiterId, 'recruiter_credits_expired', {
        expired_count: expiredCount,
      })
    }

    return NextResponse.json({
      expired_bundles: expiredBundles.length,
      total_credits_expired: totalExpired,
      recruiters_notified: recruiterCredits.size,
    })
  } catch (e) {
    return handleApiError(e)
  }
}
```

### Vercel Cron Configuration

**File to modify:** `vercel.json`

Add the credit expiry cron entry:

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
      "path": "/api/cron/recruiter-credit-expiry",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

**Schedule:** 1st of every month at 03:00 UTC — runs during low-traffic hours, monthly cadence matches 1-year credit expiry windows.

---

## Part 6: Email Templates

### 6.1 — Recruiter Welcome Email

**File to create:** `lib/email/recruiter-welcome.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface RecruiterWelcomeParams {
  email: string
  name: string
}

export async function sendRecruiterWelcomeEmail({ email, name }: RecruiterWelcomeParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'

  await sendNotifyEmail({
    to: email,
    subject: 'Welcome to YachtieLink Recruiter',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">YachtieLink Recruiter</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            Welcome to YachtieLink, ${name}!
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Your recruiter subscription is now active. Here&rsquo;s how it works:
          </p>
          <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#374151;line-height:2;">
            <li><strong>Search</strong> &mdash; Browse verified crew profiles filtered by role, experience, location, and endorsements</li>
            <li><strong>Unlock</strong> &mdash; Spend 1 credit to reveal a crew member&rsquo;s name and contact details</li>
            <li><strong>Build your pool</strong> &mdash; Every unlock is permanent. Your talent pool grows with each search session</li>
          </ul>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Crew choose to be visible to recruiters, so you&rsquo;re only seeing people open to opportunities.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${siteUrl}/recruiter/dashboard" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Go to your dashboard &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because you created a YachtieLink recruiter account.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Welcome to YachtieLink, ${name}!\n\nYour recruiter subscription is now active.\n\n- Search: Browse verified crew profiles\n- Unlock: Spend 1 credit to reveal name and contact details\n- Build your pool: Every unlock is permanent\n\nGo to your dashboard: ${siteUrl}/recruiter/dashboard`,
  })
}
```

### 6.2 — Credit Purchase Confirmation Email

**File to create:** `lib/email/recruiter-credit-purchase.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface CreditPurchaseParams {
  email: string
  name: string
  credits: number
  priceEur: number
}

export async function sendCreditPurchaseEmail({ email, name, credits, priceEur }: CreditPurchaseParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'

  await sendNotifyEmail({
    to: email,
    subject: `${credits} credits added to your account`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">YachtieLink Recruiter</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">
            Credits added
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${name}, <strong>${credits} credits</strong> have been added to your account for &euro;${priceEur.toFixed(2)}.
            These credits expire 1 year from purchase.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${siteUrl}/recruiter/search" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Start searching &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${name}, ${credits} credits have been added to your account for EUR ${priceEur.toFixed(2)}. These credits expire 1 year from purchase.\n\nStart searching: ${siteUrl}/recruiter/search`,
  })
}
```

### 6.3 — Credit Expiry Notification Email

**File to create:** `lib/email/recruiter-credit-expiry.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface CreditExpiryParams {
  email: string
  name: string
  expiredCredits: number
}

export async function sendCreditExpiryEmail({ email, name, expiredCredits }: CreditExpiryParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'

  await sendNotifyEmail({
    to: email,
    subject: `${expiredCredits} credit${expiredCredits === 1 ? '' : 's'} expired`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">YachtieLink Recruiter</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">
            Credits expired
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${name}, <strong>${expiredCredits}</strong> unused credit${expiredCredits === 1 ? '' : 's'} expired.
            Credits are valid for 1 year from purchase.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Need more credits? Purchase a new bundle to continue unlocking crew profiles.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${siteUrl}/recruiter/credits" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Purchase credits &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${name}, ${expiredCredits} unused credit${expiredCredits === 1 ? '' : 's'} expired. Credits are valid for 1 year from purchase.\n\nPurchase more: ${siteUrl}/recruiter/credits`,
  })
}
```

---

## Part 7: Crew Recruiter Visibility Toggle

### 7.1 — API Route for Recruiter Visibility

**File to create:** `app/api/recruiter-visibility/route.ts`

```typescript
// POST /api/recruiter-visibility
// Body: { visible: boolean }
// Response: { recruiter_visible: boolean }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { validateBody } from '@/lib/validation/validate'
import { z } from 'zod'

export const runtime = 'nodejs'

const recruiterVisibilitySchema = z.object({
  visible: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'profileEdit', user.id)
    if (limited) return limited

    const result = await validateBody(req, recruiterVisibilitySchema)
    if ('error' in result) return result.error
    const { visible } = result.data

    const { error } = await supabase
      .from('users')
      .update({ recruiter_visible: visible })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 })
    }

    trackServerEvent(user.id, 'crew_recruiter_visibility_toggled', {
      visible,
    })

    return NextResponse.json({ recruiter_visible: visible })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 7.2 — RecruiterVisibilityToggle Component

**File to create:** `components/profile/RecruiterVisibilityToggle.tsx`

```typescript
'use client'

interface RecruiterVisibilityToggleProps {
  initialVisible: boolean
}

// State: visible (boolean), isLoading
// UI:
//   ┌─────────────────────────────────────────────────┐
//   │ Visible to recruiters                [  Toggle ] │
//   │                                                 │
//   │ When enabled, recruiters can find your profile  │
//   │ in search results. Your name and contact        │
//   │ details are hidden until a recruiter unlocks    │
//   │ your profile.                                   │
//   └─────────────────────────────────────────────────┘
//
// Behaviour:
// - Toggle: POST /api/recruiter-visibility with { visible: !current }
// - Independent of availability toggle — different concerns
// - Does NOT expire (unlike availability which is 7 days)
// - Fire trackEvent('crew_recruiter_visibility_toggled', { visible })
```

### 7.3 — Profile Page Integration

**File to modify:** `app/(protected)/app/profile/page.tsx`

Add `recruiter_visible` to the user query select and render `RecruiterVisibilityToggle` after the `AvailabilityToggle` component (if Sprint 14 has shipped).

```typescript
// In the user query select:
// ...existing fields..., recruiter_visible

// Render below the availability toggle section:
<RecruiterVisibilityToggle initialVisible={user.recruiter_visible ?? false} />
```

---

## Part 8: Recruiter Pages (UI)

### 8.1 — Recruiter Dashboard

**File to create:** `app/recruiter/dashboard/page.tsx`

Server component. Uses `requireRecruiter()` auth guard.

```typescript
// Data fetching (via Promise.all):
// 1. Recruiter profile: company_name, contact_name, subscription_status, subscription_ends_at
// 2. Credit balance: rpc('get_recruiter_credit_balance', { p_recruiter_id })
// 3. Recent unlocks: recruiter_unlocks with users join, limit 5, order by unlocked_at desc
// 4. Recent credit purchases: recruiter_credits, limit 5, order by purchased_at desc

// Layout (375px mobile-first):
// ┌─────────────────────────────────────────┐
// │ RecruiterTopBar                         │
// │ [Company Name] · [Contact Name]         │
// │ Subscription: Active · Renews [date]    │
// ├─────────────────────────────────────────┤
// │ ┌─────────┐ ┌─────────┐                │
// │ │   42    │ │    7    │                │
// │ │ credits │ │unlocked │                │
// │ └─────────┘ └─────────┘                │
// │ Next expiry: 15 Mar 2027               │
// ├─────────────────────────────────────────┤
// │ Quick Actions                           │
// │ [Search Crew]  [Purchase Credits]       │
// │ [View Unlocked]  [Manage Subscription]  │
// ├─────────────────────────────────────────┤
// │ Recently Unlocked                       │
// │ [Photo] Jane Smith · Chief Stew         │
// │ [Photo] John Doe · Captain              │
// │ View all →                              │
// ├─────────────────────────────────────────┤
// │ Purchase History                        │
// │ 50 credits — EUR 250 · 12 Jan 2027     │
// │ 25 credits — EUR 150 · 3 Dec 2026      │
// └─────────────────────────────────────────┘
```

### 8.2 — Recruiter Top Bar Component

**File to create:** `components/recruiter/RecruiterTopBar.tsx`

Persistent header for recruiter pages. Shows credit balance, company name, and nav links.

```typescript
// Props: companyName, creditBalance, subscriptionStatus
// Links: Dashboard, Search, Unlocked, Credits
// Credit badge: persistent display of "N credits" in the header
// Sign out button
```

### 8.3 — Recruiter Subscribe Page

**File to create:** `app/recruiter/subscribe/page.tsx`

Shown when recruiter has no active subscription. Explains the model and has a CTA to start the Stripe Checkout flow.

```typescript
// UI:
// ┌─────────────────────────────────────────┐
// │ Subscribe to start searching            │
// │                                         │
// │ EUR 29/month                            │
// │ - Search verified crew profiles         │
// │ - Filter by role, experience, location  │
// │ - Sort by endorsements and sea time     │
// │ - Unlock profiles with credits          │
// │                                         │
// │ [Subscribe — EUR 29/month]              │
// └─────────────────────────────────────────┘
//
// On click: POST /api/recruiter/stripe/checkout { type: 'subscription' }
// Redirect to session.url
```

### 8.4 — Recruiter Search Page

**File to create:** `app/recruiter/search/page.tsx`

Server component wrapping a client search component. Auth-gated with `requireRecruiter()` + `requireActiveSubscription()`.

```typescript
// Uses RecruiterSearchClient component for interactive search.
// Server component fetches initial data and passes recruiter context.
```

**File to create:** `components/recruiter/RecruiterSearchClient.tsx`

Client component.

```typescript
'use client'

// State: filters, results, page, sort, isLoading
// Filter bar: department, role, location, availability, min endorsements, min sea time, yacht size
// Sort: relevance, endorsement_count, sea_time, recently_active
// On search: GET /api/recruiter/search?...params
// Results: RecruiterSearchCard for each result
```

### 8.5 — Recruiter Search Card Component

**File to create:** `components/recruiter/RecruiterSearchCard.tsx`

```typescript
interface RecruiterSearchCardProps {
  id: string
  profilePhotoUrl: string | null
  primaryRole: string | null
  departments: string[] | null
  locationCountry: string | null
  locationCity: string | null       // null if locked
  fullName: string | null           // null if locked
  handle: string | null             // null if locked
  contactEmail: string | null       // null if locked
  contactPhone: string | null       // null if locked
  contactWhatsapp: string | null    // null if locked
  endorsementCount: number
  endorserCount: number
  endorsementYachtCount: number
  seaTimeDays: number
  availabilityStatus: string | null
  isUnlocked: boolean
  creditBalance: number             // to show unlock affordability
  onUnlock: (crewUserId: string) => Promise<void>
}

// Locked state:
// ┌─────────────────────────────────────────────────┐
// │ [Photo]  Crew Member #a3f2...                   │
// │          Captain · Deck                         │
// │          France                                 │
// │          14 endorsements from 8 people           │
// │          across 5 yachts                        │
// │          Sea time: 4.2 years                    │
// │          ● Available                            │
// │                                                 │
// │          [Unlock — 1 credit]                    │
// └─────────────────────────────────────────────────┘

// Unlocked state:
// ┌─────────────────────────────────────────────────┐
// │ [Photo]  Jane Smith                             │
// │          Captain · Deck                         │
// │          Nice, France                           │
// │          14 endorsements from 8 people           │
// │          across 5 yachts                        │
// │          Sea time: 4.2 years                    │
// │          ● Available                            │
// │          jane@email.com · +33 6 12 34 56 78     │
// │          ✓ Already unlocked                     │
// │          [View full profile →]                  │
// └─────────────────────────────────────────────────┘

// Unlock flow:
// 1. Click "Unlock — 1 credit"
// 2. Show confirmation dialog: "Spend 1 credit to unlock [role]'s name and contact details? You have [N] credits remaining."
// 3. On confirm: POST /api/recruiter/unlock { crew_user_id: id }
// 4. On success: refresh card to unlocked state
// 5. On insufficient_credits: show "Purchase credits" CTA
```

### 8.6 — Recruiter Unlocked Profiles Page

**File to create:** `app/recruiter/unlocked/page.tsx`

Server component. Shows all unlocked profiles.

```typescript
// Auth guard: requireRecruiter()
// Data: GET /api/recruiter/unlocked (paginated)
// UI: Grid of unlocked crew cards with full details
// Each card links to /u/[handle] for full public profile view
```

### 8.7 — Recruiter Credits Page

**File to create:** `app/recruiter/credits/page.tsx`

Shows current credit balance, bundle purchase options, and purchase history.

```typescript
// Auth guard: requireRecruiter() + requireActiveSubscription()
// Data: credit balance (RPC), purchase history
// UI:
// ┌─────────────────────────────────────────┐
// │ Credits                                 │
// │ Balance: 42 credits                     │
// │ Next expiry: 15 Mar 2027 (12 credits)  │
// ├─────────────────────────────────────────┤
// │ Purchase Credits                        │
// │ ┌─────────────────────────┐             │
// │ │ 10 credits — EUR 75     │ [Buy]       │
// │ │ EUR 7.50/credit         │             │
// │ ├─────────────────────────┤             │
// │ │ 25 credits — EUR 150    │ [Buy]       │
// │ │ EUR 6.00/credit         │             │
// │ ├─────────────────────────┤             │
// │ │ 50 credits — EUR 250    │ [Buy]       │ ← BEST VALUE badge
// │ │ EUR 5.00/credit         │             │
// │ ├─────────────────────────┤             │
// │ │ 100 credits — EUR 400   │ [Buy]       │
// │ │ EUR 4.00/credit         │             │
// │ ├─────────────────────────┤             │
// │ │ 200 credits — EUR 1200  │ [Buy]       │
// │ │ EUR 6.00/credit         │             │
// │ └─────────────────────────┘             │
// │                                         │
// │ On Buy: POST /api/recruiter/stripe/checkout
// │         { type: 'credits', bundle_id }  │
// │ Redirect to Stripe Checkout             │
// └─────────────────────────────────────────┘
```

---

## Part 9: Validation Schemas

**File to modify:** `lib/validation/schemas.ts`

Add schemas for the new recruiter API endpoints:

```typescript
// Recruiter Stripe checkout
export const recruiterCheckoutSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('subscription') }),
  z.object({ type: z.literal('credits'), bundle_id: z.string() }),
])

// Recruiter unlock
export const recruiterUnlockSchema = z.object({
  crew_user_id: z.string().uuid(),
})

// Recruiter visibility toggle (crew-side)
export const recruiterVisibilitySchema = z.object({
  visible: z.boolean(),
})
```

---

## Part 10: Rate Limit Configuration

**File to modify:** `lib/rate-limit/helpers.ts`

Add rate limit entries for recruiter actions:

```typescript
export const RATE_LIMITS = {
  // ... existing entries ...
  recruiterUnlock:  { limit: 30,  window: 60 * 60,  scope: 'user' as const }, // 30 unlocks/hr — generous for active sessions
  recruiterSearch:  { limit: 60,  window: 60,        scope: 'user' as const }, // 60 searches/min — same as crew search
} as const
```

**Note:** The `recruiterSearch` rate limit reuses the `search` category's limit values. The `recruiterUnlock` limit of 30/hr prevents abuse while allowing productive search sessions (a recruiter might unlock 10-20 profiles in a focused session).

---

## Part 11: PostHog Events

### Client-Side Events

| Event | Properties | When |
|-------|-----------|------|
| `recruiter_signup` | `{ company_name }` | Recruiter submits signup form |
| `recruiter_search_executed` | `{ filters, sort, result_count }` | Search results load |
| `recruiter_profile_unlock_clicked` | `{ crew_role, crew_department }` | Unlock button clicked (before confirmation) |
| `recruiter_profile_unlocked` | `{ crew_user_id }` | Unlock confirmed and successful |
| `recruiter_unlock_insufficient_credits` | `{ crew_user_id }` | Unlock fails — no credits |
| `recruiter_credit_purchase_started` | `{ bundle_id, credits, price_eur }` | Buy button clicked on credits page |
| `crew_recruiter_visibility_toggled` | `{ visible }` | Crew toggles recruiter visibility |

### Server-Side Events

| Event | Properties | When |
|-------|-----------|------|
| `recruiter_subscription_started` | `{}` | Webhook: subscription.created (recruiter) |
| `recruiter_subscription_cancelled` | `{}` | Webhook: subscription.deleted (recruiter) |
| `recruiter_credits_purchased` | `{ bundle_id, credits, price_eur }` | Webhook: checkout.session.completed (payment) |
| `recruiter_search_executed` | `{ filters, sort, result_count }` | GET /api/recruiter/search |
| `recruiter_profile_unlocked` | `{ crew_user_id }` | POST /api/recruiter/unlock (success) |
| `recruiter_unlock_insufficient_credits` | `{ crew_user_id }` | POST /api/recruiter/unlock (no credits) |
| `recruiter_credits_expired` | `{ expired_count }` | Cron: credit expiry |
| `crew_recruiter_visibility_toggled` | `{ visible }` | POST /api/recruiter-visibility |

---

## Part 12: File-by-File Implementation Order

Build in this order. Each file depends only on files above it.

### Phase A: Database + Core Backend (no UI)

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 1 | `supabase/migrations/20260322000003_sprint19_recruiter_access.sql` | Create | None | Full SQL from Part 1 — all tables, indexes, RLS, RPCs, GRANTs |
| 2 | `lib/validation/schemas.ts` | Modify | None | Add recruiter schemas (Part 9) |
| 3 | `lib/rate-limit/helpers.ts` | Modify | None | Add `recruiterUnlock`, `recruiterSearch` entries (Part 10) |
| 4 | `lib/recruiter/credit-bundles.ts` | Create | None | Credit bundle config (Part 3.2) |
| 5 | `lib/recruiter/auth-guard.ts` | Create | #1 | `requireRecruiter()`, `requireActiveSubscription()` (Part 2.7) |

### Phase B: Recruiter Auth Flow

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 6 | `app/recruiter/layout.tsx` | Create | None | Recruiter layout (Part 2.6) |
| 7 | `app/recruiter/signup/page.tsx` | Create | #6 | Signup form (Part 2.2) |
| 8 | `app/recruiter/auth/callback/route.ts` | Create | #1, #6 | Email verification + recruiter record creation (Part 2.1) |
| 9 | `app/recruiter/login/page.tsx` | Create | #6 | Login form (Part 2.3) |
| 10 | `app/recruiter/reset-password/page.tsx` | Create | #6 | Password reset request (Part 2.4) |
| 11 | `app/recruiter/update-password/page.tsx` | Create | #6 | Password update form (Part 2.5) |

### Phase C: Email Templates

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 12 | `lib/email/recruiter-welcome.ts` | Create | `lib/email/notify.ts` | Welcome email (Part 6.1) |
| 13 | `lib/email/recruiter-credit-purchase.ts` | Create | `lib/email/notify.ts` | Credit purchase confirmation (Part 6.2) |
| 14 | `lib/email/recruiter-credit-expiry.ts` | Create | `lib/email/notify.ts` | Credit expiry notification (Part 6.3) |

### Phase D: Stripe Integration + API Routes

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 15 | `app/api/recruiter/stripe/checkout/route.ts` | Create | #1, #2, #4, #5 | Subscription + credit checkout (Part 3.3) |
| 16 | `app/api/recruiter/stripe/portal/route.ts` | Create | #1, #5 | Billing portal (Part 3.4) |
| 17 | `app/api/stripe/webhook/route.ts` | Modify | #1, #12, #13 | Extend with recruiter events (Part 3.5) |
| 18 | `app/api/recruiter/me/route.ts` | Create | #1 | Get recruiter profile (Part 4.1) |
| 19 | `app/api/recruiter/unlock/route.ts` | Create | #1, #2, #3 | Unlock crew profile (Part 4.2) |
| 20 | `app/api/recruiter/search/route.ts` | Create | #1, #3 | Recruiter search (Part 4.3) |
| 21 | `app/api/recruiter/unlocked/route.ts` | Create | #1 | Get unlocked profiles (Part 4.4) |
| 22 | `app/api/recruiter/purchases/route.ts` | Create | #1 | Get purchase history (Part 4.5) |
| 23 | `app/api/recruiter-visibility/route.ts` | Create | #1, #2 | Crew visibility toggle (Part 7.1) |
| 24 | `app/api/cron/recruiter-credit-expiry/route.ts` | Create | #1, #14 | Credit expiry cron (Part 5) |
| 25 | `vercel.json` | Modify | None | Add cron schedule (Part 5) |

### Phase E: Recruiter UI Components

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 26 | `components/recruiter/RecruiterTopBar.tsx` | Create | None | Persistent header (Part 8.2) |
| 27 | `components/recruiter/RecruiterSearchCard.tsx` | Create | #19 | Search result card (Part 8.5) |
| 28 | `components/recruiter/RecruiterSearchClient.tsx` | Create | #20, #27 | Search client component (Part 8.4) |
| 29 | `components/profile/RecruiterVisibilityToggle.tsx` | Create | #23 | Crew opt-in toggle (Part 7.2) |

### Phase F: Recruiter Pages

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 30 | `app/recruiter/dashboard/page.tsx` | Create | #5, #18, #26 | Dashboard (Part 8.1) |
| 31 | `app/recruiter/subscribe/page.tsx` | Create | #5, #15 | Subscription paywall (Part 8.3) |
| 32 | `app/recruiter/search/page.tsx` | Create | #5, #28 | Search page (Part 8.4) |
| 33 | `app/recruiter/unlocked/page.tsx` | Create | #5, #21 | Unlocked profiles (Part 8.6) |
| 34 | `app/recruiter/credits/page.tsx` | Create | #5, #4, #15 | Credit purchase page (Part 8.7) |

### Phase G: Crew-Side Integration

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 35 | `app/(protected)/app/profile/page.tsx` | Modify | #29 | Add RecruiterVisibilityToggle (Part 7.3) |

### Phase H: Cleanup + Documentation

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 36 | `CHANGELOG.md` | Modify | All | Document all Sprint 19 work |
| 37 | `docs/modules/recruiter.md` | Create | All | New module state file for recruiter subsystem |
| 38 | `docs/modules/profile.md` | Modify | #35 | Update with recruiter_visible column |
| 39 | `docs/yl_schema.md` | Modify | #1 | Document new tables and columns |
| 40 | `sprints/major/phase-2/sprint-19/README.md` | Modify | All | Update status to completed |

---

## Part 13: Testing Checklist

### Recruiter Signup + Auth

- [ ] Navigate to `/recruiter/signup` — form renders with all 4 fields
- [ ] Submit with valid data — Supabase `auth.signUp` fires, "Check your email" shown
- [ ] Email verification link redirects to `/recruiter/auth/callback`
- [ ] Callback creates `recruiters` record with correct `auth_user_id`, `email`, `company_name`, `contact_name`
- [ ] Callback sets `email_verified = true`
- [ ] Callback redirects to `/recruiter/dashboard`
- [ ] Signing up with an existing email shows appropriate error
- [ ] Password must be minimum 8 characters
- [ ] Company name and contact name are required
- [ ] PostHog event `recruiter_signup` fires on form submission

### Recruiter Login

- [ ] Navigate to `/recruiter/login` — form renders
- [ ] Login with valid recruiter credentials — redirects to `/recruiter/dashboard`
- [ ] Login with crew credentials — shows "not a recruiter account" error
- [ ] Login with wrong password — shows auth error
- [ ] "Forgot password" link goes to `/recruiter/reset-password`
- [ ] Password reset email sends, link works, password updates

### Recruiter Subscription

- [ ] Recruiter without subscription sees `/recruiter/subscribe` paywall
- [ ] "Subscribe" button → POST to checkout API → redirects to Stripe Checkout
- [ ] Stripe Checkout completes → webhook fires → `subscription_status` updated to `active`
- [ ] Welcome email sent on subscription creation
- [ ] Dashboard shows subscription status and next billing date
- [ ] "Manage subscription" → Stripe Customer Portal opens
- [ ] Cancel subscription → status updated to `cancelled`, search access revoked
- [ ] Cancelled recruiter cannot access search or unlock endpoints (402 response)
- [ ] Previously unlocked profiles remain accessible after cancellation
- [ ] Payment failure → `past_due` status → 3-day grace period → access revoked if not resolved

### Credit Purchase

- [ ] Credits page shows all 5 bundle tiers with correct pricing
- [ ] "Buy" button → POST to checkout API → redirects to Stripe Checkout (payment mode)
- [ ] Stripe payment completes → webhook creates `recruiter_credits` record
- [ ] Credits record has correct `credits_purchased`, `credits_remaining`, `price_eur`, `expires_at` (1 year)
- [ ] Credit balance updates in dashboard and top bar
- [ ] Credit purchase confirmation email sent
- [ ] PostHog event `recruiter_credits_purchased` fires

### Profile Unlock

- [ ] Locked search result card shows: photo, role, department, country, endorsement summary, sea time, availability badge
- [ ] Locked card does NOT show: name, city, contact details, handle
- [ ] "Unlock — 1 credit" button shown on locked cards
- [ ] Click unlock → confirmation dialog shows credit cost and remaining balance
- [ ] Confirm unlock → POST to unlock API → card refreshes to unlocked state
- [ ] Unlocked card shows: full name, city, contact details (based on crew visibility settings), "View full profile" link
- [ ] Credit balance decrements by 1
- [ ] Already-unlocked profiles show "Already unlocked" badge, no charge button
- [ ] Unlock is idempotent — re-unlocking returns `already_unlocked`, no credit charge
- [ ] Insufficient credits → "Purchase credits" CTA shown
- [ ] PostHog events: `recruiter_profile_unlocked` on success, `recruiter_unlock_insufficient_credits` on failure
- [ ] Concurrent unlock requests for same pair: only one credit charged (unique constraint)

### FIFO Credit Deduction

- [ ] Purchase two bundles at different times
- [ ] Unlock a profile → credit deducted from OLDER bundle
- [ ] Deplete older bundle → next unlock deducts from newer bundle
- [ ] Expired bundle's credits are NOT deducted (skipped in FIFO)

### Recruiter Search

- [ ] Search page loads with filter bar and empty state
- [ ] Execute search → results returned from `search_crew_recruiter` RPC
- [ ] Only crew with `recruiter_visible = true` appear in results
- [ ] Crew with `recruiter_visible = false` do NOT appear
- [ ] Department filter works
- [ ] Role filter works (ILIKE partial match)
- [ ] Location country filter works
- [ ] Availability filter works (only shows crew with active availability)
- [ ] Minimum endorsements filter works
- [ ] Minimum sea time filter works
- [ ] Minimum yacht length filter works
- [ ] Sort by endorsement_count DESC works
- [ ] Sort by sea_time DESC works
- [ ] Sort by recently_active works
- [ ] Default sort (relevance) = endorsement_count DESC, then sea_time DESC
- [ ] Pagination works (page param, correct offset)
- [ ] Endorsement summary displays correctly: "X endorsements from Y people across Z yachts"
- [ ] Subscription required — 402 returned without active subscription
- [ ] PostHog event `recruiter_search_executed` fires with filters and result count

### Crew Recruiter Visibility Toggle

- [ ] Toggle appears on crew profile page, separate from availability toggle
- [ ] Default state is OFF
- [ ] Toggle ON → `recruiter_visible = true` in DB
- [ ] Toggle OFF → `recruiter_visible = false` in DB
- [ ] Toggle is independent of availability toggle
- [ ] Toggle does NOT expire (unlike availability)
- [ ] Explanation text shown: "When enabled, recruiters can find your profile in search results..."
- [ ] PostHog event `crew_recruiter_visibility_toggled` fires

### Recruiter Dashboard

- [ ] Shows company name, contact name, subscription status
- [ ] Shows credit balance and next expiry date
- [ ] Shows count of unlocked profiles
- [ ] Quick action links: Search, Purchase Credits, View Unlocked, Manage Subscription
- [ ] Recently unlocked profiles section with correct data
- [ ] Purchase history section with correct data

### Credit Expiry Cron

- [ ] Cron endpoint returns 401 without valid `CRON_SECRET`
- [ ] Cron finds bundles with `expires_at < now()` and `credits_remaining > 0`
- [ ] Cron sets `credits_remaining = 0` on expired bundles
- [ ] Cron sends expiry notification email to affected recruiters
- [ ] Cron fires `recruiter_credits_expired` PostHog event
- [ ] Cron returns correct counts

### RLS Policies

- [ ] `recruiters`: recruiter can only SELECT their own record
- [ ] `recruiters`: recruiter can only UPDATE their own record
- [ ] `recruiters`: no INSERT policy for authenticated users (service role only)
- [ ] `recruiter_credits`: recruiter can only SELECT their own credits
- [ ] `recruiter_credits`: no INSERT/UPDATE/DELETE for authenticated users (service role only)
- [ ] `recruiter_unlocks`: recruiter can only SELECT their own unlocks
- [ ] `recruiter_unlocks`: no INSERT/UPDATE/DELETE for authenticated users (RPC uses security definer)
- [ ] Recruiters CAN read `users`, `yachts`, `attachments`, `endorsements` (existing public read policies)
- [ ] Recruiters CANNOT write to `users`, `yachts`, `attachments`, `endorsements`, `endorsement_requests`, etc.
- [ ] Crew CANNOT read `recruiters`, `recruiter_credits`, `recruiter_unlocks` tables

### Account Isolation

- [ ] Crew user cannot access `/recruiter/dashboard` (redirected to login)
- [ ] Recruiter cannot access `/app/profile` (no `users` record → redirected to onboarding → fails)
- [ ] Recruiter cannot POST to `/api/endorsements` (no `users` record, RLS blocks)
- [ ] Recruiter cannot POST to `/api/attachments` (no `users` record, RLS blocks)
- [ ] Recruiter cannot POST to `/api/endorsement-signals` (no `users` record, RLS blocks)
- [ ] Crew user calling `/api/recruiter/unlock` gets 403 (no recruiter record)

### Mobile Responsiveness

- [ ] Recruiter signup page: all fields visible at 375px
- [ ] Recruiter dashboard: stat cards stack correctly at 375px
- [ ] Search results: cards stack full-width at 375px
- [ ] Unlock confirmation dialog: readable at 375px
- [ ] Credits page: bundle cards stack correctly at 375px
- [ ] Top bar: responsive at 375px, no overflow

### Rate Limiting

- [ ] POST `/api/recruiter/unlock`: rate limited at 30/hr per user
- [ ] GET `/api/recruiter/search`: rate limited at 60/min per user
- [ ] POST `/api/recruiter/stripe/checkout`: rate limited at 10/15min per IP

---

## Part 14: Rollback Plan

### If Migration Fails

The migration is additive only (new tables, new columns, new functions). It does not modify existing data. Rollback:

```sql
-- Reverse Sprint 19 migration (run manually if needed)

-- Drop functions first (depend on tables)
DROP FUNCTION IF EXISTS public.search_crew_recruiter(uuid, jsonb, text, int, int);
DROP FUNCTION IF EXISTS public.unlock_crew_profile(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_recruiter_credit_balance(uuid);
DROP FUNCTION IF EXISTS public.get_endorsement_summary(uuid);
DROP FUNCTION IF EXISTS public.is_recruiter();
DROP FUNCTION IF EXISTS public.get_recruiter_id_from_auth();

-- Drop tables (order matters: unlocks references credits, credits references recruiters)
DROP TABLE IF EXISTS public.recruiter_unlocks;
DROP TABLE IF EXISTS public.recruiter_credits;
DROP TABLE IF EXISTS public.recruiters;

-- Remove column from users
ALTER TABLE public.users DROP COLUMN IF EXISTS recruiter_visible;

-- Drop indexes (most are dropped with their tables, but the users index persists)
DROP INDEX IF EXISTS idx_users_recruiter_visible;
```

### If Recruiter Auth Breaks

1. The recruiter pages are under `/recruiter/*` — completely isolated from crew routes
2. Remove or comment out the recruiter layout to disable all recruiter pages
3. Crew auth flow is unaffected — different routes, different tables

### If Stripe Webhook Breaks

1. The webhook handler changes are conditional on `account_type === 'recruiter'` metadata
2. Roll back the webhook changes only — crew subscription handling remains intact
3. Manual credit crediting can be done via Supabase Dashboard using service role if webhook is down temporarily

### If Credit Deduction Breaks

1. The `unlock_crew_profile` RPC is transactional — either both the credit deduction and unlock succeed, or neither does
2. If the RPC itself fails, disable the unlock endpoint while debugging
3. Previously unlocked profiles remain accessible
4. Credits are not lost — they remain in `recruiter_credits` until successfully deducted

### If Search RPC Breaks

1. The search API route can fall back to a simpler query (direct table query without the RPC)
2. The search page can show an error state while the RPC is fixed
3. Unlocked profiles page still works independently of search

### Full Rollback

Roll back the Vercel deployment: `vercel rollback`

This reverts to the pre-Sprint-19 deployment. Database tables and columns will still exist but will be unused. The application code from the previous deployment does not reference them.

**Data safety:** No existing crew data is modified by Sprint 19. The migration only adds new tables, a new column (with default), and new functions. Rolling back code does not require rolling back the migration.

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S19-01 | Separate `recruiters` table instead of `account_type` column on `users` | Clean separation prevents accidental cross-contamination. Different RLS, different middleware, different routes. The small cost of duplicated auth utilities is worth the safety. |
| D-S19-02 | Recruiters use Supabase Auth (same auth system as crew) with a separate `auth.users` entry | Reuses existing auth infrastructure (email verification, password reset, PKCE). The separation is at the data layer (`public.recruiters` vs `public.users`), not the auth layer. |
| D-S19-03 | `auth_user_id` column links to `auth.users` rather than using the `auth.uid()` as the PK | Allows the recruiter's PK to be a separate UUID from their auth UUID. Cleaner for foreign keys within the recruiter subsystem. |
| D-S19-04 | `unlock_crew_profile()` RPC handles the entire atomic transaction | Credit deduction + unlock creation must be atomic. If either fails, neither should persist. The RPC uses `FOR UPDATE` row locking and a unique constraint exception handler to prevent race conditions. |
| D-S19-05 | FIFO credit deduction ordered by `expires_at ASC, purchased_at ASC` | Use oldest credits first to prevent unexpected expiry of newer purchases. If two bundles have the same expiry (bought on same day), use the one purchased first. |
| D-S19-06 | Credit expiry cron runs monthly, not daily | Credits expire 1 year from purchase. Monthly checks are sufficient resolution. Running daily would be wasteful for a yearly expiry window. |
| D-S19-07 | Webhook handler extended (not duplicated) for recruiter events | Single webhook endpoint, discriminated by `account_type` metadata on the Stripe object. Avoids maintaining two webhook endpoints with the same signature verification logic. |
| D-S19-08 | No INSERT RLS policy on `recruiters` for authenticated users | Prevents a crew user from creating a recruiter record via the Supabase client. Recruiter records are created only by the service role during the auth callback flow. |
| D-S19-09 | Search RPC returns both locked and unlocked results in one query | Avoids two separate queries (one for locked, one for unlocked). The RPC conditionally includes/excludes name and contact fields based on unlock status. Single query, single network round trip. |
| D-S19-10 | `recruiter_visible` toggle is independent of `availability_status` | Different use cases: availability is "I'm looking for work right now" (7-day expiry, time-sensitive). Recruiter visibility is "recruiters can find me" (persistent, not time-sensitive). A crew member may want one without the other. |
