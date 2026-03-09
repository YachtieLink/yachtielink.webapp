# Yachtielink Database Schema (Phase 1)

**Version:** 1.1  
**Date:** 2026-01-28  
**Status:** Pre-build  
**Database:** Supabase Postgres

---

## Schema Principles

1. **UUIDs everywhere** — No sequential IDs exposed. Prevents enumeration attacks.
2. **Soft deletes where trust matters** — Endorsements and attachments use `deleted_at`, not hard delete.
3. **Timestamps on everything** — `created_at`, `updated_at` for audit trails.
4. **RLS enforced** — Every table has Row Level Security. No exceptions.
5. **Supabase Auth integration** — `auth.users` is the source of truth for identity.

---

## Entity Relationship Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │   yachts    │       │    roles    │
│  (profiles) │       │  (vessels)  │       │ (reference) │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │    ┌────────────────┴────────────────┐    │
       │    │                                 │    │
       ▼    ▼                                 ▼    │
┌─────────────────┐                   ┌────────────┴──┐
│   attachments   │◄──────────────────│  endorsements │
│ (employment)    │   gating rule     │               │
└────────┬────────┘                   └───────────────┘
         │
         │
┌────────┴────────┐       ┌─────────────────┐
│  certifications │       │   connections   │
│  (user certs)   │       │  (networking)   │
└─────────────────┘       └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │    messages     │
                          └─────────────────┘
```

---

## Tables

### users

Extends Supabase `auth.users`. This is the crew member profile.

```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- Identity (free layer)
  email text unique not null,
  full_name text not null,
  display_name text, -- Optional preferred name
  bio text, -- Max 500 chars
  profile_photo_url text,
  
  -- Contact (visibility toggleable)
  phone text,
  whatsapp text,
  location_current text, -- "Antibes, France"
  location_home text,
  
  -- Visibility toggles
  show_phone boolean default false,
  show_whatsapp boolean default false,
  show_email boolean default false,
  show_location_current boolean default true,
  
  -- Availability (private broadcast to connections only)
  available_for_work boolean default false,
  available_from date,
  available_notes text, -- "Looking for Med season rotational"
  
  -- Presentation (paid layer)
  custom_subdomain text unique, -- "john-smith" → john-smith.yachtie.link
  template_id uuid references templates(id),
  show_watermark boolean default true, -- false = paid feature
  
  -- Stripe
  stripe_customer_id text unique,
  
  -- Verification status
  is_verified boolean default false,
  verified_at timestamptz,
  verified_via text, -- 'seed', 'endorsement', 'tenure', 'subscription'
  is_ossified boolean default false, -- Protected from easy removal
  
  -- System
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_seen_at timestamptz,
  
  -- Constraints
  constraint bio_length check (char_length(bio) <= 500),
  constraint display_name_length check (char_length(display_name) <= 100),
  constraint subdomain_format check (custom_subdomain ~* '^[a-z0-9][a-z0-9-]{2,30}[a-z0-9]$')
);

-- Indexes
create index users_email_idx on public.users(email);
create index users_subdomain_idx on public.users(custom_subdomain) where custom_subdomain is not null;
create index users_available_idx on public.users(available_for_work) where available_for_work = true;
```

---

### yachts

Yacht entities. Immutable UUID, display name can change.

```sql
create table public.yachts (
  id uuid primary key default gen_random_uuid(),
  
  -- Display info (not identity)
  name text not null, -- "Lady M", "Octopus", etc.
  name_normalized text generated always as (lower(trim(name))) stored,
  
  -- Optional metadata
  yacht_type text, -- "Motor", "Sail", "Explorer"
  size_category text not null default 'medium', -- 'small', 'medium', 'large', 'superyacht'
  length_meters numeric(5,1),
  flag_state text, -- "Cayman Islands", "Marshall Islands"
  year_built integer,
  
  -- Lifecycle
  is_established boolean default false,
  established_at timestamptz,
  
  -- System
  created_at timestamptz default now(),
  created_by uuid references public.users(id),
  
  -- Constraints
  constraint name_length check (char_length(name) between 1 and 100),
  constraint length_positive check (length_meters > 0),
  constraint year_valid check (year_built between 1900 and extract(year from now()) + 2),
  constraint valid_size_category check (size_category in ('small', 'medium', 'large', 'superyacht')),
  constraint valid_yacht_type check (yacht_type in ('Motor', 'Sail', 'Explorer'))
);

