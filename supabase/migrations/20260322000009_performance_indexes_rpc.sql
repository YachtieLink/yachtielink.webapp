-- Rally 003 Sprint 8: Performance indexes + analytics RPC

-- Index for cross-user analytics queries (nudge cron)
-- Existing index leads with user_id, useless for cross-user scans
CREATE INDEX IF NOT EXISTS idx_profile_analytics_event_date
  ON public.profile_analytics (event_type, occurred_at DESC);

-- Index for subscription_status filtering (cron jobs, insights page)
CREATE INDEX IF NOT EXISTS idx_users_subscription_status
  ON public.users (subscription_status)
  WHERE deleted_at IS NULL;

-- RPC for weekly view count aggregation (replaces JS-level GROUP BY)
CREATE OR REPLACE FUNCTION get_weekly_view_counts()
RETURNS TABLE (user_id uuid, view_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT user_id, COUNT(*) as view_count
  FROM profile_analytics
  WHERE event_type = 'profile_view'
    AND occurred_at >= NOW() - INTERVAL '7 days'
  GROUP BY user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_view_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_view_counts() TO service_role;
