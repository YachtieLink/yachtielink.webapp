-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 014 — Link endorsement requests to recipient accounts
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Problem: requests are stored with recipient_email but recipient_user_id is
-- never populated. This means:
--   1. RLS blocks recipients from seeing their pending requests in the app
--      (existing policies only match on recipient_user_id or requester_id)
--   2. New sign-ups never see requests sent to their email before they joined
--
-- Fix 1: RLS policy — allow a logged-in user to see requests sent to their email
-- Fix 2: Trigger — when a user row is created, backfill recipient_user_id on
--         any pending requests that match their email
-- Fix 3: API route (in code) — at request creation time, look up if a user
--         already exists with that email and set recipient_user_id immediately
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Fix 1: RLS policy for email-matched recipients ───────────────────────────

create policy "endorsement_requests: recipient email read"
  on public.endorsement_requests for select
  using (auth.email() = recipient_email);


-- ── Fix 2: Trigger to backfill recipient_user_id on new account creation ─────

create or replace function public.link_pending_requests_to_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- When a new user row is inserted, link any pending requests sent to their email
  update public.endorsement_requests
  set recipient_user_id = NEW.id
  where lower(recipient_email) = lower(NEW.email)
    and recipient_user_id is null;
  return NEW;
end;
$$;

-- users.email is populated from auth.users via existing trigger
create trigger on_user_created_link_endorsements
  after insert on public.users
  for each row
  when (NEW.email is not null)
  execute function public.link_pending_requests_to_new_user();
