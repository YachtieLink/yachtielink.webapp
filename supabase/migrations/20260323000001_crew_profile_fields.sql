-- Migration: Crew Profile Fields
-- Adds crew profile detail fields (UF1-UF9, see field-registry.md)
-- to users, builder to yachts, and employment enrichment to attachments.
-- Part of Sprint CV-Parse Wave 1.

-- ═══════════════════════════════════════════════════════════
-- 1. Users — personal detail fields
-- ═══════════════════════════════════════════════════════════

alter table public.users
  add column if not exists dob date,
  add column if not exists home_country text,
  add column if not exists smoke_pref text
    check (smoke_pref in ('non_smoker', 'smoker', 'social_smoker')),
  add column if not exists appearance_note text
    check (appearance_note in ('none', 'visible', 'non_visible', 'not_specified')),
  add column if not exists travel_docs text[] default '{}',
  add column if not exists license_info text,
  add column if not exists languages jsonb default '[]',
  add column if not exists show_dob boolean not null default false,
  add column if not exists show_home_country boolean not null default true;

-- Column-level REVOKE on dob — anon sees computed age only, never the date.
revoke select (dob) on public.users from anon;

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
