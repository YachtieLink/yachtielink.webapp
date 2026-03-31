-- Migration: Update search_yachts to join through yacht_builders
-- Also add search_builders RPC for autocomplete
-- Part of Rally 006 — Builder Autocomplete

-- ═══════════════════════════════════════════════════════════
-- 1. Update search_yachts — join through yacht_builders
-- ═══════════════════════════════════════════════════════════

create or replace function public.search_yachts(
  p_query text,
  p_builder text default null,
  p_length_min numeric default null,
  p_length_max numeric default null,
  p_limit int default 10
)
returns table (
  id               uuid,
  name             text,
  yacht_type       text,
  length_meters    numeric,
  flag_state       text,
  builder          text,
  cover_photo_url  text,
  crew_count       bigint,
  current_crew_count bigint,
  sim              real
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q_raw text := lower(trim(p_query));
  q_bare text := strip_yacht_prefix(p_query);
  q_prefix text := yacht_prefix_type(p_query);
  p_builder_norm text := case when p_builder is not null
    then lower(regexp_replace(unaccent(trim(p_builder)), '[^a-z0-9 ]', '', 'g'))
    else null end;
  safe_limit int := least(p_limit, 50);
begin
  return query
  with base_scores as (
    select
      y.id,
      y.name,
      y.yacht_type,
      y.length_meters,
      y.flag_state,
      yb.name as builder,
      y.cover_photo_url,
      similarity(strip_yacht_prefix(y.name), q_bare) as bare_sim,
      similarity(y.name_normalized, q_raw) as full_sim,
      yacht_prefix_type(y.name) as y_prefix,
      yb.name_normalized as builder_norm
    from yachts y
    left join yacht_builders yb on yb.id = y.builder_id
    where
      strip_yacht_prefix(y.name) % q_bare
      or y.name_normalized % q_raw
      or y.name_normalized ilike '%' || q_bare || '%'
  )
  select
    bs.id,
    bs.name,
    bs.yacht_type,
    bs.length_meters,
    bs.flag_state,
    bs.builder,
    bs.cover_photo_url,
    (select count(distinct a.user_id)
     from attachments a
     where a.yacht_id = bs.id and a.deleted_at is null
    ) as crew_count,
    (select count(distinct a.user_id)
     from attachments a
     where a.yacht_id = bs.id and a.deleted_at is null and a.ended_at is null
    ) as current_crew_count,
    (
      case
        when q_prefix is not null or bs.y_prefix is not null
        then bs.bare_sim
        else greatest(bs.bare_sim, bs.full_sim)
      end
      + case
          when q_prefix is not null
               and bs.y_prefix is not null
               and q_prefix <> bs.y_prefix
          then -0.3
          else 0
        end
      + case
          when p_builder_norm is not null
               and bs.builder_norm is not null
               and bs.builder_norm = p_builder_norm
          then 0.2
          else 0
        end
      + case
          when p_length_min is not null
               and p_length_max is not null
               and bs.length_meters is not null
               and bs.length_meters between p_length_min and p_length_max
          then 0.15
          else 0
        end
    )::real as sim
  from base_scores bs
  where bs.bare_sim > 0.1
     or (q_prefix is null and bs.y_prefix is null and bs.full_sim > 0.1)
  order by sim desc, bs.name
  limit safe_limit;
end;
$$;

revoke all on function public.search_yachts(text, text, numeric, numeric, int) from anon;
grant execute on function public.search_yachts(text, text, numeric, numeric, int) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- 2. search_builders RPC for autocomplete
-- ═══════════════════════════════════════════════════════════

create or replace function public.search_builders(
  p_query text,
  p_limit int default 5
)
returns table (
  id   uuid,
  name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q_norm text := lower(regexp_replace(unaccent(trim(p_query)), '[^a-z0-9 ]', '', 'g'));
  safe_limit int := least(p_limit, 20);
begin
  -- Return nothing for empty queries
  if q_norm = '' or q_norm is null then
    return;
  end if;

  return query
  -- Prefix match first (fast, exact), then trigram fallback
  select yb.id, yb.name
  from yacht_builders yb
  where
    yb.name_normalized like q_norm || '%'
    or similarity(yb.name_normalized, q_norm) > 0.3
  order by
    -- Exact prefix matches first
    case when yb.name_normalized like q_norm || '%' then 0 else 1 end,
    -- Then by similarity score
    similarity(yb.name_normalized, q_norm) desc,
    yb.name
  limit safe_limit;
end;
$$;

revoke all on function public.search_builders(text, int) from anon;
grant execute on function public.search_builders(text, int) to authenticated;
