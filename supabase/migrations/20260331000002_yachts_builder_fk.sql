-- Migration: Replace yachts.builder text with builder_id FK to yacht_builders
-- Clean slate — no real users, safe to drop and rebuild
-- Part of Rally 006 — Builder Autocomplete

-- ═══════════════════════════════════════════════════════════
-- 1. Add builder_id FK column
-- ═══════════════════════════════════════════════════════════

alter table public.yachts
  add column if not exists builder_id uuid references public.yacht_builders(id) on delete set null;

-- ═══════════════════════════════════════════════════════════
-- 2. Backfill existing yachts (best-effort match on name)
-- ═══════════════════════════════════════════════════════════

update public.yachts y
set builder_id = yb.id
from public.yacht_builders yb
where lower(regexp_replace(unaccent(trim(y.builder)), '[^a-z0-9 ]', '', 'g')) = yb.name_normalized
  and y.builder is not null
  and y.builder_id is null;

-- ═══════════════════════════════════════════════════════════
-- 3. Drop the old text column
-- ═══════════════════════════════════════════════════════════

alter table public.yachts
  drop column if exists builder;

-- ═══════════════════════════════════════════════════════════
-- 4. Index for FK lookups
-- ═══════════════════════════════════════════════════════════

create index if not exists yachts_builder_id_idx on public.yachts (builder_id);
