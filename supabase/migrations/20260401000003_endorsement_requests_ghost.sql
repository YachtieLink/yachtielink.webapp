-- Migration: Endorsement requests — ghost profile additions
-- Adds sent_via (delivery channel → maps to ghost.verified_via)
-- Adds suggested_endorsements (LLM starters for the write form, Wave 2 population)
-- Updates get_endorsement_request_by_token RPC to expose recipient_phone + sent_via
-- Adds get_ghost_profile_summary RPC for the claim landing page

-- ── 1. sent_via column ───────────────────────────────────────────────────────
-- Tracks how the request was delivered. Populated at request-creation time.
-- Maps to ghost_profiles.verified_via:
--   email     → email_token
--   whatsapp  → whatsapp_token
--   shareable_link → unverified
ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS sent_via TEXT
    CHECK (sent_via IN ('email', 'whatsapp', 'shareable_link'));

-- ── 2. suggested_endorsements column ─────────────────────────────────────────
-- JSONB array of LLM-generated endorsement starters.
-- Populated at request creation from endorsee's parsed CV data (Wave 2).
-- Format: [{ "text": "Excellent with tender ops..." }, ...]
ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS suggested_endorsements JSONB;

-- ── 3. Update token lookup RPC to include ghost-relevant fields ───────────────
-- Adds recipient_phone and sent_via so the guest endorsement API can
-- determine how to create the ghost profile.
CREATE OR REPLACE FUNCTION public.get_endorsement_request_by_token(p_token TEXT)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT row_to_json(r)
  FROM (
    SELECT
      er.id,
      er.token,
      er.requester_id,
      er.yacht_id,
      er.recipient_email,
      er.recipient_user_id,
      er.recipient_phone,
      er.sent_via,
      er.status,
      er.expires_at,
      er.created_at,
      er.accepted_at,
      er.cancelled_at,
      er.suggested_endorsements,
      json_build_object(
        'display_name',      u.display_name,
        'full_name',         u.full_name,
        'profile_photo_url', u.profile_photo_url
      ) AS requester,
      json_build_object(
        'id',            y.id,
        'name',          y.name,
        'yacht_type',    y.yacht_type,
        'length_meters', y.length_meters,
        'flag_state',    y.flag_state,
        'year_built',    y.year_built
      ) AS yacht,
      -- Requester's attachment to this yacht (role + dates for prefill)
      (
        SELECT json_build_object(
          'role_label', a.role_label,
          'started_at', a.started_at,
          'ended_at',   a.ended_at
        )
        FROM public.attachments a
        WHERE a.user_id  = er.requester_id
          AND a.yacht_id = er.yacht_id
          AND a.deleted_at IS NULL
        ORDER BY a.started_at DESC
        LIMIT 1
      ) AS requester_attachment
    FROM public.endorsement_requests er
    LEFT JOIN public.users  u ON u.id = er.requester_id
    LEFT JOIN public.yachts y ON y.id = er.yacht_id
    WHERE er.token = p_token
    LIMIT 1
  ) r;
$$;

-- No new GRANTs needed — existing grants from migration 013 persist with OR REPLACE.

-- ── 4. get_ghost_profile_summary RPC ─────────────────────────────────────────
-- Used by the claim landing page (/claim/[id]) to show a ghost's identity
-- without exposing full PII. Returns NULL if the ghost is already claimed
-- or does not exist.
CREATE OR REPLACE FUNCTION public.get_ghost_profile_summary(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ghost            RECORD;
  v_endorsement_count INTEGER;
BEGIN
  SELECT id, full_name, primary_role, account_status, verified_via
  INTO v_ghost
  FROM public.ghost_profiles
  WHERE id = p_id;

  IF NOT FOUND OR v_ghost.account_status = 'claimed' THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO v_endorsement_count
  FROM public.endorsements
  WHERE ghost_endorser_id = p_id
    AND deleted_at IS NULL;

  RETURN jsonb_build_object(
    'id',               v_ghost.id,
    'full_name',        v_ghost.full_name,
    'primary_role',     v_ghost.primary_role,
    'verified_via',     v_ghost.verified_via,
    'endorsement_count', v_endorsement_count
  );
END;
$$;

-- Anon users need access — the claim landing page is publicly accessible
GRANT EXECUTE ON FUNCTION public.get_ghost_profile_summary(UUID) TO anon, authenticated;
