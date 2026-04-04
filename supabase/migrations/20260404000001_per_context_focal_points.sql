-- Per-context focal points for Pro photo feature
-- Each context (avatar, hero, CV) gets its own focal point.
-- NULL = fall back to base focal_x/focal_y.

ALTER TABLE user_photos ADD COLUMN avatar_focal_x numeric;
ALTER TABLE user_photos ADD COLUMN avatar_focal_y numeric;
ALTER TABLE user_photos ADD COLUMN hero_focal_x numeric;
ALTER TABLE user_photos ADD COLUMN hero_focal_y numeric;
ALTER TABLE user_photos ADD COLUMN cv_focal_x numeric;
ALTER TABLE user_photos ADD COLUMN cv_focal_y numeric;

ALTER TABLE user_photos ADD CONSTRAINT user_photos_avatar_focal_x_range CHECK (avatar_focal_x >= 0 AND avatar_focal_x <= 100);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_avatar_focal_y_range CHECK (avatar_focal_y >= 0 AND avatar_focal_y <= 100);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_hero_focal_x_range CHECK (hero_focal_x >= 0 AND hero_focal_x <= 100);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_hero_focal_y_range CHECK (hero_focal_y >= 0 AND hero_focal_y <= 100);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_cv_focal_x_range CHECK (cv_focal_x >= 0 AND cv_focal_x <= 100);
ALTER TABLE user_photos ADD CONSTRAINT user_photos_cv_focal_y_range CHECK (cv_focal_y >= 0 AND cv_focal_y <= 100);
