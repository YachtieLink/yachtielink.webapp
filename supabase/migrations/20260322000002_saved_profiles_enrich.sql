-- Sprint 11.3: Enrich saved profiles with notes + availability watch
ALTER TABLE saved_profiles
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS watching boolean DEFAULT false;

-- Partial index for "watching only" filter
CREATE INDEX IF NOT EXISTS idx_saved_profiles_watching
  ON saved_profiles (user_id)
  WHERE watching = true;

COMMENT ON COLUMN saved_profiles.notes IS 'Private notes visible only to the saver';
COMMENT ON COLUMN saved_profiles.watching IS 'Watch for availability changes (Sprint 14 wires notifications)';
