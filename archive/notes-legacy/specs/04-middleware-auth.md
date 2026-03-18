# Spec 04 — Root Middleware for Session Refresh

**Goal:** Create a root `middleware.ts` that proactively refreshes Supabase JWT tokens on every navigation, preventing broken sessions on idle tabs.

---

## Context

`lib/supabase/middleware.ts` already exports `createMiddlewareClient()` — fully implemented. But no root `middleware.ts` file imports it. Sessions expire silently, causing auth failures deep in the app flow. This is especially bad on marina WiFi where tabs stay open for hours.

---

## Files to create

- `middleware.ts` (project root, alongside `app/`)

## Files to reference (do not modify)

- `lib/supabase/middleware.ts` — provides `createMiddlewareClient()`

---

## Implementation

**Create `middleware.ts` in the project root:**

```tsx
import { type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  // Refresh the session token if needed.
  // getUser() triggers the token refresh via the cookie handler.
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)',
  ],
}
```

---

## Verification

1. `npm run build` — no type errors
2. Open the app, wait 10+ minutes, navigate — should NOT get auth errors
3. Check that static assets still load normally (matcher excludes them)
4. Check that the public profile page (`/u/handle`) still works for non-authenticated visitors
