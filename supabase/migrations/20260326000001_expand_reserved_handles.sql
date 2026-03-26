-- Expand the reserved-handle blocklist for subdomain safety (*.yachtie.link)
-- Keeps the DB as the authoritative gate; client-side list mirrors this for UX.

create or replace function public.handle_available(p_handle text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- must not be taken
    not exists (select 1 from public.users where handle = lower(p_handle))
    -- must not be reserved
    and lower(p_handle) not in (
      -- Infrastructure subdomains
      'www', 'api', 'app', 'admin', 'dashboard', 'mail', 'email', 'smtp', 'imap',
      'ftp', 'ssh', 'cdn', 'assets', 'static', 'media', 'img', 'images',
      -- Auth / system
      'auth', 'login', 'logout', 'signup', 'register', 'account', 'billing',
      'settings', 'oauth', 'callback', 'webhook', 'webhooks', 'status', 'health',
      'verify', 'reset', 'upgrade',
      -- App routes
      'u', 'r',
      -- Brand / trust
      'support', 'help', 'info', 'contact', 'about', 'team', 'careers', 'jobs',
      'blog', 'news', 'press', 'legal', 'terms', 'privacy', 'security',
      'yachtielink', 'yachtie', 'link', 'pro', 'enterprise', 'crew', 'yacht',
      -- Phishing vectors
      'paypal', 'stripe', 'google', 'apple', 'facebook', 'instagram',
      -- Common DNS records
      'ns1', 'ns2', 'mx', 'autodiscover', 'autoconfig'
    );
$$;

-- Re-issue grant after CREATE OR REPLACE (Postgres may not preserve it)
grant execute on function public.handle_available(text) to anon, authenticated;
