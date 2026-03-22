# Sprint 14 — Availability Toggle + Endorsement Signals: Build Plan

## Context

Sprint 14 adds two independent features that transform YachtieLink from a static profile tool into a living professional network:

1. **Availability Toggle** — Crew can signal they are available for work, with 7-day auto-expiry (D-027). This makes the graph actionable: available crew become findable.
2. **Endorsement Signals** — Crew with shared yacht attachments can agree/disagree on endorsements (D-019). This adds community depth to the trust layer without moderation.

These are independent workstreams with no shared database dependencies. If time is tight, availability is higher priority (it enables Sprint 15's search feature).

### What Already Exists (No Build Needed)

| Dependency | Status | Notes |
|-----------|--------|-------|
| `users` table with `available_for_work` boolean | Exists | Sprint 3 — but this is a placeholder boolean. Sprint 14 replaces it with the full toggle system. |
| `endorsements` table with `endorser_id`, `recipient_id`, `yacht_id` | Exists | Sprint 5 |
| `attachments` table with `user_id`, `yacht_id`, `started_at`, `ended_at` | Exists | Sprint 2-4 |
| `are_coworkers_on_yacht(user_a, user_b, yacht)` RPC | Exists | Sprint 4 — reuse for signal eligibility |
| `get_colleagues(p_user_id)` RPC | Exists | Sprint 4 |
| Resend email infrastructure (`lib/email/notify.ts`) | Exists | Sprint 2, 5 |
| Cron job infrastructure (`vercel.json`, `CRON_SECRET` pattern) | Exists | Sprint 8 |
| `createServiceClient()` admin Supabase client | Exists | `lib/supabase/admin.ts` |
| Rate limiting (`lib/rate-limit/helpers.ts`) | Exists | Sprint 8 |
| Validation (`lib/validation/validate.ts`, Zod schemas) | Exists | Sprint 5 |
| PostHog client (`lib/analytics/events.ts`) + server (`lib/analytics/server.ts`) | Exists | Sprint 8 |
| `EndorsementCard` component | Exists | `components/public/EndorsementCard.tsx` |
| `handleApiError` utility | Exists | `lib/api/errors.ts` |

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

### Dependencies

- Sprint 12 complete: yacht detail pages, colleague explorer, mutual colleagues
- Sprint 13 complete: production environment operational, soft launch users present

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260322000001_sprint14_availability_signals.sql`

### 1.1 — Availability Columns on Users

The existing `available_for_work` boolean (Sprint 3) is a placeholder. Sprint 14 adds a richer availability system alongside it. We keep `available_for_work` for backwards compatibility but the new columns are the source of truth.

```sql
-- Sprint 14: Availability Toggle + Endorsement Signals
-- Two independent features in one migration.

-- ═══════════════════════════════════════════════════════════
-- 1. AVAILABILITY COLUMNS ON USERS
-- ═══════════════════════════════════════════════════════════

-- Status column: 'available' or 'not_available'
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'not_available';

ALTER TABLE public.users
  ADD CONSTRAINT valid_availability_status
  CHECK (availability_status IN ('available', 'not_available'));

-- Expiry timestamp: set to now() + 7 days when toggled on, NULL when off
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS availability_expires_at timestamptz;

-- Contact methods visible while available: JSON array of strings
-- e.g. ["phone", "email", "whatsapp"]
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS availability_contact_methods jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Composite index for cron queries (find expiring / expired users)
CREATE INDEX IF NOT EXISTS idx_users_availability_expiry
  ON public.users (availability_status, availability_expires_at)
  WHERE availability_status = 'available';

-- Index for displaying available users in future search (Sprint 15)
CREATE INDEX IF NOT EXISTS idx_users_available
  ON public.users (availability_status)
  WHERE availability_status = 'available';
```

### 1.2 — Availability Events Table

Tracks toggle events for future analytics. Not exposed in UI in Sprint 14.

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. AVAILABILITY EVENTS (analytics, not user-facing)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.availability_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_availability_event_type
    CHECK (event_type IN ('toggled_on', 'toggled_off', 'expired', 'reminded'))
);

CREATE INDEX idx_availability_events_user
  ON public.availability_events (user_id, created_at DESC);

CREATE INDEX idx_availability_events_type
  ON public.availability_events (event_type, created_at DESC);

-- RLS: users can read their own events only. Service role writes from cron.
ALTER TABLE public.availability_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_events: own read"
  ON public.availability_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "availability_events: own insert"
  ON public.availability_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update or delete policies — events are append-only.
```

### 1.3 — Endorsement Signals Table

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. ENDORSEMENT SIGNALS (agree/disagree)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.endorsement_signals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorsement_id  uuid NOT NULL REFERENCES public.endorsements (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  signal          text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_signal CHECK (signal IN ('agree', 'disagree'))
);

-- One signal per user per endorsement — can change signal, can't duplicate
CREATE UNIQUE INDEX idx_endorsement_signals_unique
  ON public.endorsement_signals (endorsement_id, user_id);

-- For aggregating signal counts on an endorsement
CREATE INDEX idx_endorsement_signals_endorsement
  ON public.endorsement_signals (endorsement_id);

-- For listing a user's signals
CREATE INDEX idx_endorsement_signals_user
  ON public.endorsement_signals (user_id, created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER set_endorsement_signals_updated_at
  BEFORE UPDATE ON public.endorsement_signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.endorsement_signals ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read signals (counts are public on endorsement cards)
CREATE POLICY "endorsement_signals: authenticated read"
  ON public.endorsement_signals FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only insert their own signal
CREATE POLICY "endorsement_signals: own insert"
  ON public.endorsement_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own signal
CREATE POLICY "endorsement_signals: own update"
  ON public.endorsement_signals FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own signal (toggle-off behavior)
CREATE POLICY "endorsement_signals: own delete"
  ON public.endorsement_signals FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.4 — Endorsement Signal Eligibility RPC

Checks if a user can signal on a specific endorsement. The user must have an overlapping yacht attachment with the endorsement's yacht.

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. SIGNAL ELIGIBILITY CHECK
-- ═══════════════════════════════════════════════════════════

-- Returns true if user has an attachment (past or present) to the
-- endorsement's yacht. Reuses the same logic as are_coworkers_on_yacht
-- but only checks one user's attachment, not a pair.
CREATE OR REPLACE FUNCTION public.can_signal_endorsement(
  p_user_id uuid,
  p_endorsement_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM endorsements e
    JOIN attachments a ON a.yacht_id = e.yacht_id
    WHERE e.id = p_endorsement_id
      AND e.deleted_at IS NULL
      AND a.user_id = p_user_id
      AND a.deleted_at IS NULL
      -- Exclude the endorser and recipient themselves from signalling
      AND p_user_id != e.endorser_id
      AND p_user_id != e.recipient_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_signal_endorsement(uuid, uuid) TO authenticated;
```

### 1.5 — Batch Signal Eligibility RPC

Optimisation: when rendering a profile page with N endorsements, check eligibility for all in one query rather than N individual calls.

```sql
-- ═══════════════════════════════════════════════════════════
-- 5. BATCH SIGNAL ELIGIBILITY (performance optimization)
-- ═══════════════════════════════════════════════════════════

-- Given a viewer and an array of endorsement IDs, returns which ones
-- the viewer is eligible to signal on.
CREATE OR REPLACE FUNCTION public.get_signalable_endorsements(
  p_user_id uuid,
  p_endorsement_ids uuid[]
)
RETURNS TABLE (endorsement_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT e.id AS endorsement_id
  FROM endorsements e
  JOIN attachments a ON a.yacht_id = e.yacht_id
  WHERE e.id = ANY(p_endorsement_ids)
    AND e.deleted_at IS NULL
    AND a.user_id = p_user_id
    AND a.deleted_at IS NULL
    AND p_user_id != e.endorser_id
    AND p_user_id != e.recipient_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_signalable_endorsements(uuid, uuid[]) TO authenticated;
```

### 1.6 — Get Endorsement Signal Aggregates RPC

Returns signal counts and signaller details for a set of endorsements.

```sql
-- ═══════════════════════════════════════════════════════════
-- 6. ENDORSEMENT SIGNAL AGGREGATES
-- ═══════════════════════════════════════════════════════════

-- Returns aggregate counts + signaller list for a single endorsement.
CREATE OR REPLACE FUNCTION public.get_endorsement_signals(
  p_endorsement_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_build_object(
      'agree_count', coalesce(sum(CASE WHEN es.signal = 'agree' THEN 1 ELSE 0 END), 0),
      'disagree_count', coalesce(sum(CASE WHEN es.signal = 'disagree' THEN 1 ELSE 0 END), 0),
      'signallers', coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_id', es.user_id,
            'signal', es.signal,
            'name', coalesce(u.display_name, u.full_name),
            'handle', u.handle,
            'profile_photo_url', u.profile_photo_url,
            'role', u.primary_role
          )
          ORDER BY es.created_at ASC
        ),
        '[]'::jsonb
      )
    ),
    '{"agree_count": 0, "disagree_count": 0, "signallers": []}'::jsonb
  )
  FROM endorsement_signals es
  JOIN users u ON u.id = es.user_id
  WHERE es.endorsement_id = p_endorsement_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_endorsement_signals(uuid) TO authenticated;
```

### 1.7 — Batch Endorsement Signal Aggregates RPC

For profile pages that display multiple endorsements, fetch all signal data in one call.

```sql
-- ═══════════════════════════════════════════════════════════
-- 7. BATCH SIGNAL AGGREGATES (performance optimization)
-- ═══════════════════════════════════════════════════════════

-- Returns signal counts per endorsement for a set of endorsement IDs.
-- Does NOT include signaller details (use get_endorsement_signals for detail).
CREATE OR REPLACE FUNCTION public.get_endorsement_signal_counts(
  p_endorsement_ids uuid[]
)
RETURNS TABLE (
  endorsement_id uuid,
  agree_count int,
  disagree_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    es.endorsement_id,
    count(*) FILTER (WHERE es.signal = 'agree')::int AS agree_count,
    count(*) FILTER (WHERE es.signal = 'disagree')::int AS disagree_count
  FROM endorsement_signals es
  WHERE es.endorsement_id = ANY(p_endorsement_ids)
  GROUP BY es.endorsement_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_endorsement_signal_counts(uuid[]) TO authenticated;
```

### 1.8 — Toggle Availability RPC

Server-side function that atomically toggles availability and logs the event.

```sql
-- ═══════════════════════════════════════════════════════════
-- 8. TOGGLE AVAILABILITY (atomic operation)
-- ═══════════════════════════════════════════════════════════

-- Toggles a user's availability status. Returns the new status.
-- When toggling ON: sets expiry to now() + 7 days, logs toggled_on event.
-- When toggling OFF: clears expiry, logs toggled_off event.
CREATE OR REPLACE FUNCTION public.toggle_availability(
  p_user_id uuid,
  p_contact_methods jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
  new_status text;
  new_expiry timestamptz;
  result jsonb;
BEGIN
  -- Get current status
  SELECT availability_status INTO current_status
  FROM users WHERE id = p_user_id;

  IF current_status = 'available' THEN
    -- Toggle OFF
    new_status := 'not_available';
    new_expiry := NULL;

    UPDATE users SET
      availability_status = new_status,
      availability_expires_at = new_expiry,
      availability_contact_methods = '[]'::jsonb,
      available_for_work = false
    WHERE id = p_user_id;

    INSERT INTO availability_events (user_id, event_type)
    VALUES (p_user_id, 'toggled_off');
  ELSE
    -- Toggle ON
    new_status := 'available';
    new_expiry := now() + interval '7 days';

    UPDATE users SET
      availability_status = new_status,
      availability_expires_at = new_expiry,
      availability_contact_methods = p_contact_methods,
      available_for_work = true
    WHERE id = p_user_id;

    INSERT INTO availability_events (user_id, event_type, metadata)
    VALUES (p_user_id, 'toggled_on', jsonb_build_object('contact_methods', p_contact_methods));
  END IF;

  result := jsonb_build_object(
    'status', new_status,
    'expires_at', new_expiry
  );

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_availability(uuid, jsonb) TO authenticated;
```

### Complete Migration File

The full migration file content is sections 1.1 through 1.8 above, concatenated in order, with a header comment:

```sql
-- Sprint 14: Availability Toggle + Endorsement Signals
-- Two independent features sharing one migration.
-- See sprints/major/phase-1c/sprint-14/build_plan.md for full specification.
```

---

## Part 2: Availability Toggle API Route

**File to create:** `app/api/availability/route.ts`

### 2.1 — POST: Toggle Availability

```typescript
// POST /api/availability
// Body: { contact_methods?: string[] }
// Response: { status: 'available' | 'not_available', expires_at: string | null }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const toggleAvailabilitySchema = z.object({
  contact_methods: z.array(
    z.enum(['phone', 'email', 'whatsapp'])
  ).optional().default([]),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'profileEdit', user.id)
    if (limited) return limited

    const result = await validateBody(req, toggleAvailabilitySchema)
    if ('error' in result) return result.error
    const { contact_methods } = result.data

    const { data, error } = await supabase.rpc('toggle_availability', {
      p_user_id: user.id,
      p_contact_methods: JSON.stringify(contact_methods),
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to toggle availability' }, { status: 500 })
    }

    // Track event
    const newStatus = (data as any)?.status
    if (newStatus === 'available') {
      trackServerEvent(user.id, 'availability_toggled_on', { contact_methods })
    } else {
      trackServerEvent(user.id, 'availability_toggled_off', {})
    }

    return NextResponse.json(data)
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 2.2 — GET: Current Availability Status

```typescript
// GET /api/availability
// Response: { status, expires_at, contact_methods }

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('users')
      .select('availability_status, availability_expires_at, availability_contact_methods')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json({
      status: data.availability_status,
      expires_at: data.availability_expires_at,
      contact_methods: data.availability_contact_methods,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### Request/Response Schema

| Method | Path | Auth | Rate Limit | Request Body | Response |
|--------|------|------|------------|-------------|----------|
| `POST` | `/api/availability` | Required | `profileEdit` (30/min) | `{ contact_methods?: ("phone" \| "email" \| "whatsapp")[] }` | `{ status: "available" \| "not_available", expires_at: string \| null }` |
| `GET` | `/api/availability` | Required | None | — | `{ status, expires_at, contact_methods }` |

---

## Part 3: Endorsement Signals API Route

**File to create:** `app/api/endorsement-signals/route.ts`

### 3.1 — POST: Add/Update Signal

```typescript
// POST /api/endorsement-signals
// Body: { endorsement_id: string, signal: 'agree' | 'disagree' }
// Response: { id, endorsement_id, signal, created_at }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

export const runtime = 'nodejs'

const signalSchema = z.object({
  endorsement_id: z.string().uuid(),
  signal: z.enum(['agree', 'disagree']),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'endorsementEdit', user.id)
    if (limited) return limited

    const result = await validateBody(req, signalSchema)
    if ('error' in result) return result.error
    const { endorsement_id, signal } = result.data

    // Eligibility check: user must have attachment to endorsement's yacht
    const { data: canSignal } = await supabase.rpc('can_signal_endorsement', {
      p_user_id: user.id,
      p_endorsement_id: endorsement_id,
    })

    if (!canSignal) {
      return NextResponse.json(
        { error: 'You can only signal endorsements on yachts where you have worked.' },
        { status: 403 },
      )
    }

    // Upsert: insert or update existing signal
    const { data: existing } = await supabase
      .from('endorsement_signals')
      .select('id, signal')
      .eq('endorsement_id', endorsement_id)
      .eq('user_id', user.id)
      .maybeSingle()

    let signalRecord
    if (existing) {
      // Update existing signal
      const { data, error } = await supabase
        .from('endorsement_signals')
        .update({ signal, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: 'Failed to update signal' }, { status: 500 })
      signalRecord = data
    } else {
      // Insert new signal
      const { data, error } = await supabase
        .from('endorsement_signals')
        .insert({ endorsement_id, user_id: user.id, signal })
        .select()
        .single()
      if (error) return NextResponse.json({ error: 'Failed to add signal' }, { status: 500 })
      signalRecord = data
    }

    trackServerEvent(user.id, 'endorsement_signal_added', {
      endorsement_id,
      signal,
      was_update: !!existing,
    })

    return NextResponse.json({ signal: signalRecord }, { status: existing ? 200 : 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### 3.2 — DELETE: Remove Signal

**File to create:** `app/api/endorsement-signals/[id]/route.ts`

```typescript
// DELETE /api/endorsement-signals/[id]
// Response: { success: true }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

export const runtime = 'nodejs'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // RLS ensures only own signal can be deleted, but verify explicitly
    const { data: signal } = await supabase
      .from('endorsement_signals')
      .select('id, endorsement_id, signal, user_id')
      .eq('id', id)
      .single()

    if (!signal || signal.user_id !== user.id) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('endorsement_signals')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to remove signal' }, { status: 500 })
    }

    trackServerEvent(user.id, 'endorsement_signal_removed', {
      endorsement_id: signal.endorsement_id,
      signal: signal.signal,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
```

### Request/Response Schema

| Method | Path | Auth | Rate Limit | Request Body | Response |
|--------|------|------|------------|-------------|----------|
| `POST` | `/api/endorsement-signals` | Required | `endorsementEdit` (20/hr) | `{ endorsement_id: uuid, signal: "agree" \| "disagree" }` | `{ signal: { id, endorsement_id, signal, created_at } }` |
| `DELETE` | `/api/endorsement-signals/[id]` | Required | None | — | `{ success: true }` |

---

## Part 4: Availability Cron Jobs

### 4.1 — Availability Expiry Cron

**File to create:** `app/api/cron/availability-expiry/route.ts`

Runs daily at 6:00 UTC. Expires users whose `availability_expires_at` has passed.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const cronSecret = req.headers.get('authorization')
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    // Find users whose availability has expired
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('availability_status', 'available')
      .lt('availability_expires_at', now)

    if (fetchError) {
      console.error('Failed to fetch expired users:', fetchError)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    if (!expiredUsers?.length) {
      return NextResponse.json({ expired: 0 })
    }

    let expired = 0

    for (const user of expiredUsers) {
      // Update status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          availability_status: 'not_available',
          availability_expires_at: null,
          availability_contact_methods: '[]',
          available_for_work: false,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error(`Failed to expire user ${user.id}:`, updateError)
        continue
      }

      // Log event
      await supabase.from('availability_events').insert({
        user_id: user.id,
        event_type: 'expired',
      })

      trackServerEvent(user.id, 'availability_expired', {})
      expired++
    }

    return NextResponse.json({ expired })
  } catch (e) {
    return handleApiError(e)
  }
}
```

### 4.2 — Availability Reminder Cron

**File to create:** `app/api/cron/availability-reminder/route.ts`

Runs daily at 7:00 UTC (after expiry cron). Sends day-6 reminder to users expiring within the next 24 hours.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { sendAvailabilityReminderEmail } from '@/lib/email/availability-reminder'
import { handleApiError } from '@/lib/api/errors'
import { trackServerEvent } from '@/lib/analytics/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const cronSecret = req.headers.get('authorization')
    if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find users whose availability expires within the next 24 hours
    // but hasn't expired yet, and who haven't already been reminded
    const { data: expiringUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, display_name, availability_expires_at')
      .eq('availability_status', 'available')
      .gt('availability_expires_at', now.toISOString())
      .lte('availability_expires_at', in24Hours.toISOString())

    if (fetchError) {
      console.error('Failed to fetch expiring users:', fetchError)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    if (!expiringUsers?.length) {
      return NextResponse.json({ reminded: 0 })
    }

    // Check which of these users have already received a reminder for this toggle period
    // by looking for a 'reminded' event within the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const userIds = expiringUsers.map(u => u.id)

    const { data: recentReminders } = await supabase
      .from('availability_events')
      .select('user_id')
      .in('user_id', userIds)
      .eq('event_type', 'reminded')
      .gte('created_at', sevenDaysAgo.toISOString())

    const alreadyReminded = new Set(recentReminders?.map(r => r.user_id) ?? [])

    let reminded = 0

    for (const user of expiringUsers) {
      if (alreadyReminded.has(user.id)) continue
      if (!user.email) continue

      const name = user.full_name ?? user.display_name ?? 'there'

      try {
        await sendAvailabilityReminderEmail({
          email: user.email,
          name,
          expiresAt: user.availability_expires_at!,
        })

        // Log reminder event
        await supabase.from('availability_events').insert({
          user_id: user.id,
          event_type: 'reminded',
        })

        trackServerEvent(user.id, 'availability_reminder_sent', {})
        reminded++
      } catch (e) {
        console.error(`Failed to send reminder to ${user.id}:`, e)
      }
    }

    return NextResponse.json({ reminded })
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
      "path": "/api/cron/availability-expiry",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/availability-reminder",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**Schedule rationale:**
- Expiry at 06:00 UTC — runs before the reminder cron to ensure already-expired users are cleaned up first.
- Reminder at 07:00 UTC — runs after expiry. Sends emails during European working hours (morning Med time).

---

## Part 5: Availability Reminder Email

**File to create:** `lib/email/availability-reminder.ts`

```typescript
import { sendNotifyEmail } from './notify'

interface AvailabilityReminderParams {
  email: string
  name: string
  expiresAt: string
}

export async function sendAvailabilityReminderEmail({
  email,
  name,
  expiresAt,
}: AvailabilityReminderParams): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'
  const expiryFormatted = new Date(expiresAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const profileUrl = `${siteUrl}/app/profile#availability`

  await sendNotifyEmail({
    to: email,
    subject: 'Your availability expires tomorrow',
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
            Your availability expires tomorrow
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Hi ${name},
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Your &ldquo;Available for work&rdquo; status on YachtieLink expires on <strong>${expiryFormatted}</strong>.
            After that, you&rsquo;ll no longer appear as available to other crew.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Still looking? Toggle your availability again to stay visible for another 7 days.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${profileUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                Stay available &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because you toggled availability on YachtieLink.
            If you&rsquo;ve found a position, you can ignore this &mdash; your status will automatically expire.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${name},\n\nYour "Available for work" status on YachtieLink expires on ${expiryFormatted}.\n\nStill looking? Toggle your availability again to stay visible for another 7 days:\n${profileUrl}\n\nIf you've found a position, you can ignore this — your status will automatically expire.`,
  })
}
```

---

## Part 6: Availability Toggle UI

### 6.1 — AvailabilityToggle Component

**File to create:** `components/profile/AvailabilityToggle.tsx`

Client component. Displays the toggle switch, contact method selector, and confirmation.

```typescript
'use client'

interface AvailabilityToggleProps {
  initialStatus: 'available' | 'not_available'
  initialExpiresAt: string | null
  initialContactMethods: string[]
  userPhone: string | null
  userEmail: string
  userWhatsapp: string | null
}
```

**State:**
- `status: 'available' | 'not_available'` — mirrors DB
- `expiresAt: string | null` — expiry timestamp
- `contactMethods: string[]` — selected methods
- `showConfirmation: boolean` — shows confirmation card before activating
- `isLoading: boolean` — for optimistic UI during API call

**UI layout (375px):**

```
┌─────────────────────────────────────────────────┐
│ Availability                                     │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ I'm available for work          [  Toggle ] │ │
│ │                                             │ │
│ │ (when ON:)                                  │ │
│ │ Expires: Tuesday, 29 March      Renew →     │ │
│ │                                             │ │
│ │ Show while available:                       │ │
│ │ ☑ Email                                    │ │
│ │ ☐ Phone                                    │ │
│ │ ☑ WhatsApp                                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Behaviour:**
- Toggle switch uses the same styling as existing boolean toggles in the codebase
- Contact method checkboxes only shown when status is `available`
- Checkboxes disabled for methods the user hasn't set (e.g., if `phone` is null, checkbox is disabled with "(not set)" label)
- "Renew" button: calls `POST /api/availability` again to reset the 7-day window
- When toggling ON for the first time, show confirmation text: "You'll be visible as available for 7 days. We'll remind you before it expires."
- On toggle: call `POST /api/availability`, update state optimistically, revert on error
- Fire `trackEvent('availability_toggled_on', { contact_methods })` or `trackEvent('availability_toggled_off', {})` on client side

**Contact method changes:** When user checks/unchecks a contact method while already available, call `POST /api/availability` with the updated methods. This resets the 7-day window (intentional — any interaction with the toggle refreshes it).

### 6.2 — Profile Page Integration

**File to modify:** `app/(protected)/app/profile/page.tsx`

Add the AvailabilityToggle to the profile page, positioned after the hero card / identity section.

**Data fetch addition:** Add `availability_status, availability_expires_at, availability_contact_methods, phone, email, whatsapp` to the user query if not already included.

```typescript
// In the profile page's data fetch:
const { data: user } = await supabase
  .from('users')
  .select('..., availability_status, availability_expires_at, availability_contact_methods, phone, email, whatsapp')
  .eq('id', session.user.id)
  .single()
```

Render:
```tsx
<AvailabilityToggle
  initialStatus={user.availability_status ?? 'not_available'}
  initialExpiresAt={user.availability_expires_at}
  initialContactMethods={user.availability_contact_methods ?? []}
  userPhone={user.phone}
  userEmail={user.email}
  userWhatsapp={user.whatsapp}
/>
```

### 6.3 — Availability Badge Component

**File to create:** `components/ui/AvailabilityBadge.tsx`

A small green badge shown on profile cards, public profiles, and crew cards when a user's `availability_status` is `'available'` and `availability_expires_at` is in the future.

```typescript
interface AvailabilityBadgeProps {
  size?: 'sm' | 'md'  // sm for cards, md for profile page
}
```

**Rendering:**
- Green dot (8px) + "Available" text
- `sm`: inline, text-xs — for colleague explorer cards, yacht crew cards
- `md`: standalone pill — for profile page hero section

**Styling:**
```
<span className="inline-flex items-center gap-1.5">
  <span className="h-2 w-2 rounded-full bg-emerald-500" />
  <span className="text-xs font-medium text-emerald-700">Available</span>
</span>
```

**Staleness guard:** The badge checks `availability_expires_at > new Date()` client-side before rendering. If the expiry has passed (cron hasn't run yet), the badge is hidden. This prevents stale badges between cron runs.

### 6.4 — Public Profile Availability Display

**File to modify:** `components/public/PublicProfileContent.tsx`

Currently uses `available_for_work` boolean. Update to use the new `availability_status` system:

1. Replace `available_for_work` check with `availability_status === 'available' && availability_expires_at > now`
2. When available: show `AvailabilityBadge` in the hero section
3. When available: show selected contact methods from `availability_contact_methods`, regardless of normal `show_phone`/`show_email`/`show_whatsapp` settings
4. When not available: revert to normal contact visibility settings

**Data dependency:** The public profile server component already fetches the user. Add `availability_status, availability_expires_at, availability_contact_methods` to the select.

### 6.5 — Crew Card Availability Integration

**Files to modify:**
- `components/yacht/CrewCard.tsx` (if exists from Sprint 12) — add `AvailabilityBadge` when crew member is available
- Colleague explorer cards — add `AvailabilityBadge`

Add `availability_status` and `availability_expires_at` to crew/colleague data fetches on yacht detail and colleague explorer pages.

---

## Part 7: Endorsement Signals UI

### 7.1 — EndorsementSignals Component

**File to create:** `components/endorsement/EndorsementSignals.tsx`

Client component. Renders the agree/disagree buttons and signal counts on an endorsement card.

```typescript
'use client'

interface EndorsementSignalsProps {
  endorsementId: string
  agreeCount: number
  disagreeCount: number
  viewerSignal: 'agree' | 'disagree' | null  // current user's signal, if any
  viewerSignalId: string | null               // id of current user's signal record
  canSignal: boolean                          // false if user is not eligible
}
```

**State:**
- `optimisticSignal: 'agree' | 'disagree' | null` — local state for optimistic UI
- `optimisticAgreeCount: number`
- `optimisticDisagreeCount: number`
- `isLoading: boolean`

**UI layout (375px):**

When `canSignal` is `true`:
```
┌────────────────────────────────────────┐
│  👍 3 agree  ·  👎 1 disagree         │
│  [Agree]  [Disagree]                   │
└────────────────────────────────────────┘
```

When `canSignal` is `false` but signals exist:
```
┌────────────────────────────────────────┐
│  3 agree  ·  1 disagree               │
└────────────────────────────────────────┘
```

When no signals exist and not eligible: render nothing.

**Behaviour:**
- Tap "Agree" → POST to `/api/endorsement-signals` with `signal: 'agree'`, optimistically update counts
- Tap "Agree" again when already agreed → DELETE signal (toggle off), optimistically update counts
- Tap "Disagree" when already agreed → POST with `signal: 'disagree'` (server upserts), optimistically swap counts
- Tap counts → expand signaller list (see 7.2)
- Use `trackEvent('endorsement_signal_added', { signal, endorsement_id })` / `trackEvent('endorsement_signal_removed', { signal, endorsement_id })`

**Icon choices:**
- Agree: thumbs-up outline (unfilled when not selected, filled + teal when selected)
- Disagree: thumbs-down outline (unfilled when not selected, filled + coral when selected)
- Use Heroicons or Lucide (whichever is already in the project)

### 7.2 — SignallerDetail Component

**File to create:** `components/endorsement/SignallerDetail.tsx`

Expandable panel that appears when tapping signal counts. Shows who signalled.

```typescript
'use client'

interface Signaller {
  user_id: string
  signal: 'agree' | 'disagree'
  name: string
  handle: string | null
  profile_photo_url: string | null
  role: string | null
}

interface SignallerDetailProps {
  endorsementId: string
  signallers: Signaller[]
}
```

**UI layout:**
```
┌────────────────────────────────────────┐
│ 👍 Agreed                              │
│ ┌──────────────────────────────────┐   │
│ │ [Photo] John Smith               │   │
│ │ Captain                          │   │
│ ├──────────────────────────────────┤   │
│ │ [Photo] Sarah Jones              │   │
│ │ Chief Stew                       │   │
│ └──────────────────────────────────┘   │
│                                        │
│ 👎 Disagreed                           │
│ ┌──────────────────────────────────┐   │
│ │ [Photo] Mike Davis               │   │
│ │ 2nd Engineer                     │   │
│ └──────────────────────────────────┘   │
└────────────────────────────────────────┘
```

**Behaviour:**
- Group signallers by signal type (agree first, disagree second)
- Each signaller card links to `/u/[handle]` (graph link — no dead ends)
- Use `ProfileAvatar` for photos
- Fetched lazily: data is already available from `get_endorsement_signals` RPC, passed as prop
- Fire `trackEvent('endorsement_signal_detail_viewed', { endorsement_id })` when expanded

### 7.3 — EndorsementCard Integration

**File to modify:** `components/public/EndorsementCard.tsx`

Add `EndorsementSignals` below the endorsement content.

**Updated props:**
```typescript
interface EndorsementCardProps {
  endorserName: string
  endorserRole?: string | null
  endorserPhoto?: string | null
  endorserHandle?: string | null    // NEW — graph link to endorser
  yachtName?: string | null
  yachtId?: string | null           // NEW — graph link to yacht
  date: string
  content: string
  // Signal props (NEW)
  endorsementId: string
  agreeCount: number
  disagreeCount: number
  viewerSignal: 'agree' | 'disagree' | null
  viewerSignalId: string | null
  canSignal: boolean
  signallers: Signaller[]
}
```

The `EndorsementSignals` component renders at the bottom of the card, below the content text and "Read more" toggle.

**When no signal data:** Pass `agreeCount: 0`, `disagreeCount: 0`, `canSignal: false` — component renders nothing.

### 7.4 — Profile Page Signal Data Fetching

**File to modify:** Profile page (both protected `app/(protected)/app/profile/page.tsx` and public `app/u/[handle]/page.tsx`)

When the page fetches endorsements for a profile, also fetch signal data:

```typescript
// After fetching endorsements for the profile:
const endorsementIds = endorsements.map(e => e.id)

// Parallel fetch for signal data
const [signalCountsRes, signalableRes, viewerSignalsRes] = await Promise.all([
  // 1. Aggregate counts for all endorsements
  supabase.rpc('get_endorsement_signal_counts', {
    p_endorsement_ids: endorsementIds,
  }),
  // 2. Which endorsements the viewer can signal on (only if authenticated)
  isAuthenticated
    ? supabase.rpc('get_signalable_endorsements', {
        p_user_id: viewerId,
        p_endorsement_ids: endorsementIds,
      })
    : Promise.resolve({ data: [] }),
  // 3. Viewer's existing signals
  isAuthenticated
    ? supabase
        .from('endorsement_signals')
        .select('id, endorsement_id, signal')
        .eq('user_id', viewerId)
        .in('endorsement_id', endorsementIds)
    : Promise.resolve({ data: [] }),
])

// Build a lookup map per endorsement
const signalCountMap = new Map(
  (signalCountsRes.data ?? []).map(r => [r.endorsement_id, { agree: r.agree_count, disagree: r.disagree_count }])
)
const signalableSet = new Set((signalableRes.data ?? []).map(r => r.endorsement_id))
const viewerSignalMap = new Map(
  (viewerSignalsRes.data ?? []).map(r => [r.endorsement_id, { id: r.id, signal: r.signal }])
)
```

Pass this data to each `EndorsementCard`:

```tsx
{endorsements.map(e => {
  const counts = signalCountMap.get(e.id) ?? { agree: 0, disagree: 0 }
  const viewerSig = viewerSignalMap.get(e.id)
  return (
    <EndorsementCard
      key={e.id}
      endorsementId={e.id}
      agreeCount={counts.agree}
      disagreeCount={counts.disagree}
      viewerSignal={viewerSig?.signal ?? null}
      viewerSignalId={viewerSig?.id ?? null}
      canSignal={signalableSet.has(e.id)}
      signallers={[]}  // fetched lazily on expand via get_endorsement_signals RPC
      // ...existing props
    />
  )
})}
```

### 7.5 — Lazy Signaller Detail Fetch

When a user taps signal counts to expand the signaller list, fetch details via `get_endorsement_signals` RPC on demand rather than loading for every endorsement.

In `EndorsementSignals`, when expanding:
```typescript
const fetchSignallers = async () => {
  const supabase = createBrowserClient()
  const { data } = await supabase.rpc('get_endorsement_signals', {
    p_endorsement_id: endorsementId,
  })
  // data contains { agree_count, disagree_count, signallers: [...] }
  setSignallers(data?.signallers ?? [])
}
```

---

## Part 8: Validation Schemas

**File to modify:** `lib/validation/schemas.ts`

Add schemas for the new API endpoints:

```typescript
// Availability toggle
export const toggleAvailabilitySchema = z.object({
  contact_methods: z.array(
    z.enum(['phone', 'email', 'whatsapp'])
  ).optional().default([]),
})

// Endorsement signal
export const createEndorsementSignalSchema = z.object({
  endorsement_id: z.string().uuid(),
  signal: z.enum(['agree', 'disagree']),
})
```

---

## Part 9: Rate Limit Configuration

**File to modify:** `lib/rate-limit/helpers.ts`

Add a new rate limit entry for signal creation (reuses `endorsementEdit`'s limits, which is appropriate since signalling is a lightweight action):

```typescript
export const RATE_LIMITS = {
  // ... existing entries ...
  availabilityToggle: { limit: 10, window: 60 * 60, scope: 'user' as const }, // 10/1h/user
  endorsementSignal:  { limit: 30, window: 60 * 60, scope: 'user' as const }, // 30/1h/user
} as const
```

**Rationale:**
- Availability toggle: 10/hr is generous — normal use is 1-2 toggles/day. Prevents abuse.
- Endorsement signal: 30/hr allows rapid signalling across many endorsements on a profile page.

---

## Part 10: PostHog Events

### Client-Side Events

| Event | Properties | When |
|-------|-----------|------|
| `availability_toggled_on` | `{ contact_methods: string[] }` | User toggles availability ON |
| `availability_toggled_off` | `{}` | User toggles availability OFF |
| `endorsement_signal_added` | `{ endorsement_id, signal: "agree" \| "disagree", was_update: boolean }` | User adds or changes a signal |
| `endorsement_signal_removed` | `{ endorsement_id, signal: "agree" \| "disagree" }` | User removes their signal |
| `endorsement_signal_detail_viewed` | `{ endorsement_id }` | User expands signaller list |

### Server-Side Events

| Event | Properties | When |
|-------|-----------|------|
| `availability_toggled_on` | `{ contact_methods }` | POST `/api/availability` (toggle on) |
| `availability_toggled_off` | `{}` | POST `/api/availability` (toggle off) |
| `availability_expired` | `{}` | Cron expires a user's availability |
| `availability_reminder_sent` | `{}` | Cron sends day-6 reminder email |
| `endorsement_signal_added` | `{ endorsement_id, signal, was_update }` | POST `/api/endorsement-signals` |
| `endorsement_signal_removed` | `{ endorsement_id, signal }` | DELETE `/api/endorsement-signals/[id]` |

**Note:** Both client and server fire some of the same events. This is intentional — server-side events are the source of truth for funnel analysis, while client-side events enable real-time product analytics and A/B testing.

---

## Part 11: File-by-File Implementation Order

Build in this order. Each file depends only on files above it.

### Phase A: Database + Backend (no UI)

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 1 | `supabase/migrations/20260322000001_sprint14_availability_signals.sql` | Migration | None | Full SQL from Part 1 — all tables, indexes, RLS, RPCs, GRANTs |
| 2 | `lib/validation/schemas.ts` | Modify | None | Add `toggleAvailabilitySchema`, `createEndorsementSignalSchema` |
| 3 | `lib/rate-limit/helpers.ts` | Modify | None | Add `availabilityToggle`, `endorsementSignal` entries |
| 4 | `lib/email/availability-reminder.ts` | Create | `lib/email/notify.ts` | Email template from Part 5 |
| 5 | `app/api/availability/route.ts` | Create | #1, #2, #3 | POST + GET handlers from Part 2 |
| 6 | `app/api/endorsement-signals/route.ts` | Create | #1, #2, #3 | POST handler from Part 3 |
| 7 | `app/api/endorsement-signals/[id]/route.ts` | Create | #1 | DELETE handler from Part 3 |
| 8 | `app/api/cron/availability-expiry/route.ts` | Create | #1 | Cron from Part 4.1 |
| 9 | `app/api/cron/availability-reminder/route.ts` | Create | #1, #4 | Cron from Part 4.2 |
| 10 | `vercel.json` | Modify | None | Add two cron schedules from Part 4.3 |

### Phase B: UI Components

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 11 | `components/ui/AvailabilityBadge.tsx` | Create | None | Badge from Part 6.3 |
| 12 | `components/profile/AvailabilityToggle.tsx` | Create | #5, #11 | Toggle from Part 6.1 |
| 13 | `components/endorsement/SignallerDetail.tsx` | Create | None | Signaller list from Part 7.2 |
| 14 | `components/endorsement/EndorsementSignals.tsx` | Create | #6, #7, #13 | Signal buttons from Part 7.1 |

### Phase C: Page Integration

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 15 | `app/(protected)/app/profile/page.tsx` | Modify | #11, #12 | Add AvailabilityToggle, fetch new columns (Part 6.2) |
| 16 | `components/public/PublicProfileContent.tsx` | Modify | #11 | Update availability display (Part 6.4) |
| 17 | `components/public/EndorsementCard.tsx` | Modify | #14 | Add EndorsementSignals to card (Part 7.3) |
| 18 | `app/u/[handle]/page.tsx` or public profile page | Modify | #14, #17 | Fetch signal data, pass to cards (Part 7.4) |
| 19 | `app/(protected)/app/profile/page.tsx` | Modify (again) | #14, #17 | Fetch signal data for own endorsements |
| 20 | Yacht detail page + colleague explorer | Modify | #11 | Add AvailabilityBadge to crew cards (Part 6.5) |

### Phase D: Cleanup + Polish

| # | File | Type | Dependencies | Notes |
|---|------|------|-------------|-------|
| 21 | `CHANGELOG.md` | Modify | All | Document all Sprint 14 work |
| 22 | `docs/modules/profile.md` | Modify | All | Update module state with availability |
| 23 | `docs/modules/endorsements.md` | Modify | All | Update module state with signals |
| 24 | `docs/yl_schema.md` | Modify | #1 | Document new tables and columns |

---

## Part 12: Testing Checklist

### Availability Toggle

- [ ] Toggle ON: status changes to `available`, `availability_expires_at` set to ~7 days from now
- [ ] Toggle ON: `availability_events` row with `event_type = 'toggled_on'` created
- [ ] Toggle ON: green "Available" badge appears on own profile page
- [ ] Toggle ON: PostHog event `availability_toggled_on` fires (client + server)
- [ ] Toggle OFF: status changes to `not_available`, expiry cleared
- [ ] Toggle OFF: `availability_events` row with `event_type = 'toggled_off'` created
- [ ] Toggle OFF: badge disappears
- [ ] Toggle OFF: PostHog event `availability_toggled_off` fires
- [ ] Contact methods: selecting phone/email/whatsapp saves to `availability_contact_methods`
- [ ] Contact methods: disabled checkbox when user hasn't set that contact method
- [ ] Renew: toggling ON when already ON resets the 7-day window
- [ ] Badge on public profile: visible when user is available
- [ ] Badge on public profile: hidden when user is not available
- [ ] Badge on public profile: hidden when expiry has passed (client-side guard)
- [ ] Public profile: selected contact methods shown when available, regardless of normal visibility settings
- [ ] Public profile: normal contact visibility restored when not available
- [ ] Badge on yacht crew cards: visible for available crew members
- [ ] Badge on colleague explorer: visible for available colleagues
- [ ] Mobile (375px): toggle and checkboxes render correctly, no overflow

### Availability Expiry Cron

- [ ] Cron endpoint returns 401 without valid `CRON_SECRET`
- [ ] Cron finds users with `availability_status = 'available'` and `availability_expires_at < now()`
- [ ] Cron sets their status to `not_available`, clears expiry and contact methods
- [ ] Cron creates `availability_events` row with `event_type = 'expired'`
- [ ] Cron fires `availability_expired` PostHog event
- [ ] Cron returns `{ expired: N }` with correct count
- [ ] Cron returns `{ expired: 0 }` when no users need expiring

### Availability Reminder Cron

- [ ] Cron finds users expiring within 24 hours who haven't been reminded
- [ ] Cron does NOT remind users who were already reminded in the last 7 days
- [ ] Email sends with correct subject, name, expiry date, and deep link
- [ ] Deep link `${siteUrl}/app/profile#availability` loads correctly
- [ ] Cron creates `availability_events` row with `event_type = 'reminded'`
- [ ] Cron fires `availability_reminder_sent` PostHog event
- [ ] Email has both HTML and plain text versions
- [ ] Cron returns `{ reminded: N }` with correct count

### Endorsement Signals

- [ ] Eligible user (shared yacht attachment, not endorser/recipient) sees signal buttons on endorsement card
- [ ] Non-eligible user does NOT see signal buttons
- [ ] Unauthenticated viewer on public profile sees signal counts but no buttons
- [ ] Endorser/recipient of the endorsement cannot signal their own endorsement
- [ ] Tap "Agree": signal created, count increments optimistically, server confirms
- [ ] Tap "Agree" again: signal removed, count decrements optimistically
- [ ] Tap "Disagree" when already agreed: signal changes, agree decrements + disagree increments
- [ ] POST returns 403 for non-eligible users
- [ ] Unique constraint: cannot create duplicate signals
- [ ] Signal counts display: "3 agree · 1 disagree" format
- [ ] Signal counts display: hidden when 0 agree and 0 disagree
- [ ] Tap counts to expand signaller list
- [ ] Signaller list shows names, photos, roles
- [ ] Signaller names link to `/u/[handle]` — graph navigation works
- [ ] PostHog event `endorsement_signal_added` fires on signal
- [ ] PostHog event `endorsement_signal_removed` fires on removal
- [ ] PostHog event `endorsement_signal_detail_viewed` fires on expand
- [ ] Mobile (375px): signal buttons and counts fit within card width

### RLS Policies

- [ ] `endorsement_signals`: authenticated users can read all signals
- [ ] `endorsement_signals`: users can only insert signals with their own `user_id`
- [ ] `endorsement_signals`: users can only update their own signals
- [ ] `endorsement_signals`: users can only delete their own signals
- [ ] `availability_events`: users can only read their own events
- [ ] `availability_events`: users can only insert events with their own `user_id`
- [ ] Service role can insert `availability_events` (for cron jobs)

### Rate Limiting

- [ ] `POST /api/availability`: rate limited at 10/hr per user
- [ ] `POST /api/endorsement-signals`: rate limited at 30/hr per user (or using `endorsementEdit` limit)

### Cross-Browser / Device

- [ ] Availability toggle works on mobile Safari iOS
- [ ] Availability toggle works on mobile Chrome Android
- [ ] Signal buttons work on mobile Safari iOS
- [ ] Signal buttons work on mobile Chrome Android
- [ ] All new UI fits at 375px without overflow or clipping

---

## Part 13: Rollback Plan

### If Migration Fails

The migration is additive only (new columns, new tables, new functions). It does not modify existing data. Rollback:

```sql
-- Reverse Sprint 14 migration (run manually if needed)

-- Drop functions first (depend on tables)
DROP FUNCTION IF EXISTS public.toggle_availability(uuid, jsonb);
DROP FUNCTION IF EXISTS public.get_endorsement_signal_counts(uuid[]);
DROP FUNCTION IF EXISTS public.get_endorsement_signals(uuid);
DROP FUNCTION IF EXISTS public.get_signalable_endorsements(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.can_signal_endorsement(uuid, uuid);

-- Drop tables
DROP TABLE IF EXISTS public.endorsement_signals;
DROP TABLE IF EXISTS public.availability_events;

-- Remove columns from users
ALTER TABLE public.users DROP COLUMN IF EXISTS availability_contact_methods;
ALTER TABLE public.users DROP COLUMN IF EXISTS availability_expires_at;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS valid_availability_status;
ALTER TABLE public.users DROP COLUMN IF EXISTS availability_status;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_availability_expiry;
DROP INDEX IF EXISTS idx_users_available;
```

### If Availability Feature Breaks

1. Disable cron jobs: remove the two new entries from `vercel.json` and redeploy
2. The toggle UI is contained in `AvailabilityToggle.tsx` — can be hidden by not rendering it on the profile page
3. Availability badges degrade gracefully: if `availability_status` column doesn't exist, the badge component renders nothing

### If Endorsement Signals Feature Breaks

1. The `EndorsementSignals` component is additive to `EndorsementCard` — remove the component render to revert cards to their previous state
2. Signal API routes are independent — deleting the route files has no side effects
3. Signal data in the database can be preserved without being displayed

### If Both Features Break Simultaneously

Roll back the Vercel deployment: `vercel rollback`

This reverts to the pre-Sprint-14 deployment. Database columns/tables will still exist but will be unused. The application code from the previous deployment does not reference them.

**Data safety:** No existing data is modified by Sprint 14. The migration only adds new columns (with defaults) and new tables. Rolling back code does not require rolling back the migration.

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S14-01 | Separate `availability_status` column instead of reusing `available_for_work` boolean | The new system needs richer state (expiry, contact methods, event logging). Keeping the old boolean in sync prevents breaking existing code that references it. |
| D-S14-02 | Toggle RPC is atomic (updates user + inserts event in one function) | Prevents inconsistent state between user status and event log. A failed event insert doesn't orphan a status change. |
| D-S14-03 | Batch RPCs for signal eligibility and counts | Profile pages show N endorsements — individual checks would be N queries. Batch RPCs reduce to 2 queries total. |
| D-S14-04 | Endorser and recipient excluded from signalling their own endorsement | Endorser signalling "agree" on their own endorsement is meaningless. Recipient signalling is a conflict of interest. Both are excluded in the eligibility check. |
| D-S14-05 | Signal delete policy (toggle-off removes the row, not soft-delete) | Signals are lightweight social proof, not evidence. Hard delete is simpler and avoids accumulating soft-deleted rows. |
| D-S14-06 | Cron expiry runs before reminder cron | If both ran simultaneously, the reminder cron might send emails to users who are about to be expired. Sequencing prevents this. |
| D-S14-07 | Reminder checks for recent `reminded` event to prevent duplicates | Without this, a user could receive multiple reminder emails if the cron runs more than once in the 24-hour window. |
| D-S14-08 | Contact method changes while available reset the 7-day window | Any interaction with the availability toggle signals active engagement — resetting the window rewards this. |
| D-S14-09 | Signaller detail is fetched lazily, not eagerly | Most users view endorsement cards without expanding signaller lists. Eager loading would add unnecessary queries to every profile page load. |
| D-S14-10 | Client-side expiry guard on AvailabilityBadge | Between cron runs (up to 24 hours), a user's availability may have logically expired but not been cleaned up. The client-side check prevents showing stale badges. |