-- Indexes
create index yachts_name_normalized_idx on public.yachts(name_normalized);
create index yachts_name_trgm_idx on public.yachts using gin (name_normalized gin_trgm_ops);

-- Note: Duplicates allowed. Multiple "Lady M" entries are valid.
-- No merge functionality in Phase 1 (see D-006).
```

---

### roles

Reference table for crew positions. Predefined list.

```sql
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  
  name text unique not null, -- "Captain", "Chief Stewardess"
  department text not null, -- "Deck", "Interior", "Engineering", "Galley"
  sort_order integer default 0,
  
  -- For autocomplete grouping
  is_senior boolean default false,
  
  created_at timestamptz default now()
);

-- Seed data (partial — full list TBD)
insert into public.roles (name, department, is_senior, sort_order) values
  ('Captain', 'Deck', true, 1),
  ('Chief Officer', 'Deck', true, 2),
  ('Second Officer', 'Deck', false, 3),
  ('Bosun', 'Deck', false, 4),
  ('Lead Deckhand', 'Deck', false, 5),
  ('Deckhand', 'Deck', false, 6),
  ('Chief Stewardess', 'Interior', true, 10),
  ('Second Stewardess', 'Interior', false, 11),
  ('Third Stewardess', 'Interior', false, 12),
  ('Chief Engineer', 'Engineering', true, 20),
  ('Second Engineer', 'Engineering', false, 21),
  ('ETO', 'Engineering', false, 22),
  ('Head Chef', 'Galley', true, 30),
  ('Sous Chef', 'Galley', false, 31),
  ('Solo Stewardess', 'Interior', false, 15),
  ('Deck/Stew', 'Deck', false, 7);

-- Index
create index roles_department_idx on public.roles(department);
```

---

### attachments

Employment records. Links users to yachts with role and dates.

```sql
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  
  user_id uuid not null references public.users(id) on delete cascade,
  yacht_id uuid not null references public.yachts(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  
  -- Dates
  started_at date not null,
  ended_at date, -- null = ongoing
  
  -- Optional private notes
  notes text, -- "Left for personal reasons" — only visible to owner
  
  -- System
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz, -- Soft delete
  
  -- Constraints
  constraint dates_valid check (ended_at is null or ended_at >= started_at),
  constraint notes_length check (char_length(notes) <= 500)
);

-- Indexes
create index attachments_user_idx on public.attachments(user_id) where deleted_at is null;
create index attachments_yacht_idx on public.attachments(yacht_id) where deleted_at is null;
create index attachments_dates_idx on public.attachments(started_at, ended_at);

-- Unique constraint: User can have multiple attachments to same yacht (different time periods)
-- No unique constraint here — that's intentional.
```

---

### endorsements

Contextual endorsements. Gated by shared yacht attachment.

```sql
create table public.endorsements (
  id uuid primary key default gen_random_uuid(),
  
  -- Parties
  endorser_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  yacht_id uuid not null references public.yachts(id) on delete restrict,
  
  -- Content
  content text not null, -- Free-text endorsement
  
  -- Structured metadata (for future analysis)
  endorser_role_id uuid references public.roles(id),
  recipient_role_id uuid references public.roles(id),
  worked_together_start date,
  worked_together_end date,
  
  -- Presentation (paid feature)
  is_pinned boolean default false, -- Paid users can pin endorsements
  
  -- System
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz, -- Soft delete (retraction)
  
  -- Constraints
  constraint content_length check (char_length(content) between 10 and 2000),
  constraint no_self_endorsement check (endorser_id != recipient_id),
  constraint dates_valid check (worked_together_end is null or worked_together_end >= worked_together_start),
  
  -- One endorsement per (endorser, recipient, yacht) — see D-010
  constraint unique_endorsement unique (endorser_id, recipient_id, yacht_id)
);

