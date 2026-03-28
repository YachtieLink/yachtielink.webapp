import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Share auth cookies across *.yachtie.link subdomains in production */
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.yachtie.link' : undefined;

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers.
 *
 * Uses @supabase/ssr so that:
 * - getUser() correctly reads the session from cookies
 * - exchangeCodeForSession() writes the session back to cookies
 *
 * Must be awaited: `const supabase = await createClient()`
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
                ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
              })
            );
          } catch (error) {
            // Server Components can't set cookies — middleware handles refresh.
            // Log in dev for visibility; production stays silent.
            if (process.env.NODE_ENV === 'development') {
              console.warn('[supabase/server] Cookie write failed (expected in Server Components):',
                error instanceof Error ? error.message : error)
            }
          }
        },
      },
    }
  );
}
