-- Migration: Add show_nationality_flag to users table
-- Allows users to toggle nationality flag display on their public profile.
-- Sits alongside show_dob and show_home_country (added in 20260323000001).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS show_nationality_flag BOOLEAN NOT NULL DEFAULT false;
