-- Rally 003 Sprint 6: Allow re-endorsement after soft-delete
-- The existing constraint blocks re-endorsement because soft-deleted
-- rows still occupy the unique slot.

-- Drop the old constraint
ALTER TABLE endorsements DROP CONSTRAINT IF EXISTS unique_endorsement;

-- Replace with a partial unique index that only covers active endorsements
CREATE UNIQUE INDEX IF NOT EXISTS idx_endorsements_unique_active
  ON endorsements (endorser_id, recipient_id, yacht_id)
  WHERE deleted_at IS NULL;
