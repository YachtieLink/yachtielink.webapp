-- Rally 006: Upgrade search_yachts() with multi-signal matching
--
-- Changes:
--   1. Add optional p_builder and p_length_min/p_length_max params
--   2. Return builder, cover_photo_url, crew_count, current_crew_count
--   3. Boost similarity when builder or length matches
--   4. Try prefix variants (M/Y, S/Y, MY, SY) for better fuzzy matching
--   5. Keep auth-only access (no anon)

-- Drop old function signatures to avoid overload conflicts
drop function if exists public.search_yachts(text, int);

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
  q_norm text := lower(trim(p_query));
  safe_limit int := least(p_limit, 50);
begin
  return query
  with prefix_variants(variant) as (
    values
      (q_norm),
      ('m/y ' || q_norm),
      ('s/y ' || q_norm),
      ('my ' || q_norm),
      ('sy ' || q_norm),
      ('mv ' || q_norm),
      ('fv ' || q_norm)
  ),
  base_scores as (
    select
      y.id,
      y.name,
      y.yacht_type,
      y.length_meters,
      y.flag_state,
      y.builder,
      y.cover_photo_url,
      greatest(
        similarity(y.name_normalized, q_norm),
        (select coalesce(max(similarity(y.name_normalized, pv.variant)), 0) from prefix_variants pv)
      ) as base_sim
    from yachts y
    where
      -- Use the trigram index for the base query
      y.name_normalized % q_norm
      or y.name_normalized ilike '%' || q_norm || '%'
      -- Also try prefix variants for broader matching
      or exists (
        select 1 from prefix_variants pv
        where y.name_normalized % pv.variant
           or y.name_normalized ilike '%' || pv.variant || '%'
      )
  )
  select
    bs.id,
    bs.name,
    bs.yacht_type,
    bs.length_meters,
    bs.flag_state,
    bs.builder,
    bs.cover_photo_url,
    -- Total crew: all active attachments (past + current)
    (select count(distinct a.user_id)
     from attachments a
     where a.yacht_id = bs.id and a.deleted_at is null
    ) as crew_count,
    -- Current crew: active attachments with no end date
    (select count(distinct a.user_id)
     from attachments a
     where a.yacht_id = bs.id and a.deleted_at is null and a.ended_at is null
    ) as current_crew_count,
    -- Boosted similarity score
    -- Only apply builder/length boosts on fuzzy matches (base_sim < 1.0)
    -- Perfect name matches should never be outranked by partial matches
    -- that happen to have matching builder/length
    (bs.base_sim
     + case
         when bs.base_sim < 1.0
              and p_builder is not null
              and bs.builder is not null
              and lower(trim(bs.builder)) = lower(trim(p_builder))
         then 0.2
         else 0
       end
     + case
         when bs.base_sim < 1.0
              and p_length_min is not null
              and p_length_max is not null
              and bs.length_meters is not null
              and bs.length_meters between p_length_min and p_length_max
         then 0.15
         else 0
       end
    )::real as sim
  from base_scores bs
  where bs.base_sim > 0.05  -- low threshold to catch fuzzy prefix matches
  order by sim desc, bs.name
  limit safe_limit;
end;
$$;

-- Revoke from anon (defense in depth)
revoke all on function public.search_yachts(text, text, numeric, numeric, int) from anon;
grant execute on function public.search_yachts(text, text, numeric, numeric, int) to authenticated;

-- TODO (Phase 2): Add roman numeral ↔ digit normalization for even fuzzier matching
-- e.g. "Excellence 5" should boost similarity with "M/Y Excellence V"
