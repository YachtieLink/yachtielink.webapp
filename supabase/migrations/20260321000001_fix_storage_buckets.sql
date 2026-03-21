-- Migration: Fix storage buckets + function consistency
-- Sprint 10.1 — 2026-03-21
--
-- IMPORTANT: RLS policies for user-photos and user-gallery already exist
-- from migration 20260317000021_profile_robustness.sql.
-- This migration ONLY creates the bucket rows. Do NOT duplicate policies.

-- ─── Create user-photos bucket ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-photos',
  'user-photos',
  true,
  5242880,                      -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ─── Create user-gallery bucket ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-gallery',
  'user-gallery',
  true,
  5242880,                      -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ─── Fix yacht-photos RLS: ex-crew should not be able to write ───
-- Drop the existing insert policy and recreate with deleted_at check
drop policy if exists "yacht-photos: crew insert" on storage.objects;

create policy "yacht-photos: crew insert (active only)"
  on storage.objects for insert
  with check (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id::text = (string_to_array(name, '/'))[1]
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

-- Also fix the update and delete policies
drop policy if exists "yacht-photos: crew update" on storage.objects;

create policy "yacht-photos: crew update (active only)"
  on storage.objects for update
  using (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id::text = (string_to_array(name, '/'))[1]
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

drop policy if exists "yacht-photos: crew delete" on storage.objects;

create policy "yacht-photos: crew delete (active only)"
  on storage.objects for delete
  using (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id::text = (string_to_array(name, '/'))[1]
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

-- ─── Fix get_sea_time() — add SECURITY DEFINER + search_path ───
create or replace function public.get_sea_time(p_user_id uuid)
returns table (total_days int, yacht_count int)
language sql stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(
      case
        when ended_at is not null then (ended_at - started_at)
        else (current_date - started_at)
      end
    ), 0)::int as total_days,
    count(distinct yacht_id)::int as yacht_count
  from attachments
  where user_id = p_user_id
    and deleted_at is null
    and started_at is not null;
$$;
