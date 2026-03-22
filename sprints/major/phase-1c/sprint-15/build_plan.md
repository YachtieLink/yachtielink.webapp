# Sprint 15 — Crew Search (Pro) + Expanded Analytics: Build Plan

## Context

Sprint 15 turns the yacht graph into a discovery tool. Pro users can search crew by role, department, location, availability, cert type, and yacht. Free users see the search UI but results are gated behind a Pro paywall. The expanded analytics tab gives Pro users insight into profile views, PDF downloads, endorsement activity, anonymised viewer breakdowns, and availability history. Endorsement pinning lets Pro users control which endorsements appear first. Notification preferences give crew control over email frequency.

### What Already Exists (No Build Needed)

| Feature | Status | Notes |
|---------|--------|-------|
| `users` table with role, department, location fields | Exists | Sprint 2-3 |
| `attachments` table with yacht references | Exists | Sprint 2-4 |
| `endorsements` table with yacht context | Exists | Sprint 5 |
| `certifications` table with type refs | Exists | Sprint 3 |
| `certification_types` reference table | Exists | Sprint 3 |
| `profile_analytics` table | Exists | Sprint 7 |
| `get_sea_time()` / `get_sea_time_detailed()` RPCs | Exists | Sprint 12 |
| `get_colleagues()` RPC | Exists | Sprint 4/12 |
| `search_yachts()` RPC (trigram fuzzy) | Exists | Sprint 4 |
| `get_analytics_summary()` / `get_analytics_timeseries()` RPCs | Exists | Sprint 7 |
| `record_profile_event()` RPC | Exists | Sprint 7 |
| PostHog integration (`PostHogProvider.tsx`) | Exists | Sprint 8 |
| Stripe Pro gate (`lib/stripe/pro.ts`, `getProStatus()`) | Exists | Sprint 7 |
| Insights page (`/app/insights`) with charts + teaser cards | Exists | Sprint 7 |
| `AnalyticsChart` component (bar chart) | Exists | Sprint 7 |
| `UpgradeCTA` component (fixed bottom upgrade bar) | Exists | Sprint 7 |
| Rate limit `search` config (60/min/user) | Exists | Sprint 8 |
| Bottom tab bar + sidebar nav | Exists | Sprint 11 |
| Section color system | Exists | Sprint 11 |

### What Sprint 14 Adds (Prerequisites — Must Be Complete)

| Feature | Notes |
|---------|-------|
| `availability_status` column on `users` | `'available'` / `'not_available'` |
| `availability_expires_at` column on `users` | timestamptz, null when not available |
| `availability_contact_methods` jsonb on `users` | Which methods visible when available |
| `availability_events` table | `user_id`, `event_type`, `created_at` |
| `endorsement_signals` table | `endorsement_id`, `user_id`, `signal` |
| Availability toggle UI on profile | Green badge, 7-day expiry |
| Availability expiry cron | Daily check + day-6 reminder |
| Index `users(availability_status, availability_expires_at)` | For cron queries |

### What This Sprint Adds

1. **Crew search page** — `/app/search` with multi-filter UI, paginated results, Pro gate
2. **`search_crew()` RPC** — server-side filtered search with pagination
3. **`get_available_in_network()` RPC** — 1st/2nd degree available crew
4. **Expanded analytics** — viewer breakdown, endorsement timeline, availability history, profile completeness
5. **Endorsement pinning** — `endorsement_display_order` column, drag-to-reorder UI
6. **Notification preferences** — `notification_preferences` column, settings page
7. **Navigation update** — add Search to nav bar

### Dependencies

- Sprint 14 complete (availability toggle, endorsement signals, `availability_events` table)
- All existing tables and RPCs listed above

### Codebase Patterns to Follow

- Server components fetch data via `createClient()` from `@/lib/supabase/server` — no API routes for reads
- Independent queries wrapped in `Promise.all()` for performance
- RPCs use `security definer` — all existing RPCs use this pattern
- `GRANT EXECUTE ON FUNCTION ... TO authenticated` on every new RPC
- Pro gate via `getProStatus()` from `lib/stripe/pro.ts` (server-side)
- PostHog events via dynamic import of `posthog-js` and `posthog.default.capture()`
- Validation via `zod` schemas + `validateBody()` helper
- Rate limiting via `applyRateLimit()` from `lib/rate-limit/helpers.ts`
- Error handling via `handleApiError()` from `lib/api/errors.ts`
- All colour references use semantic CSS custom properties from `globals.css`
- Mobile-first: 375px base, `md:` breakpoints for tablet/desktop
- Page wrappers use `PageTransition` component
- Section colours per `lib/section-colors.ts` — each tab gets a unique colour

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/YYYYMMDD000001_sprint15_search_analytics.sql`

Use the next sequential timestamp after the latest migration (`20260321000001`). Suggested: `20260323000001_sprint15_search_analytics.sql`.

### 1.1 — New Columns on `users`

```sql
-- Sprint 15: Crew Search (Pro) + Expanded Analytics
-- Migration: sprint15_search_analytics

-- ═══════════════════════════════════════════════════════════
-- 1. NEW COLUMNS ON USERS TABLE
-- ═══════════════════════════════════════════════════════════

-- Endorsement display order (Pro feature — drag-to-reorder)
-- Array of endorsement UUIDs in preferred display order.
-- Non-pinned endorsements fall back to reverse chronological.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS endorsement_display_order jsonb DEFAULT '[]'::jsonb;

-- Notification preferences (all users)
-- Keys: endorsement_received, endorsement_request_received,
--        availability_expiry_reminder, weekly_analytics_digest, cert_expiry_reminder
-- Values: boolean (true = send, false = suppress)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{}'::jsonb;
```

### 1.2 — Indexes for Search

```sql
-- ═══════════════════════════════════════════════════════════
-- 2. INDEXES FOR CREW SEARCH
-- ═══════════════════════════════════════════════════════════

-- Composite index for common search filter combinations
-- availability_status first (filter "available now"), then department, then location
CREATE INDEX IF NOT EXISTS idx_users_search_composite
  ON public.users (availability_status, location_country)
  WHERE onboarding_complete = true;

