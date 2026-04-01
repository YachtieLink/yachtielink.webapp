-- Migration: Ghost endorser columns on endorsements + claim RPC
-- Enables ghost profiles to write endorsements without a real auth account.
-- Design: dual nullable columns with CHECK constraint — exactly one must be set.
-- On claim: endorsements migrate from ghost_endorser_id → endorser_id atomically.

-- 1. Drop NOT NULL on endorser_id (ghost endorsements have no auth.users row)
ALTER TABLE public.endorsements
  ALTER COLUMN endorser_id DROP NOT NULL;

-- 2. Add ghost_endorser_id reference
ALTER TABLE public.endorsements
  ADD COLUMN ghost_endorser_id UUID REFERENCES public.ghost_profiles(id) ON DELETE SET NULL;

-- 3. Enforce exactly one endorser: real user XOR ghost profile
--    Existing rows all have endorser_id set, so the constraint is safe to add now.
ALTER TABLE public.endorsements
  ADD CONSTRAINT endorser_exactly_one CHECK (
    (endorser_id IS NOT NULL AND ghost_endorser_id IS NULL) OR
    (endorser_id IS NULL     AND ghost_endorser_id IS NOT NULL)
  );

-- 4. Unique index for ghost endorsements
--    The existing unique_endorsement constraint (endorser_id, recipient_id, yacht_id)
--    does not cover ghost rows because NULL != NULL in UNIQUE constraints.
--    This index prevents duplicate ghost endorsements for the same combo.
CREATE UNIQUE INDEX endorsements_ghost_unique
  ON public.endorsements(ghost_endorser_id, recipient_id, yacht_id)
  WHERE ghost_endorser_id IS NOT NULL;

-- 5. Index for fast lookup during claim migration
CREATE INDEX endorsements_ghost_endorser_idx
  ON public.endorsements(ghost_endorser_id)
  WHERE ghost_endorser_id IS NOT NULL;

-- 6. claim_ghost_profile RPC
--    Called from POST /api/ghost-profiles/claim after successful auth.
--    NO CALLER-SUPPLIED IDENTITY — identity is resolved internally from auth.uid()
--    and auth.users to prevent parameter-injection privilege escalation.
--    Atomically:
--      a. Resolves claiming user from auth.uid() (not a parameter)
--      b. Fetches verified email from auth.users (not a parameter)
--      c. Finds all unclaimed ghost profiles matching that email
--      d. Handles conflicts (soft-deletes ghost endorsements that would
--         collide with an existing real endorsement from the same user)
--      e. Migrates remaining endorsements: ghost_endorser_id → endorser_id
--      f. Marks ghost profiles as claimed
--      g. Sets onboarding_complete = true so the user bypasses the wizard
--    Returns JSONB: { migrated_count, ghost_ids_claimed }
CREATE OR REPLACE FUNCTION public.claim_ghost_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claiming_user_id UUID;
  v_claiming_email   TEXT;
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

  -- Find all unclaimed ghosts matching this email
  FOR v_ghost_id IN
    SELECT id
    FROM public.ghost_profiles
    WHERE email = v_claiming_email
      AND account_status = 'ghost'
  LOOP
    -- Step A: Soft-delete ghost endorsements that would violate the existing
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

    -- Step B: Migrate remaining ghost endorsements to the real user account
    UPDATE public.endorsements
    SET
      endorser_id       = v_claiming_user_id,
      ghost_endorser_id = NULL
    WHERE ghost_endorser_id = v_ghost_id
      AND deleted_at IS NULL;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_migrated_count := v_migrated_count + v_row_count;

    -- Step C: Mark ghost as claimed
    UPDATE public.ghost_profiles
    SET
      account_status = 'claimed',
      claimed_by     = v_claiming_user_id
    WHERE id = v_ghost_id;

    v_claimed_ids := array_append(v_claimed_ids, v_ghost_id);
  END LOOP;

  -- Step D: If any ghost was claimed, bypass the onboarding wizard.
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

GRANT EXECUTE ON FUNCTION public.claim_ghost_profile() TO authenticated;
