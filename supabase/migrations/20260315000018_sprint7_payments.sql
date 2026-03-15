-- Sprint 7: Payments + Pro
-- Migration: 20260315000018

-- ── 1. Users table additions ───────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS analytics_nudge_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_member boolean DEFAULT false;

-- ── 2. Cert expiry reminder tracking ──────────────────────────────────────

ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS expiry_reminder_60d_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_reminder_30d_sent boolean DEFAULT false;

-- ── 3. Analytics helper functions ─────────────────────────────────────────

-- Record a profile analytics event (called from API routes)
CREATE OR REPLACE FUNCTION public.record_profile_event(
  p_user_id uuid,
  p_event_type text,
  p_viewer_role text DEFAULT NULL,
  p_viewer_location text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profile_analytics (user_id, event_type, viewer_role, viewer_location, occurred_at)
  VALUES (p_user_id, p_event_type, p_viewer_role, p_viewer_location, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text, text, text) TO anon;

-- Summary counts for a time range
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  event_type text,
  event_count bigint,
  latest_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    event_type,
    count(*)::bigint AS event_count,
    max(occurred_at) AS latest_at
  FROM public.profile_analytics
  WHERE user_id = p_user_id
    AND occurred_at >= now() - (p_days || ' days')::interval
  GROUP BY event_type;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_summary(uuid, integer) TO authenticated;

-- Daily event counts for time-series charts
CREATE OR REPLACE FUNCTION public.get_analytics_timeseries(
  p_user_id uuid,
  p_event_type text,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  day date,
  event_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    date_trunc('day', occurred_at)::date AS day,
    count(*)::bigint AS event_count
  FROM public.profile_analytics
  WHERE user_id = p_user_id
    AND event_type = p_event_type
    AND occurred_at >= now() - (p_days || ' days')::interval
  GROUP BY date_trunc('day', occurred_at)::date
  ORDER BY day;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_timeseries(uuid, text, integer) TO authenticated;

-- Endorsement request daily limit — 20 for Pro, 10 for free
CREATE OR REPLACE FUNCTION public.get_endorsement_request_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN subscription_status = 'pro' THEN 20
    ELSE 10
  END
  FROM public.users
  WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_endorsement_request_limit(uuid) TO authenticated;

-- ── 4. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profile_analytics_user_event_date
  ON public.profile_analytics (user_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_certifications_expiry
  ON public.certifications (expiry_date)
  WHERE expiry_date IS NOT NULL;
