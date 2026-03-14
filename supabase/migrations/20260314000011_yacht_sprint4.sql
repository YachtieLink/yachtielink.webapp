-- Sprint 4: Yacht Graph
-- Adds cover photo URL to yachts, near-miss log table,
-- fuzzy yacht search RPC, and yacht-photos storage bucket.
-- ─────────────────────────────────────────

-- Cover photo URL on yacht entity
alter table public.yachts add column cover_photo_url text;

-- ─────────────────────────────────────────
-- yacht_near_miss_log
-- Records when a user nearly created a duplicate yacht.
-- action = 'used_existing' | 'created_new'
-- Used in Phase 2 to build merge tooling with real data.
-- ─────────────────────────────────────────
create table public.yacht_near_miss_log (
  id             uuid primary key default gen_random_uuid(),
  search_term    text not null,
  candidate_ids  uuid[] not null default '{}',
  action         text not null check (action in ('used_existing', 'created_new')),
  chosen_id      uuid references public.yachts (id) on delete set null,
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

alter table public.yacht_near_miss_log enable row level security;

create policy "near_miss_log: own insert"
  on public.yacht_near_miss_log for insert
  to authenticated
  with check (created_by = auth.uid());

-- ─────────────────────────────────────────
-- search_yachts(query, limit)
-- Fuzzy trigram search across yacht names.
-- Returns results ordered by similarity score descending.
-- ─────────────────────────────────────────
create or replace function public.search_yachts(p_query text, p_limit int default 10)
returns table (
  id            uuid,
  name          text,
  yacht_type    text,
  length_meters numeric,
  flag_state    text,
  sim           real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    id,
    name,
    yacht_type,
    length_meters,
    flag_state,
    greatest(
      similarity(name_normalized, lower(trim(p_query))),
      0::real
    ) as sim
  from public.yachts
  where
    name_normalized % lower(trim(p_query))
    or name_normalized ilike '%' || lower(trim(p_query)) || '%'
  order by sim desc, name
  limit p_limit;
$$;

grant execute on function public.search_yachts(text, int) to anon, authenticated;

-- ─────────────────────────────────────────
-- yacht-photos bucket
-- Public bucket — cover photo CDN URLs served without auth.
-- RLS gates who can write: only crew with an attachment to the yacht.
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'yacht-photos',
  'yacht-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "yacht-photos: public read"
  on storage.objects for select
  using (bucket_id = 'yacht-photos');

create policy "yacht-photos: crew insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id = (string_to_array(name, '/'))[1]::uuid
        and user_id = auth.uid()
    )
  );

create policy "yacht-photos: crew update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id = (string_to_array(name, '/'))[1]::uuid
        and user_id = auth.uid()
    )
  );

create policy "yacht-photos: crew delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'yacht-photos'
    and exists (
      select 1 from public.attachments
      where yacht_id = (string_to_array(name, '/'))[1]::uuid
        and user_id = auth.uid()
    )
  );
