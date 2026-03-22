# Sprint 18 — Peer Hiring: Build Plan

## Context

Sprint 18 is the first Phase 2 feature. The yacht graph becomes economically useful: crew post positions, other crew apply with their existing profile, and graph proximity (mutual colleagues, shared yachts, endorsement overlap) is visible to both sides. This is peer-to-peer hiring powered by the trust graph, not a job board (D-022). No paid listings, no placement fees, no algorithmic matching.

### Decision Context

- **D-022 (Constitutional):** Free peer hiring. Users with full profiles can post jobs for free. No payment, no recruiter tools. Jobs are a use case for the graph, not a separate product.
- **D-023 (Operational):** Pro tier limits. Free: 1 active position/month. Pro: 3 active positions/month.

### What Already Exists (No Build Needed)

| Dependency | Status | Notes |
|-----------|--------|-------|
| `users` table with `subscription_status`, `onboarding_complete` | Exists | Sprint 3, Sprint 7 |
| `attachments` table with `user_id`, `yacht_id`, `started_at`, `ended_at` | Exists | Sprint 2–4 |
| `yachts` table with `name`, `yacht_type`, `length_meters` | Exists | Sprint 4 |
| `endorsements` table with `endorser_id`, `recipient_id`, `yacht_id` | Exists | Sprint 5 |
| `get_colleagues(p_user_id)` RPC → `TABLE(colleague_id uuid, shared_yachts uuid[])` | Exists | Sprint 4, `20260313000004_functions.sql` |
| `get_mutual_colleagues(p_viewer_id, p_profile_id)` RPC → `TABLE(mutual_colleague_id uuid)` | Exists | Sprint 12 build plan — defined in migration |
| Stripe Pro subscription check (`subscription_status = 'pro'`) | Exists | Sprint 7, `20260315000018` |
| Resend email infrastructure (`lib/email/notify.ts`, `sendNotifyEmail`) | Exists | Sprint 2, 5 |
| Cron job infrastructure (`vercel.json`, `CRON_SECRET` pattern) | Exists | Sprint 8 |
| `createServiceClient()` admin Supabase client | Exists | `lib/supabase/admin.ts` |
| Rate limiting (`lib/rate-limit/helpers.ts`, `applyRateLimit`) | Exists | Sprint 8 |
| Validation (`lib/validation/validate.ts`, `validateBody`, Zod) | Exists | Sprint 5 |
| PostHog client (`lib/analytics/events.ts`, `trackEvent`) | Exists | Sprint 8 |
| PostHog server (`lib/analytics/server.ts`, `trackServerEvent`) | Exists | Sprint 8 |
| `handleApiError` utility | Exists | `lib/api/errors.ts` |
| `set_updated_at()` trigger function | Exists | `20260313000004_functions.sql` |
| App layout with `BottomTabBar`, `SidebarNav` | Exists | `app/(protected)/app/layout.tsx` |
| Nav config (`lib/nav-config.ts`) | Exists | Sprint 11 |
| Section colour system (`lib/section-colors.ts`) | Exists | Sprint 11 |
| Roles reference table (seeded departments and roles) | Exists | `20260313000006_seed_reference.sql` |
| Availability system with contact method visibility | Exists | Sprint 14 |

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
- Route convention: `app/(protected)/app/<section>/page.tsx` for authenticated pages
- API route convention: `app/api/<resource>/route.ts`

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260322000002_sprint18_peer_hiring.sql`

### 1.1 — Positions Table

```sql
-- Sprint 18: Peer Hiring — Positions + Applications
-- See sprints/major/phase-2/sprint-18/build_plan.md for full specification.

-- ═══════════════════════════════════════════════════════════
-- 1. POSITIONS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.positions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id   uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  yacht_id    uuid NOT NULL REFERENCES public.yachts (id) ON DELETE RESTRICT,

  -- Position details
  role        text NOT NULL,
  department  text NOT NULL,
  description text,
  start_date  date NOT NULL,
  duration    text NOT NULL DEFAULT 'Permanent',
  location    text,

  -- Lifecycle
  status      text NOT NULL DEFAULT 'open',
  expires_at  timestamptz NOT NULL,

  -- System
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT description_length CHECK (
    description IS NULL OR char_length(description) BETWEEN 50 AND 2000
  ),
  CONSTRAINT location_length CHECK (
    location IS NULL OR char_length(location) <= 200
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('open', 'filled', 'expired', 'closed')
  ),
  CONSTRAINT valid_duration CHECK (
    duration IN ('Permanent', 'Season', 'Temporary', 'Day work')
  ),
  CONSTRAINT role_length CHECK (char_length(role) BETWEEN 1 AND 100),
  CONSTRAINT department_length CHECK (char_length(department) BETWEEN 1 AND 100)
);

-- Feed query index: open positions sorted by creation date, filtered by department
CREATE INDEX idx_positions_feed
  ON public.positions (status, department, created_at DESC)
  WHERE status = 'open';

-- My positions query: poster's positions grouped by status
CREATE INDEX idx_positions_poster
  ON public.positions (poster_id, status, created_at DESC);

-- Expiry cron: find positions past their expiry date
CREATE INDEX idx_positions_expiry
  ON public.positions (expires_at)
  WHERE status = 'open';

-- Expiry warning cron: find positions expiring within 3 days
CREATE INDEX idx_positions_expiry_warning
  ON public.positions (expires_at)
  WHERE status = 'open';

-- Auto-update updated_at
CREATE TRIGGER set_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 1.2 — Position Applications Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. POSITION APPLICATIONS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.position_applications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id  uuid NOT NULL REFERENCES public.positions (id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,

  -- Application details
  status       text NOT NULL DEFAULT 'applied',
  message      text,

  -- System
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_application_status CHECK (
    status IN ('applied', 'viewed', 'shortlisted', 'rejected')
  ),
  CONSTRAINT message_length CHECK (
    message IS NULL OR char_length(message) <= 500
  )
);

-- One application per position per user
CREATE UNIQUE INDEX idx_position_applications_unique
  ON public.position_applications (position_id, applicant_id);

-- Poster's inbox: applications for a specific position
CREATE INDEX idx_position_applications_position
  ON public.position_applications (position_id, created_at DESC);

-- Applicant's applications: see own application history
CREATE INDEX idx_position_applications_applicant
  ON public.position_applications (applicant_id, created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_position_applications_updated_at
  BEFORE UPDATE ON public.position_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 1.3 — RLS Policies

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- ── Positions ──

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read open positions
CREATE POLICY "positions: authenticated read open"
  ON public.positions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      status = 'open'
      OR poster_id = auth.uid()  -- poster can always see their own positions (any status)
    )
  );

-- Only poster can insert (with current attachment validation done in API)
CREATE POLICY "positions: own insert"
  ON public.positions FOR INSERT
  WITH CHECK (auth.uid() = poster_id);

-- Only poster can update their own positions
CREATE POLICY "positions: own update"
  ON public.positions FOR UPDATE
  USING (auth.uid() = poster_id);

-- Only poster can delete their own positions (soft-close preferred, but allow)
CREATE POLICY "positions: own delete"
  ON public.positions FOR DELETE
  USING (auth.uid() = poster_id);

-- ── Position Applications ──

ALTER TABLE public.position_applications ENABLE ROW LEVEL SECURITY;

-- Poster can read applications to their positions; applicant can read own applications
CREATE POLICY "position_applications: poster or applicant read"
  ON public.position_applications FOR SELECT
  USING (
    auth.uid() = applicant_id
    OR EXISTS (
      SELECT 1 FROM public.positions p
      WHERE p.id = position_id
        AND p.poster_id = auth.uid()
    )
  );

-- Applicant can insert their own application
CREATE POLICY "position_applications: own insert"
  ON public.position_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- Poster can update application status (viewed/shortlisted/rejected)
CREATE POLICY "position_applications: poster update"
  ON public.position_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.positions p
      WHERE p.id = position_id
        AND p.poster_id = auth.uid()
    )
  );

