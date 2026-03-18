# Spec 09 — Bundle Optimization

**Goal:** Remove dead weight from the bundle — unused fonts, synchronous PostHog loading, unoptimized images, and eagerly-loaded conditional components.

---

## Fix 1: Remove Dead Geist_Mono Font Import

**File:** `app/layout.tsx`

**Remove lines 14-17:**
```tsx
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

**Remove the import (line 2):**
```tsx
import { DM_Sans, Geist_Mono } from "next/font/google";
```
**Change to:**
```tsx
import { DM_Sans } from "next/font/google";
```

**Update the body className (line 61):**

**Current:**
```tsx
className={`${dmSans.variable} ${geistMono.variable} antialiased`}
```

**Change to:**
```tsx
className={`${dmSans.variable} antialiased`}
```

**Verify** `--font-geist-mono` is not used anywhere else: `grep -r "geist-mono\|font-geist-mono\|Geist_Mono" app/ components/ lib/`. If found, replace with a system monospace font or remove.

---

## Fix 2: Remove `unoptimized` from IdentityCard Image

**File:** `components/profile/IdentityCard.tsx` line 77

**Current:**
```tsx
<Image
  src={photoUrl}
  alt={displayName}
  width={72}
  height={72}
  className="w-18 h-18 rounded-full object-cover ring-2 ring-[var(--color-border)]"
  unoptimized // CDN URL; next/image optimisation would re-fetch
/>
```

**Remove the `unoptimized` prop:**
```tsx
<Image
  src={photoUrl}
  alt={displayName}
  width={72}
  height={72}
  className="w-18 h-18 rounded-full object-cover ring-2 ring-[var(--color-border)]"
/>
```

The Supabase CDN URL is already in `next.config.ts` `remotePatterns`. Removing `unoptimized` enables automatic WebP conversion, responsive srcset, and lazy loading.

---

## Fix 3: Replace Raw `<img>` with `next/image` on Public Profile

**File:** `components/public/PublicProfileContent.tsx` line 137-141

**Current:**
```tsx
<img
  src={user.profile_photo_url}
  alt={displayName}
  className="h-24 w-24 rounded-full object-cover border-2 border-[var(--color-border)]"
/>
```

**Change to:**
```tsx
import Image from 'next/image'

// ...

<Image
  src={user.profile_photo_url}
  alt={displayName}
  width={96}
  height={96}
  className="h-24 w-24 rounded-full object-cover border-2 border-[var(--color-border)]"
/>
```

**Also in `components/public/EndorsementCard.tsx` line 39-43:**

**Current:**
```tsx
<img
  src={endorserPhoto}
  alt={endorserName}
  className="h-8 w-8 rounded-full object-cover"
/>
```

**Change to:**
```tsx
import Image from 'next/image'

// ...

<Image
  src={endorserPhoto}
  alt={endorserName}
  width={32}
  height={32}
  className="h-8 w-8 rounded-full object-cover"
/>
```

---

## Fix 4: Dynamic Import react-qr-code

**File:** `components/profile/IdentityCard.tsx`

**Current (line 6):**
```tsx
import QRCode from 'react-qr-code'
```

**Change to:**
```tsx
import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('react-qr-code'), {
  ssr: false,
  loading: () => <div className="h-[160px] w-[160px] animate-pulse bg-gray-100 rounded-xl" />,
})
```

**File:** `components/public/PublicProfileContent.tsx`

**Current (line 3):**
```tsx
import QRCode from 'react-qr-code'
```

**Change to:**
```tsx
import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })
```

---

## Fix 5: Reduce Font Weights

**File:** `app/layout.tsx`

**Current (lines 8-12):**
```tsx
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

**Change to:**
```tsx
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

This removes weight 700 (bold), saving one WOFF2 file download. Check if `font-bold` is used anywhere — if so, it will fall back to 600 (semibold) which is visually very close. If `font-bold` is critical somewhere, keep 700.

**To check:** `grep -r "font-bold" app/ components/` — review if any usage truly needs 700 vs 600.

---

## Fix 6: Lazy-Load PostHog After Auth

**File:** `components/providers/PostHogProvider.tsx`

Read this file first. If it currently loads `posthog-js` synchronously at mount:

**Change approach:** Only initialize PostHog after the user is authenticated. Wrap the init call:

```tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Skip PostHog on public/auth pages
    if (!pathname.startsWith('/app')) return

    // Dynamic import — only loads the 50KB bundle when needed
    import('posthog-js').then((posthog) => {
      if (!posthog.default.__loaded) {
        posthog.default.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          capture_pageview: false, // Manual tracking for RSC
          autocapture: false,
        })
      }
      posthog.default.capture('$pageview')
    })
  }, [pathname])

  return <>{children}</>
}
```

**Note:** Read the existing implementation first. Adapt the lazy-loading pattern to whatever init options are already configured. The key change is the dynamic `import('posthog-js')` instead of a top-level `import posthog from 'posthog-js'`.

---

## Verification

1. `npm run build` — no type errors, note the bundle size change in build output
2. Check that profile photos still render correctly (WebP format via next/image)
3. Check that QR codes still work on IdentityCard and CV page
4. Check that dark mode toggle still works (no Geist_Mono class interference)
5. In DevTools Network tab: PostHog JS should NOT load on `/welcome` or `/u/handle` pages