-- Department array index (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_users_departments_gin
  ON public.users USING gin (departments);

-- Certification user+type index for cert-filtered search
CREATE INDEX IF NOT EXISTS idx_certifications_user_type
  ON public.certifications (user_id, certification_type_id);

-- Attachments yacht+user for yacht-filtered search
-- Check if index already exists from Sprint 4
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attachments_yacht_user') THEN
    CREATE INDEX idx_attachments_yacht_user ON public.attachments (yacht_id, user_id) WHERE deleted_at IS NULL;
  END IF;
END
$$;

-- Primary role trigram index for role typeahead search
CREATE INDEX IF NOT EXISTS idx_users_primary_role_trgm
  ON public.users USING gin (primary_role gin_trgm_ops);
```

### 1.3 — `search_crew()` RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 3. CREW SEARCH RPC
-- ═══════════════════════════════════════════════════════════

-- Searches the crew database with multi-filter support and pagination.
-- Filters: department (text), role (text, ILIKE), location_country (text),
--          location_city (text, ILIKE), availability_only (bool),
--          cert_type_id (uuid), yacht_id (uuid)
-- Sort: available first, then endorsement count DESC, then total sea time DESC.
-- Returns profile summary fields + total_count for pagination.

CREATE OR REPLACE FUNCTION public.search_crew(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department text;
  v_role text;
  v_location_country text;
  v_location_city text;
  v_availability_only boolean;
  v_cert_type_id uuid;
  v_yacht_id uuid;
  v_offset int;
  v_total_count int;
  v_results jsonb;
BEGIN
  -- Extract filters
  v_department := p_filters->>'department';
  v_role := p_filters->>'role';
  v_location_country := p_filters->>'location_country';
  v_location_city := p_filters->>'location_city';
  v_availability_only := COALESCE((p_filters->>'availability_only')::boolean, false);
  v_cert_type_id := (p_filters->>'cert_type_id')::uuid;
  v_yacht_id := (p_filters->>'yacht_id')::uuid;

  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;

  -- Count total matching results
  SELECT count(DISTINCT u.id)::int INTO v_total_count
  FROM public.users u
  WHERE u.onboarding_complete = true
    AND (v_department IS NULL OR u.departments @> ARRAY[v_department])
    AND (v_role IS NULL OR u.primary_role ILIKE '%' || v_role || '%')
    AND (v_location_country IS NULL OR u.location_country = v_location_country)
    AND (v_location_city IS NULL OR u.location_city ILIKE '%' || v_location_city || '%')
    AND (NOT v_availability_only OR u.availability_status = 'available')
    AND (v_cert_type_id IS NULL OR EXISTS (
      SELECT 1 FROM public.certifications c
      WHERE c.user_id = u.id AND c.certification_type_id = v_cert_type_id
    ))
    AND (v_yacht_id IS NULL OR EXISTS (
      SELECT 1 FROM public.attachments a
      WHERE a.user_id = u.id AND a.yacht_id = v_yacht_id AND a.deleted_at IS NULL
    ));

  -- Fetch paginated results with computed fields
  SELECT jsonb_agg(row_to_json(t)) INTO v_results
  FROM (
    SELECT
      u.id,
      u.display_name,
      u.full_name,
      u.handle,
      u.profile_photo_url,
      u.primary_role,
      u.departments,
      u.location_country,
      u.location_city,
      u.availability_status,
      -- Sea time (total days)
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
      -- Endorsement count
      (
        SELECT count(*)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorsement_count,
      -- Endorser count (distinct people who endorsed)
      (
        SELECT count(DISTINCT e.endorser_id)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorser_count,
      -- Endorsement yacht count (distinct yachts endorsements came from)
      (
        SELECT count(DISTINCT e.yacht_id)::int
        FROM public.endorsements e
        WHERE e.recipient_id = u.id AND e.deleted_at IS NULL
      ) AS endorsement_yacht_count
    FROM public.users u
    WHERE u.onboarding_complete = true
      AND (v_department IS NULL OR u.departments @> ARRAY[v_department])
      AND (v_role IS NULL OR u.primary_role ILIKE '%' || v_role || '%')
      AND (v_location_country IS NULL OR u.location_country = v_location_country)
      AND (v_location_city IS NULL OR u.location_city ILIKE '%' || v_location_city || '%')
      AND (NOT v_availability_only OR u.availability_status = 'available')
      AND (v_cert_type_id IS NULL OR EXISTS (
        SELECT 1 FROM public.certifications c
        WHERE c.user_id = u.id AND c.certification_type_id = v_cert_type_id
      ))
      AND (v_yacht_id IS NULL OR EXISTS (
        SELECT 1 FROM public.attachments a
        WHERE a.user_id = u.id AND a.yacht_id = v_yacht_id AND a.deleted_at IS NULL
      ))
    ORDER BY
      (CASE WHEN u.availability_status = 'available' THEN 0 ELSE 1 END),
      (SELECT count(*) FROM public.endorsements e WHERE e.recipient_id = u.id AND e.deleted_at IS NULL) DESC,
      (SELECT COALESCE(sum(COALESCE(a.ended_at, current_date) - a.started_at), 0) FROM public.attachments a WHERE a.user_id = u.id AND a.deleted_at IS NULL) DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) t;

  RETURN jsonb_build_object(
    'results', COALESCE(v_results, '[]'::jsonb),
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_crew(jsonb, int, int) TO authenticated;
```

### 1.4 — `get_available_in_network()` RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 4. NETWORK AVAILABILITY (1st + 2nd degree)
-- ═══════════════════════════════════════════════════════════

-- Returns available crew within the user's network.
-- Degree 1: direct colleagues (shared yacht) who are available.
-- Degree 2: colleagues-of-colleagues who are available (Pro only).
-- Includes mutual colleague attribution for 2nd-degree results.

CREATE OR REPLACE FUNCTION public.get_available_in_network(
  p_user_id uuid,
  p_degree int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH first_degree AS (
    -- Direct colleagues who are currently available
    SELECT DISTINCT
      a2.user_id AS colleague_id,
      1 AS degree,
      NULL::uuid AS via_colleague_id
    FROM public.attachments a1
    JOIN public.attachments a2
      ON a1.yacht_id = a2.yacht_id
      AND a2.user_id != p_user_id
    JOIN public.users u ON u.id = a2.user_id
    WHERE a1.user_id = p_user_id
      AND a1.deleted_at IS NULL
      AND a2.deleted_at IS NULL
      AND u.availability_status = 'available'
      AND (u.availability_expires_at IS NULL OR u.availability_expires_at > now())
  ),
  second_degree AS (
    -- Colleagues-of-colleagues who are available (only if p_degree >= 2)
    SELECT DISTINCT ON (a3.user_id)
      a3.user_id AS colleague_id,
      2 AS degree,
      fd_base.user_id AS via_colleague_id
    FROM public.attachments a_me
    JOIN public.attachments fd_base
      ON a_me.yacht_id = fd_base.yacht_id
      AND fd_base.user_id != p_user_id
    JOIN public.attachments a2
      ON fd_base.user_id = a2.user_id
    JOIN public.attachments a3
      ON a2.yacht_id = a3.yacht_id
      AND a3.user_id != p_user_id
      AND a3.user_id != fd_base.user_id
    JOIN public.users u ON u.id = a3.user_id
    WHERE p_degree >= 2
      AND a_me.user_id = p_user_id
      AND a_me.deleted_at IS NULL
      AND fd_base.deleted_at IS NULL
      AND a2.deleted_at IS NULL
      AND a3.deleted_at IS NULL
      AND u.availability_status = 'available'
      AND (u.availability_expires_at IS NULL OR u.availability_expires_at > now())
      -- Exclude anyone already in 1st degree
      AND a3.user_id NOT IN (
        SELECT fd.colleague_id FROM first_degree fd
      )
  ),
  combined AS (
    SELECT * FROM first_degree
    UNION ALL
    SELECT * FROM second_degree
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', c.colleague_id,
      'display_name', u.display_name,
      'full_name', u.full_name,
      'handle', u.handle,
      'profile_photo_url', u.profile_photo_url,
      'primary_role', u.primary_role,
      'departments', u.departments,
      'location_country', u.location_country,
      'degree', c.degree,
      'via_colleague_id', c.via_colleague_id,
      'via_colleague_name', CASE
        WHEN c.via_colleague_id IS NOT NULL THEN (
          SELECT COALESCE(vu.display_name, vu.full_name)
          FROM public.users vu WHERE vu.id = c.via_colleague_id
        )
        ELSE NULL
      END
    )
  ) INTO v_result
  FROM combined c
  JOIN public.users u ON u.id = c.colleague_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_in_network(uuid, int) TO authenticated;
```

### 1.5 — Viewer Breakdown RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 5. ANONYMISED VIEWER BREAKDOWN
-- ═══════════════════════════════════════════════════════════

-- Returns anonymised aggregate breakdown of who viewed the profile.
-- Groups by viewer_role and viewer_location. Never exposes individual identity.

CREATE OR REPLACE FUNCTION public.get_viewer_breakdown(
  p_user_id uuid,
  p_days int DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'by_role', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('role', role_group, 'count', cnt))
      FROM (
        SELECT
          COALESCE(viewer_role, 'Unknown') AS role_group,
          count(*)::int AS cnt
        FROM public.profile_analytics
        WHERE user_id = p_user_id
          AND event_type = 'profile_view'
          AND occurred_at >= now() - (p_days || ' days')::interval
        GROUP BY COALESCE(viewer_role, 'Unknown')
        ORDER BY cnt DESC
      ) sub
    ), '[]'::jsonb),
    'by_location', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('location', loc_group, 'count', cnt))
      FROM (
        SELECT
          COALESCE(viewer_location, 'Unknown') AS loc_group,
          count(*)::int AS cnt
        FROM public.profile_analytics
        WHERE user_id = p_user_id
          AND event_type = 'profile_view'
          AND occurred_at >= now() - (p_days || ' days')::interval
        GROUP BY COALESCE(viewer_location, 'Unknown')
        ORDER BY cnt DESC
        LIMIT 10
      ) sub
    ), '[]'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_viewer_breakdown(uuid, int) TO authenticated;
```

### 1.6 — Endorsement Timeline RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 6. ENDORSEMENT ACTIVITY TIMELINE
-- ═══════════════════════════════════════════════════════════

-- Returns the user's endorsement activity: endorsements received with
-- endorser name, role, yacht context, and date.

CREATE OR REPLACE FUNCTION public.get_endorsement_timeline(
  p_user_id uuid,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  endorsement_id uuid,
  endorser_name text,
  endorser_handle text,
  endorser_photo_url text,
  endorser_role text,
  yacht_name text,
  yacht_id uuid,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id AS endorsement_id,
    COALESCE(u.display_name, u.full_name) AS endorser_name,
    u.handle AS endorser_handle,
    u.profile_photo_url AS endorser_photo_url,
    e.endorser_role_label AS endorser_role,
    y.name AS yacht_name,
    e.yacht_id,
    e.created_at
  FROM public.endorsements e
  JOIN public.users u ON u.id = e.endorser_id
  JOIN public.yachts y ON y.id = e.yacht_id
  WHERE e.recipient_id = p_user_id
    AND e.deleted_at IS NULL
  ORDER BY e.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_endorsement_timeline(uuid, int, int) TO authenticated;
```

### 1.7 — Availability History RPC

```sql
-- ═══════════════════════════════════════════════════════════
-- 7. AVAILABILITY HISTORY
-- ═══════════════════════════════════════════════════════════

-- Returns toggle history from availability_events table (Sprint 14).
-- Used for the availability history chart on the Insights page.

CREATE OR REPLACE FUNCTION public.get_availability_history(
  p_user_id uuid,
  p_days int DEFAULT 90
)
RETURNS TABLE (
  event_type text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ae.event_type,
    ae.created_at
  FROM public.availability_events ae
  WHERE ae.user_id = p_user_id
    AND ae.created_at >= now() - (p_days || ' days')::interval
  ORDER BY ae.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_availability_history(uuid, int) TO authenticated;
```

### 1.8 — Profile Completeness Helper

```sql
-- ═══════════════════════════════════════════════════════════
-- 8. PROFILE COMPLETENESS SCORE
-- ═══════════════════════════════════════════════════════════

-- Returns a percentage (0-100) based on filled fields:
-- photo (20%), bio (20%), 1+ yacht (20%), 1+ cert (20%), 1+ endorsement (20%)

CREATE OR REPLACE FUNCTION public.get_profile_completeness(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'score', (
      (CASE WHEN u.profile_photo_url IS NOT NULL THEN 20 ELSE 0 END) +
      (CASE WHEN u.bio IS NOT NULL AND char_length(u.bio) > 0 THEN 20 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM public.attachments a WHERE a.user_id = p_user_id AND a.deleted_at IS NULL) THEN 20 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM public.certifications c WHERE c.user_id = p_user_id) THEN 20 ELSE 0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM public.endorsements e WHERE e.recipient_id = p_user_id AND e.deleted_at IS NULL) THEN 20 ELSE 0 END)
    ),
    'has_photo', u.profile_photo_url IS NOT NULL,
    'has_bio', u.bio IS NOT NULL AND char_length(u.bio) > 0,
    'has_yacht', EXISTS (SELECT 1 FROM public.attachments a WHERE a.user_id = p_user_id AND a.deleted_at IS NULL),
    'has_cert', EXISTS (SELECT 1 FROM public.certifications c WHERE c.user_id = p_user_id),
    'has_endorsement', EXISTS (SELECT 1 FROM public.endorsements e WHERE e.recipient_id = p_user_id AND e.deleted_at IS NULL)
  )
  FROM public.users u
  WHERE u.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_completeness(uuid) TO authenticated;
