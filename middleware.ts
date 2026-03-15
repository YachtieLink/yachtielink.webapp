import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/app", "/onboarding"];

// Routes only for unauthenticated users
const AUTH_ONLY_PREFIXES = ["/welcome", "/login", "/signup", "/reset-password"];

export async function middleware(request: NextRequest) {
  // ── Custom subdomain routing ──────────────────────────────────────────────
  // handle.yachtie.link → rewrite to /u/handle
  // Wildcard DNS routes all *.yachtie.link here; showing the subdomain URL
  // in the UI is gated on Pro status, but routing works for everyone.
  const host = request.headers.get("host") ?? "";
  const isSubdomain =
    host.endsWith(".yachtie.link") &&
    host !== "yachtie.link" &&
    host !== "www.yachtie.link";

  if (isSubdomain) {
    const subdomain = host.split(".yachtie.link")[0];
    const url = request.nextUrl.clone();
    url.pathname = `/u/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  const { supabase, response } = createMiddlewareClient(request);

  // Refresh session if expired — keeps cookies in sync
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL("/welcome", request.url);
    // Preserve intended destination so we can redirect back after auth
    url.searchParams.set("returnTo", pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""));
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth-only routes
  if (user && AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    // Respect returnTo if present
    const returnTo = searchParams.get("returnTo");
    const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : "/app/profile";
    return NextResponse.redirect(new URL(safeReturnTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