-- Indexes
create index endorsements_recipient_idx on public.endorsements(recipient_id) where deleted_at is null;
create index endorsements_endorser_idx on public.endorsements(endorser_id) where deleted_at is null;
create index endorsements_yacht_idx on public.endorsements(yacht_id) where deleted_at is null;
create index endorsements_created_idx on public.endorsements(created_at desc) where deleted_at is null;
```

---

### certification_types

Reference table for certification types. Predefined list with autocomplete.

```sql
create table public.certification_types (
  id uuid primary key default gen_random_uuid(),
  
  name text unique not null, -- "STCW Basic Safety Training"
  short_name text, -- "STCW BST"
  category text not null, -- "Safety", "Medical", "Navigation", "Engineering"
  issuing_bodies text[], -- ["MCA", "RYA", "USCG"]
  
  -- For autocomplete
  keywords text[], -- ["stcw", "basic", "safety"]
  
  -- Validity
  typical_validity_years integer, -- null = lifetime
  
  created_at timestamptz default now()
);

-- Indexes
create index cert_types_category_idx on public.certification_types(category);
create index cert_types_keywords_idx on public.certification_types using gin(keywords);

-- Seed data (partial — expand as needed)
insert into public.certification_types (name, short_name, category, issuing_bodies, typical_validity_years, keywords) values
  ('STCW Basic Safety Training', 'STCW BST', 'Safety', array['MCA', 'RYA', 'USCG'], 5, array['stcw', 'basic', 'safety', 'bst']),
  ('STCW Advanced Fire Fighting', 'AFF', 'Safety', array['MCA', 'RYA'], 5, array['stcw', 'fire', 'fighting', 'aff']),
  ('ENG1 Medical Certificate', 'ENG1', 'Medical', array['MCA'], 2, array['eng1', 'medical', 'mca']),
  ('Yacht Master Offshore', 'YM Offshore', 'Navigation', array['RYA', 'MCA'], null, array['yachtmaster', 'offshore', 'rya']),
  ('Yacht Master Ocean', 'YM Ocean', 'Navigation', array['RYA', 'MCA'], null, array['yachtmaster', 'ocean', 'rya']),
  ('PYA Interior Course', 'PYA Interior', 'Interior', array['PYA'], null, array['pya', 'interior', 'stewardess']),
  ('Ship Security Officer', 'SSO', 'Safety', array['MCA'], 5, array['sso', 'security', 'officer']),
  ('GMDSS General Operator', 'GOC', 'Navigation', array['MCA', 'RYA'], null, array['gmdss', 'goc', 'radio']);
```

---

### certifications

User's certifications. Links to certification_types.

```sql
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  
  user_id uuid not null references public.users(id) on delete cascade,
  certification_type_id uuid not null references public.certification_types(id) on delete restrict,
  
  -- Details
  certificate_number text,
  issuing_body text, -- "MCA", "RYA" — from certification_type.issuing_bodies
  issued_at date,
  expires_at date, -- null = no expiry
  
  -- Document (optional upload)
  document_url text,
  
  -- System
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Note: No verification in Phase 1. Users self-report, viewers verify themselves.
  -- Phase 2 may add verification_status, verified_at, verified_by fields.
  
  -- Constraints
  constraint dates_valid check (expires_at is null or expires_at >= issued_at)
);

-- Indexes
create index certifications_user_idx on public.certifications(user_id);
create index certifications_expires_idx on public.certifications(expires_at) where expires_at is not null;
```

---

### connections

Private connections between users. Enables messaging.

```sql
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  
  requester_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  
  -- Status
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected'
  
  -- System
  created_at timestamptz default now(),
  responded_at timestamptz,
  
  -- Constraints
  constraint no_self_connection check (requester_id != recipient_id),
  constraint valid_status check (status in ('pending', 'accepted', 'rejected')),
  
  -- One connection request per pair (regardless of direction)
  constraint unique_connection unique (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  )
);

