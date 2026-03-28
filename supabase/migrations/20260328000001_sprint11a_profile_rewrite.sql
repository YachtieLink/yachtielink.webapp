-- Sprint 11a: Public Profile Rewrite Foundation
-- Lays down schema changes needed across 11a/b/c

-- 1. View mode preference (Profile | Portfolio | Rich Portfolio)
ALTER TABLE users ADD COLUMN profile_view_mode text NOT NULL DEFAULT 'portfolio'
  CHECK (profile_view_mode IN ('profile', 'portfolio', 'rich_portfolio'));

-- 2. Scrim preset + accent colour for hero presentation
ALTER TABLE users ADD COLUMN scrim_preset text NOT NULL DEFAULT 'dark'
  CHECK (scrim_preset IN ('dark', 'light', 'teal', 'warm'));
ALTER TABLE users ADD COLUMN accent_color text NOT NULL DEFAULT 'teal'
  CHECK (accent_color IN ('teal', 'coral', 'navy', 'amber', 'sand'));

-- 3. Photo focal points (percentage-based, 0-100)
ALTER TABLE user_photos ADD COLUMN focal_x numeric NOT NULL DEFAULT 50
  CHECK (focal_x >= 0 AND focal_x <= 100);
ALTER TABLE user_photos ADD COLUMN focal_y numeric NOT NULL DEFAULT 50
  CHECK (focal_y >= 0 AND focal_y <= 100);

-- Note: endorsements.is_pinned already exists (20260313000003_core_tables.sql:169)
-- No additional endorsement schema changes needed.
