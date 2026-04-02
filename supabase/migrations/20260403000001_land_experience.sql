-- Land (shore-side) employment history
CREATE TABLE public.land_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  start_date DATE,
  end_date DATE,
  description TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE public.land_experience ENABLE ROW LEVEL SECURITY;

-- Owner full access
CREATE POLICY "land_experience: owner full access"
  ON public.land_experience
  FOR ALL
  USING (user_id = auth.uid());

-- Public read (for visible profiles)
CREATE POLICY "land_experience: public read"
  ON public.land_experience
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = land_experience.user_id
        AND u.onboarding_complete = true
    )
  );

-- Index
CREATE INDEX idx_land_experience_user_id ON public.land_experience(user_id);