```

---

## Part 2: Navigation Update

The search page needs to be accessible from the main navigation. Since the bottom tab bar already has 5 tabs (Profile, CV, Insights, Network, More), the search entry point should be:

1. **A sub-section of the Network tab** — add a "Search" tab within the network area
2. **OR** replace the Network tab label/icon to encompass both search and network

**Recommended approach:** Add a link to `/app/search` on the Network page (as a prominent button/card at the top) and in the More page settings. Do NOT add a 6th tab — 5 tabs is the mobile UX maximum. The search page lives under the network section conceptually.

### 2.1 — Network Page Search Entry Point

**File to modify:** `app/(protected)/app/network/page.tsx`

Add a search card at the top of the network page:

```typescript
// At top of network page, above the colleague explorer
<Link
  href="/app/search"
  className="card-soft rounded-2xl p-4 flex items-center justify-between mb-4"
>
  <div className="flex items-center gap-3">
    <Search size={20} className="text-[var(--color-navy-500)]" />
    <div>
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Search Crew</p>
      <p className="text-xs text-[var(--color-text-secondary)]">Find crew by role, yacht, location</p>
    </div>
  </div>
  <span className="text-[var(--color-text-secondary)] text-lg">›</span>
</Link>
```

### 2.2 — Section Color for Search

**File to modify:** `lib/section-colors.ts`

Add search section color:

```typescript
// Add to sectionColors
search: "navy",  // Same family as network — search is a network feature
```

### 2.3 — More Page Link

**File to modify:** `app/(protected)/app/more/page.tsx`

Add a SettingsRow in the Help section:

```typescript
<SettingsRow
  label="Crew Search"
  href="/app/search"
  sublabel="Find crew by role, yacht, location, availability"
/>
```

---

## Part 3: Search Page — `/app/search`

### 3.1 — Page Route

**File to create:** `app/(protected)/app/search/page.tsx`

Server component. Fetches initial data and renders the search interface.

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProStatus } from '@/lib/stripe/pro';
import { SearchPageClient } from '@/components/search/SearchPageClient';
import { PageTransition } from '@/components/ui/PageTransition';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/welcome');

  const proStatus = await getProStatus(user.id);

  // Fetch reference data for filter dropdowns
  const [{ data: departments }, { data: certTypes }] = await Promise.all([
    supabase.from('departments').select('id, name').order('sort_order'),
    supabase.from('certification_types').select('id, name, category').order('name'),
  ]);

  // If Pro, fetch network availability
  let networkAvailable = null;
  if (proStatus.isPro) {
    const { data } = await supabase.rpc('get_available_in_network', {
      p_user_id: user.id,
      p_degree: 2,
    });
    networkAvailable = data;
  }

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-navy-50)]">
      <SearchPageClient
        isPro={proStatus.isPro}
        userId={user.id}
        departments={departments ?? []}
        certTypes={certTypes ?? []}
        networkAvailable={networkAvailable}
        initialFilters={sp}
      />
    </PageTransition>
  );
}
```

### 3.2 — Loading State

**File to create:** `app/(protected)/app/search/loading.tsx`

```typescript
import { PageTransition } from '@/components/ui/PageTransition';

export default function SearchLoading() {
  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-navy-50)]">
      <div className="h-8 w-48 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
      <div className="h-12 rounded-xl bg-[var(--color-surface-raised)] animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 flex-1 rounded-xl bg-[var(--color-surface-raised)] animate-pulse" />
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-raised)] animate-pulse" />
      ))}
    </PageTransition>
  );
}
```

### 3.3 — Search Client Component

**File to create:** `components/search/SearchPageClient.tsx`

Client component that manages search state, filters, and results rendering.

```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { SearchFilters } from './SearchFilters';
import { SearchResultCard } from './SearchResultCard';
import { SearchProGate } from './SearchProGate';
import { NetworkAvailableSection } from './NetworkAvailableSection';

interface SearchFiltersState {
  department: string | null;
  role: string | null;
  location_country: string | null;
  location_city: string | null;
  availability_only: boolean;
  cert_type_id: string | null;
  yacht_id: string | null;
}

interface SearchResult {
  id: string;
  display_name: string | null;
  full_name: string;
  handle: string | null;
  profile_photo_url: string | null;
  primary_role: string | null;
  departments: string[] | null;
  location_country: string | null;
  location_city: string | null;
  availability_status: string | null;
  total_sea_time_days: number;
  yacht_count: number;
  endorsement_count: number;
  endorser_count: number;
  endorsement_yacht_count: number;
}

interface NetworkResult {
  user_id: string;
  display_name: string | null;
  full_name: string;
  handle: string | null;
  profile_photo_url: string | null;
  primary_role: string | null;
  departments: string[] | null;
  location_country: string | null;
  degree: number;
  via_colleague_id: string | null;
  via_colleague_name: string | null;
}

interface Props {
  isPro: boolean;
  userId: string;
  departments: { id: string; name: string }[];
  certTypes: { id: string; name: string; category: string }[];
  networkAvailable: NetworkResult[] | null;
  initialFilters: Record<string, string | undefined>;
}

export function SearchPageClient({
  isPro,
  userId,
  departments,
  certTypes,
  networkAvailable,
  initialFilters,
}: Props) {
  const supabase = createClient();
  const [filters, setFilters] = useState<SearchFiltersState>({
    department: initialFilters.department ?? null,
    role: initialFilters.role ?? null,
    location_country: initialFilters.location_country ?? null,
    location_city: initialFilters.location_city ?? null,
    availability_only: initialFilters.availability_only === 'true',
    cert_type_id: initialFilters.cert_type_id ?? null,
    yacht_id: initialFilters.yacht_id ?? null,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const executeSearch = useCallback(async (searchFilters: SearchFiltersState, searchPage: number) => {
    setLoading(true);
    setHasSearched(true);

    // Build filter object (strip nulls)
    const filterObj: Record<string, unknown> = {};
    if (searchFilters.department) filterObj.department = searchFilters.department;
    if (searchFilters.role) filterObj.role = searchFilters.role;
    if (searchFilters.location_country) filterObj.location_country = searchFilters.location_country;
    if (searchFilters.location_city) filterObj.location_city = searchFilters.location_city;
    if (searchFilters.availability_only) filterObj.availability_only = true;
    if (searchFilters.cert_type_id) filterObj.cert_type_id = searchFilters.cert_type_id;
    if (searchFilters.yacht_id) filterObj.yacht_id = searchFilters.yacht_id;

    const { data, error } = await supabase.rpc('search_crew', {
      p_filters: filterObj,
      p_page: searchPage,
      p_page_size: 20,
    });

    if (!error && data) {
      setResults(data.results ?? []);
      setTotalCount(data.total_count ?? 0);
      setPage(searchPage);
    }

    setLoading(false);

    // PostHog event
    import('posthog-js').then((posthog) => {
      posthog.default.capture('crew_search_executed', {
        filters: filterObj,
        result_count: data?.total_count ?? 0,
        page: searchPage,
      });
    });
  }, [supabase]);

  function handleSearch() {
    executeSearch(filters, 1);
  }

  function handlePageChange(newPage: number) {
    executeSearch(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClearFilters() {
    const cleared: SearchFiltersState = {
      department: null,
      role: null,
      location_country: null,
      location_city: null,
      availability_only: false,
      cert_type_id: null,
      yacht_id: null,
    };
    setFilters(cleared);
    setResults([]);
    setTotalCount(0);
    setHasSearched(false);
  }

  const activeFilterCount = [
    filters.department,
    filters.role,
    filters.location_country,
    filters.location_city,
    filters.availability_only || null,
    filters.cert_type_id,
    filters.yacht_id,
  ].filter(Boolean).length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">
          Crew Search
        </h1>
        {isPro && (
          <span className="text-xs font-semibold bg-[var(--color-sand-100)] text-[var(--color-sand-400)] px-2.5 py-1 rounded-full">
            Pro ✓
          </span>
        )}
      </div>

      {/* Filter toggle + search button */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] transition-colors"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-[var(--color-navy-500)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSearch}
          loading={loading}
          className="flex-1 bg-[var(--color-navy-500)] hover:bg-[var(--color-navy-700)]"
        >
          <Search size={16} className="mr-1.5" />
          Search
        </Button>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Expandable filter panel */}
      {filtersExpanded && (
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          departments={departments}
          certTypes={certTypes}
          onSearch={handleSearch}
        />
      )}

      {/* Network availability section (Pro only) */}
      {isPro && networkAvailable && networkAvailable.length > 0 && !hasSearched && (
        <NetworkAvailableSection results={networkAvailable} />
      )}

      {/* Results */}
      {hasSearched && (
        <>
          {/* Result count */}
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {totalCount} crew match{totalCount !== 1 ? '' : 'es'} your search
              {filters.availability_only && totalCount > 0 && (
                <span className="text-[var(--color-teal-700)]"> · {totalCount} available now</span>
              )}
            </p>
          </div>

          {/* Result cards */}
          {results.length > 0 ? (
            <div className="flex flex-col gap-3">
              {results.map((result, index) => (
                isPro ? (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    position={index + 1 + (page - 1) * 20}
                  />
                ) : (
                  <SearchProGate key={result.id} index={index} />
                )
              ))}
            </div>
          ) : (
            <div className="card-soft rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                No crew match your filters
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Try broadening your search — remove a filter or check different departments.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalCount > 20 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-[var(--color-text-secondary)]">
                Page {page} of {Math.ceil(totalCount / 20)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(totalCount / 20)}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Free user upgrade CTA (shown below search when not Pro) */}
      {!isPro && hasSearched && results.length > 0 && (
        <div className="card-soft rounded-2xl p-5 text-center bg-gradient-to-b from-[var(--color-navy-50)] to-[var(--color-surface)]">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
            Unlock full search results
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-3">
            Upgrade to Crew Pro to see names, contact details, and full profiles.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.href = '/app/insights'}
            className="bg-[var(--color-teal-700)] hover:bg-[var(--color-teal-800)]"
          >
            Upgrade to Pro
          </Button>
        </div>
      )}
    </>
  );
}
```