-- Indexes
create index connections_requester_idx on public.connections(requester_id);
create index connections_recipient_idx on public.connections(recipient_id);
create index connections_status_idx on public.connections(status) where status = 'pending';
```

---

### messages

Direct messages. Only between connections or verified co-workers.

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  
  -- Content
  content text not null,
  
  -- Status
  read_at timestamptz,
  
  -- System
  created_at timestamptz default now(),
  
  -- Constraints
  constraint content_length check (char_length(content) between 1 and 2000),
  constraint no_self_message check (sender_id != recipient_id)
  
  -- Note: Messaging permission (connection or co-worker) enforced by RLS, not constraint.
);

-- Indexes
create index messages_sender_idx on public.messages(sender_id, created_at desc);
create index messages_recipient_idx on public.messages(recipient_id, created_at desc);
create index messages_unread_idx on public.messages(recipient_id) where read_at is null;

-- Conversation lookup (both directions)
create index messages_conversation_idx on public.messages(
  least(sender_id, recipient_id),
  greatest(sender_id, recipient_id),
  created_at desc
);
```

---

### templates

Presentation templates (paid feature).

```sql
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  
  name text not null, -- "Classic", "Modern", "Minimal"
  description text,
  preview_url text,
  
  -- Access
  is_free boolean default false,
  is_active boolean default true,
  
  -- System
  created_at timestamptz default now(),
  sort_order integer default 0
);

-- Seed default template
insert into public.templates (name, description, is_free, sort_order) values
  ('Standard', 'Clean, professional layout', true, 0),
  ('Classic Navy', 'Traditional maritime styling', false, 1),
  ('Modern Minimal', 'Contemporary, minimal design', false, 2);
```

---

### attachment_confirmations

Confirmation requests for attachments to established yachts.

```sql
create table public.attachment_confirmations (
  id uuid primary key default gen_random_uuid(),
  
  -- The attachment being confirmed
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  
  -- Status
  status text not null default 'pending', -- 'pending', 'approved', 'rejected', 'auto_approved'
  
  -- Counts (denormalized for quick lookup)
  confirms_required integer not null,
  confirms_received integer default 0,
  rejects_received integer default 0,
  
  -- System
  created_at timestamptz default now(),
  resolved_at timestamptz,
  
  constraint valid_status check (status in ('pending', 'approved', 'rejected', 'auto_approved'))
);

-- Indexes
create index att_confirmations_status_idx on public.attachment_confirmations(status) where status = 'pending';
create index att_confirmations_attachment_idx on public.attachment_confirmations(attachment_id);
```

---

### attachment_confirmation_votes

Individual votes on attachment confirmations.

```sql
create table public.attachment_confirmation_votes (
  id uuid primary key default gen_random_uuid(),
  
  confirmation_id uuid not null references public.attachment_confirmations(id) on delete cascade,
  voter_id uuid not null references public.users(id) on delete cascade,
  
  -- Vote
  vote text not null, -- 'confirm', 'reject', 'abstain'
  
  -- System
  created_at timestamptz default now(),
  
  -- One vote per user per confirmation
  constraint unique_confirmation_vote unique (confirmation_id, voter_id),
  constraint valid_vote check (vote in ('confirm', 'reject', 'abstain'))
);

-- Indexes
create index att_conf_votes_confirmation_idx on public.attachment_confirmation_votes(confirmation_id);
create index att_conf_votes_voter_idx on public.attachment_confirmation_votes(voter_id);
```

---

### account_flags

Flags against user accounts (suspected fake/fraudulent).

