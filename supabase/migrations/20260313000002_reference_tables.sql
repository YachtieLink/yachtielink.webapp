-- Migration 002: Reference Tables
-- Lookup/seed tables that don't depend on user data

-- ─────────────────────────────────────────
-- departments
-- Multi-select options for crew departments
-- ─────────────────────────────────────────
create table public.departments (
  id   uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- roles
-- Reference list of crew positions, grouped by department.
-- Users pick via typeahead; free-text "Other" entries are
-- tracked separately for periodic promotion into this list.
-- ─────────────────────────────────────────
create table public.roles (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  department text not null,   -- matches departments.name
  is_senior  boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index roles_department_idx on public.roles (department);
create index roles_name_trgm_idx  on public.roles using gin (name gin_trgm_ops);

-- ─────────────────────────────────────────
-- certification_types
-- Hierarchical reference list for the cert tree UI.
-- ─────────────────────────────────────────
create table public.certification_types (
  id                   uuid primary key default gen_random_uuid(),
  name                 text unique not null,
  short_name           text,
  category             text not null,
  issuing_bodies       text[],
  keywords             text[],
  typical_validity_years integer,   -- null = lifetime
  created_at           timestamptz not null default now()
);

create index cert_types_category_idx  on public.certification_types (category);
create index cert_types_keywords_idx  on public.certification_types using gin (keywords);
create index cert_types_name_trgm_idx on public.certification_types using gin (name gin_trgm_ops);

-- ─────────────────────────────────────────
-- templates
-- PDF presentation templates (free vs paid)
-- ─────────────────────────────────────────
create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  preview_url text,
  is_free     boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- other_role_entries
-- Tracks free-text "Other" role submissions for periodic
-- promotion into the roles seed list.
-- ─────────────────────────────────────────
create table public.other_role_entries (
  id         uuid primary key default gen_random_uuid(),
  value      text not null,
  department text,
  submitted_by uuid,   -- user_id (soft ref — no FK to avoid cascade issues)
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- other_cert_entries
-- Tracks free-text "Other" cert type submissions.
-- ─────────────────────────────────────────
create table public.other_cert_entries (
  id         uuid primary key default gen_random_uuid(),
  value      text not null,
  category   text,
  submitted_by uuid,
  created_at timestamptz not null default now()
);
