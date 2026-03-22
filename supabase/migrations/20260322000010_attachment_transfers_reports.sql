-- Migration: Attachment Transfers + Reports
-- Adds:
--   1. attachment_transfers — audit log for yacht reassignments
--   2. reports — user-facing flagging/reporting system
--   3. RLS policies for both tables
--   4. transfer_attachment() atomic RPC
--   5. Indexes for common query patterns

-- ═══════════════════════════════════════════
-- 0. yacht_names — name timeline for yachts
-- ═══════════════════════════════════════════
-- Yachts change names frequently in the industry.
-- This table tracks the full name history so that:
--   1. Attachments can display the name the yacht had when crew worked there
--   2. Search resolves old names to the current yacht entity (no duplicates)
--   3. Yacht detail pages can show "formerly M/Y Dilbar"
--
-- The current name is the row with ended_at IS NULL.
-- yachts.name remains the canonical current display name (denormalized for perf).
-- yacht_names is the source of truth for history.

create table public.yacht_names (
  id               uuid primary key default gen_random_uuid(),
  yacht_id         uuid not null references public.yachts (id) on delete cascade,
  name             text not null,
  name_normalized  text not null generated always as (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) stored,
  started_at       date,            -- null = unknown start (legacy/seed data)
  ended_at         date,            -- null = current name
  created_by       uuid references public.users (id) on delete set null,
  created_at       timestamptz not null default now(),

  constraint name_not_empty   check (char_length(trim(name)) > 0),
  constraint valid_date_range check (ended_at is null or started_at is null or ended_at >= started_at)
);

-- Only one current name per yacht
create unique index idx_yacht_names_current
  on public.yacht_names (yacht_id)
  where ended_at is null;

-- Search across all historical names
create index idx_yacht_names_normalized
  on public.yacht_names using gin (name_normalized gin_trgm_ops);

create index idx_yacht_names_yacht
  on public.yacht_names (yacht_id);

-- RLS
alter table public.yacht_names enable row level security;

-- Anyone can read yacht name history (public data)
create policy "yacht_names: public read"
  on public.yacht_names for select
  using (true);

-- Authenticated users with an attachment to this yacht can add name history
create policy "yacht_names: crew insert"
  on public.yacht_names for insert
  with check (
    auth.uid() is not null
    and created_by = auth.uid()
    and exists (
      select 1 from public.attachments
      where yacht_id = yacht_names.yacht_id
        and user_id = auth.uid()
        and deleted_at is null
    )
  );

-- Seed current names from existing yachts table
-- This ensures every yacht has at least one yacht_names row
insert into public.yacht_names (yacht_id, name, started_at, ended_at, created_by)
select id, name, created_at::date, null, created_by
from public.yachts;


-- ═══════════════════════════════════════════
-- 1. attachment_transfers
-- ═══════════════════════════════════════════
-- Immutable audit log. One row per transfer operation.
-- Endorsement cascade is opt-in: the caller decides whether
-- endorsements tied to the old yacht should follow.
-- When cascade is requested, endorsements that cannot move
-- cleanly (e.g. endorser has no attachment to the target yacht)
-- are recorded in skipped_endorsement_ids so nothing is silently lost.
--
-- Transfer limit: 5 per attachment (prevents abuse / data-laundering).

create table public.attachment_transfers (
  id                      uuid primary key default gen_random_uuid(),
  attachment_id           uuid not null references public.attachments (id) on delete restrict,
  transferred_by          uuid not null references public.users (id) on delete cascade,

  -- What changed
  from_yacht_id           uuid not null references public.yachts (id) on delete restrict,
  to_yacht_id             uuid not null references public.yachts (id) on delete restrict,

  -- Endorsement cascade results
  cascade_endorsements    boolean not null default false,
  moved_endorsement_ids   uuid[] not null default '{}',
  skipped_endorsement_ids uuid[] not null default '{}',
  moved_request_ids       uuid[] not null default '{}',

  -- Optional reason (shown to admins)
  reason                  text,

  -- System
  created_at              timestamptz not null default now(),

  -- Constraints
  constraint different_yachts     check (from_yacht_id != to_yacht_id),
  constraint reason_length        check (char_length(reason) <= 500)
);

-- Indexes
create index idx_transfers_attachment   on public.attachment_transfers (attachment_id);
create index idx_transfers_user         on public.attachment_transfers (transferred_by);
create index idx_transfers_from_yacht   on public.attachment_transfers (from_yacht_id);
create index idx_transfers_to_yacht     on public.attachment_transfers (to_yacht_id);
create index idx_transfers_created      on public.attachment_transfers (created_at desc);

-- RLS
alter table public.attachment_transfers enable row level security;

-- Owner can read their own transfer history
create policy "transfers: own read"
  on public.attachment_transfers for select
  using (auth.uid() = transferred_by);

-- No direct insert/update/delete — all writes go through the RPC
-- (SECURITY DEFINER bypasses RLS)


