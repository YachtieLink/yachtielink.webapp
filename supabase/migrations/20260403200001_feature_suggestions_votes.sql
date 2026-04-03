-- Feature suggestions & votes tables for in-app roadmap feedback
-- Users can submit feature ideas and vote on others' suggestions

-- ============================================================
-- feature_suggestions
-- ============================================================
CREATE TABLE public.feature_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  description TEXT CHECK (char_length(description) <= 1000),
  category TEXT CHECK (category IN ('profile', 'network', 'cv', 'insights', 'general')),
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'under_review', 'planned', 'in_progress', 'shipped', 'declined')),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read suggestions
CREATE POLICY "feature_suggestions: authenticated select"
  ON public.feature_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own suggestions
CREATE POLICY "feature_suggestions: user insert"
  ON public.feature_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own suggestions
CREATE POLICY "feature_suggestions: user delete"
  ON public.feature_suggestions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_feature_suggestions_status ON public.feature_suggestions(status);
CREATE INDEX idx_feature_suggestions_vote_count ON public.feature_suggestions(vote_count DESC);
CREATE INDEX idx_feature_suggestions_user_id ON public.feature_suggestions(user_id);

-- ============================================================
-- feature_votes
-- ============================================================
CREATE TABLE public.feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL REFERENCES public.feature_suggestions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, suggestion_id)
);

ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read votes (needed to check own vote status)
CREATE POLICY "feature_votes: authenticated select"
  ON public.feature_votes FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own votes
CREATE POLICY "feature_votes: user insert"
  ON public.feature_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes (unvote)
CREATE POLICY "feature_votes: user delete"
  ON public.feature_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_feature_votes_suggestion_id ON public.feature_votes(suggestion_id);
CREATE INDEX idx_feature_votes_user_id ON public.feature_votes(user_id);

-- ============================================================
-- Trigger: maintain vote_count on feature_suggestions
-- vote_count maintained by SECURITY DEFINER trigger; no client UPDATE policy is intentional.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_suggestion_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_suggestions
    SET vote_count = vote_count + 1
    WHERE id = NEW.suggestion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feature_suggestions
    SET vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = OLD.suggestion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_feature_votes_count
  AFTER INSERT OR DELETE ON public.feature_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suggestion_vote_count();
