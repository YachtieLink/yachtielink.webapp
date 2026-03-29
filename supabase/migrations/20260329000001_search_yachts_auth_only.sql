-- Sprint 12 review fix: revoke anon access to search_yachts
-- and add server-side limit cap (defense-in-depth).
--
-- search_yachts is SECURITY DEFINER + uses pg_trgm similarity(),
-- which is CPU-intensive. Exposing it to anon is a DoS vector.

-- 1. Revoke anon access
revoke execute on function public.search_yachts(text, int) from anon;

-- 2. Replace function with limit cap
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
  limit least(p_limit, 50);
$$;

grant execute on function public.search_yachts(text, int) to authenticated;
