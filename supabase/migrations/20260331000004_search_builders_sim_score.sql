-- Migration: Add similarity score to search_builders RPC
-- Enables resolveOrCreateBuilder to trust fuzzy matches above a threshold
-- Part of Rally 006 — Builder Autocomplete

-- Must drop first — return type changed (added sim column)
drop function if exists public.search_builders(text, int);

create or replace function public.search_builders(
  p_query text,
  p_limit int default 5
)
returns table (
  id   uuid,
  name text,
  sim  real
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
  if q_norm = '' or q_norm is null then
    return;
  end if;

  return query
  select
    yb.id,
    yb.name,
    case
      when yb.name_normalized like q_norm || '%' and length(q_norm) >= 3
      then greatest(similarity(yb.name_normalized, q_norm), 0.8)
      else similarity(yb.name_normalized, q_norm)
    end as sim
  from yacht_builders yb
  where
    yb.name_normalized like q_norm || '%'
    or similarity(yb.name_normalized, q_norm) > 0.3
  order by
    case when yb.name_normalized like q_norm || '%' then 0 else 1 end,
    similarity(yb.name_normalized, q_norm) desc,
    yb.name
  limit safe_limit;
end;
$$;

revoke all on function public.search_builders(text, int) from anon;
grant execute on function public.search_builders(text, int) to authenticated;
