-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015 — Backfill recipient_user_id on existing endorsement requests
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Links all historical endorsement_requests to user accounts where the
-- recipient_email matches a user's email. Only affects rows where
-- recipient_user_id is currently NULL (safe to re-run).
-- ─────────────────────────────────────────────────────────────────────────────

update public.endorsement_requests er
set recipient_user_id = u.id
from public.users u
where lower(u.email) = lower(er.recipient_email)
  and er.recipient_user_id is null;
