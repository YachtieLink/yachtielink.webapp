-- Migration: Sprint 12 — Yacht Graph
-- Adds RPCs for yacht detail page, colleague explorer, sea time, mutual colleagues.
-- get_sea_time() already fixed in migration 20260321000001 (returns table, correct date math).

-- ═══════════════════════════════════════════════════════════
-- 1. PER-YACHT SEA TIME BREAKDOWN
-- ═══════════════════════════════════════════════════════════

create or replace function public.get_sea_time_detailed(p_user_id uuid)
returns table (
  yacht_id uuid,
  yacht_name text,
  role_label text,
  started_at date,
  ended_at date,
  days int,
  is_current boolean
)
language plpgsql stable security definer
set search_path = public
as $$
begin
  -- Only allow users to query their own sea time detail
  -- (aggregated sea time via get_sea_time is public, but per-yacht breakdown has role/dates)
  if auth.uid() != p_user_id then
    raise exception 'forbidden: can only query own sea time detail';
  end if;

  return query
  select
    a.yacht_id,
    y.name as yacht_name,
    a.role_label,
    a.started_at,
    a.ended_at,
    (coalesce(a.ended_at, current_date) - a.started_at)::int as days,
    (a.ended_at is null) as is_current
  from attachments a
  join yachts y on y.id = a.yacht_id
  where a.user_id = p_user_id
    and a.deleted_at is null
    and a.started_at is not null
  order by a.started_at desc;
end;
$$;

grant execute on function public.get_sea_time_detailed(uuid) to authenticated;


-- ═══════════════════════════════════════════════════════════
-- 2. ENDORSEMENT COUNT ON A YACHT
-- ═══════════════════════════════════════════════════════════

create or replace function public.get_yacht_endorsement_count(p_yacht_id uuid)
returns int
language sql stable security definer
set search_path = public
as $$
  select count(*)::int
  from endorsements
  where yacht_id = p_yacht_id
    and deleted_at is null;
$$;

grant execute on function public.get_yacht_endorsement_count(uuid) to authenticated;


-- ═══════════════════════════════════════════════════════════
-- 3. AVERAGE TENURE (days) ON A YACHT
-- ═══════════════════════════════════════════════════════════

create or replace function public.get_yacht_avg_tenure_days(p_yacht_id uuid)
returns int
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    avg(
      (coalesce(ended_at, current_date) - started_at)
    )::int,
    0
  )
  from attachments
  where yacht_id = p_yacht_id
    and deleted_at is null
    and started_at is not null;
$$;

grant execute on function public.get_yacht_avg_tenure_days(uuid) to authenticated;


-- ═══════════════════════════════════════════════════════════
-- 4. MUTUAL COLLEAGUES (2nd-degree social proof)
-- ═══════════════════════════════════════════════════════════
-- Given a viewer and a profile owner, returns the viewer's
-- colleagues who have ALSO worked with the profile owner.

create or replace function public.get_mutual_colleagues(
  p_viewer_id uuid,
  p_profile_id uuid
)
returns table (
  mutual_colleague_id uuid
)
language sql stable security definer
set search_path = public
as $$
  with viewer_colleagues as (
    select distinct a2.user_id as colleague_id
    from attachments a1
    join attachments a2
      on a1.yacht_id = a2.yacht_id
      and a2.user_id != p_viewer_id
    where a1.user_id = p_viewer_id
      and a1.deleted_at is null
      and a2.deleted_at is null
  ),
  profile_colleagues as (
    select distinct a2.user_id as colleague_id
    from attachments a1
    join attachments a2
      on a1.yacht_id = a2.yacht_id
      and a2.user_id != p_profile_id
    where a1.user_id = p_profile_id
      and a1.deleted_at is null
      and a2.deleted_at is null
  )
  select vc.colleague_id as mutual_colleague_id
  from viewer_colleagues vc
  where vc.colleague_id in (select colleague_id from profile_colleagues)
    and vc.colleague_id != p_profile_id;
$$;

grant execute on function public.get_mutual_colleagues(uuid, uuid) to authenticated;


-- ═══════════════════════════════════════════════════════════
-- 5. HANDLE INDEX VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 5a. FIX: Add missing GRANT EXECUTE on get_sea_time
-- ═══════════════════════════════════════════════════════════
-- Migration 20260321000001 dropped and recreated get_sea_time()
-- but never re-granted execute permission. Without this, Supabase
-- returns { data: null } silently — sea time appears as 0 everywhere.
grant execute on function public.get_sea_time(uuid) to authenticated;
grant execute on function public.get_sea_time(uuid) to anon;


-- ═══════════════════════════════════════════════════════════
-- 5b. Handle index
-- ═══════════════════════════════════════════════════════════
-- Verify a unique partial index exists on handle.
-- The core_tables migration created users_handle_idx (possibly non-unique).
-- Drop and recreate as unique partial to ensure correctness.
drop index if exists public.users_handle_idx;
create unique index users_handle_idx on public.users(handle) where handle is not null;
