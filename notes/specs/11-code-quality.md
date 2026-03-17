# Spec 11 — Code Quality & Cleanup

**Goal:** Fix security issues, remove dead code, add error boundaries, and standardize patterns.

---

## Fix 1: Sanitize Email Templates (XSS Risk)

Email templates embed user content (names, yacht names, endorsement excerpts) directly into HTML via template literals without sanitization.

### Files to fix:
- `app/api/endorsements/route.ts` — endorsement notification email
- `app/api/endorsement-requests/route.ts` — endorsement request email
- `app/api/endorsement-requests/[id]/route.ts` — resend email

### What to do:

`lib/validation/sanitize.ts` already exports `sanitizeHtml()`. Import and use it on all user-supplied strings before embedding in email HTML:

```tsx
import { sanitizeHtml } from '@/lib/validation/sanitize'

// Before embedding in email template:
const safeName = sanitizeHtml(endorserName)
const safeYachtName = sanitizeHtml(yachtName)
const safeExcerpt = sanitizeHtml(excerpt)
```

Read each file, find all template literal interpolations in HTML email strings, and wrap the user-supplied values.

---

## Fix 2: Remove Dead Code

### `lib/api/errors.ts`
`handleApiError()` exists but is imported by zero API routes. Sentry errors from API routes go to `console.error` instead.

**Two options:**
1. Delete `handleApiError()` if it's truly unused, OR
2. (Better) Wire it up in API routes — wrap route handlers in try/catch using `handleApiError()` so API errors get captured by Sentry.

**Recommended:** Option 2. Add to each API route's catch block:
```tsx
import { handleApiError } from '@/lib/api/errors'

// At the end of each route handler:
try {
  // ... existing route logic ...
} catch (err) {
  return handleApiError(err, 'endorsements.POST')
}
```

Start with the most critical routes: `endorsements`, `endorsement-requests`, `stripe/checkout`, `cv/generate-pdf`.

### `lib/cors.ts`
`corsHeaders()` is defined but never imported. Delete the file.

### Default Next.js SVGs in `/public/`
`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — confirm unused, then delete.

---

## Fix 3: Add Route-Level Error Boundaries

Currently only root `app/error.tsx` exists. If a tab page fails, the entire app shows the root error page.

### Create `app/(protected)/app/error.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-raised)]">
        <span className="text-2xl">⚠</span>
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Something went wrong
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
        We hit an unexpected error. Try refreshing, or go back and try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-[var(--color-interactive)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
```

This error boundary renders WITHIN the tab bar layout, so the user can still navigate away using the tabs.

---

## Fix 4: Inconsistent Service Client Creation

### Files using inline client creation instead of `createServiceClient()`:
- `app/api/cv/parse/route.ts`
- `app/api/cv/generate-pdf/route.ts`
- `app/api/cv/download-pdf/route.ts`

Search for `createClient(` or `createSupabaseClient(` in these files and replace with:
```tsx
import { createServiceClient } from '@/lib/supabase/admin'

const supabase = createServiceClient()
```

---

## Fix 5: Input Validation Gaps

### `app/api/endorsement-requests/share-link/route.ts`
Add Zod validation:
```tsx
import { z } from 'zod'
import { validateBody } from '@/lib/validation/validate'

const schema = z.object({
  yacht_id: z.string().uuid(),
})

// In the handler:
const body = await validateBody(req, schema)
if (body instanceof NextResponse) return body
```

### `app/api/endorsement-requests/[id]/route.ts` PUT handler
Add Zod validation for the body — define a schema for the update fields.

### `app/api/cv/download-pdf/route.ts`
Add rate limiting:
```tsx
import { applyRateLimit } from '@/lib/rate-limit'

const limited = await applyRateLimit(req, 'pdfDownload')
if (limited) return limited
```

---

## Fix 6: More Page → Server Component Refactor

**File:** `app/(protected)/app/more/page.tsx`

The entire page is `'use client'` but only the theme toggle and sign-out button need client interactivity.

### Approach:
1. Convert the page to a server component
2. Extract `ThemeToggle` and `SignOutButton` as client components
3. Fetch subscription status server-side

**Create `components/settings/ThemeToggle.tsx`:**
```tsx
'use client'

import { useState, useEffect } from 'react'

type Theme = 'system' | 'light' | 'dark'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('yl-theme') as Theme | null
    setTheme(stored ?? 'system')
  }, [])

  function applyTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('yl-theme', t)
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else if (t === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }

  return (
    <div className="flex gap-2">
      {(['system', 'light', 'dark'] as Theme[]).map((t) => (
        <button
          key={t}
          onClick={() => applyTheme(t)}
          className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
            theme === t
              ? 'bg-[var(--color-interactive)] text-white'
              : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)]/10'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
```

**Create `components/settings/SignOutButton.tsx`:**
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/welcome')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-between px-5 py-4 text-sm text-red-500 hover:bg-[var(--color-surface-raised)]/30 transition-colors"
    >
      Sign out
    </button>
  )
}
```

**Then refactor `more/page.tsx`** to be a server component that fetches subscription data and renders the ThemeToggle/SignOutButton as client islands. Remove the `'use client'` directive and the `useEffect` fetch logic.

---

## Verification

1. `npm run build` — no type errors
2. Send a test email via the endorsement flow — HTML should not contain unescaped user input
3. Intentionally cause an error on a tab page (e.g., invalid query) — should show the in-app error boundary, not the root error page
4. More page should load instantly (server-rendered) with no flash of "Free" before real subscription status
5. Theme toggle still works after the refactor
