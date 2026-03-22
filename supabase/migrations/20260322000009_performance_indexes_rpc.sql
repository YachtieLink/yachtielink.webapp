-- Rally 003 Sprint 8: Performance indexes + analytics RPC

-- NOTE: analytics_event_idx on (event_type, occurred_at DESC) already
-- exists from core_tables migration. No duplicate index needed.

-- Index for subscription_status filtering (cron jobs, insights page)
CREATE INDEX IF NOT EXISTS idx_users_subscription_status
  ON public.users (subscription_status)
  WHERE deleted_at IS NULL;

-- RPC for weekly view count aggregation (replaces JS-level GROUP BY)
-- Only callable by service_role (cron job) — not exposed to authenticated users
CREATE OR REPLACE FUNCTION get_weekly_view_counts()
RETURNS TABLE (user_id uuid, view_count integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT user_id, COUNT(*)::integer as view_count
  FROM profile_analytics
  WHERE event_type = 'profile_view'
    AND occurred_at >= NOW() - INTERVAL '7 days'
  GROUP BY user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_view_counts() TO service_role;
