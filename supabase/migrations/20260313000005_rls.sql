-- Migration 005: Row Level Security
-- Every table gets RLS enabled. No exceptions.

-- ─────────────────────────────────────────
-- Reference tables — public read, no writes by users
-- ─────────────────────────────────────────
alter table public.departments       enable row level security;
alter table public.roles             enable row level security;
alter table public.certification_types enable row level security;
alter table public.templates         enable row level security;
alter table public.other_role_entries  enable row level security;
alter table public.other_cert_entries  enable row level security;

-- Anyone can read reference data
create policy "departments: public read"
  on public.departments for select using (true);

create policy "roles: public read"
  on public.roles for select using (true);

create policy "certification_types: public read"
  on public.certification_types for select using (true);

create policy "templates: public read"
  on public.templates for select using (true);

-- Authenticated users can submit "Other" entries
create policy "other_roles: authenticated insert"
  on public.other_role_entries for insert
  with check (auth.uid() is not null);

create policy "other_certs: authenticated insert"
  on public.other_cert_entries for insert
  with check (auth.uid() is not null);

-- ─────────────────────────────────────────
-- users
-- ─────────────────────────────────────────
alter table public.users enable row level security;

create policy "users: public read"
  on public.users for select using (true);

create policy "users: own insert via trigger"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users: own update"
  on public.users for update
  using (auth.uid() = id);

-- No delete policy — accounts are soft-managed. Hard delete via auth.users cascade.

-- ─────────────────────────────────────────
-- yachts
-- ─────────────────────────────────────────
alter table public.yachts enable row level security;

create policy "yachts: public read"
  on public.yachts for select using (true);

create policy "yachts: authenticated create"
  on public.yachts for insert
  with check (auth.uid() is not null);

-- Yachts are community entities — no single-user update/delete.
-- Corrections go through a future moderation flow.

-- ─────────────────────────────────────────
-- attachments
-- ─────────────────────────────────────────
alter table public.attachments enable row level security;

create policy "attachments: public read (non-deleted)"
  on public.attachments for select
  using (deleted_at is null);

create policy "attachments: own insert"
  on public.attachments for insert
  with check (auth.uid() = user_id);

create policy "attachments: own update"
  on public.attachments for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- endorsements
-- ─────────────────────────────────────────
alter table public.endorsements enable row level security;

create policy "endorsements: public read (non-deleted)"
  on public.endorsements for select
  using (deleted_at is null);

-- Insert: must be authenticated + share a yacht attachment with recipient
create policy "endorsements: coworker insert"
  on public.endorsements for insert
  with check (
    auth.uid() = endorser_id
    and public.are_coworkers_on_yacht(auth.uid(), recipient_id, yacht_id)
  );

create policy "endorsements: own update"
  on public.endorsements for update
  using (auth.uid() = endorser_id);

-- ─────────────────────────────────────────
-- endorsement_requests
-- ─────────────────────────────────────────
alter table public.endorsement_requests enable row level security;

-- Requester can see their sent requests
create policy "endorsement_requests: requester read"
  on public.endorsement_requests for select
  using (auth.uid() = requester_id);

-- Recipient (if registered) can see requests addressed to them
create policy "endorsement_requests: recipient read"
  on public.endorsement_requests for select
  using (auth.uid() = recipient_user_id);

-- Anyone with the token can read (for the deep link flow)
-- Handled in API route — RLS allows requester + recipient reads above
create policy "endorsement_requests: own insert"
  on public.endorsement_requests for insert
  with check (auth.uid() = requester_id);

create policy "endorsement_requests: own update"
  on public.endorsement_requests for update
  using (auth.uid() = requester_id or auth.uid() = recipient_user_id);

-- ─────────────────────────────────────────
-- certifications
-- ─────────────────────────────────────────
alter table public.certifications enable row level security;

create policy "certifications: public read"
  on public.certifications for select using (true);

create policy "certifications: own insert"
  on public.certifications for insert
  with check (auth.uid() = user_id);

create policy "certifications: own update"
  on public.certifications for update
  using (auth.uid() = user_id);

create policy "certifications: own delete"
  on public.certifications for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- profile_analytics
-- ─────────────────────────────────────────
alter table public.profile_analytics enable row level security;

-- Only the profile owner can read their own analytics
create policy "analytics: own read"
  on public.profile_analytics for select
  using (auth.uid() = user_id);

-- Anyone can insert events (views, downloads — even unauthenticated visitors)
-- Auth uid may be null for anonymous viewers
create policy "analytics: public insert"
  on public.profile_analytics for insert
  with check (true);

-- ─────────────────────────────────────────
-- internal.flags — admin only (no user policies)
-- ─────────────────────────────────────────
alter table internal.flags enable row level security;
-- No policies = no access for any user. Only service_role key can read/write.
