-- Migration 019: Endorsement Virality — phone matching, shareable links
--
-- 1. Add is_shareable column for reusable share links (no specific recipient)
-- 2. Update has_recipient constraint to allow shareable links and phone-only requests
-- 3. Add phone index for faster lookups
-- 4. Extend link_pending_requests_to_new_user() to also match on phone/whatsapp
-- 5. Add UPDATE trigger so existing users adding phone/email still get matched
--
-- Idempotent — safe to re-run.

-- ── 1. Add is_shareable column ─────────────────────────────────────────────────

ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS is_shareable boolean NOT NULL DEFAULT false;

-- ── 2. Update has_recipient constraint ─────────────────────────────────────────
-- Allow: email OR user_id OR phone OR shareable link

ALTER TABLE public.endorsement_requests
  DROP CONSTRAINT IF EXISTS has_recipient;

ALTER TABLE public.endorsement_requests
  ADD CONSTRAINT has_recipient CHECK (
    recipient_email IS NOT NULL
    OR recipient_user_id IS NOT NULL
    OR recipient_phone IS NOT NULL
    OR is_shareable = true
  );

-- ── 3. Phone index ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_endorsement_requests_recipient_phone
  ON public.endorsement_requests(recipient_phone)
  WHERE recipient_phone IS NOT NULL;

-- ── 4. Extend trigger function for phone/whatsapp matching ─────────────────────

CREATE OR REPLACE FUNCTION public.link_pending_requests_to_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Match on email
  IF NEW.email IS NOT NULL THEN
    UPDATE public.endorsement_requests
    SET recipient_user_id = NEW.id
    WHERE lower(recipient_email) = lower(NEW.email)
      AND recipient_user_id IS NULL;
  END IF;

  -- Match on phone number
  IF NEW.phone IS NOT NULL THEN
    UPDATE public.endorsement_requests
    SET recipient_user_id = NEW.id
    WHERE recipient_phone = NEW.phone
      AND recipient_user_id IS NULL;
  END IF;

  -- Match on whatsapp number
  IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp IS DISTINCT FROM NEW.phone THEN
    UPDATE public.endorsement_requests
    SET recipient_user_id = NEW.id
    WHERE recipient_phone = NEW.whatsapp
      AND recipient_user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 5. Fire trigger on user UPDATE too (phone/whatsapp/email changes) ──────────

DROP TRIGGER IF EXISTS on_user_updated_link_endorsements ON public.users;

CREATE TRIGGER on_user_updated_link_endorsements
  AFTER UPDATE OF phone, whatsapp, email ON public.users
  FOR EACH ROW
  WHEN (
    NEW.phone IS DISTINCT FROM OLD.phone
    OR NEW.whatsapp IS DISTINCT FROM OLD.whatsapp
    OR NEW.email IS DISTINCT FROM OLD.email
  )
  EXECUTE FUNCTION public.link_pending_requests_to_new_user();

-- ── 6. Unique index for shareable links (one per requester+yacht) ──────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_endorsement_requests_shareable_unique
  ON public.endorsement_requests(requester_id, yacht_id)
  WHERE is_shareable = true AND cancelled_at IS NULL;
