-- Add subdomain suspension flag for moderation.
-- When true, the subdomain route renders the reserved page regardless of Pro status.
alter table public.users
  add column if not exists subdomain_suspended boolean not null default false;

comment on column public.users.subdomain_suspended is
  'Admin kill-switch: when true, {handle}.yachtie.link shows the reserved page even for Pro users.';
