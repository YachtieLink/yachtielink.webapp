-- Rally 006: Fix yacht search prefix handling
--
-- Problem: "M/Y WTR" matches "M/Y Go" at 0.36 because the shared "M/Y " prefix
-- inflates trigram similarity. Short yacht names are disproportionately affected.
--
-- Fix: Strip vessel type prefixes from BOTH the query and stored names before
-- trigram comparison. Use the prefix as a separate type filter signal instead.
-- Prefixes: M/Y, S/Y, MY, SY, MV, FV, Motoryacht, Motor Yacht, Sailing Yacht, etc.

-- Helper: strip common yacht prefixes to get the bare vessel name
create or replace function public.strip_yacht_prefix(raw text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    lower(trim(raw)),
    '^(m/y|s/y|my|sy|mv|fv|motor\s*yacht|sailing\s*yacht|sail\s*yacht)\s+',
    '',
    'i'
  );
$$;

-- Helper: extract the yacht prefix (returns 'motor' | 'sail' | null)
create or replace function public.yacht_prefix_type(raw text)
returns text
language sql
immutable
as $$
  select case
    when lower(trim(raw)) ~ '^(m/y|my|mv|fv|motor\s*yacht)\s' then 'motor'
    when lower(trim(raw)) ~ '^(s/y|sy|sailing\s*yacht|sail\s*yacht)\s' then 'sail'
    else null
  end;
$$;

-- Recreate search_yachts with prefix-aware comparison
drop function if exists public.search_yachts(text, text, numeric, numeric, int);

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
      y.builder,
      y.cover_photo_url,
      -- Compare bare names (prefix stripped) for true name similarity
      similarity(strip_yacht_prefix(y.name), q_bare) as bare_sim,
      -- Also check full-string similarity as a fallback
      similarity(y.name_normalized, q_raw) as full_sim,
      -- Prefix match: query says M/Y but yacht is S/Y = penalty
      yacht_prefix_type(y.name) as y_prefix
    from yachts y
    where
      -- Trigram index match on bare name
      strip_yacht_prefix(y.name) % q_bare
      -- Or full-string match (catches cases where prefix IS the distinguishing part)
      or y.name_normalized % q_raw
      -- Or substring match
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
    -- Total crew
    (select count(distinct a.user_id)
     from attachments a
     where a.yacht_id = bs.id and a.deleted_at is null
    ) as crew_count,
    -- Current crew
    (select count(distinct a.user_id)
     from attachments a
     where a.yacht_id = bs.id and a.deleted_at is null and a.ended_at is null
    ) as current_crew_count,
    -- Score: prefer bare name similarity when prefixes exist (prevents "M/Y" inflating scores)
    -- Only use full_sim when neither the query nor the yacht has a prefix to strip
    (
      case
        when q_prefix is not null or bs.y_prefix is not null
        then bs.bare_sim  -- prefix exists: use stripped comparison
        else greatest(bs.bare_sim, bs.full_sim)  -- no prefix: use best of both
      end
      -- Prefix mismatch penalty: M/Y query vs S/Y yacht (or vice versa) = -0.3
      + case
          when q_prefix is not null
               and bs.y_prefix is not null
               and q_prefix <> bs.y_prefix
          then -0.3
          else 0
        end
      -- Builder boost
      + case
          when greatest(bs.bare_sim, bs.full_sim) < 1.0
               and p_builder is not null
               and bs.builder is not null
               and lower(trim(bs.builder)) = lower(trim(p_builder))
          then 0.2
          else 0
        end
      -- Length boost
      + case
          when greatest(bs.bare_sim, bs.full_sim) < 1.0
               and p_length_min is not null
               and p_length_max is not null
               and bs.length_meters is not null
               and bs.length_meters between p_length_min and p_length_max
          then 0.15
          else 0
        end
    )::real as sim
  from base_scores bs
  where bs.bare_sim > 0.1 or (q_prefix is null and bs.y_prefix is null and bs.full_sim > 0.1)
  order by sim desc, bs.name
  limit safe_limit;
end;
$$;

-- Permissions
revoke all on function public.search_yachts(text, text, numeric, numeric, int) from anon;
grant execute on function public.search_yachts(text, text, numeric, numeric, int) to authenticated;

-- Index on stripped names for performance (optional — trigram index on name_normalized still catches most)
-- create index if not exists idx_yachts_bare_name_trgm on yachts using gin (strip_yacht_prefix(name) gin_trgm_ops);
