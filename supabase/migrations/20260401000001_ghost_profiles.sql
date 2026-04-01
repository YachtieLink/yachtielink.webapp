-- Migration: Ghost Profiles
-- New table for non-authenticated endorsers.
-- Ghost profiles hold identity info for people who write endorsements
-- without creating a full YachtieLink account. They can claim their
-- profile later to merge it with a real account.

CREATE TABLE public.ghost_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT        NOT NULL,
  email          TEXT,
  phone          TEXT,
  primary_role   TEXT,

  -- How the contact info was verified:
  -- email_token    = recipient_email on an endorsement request (link click proves delivery)
  -- whatsapp_token = recipient_phone on an endorsement request (WhatsApp delivery)
  -- unverified     = shareable link (user typed their email, not pre-verified)
  verified_via   TEXT        CHECK (verified_via IN ('email_token', 'whatsapp_token', 'unverified')),

  account_status TEXT        NOT NULL DEFAULT 'ghost'
                             CHECK (account_status IN ('ghost', 'claimed')),
  claimed_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ghost_full_name_length CHECK (char_length(full_name) BETWEEN 1 AND 200),
  CONSTRAINT ghost_role_length CHECK (primary_role IS NULL OR char_length(primary_role) <= 100)
);

-- One ghost per unique verified email (partial — only when email is present)
CREATE UNIQUE INDEX ghost_profiles_email_key
  ON public.ghost_profiles(email)
  WHERE email IS NOT NULL;

-- One ghost per unique verified phone (partial — only when phone is present)
CREATE UNIQUE INDEX ghost_profiles_phone_key
  ON public.ghost_profiles(phone)
  WHERE phone IS NOT NULL;

CREATE INDEX ghost_profiles_status_idx
  ON public.ghost_profiles(account_status)
  WHERE account_status = 'ghost';

CREATE INDEX ghost_profiles_claimed_by_idx
  ON public.ghost_profiles(claimed_by)
  WHERE claimed_by IS NOT NULL;

-- RLS: enabled. All writes go through service_role (admin client) in API routes.
-- Users can only see their own ghost records after claiming.
ALTER TABLE public.ghost_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ghost_profiles: own read after claim"
  ON public.ghost_profiles FOR SELECT
  USING (claimed_by = auth.uid());
