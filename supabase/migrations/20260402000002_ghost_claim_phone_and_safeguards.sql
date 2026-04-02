-- Migration: Ghost claim improvements
-- 1. Index on users.phone for phone dedup queries (blocker 4)
-- 2. Extend claim_ghost_profile RPC to also match ghosts by phone (blocker 3)
-- 3. Add self-endorsement guard to claim migration (blocker 5)

-- 1. Index for phone-based user lookups (prevents sequential scan)
CREATE INDEX IF NOT EXISTS users_phone_idx ON public.users(phone) WHERE phone IS NOT NULL;

-- 2+3. Replace claim_ghost_profile: match by phone, guard self-endorsements
CREATE OR REPLACE FUNCTION public.claim_ghost_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claiming_user_id UUID;
  v_claiming_email   TEXT;
  v_claiming_phone   TEXT;
  v_ghost_id         UUID;
  v_migrated_count   INTEGER := 0;
  v_claimed_ids      UUID[]  := '{}';
  v_row_count        INTEGER;
BEGIN
  -- Resolve identity from session — never trust caller-supplied values
  v_claiming_user_id := auth.uid();
  IF v_claiming_user_id IS NULL THEN
    RAISE EXCEPTION 'claim_ghost_profile: not authenticated';
  END IF;

  -- Fetch email from auth.users — prevents caller from supplying someone else's email
  SELECT email INTO v_claiming_email
  FROM auth.users
  WHERE id = v_claiming_user_id;

  IF v_claiming_email IS NULL THEN
    RAISE EXCEPTION 'claim_ghost_profile: user has no email address';
  END IF;

  -- Fetch phone from public.users (may be NULL — phone-only ghosts need this)
  SELECT phone INTO v_claiming_phone
  FROM public.users
  WHERE id = v_claiming_user_id;

  -- Find all unclaimed ghosts matching by email OR phone
  FOR v_ghost_id IN
    SELECT id
    FROM public.ghost_profiles
    WHERE account_status = 'ghost'
      AND (
        email = v_claiming_email
        OR (v_claiming_phone IS NOT NULL AND phone = v_claiming_phone)
      )
  LOOP
    -- Step A: Soft-delete ghost endorsements that would be self-endorsements
    --         after migration (claiming user is the recipient).
    UPDATE public.endorsements ge
    SET deleted_at = now()
    WHERE ge.ghost_endorser_id = v_ghost_id
      AND ge.deleted_at IS NULL
      AND ge.recipient_id = v_claiming_user_id;

    -- Step B: Soft-delete ghost endorsements that would violate the existing
    --         unique_endorsement constraint after migration (same endorser+recipient+yacht).
    UPDATE public.endorsements ge
    SET deleted_at = now()
    WHERE ge.ghost_endorser_id = v_ghost_id
      AND ge.deleted_at IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.endorsements re
        WHERE re.endorser_id  = v_claiming_user_id
          AND re.recipient_id = ge.recipient_id
          AND re.yacht_id     = ge.yacht_id
          AND re.deleted_at IS NULL
      );

    -- Step C: Migrate remaining ghost endorsements to the real user account
    UPDATE public.endorsements
    SET
      endorser_id       = v_claiming_user_id,
      ghost_endorser_id = NULL
    WHERE ghost_endorser_id = v_ghost_id
      AND deleted_at IS NULL;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_migrated_count := v_migrated_count + v_row_count;

    -- Step D: Mark ghost as claimed
    UPDATE public.ghost_profiles
    SET
      account_status = 'claimed',
      claimed_by     = v_claiming_user_id
    WHERE id = v_ghost_id;

    v_claimed_ids := array_append(v_claimed_ids, v_ghost_id);
  END LOOP;

  -- Step E: If any ghost was claimed, bypass the onboarding wizard.
  --         The claim flow populates the user's endorsements — that IS their onboarding.
  IF cardinality(v_claimed_ids) > 0 THEN
    UPDATE public.users
    SET onboarding_complete = true
    WHERE id = v_claiming_user_id;
  END IF;

  RETURN jsonb_build_object(
    'migrated_count',   v_migrated_count,
    'ghost_ids_claimed', to_jsonb(v_claimed_ids)
  );
END;
$$;
