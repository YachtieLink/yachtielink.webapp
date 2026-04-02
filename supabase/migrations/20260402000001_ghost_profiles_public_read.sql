-- Migration: Ghost Profiles — public display read policy
-- The existing "own read after claim" policy only lets the claimer see their
-- ghost record. Public profile visitors need to read ghost_endorser data via
-- the endorsements join. This policy exposes only unclaimed ghosts
-- (account_status = 'ghost'). Claimed ghosts automatically become invisible
-- because their status changes to 'claimed'.

CREATE POLICY "ghost_profiles: public display read"
  ON public.ghost_profiles FOR SELECT
  USING (account_status = 'ghost');