### 3.4 — Search Filters Component

**File to create:** `components/search/SearchFilters.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SearchFiltersState {
  department: string | null;
  role: string | null;
  location_country: string | null;
  location_city: string | null;
  availability_only: boolean;
  cert_type_id: string | null;
  yacht_id: string | null;
}

interface Props {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  departments: { id: string; name: string }[];
  certTypes: { id: string; name: string; category: string }[];
  onSearch: () => void;
}

export function SearchFilters({ filters, onChange, departments, certTypes, onSearch }: Props) {
  const supabase = createClient();
  const [yachtQuery, setYachtQuery] = useState('');
  const [yachtResults, setYachtResults] = useState<{ id: string; name: string }[]>([]);
  const [selectedYachtName, setSelectedYachtName] = useState<string | null>(null);
  const [roleQuery, setRoleQuery] = useState(filters.role ?? '');

  // Yacht typeahead search
  useEffect(() => {
    if (yachtQuery.length < 2) {
      setYachtResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('search_yachts', {
        p_query: yachtQuery,
        p_limit: 5,
      });
      setYachtResults(data ?? []);
    }, 300);
    return () => clearTimeout(timer);
  }, [yachtQuery, supabase]);

  function update(partial: Partial<SearchFiltersState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="card-soft rounded-2xl p-4 flex flex-col gap-3">
      {/* Department multi-select */}
      <div>
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
          Department
        </label>
        <select
          value={filters.department ?? ''}
          onChange={(e) => update({ department: e.target.value || null })}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Role typeahead */}
      <div>
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
          Role
        </label>
        <input
          type="text"
          value={roleQuery}
          onChange={(e) => {
            setRoleQuery(e.target.value);
            update({ role: e.target.value || null });
          }}
          placeholder="e.g. Chief Stewardess, Captain"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
            Country
          </label>
          <input
            type="text"
            value={filters.location_country ?? ''}
            onChange={(e) => update({ location_country: e.target.value || null })}
            placeholder="e.g. France"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
            City
          </label>
          <input
            type="text"
            value={filters.location_city ?? ''}
            onChange={(e) => update({ location_city: e.target.value || null })}
            placeholder="e.g. Antibes"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>
      </div>

      {/* Availability toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
          Available now only
        </label>
        <button
          onClick={() => update({ availability_only: !filters.availability_only })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            filters.availability_only
              ? 'bg-[var(--color-teal-700)]'
              : 'bg-[var(--color-surface-raised)]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              filters.availability_only ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* Certification type */}
      <div>
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
          Certification
        </label>
        <select
          value={filters.cert_type_id ?? ''}
          onChange={(e) => update({ cert_type_id: e.target.value || null })}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)]"
        >
          <option value="">Any certification</option>
          {certTypes.map((ct) => (
            <option key={ct.id} value={ct.id}>{ct.name}</option>
          ))}
        </select>
      </div>

      {/* Yacht name typeahead */}
      <div className="relative">
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
          Yacht
        </label>
        {selectedYachtName ? (
          <div className="flex items-center gap-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
            <span className="text-sm text-[var(--color-text-primary)] flex-1">{selectedYachtName}</span>
            <button
              onClick={() => {
                setSelectedYachtName(null);
                setYachtQuery('');
                update({ yacht_id: null });
              }}
              className="text-[var(--color-text-secondary)]"
            >
              ×
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={yachtQuery}
              onChange={(e) => setYachtQuery(e.target.value)}
              placeholder="Search yacht name"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
            {yachtResults.length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden">
                {yachtResults.map((yacht) => (
                  <li key={yacht.id}>
                    <button
                      onClick={() => {
                        update({ yacht_id: yacht.id });
                        setSelectedYachtName(yacht.name);
                        setYachtQuery('');
                        setYachtResults([]);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                      {yacht.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

### 3.5 — Search Result Card

**File to create:** `components/search/SearchResultCard.tsx`

```typescript
'use client';

import Link from 'next/link';
import { MapPin, Anchor, Award } from 'lucide-react';

interface SearchResult {
  id: string;
  display_name: string | null;
  full_name: string;
  handle: string | null;
  profile_photo_url: string | null;
  primary_role: string | null;
  departments: string[] | null;
  location_country: string | null;
  location_city: string | null;
  availability_status: string | null;
  total_sea_time_days: number;
  yacht_count: number;
  endorsement_count: number;
  endorser_count: number;
  endorsement_yacht_count: number;
}

interface Props {
  result: SearchResult;
  position: number;
}

