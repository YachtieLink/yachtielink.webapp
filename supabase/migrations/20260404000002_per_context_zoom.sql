-- Per-context zoom levels for Pro photo feature
ALTER TABLE user_photos ADD COLUMN avatar_zoom numeric NOT NULL DEFAULT 1;
ALTER TABLE user_photos ADD COLUMN hero_zoom numeric NOT NULL DEFAULT 1;
ALTER TABLE user_photos ADD COLUMN cv_zoom numeric NOT NULL DEFAULT 1;

ALTER TABLE user_photos ADD CONSTRAINT user_photos_avatar_zoom_range CHECK (avatar_zoom >= 1 AND avatar_zoom <= 5);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_hero_zoom_range CHECK (hero_zoom >= 1 AND hero_zoom <= 5);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_cv_zoom_range CHECK (cv_zoom >= 1 AND cv_zoom <= 5);
