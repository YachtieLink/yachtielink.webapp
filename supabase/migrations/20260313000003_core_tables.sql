-- Migration 003: Core Tables
-- Users, yachts, attachments, endorsements, certifications, endorsement_requests

-- ─────────────────────────────────────────
-- users
-- Extends auth.users. One row per authenticated user.
-- ─────────────────────────────────────────
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Identity (free, permanent)
  email        text unique not null,
  full_name    text not null,
  display_name text,
  handle       text unique,   -- "jane-smith" → yachtie.link/u/jane-smith
  bio          text,
  profile_photo_url text,

  -- Onboarding completion
  onboarding_complete boolean not null default false,

  -- Departments & primary role (set during onboarding)
  departments  text[],        -- e.g. ['Deck', 'Interior']
  primary_role text,          -- display label from roles.name or free text

  -- Contact (all hidden by default)
  phone             text,
  whatsapp          text,
  location_country  text,
  location_city     text,

  -- Contact visibility toggles
  show_phone    boolean not null default false,
  show_whatsapp boolean not null default false,
  show_email    boolean not null default false,
  show_location boolean not null default true,

  -- Availability (Phase 1B)
  available_for_work boolean not null default false,
  available_from     date,
  available_notes    text,

  -- Presentation (paid layer)
  template_id       uuid references public.templates (id),
  custom_subdomain  text unique,
  show_watermark    boolean not null default true,  -- false = Pro

  -- Subscription (set by Stripe webhook in Sprint 7)
  subscription_status text not null default 'free', -- 'free', 'pro'
  subscription_plan   text,                         -- 'monthly', 'annual'
  subscription_ends_at timestamptz,
  stripe_customer_id  text unique,

  -- System
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  last_seen_at timestamptz,

  -- Constraints
  constraint bio_length          check (char_length(bio) <= 500),
  constraint display_name_length check (char_length(display_name) <= 100),
  constraint handle_format       check (handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'),
  constraint handle_length       check (char_length(handle) between 3 and 30),
  constraint valid_subscription  check (subscription_status in ('free', 'pro')),
  constraint subdomain_format    check (custom_subdomain ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$')
);

create index users_email_idx      on public.users (email);
create index users_handle_idx     on public.users (handle) where handle is not null;
create index users_subdomain_idx  on public.users (custom_subdomain) where custom_subdomain is not null;
create index users_name_trgm_idx  on public.users using gin (full_name gin_trgm_ops);

-- ─────────────────────────────────────────
-- yachts
-- Yacht entities. UUID is identity — display name can change.
-- Duplicates are allowed (multiple "Lady M" is valid).
-- ─────────────────────────────────────────
create table public.yachts (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  name_normalized text generated always as (lower(trim(name))) stored,

  -- Type (Motor Yacht / Sailing Yacht only in Phase 1A)
  yacht_type     text,   -- 'Motor Yacht', 'Sailing Yacht'

  -- Size for lifecycle thresholds
  size_category  text not null default 'medium',

  -- Optional metadata
  length_meters  numeric(5,1),
  flag_state     text,
  year_built     integer,

  -- Lifecycle
  is_established  boolean not null default false,
  established_at  timestamptz,

  -- System
  created_at  timestamptz not null default now(),
  created_by  uuid references public.users (id) on delete set null,

  -- Constraints
  constraint name_length      check (char_length(name) between 1 and 100),
  constraint length_positive  check (length_meters > 0),
  constraint year_valid       check (year_built between 1900 and extract(year from now())::integer + 2),
  constraint valid_size       check (size_category in ('small', 'medium', 'large', 'superyacht')),
  constraint valid_yacht_type check (yacht_type in ('Motor Yacht', 'Sailing Yacht'))
);

create index yachts_name_normalized_idx on public.yachts (name_normalized);
create index yachts_name_trgm_idx       on public.yachts using gin (name_normalized gin_trgm_ops);

-- ─────────────────────────────────────────
-- attachments
-- Employment records: user → yacht + role + dates.
-- Soft-deleted to preserve endorsement links.
-- ─────────────────────────────────────────
create table public.attachments (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.users (id) on delete cascade,
  yacht_id uuid not null references public.yachts (id) on delete restrict,
  role_id  uuid references public.roles (id) on delete restrict,

  -- Role display (may differ from roles.name if "Other" was entered)
  role_label text not null,   -- what the user actually sees / searched for

  -- Dates
  started_at date not null,
  ended_at   date,            -- null = ongoing ("Currently")

  -- Private note
  notes text,

  -- System
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,    -- soft delete

  -- Constraints
  constraint dates_valid  check (ended_at is null or ended_at >= started_at),
  constraint notes_length check (char_length(notes) <= 500)
);

create index attachments_user_idx  on public.attachments (user_id)  where deleted_at is null;
create index attachments_yacht_idx on public.attachments (yacht_id) where deleted_at is null;
create index attachments_dates_idx on public.attachments (started_at, ended_at);

-- ─────────────────────────────────────────
-- endorsements
-- Contextual endorsements gated by shared yacht attachment.
-- One per (endorser, recipient, yacht). Soft-deleted on retraction.
-- ─────────────────────────────────────────
create table public.endorsements (
  id           uuid primary key default gen_random_uuid(),
  endorser_id  uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  yacht_id     uuid not null references public.yachts (id) on delete restrict,

  -- Content
  content text not null,

  -- Structured metadata (optional, prefilled from attachment data)
  endorser_role_label    text,
  recipient_role_label   text,
  worked_together_start  date,
  worked_together_end    date,

  -- Presentation
  is_pinned boolean not null default false,  -- Pro: choose display order

  -- System
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,    -- soft delete (retraction)

  -- Constraints
  constraint content_length      check (char_length(content) between 10 and 2000),
  constraint no_self_endorsement check (endorser_id != recipient_id),
  constraint dates_valid         check (worked_together_end is null or worked_together_end >= worked_together_start),
  constraint unique_endorsement  unique (endorser_id, recipient_id, yacht_id)
);

create index endorsements_recipient_idx on public.endorsements (recipient_id) where deleted_at is null;
create index endorsements_endorser_idx  on public.endorsements (endorser_id)  where deleted_at is null;
create index endorsements_yacht_idx     on public.endorsements (yacht_id)     where deleted_at is null;
create index endorsements_created_idx   on public.endorsements (created_at desc) where deleted_at is null;

-- ─────────────────────────────────────────
-- endorsement_requests
-- Sent before an endorsement is written. Contains a unique
-- token for the deep link /r/:token. Expires after 30 days.
-- ─────────────────────────────────────────
create table public.endorsement_requests (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid not null references public.users (id) on delete cascade,
  yacht_id        uuid not null references public.yachts (id) on delete restrict,

  -- Recipient: either an existing user or an email address
  recipient_user_id uuid references public.users (id) on delete set null,
  recipient_email   text,

  -- Deep link token
  token      text unique not null default encode(extensions.gen_random_bytes(32), 'hex'),

  -- Lifecycle
  status     text not null default 'pending',  -- 'pending', 'accepted', 'expired', 'cancelled'
  expires_at timestamptz not null default now() + interval '30 days',

  -- System
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,

  -- Constraints
  constraint has_recipient     check (recipient_email is not null or recipient_user_id is not null),
  constraint valid_status      check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  constraint valid_email_fmt   check (recipient_email ~* '^[^@]+@[^@]+\.[^@]+$')
);

create index endorsement_requests_requester_idx on public.endorsement_requests (requester_id);
create index endorsement_requests_token_idx     on public.endorsement_requests (token);
create index endorsement_requests_recipient_idx on public.endorsement_requests (recipient_user_id) where recipient_user_id is not null;
create index endorsement_requests_status_idx    on public.endorsement_requests (status) where status = 'pending';

-- ─────────────────────────────────────────
-- certifications
-- User's self-reported certifications.
-- No verification in Phase 1A — viewers verify themselves.
-- ─────────────────────────────────────────
create table public.certifications (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users (id) on delete cascade,
  certification_type_id  uuid references public.certification_types (id) on delete restrict,

  -- Free-text fallback (when "Other" was chosen)
  custom_cert_name text,

  -- Details
  certificate_number text,
  issuing_body       text,
  issued_at          date,
  expires_at         date,   -- null = no expiry

  -- Document upload (Supabase Storage URL)
  document_url text,

  -- System
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Constraints
  constraint has_cert_type     check (certification_type_id is not null or custom_cert_name is not null),
  constraint dates_valid       check (expires_at is null or expires_at >= issued_at)
);

create index certifications_user_idx    on public.certifications (user_id);
create index certifications_expires_idx on public.certifications (expires_at) where expires_at is not null;

-- ─────────────────────────────────────────
-- profile_analytics
-- Tracks profile view / PDF download / link share events.
-- Used for time-series Insights tab (Pro feature).
-- ─────────────────────────────────────────
create table public.profile_analytics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  event_type  text not null,   -- 'profile_view', 'pdf_download', 'link_share'
  occurred_at timestamptz not null default now(),

  -- Optional context (anonymised)
  viewer_role     text,
  viewer_location text,

  constraint valid_event_type check (event_type in ('profile_view', 'pdf_download', 'link_share'))
);

create index analytics_user_idx    on public.profile_analytics (user_id, occurred_at desc);
create index analytics_event_idx   on public.profile_analytics (event_type, occurred_at desc);

-- ─────────────────────────────────────────
-- internal.flags
-- Admin-only abuse/moderation flags. Not exposed to users.
-- ─────────────────────────────────────────
create table internal.flags (
  id           uuid primary key default gen_random_uuid(),
  target_type  text not null,
  target_id    uuid not null,
  reported_by  uuid references public.users (id) on delete set null,
  reason       text not null,
  notes        text,
  status       text not null default 'open',
  resolved_by  text,
  resolved_at  timestamptz,
  resolution_notes text,
  created_at   timestamptz not null default now(),

  constraint valid_target check (target_type in ('user', 'endorsement', 'yacht')),
  constraint valid_status check (status in ('open', 'investigating', 'resolved', 'dismissed'))
);

create index flags_target_idx on internal.flags (target_type, target_id);
create index flags_status_idx on internal.flags (status) where status in ('open', 'investigating');