-- ═══════════════════════════════════════════
-- 2. reports
-- ═══════════════════════════════════════════
-- User-facing reporting system. Users submit reports; admins
-- triage them via internal.flags or directly in this table.
-- Unlike internal.flags (admin-only), this table is writable
-- by authenticated users for their own reports.

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.users (id) on delete cascade,

  -- What is being reported
  target_type      text not null,
  target_id        uuid not null,

  -- Report details
  reason           text not null,
  category         text not null,
  details          text,

  -- Lifecycle
  status           text not null default 'pending',
  admin_notes      text,          -- only readable by service_role
  resolved_at      timestamptz,

  -- System
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Constraints
  constraint valid_target_type check (target_type in ('user', 'endorsement', 'yacht', 'attachment')),
  constraint valid_category    check (category in (
    'spam', 'harassment', 'fake_identity', 'inappropriate_content',
    'incorrect_information', 'copyright', 'other'
  )),
  constraint valid_status      check (status in ('pending', 'reviewing', 'resolved', 'dismissed')),
  constraint reason_length     check (char_length(reason) between 1 and 1000),
  constraint details_length    check (char_length(details) <= 2000),
  constraint no_self_report    check (target_type != 'user' or target_id != reporter_id)
);

-- Indexes
create index idx_reports_reporter     on public.reports (reporter_id);
create index idx_reports_target       on public.reports (target_type, target_id);
create index idx_reports_status       on public.reports (status) where status in ('pending', 'reviewing');
create index idx_reports_created      on public.reports (created_at desc);

-- Prevent duplicate active reports on the same target by the same user
create unique index idx_reports_dedup
  on public.reports (reporter_id, target_type, target_id)
  where status in ('pending', 'reviewing');

-- RLS
alter table public.reports enable row level security;

-- Reporter can read their own reports (but not admin_notes — handled at query level)
create policy "reports: own read"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Reporter can submit a report
create policy "reports: own insert"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- No user update/delete — status changes are admin-only via service_role

-- updated_at trigger
create trigger set_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();


