-- Migration: Add recipient_name to endorsement_requests
-- Used for off-platform invites where we don't have a user record.

ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS recipient_name text;

COMMENT ON COLUMN public.endorsement_requests.recipient_name
  IS 'Display name for off-platform recipients (from invite form). Null for on-platform colleagues.';
