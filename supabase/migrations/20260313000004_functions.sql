-- Migration 004: Functions and Triggers

-- ─────────────────────────────────────────
-- Auto-create user profile on signup
-- Fires after insert on auth.users
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- Auto-update updated_at on row change
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_attachments_updated_at
  before update on public.attachments
  for each row execute function public.set_updated_at();

create trigger set_endorsements_updated_at
  before update on public.endorsements
  for each row execute function public.set_updated_at();

create trigger set_certifications_updated_at
  before update on public.certifications
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────
-- are_coworkers(user_a, user_b)
-- True if both users share at least one yacht attachment.
-- Used for endorsement gating.
-- ─────────────────────────────────────────
create or replace function public.are_coworkers(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attachments a1
    join public.attachments a2 on a1.yacht_id = a2.yacht_id
    where a1.user_id = user_a
      and a2.user_id = user_b
      and a1.deleted_at is null
      and a2.deleted_at is null
  );
$$;

-- ─────────────────────────────────────────
-- are_coworkers_on_yacht(user_a, user_b, yacht)
-- Stricter: shared attachment on a specific yacht.
-- ─────────────────────────────────────────
create or replace function public.are_coworkers_on_yacht(user_a uuid, user_b uuid, yacht uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attachments a1
    join public.attachments a2 on a1.yacht_id = a2.yacht_id
    where a1.user_id = user_a
      and a2.user_id = user_b
      and a1.yacht_id = yacht
      and a1.deleted_at is null
      and a2.deleted_at is null
  );
$$;

-- ─────────────────────────────────────────
-- yacht_crew_count(yacht_id)
-- Returns distinct active crew count for a yacht.
-- ─────────────────────────────────────────
create or replace function public.yacht_crew_count(yacht uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct user_id)::integer
  from public.attachments
  where yacht_id = yacht
    and deleted_at is null;
$$;

-- ─────────────────────────────────────────
-- get_yacht_crew_threshold(size_category)
-- Minimum crew count for a yacht to become "established".
-- ─────────────────────────────────────────
create or replace function public.get_yacht_crew_threshold(size_category text)
returns integer
language sql
immutable
as $$
  select case size_category
    when 'small'      then 3
    when 'medium'     then 5
    when 'large'      then 8
    when 'superyacht' then 12
    else 5
  end;
$$;

-- ─────────────────────────────────────────
-- check_yacht_established(yacht_id)
-- True when yacht has been around 60+ days AND has enough crew.
-- ─────────────────────────────────────────
create or replace function public.check_yacht_established(yacht_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    y.is_established
    or (
      y.created_at < now() - interval '60 days'
      and public.yacht_crew_count(y.id) >= public.get_yacht_crew_threshold(y.size_category)
    )
  from public.yachts y
  where y.id = yacht_id;
$$;

-- ─────────────────────────────────────────
-- get_colleagues(user_id)
-- Returns users who share at least one yacht attachment
-- with the given user. Computed on access (not stored).
-- ─────────────────────────────────────────
create or replace function public.get_colleagues(p_user_id uuid)
returns table (
  colleague_id  uuid,
  shared_yachts uuid[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a2.user_id as colleague_id,
    array_agg(distinct a2.yacht_id) as shared_yachts
  from public.attachments a1
  join public.attachments a2
    on a1.yacht_id = a2.yacht_id
   and a2.user_id != p_user_id
  where a1.user_id = p_user_id
    and a1.deleted_at is null
    and a2.deleted_at is null
  group by a2.user_id;
$$;

-- ─────────────────────────────────────────
-- handle_available(handle)
-- True if the handle is not taken and not reserved.
-- Reserved words: www, api, app, admin, support, help, about,
--   login, logout, signup, register, legal, terms, privacy,
--   u, r, auth, callback, verify, reset, crew, yacht
-- ─────────────────────────────────────────
create or replace function public.handle_available(p_handle text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- must not be taken
    not exists (select 1 from public.users where handle = lower(p_handle))
    -- must not be reserved
    and lower(p_handle) not in (
      'www', 'api', 'app', 'admin', 'support', 'help', 'about',
      'login', 'logout', 'signup', 'register', 'legal', 'terms', 'privacy',
      'u', 'r', 'auth', 'callback', 'verify', 'reset', 'crew', 'yacht',
      'yachtielink', 'yachtie', 'link', 'settings', 'billing', 'upgrade'
    );
$$;

-- ─────────────────────────────────────────
-- suggest_handles(full_name, birth_year?)
-- Returns up to 3 handle suggestions when desired handle is taken.
-- ─────────────────────────────────────────
create or replace function public.suggest_handles(
  p_full_name  text,
  p_birth_year integer default null
)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  base      text;
  parts     text[];
  first     text;
  last      text;
  candidates text[];
  result    text[] := '{}';
  candidate text;
begin
  -- Normalise: lowercase, strip non-alphanumeric (keep spaces)
  base  := lower(trim(regexp_replace(p_full_name, '[^a-z0-9 ]', '', 'gi')));
  parts := string_to_array(base, ' ');
  first := parts[1];
  last  := parts[array_length(parts, 1)];

  -- Build candidates (in preference order)
  candidates := array[
    first || '-' || last,
    first || '.' || last,
    substring(first, 1, 1) || last,
    first || '-' || last || coalesce('-' || p_birth_year::text, ''),
    first || coalesce(p_birth_year::text, ''),
    last || coalesce(p_birth_year::text, '')
  ];

  foreach candidate in array candidates loop
    -- Sanitise
    candidate := regexp_replace(candidate, '[^a-z0-9-]', '-', 'g');
    candidate := regexp_replace(candidate, '-{2,}', '-', 'g');
    candidate := trim(both '-' from candidate);

    -- Skip if too short, too long, or unavailable
    if char_length(candidate) >= 3
      and char_length(candidate) <= 30
      and public.handle_available(candidate)
    then
      result := array_append(result, candidate);
    end if;

    exit when array_length(result, 1) >= 3;
  end loop;

  return result;
end;
$$;
