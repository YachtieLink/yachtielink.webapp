-- Grant execute on public RPC functions to anon + authenticated roles.
-- Without these grants, Supabase silently returns null for .rpc() calls,
-- causing the handle availability check to never resolve.

grant execute on function public.handle_available(text)          to anon, authenticated;
grant execute on function public.suggest_handles(text, int)      to anon, authenticated;
grant execute on function public.are_coworkers(uuid, uuid)       to authenticated;
grant execute on function public.are_coworkers_on_yacht(uuid, uuid, uuid) to authenticated;
grant execute on function public.yacht_crew_count(uuid)          to authenticated;
grant execute on function public.get_yacht_crew_threshold(text)  to authenticated;
grant execute on function public.check_yacht_established(uuid)   to authenticated;
grant execute on function public.get_colleagues(uuid)            to authenticated;
