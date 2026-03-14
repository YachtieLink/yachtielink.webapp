-- Migration 012: Sprint 5 — Endorsement loop additions
-- Adds cancelled_at, recipient_phone to endorsement_requests
-- Adds rate-limit RPC endorsement_requests_today()
-- Adds performance indexes (token index already exists from 000003 — use IF NOT EXISTS)

-- 1. Add recipient_phone (nullable, for phone-based tracking — SMS not sent in Sprint 5)
ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS recipient_phone text;

-- 2. Add cancelled_at timestamp (used instead of status='cancelled' for precise timing)
ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 3. Rate-limit function: count today's requests for a user (last 24h, not cancelled)
CREATE OR REPLACE FUNCTION public.endorsement_requests_today(p_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM public.endorsement_requests
  WHERE requester_id = p_user_id
    AND created_at > now() - interval '1 day'
    AND cancelled_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.endorsement_requests_today(uuid) TO authenticated;

-- 4. Indexes (IF NOT EXISTS for safety — token index may already exist)
CREATE INDEX IF NOT EXISTS idx_endorsement_requests_token
  ON public.endorsement_requests(token);

CREATE INDEX IF NOT EXISTS idx_endorsement_requests_recipient_email
  ON public.endorsement_requests(recipient_email);

CREATE INDEX IF NOT EXISTS idx_endorsements_recipient_not_deleted
  ON public.endorsements(recipient_id)
  WHERE deleted_at IS NULL;
