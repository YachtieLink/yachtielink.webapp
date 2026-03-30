-- Sprint 11c: Add profile_template column for bento grid template selection
-- Made idempotent for safe re-runs

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_template text NOT NULL DEFAULT 'classic';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_profile_template_check
    CHECK (profile_template IN ('classic', 'bold'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
