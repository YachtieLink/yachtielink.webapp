-- Migration: Add reminded_at column to endorsement_requests
-- Tracks when a reminder was sent (max 1 reminder per request, after 7 days).

ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS reminded_at timestamptz;

COMMENT ON COLUMN public.endorsement_requests.reminded_at
  IS 'When a reminder was sent for this request (null = not reminded). Max 1 reminder allowed.';
