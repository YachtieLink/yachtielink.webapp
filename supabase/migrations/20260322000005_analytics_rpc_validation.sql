-- Rally 003: Fix analytics abuse vector — validate user target inside the RPC
-- The RLS policy on profile_analytics doesn't protect the main write path
-- because record_profile_event is SECURITY DEFINER (bypasses RLS).
-- Validation must happen inside the function itself.

CREATE OR REPLACE FUNCTION public.record_profile_event(
  p_user_id uuid,
  p_event_type text,
  p_viewer_role text DEFAULT NULL,
  p_viewer_location text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate target user exists and is not deleted
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND deleted_at IS NULL
  ) THEN
    -- Silently skip — don't reveal user existence to anonymous callers
    RETURN;
  END IF;

  INSERT INTO public.profile_analytics (user_id, event_type, viewer_role, viewer_location, occurred_at)
  VALUES (p_user_id, p_event_type, p_viewer_role, p_viewer_location, now());
END;
$$;

-- DOWN migration:
-- CREATE OR REPLACE FUNCTION public.record_profile_event(
--   p_user_id uuid, p_event_type text, p_viewer_role text DEFAULT NULL, p_viewer_location text DEFAULT NULL
-- ) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   INSERT INTO public.profile_analytics (user_id, event_type, viewer_role, viewer_location, occurred_at)
--   VALUES (p_user_id, p_event_type, p_viewer_role, p_viewer_location, now());
-- END;
-- $$;