```sql
create table public.account_flags (
  id uuid primary key default gen_random_uuid(),
  
  -- Who is being flagged
  accused_id uuid not null references public.users(id) on delete cascade,
  
  -- Who flagged (must have standing)
  flagger_id uuid not null references public.users(id) on delete cascade,
  
  -- Context
  yacht_id uuid not null references public.yachts(id), -- Yacht where flagger has standing
  reason text,
  
  -- Voting status
  status text not null default 'voting', -- 'voting', 'removed', 'legitimate', 'expired'
  voting_ends_at timestamptz not null,
  
  -- Vote counts (denormalized)
  votes_fake integer default 0,
  votes_legitimate integer default 0,
  eligible_voters integer not null,
  
  -- System
  created_at timestamptz default now(),
  resolved_at timestamptz,
  
  -- Constraints
  constraint no_self_flag check (accused_id != flagger_id),
  constraint valid_status check (status in ('voting', 'removed', 'legitimate', 'expired'))
);

-- Indexes
create index account_flags_accused_idx on public.account_flags(accused_id);
create index account_flags_status_idx on public.account_flags(status) where status = 'voting';
create index account_flags_voting_ends_idx on public.account_flags(voting_ends_at) where status = 'voting';
```

---

### account_flag_votes

Individual votes on account flags.

```sql
create table public.account_flag_votes (
  id uuid primary key default gen_random_uuid(),
  
  flag_id uuid not null references public.account_flags(id) on delete cascade,
  voter_id uuid not null references public.users(id) on delete cascade,
  
  -- Vote
  vote text not null, -- 'fake', 'legitimate', 'abstain'
  
  -- Voter context (for audit)
  voter_verified boolean not null,
  vote_source text not null, -- 'direct_overlap', 'current_crew', 'endorsement_connection'
  
  -- System
  created_at timestamptz default now(),
  
  -- One vote per user per flag
  constraint unique_flag_vote unique (flag_id, voter_id),
  constraint valid_vote check (vote in ('fake', 'legitimate', 'abstain')),
  constraint valid_source check (vote_source in ('direct_overlap', 'current_crew', 'endorsement_connection'))
);

-- Indexes
create index account_flag_votes_flag_idx on public.account_flag_votes(flag_id);
create index account_flag_votes_voter_idx on public.account_flag_votes(voter_id);
```

---

### endorsement_signals

Thumbs up/down signals on endorsements.

```sql
create table public.endorsement_signals (
  id uuid primary key default gen_random_uuid(),
  
  endorsement_id uuid not null references public.endorsements(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  
  -- Signal
  signal text not null, -- 'agree', 'disagree'
  
  -- System
  created_at timestamptz default now(),
  
  -- One signal per user per endorsement
  constraint unique_signal unique (endorsement_id, user_id),
  constraint valid_signal check (signal in ('agree', 'disagree'))
);

-- Indexes
create index endorsement_signals_endorsement_idx on public.endorsement_signals(endorsement_id);
create index endorsement_signals_user_idx on public.endorsement_signals(user_id);
```

---

### flags (internal)

Internal flags for abuse tracking. Not exposed to users.

```sql
create table internal.flags (
  id uuid primary key default gen_random_uuid(),
  
  -- What's being flagged
  target_type text not null, -- 'user', 'endorsement', 'yacht'
  target_id uuid not null,
  
  -- Who flagged (null = system-detected)
  reported_by uuid references public.users(id),
  
  -- Details
  reason text not null,
  notes text,
  
  -- Resolution
  status text not null default 'open', -- 'open', 'investigating', 'resolved', 'dismissed'
  resolved_by text, -- PM or founder name
  resolved_at timestamptz,
  resolution_notes text,
  
  -- System
  created_at timestamptz default now(),
  
  constraint valid_target_type check (target_type in ('user', 'endorsement', 'yacht')),
  constraint valid_status check (status in ('open', 'investigating', 'resolved', 'dismissed'))
);

-- Indexes
create index flags_target_idx on internal.flags(target_type, target_id);
create index flags_status_idx on internal.flags(status) where status in ('open', 'investigating');
```

---

## Row Level Security Policies

### users

```sql
alter table public.users enable row level security;

-- Anyone can view basic profile info
create policy "Public profiles are viewable"
  on public.users for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Insert handled by trigger on auth.users creation
```

### yachts

```sql
alter table public.yachts enable row level security;

-- Anyone can view yachts
create policy "Yachts are viewable"
  on public.yachts for select
  using (true);

-- Authenticated users can create yachts
create policy "Authenticated users can create yachts"
  on public.yachts for insert
  with check (auth.uid() is not null);
```

