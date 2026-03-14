-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013 — Public token lookup for endorsement deep links
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Problem: endorsement_requests RLS only allows requester/recipient reads.
-- The /r/:token deep link page needs to read a request by its secret token
-- without requiring the visitor to be authenticated. The token IS the
-- credential — it is a 32-byte hex string that is unguessable.
--
-- Solution: SECURITY DEFINER function. Runs as DB owner (bypasses RLS),
-- returns only the single row that matches the exact token, and includes
-- the joined requester + yacht data the page needs.
--
-- Safe because:
--   • Only the exact matching row is returned (no table scan leakage)
--   • Token is cryptographically random — enumeration is infeasible
--   • users and yachts already have public RLS read policies
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_endorsement_request_by_token(p_token text)
returns json
language sql
security definer
stable
set search_path = public
as $$
  select row_to_json(r)
  from (
    select
      er.id,
      er.token,
      er.requester_id,
      er.yacht_id,
      er.recipient_email,
      er.recipient_user_id,
      er.status,
      er.expires_at,
      er.created_at,
      er.accepted_at,
      er.cancelled_at,
      json_build_object(
        'display_name', u.display_name,
        'full_name',    u.full_name,
        'profile_photo_url', u.profile_photo_url
      ) as requester,
      json_build_object(
        'id',            y.id,
        'name',          y.name,
        'yacht_type',    y.yacht_type,
        'length_meters', y.length_meters,
        'flag_state',    y.flag_state,
        'year_built',    y.year_built
      ) as yacht
    from public.endorsement_requests er
    left join public.users  u on u.id = er.requester_id
    left join public.yachts y on y.id = er.yacht_id
    where er.token = p_token
    limit 1
  ) r;
$$;

-- Grant to anon (unauthenticated visitors) and authenticated users
grant execute on function public.get_endorsement_request_by_token(text) to anon, authenticated;