-- No delete policy — applications are permanent records
```

### 1.4 — Graph Proximity RPC

This is the core RPC for the sprint. Returns structured proximity data between any two users. Designed as a general-purpose utility that Sprint 19 (recruiter search), Sprint 20 (agency views), and Sprint 21 (messaging) will reuse.

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. GRAPH PROXIMITY RPC
-- ═══════════════════════════════════════════════════════════

-- Returns the graph proximity between two users.
-- Proximity levels (checked in priority order):
--   1. 'direct_colleague' — shared current or past yacht attachment
--   2. 'second_degree'    — colleague of colleague (2-hop via shared yacht)
--   3. 'shared_yacht_history' — both attached to same yacht but non-overlapping
--   4. 'endorsement_overlap'  — direct endorsement relationship
--   5. 'none' — no graph connection
--
-- Returns JSON: { level, shared_yachts[], connecting_colleague, context_text }
--
-- Performance note: At 10K+ users, the 2-hop traversal in second_degree can be
-- expensive. The function short-circuits at the first match found (priority order).

CREATE OR REPLACE FUNCTION public.get_graph_proximity(
  p_viewer_id uuid,
  p_target_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  shared_yacht_ids uuid[];
  shared_yacht_names text[];
  connecting_colleague_id uuid;
  connecting_colleague_name text;
  endorsement_context text;
BEGIN
  -- Same user: no proximity needed
  IF p_viewer_id = p_target_id THEN
    RETURN jsonb_build_object('level', 'self');
  END IF;

  -- ── Check 1: Direct colleague (shared yacht attachment) ──
  SELECT
    array_agg(DISTINCT y.id),
    array_agg(DISTINCT y.name)
  INTO shared_yacht_ids, shared_yacht_names
  FROM attachments a1
  JOIN attachments a2 ON a1.yacht_id = a2.yacht_id
  JOIN yachts y ON y.id = a1.yacht_id
  WHERE a1.user_id = p_viewer_id
    AND a2.user_id = p_target_id
    AND a1.deleted_at IS NULL
    AND a2.deleted_at IS NULL;

  IF shared_yacht_ids IS NOT NULL AND array_length(shared_yacht_ids, 1) > 0 THEN
    RETURN jsonb_build_object(
      'level', 'direct_colleague',
      'shared_yachts', to_jsonb(shared_yacht_names),
      'shared_yacht_ids', to_jsonb(shared_yacht_ids),
      'context_text', 'You both worked on ' || shared_yacht_names[1] ||
        CASE
          WHEN array_length(shared_yacht_names, 1) > 1
          THEN ' + ' || (array_length(shared_yacht_names, 1) - 1) || ' more'
          ELSE ''
        END
    );
  END IF;

  -- ── Check 2: Second degree (colleague of colleague) ──
  -- Find a colleague of the viewer who is also a colleague of the target.
  -- Limit to 1 connecting colleague for performance.
  SELECT
    a_bridge.user_id,
    coalesce(u_bridge.display_name, u_bridge.full_name)
  INTO connecting_colleague_id, connecting_colleague_name
  FROM attachments a_viewer
  JOIN attachments a_bridge ON a_viewer.yacht_id = a_bridge.yacht_id
    AND a_bridge.user_id != p_viewer_id
    AND a_bridge.deleted_at IS NULL
  JOIN attachments a_bridge2 ON a_bridge.user_id = a_bridge2.user_id
    AND a_bridge2.deleted_at IS NULL
  JOIN attachments a_target ON a_bridge2.yacht_id = a_target.yacht_id
    AND a_target.user_id = p_target_id
    AND a_target.deleted_at IS NULL
  JOIN users u_bridge ON u_bridge.id = a_bridge.user_id
  WHERE a_viewer.user_id = p_viewer_id
    AND a_viewer.deleted_at IS NULL
    AND a_bridge.user_id != p_target_id
  LIMIT 1;

  IF connecting_colleague_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'level', 'second_degree',
      'connecting_colleague_id', connecting_colleague_id,
      'connecting_colleague_name', connecting_colleague_name,
      'context_text', 'Connected via ' || connecting_colleague_name
    );
  END IF;

  -- ── Check 3: Endorsement overlap ──
  -- Direct endorsement between viewer and target (either direction)
  SELECT
    CASE
      WHEN e.endorser_id = p_viewer_id THEN 'You endorsed them'
      ELSE 'They endorsed you'
    END
  INTO endorsement_context
  FROM endorsements e
  WHERE (
    (e.endorser_id = p_viewer_id AND e.recipient_id = p_target_id)
    OR (e.endorser_id = p_target_id AND e.recipient_id = p_viewer_id)
  )
  AND e.deleted_at IS NULL
  LIMIT 1;

  IF endorsement_context IS NOT NULL THEN
    RETURN jsonb_build_object(
      'level', 'endorsement_overlap',
      'context_text', endorsement_context
    );
  END IF;

  -- ── Check 4: No connection ──
  RETURN jsonb_build_object('level', 'none');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_graph_proximity(uuid, uuid) TO authenticated;
```

### 1.5 — Batch Graph Proximity RPC

For rendering the position feed efficiently — compute proximity for multiple targets at once.

```sql
-- ═══════════════════════════════════════════════════════════
-- 5. BATCH GRAPH PROXIMITY (performance optimization)
-- ═══════════════════════════════════════════════════════════

-- Given a viewer and an array of target user IDs, returns proximity
-- data for each. Used in position feed to batch-compute badges.

CREATE OR REPLACE FUNCTION public.get_graph_proximity_batch(
  p_viewer_id uuid,
  p_target_ids uuid[]
)
RETURNS TABLE (
  target_id uuid,
  proximity jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
BEGIN
  FOREACH tid IN ARRAY p_target_ids
  LOOP
    RETURN QUERY
    SELECT tid, public.get_graph_proximity(p_viewer_id, tid);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_graph_proximity_batch(uuid, uuid[]) TO authenticated;
```

### 1.6 — Position Count Check RPC

Used to enforce post limits (1 free / 3 Pro per month).

```sql
-- ═══════════════════════════════════════════════════════════
-- 6. POSITION POST LIMIT CHECK
-- ═══════════════════════════════════════════════════════════

-- Returns the number of positions a user has created in the current calendar month,
-- plus their limit based on subscription status.

CREATE OR REPLACE FUNCTION public.get_position_post_count(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'count', (
      SELECT count(*)::int
      FROM positions
      WHERE poster_id = p_user_id
        AND created_at >= date_trunc('month', now())
    ),
    'limit', (
      SELECT CASE
        WHEN subscription_status = 'pro' THEN 3
        ELSE 1
      END
      FROM users
      WHERE id = p_user_id
    ),
    'is_pro', (
      SELECT subscription_status = 'pro'
      FROM users
      WHERE id = p_user_id
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_position_post_count(uuid) TO authenticated;
```

### 1.7 — Feed Query RPC

Returns open positions with poster info and application count, with optional filters.

```sql
-- ═══════════════════════════════════════════════════════════
-- 7. POSITION FEED QUERY
-- ═══════════════════════════════════════════════════════════

-- Returns open positions with poster profile, yacht info, and application count.
-- Supports optional department and role filters.
-- Pagination via cursor (created_at of last item).

CREATE OR REPLACE FUNCTION public.get_position_feed(
  p_department text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_cursor timestamptz DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  poster_id uuid,
  poster_name text,
  poster_handle text,
  poster_photo text,
  poster_role text,
  yacht_id uuid,
  yacht_name text,
  yacht_type text,
  yacht_length numeric,
  role text,
  department text,
  description text,
  start_date date,
  duration text,
  location text,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  application_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.poster_id,
    coalesce(u.display_name, u.full_name) AS poster_name,
    u.handle AS poster_handle,
    u.profile_photo_url AS poster_photo,
    u.primary_role AS poster_role,
    p.yacht_id,
    y.name AS yacht_name,
    y.yacht_type,
    y.length_meters AS yacht_length,
    p.role,
    p.department,
    p.description,
    p.start_date,
    p.duration,
    p.location,
    p.status,
    p.expires_at,
    p.created_at,
    (SELECT count(*)::int FROM position_applications pa WHERE pa.position_id = p.id) AS application_count
  FROM positions p
  JOIN users u ON u.id = p.poster_id
  JOIN yachts y ON y.id = p.yacht_id
  WHERE p.status = 'open'
    AND (p_department IS NULL OR p.department = p_department)
    AND (p_role IS NULL OR p.role ILIKE '%' || p_role || '%')
    AND (p_location IS NULL OR p.location ILIKE '%' || p_location || '%')
    AND (p_cursor IS NULL OR p.created_at < p_cursor)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_position_feed(text, text, text, timestamptz, int) TO authenticated;
```

### 1.8 — Complete Migration File

The full migration file content is sections 1.1 through 1.7 above, concatenated in order, with the header comment from section 1.1.

---

## Part 2: API Routes

### 2.1 — POST Position (Create)

**File to create:** `app/api/positions/route.ts`

