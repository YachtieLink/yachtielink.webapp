-- Migration: Add context columns to user_photos for Pro contextual photo assignment.
-- Pro users can assign different photos for avatar, hero, and CV contexts.
-- Free users always use the first photo for all contexts.

ALTER TABLE public.user_photos
  ADD COLUMN IF NOT EXISTS is_avatar boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_photos
  ADD COLUMN IF NOT EXISTS is_hero boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_photos
  ADD COLUMN IF NOT EXISTS is_cv boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_photos.is_avatar IS 'Pro feature: photo used for avatar context';
COMMENT ON COLUMN public.user_photos.is_hero IS 'Pro feature: photo used for hero/OG context';
COMMENT ON COLUMN public.user_photos.is_cv IS 'Pro feature: photo used for CV/PDF context';
