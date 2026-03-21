# Spec 05 — PWA Manifest, Icons & Viewport Fix

**Goal:** Make the app installable on home screens with proper icon, splash screen, and viewport-fit for iOS safe areas.

**Note:** Full service worker with offline caching is a follow-up. This spec covers the manifest, icons, and meta tags.

---

## Files to create

- `public/manifest.webmanifest`
- `public/icon-192.png` (placeholder — designer will replace)
- `public/icon-512.png` (placeholder — designer will replace)
- `public/apple-touch-icon.png` (180x180)

## Files to modify

- `app/layout.tsx` — add manifest link, apple-touch-icon, viewport-fit

---

## Step 1: Create Web App Manifest

**Create `public/manifest.webmanifest`:**

```json
{
  "name": "YachtieLink",
  "short_name": "YachtieLink",
  "description": "Your professional identity on the water",
  "start_url": "/app/profile",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0D7377",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## Step 2: Generate Placeholder Icons

Until a designer provides the real app icon, generate simple teal square placeholders.

Use any approach — even a simple script:
```bash
# If you have ImageMagick:
convert -size 192x192 xc:'#0D7377' public/icon-192.png
convert -size 512x512 xc:'#0D7377' public/icon-512.png
convert -size 180x180 xc:'#0D7377' public/apple-touch-icon.png
```

Or create them programmatically. The important thing is that files exist at those paths. Mark with a TODO comment in the manifest for the designer to replace.

---

## Step 3: Update Root Layout

**File:** `app/layout.tsx`

### 3a: Add manifest and apple-touch-icon to metadata

**Current metadata export (lines 19-24):**
```tsx
export const metadata: Metadata = {
  title: "YachtieLink — Crew Profiles & Endorsements",
  description: "...",
  metadataBase: new URL("https://yachtie.link"),
};
```

**Change to:**
```tsx
export const metadata: Metadata = {
  title: "YachtieLink — Crew Profiles & Endorsements",
  description:
    "Build your portable yachting profile anchored to real employment history. Get endorsed by crew you've actually worked with.",
  metadataBase: new URL("https://yachtie.link"),
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "YachtieLink",
    statusBarStyle: "default",
  },
};
```

### 3b: Add viewport-fit=cover

**Current viewport export (lines 26-34):**
```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
};
```

**Change to:**
```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
};
```

The `viewportFit: "cover"` is required for `env(safe-area-inset-*)` values to work correctly on iOS with notch/Dynamic Island.

---

## Step 4: Clean up default Next.js public assets

Delete unused boilerplate files from `/public/`:
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

Verify none of these are imported anywhere first (they shouldn't be).

---

## Verification

1. `npm run build` — no errors
2. Open app in Chrome DevTools → Application → Manifest — should show valid manifest
3. On iOS Safari: share → "Add to Home Screen" — should show "YachtieLink" with the icon
4. The app should open in standalone mode (no Safari chrome) when launched from home screen
