-- Rally 003 Sprint 7: Prevent duplicate endorsement requests to same phone/yacht
-- Without this, a user can spam the same phone number with requests
-- Valid statuses per CHECK constraint: pending, accepted, expired, cancelled
-- We only block dupes for active (pending) requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_endorsement_requests_phone_dedup
  ON endorsement_requests (requester_id, yacht_id, recipient_phone)
  WHERE recipient_phone IS NOT NULL
    AND cancelled_at IS NULL
    AND status = 'pending';
