-- Allow authenticated users to update aliases on approved certifications
-- Required for alias-learning in CV import (learnCertificationAlias)
-- Scoped: only aliases and updated_at can change via app code

CREATE POLICY "certifications_registry: authenticated update"
  ON public.certifications_registry
  FOR UPDATE
  TO authenticated
  USING (review_status = 'approved')
  WITH CHECK (review_status = 'approved');
