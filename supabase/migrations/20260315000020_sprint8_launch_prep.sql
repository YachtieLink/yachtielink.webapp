-- Sprint 8: Launch Prep
-- Adds deleted_at to users for GDPR soft-deletion, plus performance indexes.

-- 1. Soft-delete column on users for GDPR account deletion
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Performance indexes

CREATE INDEX IF NOT EXISTS idx_attachments_user_active
  ON public.attachments (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_endorsements_recipient_active
  ON public.endorsements (recipient_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_endorsements_endorser_active
  ON public.endorsements (endorser_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_endorsement_requests_requester
  ON public.endorsement_requests (requester_id);

CREATE INDEX IF NOT EXISTS idx_certifications_user
  ON public.certifications (user_id);

CREATE INDEX IF NOT EXISTS idx_users_handle
  ON public.users (handle)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
