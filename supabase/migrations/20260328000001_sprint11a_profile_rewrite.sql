-- Sprint 11a: Public Profile Rewrite Foundation
-- Lays down schema changes needed across 11a/b/c
-- Made idempotent with IF NOT EXISTS for safe re-runs

-- 1. View mode preference (Profile | Portfolio | Rich Portfolio)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_view_mode text NOT NULL DEFAULT 'portfolio';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_profile_view_mode_check
    CHECK (profile_view_mode IN ('profile', 'portfolio', 'rich_portfolio'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Scrim preset + accent colour for hero presentation
ALTER TABLE users ADD COLUMN IF NOT EXISTS scrim_preset text NOT NULL DEFAULT 'dark';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_scrim_preset_check
    CHECK (scrim_preset IN ('dark', 'light', 'teal', 'warm'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE users ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT 'teal';
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_accent_color_check
    CHECK (accent_color IN ('teal', 'coral', 'navy', 'amber', 'sand'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Photo focal points (percentage-based, 0-100)
ALTER TABLE user_photos ADD COLUMN IF NOT EXISTS focal_x numeric NOT NULL DEFAULT 50;
DO $$ BEGIN
  ALTER TABLE user_photos ADD CONSTRAINT user_photos_focal_x_check
    CHECK (focal_x >= 0 AND focal_x <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE user_photos ADD COLUMN IF NOT EXISTS focal_y numeric NOT NULL DEFAULT 50;
DO $$ BEGIN
  ALTER TABLE user_photos ADD CONSTRAINT user_photos_focal_y_check
    CHECK (focal_y >= 0 AND focal_y <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Note: endorsements.is_pinned already exists (20260313000003_core_tables.sql:169)
-- No additional endorsement schema changes needed.