### attachments

```sql
alter table public.attachments enable row level security;

-- Anyone can view non-deleted attachments
create policy "Attachments are viewable"
  on public.attachments for select
  using (deleted_at is null);

-- Users can manage their own attachments
create policy "Users can insert own attachments"
  on public.attachments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own attachments"
  on public.attachments for update
  using (auth.uid() = user_id);

create policy "Users can soft-delete own attachments"
  on public.attachments for update
  using (auth.uid() = user_id)
  with check (deleted_at is not null);
```

### endorsements

```sql
alter table public.endorsements enable row level security;

-- Anyone can view non-deleted endorsements
create policy "Endorsements are viewable"
  on public.endorsements for select
  using (deleted_at is null);

-- Users can create endorsements if they share a yacht attachment with recipient
create policy "Users can endorse co-workers"
  on public.endorsements for insert
  with check (
    auth.uid() = endorser_id
    and exists (
      select 1 from public.attachments a1
      join public.attachments a2 on a1.yacht_id = a2.yacht_id
      where a1.user_id = auth.uid()
        and a2.user_id = recipient_id
        and a1.yacht_id = yacht_id
        and a1.deleted_at is null
        and a2.deleted_at is null
    )
  );

-- Users can update their own endorsements
create policy "Users can update own endorsements"
  on public.endorsements for update
  using (auth.uid() = endorser_id);
```

### connections

```sql
alter table public.connections enable row level security;

-- Users can view their own connections
create policy "Users can view own connections"
  on public.connections for select
  using (auth.uid() in (requester_id, recipient_id));

-- Users can create connection requests
create policy "Users can request connections"
  on public.connections for insert
  with check (auth.uid() = requester_id);

-- Recipients can update (accept/reject)
create policy "Recipients can respond to requests"
  on public.connections for update
  using (auth.uid() = recipient_id and status = 'pending');
```

### messages

```sql
alter table public.messages enable row level security;

-- Users can view their own messages
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() in (sender_id, recipient_id));

-- Users can send messages to connections or co-workers
create policy "Users can message connections or co-workers"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (
      -- Is a connection
      exists (
        select 1 from public.connections
        where status = 'accepted'
          and auth.uid() in (requester_id, recipient_id)
          and recipient_id in (requester_id, recipient_id)
      )
      or
      -- Is a co-worker (shared yacht attachment)
      exists (
        select 1 from public.attachments a1
        join public.attachments a2 on a1.yacht_id = a2.yacht_id
        where a1.user_id = auth.uid()
          and a2.user_id = recipient_id
          and a1.deleted_at is null
          and a2.deleted_at is null
      )
    )
  );

-- Recipients can mark messages as read
create policy "Recipients can mark messages read"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (read_at is not null);
```

---

## Functions

### Check if users are co-workers

```sql
create or replace function public.are_coworkers(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.attachments a1
    join public.attachments a2 on a1.yacht_id = a2.yacht_id
    where a1.user_id = user_a
      and a2.user_id = user_b
      and a1.deleted_at is null
      and a2.deleted_at is null
  );
$$;
```

### Get yacht crew count

```sql
create or replace function public.yacht_crew_count(yacht uuid)
returns integer
language sql
stable
security definer
as $$
  select count(distinct user_id)::integer
  from public.attachments
  where yacht_id = yacht
    and deleted_at is null;
$$;
```

### Auto-create user profile on signup

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Check if users have overlapping dates on yacht

```sql
create or replace function public.have_overlapping_dates(
  user_a uuid,
  user_b uuid,
  yacht uuid
)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.attachments a1
    join public.attachments a2 on a1.yacht_id = a2.yacht_id
    where a1.user_id = user_a
      and a2.user_id = user_b
      and a1.yacht_id = yacht
      and a1.deleted_at is null
      and a2.deleted_at is null
      -- Date ranges overlap
      and a1.started_at <= coalesce(a2.ended_at, current_date)
      and coalesce(a1.ended_at, current_date) >= a2.started_at
  );
$$;
```

