-- Experience Transfers — move employment between yacht nodes with audit trail
-- + Endorsement dormant flag for yacht graph integrity

-- Track experience transfers for audit trail
CREATE TABLE public.experience_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employment_id UUID NOT NULL,
  from_yacht_id UUID NOT NULL REFERENCES public.yachts(id),
  to_yacht_id UUID NOT NULL REFERENCES public.yachts(id),
  transferred_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experience_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experience_transfers: user read own" ON public.experience_transfers
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "experience_transfers: user insert own" ON public.experience_transfers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add dormant flag to endorsements for yacht graph integrity
-- Endorsement is dormant when endorser and endorsee are NOT both attached to the same yacht
ALTER TABLE public.endorsements ADD COLUMN IF NOT EXISTS is_dormant BOOLEAN DEFAULT false;
