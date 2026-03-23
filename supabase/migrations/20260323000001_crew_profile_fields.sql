-- Migration: Crew Profile Fields
-- Adds personal detail fields (DOB, nationality, smoker, tattoo, visa, license, languages)
-- to users, builder to yachts, and employment enrichment to attachments.
-- Part of Sprint CV-Parse Wave 1.

-- ═══════════════════════════════════════════════════════════
-- 1. Users — personal detail fields
-- ═══════════════════════════════════════════════════════════

alter table public.users
  add column if not exists date_of_birth date,
  add column if not exists nationality text,
  add column if not exists smoker text
    check (smoker in ('non_smoker', 'smoker', 'social_smoker')),
  add column if not exists tattoo_visibility text
    check (tattoo_visibility in ('none', 'visible', 'non_visible', 'not_specified')),
  add column if not exists visa_types text[] default '{}',
  add column if not exists drivers_license text,
  add column if not exists languages jsonb default '[]',
  add column if not exists show_dob boolean not null default false,
  add column if not exists show_nationality boolean not null default true;

-- Column-level REVOKE on date_of_birth — sensitive PII.
-- Anon users (public profile viewers without auth) cannot read exact DOB.
-- Authenticated users CAN read it (needed for own profile edit page).
-- Public profile displays age (computed server-side), never the date itself.
revoke select (date_of_birth) on public.users from anon;

-- ═══════════════════════════════════════════════════════════
-- 2. Yachts — builder/shipyard
-- ═══════════════════════════════════════════════════════════

alter table public.yachts
  add column if not exists builder text;

-- ═══════════════════════════════════════════════════════════
-- 3. Attachments — employment enrichment
-- ═══════════════════════════════════════════════════════════

alter table public.attachments
  add column if not exists employment_type text
    check (employment_type in ('permanent', 'seasonal', 'freelance', 'relief', 'temporary')),
  add column if not exists yacht_program text
    check (yacht_program in ('private', 'charter', 'private_charter')),
  add column if not exists description text,
  add column if not exists cruising_area text;

-- Description length constraint (same pattern as notes_length on attachments)
alter table public.attachments
  add constraint description_length check (char_length(description) <= 2000);
