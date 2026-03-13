import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /auth/callback
 *
 * Handles:
 * - Email verification link clicks (PKCE code exchange)
 * - Password reset links
 * - OAuth redirects (when enabled)
 *
 * On success: redirect to /app/profile (or ?next= param if provided)
 * On error:   redirect to /welcome with ?error= param
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/profile";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Surface auth errors back to the welcome page
  if (error) {
    const url = new URL("/welcome", origin);
    url.searchParams.set("error", error);
    if (errorDescription) {
      url.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const url = new URL("/welcome", origin);
      url.searchParams.set("error", "auth_error");
      url.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(url);
    }

    // Redirect to intended destination (safe — only allow relative paths)
    const safeNext = next.startsWith("/") ? next : "/app/profile";
    return NextResponse.redirect(new URL(safeNext, origin));
  }

  // No code — unexpected state
  return NextResponse.redirect(new URL("/welcome", origin));
}