export function SearchResultCard({ result, position }: Props) {
  const name = result.display_name || result.full_name;
  const seaTimeYears = (result.total_sea_time_days / 365.25).toFixed(1);
  const seaTimeLabel = result.total_sea_time_days >= 365
    ? `${seaTimeYears}y sea time`
    : `${result.total_sea_time_days}d sea time`;
  const isAvailable = result.availability_status === 'available';
  const profileUrl = result.handle ? `/u/${result.handle}` : `/app/profile/${result.id}`;

  function handleTap() {
    import('posthog-js').then((posthog) => {
      posthog.default.capture('crew_search_result_tapped', {
        result_user_id: result.id,
        result_position: position,
      });
    });
  }

  return (
    <Link
      href={profileUrl}
      onClick={handleTap}
      className="card-soft rounded-2xl p-4 flex gap-3 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {result.profile_photo_url ? (
          <img
            src={result.profile_photo_url}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-secondary)]">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        {isAvailable && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{name}</p>
          {isAvailable && (
            <span className="shrink-0 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
              Available
            </span>
          )}
        </div>
        {result.primary_role && (
          <p className="text-xs text-[var(--color-text-secondary)] truncate">{result.primary_role}</p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
          {result.location_country && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
              <MapPin size={10} />
              {result.location_city ? `${result.location_city}, ${result.location_country}` : result.location_country}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
            <Anchor size={10} />
            {seaTimeLabel} · {result.yacht_count} yacht{result.yacht_count !== 1 ? 's' : ''}
          </span>
          {result.endorsement_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
              <Award size={10} />
              {result.endorsement_count} endorsement{result.endorsement_count !== 1 ? 's' : ''} from {result.endorser_count} crew
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <span className="shrink-0 self-center text-[var(--color-text-tertiary)] text-lg">›</span>
    </Link>
  );
}
```

### 3.6 — Search Pro Gate (Blurred Card for Free Users)

**File to create:** `components/search/SearchProGate.tsx`

```typescript
'use client';

import { Lock } from 'lucide-react';

interface Props {
  index: number;
}

export function SearchProGate({ index }: Props) {
  // Show first 2 results partially visible (blurred), rest fully locked
  const isPartiallyVisible = index < 2;

  function handleTap() {
    import('posthog-js').then((posthog) => {
      posthog.default.capture('search_upgrade_cta_tapped', {
        card_position: index,
      });
    });
    window.location.href = '/app/insights';
  }

  // Track CTA impression once
  if (typeof window !== 'undefined' && index === 0) {
    import('posthog-js').then((posthog) => {
      posthog.default.capture('search_upgrade_cta_shown');
    });
  }

  return (
    <button
      onClick={handleTap}
      className="card-soft rounded-2xl p-4 flex gap-3 relative overflow-hidden text-left w-full"
    >
      {/* Blurred placeholder content */}
      <div className={`flex gap-3 flex-1 ${isPartiallyVisible ? 'blur-[6px]' : 'blur-[10px]'} select-none pointer-events-none`}>
        <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-4 w-32 rounded bg-[var(--color-surface-raised)]" />
          <div className="h-3 w-24 rounded bg-[var(--color-surface-raised)]" />
          <div className="h-3 w-48 rounded bg-[var(--color-surface-raised)]" />
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/30">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-sand-400)] bg-[var(--color-sand-100)] px-3 py-1.5 rounded-full">
          <Lock size={12} />
          Pro
        </span>
      </div>
    </button>
  );
}
```

### 3.7 — Network Available Section

**File to create:** `components/search/NetworkAvailableSection.tsx`

```typescript
'use client';

import Link from 'next/link';

interface NetworkResult {
  user_id: string;
  display_name: string | null;
  full_name: string;
  handle: string | null;
  profile_photo_url: string | null;
  primary_role: string | null;
  departments: string[] | null;
  location_country: string | null;
  degree: number;
  via_colleague_id: string | null;
  via_colleague_name: string | null;
}

interface Props {
  results: NetworkResult[];
}

export function NetworkAvailableSection({ results }: Props) {
  if (results.length === 0) return null;

  const firstDegree = results.filter((r) => r.degree === 1);
  const secondDegree = results.filter((r) => r.degree === 2);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Available in your network
      </h2>

      {firstDegree.length > 0 && (
        <div className="flex flex-col gap-2">
          {firstDegree.slice(0, 5).map((person) => (
            <NetworkCard key={person.user_id} person={person} />
          ))}
        </div>
      )}

      {secondDegree.length > 0 && (
        <>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-1">
            2nd degree — colleagues of colleagues
          </p>
          <div className="flex flex-col gap-2">
            {secondDegree.slice(0, 5).map((person) => (
              <NetworkCard key={person.user_id} person={person} />
            ))}
          </div>
        </>
      )}

      {results.length > 10 && (
        <p className="text-xs text-[var(--color-text-tertiary)] text-center">
          + {results.length - 10} more available in your network
        </p>
      )}
    </div>
  );
}

function NetworkCard({ person }: { person: NetworkResult }) {
  const name = person.display_name || person.full_name;
  const profileUrl = person.handle ? `/u/${person.handle}` : `/app/profile/${person.user_id}`;

  return (
    <Link
      href={profileUrl}
      className="card-soft rounded-xl p-3 flex items-center gap-3 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
    >
      <div className="relative shrink-0">
        {person.profile_photo_url ? (
          <img
            src={person.profile_photo_url}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-secondary)]">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{name}</p>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          {person.primary_role}
          {person.degree === 2 && person.via_colleague_name && (
            <span className="text-[var(--color-text-tertiary)]"> · via {person.via_colleague_name}</span>
          )}
        </p>
      </div>

      <span className="shrink-0 text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
        {person.degree === 1 ? 'Colleague' : '2nd degree'}
      </span>
    </Link>
  );
}
```

---

## Part 4: Expanded Analytics — `/app/insights`

### 4.1 — Insights Page Enhancement

**File to modify:** `app/(protected)/app/insights/page.tsx`

The existing Insights page has basic view/download/share charts for Pro users and teaser cards for free users. Sprint 15 adds:

1. **Endorsement activity timeline** — list of endorsements received with context
2. **Anonymised viewer breakdown** — pie/bar chart of viewers by role and location
3. **Availability toggle history** — timeline of toggle events
4. **Profile completeness score** — percentage + "complete next step" CTA

#### Data Fetching (add to existing `Promise.all`)

For Pro users, add these to the existing parallel fetch:

```typescript
// Add to the Pro-only Promise.all block (after existing analytics fetches)
const [
  viewsRes, downloadsRes, sharesRes, summaryRes, certsExpRes,
  // NEW: Sprint 15 additions
  viewerBreakdownRes, endorsementTimelineRes, availabilityHistoryRes, completenessRes
] = await Promise.all([
  // existing fetches...
  supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'profile_view', p_days: days }),
  supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'pdf_download', p_days: days }),
  supabase.rpc('get_analytics_timeseries', { p_user_id: user.id, p_event_type: 'link_share', p_days: days }),
  supabase.rpc('get_analytics_summary', { p_user_id: user.id, p_days: days }),
  supabase.from('certifications').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('expires_at', sixtyDays.toISOString())
    .gt('expires_at', new Date().toISOString()),

  // NEW
  supabase.rpc('get_viewer_breakdown', { p_user_id: user.id, p_days: days }),
  supabase.rpc('get_endorsement_timeline', { p_user_id: user.id, p_limit: 10 }),
  supabase.rpc('get_availability_history', { p_user_id: user.id, p_days: days }),
  supabase.rpc('get_profile_completeness', { p_user_id: user.id }),
]);
```

For free users, fetch completeness only (shown as part of teaser):

```typescript
// Outside Pro gate — always fetch completeness
const { data: completenessData } = await supabase.rpc('get_profile_completeness', {
  p_user_id: user.id,
});
```

#### New Sections in Pro View

Add after the existing `grid grid-cols-2` analytics cards:

```typescript
{/* Viewer Breakdown */}
<ViewerBreakdownCard breakdown={viewerBreakdownData} />

{/* Endorsement Timeline */}
<EndorsementTimeline endorsements={endorsementTimelineData} />

{/* Availability History */}
<AvailabilityHistory events={availabilityHistoryData} />

{/* Profile Completeness */}
<ProfileCompletenessCard completeness={completenessData} />
```

#### New Teaser Cards for Free Users

Add to the free user teaser section:

```typescript
<TeaserCard title="Viewer Breakdown" subtitle="See who views your profile by role and location" />
<TeaserCard title="Endorsement Timeline" subtitle="Track endorsement activity over time" />
<TeaserCard title="Availability History" subtitle="See your availability pattern" />
```

### 4.2 — Viewer Breakdown Component

**File to create:** `components/insights/ViewerBreakdownCard.tsx`

```typescript
'use client';

interface BreakdownEntry {
  role?: string;
  location?: string;
  count: number;
}

interface ViewerBreakdown {
  by_role: BreakdownEntry[];
  by_location: BreakdownEntry[];
}

interface Props {
  breakdown: ViewerBreakdown | null;
}

