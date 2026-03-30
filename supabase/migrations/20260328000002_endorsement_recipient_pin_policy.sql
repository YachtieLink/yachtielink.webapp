-- Sprint 11b: Allow endorsement recipients to update is_pinned
-- Made idempotent for safe re-runs

DO $$ BEGIN
  CREATE POLICY "endorsements: recipient pin"
    ON public.endorsements FOR UPDATE
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
