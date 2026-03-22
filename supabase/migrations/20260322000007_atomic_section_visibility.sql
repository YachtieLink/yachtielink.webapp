-- Rally 003 Sprint 6: Atomic section_visibility update
-- Replaces the read-modify-write pattern that had a TOCTOU race condition

CREATE OR REPLACE FUNCTION update_section_visibility(
  p_user_id uuid,
  p_section text,
  p_visible boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET section_visibility = jsonb_set(
    COALESCE(section_visibility, '{}'::jsonb),
    ARRAY[p_section],
    to_jsonb(p_visible)
  ),
  updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- RLS: Only the user can call this for themselves
-- The function is SECURITY DEFINER but we validate p_user_id = auth.uid() via the API route
