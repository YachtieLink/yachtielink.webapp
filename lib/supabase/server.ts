import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies — session refresh is
            // handled by middleware.ts so this is safe to ignore.
          }
        },
      },
    }
  );
}
