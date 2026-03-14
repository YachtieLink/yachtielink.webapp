-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 016 — Endorsement request improvements
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Update get_endorsement_request_by_token to include the requester's
--    attachment data (role, dates) so the write form can prefill "Their role"
--    and date fields.
--
-- 2. Add partial unique index to prevent duplicate pending requests from
--    the same requester to the same recipient for the same yacht.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Updated token lookup RPC ──────────────────────────────────────────────

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
        'display_name',      u.display_name,
        'full_name',         u.full_name,
        'profile_photo_url', u.profile_photo_url
      ) as requester,
      json_build_object(
        'id',            y.id,
        'name',          y.name,
        'yacht_type',    y.yacht_type,
        'length_meters', y.length_meters,
        'flag_state',    y.flag_state,
        'year_built',    y.year_built
      ) as yacht,
      -- Requester's own attachment to this yacht — used to prefill
      -- "Their role" and suggest dates in the write endorsement form.
      (
        select json_build_object(
          'role_label', a.role_label,
          'started_at', a.started_at,
          'ended_at',   a.ended_at
        )
        from public.attachments a
        where a.user_id = er.requester_id
          and a.yacht_id = er.yacht_id
          and a.deleted_at is null
        order by a.started_at desc
        limit 1
      ) as requester_attachment
    from public.endorsement_requests er
    left join public.users  u on u.id = er.requester_id
    left join public.yachts y on y.id = er.yacht_id
    where er.token = p_token
    limit 1
  ) r;
$$;


-- ── 2. Prevent duplicate pending requests ────────────────────────────────────
-- One active (non-cancelled) request per requester+yacht+recipient_email combo.

create unique index if not exists endorsement_requests_no_duplicate_pending
  on public.endorsement_requests (requester_id, yacht_id, recipient_email)
  where cancelled_at is null and status != 'accepted';