### Get eligible voters for account flag

```sql
create or replace function public.get_flag_eligible_voters(
  accused uuid,
  yacht uuid
)
returns table (
  user_id uuid,
  is_verified boolean,
  vote_source text
)
language sql
stable
security definer
as $$
  -- Direct overlap on flagged yacht (all users)
  select distinct
    a2.user_id,
    u.is_verified,
    'direct_overlap'::text as vote_source
  from public.attachments a1
  join public.attachments a2 on a1.yacht_id = a2.yacht_id
  join public.users u on a2.user_id = u.id
  where a1.user_id = accused
    and a1.yacht_id = yacht
    and a2.user_id != accused
    and a1.deleted_at is null
    and a2.deleted_at is null
    and a1.started_at <= coalesce(a2.ended_at, current_date)
    and coalesce(a1.ended_at, current_date) >= a2.started_at
  
  union
  
  -- Current crew on flagged yacht (verified only)
  select distinct
    a.user_id,
    u.is_verified,
    'current_crew'::text as vote_source
  from public.attachments a
  join public.users u on a.user_id = u.id
  where a.yacht_id = yacht
    and a.user_id != accused
    and a.ended_at is null
    and a.deleted_at is null
    and u.is_verified = true
  
  union
  
  -- Endorsement connections (verified only)
  select distinct
    case
      when e.endorser_id = accused then e.recipient_id
      else e.endorser_id
    end as user_id,
    u.is_verified,
    'endorsement_connection'::text as vote_source
  from public.endorsements e
  join public.users u on u.id = case
      when e.endorser_id = accused then e.recipient_id
      else e.endorser_id
    end
  where (e.endorser_id = accused or e.recipient_id = accused)
    and e.deleted_at is null
    and u.is_verified = true;
$$;
```

### Get yacht establishment threshold

```sql
create or replace function public.get_yacht_crew_threshold(size_category text)
returns integer
language sql
immutable
as $$
  select case size_category
    when 'small' then 3
    when 'medium' then 5
    when 'large' then 8
    when 'superyacht' then 12
    else 5
  end;
$$;
```

### Check if yacht is established

```sql
create or replace function public.check_yacht_established(yacht_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select 
    y.is_established 
    or (
      y.created_at < now() - interval '60 days'
      and public.yacht_crew_count(y.id) >= public.get_yacht_crew_threshold(y.size_category)
    )
  from public.yachts y
  where y.id = yacht_id;
$$;
```

---

## Indexes for Search (pg_trgm)

```sql
-- Enable extension
create extension if not exists pg_trgm;

-- User search
create index users_name_trgm_idx on public.users using gin (full_name gin_trgm_ops);

-- Role search
create index roles_name_trgm_idx on public.roles using gin (name gin_trgm_ops);

-- Certification type search
create index cert_types_name_trgm_idx on public.certification_types using gin (name gin_trgm_ops);
```

---

## Cross-References

| Topic | Document |
|-------|----------|
| Endorsement gating rule | `yl_decisions.json` → D-009 |
| One endorsement per yacht | `yl_decisions.json` → D-010 |
| No yacht merging | `yl_decisions.json` → D-006 |
| Retraction visibility | `yl_decisions.json` → D-005 |
| Absence is neutral | `yl_decisions.json` → D-011 |
| Rate limits | `yl_security.md` → Section 3.1 |
| RLS patterns | `yl_security.md` → Section 1.2 |
| Moderation mechanics | `yl_moderation.md` |
| Verified status | `yl_moderation.md` → Section 1 |
| Attachment confirmation | `yl_moderation.md` → Section 3 |
| Account flagging | `yl_moderation.md` → Sections 4-5 |

---

## Migration Notes

- Run in order: extensions → reference tables → core tables → RLS → functions → indexes
- Seed data for `roles` and `certification_types` is minimal — expand before beta
- `internal` schema requires separate creation: `create schema internal;`
- Test RLS policies thoroughly before production
