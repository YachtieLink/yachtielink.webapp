import { createBrowserClient } from "@supabase/ssr";

/** Share auth cookies across *.yachtie.link subdomains in production */
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.yachtie.link' : undefined;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : undefined,
    }
  );
}

