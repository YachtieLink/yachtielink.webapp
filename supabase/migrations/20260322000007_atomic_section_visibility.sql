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
  -- Ownership check: caller can only modify their own visibility
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

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

GRANT EXECUTE ON FUNCTION public.update_section_visibility(uuid, text, boolean) TO authenticated;
