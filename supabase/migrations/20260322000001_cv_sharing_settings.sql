-- Sprint 11.2: CV sharing settings
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cv_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS cv_public_source text DEFAULT 'generated'
    CHECK (cv_public_source IN ('generated', 'uploaded'));

COMMENT ON COLUMN users.cv_public IS 'Whether CV is downloadable from public profile';
COMMENT ON COLUMN users.cv_public_source IS 'Which CV to serve on public profile: generated PDF or uploaded file';
