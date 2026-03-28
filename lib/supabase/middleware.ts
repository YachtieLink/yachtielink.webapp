import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Share auth cookies across *.yachtie.link subdomains in production */
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.yachtie.link' : undefined;

/**
 * Returns a container where `response` is always the latest value.
 * Supabase's `setAll` reassigns `response` internally when refreshing cookies.
 * Using a getter ensures callers always read the post-refresh response,
 * not the stale initial one captured at destructure time.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
              ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
            })
          );
        },
      },
    }
  );

  return {
    supabase,
    get response() { return response; },
  };
}