```typescript
// POST /api/positions — Create a new position
// GET  /api/positions — Fetch position feed (server component preferred, but API available)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const createPositionSchema = z.object({
  yacht_id: z.string().uuid(),
  role: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  description: z.string().min(50).max(2000).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.enum(['Permanent', 'Season', 'Temporary', 'Day work']),
  location: z.string().max(200).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'positionCreate', user.id)
    if (limited) return limited

    const result = await validateBody(req, createPositionSchema)
    if ('error' in result) return result.error
    const body = result.data

    // 1. Full profile check: onboarding complete, has photo, bio, role
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_complete, profile_photo_url, bio, primary_role, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_complete || !profile.profile_photo_url || !profile.bio || !profile.primary_role) {
      return NextResponse.json(
        { error: 'Complete your profile before posting a position (photo, bio, role required).' },
        { status: 403 },
      )
    }

    // 2. Current attachment check: poster must have a current attachment to this yacht
    const { data: attachment } = await supabase
      .from('attachments')
      .select('id')
      .eq('user_id', user.id)
      .eq('yacht_id', body.yacht_id)
      .is('ended_at', null)
      .is('deleted_at', null)
      .maybeSingle()

    if (!attachment) {
      return NextResponse.json(
        { error: 'You can only post positions on yachts where you are currently working.' },
        { status: 403 },
      )
    }

    // 3. Post limit check
    const { data: postCount } = await supabase.rpc('get_position_post_count', {
      p_user_id: user.id,
    })

    const limit = (postCount as any)?.limit ?? 1
    const count = (postCount as any)?.count ?? 0
    const isPro = (postCount as any)?.is_pro ?? false

    if (count >= limit) {
      trackServerEvent(user.id, 'position_post_limit_hit', { is_pro: isPro })
      return NextResponse.json(
        {
          error: isPro
            ? 'You have reached your Pro limit of 3 positions this month.'
            : 'Free accounts can post 1 position per month. Upgrade to Pro for 3.',
          limit_hit: true,
          is_pro: isPro,
        },
        { status: 429 },
      )
    }

    // 4. Create position with 30-day expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: position, error } = await supabase
      .from('positions')
      .insert({
        poster_id: user.id,
        yacht_id: body.yacht_id,
        role: body.role,
        department: body.department,
        description: body.description ?? null,
        start_date: body.start_date,
        duration: body.duration,
        location: body.location ?? null,
        status: 'open',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Position creation failed:', error)
      return NextResponse.json({ error: 'Failed to create position' }, { status: 500 })
    }

    trackServerEvent(user.id, 'position_created', {
      role: body.role,
      department: body.department,
      yacht_id: body.yacht_id,
      is_pro: isPro,
    })

    return NextResponse.json({ position }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 2.2 — PATCH Position (Update Status)

**File to create:** `app/api/positions/[id]/route.ts`

```typescript
// PATCH /api/positions/[id] — Update position status (close, fill, renew)
// GET   /api/positions/[id] — Get single position with details

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const updatePositionSchema = z.object({
  action: z.enum(['close', 'fill', 'renew']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, updatePositionSchema)
    if ('error' in result) return result.error
    const { action } = result.data

    // Verify ownership
    const { data: position } = await supabase
      .from('positions')
      .select('id, poster_id, status')
      .eq('id', id)
      .single()

    if (!position || position.poster_id !== user.id) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    if (action === 'renew') {
      // Renew: check post limit (renewal counts against monthly limit on renewal date)
      const { data: postCount } = await supabase.rpc('get_position_post_count', {
        p_user_id: user.id,
      })
      const limit = (postCount as any)?.limit ?? 1
      const count = (postCount as any)?.count ?? 0
      const isPro = (postCount as any)?.is_pro ?? false

      if (count >= limit) {
        trackServerEvent(user.id, 'position_post_limit_hit', { is_pro: isPro })
        return NextResponse.json(
          { error: 'Post limit reached. Upgrade to Pro for more positions.', limit_hit: true, is_pro: isPro },
          { status: 429 },
        )
      }

      const newExpiry = new Date()
      newExpiry.setDate(newExpiry.getDate() + 30)

      const { error } = await supabase
        .from('positions')
        .update({ status: 'open', expires_at: newExpiry.toISOString() })
        .eq('id', id)

      if (error) return NextResponse.json({ error: 'Failed to renew' }, { status: 500 })

      trackServerEvent(user.id, 'position_renewed', { position_id: id })
      return NextResponse.json({ status: 'open', expires_at: newExpiry.toISOString() })
    }

    // Close or fill
    const newStatus = action === 'close' ? 'closed' : 'filled'
    const { error } = await supabase
      .from('positions')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) return NextResponse.json({ error: `Failed to ${action} position` }, { status: 500 })

    trackServerEvent(user.id, `position_${newStatus}`, { position_id: id })
    return NextResponse.json({ status: newStatus })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: position, error } = await supabase
      .from('positions')
      .select(`
        id, poster_id, yacht_id, role, department, description,
        start_date, duration, location, status, expires_at, created_at,
        users!poster_id (id, full_name, display_name, handle, profile_photo_url, primary_role),
        yachts!yacht_id (id, name, yacht_type, length_meters)
      `)
      .eq('id', id)
      .single()

    if (error || !position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    // Application count
    const { count } = await supabase
      .from('position_applications')
      .select('id', { count: 'exact', head: true })
      .eq('position_id', id)

    // Viewer's application status (if any)
    const { data: viewerApp } = await supabase
      .from('position_applications')
      .select('id, status')
      .eq('position_id', id)
      .eq('applicant_id', user.id)
      .maybeSingle()

    // Graph proximity between viewer and poster
    const posterId = (position as any).users?.id ?? position.poster_id
    const { data: proximity } = await supabase.rpc('get_graph_proximity', {
      p_viewer_id: user.id,
      p_target_id: posterId,
    })

    trackServerEvent(user.id, 'position_viewed', {
      position_id: id,
      proximity_level: (proximity as any)?.level ?? 'none',
    })

    return NextResponse.json({
      position: {
        ...position,
        application_count: count ?? 0,
        viewer_application: viewerApp ?? null,
        viewer_proximity: proximity ?? { level: 'none' },
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 2.3 — Apply to Position

**File to create:** `app/api/positions/[id]/apply/route.ts`

```typescript
// POST /api/positions/[id]/apply — Apply to a position

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { sendNewApplicationEmail } from '@/lib/email/position-application'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const applySchema = z.object({
  message: z.string().max(500).optional().nullable(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: positionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'positionApply', user.id)
    if (limited) return limited

    const result = await validateBody(req, applySchema)
    if ('error' in result) return result.error
    const { message } = result.data

    // Fetch position details
    const { data: position } = await supabase
      .from('positions')
      .select('id, poster_id, status, role, yacht_id, yachts!yacht_id(name)')
      .eq('id', positionId)
      .single()

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    if (position.status !== 'open') {
      return NextResponse.json({ error: 'This position is no longer accepting applications.' }, { status: 400 })
    }

    // Cannot apply to own position
    if (position.poster_id === user.id) {
      return NextResponse.json({ error: 'You cannot apply to your own position.' }, { status: 400 })
    }

    // Check if already applied (unique constraint will catch this too, but better UX to check first)
    const { data: existing } = await supabase
      .from('position_applications')
      .select('id')
      .eq('position_id', positionId)
      .eq('applicant_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'You have already applied to this position.' }, { status: 409 })
    }

    // Create application
    const { data: application, error } = await supabase
      .from('position_applications')
      .insert({
        position_id: positionId,
        applicant_id: user.id,
        message: message ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Application creation failed:', error)
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }

    // Graph proximity for analytics
    const { data: proximity } = await supabase.rpc('get_graph_proximity', {
      p_viewer_id: user.id,
      p_target_id: position.poster_id,
    })

    trackServerEvent(user.id, 'position_applied', {
      position_id: positionId,
      proximity_level: (proximity as any)?.level ?? 'none',
      message_included: !!message,
    })

    // Send email notification to poster
    const { data: poster } = await supabase
      .from('users')
      .select('email, full_name, display_name')
      .eq('id', position.poster_id)
      .single()

    const { data: applicantProfile } = await supabase
      .from('users')
      .select('full_name, display_name')
      .eq('id', user.id)
      .single()

    if (poster?.email) {
      const yachtName = (position as any).yachts?.name ?? 'your yacht'
      const applicantName = applicantProfile?.display_name ?? applicantProfile?.full_name ?? 'Someone'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'

      await sendNewApplicationEmail({
        to: poster.email,
        posterName: poster.display_name ?? poster.full_name ?? 'there',
        applicantName,
        role: position.role,
        yachtName,
        inboxUrl: `${siteUrl}/app/positions/${positionId}/applications`,
      }).catch((e) => console.error('Failed to send application email:', e))
    }

    return NextResponse.json({ application }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 2.4 — Update Application Status

**File to create:** `app/api/positions/[id]/applications/[applicationId]/route.ts`

```typescript
// PATCH /api/positions/[id]/applications/[applicationId] — Update application status

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { sendApplicationStatusEmail } from '@/lib/email/application-status'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const updateApplicationSchema = z.object({
  status: z.enum(['viewed', 'shortlisted', 'rejected']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> },
) {
  try {
    const { id: positionId, applicationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, updateApplicationSchema)
    if ('error' in result) return result.error
    const { status: newStatus } = result.data

    // Verify position ownership
    const { data: position } = await supabase
      .from('positions')
      .select('id, poster_id, role, yacht_id, yachts!yacht_id(name)')
      .eq('id', positionId)
      .single()

    if (!position || position.poster_id !== user.id) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    // Fetch application
    const { data: application } = await supabase
      .from('position_applications')
      .select('id, applicant_id, status')
      .eq('id', applicationId)
      .eq('position_id', positionId)
      .single()

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update status
    const { error } = await supabase
      .from('position_applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 })
    }

    trackServerEvent(user.id, `position_application_${newStatus}`, {
      position_id: positionId,
      application_id: applicationId,
    })

    // Send status change email to applicant (NOT for rejections unless poster writes a note —
    // per README spec "rejected applications receive no email to avoid discouragement")
    if (newStatus === 'shortlisted') {
      const { data: applicant } = await supabase
        .from('users')
        .select('email, full_name, display_name')
        .eq('id', application.applicant_id)
        .single()

      if (applicant?.email) {
        const yachtName = (position as any).yachts?.name ?? 'a yacht'
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'

        await sendApplicationStatusEmail({
          to: applicant.email,
          applicantName: applicant.display_name ?? applicant.full_name ?? 'there',
          role: position.role,
          yachtName,
          newStatus,
          positionUrl: `${siteUrl}/app/positions`,
        }).catch((e) => console.error('Failed to send status email:', e))
      }
    }

    return NextResponse.json({ status: newStatus })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### Request/Response Schema Summary

| Method | Path | Auth | Rate Limit | Request Body | Response |
|--------|------|------|------------|-------------|----------|
| `POST` | `/api/positions` | Required | `positionCreate` (5/hr) | `{ yacht_id, role, department, description?, start_date, duration, location? }` | `{ position: {...} }` 201 |
| `GET` | `/api/positions/[id]` | Required | None | — | `{ position: {..., application_count, viewer_application, viewer_proximity} }` |
| `PATCH` | `/api/positions/[id]` | Required (poster) | None | `{ action: "close" \| "fill" \| "renew" }` | `{ status }` |
| `POST` | `/api/positions/[id]/apply` | Required | `positionApply` (10/hr) | `{ message?: string }` | `{ application: {...} }` 201 |
| `PATCH` | `/api/positions/[id]/applications/[applicationId]` | Required (poster) | None | `{ status: "viewed" \| "shortlisted" \| "rejected" }` | `{ status }` |

---

## Part 3: Email Templates

### 3.1 — New Application Email

**File to create:** `lib/email/position-application.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface NewApplicationEmailParams {
  to: string
  posterName: string
  applicantName: string
  role: string
  yachtName: string
  inboxUrl: string
}

export async function sendNewApplicationEmail({
  to,
  posterName,
  applicantName,
  role,
  yachtName,
  inboxUrl,
}: NewApplicationEmailParams): Promise<void> {
  await sendNotifyEmail({
    to,
    subject: `${applicantName} applied to your ${role} position on ${yachtName}`,
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
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            New application for your ${role} position
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${posterName},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            <strong>${applicantName}</strong> has applied to your <strong>${role}</strong> position on <strong>${yachtName}</strong>.
            View their full profile, employment history, endorsements, and graph connection in your application inbox.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${inboxUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                View Application &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because someone applied to a position you posted on YachtieLink.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${posterName},\n\n${applicantName} has applied to your ${role} position on ${yachtName}.\n\nView their application: ${inboxUrl}`,
  })
}
```

### 3.2 — Application Status Change Email

**File to create:** `lib/email/application-status.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface ApplicationStatusEmailParams {
  to: string
  applicantName: string
  role: string
  yachtName: string
  newStatus: 'shortlisted'  // only shortlisted sends email
  positionUrl: string
}

export async function sendApplicationStatusEmail({
  to,
  applicantName,
  role,
  yachtName,
  newStatus,
  positionUrl,
}: ApplicationStatusEmailParams): Promise<void> {
  const statusMessages: Record<string, { subject: string; body: string }> = {
    shortlisted: {
      subject: `You've been shortlisted for ${role} on ${yachtName}`,
      body: `Great news! You&rsquo;ve been <strong>shortlisted</strong> for the <strong>${role}</strong> position on <strong>${yachtName}</strong>. The poster may reach out to you directly via your contact methods.`,
    },
  }

  const msg = statusMessages[newStatus]
  if (!msg) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'

  await sendNotifyEmail({
    to,
    subject: msg.subject,
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
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            Application Update
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${applicantName},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            ${msg.body}
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${positionUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                View Positions &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because you applied to a position on YachtieLink.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${applicantName},\n\nYou've been shortlisted for the ${role} position on ${yachtName}.\n\nView positions: ${positionUrl}`,
  })
}
```

### 3.3 — Position Expiry Warning Email

**File to create:** `lib/email/position-expiry.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface PositionExpiryEmailParams {
  to: string
  posterName: string
  role: string
  yachtName: string
  expiresAt: string
  manageUrl: string
}

export async function sendPositionExpiryEmail({
  to,
  posterName,
  role,
  yachtName,
  expiresAt,
  manageUrl,
}: PositionExpiryEmailParams): Promise<void> {
  const expiryFormatted = new Date(expiresAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  await sendNotifyEmail({
    to,
    subject: `Your ${role} position on ${yachtName} expires in 3 days`,
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
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            Your position expires soon
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${posterName},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Your <strong>${role}</strong> position on <strong>${yachtName}</strong> expires on <strong>${expiryFormatted}</strong>.
            After that, it will no longer appear in the position feed.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Still looking? You can renew or close the position from your dashboard.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${manageUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Manage Positions &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because you posted a position on YachtieLink.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${posterName},\n\nYour ${role} position on ${yachtName} expires on ${expiryFormatted}.\n\nManage your positions: ${manageUrl}`,
  })
}
```

---

## Part 4: Cron Jobs

### 4.1 — Position Expiry Cron

**File to create:** `app/api/cron/position-expiry/route.ts`

Runs daily at 5:00 UTC. Expires open positions past their `expires_at`.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
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
    const now = new Date().toISOString()

    // Find open positions past their expiry
    const { data: expiredPositions, error: fetchError } = await supabase
      .from('positions')
      .select('id, poster_id')
      .eq('status', 'open')
      .lt('expires_at', now)

    if (fetchError) {
      console.error('Failed to fetch expired positions:', fetchError)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    if (!expiredPositions?.length) {
      return NextResponse.json({ expired: 0 })
    }

    let expired = 0

    for (const position of expiredPositions) {
      const { error: updateError } = await supabase
        .from('positions')
        .update({ status: 'expired' })
        .eq('id', position.id)

      if (updateError) {
        console.error(`Failed to expire position ${position.id}:`, updateError)
        continue
      }

      trackServerEvent(position.poster_id, 'position_expired', {
        position_id: position.id,
      })
      expired++
    }

    return NextResponse.json({ expired })
  } catch (e) {
    return handleApiError(e)
  }
}
```

### 4.2 — Position Expiry Warning Cron

**File to create:** `app/api/cron/position-expiry-warning/route.ts`

Runs daily at 6:00 UTC (after expiry cron). Sends 3-day warning to posters.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { sendPositionExpiryEmail } from '@/lib/email/position-expiry'
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
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find open positions expiring within 3 days that haven't been warned
    // We use a simple approach: check if expires_at is between now and now+3days
    // To avoid re-sending, we check that expires_at is between now+2days and now+3days
    // (since the cron runs daily, this window catches each position exactly once)
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    const { data: expiringPositions, error: fetchError } = await supabase
      .from('positions')
      .select(`
        id, role, yacht_id, expires_at, poster_id,
        users!poster_id (email, full_name, display_name),
        yachts!yacht_id (name)
      `)
      .eq('status', 'open')
      .gt('expires_at', in2Days.toISOString())
      .lte('expires_at', in3Days.toISOString())

    if (fetchError) {
      console.error('Failed to fetch expiring positions:', fetchError)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    if (!expiringPositions?.length) {
      return NextResponse.json({ warned: 0 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yachtie.link'
    let warned = 0

    for (const position of expiringPositions) {
      const poster = (position as any).users
      const yacht = (position as any).yachts
      if (!poster?.email) continue

      try {
        await sendPositionExpiryEmail({
          to: poster.email,
          posterName: poster.display_name ?? poster.full_name ?? 'there',
          role: position.role,
          yachtName: yacht?.name ?? 'your yacht',
          expiresAt: position.expires_at!,
          manageUrl: `${siteUrl}/app/positions/mine`,
        })

        trackServerEvent(position.poster_id, 'position_expiry_warning_sent', {
          position_id: position.id,
        })
        warned++
      } catch (e) {
        console.error(`Failed to send expiry warning for position ${position.id}:`, e)
      }
    }

    return NextResponse.json({ warned })
  } catch (e) {
    return handleApiError(e)
  }
}
```

### 4.3 — Vercel Cron Configuration

**File to modify:** `vercel.json`

Add two new cron entries:

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
      "path": "/api/cron/position-expiry",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/cron/position-expiry-warning",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule rationale:**
- Position expiry at 05:00 UTC — runs before the warning cron to clean up already-expired positions first.
- Warning at 06:00 UTC — runs after expiry. Sends emails during European morning hours.

---

## Part 5: Rate Limit Configuration

**File to modify:** `lib/rate-limit/helpers.ts`

Add two new rate limit entries:

```typescript
export const RATE_LIMITS = {
  // ... existing entries ...
  positionCreate: { limit: 5,  window: 60 * 60,      scope: 'user' as const }, // 5/hr/user
  positionApply:  { limit: 10, window: 60 * 60,      scope: 'user' as const }, // 10/hr/user
} as const
```

**Rationale:**
- Position create: 5/hr is generous — typical use is 1-3 positions total. Prevents spam.
- Position apply: 10/hr allows applying to multiple positions in a session. Prevents mass-applying.

---

## Part 6: Validation Schemas

**File to modify:** `lib/validation/schemas.ts` (or inline in route files if no shared schemas file exists)

The schemas are defined inline in each API route file (see Part 2). If a shared schemas file exists, extract to:

```typescript
import { z } from 'zod'

export const createPositionSchema = z.object({
  yacht_id: z.string().uuid(),
  role: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  description: z.string().min(50).max(2000).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.enum(['Permanent', 'Season', 'Temporary', 'Day work']),
  location: z.string().max(200).optional().nullable(),
})

export const applyToPositionSchema = z.object({
  message: z.string().max(500).optional().nullable(),
})

export const updatePositionSchema = z.object({
  action: z.enum(['close', 'fill', 'renew']),
})

export const updateApplicationSchema = z.object({
  status: z.enum(['viewed', 'shortlisted', 'rejected']),
})
```

---

## Part 7: UI Components

### 7.1 — ProximityBadge Component

**File to create:** `components/positions/ProximityBadge.tsx`

Reusable component that renders graph proximity context. Used in position cards, application cards, and potentially in future sprints (Sprint 19, 20, 21).

```typescript
'use client'

interface ProximityBadgeProps {
  proximity: {
    level: 'direct_colleague' | 'second_degree' | 'endorsement_overlap' | 'none' | 'self'
    context_text?: string
    shared_yachts?: string[]
    connecting_colleague_name?: string
  }
  isPro?: boolean  // Pro users see 2nd-degree; free users see 1st-degree only
  size?: 'sm' | 'md'  // sm for inline cards, md for detail pages
}
```

**State:**
- `expanded: boolean` — whether the detail tooltip/popover is showing

**UI layout (375px):**

For `direct_colleague`:
```
┌─────────────────────────────────────────┐
│ 🟢 Colleague · You both worked on M/Y…  │
└─────────────────────────────────────────┘
```

For `second_degree` (Pro only):
```
┌─────────────────────────────────────────┐
│ 🔵 2nd degree · Connected via Maria     │
└─────────────────────────────────────────┘
```

For `endorsement_overlap`:
```
┌─────────────────────────────────────────┐
│ ⭐ Endorsed · They endorsed you          │
└─────────────────────────────────────────┘
```

For `none` or non-Pro `second_degree`: render nothing.

**Behaviour:**
- Tap badge → expand to show full context (e.g., "You both worked on M/Y Horizon and M/Y Atlas")
- Non-Pro users: `second_degree` badges render as nothing (feature gated)
- Use `truncate` CSS class for long yacht names at mobile width
- Colour scheme: use semantic CSS variables. Colleague = teal accent, 2nd degree = blue, endorsement = gold.

**Rendering logic:**
```tsx
if (proximity.level === 'none' || proximity.level === 'self') return null
if (proximity.level === 'second_degree' && !isPro) return null

const config = {
  direct_colleague: { dot: 'bg-emerald-500', label: 'Colleague', textClass: 'text-emerald-700' },
  second_degree: { dot: 'bg-blue-500', label: '2nd degree', textClass: 'text-blue-700' },
  endorsement_overlap: { dot: 'bg-amber-500', label: 'Endorsed', textClass: 'text-amber-700' },
}
```

### 7.2 — PositionCard Component

**File to create:** `components/positions/PositionCard.tsx`

Client component. Renders a position in the feed.

```typescript
'use client'

interface PositionCardProps {
  id: string
  role: string
  department: string
  poster: {
    id: string
    name: string
    handle: string | null
    photoUrl: string | null
    role: string | null
  }
  yacht: {
    id: string
    name: string
    type: string | null
    length: number | null
  }
  startDate: string
  duration: string
  location: string | null
  applicationCount: number
  createdAt: string
  expiresAt: string
  proximity: {
    level: string
    context_text?: string
    shared_yachts?: string[]
    connecting_colleague_name?: string
  }
  isPro: boolean
  viewerApplication: { id: string; status: string } | null
}
```

**UI layout (375px):**

```
┌─────────────────────────────────────────────────┐
│  [Poster Photo]   Captain · M/Y Horizon         │
│                   John Smith  →                  │
│                                                  │
│  🟢 Colleague · You both worked on M/Y Atlas     │
│                                                  │
│  Role: First Officer · Deck                      │
│  Start: 1 Apr 2026 · Season                      │
│  Location: Antibes, France                       │
│                                                  │
│  3 applications · Posted 2d ago · Expires in 28d │
│                                                  │
│  [ Apply ]                or   ✓ Applied         │
└─────────────────────────────────────────────────┘
```

**Behaviour:**
- Tap yacht name → `/app/yacht/[id]` (graph link)
- Tap poster name → `/u/[handle]` (graph link)
- Tap "Apply" → navigates to position detail page with apply flow
- If `viewerApplication` exists, show application status badge instead of Apply button
- Fire `trackEvent('position_viewed', { position_id, proximity_level })` on card visibility (use Intersection Observer or on-click)
- "Expires in X days": computed client-side from `expiresAt`
- "Posted Xd ago": computed from `createdAt` using relative time formatting

### 7.3 — PostPositionForm Component

**File to create:** `components/positions/PostPositionForm.tsx`

Client component. The position posting form, rendered as a bottom sheet on mobile and a modal on desktop.

```typescript
'use client'

interface PostPositionFormProps {
  currentAttachments: Array<{
    yacht_id: string
    yacht_name: string
  }>
  postCount: number
  postLimit: number
  isPro: boolean
}
```

**State:**
- `yachtId: string` — selected yacht (pre-filled if only one attachment)
- `role: string` — typeahead from roles
- `department: string` — auto-filled from role, editable
- `startDate: string` — date picker
- `duration: 'Permanent' | 'Season' | 'Temporary' | 'Day work'`
- `location: string` — optional text
- `description: string` — free text area
- `step: 'form' | 'preview'` — two-step flow: form, then preview before publish
- `isSubmitting: boolean`
- `error: string | null`

**Form fields:**
1. **Yacht** — dropdown if multiple current attachments, read-only display if single
2. **Role** — typeahead from seeded roles list (reuse the existing role search pattern from onboarding). Fetch roles from `roles` table.
3. **Department** — auto-filled when role is selected (from roles table department), but editable as a dropdown of departments
4. **Start date** — native date picker (`<input type="date">`)
5. **Duration** — `<select>` with `['Permanent', 'Season', 'Temporary', 'Day work']`
6. **Location** — optional text input, placeholder "e.g., Antibes, France"
7. **Description** — `<textarea>` with character count (50-2000). Placeholder: "Describe the position, duties, and what you're looking for in a candidate."

**Preview step:**
- Shows how the position card will appear (renders a `PositionCard` with the form data)
- "Edit" button to go back to form
- "Publish" button to submit

**Post limit UX:**
- If at limit: form is disabled, show inline message:
  - Free: "You've used your 1 free position this month. Upgrade to Pro for 3 positions."
  - Pro: "You've used all 3 Pro positions this month."
- Include "Upgrade to Pro" link inline (not a blocking modal) — links to `/app/more` or Stripe checkout
- Post limit indicator shown at top of form: "1 of 1 used" or "2 of 3 used"

**On submit:**
- Call `POST /api/positions` with form data
- On success: redirect to `/app/positions/mine`
- On `429` (limit hit): show inline error with upgrade CTA
- Fire `trackEvent('position_created', { role, department, yacht_id, is_pro })`

### 7.4 — ApplicationCard Component

**File to create:** `components/positions/ApplicationCard.tsx`

Client component. Renders an applicant in the application inbox.

```typescript
'use client'

interface ApplicationCardProps {
  applicationId: string
  positionId: string
  applicant: {
    id: string
    name: string
    handle: string | null
    photoUrl: string | null
    role: string | null
    department: string | null
    endorsementCount: number
  }
  proximity: {
    level: string
    context_text?: string
    shared_yachts?: string[]
    connecting_colleague_name?: string
  }
  isPro: boolean
  message: string | null
  status: 'applied' | 'viewed' | 'shortlisted' | 'rejected'
  createdAt: string
  endorsementHighlights: Array<{
    content: string
    endorserName: string
    yachtName: string
  }>
  contactMethods?: {
    phone?: string | null
    email?: string | null
    whatsapp?: string | null
  }
}
```

**UI layout (375px):**

```
┌─────────────────────────────────────────────────┐
│  [Photo]   John Smith · First Officer            │
│            Deck · 3 yrs sea time · 5 endorsements│
│                                                  │
│  🟢 Colleague · You both worked on M/Y Atlas     │
│                                                  │
│  "I'm interested in this position and..."        │
│                                                  │
│  ── Top endorsements ──                          │
│  "John was an exceptional officer..." — Capt. K  │
│  "Reliable and skilled..." — Chief Eng. M        │
│                                                  │
│  Applied 2d ago                                  │
│                                                  │
│  [ Shortlist ]  [ Reject ]        [ Contact → ]  │
└─────────────────────────────────────────────────┘
```

**Behaviour:**
- Tap applicant name/photo → `/u/[handle]` (graph link — full profile)
- Auto-mark as "viewed" when card enters viewport (PATCH call to set status if currently "applied")
- "Shortlist" → PATCH `/api/positions/[id]/applications/[applicationId]` with `status: 'shortlisted'`
- "Reject" → PATCH with `status: 'rejected'` (confirmation dialog: "This won't notify the applicant")
- "Contact" → expand to show applicant's contact methods (phone, email, WhatsApp) if available via their availability contact settings or public profile contact fields
- `ProximityBadge` renders the graph connection
- Endorsement highlights: show top 2 endorsements by relevance (matching department or yacht)
- Fire `trackEvent('position_application_viewed', { application_id })` on visibility
- Fire `trackEvent('position_application_shortlisted', ...)` or `position_application_rejected` on action

### 7.5 — PostLimitIndicator Component

**File to create:** `components/positions/PostLimitIndicator.tsx`

Small inline component showing post usage.

```typescript
'use client'

interface PostLimitIndicatorProps {
  count: number
  limit: number
  isPro: boolean
}
```

**Rendering:**
```
1 of 1 position used this month     [Upgrade to Pro →]
```
or for Pro:
```
2 of 3 positions used this month
```

- Show upgrade CTA only when `!isPro`
- When `count >= limit`, text turns amber/warning colour
- Upgrade link → Stripe checkout via `/api/stripe/checkout`

### 7.6 — PositionFilters Component

**File to create:** `components/positions/PositionFilters.tsx`

Client component. Filter bar for the position feed.

```typescript
'use client'

interface PositionFiltersProps {
  departments: string[]  // from reference data
  onFilterChange: (filters: {
    department: string | null
    role: string | null
    location: string | null
    networkOnly: boolean
  }) => void
}
```

**State:**
- `department: string | null`
- `role: string` — free text typeahead
- `location: string` — free text
- `networkOnly: boolean` — toggle to filter to graph-adjacent positions only

**UI layout (375px):**
```
┌─────────────────────────────────────────────────┐
│ Filters ▾                                        │
│ ┌─────────────────────────────────────────────┐  │
│ │ Department: [All ▾]                          │  │
│ │ Role:       [Search roles...]                │  │
│ │ Location:   [Search location...]             │  │
│ │ [✓] In my network                            │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

- Collapsible on mobile (collapsed by default, tap "Filters" to expand)
- "In my network" toggle filters client-side by proximity level (shows only positions where proximity.level !== 'none')
- Department dropdown populated from seeded departments
- Fire `trackEvent('position_feed_filtered', { department, role, location, network_only })` on filter change (debounced)

---

## Part 8: Page Specs

### 8.1 — Position Feed Page

**File to create:** `app/(protected)/app/positions/page.tsx`

Server component that fetches the position feed and renders it.

**Data fetching:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const [feedRes, postCountRes, departmentsRes, userProfileRes] = await Promise.all([
  // 1. Position feed (initial load, no filters)
  supabase.rpc('get_position_feed', {
    p_department: null,
    p_role: null,
    p_location: null,
    p_cursor: null,
    p_limit: 20,
  }),

  // 2. Poster's post count (for "Post a position" button state)
  supabase.rpc('get_position_post_count', { p_user_id: user.id }),

  // 3. Departments for filter dropdown
  supabase.from('departments').select('name').order('sort_order'),

  // 4. Current user profile (for Pro status, current attachments)
  supabase
    .from('users')
    .select('subscription_status, onboarding_complete, profile_photo_url, bio, primary_role')
    .eq('id', user.id)
    .single(),
])

// 5. Graph proximity for all posters in the feed
const posterIds = [...new Set((feedRes.data ?? []).map(p => p.poster_id))]
const proximityRes = posterIds.length > 0
  ? await supabase.rpc('get_graph_proximity_batch', {
      p_viewer_id: user.id,
      p_target_ids: posterIds,
    })
  : { data: [] }

const proximityMap = new Map(
  (proximityRes.data ?? []).map(r => [r.target_id, r.proximity])
)

// 6. Check viewer's existing applications to these positions
const positionIds = (feedRes.data ?? []).map(p => p.id)
const viewerAppsRes = positionIds.length > 0
  ? await supabase
      .from('position_applications')
      .select('id, position_id, status')
      .eq('applicant_id', user.id)
      .in('position_id', positionIds)
  : { data: [] }

const viewerAppMap = new Map(
  (viewerAppsRes.data ?? []).map(a => [a.position_id, { id: a.id, status: a.status }])
)
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Positions                       [ Post a position ]│
│                                                  │
│ [Filters ▾]                                      │
│                                                  │
│ ┌─── PositionCard ───────────────────────────┐   │
│ │ ...                                         │   │
│ └─────────────────────────────────────────────┘   │
│ ┌─── PositionCard ───────────────────────────┐   │
│ │ ...                                         │   │
│ └─────────────────────────────────────────────┘   │
│                                                  │
│ [ Load more ]                                    │
└─────────────────────────────────────────────────┘
```

- "Post a position" button: shown if user has at least 1 current attachment. Disabled with tooltip if profile incomplete or at post limit.
- "Load more" button at bottom for cursor-based pagination (passes `created_at` of last position as cursor)
- Client-side "In my network" filter applied to proximity data
- Empty state: "No open positions right now. Check back soon, or post one yourself!"

### 8.2 — My Positions Page

**File to create:** `app/(protected)/app/positions/mine/page.tsx`

Server component. Shows the poster's own positions.

**Data fetching:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const [positionsRes, postCountRes] = await Promise.all([
  supabase
    .from('positions')
    .select(`
      id, role, department, start_date, duration, location,
      status, expires_at, created_at,
      yachts!yacht_id (id, name)
    `)
    .eq('poster_id', user.id)
    .order('created_at', { ascending: false }),

  supabase.rpc('get_position_post_count', { p_user_id: user.id }),
])

// Application counts per position
const positionIds = (positionsRes.data ?? []).map(p => p.id)
const appCountsRes = positionIds.length > 0
  ? await supabase
      .from('position_applications')
      .select('position_id')
      .in('position_id', positionIds)
  : { data: [] }

// Count applications per position
const appCountMap = new Map<string, number>()
for (const app of (appCountsRes.data ?? [])) {
  appCountMap.set(app.position_id, (appCountMap.get(app.position_id) ?? 0) + 1)
}
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ My Positions                                     │
│                                                  │
│ PostLimitIndicator: 1 of 1 used this month       │
│                                                  │
│ ── Open ──                                       │
│ ┌─────────────────────────────────────────────┐  │
│ │ First Officer · M/Y Horizon                  │  │
│ │ 3 applications · Expires in 28d              │  │
│ │ [ View Apps ] [ Close ] [ Fill ]             │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ── Expired / Closed ──                           │
│ ┌─────────────────────────────────────────────┐  │
│ │ Deckhand · M/Y Atlas · Filled               │  │
│ │ 5 applications                               │  │
│ │ [ Renew ]                                    │  │
│ └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Behaviour:**
- Positions grouped by status: open first, then filled/expired/closed
- "View Apps" → `/app/positions/[id]/applications`
- "Close" → PATCH `/api/positions/[id]` with `{ action: 'close' }`
- "Fill" → PATCH with `{ action: 'fill' }`
- "Renew" → PATCH with `{ action: 'renew' }` (only shown on expired/closed positions)
- Empty state: "You haven't posted any positions yet."

### 8.3 — Application Inbox Page

**File to create:** `app/(protected)/app/positions/[id]/applications/page.tsx`

Server component. Shows applicants for a specific position.

**Data fetching:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Verify ownership
const { data: position } = await supabase
  .from('positions')
  .select('id, poster_id, role, department, yacht_id, yachts!yacht_id(name)')
  .eq('id', positionId)
  .single()

if (!position || position.poster_id !== user.id) {
  redirect('/app/positions/mine')
}

// Fetch applications with applicant profiles
const { data: applications } = await supabase
  .from('position_applications')
  .select(`
    id, status, message, created_at,
    users!applicant_id (
      id, full_name, display_name, handle, profile_photo_url,
      primary_role, departments,
      availability_status, availability_expires_at, availability_contact_methods,
      phone, email, whatsapp, show_phone, show_email, show_whatsapp
    )
  `)
  .eq('position_id', positionId)
  .order('created_at', { ascending: false })

// Graph proximity for all applicants
const applicantIds = (applications ?? []).map(a => (a as any).users?.id).filter(Boolean)
const proximityRes = applicantIds.length > 0
  ? await supabase.rpc('get_graph_proximity_batch', {
      p_viewer_id: user.id,
      p_target_ids: applicantIds,
    })
  : { data: [] }

const proximityMap = new Map(
  (proximityRes.data ?? []).map(r => [r.target_id, r.proximity])
)

// Endorsement highlights for applicants: top 2 endorsements per applicant
// that match the position's department or yacht
const endorsementHighlightsMap = new Map<string, any[]>()
for (const appId of applicantIds) {
  const { data: endorsements } = await supabase
    .from('endorsements')
    .select(`
      id, content, created_at,
      endorser:users!endorser_id(display_name, full_name),
      yachts!yacht_id(name)
    `)
    .eq('recipient_id', appId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(2)

  endorsementHighlightsMap.set(appId, endorsements ?? [])
}

// User's Pro status
const { data: userProfile } = await supabase
  .from('users')
  .select('subscription_status')
  .eq('id', user.id)
  .single()
const isPro = userProfile?.subscription_status === 'pro'
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ ← Applications for First Officer on M/Y Horizon │
│                                                  │
│ 3 applications                                   │
│                                                  │
│ ┌─── ApplicationCard ────────────────────────┐   │
│ │ ...                                         │   │
│ └─────────────────────────────────────────────┘   │
│ ┌─── ApplicationCard ────────────────────────┐   │
│ │ ...                                         │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Back button → `/app/positions/mine`
- Empty state: "No applications yet. Share this position with your network to get started."

### 8.4 — Position Detail Page (for applicants)

The position detail lives within the feed flow. When a user taps a position card, they see the full description and apply flow. This can be implemented as:

**Option A (recommended):** Expand the PositionCard in-place with a slide-down detail section containing the full description and Apply form. This avoids a separate page for V1.

**Option B:** Separate page at `app/(protected)/app/positions/[id]/page.tsx`. This provides a shareable URL.

For V1, implement Option A (inline expand) with a deep-link route (Option B) that redirects to the feed with the position expanded. The GET endpoint in Part 2.2 supports both approaches.

**Apply flow (inline):**
1. User taps "Apply" on position card
2. Card expands to show:
   - Full position description
   - "Your profile will be shared with [poster name]" notice
   - Optional message field (textarea, max 500 chars)
   - "Submit Application" button
3. On submit → POST `/api/positions/[id]/apply`
4. Card collapses, shows "Applied" badge

---

## Part 9: Navigation Integration

### 9.1 — Bottom Tab Bar / Sidebar

The position feed is accessible from the existing navigation. Two options:

**Option A (recommended for V1):** Add "Positions" as a link in the Network tab's sub-navigation or as a prominent card on the Network page. This avoids disrupting the existing 5-tab layout.

**Option B (if founder prefers):** Replace one of the existing 5 tabs or add a 6th tab. This requires nav config changes.

For V1, implement Option A:

**File to modify:** `app/(protected)/app/network/page.tsx`

Add a "Positions" card/link at the top of the network page:

```tsx
<Link href="/app/positions" className="...">
  <div className="flex items-center justify-between px-5 py-4 bg-[var(--color-surface)] rounded-2xl">
    <div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Position Board</p>
      <p className="text-xs text-[var(--color-text-tertiary)]">Browse and post open positions</p>
    </div>
    <span className="text-[var(--color-text-tertiary)]">→</span>
  </div>
</Link>
```

Also add a "Post a Position" button on the profile page near the yacht/employment section (if user has a current attachment).

---

## Part 10: PostHog Events

### Client-Side Events

| Event | Properties | When |
|-------|-----------|------|
| `position_created` | `{ role, department, yacht_id, is_pro }` | User publishes a position |
| `position_viewed` | `{ position_id, proximity_level }` | User opens/views a position card |
| `position_applied` | `{ position_id, proximity_level, message_included }` | User submits an application |
| `position_application_viewed` | `{ application_id }` | Poster views an application card |
| `position_application_shortlisted` | `{ application_id, position_id }` | Poster shortlists an applicant |
| `position_application_rejected` | `{ application_id, position_id }` | Poster rejects an applicant |
| `position_post_limit_hit` | `{ is_pro }` | User hits post limit (conversion tracking) |
| `position_feed_filtered` | `{ department, role, location, network_only }` | User applies filters (debounced) |
| `position_renewed` | `{ position_id }` | Poster renews a position |
| `position_closed` | `{ position_id }` | Poster closes a position |
| `position_filled` | `{ position_id }` | Poster marks position as filled |

### Server-Side Events

| Event | Properties | When |
|-------|-----------|------|
| `position_created` | `{ role, department, yacht_id, is_pro }` | POST `/api/positions` success |
| `position_applied` | `{ position_id, proximity_level, message_included }` | POST `/api/positions/[id]/apply` success |
| `position_application_shortlisted` | `{ position_id, application_id }` | PATCH application status |
| `position_application_rejected` | `{ position_id, application_id }` | PATCH application status |
| `position_application_viewed` | `{ position_id, application_id }` | PATCH application status |
| `position_post_limit_hit` | `{ is_pro }` | POST `/api/positions` returns 429 |
| `position_expired` | `{ position_id }` | Cron expires a position |
| `position_renewed` | `{ position_id }` | PATCH position with renew action |
| `position_closed` | `{ position_id }` | PATCH position with close action |
| `position_filled` | `{ position_id }` | PATCH position with fill action |
| `position_viewed` | `{ position_id, proximity_level }` | GET `/api/positions/[id]` |
| `position_expiry_warning_sent` | `{ position_id }` | Cron sends 3-day warning |

**Note:** Both client and server fire some of the same events. Server-side events are the source of truth for funnel analysis; client-side events enable real-time product analytics.

---

## Part 11: File-by-File Implementation Order

Build in this order. Each file depends only on files above it.

### Phase A: Database + Backend (no UI)

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 1 | `supabase/migrations/20260322000002_sprint18_peer_hiring.sql` | Create | None | Full SQL from Part 1 — tables, indexes, RLS, RPCs, GRANTs |
| 2 | `lib/rate-limit/helpers.ts` | Modify | None | Add `positionCreate`, `positionApply` entries |
| 3 | `lib/email/position-application.ts` | Create | `lib/email/notify.ts` | New application email from Part 3.1 |
| 4 | `lib/email/application-status.ts` | Create | `lib/email/notify.ts` | Status change email from Part 3.2 |
| 5 | `lib/email/position-expiry.ts` | Create | `lib/email/notify.ts` | Expiry warning email from Part 3.3 |
| 6 | `app/api/positions/route.ts` | Create | #1, #2 | POST handler from Part 2.1 |
| 7 | `app/api/positions/[id]/route.ts` | Create | #1 | GET + PATCH handlers from Part 2.2 |
| 8 | `app/api/positions/[id]/apply/route.ts` | Create | #1, #2, #3 | POST handler from Part 2.3 |
| 9 | `app/api/positions/[id]/applications/[applicationId]/route.ts` | Create | #1, #4 | PATCH handler from Part 2.4 |
| 10 | `app/api/cron/position-expiry/route.ts` | Create | #1 | Cron from Part 4.1 |
| 11 | `app/api/cron/position-expiry-warning/route.ts` | Create | #1, #5 | Cron from Part 4.2 |
| 12 | `vercel.json` | Modify | None | Add two cron schedules from Part 4.3 |

### Phase B: UI Components

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 13 | `components/positions/ProximityBadge.tsx` | Create | None | Badge from Part 7.1 |
| 14 | `components/positions/PostLimitIndicator.tsx` | Create | None | Limit indicator from Part 7.5 |
| 15 | `components/positions/PositionFilters.tsx` | Create | None | Filter bar from Part 7.6 |
| 16 | `components/positions/PositionCard.tsx` | Create | #13 | Position card from Part 7.2 |
| 17 | `components/positions/PostPositionForm.tsx` | Create | #14, #6 | Post form from Part 7.3 |
| 18 | `components/positions/ApplicationCard.tsx` | Create | #13 | Application card from Part 7.4 |

### Phase C: Pages

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 19 | `app/(protected)/app/positions/page.tsx` | Create | #15, #16, #17 | Position feed from Part 8.1 |
| 20 | `app/(protected)/app/positions/mine/page.tsx` | Create | #14, #7 | My positions from Part 8.2 |
| 21 | `app/(protected)/app/positions/[id]/applications/page.tsx` | Create | #18, #9 | Application inbox from Part 8.3 |

### Phase D: Navigation + Integration

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 22 | `app/(protected)/app/network/page.tsx` | Modify | #19 | Add position board link (Part 9.1) |
| 23 | `app/(protected)/app/profile/page.tsx` | Modify | #17 | Add "Post a Position" button near yacht section |

### Phase E: Documentation + Cleanup

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 24 | `CHANGELOG.md` | Modify | All | Document Sprint 18 work |
| 25 | `docs/modules/positions.md` | Create | All | New module state file for peer hiring |
| 26 | `docs/yl_schema.md` | Modify | #1 | Document new tables and RPCs |
| 27 | `docs/design-system/flows/app-navigation.md` | Modify | #19-#21 | Add position routes to route map |

---

## Part 12: Testing Checklist

### Position Creation

- [ ] Full profile check: user without photo/bio/role gets 403 with "Complete your profile" message
- [ ] Current attachment check: user without current attachment (all ended) gets 403
- [ ] Post limit (free): first position of the month succeeds, second returns 429 with upgrade CTA
- [ ] Post limit (Pro): first three positions succeed, fourth returns 429
- [ ] Position created with correct `expires_at` (30 days from now)
- [ ] Position appears in feed immediately after creation
- [ ] All fields validated: role required, department required, start_date required, duration enum, description 50-2000 chars
- [ ] Optional fields accept null: location, description
- [ ] PostHog `position_created` fires with correct properties
- [ ] `position_post_limit_hit` fires when limit reached

### Position Feed

- [ ] Feed loads with 20 positions per page
- [ ] "Load more" fetches next page via cursor
- [ ] Department filter works: selecting "Deck" shows only Deck positions
- [ ] Role filter works: typing "Captain" filters positions
- [ ] Location filter works: typing "Antibes" filters positions
- [ ] "In my network" toggle shows only positions with proximity != 'none'
- [ ] Graph proximity badges render correctly for direct colleagues
- [ ] Graph proximity badges render for 2nd degree (Pro users only)
- [ ] Graph proximity badges hidden for non-Pro 2nd degree
- [ ] Endorsement overlap badges render correctly
- [ ] "No connection" positions show no badge
- [ ] Position cards link to yacht detail page (graph link)
- [ ] Position cards link to poster profile (graph link)
- [ ] "Applied" badge shown on positions the user has applied to
- [ ] Empty state renders when no positions exist
- [ ] PostHog `position_feed_filtered` fires on filter change

### Apply with Profile

- [ ] "Apply" button visible on positions user hasn't applied to
- [ ] "Applied" badge shown instead of button after applying
- [ ] Cannot apply to own position (button hidden or disabled)
- [ ] Cannot apply twice (409 response)
- [ ] Cannot apply to non-open position (400 response)
- [ ] Optional message field accepts 0-500 characters
- [ ] Application created successfully with correct status ('applied')
- [ ] Email sent to poster with applicant name, role, yacht, and inbox link
- [ ] PostHog `position_applied` fires with proximity level

### Application Inbox

- [ ] Only position poster can access (others redirected)
- [ ] All applicants shown with profiles, photos, roles
- [ ] Graph proximity badges render for each applicant
- [ ] Endorsement highlights show relevant endorsements
- [ ] "Shortlist" action updates status and sends email to applicant
- [ ] "Reject" action updates status, NO email sent to applicant
- [ ] "Viewed" status set automatically when application card enters viewport
- [ ] "Contact" shows applicant's contact methods (when available)
- [ ] Tap applicant → navigates to their full profile (graph link)
- [ ] PostHog events fire for viewed/shortlisted/rejected

### My Positions

- [ ] Shows all poster's positions grouped by status
- [ ] Application count correct per position
- [ ] Post limit indicator shows correct count
- [ ] "View Apps" navigates to application inbox
- [ ] "Close" action sets status to 'closed'
- [ ] "Fill" action sets status to 'filled'
- [ ] "Renew" action resets expiry to 30 days from now (checks post limit)
- [ ] Renew counts against monthly limit
- [ ] Empty state renders correctly

### Position Lifecycle

- [ ] Expiry cron: open positions past `expires_at` get status set to 'expired'
- [ ] Expiry cron: returns 401 without valid CRON_SECRET
- [ ] Expiry cron: returns `{ expired: 0 }` when none to expire
- [ ] Warning cron: sends email to poster 3 days before expiry
- [ ] Warning cron: does NOT re-send (daily window prevents duplicate emails)
- [ ] Warning cron: email contains correct position details and manage link
- [ ] Expired positions hidden from feed but visible in "My Positions"
- [ ] PostHog `position_expired` fires from cron

### Graph Proximity RPC

- [ ] `direct_colleague`: returns shared yacht names for users with shared attachments
- [ ] `second_degree`: returns connecting colleague name for 2-hop connections
- [ ] `endorsement_overlap`: returns context for endorsed pairs
- [ ] `none`: returns for users with no graph connection
- [ ] `self`: returns for same user
- [ ] Short-circuits at first match (priority: direct > second_degree > endorsement > none)
- [ ] Batch version returns correct proximity for multiple targets

### Pro Gate

- [ ] Free user: 1 position/month enforced
- [ ] Pro user: 3 positions/month enforced
- [ ] Upgrade CTA shown inline (not blocking modal) when limit hit
- [ ] Upgrade link navigates to Stripe checkout
- [ ] 2nd-degree proximity badges visible only to Pro users
- [ ] Free users see 1st-degree badges only

### RLS Policies

- [ ] `positions`: authenticated users can read open positions
- [ ] `positions`: poster can read their own positions (any status)
- [ ] `positions`: only poster can insert with their own `poster_id`
- [ ] `positions`: only poster can update their own positions
- [ ] `positions`: only poster can delete their own positions
- [ ] `position_applications`: applicant can read their own applications
- [ ] `position_applications`: poster can read applications to their positions
- [ ] `position_applications`: only applicant can insert their own application
- [ ] `position_applications`: only poster can update application status
- [ ] `position_applications`: no delete policy — applications are permanent
- [ ] Service role (cron) can update positions (for expiry)

### Email Notifications

- [ ] New application email: sent to poster with correct applicant name, role, yacht
- [ ] New application email: deep link to application inbox works
- [ ] Shortlisted email: sent to applicant with correct position details
- [ ] Rejected: NO email sent (per spec)
- [ ] Expiry warning: sent 3 days before expiry with correct details
- [ ] All emails have both HTML and plain text versions
- [ ] All emails use YachtieLink email template styling

### Mobile / Responsive

- [ ] Position feed works at 375px without overflow
- [ ] Position card renders correctly at 375px
- [ ] Post position form works at 375px (bottom sheet pattern)
- [ ] Application inbox works at 375px
- [ ] Filters collapse on mobile, expand on tap
- [ ] Proximity badges truncate yacht names with CSS `truncate` at mobile width
- [ ] All pages work at desktop width (md: breakpoint) with sidebar layout

### Rate Limiting

- [ ] `POST /api/positions`: rate limited at 5/hr per user
- [ ] `POST /api/positions/[id]/apply`: rate limited at 10/hr per user

---

## Part 13: Rollback Plan

### If Migration Fails

The migration is additive only (new tables, new functions). It does not modify existing tables or data. Rollback:

```sql
-- Reverse Sprint 18 migration (run manually if needed)

-- Drop functions first (they depend on tables)
DROP FUNCTION IF EXISTS public.get_position_feed(text, text, text, timestamptz, int);
DROP FUNCTION IF EXISTS public.get_position_post_count(uuid);
DROP FUNCTION IF EXISTS public.get_graph_proximity_batch(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.get_graph_proximity(uuid, uuid);

-- Drop triggers
DROP TRIGGER IF EXISTS set_position_applications_updated_at ON public.position_applications;
DROP TRIGGER IF EXISTS set_positions_updated_at ON public.positions;

-- Drop tables (applications first due to FK)
DROP TABLE IF EXISTS public.position_applications;
DROP TABLE IF EXISTS public.positions;
```

### If Feature Ships with Bugs

1. **Position creation broken:** Disable the "Post a Position" button in the UI by checking a feature flag or environment variable. Existing positions remain visible.
2. **Apply broken:** Disable the "Apply" button. Existing applications remain.
3. **Cron broken:** Remove cron entries from `vercel.json`. Positions won't auto-expire but can be manually closed.
4. **Feed broken:** Redirect `/app/positions` to `/app/network` temporarily. Remove the position board link from the network page.
5. **Graph proximity broken:** Fall back to rendering no badges. Position cards still function without proximity data.

### Feature Flag (Optional)

If a gradual rollout is preferred, gate the entire feature behind an environment variable:

```typescript
const PEER_HIRING_ENABLED = process.env.NEXT_PUBLIC_PEER_HIRING === 'true'
```

Check this in the position feed page, the network page link, and the profile page button. This allows deploying all code without exposing it to users until ready.

---

## Appendix A: Graph Proximity RPC Design Notes

The `get_graph_proximity()` function is designed as a **general-purpose utility** that future sprints will reuse:

- **Sprint 19 (Recruiter Search):** Recruiters see graph proximity between themselves (or their client contacts) and crew in search results.
- **Sprint 20 (Agency Views):** Agency users see graph context across their team's combined networks.
- **Sprint 21 (Messaging):** Graph proximity determines message priority and trust indicators.

**Performance characteristics at scale:**
- Direct colleague check: O(n) where n = viewer's attachments. Fast even at scale.
- Second degree check: O(n * m) where n = viewer's colleagues, m = their attachments. Can be expensive at 10K+ users with deep networks.
- Mitigation strategies for future scaling:
  1. Cache `get_graph_proximity` results in `position_proximity_cache` table (key: viewer_id + target_id, TTL: 24h)
  2. Pre-compute 1st-degree colleague sets nightly
  3. Limit second-degree traversal depth (already limited by the LIMIT 1 in the query)

For Sprint 18 at Phase 2 launch volumes (10K-20K users), the current implementation should perform adequately. Monitor query timing via PostHog and Supabase dashboard.

## Appendix B: Relationship to Sprint 17

Sprint 17 (attachment confirmation, smart yacht autocomplete, graph integrity controls) must be complete before Sprint 18 ships. The graph integrity that Sprint 17 provides is critical because:

1. **Attachment confirmation** ensures that the `ended_at IS NULL` check for "current attachment" is trustworthy — unconfirmed attachments can't be used to post fake positions.
2. **Semantic yacht matching** prevents the same yacht appearing as multiple entities, which would break graph proximity calculations.
3. **Graph integrity controls** give the platform tools to detect and respond to graph manipulation — important when positions create economic incentives to game the graph.

Sprint 18 code should not need to implement any integrity checks beyond what Sprint 17 provides. The existing RLS and the current-attachment check in the API are sufficient.