export function ViewerBreakdownCard({ breakdown }: Props) {
  if (!breakdown) return null;

  const hasRoleData = breakdown.by_role.length > 0;
  const hasLocationData = breakdown.by_location.length > 0;

  if (!hasRoleData && !hasLocationData) {
    return (
      <div className="card-soft rounded-2xl p-4">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Viewer Breakdown</p>
        <p className="text-xs text-[var(--color-text-secondary)]">No viewer data yet — share your profile to start collecting insights.</p>
      </div>
    );
  }

  const totalRoleViews = breakdown.by_role.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="card-soft rounded-2xl p-4">
      <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Viewer Breakdown</p>

      {/* Role breakdown */}
      {hasRoleData && (
        <div className="mb-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">By role</p>
          <div className="flex flex-col gap-1.5">
            {breakdown.by_role.slice(0, 5).map((entry) => {
              const pct = totalRoleViews > 0 ? Math.round((entry.count / totalRoleViews) * 100) : 0;
              return (
                <div key={entry.role} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-primary)] w-24 truncate">{entry.role}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-raised)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-coral-500)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-tertiary)] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Location breakdown */}
      {hasLocationData && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">Top locations</p>
          <div className="flex flex-wrap gap-1.5">
            {breakdown.by_location.slice(0, 5).map((entry) => (
              <span
                key={entry.location}
                className="text-xs bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] px-2 py-1 rounded-lg"
              >
                {entry.location} ({entry.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4.3 — Endorsement Timeline Component

**File to create:** `components/insights/EndorsementTimeline.tsx`

```typescript
'use client';

import Link from 'next/link';
import { Award } from 'lucide-react';

interface TimelineEntry {
  endorsement_id: string;
  endorser_name: string;
  endorser_handle: string | null;
  endorser_photo_url: string | null;
  endorser_role: string | null;
  yacht_name: string;
  yacht_id: string;
  created_at: string;
}

interface Props {
  endorsements: TimelineEntry[] | null;
}

export function EndorsementTimeline({ endorsements }: Props) {
  if (!endorsements || endorsements.length === 0) {
    return (
      <div className="card-soft rounded-2xl p-4">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Endorsement Activity</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          No endorsements yet — request endorsements from colleagues to build trust.
        </p>
      </div>
    );
  }

  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Endorsement Activity</p>
        <span className="text-xs text-[var(--color-text-tertiary)]">{endorsements.length} recent</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {endorsements.map((entry) => {
          const endorserUrl = entry.endorser_handle ? `/u/${entry.endorser_handle}` : '#';
          const date = new Date(entry.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          });
          return (
            <div key={entry.endorsement_id} className="flex items-start gap-2.5">
              <Award size={14} className="text-[var(--color-coral-500)] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-primary)]">
                  <Link href={endorserUrl} className="font-medium hover:underline">{entry.endorser_name}</Link>
                  {entry.endorser_role && <span className="text-[var(--color-text-tertiary)]"> ({entry.endorser_role})</span>}
                  {' endorsed you'}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  <Link href={`/app/yacht/${entry.yacht_id}`} className="hover:underline">{entry.yacht_name}</Link>
                  {' · '}{date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.4 — Availability History Component

**File to create:** `components/insights/AvailabilityHistory.tsx`

```typescript
'use client';

interface AvailabilityEvent {
  event_type: string;
  created_at: string;
}

interface Props {
  events: AvailabilityEvent[] | null;
}

export function AvailabilityHistory({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="card-soft rounded-2xl p-4">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Availability History</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          No availability events yet — toggle your availability from your profile to start tracking.
        </p>
      </div>
    );
  }

  // Calculate total days available
  let totalAvailableDays = 0;
  let lastToggleOn: Date | null = null;
  const sorted = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  for (const event of sorted) {
    if (event.event_type === 'toggled_on') {
      lastToggleOn = new Date(event.created_at);
    } else if ((event.event_type === 'toggled_off' || event.event_type === 'expired') && lastToggleOn) {
      totalAvailableDays += Math.round((new Date(event.created_at).getTime() - lastToggleOn.getTime()) / (1000 * 60 * 60 * 24));
      lastToggleOn = null;
    }
  }
  // If currently available (last event was toggled_on)
  if (lastToggleOn) {
    totalAvailableDays += Math.round((Date.now() - lastToggleOn.getTime()) / (1000 * 60 * 60 * 24));
  }

  const toggleCount = events.filter((e) => e.event_type === 'toggled_on').length;

  return (
    <div className="card-soft rounded-2xl p-4">
      <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Availability History</p>

      <div className="flex gap-4 mb-3">
        <div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{totalAvailableDays}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">days available</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{toggleCount}</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">times toggled</p>
        </div>
      </div>

      {/* Recent events */}
      <div className="flex flex-col gap-1.5">
        {events.slice(0, 8).map((event, i) => {
          const date = new Date(event.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short',
          });
          const time = new Date(event.created_at).toLocaleTimeString('en-GB', {
            hour: '2-digit', minute: '2-digit',
          });
          const labels: Record<string, string> = {
            toggled_on: 'Marked available',
            toggled_off: 'Marked unavailable',
            expired: 'Availability expired',
            reminded: 'Reminder sent',
          };
          const colors: Record<string, string> = {
            toggled_on: 'text-emerald-600',
            toggled_off: 'text-[var(--color-text-tertiary)]',
            expired: 'text-amber-600',
            reminded: 'text-[var(--color-text-tertiary)]',
          };
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`${colors[event.event_type] ?? 'text-[var(--color-text-tertiary)]'}`}>
                {labels[event.event_type] ?? event.event_type}
              </span>
              <span className="text-[var(--color-text-tertiary)] ml-auto">{date} {time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.5 — Profile Completeness Component

**File to create:** `components/insights/ProfileCompletenessCard.tsx`

```typescript
'use client';

import Link from 'next/link';

interface Completeness {
  score: number;
  has_photo: boolean;
  has_bio: boolean;
  has_yacht: boolean;
  has_cert: boolean;
  has_endorsement: boolean;
}

interface Props {
  completeness: Completeness | null;
}

export function ProfileCompletenessCard({ completeness }: Props) {
  if (!completeness) return null;
  if (completeness.score === 100) {
    return (
      <div className="card-soft rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">✓</span>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Profile complete</p>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Your profile has all the essentials. Keep it updated for best results.
        </p>
      </div>
    );
  }

  const steps = [
    { label: 'Add profile photo', done: completeness.has_photo, href: '/app/profile' },
    { label: 'Write a bio', done: completeness.has_bio, href: '/app/about' },
    { label: 'Add a yacht', done: completeness.has_yacht, href: '/app/attachment/new' },
    { label: 'Add a certification', done: completeness.has_cert, href: '/app/certification/new' },
    { label: 'Get an endorsement', done: completeness.has_endorsement, href: '/app/network' },
  ];

  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="card-soft rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Profile Completeness</p>
        <span className="text-sm font-bold text-[var(--color-text-primary)]">{completeness.score}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[var(--color-surface-raised)] overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-[var(--color-teal-700)] transition-all"
          style={{ width: `${completeness.score}%` }}
        />
      </div>

      {/* Steps checklist */}
      <div className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-2 text-xs">
            <span className={step.done ? 'text-[var(--color-teal-700)]' : 'text-[var(--color-text-tertiary)]'}>
              {step.done ? '✓' : '○'}
            </span>
            <span className={step.done ? 'text-[var(--color-text-secondary)] line-through' : 'text-[var(--color-text-primary)]'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Next step CTA */}
      {nextStep && (
        <Link
          href={nextStep.href}
          className="mt-3 inline-block text-xs font-semibold text-[var(--color-teal-700)] hover:underline"
        >
          Complete next step →
        </Link>
      )}
    </div>
  );
}
```

---

## Part 5: Endorsement Pinning (Pro)

### 5.1 — API Route for Endorsement Display Order

**File to create:** `app/api/endorsement-display-order/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProStatus } from '@/lib/stripe/pro';
import { applyRateLimit } from '@/lib/rate-limit/helpers';
import { handleApiError } from '@/lib/api/errors';
import { z } from 'zod';

const schema = z.object({
  order: z.array(z.string().uuid()),
});

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limited = await applyRateLimit(req, 'profileEdit', user.id);
    if (limited) return limited;

    const proStatus = await getProStatus(user.id);
    if (!proStatus.isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid order array', details: parsed.error.issues }, { status: 400 });
    }

    // Verify all endorsement IDs belong to the user (as recipient)
    const { data: endorsements } = await supabase
      .from('endorsements')
      .select('id')
      .eq('recipient_id', user.id)
      .is('deleted_at', null)
      .in('id', parsed.data.order);

    const validIds = new Set((endorsements ?? []).map((e) => e.id));
    const filteredOrder = parsed.data.order.filter((id) => validIds.has(id));

    const { error } = await supabase
      .from('users')
      .update({ endorsement_display_order: filteredOrder })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, order: filteredOrder });
  } catch (err) {
    return handleApiError(err);
  }
}
```

### 5.2 — Endorsement Pinning UI Component

**File to create:** `components/endorsements/EndorsementPinning.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { GripVertical, Pin } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Endorsement {
  id: string;
  content: string;
  endorser_name: string;
  yacht_name: string;
  created_at: string;
}

interface Props {
  endorsements: Endorsement[];
  displayOrder: string[];
  isPro: boolean;
}

export function EndorsementPinning({ endorsements, displayOrder, isPro }: Props) {
  const { toast } = useToast();
  const [order, setOrder] = useState<string[]>(displayOrder);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Sort endorsements: pinned first (in order), then rest chronologically
  const sortedEndorsements = useCallback(() => {
    const pinned = order
      .map((id) => endorsements.find((e) => e.id === id))
      .filter(Boolean) as Endorsement[];
    const unpinned = endorsements
      .filter((e) => !order.includes(e.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return [...pinned, ...unpinned];
  }, [endorsements, order]);

  async function saveOrder(newOrder: string[]) {
    setSaving(true);
    try {
      const res = await fetch('/api/endorsement-display-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
      if (!res.ok) throw new Error('Save failed');
      setOrder(newOrder);

      import('posthog-js').then((posthog) => {
        posthog.default.capture('endorsement_pinned', { order_length: newOrder.length });
      });
    } catch {
      toast('Could not save endorsement order', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handlePin(endorsementId: string) {
    const newOrder = order.includes(endorsementId)
      ? order.filter((id) => id !== endorsementId)
      : [...order, endorsementId];
    saveOrder(newOrder);
  }

  // Basic drag reorder (within pinned items only)
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const sorted = sortedEndorsements();
    const pinnedCount = order.length;
    if (index >= pinnedCount || dragIndex >= pinnedCount) return;

    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, moved);
    setOrder(newOrder);
    setDragIndex(index);
  }

  function handleDragEnd() {
    if (dragIndex !== null) {
      saveOrder(order);
      setDragIndex(null);
    }
  }

  if (!isPro) return null;

  const sorted = sortedEndorsements();

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((endorsement, index) => {
        const isPinned = order.includes(endorsement.id);
        const isDraggable = isPinned;

        return (
          <div
            key={endorsement.id}
            draggable={isDraggable}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-start gap-2 p-3 rounded-xl border transition-colors ${
              isPinned
                ? 'border-[var(--color-teal-200)] bg-[var(--color-teal-50)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {isDraggable && (
              <GripVertical size={14} className="text-[var(--color-text-tertiary)] mt-1 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2">
                "{endorsement.content}"
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                — {endorsement.endorser_name} · {endorsement.yacht_name}
              </p>
            </div>
            <button
              onClick={() => handlePin(endorsement.id)}
              disabled={saving}
              className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                isPinned
                  ? 'text-[var(--color-teal-700)] bg-[var(--color-teal-100)]'
                  : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-raised)]'
              }`}
            >
              <Pin size={14} className={isPinned ? 'fill-current' : ''} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

**Integration:** Add `EndorsementPinning` to the profile page endorsement section when the user is viewing their own profile and has Pro status. The sorted order must also be applied when rendering endorsements on the public profile page (`/u/[handle]`).

### 5.3 — Public Profile Endorsement Ordering

**File to modify:** `lib/queries/profile.ts`

In `getProfileSections()`, the endorsements query already returns endorsements sorted by `created_at DESC`. To apply pinned order, the page component that renders endorsements needs to:

1. Fetch the user's `endorsement_display_order` from the profile data
2. Sort: pinned IDs first (in order), then remaining by `created_at DESC`

This sort happens in the component, not the query — it's a simple reorder of an already-fetched array.

---

## Part 6: Notification Preferences

### 6.1 — Settings Page

**File to create:** `app/(protected)/app/more/notifications/page.tsx`

```typescript
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificationPreferencesClient } from '@/components/settings/NotificationPreferencesClient';
import { getProStatus } from '@/lib/stripe/pro';
import { PageTransition } from '@/components/ui/PageTransition';
import { BackButton } from '@/components/ui/BackButton';

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/welcome');

  const [{ data: profile }, proStatus] = await Promise.all([
    supabase.from('users').select('notification_preferences').eq('id', user.id).single(),
    getProStatus(user.id),
  ]);

  return (
    <PageTransition className="flex flex-col gap-4 pb-24 -mx-4 px-4 md:-mx-6 md:px-6 bg-[var(--color-sand-100)]">
      <BackButton href="/app/more" />
      <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">
        Notifications
      </h1>
      <NotificationPreferencesClient
        preferences={profile?.notification_preferences ?? {}}
        isPro={proStatus.isPro}
      />
    </PageTransition>
  );
}
```

### 6.2 — Notification Preferences Client Component

**File to create:** `components/settings/NotificationPreferencesClient.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { Lock } from 'lucide-react';

interface NotificationPrefs {
  endorsement_received?: boolean;
  endorsement_request_received?: boolean;
  availability_expiry_reminder?: boolean;
  weekly_analytics_digest?: boolean;
  cert_expiry_reminder?: boolean;
}

const DEFAULTS: Required<NotificationPrefs> = {
  endorsement_received: true,
  endorsement_request_received: true,
  availability_expiry_reminder: true,
  weekly_analytics_digest: false,
  cert_expiry_reminder: true,
};

interface Props {
  preferences: NotificationPrefs;
  isPro: boolean;
}

export function NotificationPreferencesClient({ preferences, isPro }: Props) {
  const supabase = createClient();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Required<NotificationPrefs>>({
    ...DEFAULTS,
    ...preferences,
  });
  const [saving, setSaving] = useState(false);

  async function togglePref(key: keyof NotificationPrefs) {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: newPrefs })
      .eq('id', user.id);

    if (error) {
      toast('Could not save preference', 'error');
      setPrefs(prefs); // revert
    }

    setSaving(false);

    import('posthog-js').then((posthog) => {
      posthog.default.capture('notification_preference_changed', {
        key,
        value: newPrefs[key],
      });
    });
  }

  const rows: { key: keyof NotificationPrefs; label: string; sublabel: string; proOnly: boolean }[] = [
    {
      key: 'endorsement_received',
      label: 'Endorsement received',
      sublabel: 'Email when someone endorses you',
      proOnly: false,
    },
    {
      key: 'endorsement_request_received',
      label: 'Endorsement request received',
      sublabel: 'Email when someone requests your endorsement',
      proOnly: false,
    },
    {
      key: 'availability_expiry_reminder',
      label: 'Availability expiry reminder',
      sublabel: 'Reminder before your availability expires',
      proOnly: false,
    },
    {
      key: 'weekly_analytics_digest',
      label: 'Weekly analytics digest',
      sublabel: 'Weekly email summary of profile views and activity',
      proOnly: true,
    },
    {
      key: 'cert_expiry_reminder',
      label: 'Certification expiry reminders',
      sublabel: 'Alerts when your certifications are expiring',
      proOnly: true,
    },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
      {rows.map((row) => {
        const isLocked = row.proOnly && !isPro;
        return (
          <div key={row.key} className="px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2">
                <p className="text-sm text-[var(--color-text-primary)]">{row.label}</p>
                {row.proOnly && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-sand-400)] bg-[var(--color-sand-100)] px-1.5 py-0.5 rounded-full">
                    <Lock size={9} />
                    Pro
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{row.sublabel}</p>
            </div>
            <button
              onClick={() => !isLocked && togglePref(row.key)}
              disabled={isLocked || saving}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                isLocked
                  ? 'bg-[var(--color-surface-raised)] opacity-50 cursor-not-allowed'
                  : prefs[row.key]
                    ? 'bg-[var(--color-teal-700)]'
                    : 'bg-[var(--color-surface-raised)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  prefs[row.key] ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

### 6.3 — More Page Link

**File to modify:** `app/(protected)/app/more/page.tsx`

Add a SettingsRow in the Account section:

```typescript
<SettingsRow
  label="Notification preferences"
  href="/app/more/notifications"
  sublabel="Email alerts for endorsements, availability, analytics"
/>
```

### 6.4 — Email Send Preference Check

All email-sending code (cron jobs, API routes that send emails) must check the user's `notification_preferences` before dispatching. This is a utility function:

**File to create:** `lib/notifications/check-preference.ts`

```typescript
interface NotificationPrefs {
  endorsement_received?: boolean;
  endorsement_request_received?: boolean;
  availability_expiry_reminder?: boolean;
  weekly_analytics_digest?: boolean;
  cert_expiry_reminder?: boolean;
}

const DEFAULTS: Record<string, boolean> = {
  endorsement_received: true,
  endorsement_request_received: true,
  availability_expiry_reminder: true,
  weekly_analytics_digest: false,
  cert_expiry_reminder: true,
};

/**
 * Check whether a notification should be sent based on user preferences.
 * Returns true if the notification is allowed (default or explicitly enabled).
 */
export function shouldSendNotification(
  preferences: NotificationPrefs | null | undefined,
  key: keyof NotificationPrefs,
): boolean {
  if (!preferences) return DEFAULTS[key] ?? true;
  const value = preferences[key];
  if (value === undefined) return DEFAULTS[key] ?? true;
  return value;
}
```

**Integration points** (files to modify):

| File | Preference Key |
|------|---------------|
| `app/api/endorsement-requests/route.ts` (send request email) | `endorsement_request_received` |
| `app/api/endorsements/route.ts` (send endorsement received email) | `endorsement_received` |
| `app/api/cron/cert-expiry/route.ts` | `cert_expiry_reminder` |
| `app/api/cron/analytics-nudge/route.ts` | `weekly_analytics_digest` |
| Sprint 14 availability expiry reminder cron | `availability_expiry_reminder` |

In each file, before sending an email, fetch the user's `notification_preferences` and call `shouldSendNotification()`. Skip the email send if it returns `false`.

---

## Part 7: PostHog Event Specifications

| Event | Properties | Trigger |
|-------|-----------|---------|
| `crew_search_executed` | `{ filters: object, result_count: number, page: number }` | User clicks Search button |
| `crew_search_result_tapped` | `{ result_user_id: string, result_position: number }` | User taps a search result card |
| `search_upgrade_cta_shown` | `{}` | Free user sees blurred search results |
| `search_upgrade_cta_tapped` | `{ card_position: number }` | Free user taps a locked result card |
| `analytics_tab_viewed` | `{ isPro: boolean, range: string }` | User views Insights page |
| `endorsement_pinned` | `{ order_length: number }` | Pro user pins/reorders an endorsement |
| `endorsement_unpinned` | `{ endorsement_id: string }` | Pro user unpins an endorsement |
| `notification_preference_changed` | `{ key: string, value: boolean }` | User toggles a notification setting |

**Implementation:** All events use the existing pattern — dynamic `import('posthog-js').then((posthog) => { posthog.default.capture(...) })`.

Add `analytics_tab_viewed` to the Insights page (currently missing):

```typescript
// In SearchPageClient on mount:
useEffect(() => {
  import('posthog-js').then((posthog) => {
    posthog.default.capture('analytics_tab_viewed', { isPro, range });
  });
}, [isPro]);
```

---

## Part 8: File-by-File Implementation Order

Each phase can be implemented as one commit. Dependencies between phases are noted.

### Phase A: Database Migration (no dependencies)

| # | File | Action | Notes |
|---|------|--------|-------|
| A1 | `supabase/migrations/20260323000001_sprint15_search_analytics.sql` | Create | Full migration: columns, indexes, RPCs, grants |

### Phase B: Shared Utilities (depends on A)

| # | File | Action | Notes |
|---|------|--------|-------|
| B1 | `lib/section-colors.ts` | Modify | Add `search: "navy"` to `sectionColors` |
| B2 | `lib/notifications/check-preference.ts` | Create | `shouldSendNotification()` utility |

### Phase C: Search Page (depends on A, B)

| # | File | Action | Notes |
|---|------|--------|-------|
| C1 | `components/search/SearchFilters.tsx` | Create | Filter panel component |
| C2 | `components/search/SearchResultCard.tsx` | Create | Result card component |
| C3 | `components/search/SearchProGate.tsx` | Create | Blurred locked card for free users |
| C4 | `components/search/NetworkAvailableSection.tsx` | Create | Network availability section |
| C5 | `components/search/SearchPageClient.tsx` | Create | Main search client component (depends on C1-C4) |
| C6 | `app/(protected)/app/search/loading.tsx` | Create | Search page skeleton |
| C7 | `app/(protected)/app/search/page.tsx` | Create | Search page server component (depends on C5) |

### Phase D: Navigation Updates (depends on C)

| # | File | Action | Notes |
|---|------|--------|-------|
| D1 | `app/(protected)/app/network/page.tsx` | Modify | Add search entry point card at top |
| D2 | `app/(protected)/app/more/page.tsx` | Modify | Add "Crew Search" SettingsRow in Help section |

### Phase E: Expanded Analytics (depends on A)

| # | File | Action | Notes |
|---|------|--------|-------|
| E1 | `components/insights/ViewerBreakdownCard.tsx` | Create | Viewer breakdown component |
| E2 | `components/insights/EndorsementTimeline.tsx` | Create | Endorsement timeline component |
| E3 | `components/insights/AvailabilityHistory.tsx` | Create | Availability history component |
| E4 | `components/insights/ProfileCompletenessCard.tsx` | Create | Profile completeness component |
| E5 | `app/(protected)/app/insights/page.tsx` | Modify | Add new data fetches + render new components (depends on E1-E4) |

### Phase F: Endorsement Pinning (depends on A)

| # | File | Action | Notes |
|---|------|--------|-------|
| F1 | `app/api/endorsement-display-order/route.ts` | Create | PUT API route for saving order |
| F2 | `components/endorsements/EndorsementPinning.tsx` | Create | Drag-to-reorder UI component |
| F3 | `app/(protected)/app/profile/page.tsx` | Modify | Integrate pinning UI in endorsement section |
| F4 | Public profile page (wherever endorsements render) | Modify | Apply `endorsement_display_order` sort |

### Phase G: Notification Preferences (depends on A, B)

| # | File | Action | Notes |
|---|------|--------|-------|
| G1 | `components/settings/NotificationPreferencesClient.tsx` | Create | Toggle UI component |
| G2 | `app/(protected)/app/more/notifications/page.tsx` | Create | Settings page (depends on G1) |
| G3 | `app/(protected)/app/more/page.tsx` | Modify | Add "Notification preferences" SettingsRow |
| G4 | `app/api/endorsement-requests/route.ts` | Modify | Check preference before sending email |
| G5 | `app/api/endorsements/route.ts` | Modify | Check preference before sending email |
| G6 | `app/api/cron/cert-expiry/route.ts` | Modify | Check preference before sending email |
| G7 | `app/api/cron/analytics-nudge/route.ts` | Modify | Check preference before sending email |

### Phase H: Documentation (depends on all above)

| # | File | Action | Notes |
|---|------|--------|-------|
| H1 | `CHANGELOG.md` | Modify | Log Sprint 15 work |
| H2 | `docs/modules/search.md` | Create | Module state for search |
| H3 | `docs/modules/insights.md` | Modify | Update with new analytics |
| H4 | `docs/design-system/flows/app-navigation.md` | Modify | Add `/app/search` route |

---

## Part 9: Testing Checklist

### Search

- [ ] Pro user: search with no filters returns all crew (paginated)
- [ ] Pro user: search by department filter returns matching crew only
- [ ] Pro user: search by role (partial match) returns matching crew
- [ ] Pro user: search by location country returns matching crew
- [ ] Pro user: search by availability only returns available crew
- [ ] Pro user: search by cert type returns crew with that cert
- [ ] Pro user: search by yacht returns crew attached to that yacht
- [ ] Pro user: combine multiple filters
- [ ] Pro user: empty results show "No crew match your filters" message
- [ ] Pro user: pagination works (next/previous, page counter)
- [ ] Pro user: result cards show correct stats (sea time, yacht count, endorsement count)
- [ ] Pro user: tap result card navigates to profile
- [ ] Pro user: network availability shows at top when not searched yet
- [ ] Pro user: 2nd-degree results show "via [name]" attribution
- [ ] Free user: search page loads, filters work, but results show blurred cards
- [ ] Free user: tapping locked card navigates to upgrade
- [ ] Free user: upgrade CTA shown below results
- [ ] Search returns in <500ms for typical queries (measure with 10+ users)
- [ ] Result sort: available first, then endorsement count, then sea time
- [ ] Search page works at 375px width (no overflow)
- [ ] Search page works on desktop (max-w-2xl, proper spacing)
- [ ] Filter panel collapses/expands correctly on mobile
- [ ] Yacht typeahead in filters works (type 2+ chars, see results, select)

### Analytics

- [ ] Pro user: viewer breakdown shows role percentages and top locations
- [ ] Pro user: endorsement timeline shows recent endorsements with names and yacht context
- [ ] Pro user: availability history shows toggle events and total days
- [ ] Pro user: profile completeness shows correct score and next step
- [ ] Free user: new teaser cards shown for viewer breakdown, timeline, availability
- [ ] Time range selector (7d, 30d, all) still works for existing charts
- [ ] Profile completeness shows 100% with all steps done
- [ ] Profile completeness next-step links navigate correctly

### Endorsement Pinning

- [ ] Pro user: pin button visible on own endorsements
- [ ] Pro user: pinned endorsements move to top
- [ ] Pro user: drag to reorder pinned endorsements
- [ ] Pro user: unpin moves endorsement back to chronological position
- [ ] Pro user: pinned order persists after page reload
- [ ] Pro user: pinned order applies to public profile
- [ ] Free user: no pin UI visible
- [ ] API rejects non-Pro users with 403
- [ ] API validates endorsement IDs belong to the user

### Notification Preferences

- [ ] Settings page renders all toggle options
- [ ] Toggles save immediately and persist after reload
- [ ] Pro-only toggles (analytics digest, cert expiry) are locked for free users
- [ ] Email sends respect preferences (manually test each)
- [ ] Default values applied correctly for new users (no preferences saved yet)

### Pro Gate Consistency

- [ ] Search results gated for free users
- [ ] 2nd-degree network only for Pro users (free see 1st-degree only)
- [ ] Endorsement pinning only for Pro users
- [ ] Analytics digest + cert expiry notification toggles locked for free users
- [ ] Pro badge shown on search page for Pro users

### PostHog Events

- [ ] `crew_search_executed` fires on search with correct filter params
- [ ] `crew_search_result_tapped` fires on card tap with correct position
- [ ] `search_upgrade_cta_shown` fires when free user sees blurred results
- [ ] `search_upgrade_cta_tapped` fires when free user taps locked card
- [ ] `analytics_tab_viewed` fires on Insights page load
- [ ] `endorsement_pinned` fires when Pro user pins/reorders
- [ ] `notification_preference_changed` fires on toggle change

### Graph Navigation

- [ ] Search result cards link to profiles (`/u/[handle]` or `/app/profile/[id]`)
- [ ] Profile links still work (to yachts, to endorsers)
- [ ] Network availability cards link to profiles
- [ ] Endorsement timeline links navigate to endorser profiles and yacht pages
- [ ] No dead ends in the graph

### Responsive

- [ ] Search page at 375px: filter panel stacks, cards readable, no overflow
- [ ] Search page at 768px: proper spacing
- [ ] Search page at 1280px: max-w-2xl constraint, centered
- [ ] Insights page new sections work at 375px
- [ ] Notification preferences page works at 375px
- [ ] Endorsement pinning drag works on mobile (touch events)

---

## Part 10: Rollback Plan

### If Migration Fails

```bash
-- Rollback SQL (reverse order)
DROP FUNCTION IF EXISTS public.get_profile_completeness(uuid);
DROP FUNCTION IF EXISTS public.get_availability_history(uuid, int);
DROP FUNCTION IF EXISTS public.get_endorsement_timeline(uuid, int, int);
DROP FUNCTION IF EXISTS public.get_viewer_breakdown(uuid, int);
DROP FUNCTION IF EXISTS public.get_available_in_network(uuid, int);
DROP FUNCTION IF EXISTS public.search_crew(jsonb, int, int);

DROP INDEX IF EXISTS idx_users_primary_role_trgm;
DROP INDEX IF EXISTS idx_attachments_yacht_user;
DROP INDEX IF EXISTS idx_certifications_user_type;
DROP INDEX IF EXISTS idx_users_departments_gin;
DROP INDEX IF EXISTS idx_users_search_composite;

ALTER TABLE public.users DROP COLUMN IF EXISTS notification_preferences;
ALTER TABLE public.users DROP COLUMN IF EXISTS endorsement_display_order;
```

### If Feature Breaks in Production

1. **Search page breaks:** The feature is additive — no existing pages depend on it. Remove the route at `app/(protected)/app/search/` and the nav links. Users lose search but nothing else breaks.

2. **Analytics page breaks:** The new components are additive to the existing Insights page. Remove the new component imports and the added `Promise.all` calls. Revert to the Sprint 7 Insights page (view/download/share charts only).

3. **Endorsement pinning breaks:** The `endorsement_display_order` column defaults to `[]`. If the pinning UI causes issues, remove the component. Endorsements revert to chronological order (the column is ignored if empty).

4. **Notification preferences breaks:** The `notification_preferences` column defaults to `{}`. The `shouldSendNotification()` utility treats missing/empty preferences as defaults (all sends allowed). Remove the settings page; email sends continue as before.

5. **Full rollback:** `vercel rollback` to the pre-Sprint-15 deployment. The new database columns and functions remain in the DB but are unused — they do not affect existing functionality. Run the rollback SQL above to clean up the migration if needed.

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-S15-01 | Search accessible from Network page + More page, not as 6th tab | 5 tabs is the mobile UX maximum. Search is conceptually part of the network/discovery family. Adding a 6th tab would break mobile nav. |
| D-S15-02 | `search_crew()` as a single RPC with jsonb filters, not separate endpoints | One RPC handles all filter combinations. Avoids proliferation of API routes for each filter permutation. The jsonb approach scales to new filters without schema changes. |
| D-S15-03 | Blurred cards for free users, not hidden results | Showing blurred results creates FOMO and conversion intent. Hidden results would leave free users wondering if search works at all. |
| D-S15-04 | Analytics data from `profile_analytics` table, not PostHog API | Direct DB queries are faster and more reliable than external API calls. The `profile_analytics` table already captures the events we need. PostHog is for product analytics (funnels, retention), not user-facing data. |
| D-S15-05 | Profile completeness as DB function, not client calculation | Single source of truth. The same function can be used by cron jobs (nudge emails) and the Insights page. |
| D-S15-06 | Notification preferences as jsonb column, not a separate table | Five preferences don't justify a separate table. jsonb on `users` keeps the query simple (one row fetch). If preferences grow beyond 15-20 keys, migrate to a table. |
| D-S15-07 | Endorsement pinning via PUT endpoint, not real-time sync | Pinning is an infrequent action. A simple PUT to save the order array is sufficient. Real-time collaboration is not needed — only the profile owner pins. |
| D-S15-08 | Sort by endorsement count in search is ordering, not trust weighting (D-026) | Endorsement count reflects real colleague endorsements (gated by D-009). It rewards active platform users without crossing the trust monetisation line. |
| D-S15-09 | 2nd-degree network uses `DISTINCT ON` to pick one via-colleague | A crew member might be reachable via multiple 2nd-degree paths. Picking one gives the user a single clear reference ("via Chief Stew Maria") without overwhelming them. |
| D-S15-10 | Search results show profile summaries, not full contact details | Per D-025: search results show summary info. Full contact details require visiting the profile directly. This creates the conversion funnel without restricting core identity/sharing use. |