-- ═══════════════════════════════════════════
-- 3. transfer_attachment() RPC
-- ═══════════════════════════════════════════
-- Atomic transfer: validates ownership, moves the attachment,
-- optionally cascades endorsements + pending requests, and
-- logs the transfer. Returns a JSON result object.
--
-- Design decisions:
--   - Endorsement cascade is opt-in (p_cascade_endorsements).
--   - Endorsements are only moved if the endorser also has an
--     active attachment to the target yacht (preserves the
--     "shared yacht" integrity invariant). Ones that can't
--     move are collected in skipped_endorsement_ids.
--   - Pending endorsement_requests always follow the attachment
--     when cascade is true (they don't have the same coworker
--     constraint — the endorsement hasn't been written yet).
--   - Max 5 transfers per attachment to prevent abuse.

create or replace function public.transfer_attachment(
  p_attachment_id        uuid,
  p_to_yacht_id          uuid,
  p_cascade_endorsements boolean default false,
  p_reason               text   default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id             uuid;
  v_from_yacht_id       uuid;
  v_transfer_count      int;
  v_moved_endorsements  uuid[] := '{}';
  v_skipped_endorsements uuid[] := '{}';
  v_moved_requests      uuid[] := '{}';
  v_transfer_id         uuid;
  v_endo                record;
begin
  -- Identify caller
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  -- Lock and validate the attachment
  select yacht_id into v_from_yacht_id
  from public.attachments
  where id = p_attachment_id
    and user_id = v_user_id
    and deleted_at is null
  for update;

  if v_from_yacht_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'attachment_not_found',
      'message', 'Attachment does not exist, is deleted, or does not belong to you.'
    );
  end if;

  -- Cannot transfer to same yacht
  if v_from_yacht_id = p_to_yacht_id then
    return jsonb_build_object(
      'success', false,
      'error', 'same_yacht',
      'message', 'Attachment is already on this yacht.'
    );
  end if;

  -- Validate target yacht exists
  if not exists (select 1 from public.yachts where id = p_to_yacht_id) then
    return jsonb_build_object(
      'success', false,
      'error', 'target_yacht_not_found',
      'message', 'Target yacht does not exist.'
    );
  end if;

  -- Enforce transfer limit (5 per attachment)
  select count(*) into v_transfer_count
  from public.attachment_transfers
  where attachment_id = p_attachment_id;

  if v_transfer_count >= 5 then
    return jsonb_build_object(
      'success', false,
      'error', 'transfer_limit_reached',
      'message', 'This attachment has been transferred the maximum number of times (5).'
    );
  end if;

  -- ── Perform the transfer ──

  -- 1. Update the attachment
  update public.attachments
  set yacht_id = p_to_yacht_id,
      updated_at = now()
  where id = p_attachment_id;

  -- 2. Cascade endorsements (opt-in)
  if p_cascade_endorsements then
    -- Move endorsements where the user is the recipient AND
    -- the endorser has an active attachment to the target yacht.
    for v_endo in
      select e.id, e.endorser_id
      from public.endorsements e
      where e.yacht_id = v_from_yacht_id
        and e.recipient_id = v_user_id
        and e.deleted_at is null
    loop
      if exists (
        select 1 from public.attachments
        where user_id = v_endo.endorser_id
          and yacht_id = p_to_yacht_id
          and deleted_at is null
      ) then
        update public.endorsements
        set yacht_id = p_to_yacht_id, updated_at = now()
        where id = v_endo.id;
        v_moved_endorsements := array_append(v_moved_endorsements, v_endo.id);
      else
        v_skipped_endorsements := array_append(v_skipped_endorsements, v_endo.id);
      end if;
    end loop;

    -- Also move endorsements where the user is the endorser AND
    -- the recipient has an active attachment to the target yacht.
    for v_endo in
      select e.id, e.recipient_id
      from public.endorsements e
      where e.yacht_id = v_from_yacht_id
        and e.endorser_id = v_user_id
        and e.deleted_at is null
        -- Skip any already processed above (shouldn't overlap, but be safe)
        and e.id != all(v_moved_endorsements)
        and e.id != all(v_skipped_endorsements)
    loop
      if exists (
        select 1 from public.attachments
        where user_id = v_endo.recipient_id
          and yacht_id = p_to_yacht_id
          and deleted_at is null
      ) then
        update public.endorsements
        set yacht_id = p_to_yacht_id, updated_at = now()
        where id = v_endo.id;
        v_moved_endorsements := array_append(v_moved_endorsements, v_endo.id);
      else
        v_skipped_endorsements := array_append(v_skipped_endorsements, v_endo.id);
      end if;
    end loop;

    -- Move pending endorsement requests (no coworker constraint needed)
    -- Collect IDs first, then update
    select coalesce(array_agg(id), '{}') into v_moved_requests
    from public.endorsement_requests
    where yacht_id = v_from_yacht_id
      and requester_id = v_user_id
      and status = 'pending'
      and cancelled_at is null;

    update public.endorsement_requests
    set yacht_id = p_to_yacht_id
    where id = any(v_moved_requests);
  end if;

  -- 3. Log the transfer
  insert into public.attachment_transfers (
    attachment_id, transferred_by,
    from_yacht_id, to_yacht_id,
    cascade_endorsements,
    moved_endorsement_ids, skipped_endorsement_ids,
    moved_request_ids, reason
  ) values (
    p_attachment_id, v_user_id,
    v_from_yacht_id, p_to_yacht_id,
    p_cascade_endorsements,
    v_moved_endorsements, v_skipped_endorsements,
    v_moved_requests, p_reason
  )
  returning id into v_transfer_id;

  return jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'from_yacht_id', v_from_yacht_id,
    'to_yacht_id', p_to_yacht_id,
    'endorsements_moved', coalesce(array_length(v_moved_endorsements, 1), 0),
    'endorsements_skipped', coalesce(array_length(v_skipped_endorsements, 1), 0),
    'requests_moved', coalesce(array_length(v_moved_requests, 1), 0),
    'skipped_endorsement_ids', to_jsonb(v_skipped_endorsements)
  );
end;
$$;

grant execute on function public.transfer_attachment(uuid, uuid, boolean, text) to authenticated;


-- ═══════════════════════════════════════════
-- 4. submit_report() RPC
-- ═══════════════════════════════════════════
-- Thin wrapper that enforces the reporter is the caller.
-- Prevents injection of reporter_id via direct table insert
-- (RLS also covers this, but belt-and-suspenders).

create or replace function public.submit_report(
  p_target_type text,
  p_target_id   uuid,
  p_reason      text,
  p_category    text,
  p_details     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid;
  v_report_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  -- Validate target exists
  if p_target_type = 'user' and not exists (select 1 from public.users where id = p_target_id) then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  elsif p_target_type = 'endorsement' and not exists (select 1 from public.endorsements where id = p_target_id and deleted_at is null) then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  elsif p_target_type = 'yacht' and not exists (select 1 from public.yachts where id = p_target_id) then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  elsif p_target_type = 'attachment' and not exists (select 1 from public.attachments where id = p_target_id and deleted_at is null) then
    return jsonb_build_object('success', false, 'error', 'target_not_found');
  end if;

  -- Check for existing active report on same target
  if exists (
    select 1 from public.reports
    where reporter_id = v_user_id
      and target_type = p_target_type
      and target_id = p_target_id
      and status in ('pending', 'reviewing')
  ) then
    return jsonb_build_object(
      'success', false,
      'error', 'duplicate_report',
      'message', 'You already have an active report on this item.'
    );
  end if;

  insert into public.reports (reporter_id, target_type, target_id, reason, category, details)
  values (v_user_id, p_target_type, p_target_id, p_reason, p_category, p_details)
  returning id into v_report_id;

  return jsonb_build_object('success', true, 'report_id', v_report_id);
end;
$$;

grant execute on function public.submit_report(text, uuid, text, text, text) to authenticated;


-- ═══════════════════════════════════════════
-- 5. Column-level privilege: hide admin_notes from authenticated users
-- ═══════════════════════════════════════════
-- RLS is row-level only. admin_notes must be invisible to reporters.
-- REVOKE column-level SELECT so only service_role can read it.
revoke select (admin_notes) on public.reports from authenticated;
revoke select (admin_notes) on public.reports from anon;
