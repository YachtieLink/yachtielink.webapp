-- Reports (profiles, yachts, endorsements) + Bug Reports
-- Drop stale reports table from abandoned prior session (no prod data)
DROP TABLE IF EXISTS public.reports CASCADE;

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'yacht', 'attachment', 'endorsement')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 2000),
  category TEXT NOT NULL,
  -- Profile categories: fake_profile, false_employment_claim, inappropriate_content, harassment, spam, other
  -- Yacht categories: duplicate_yacht, incorrect_details, other
  duplicate_of_yacht_id UUID REFERENCES public.yachts(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Validate categories match target_type
  CONSTRAINT valid_profile_category CHECK (
    target_type != 'profile' OR category IN ('fake_profile', 'false_employment_claim', 'inappropriate_content', 'harassment', 'spam', 'other')
  ),
  CONSTRAINT valid_yacht_category CHECK (
    target_type != 'yacht' OR category IN ('duplicate_yacht', 'incorrect_details', 'other')
  ),
  -- duplicate_of_yacht_id required when category is duplicate_yacht
  CONSTRAINT duplicate_requires_target CHECK (
    category != 'duplicate_yacht' OR duplicate_of_yacht_id IS NOT NULL
  )
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports and read their own
CREATE POLICY "reports: user insert" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports: user read own" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_duplicate ON public.reports(duplicate_of_yacht_id) WHERE duplicate_of_yacht_id IS NOT NULL;

-- Bug Reports
CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'ui_issue', 'performance', 'other')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  page_url TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'fixed', 'wontfix')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bug_reports: user insert" ON public.bug_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bug_reports: user read own" ON public.bug_reports
  FOR SELECT USING (user_id = auth.uid());
