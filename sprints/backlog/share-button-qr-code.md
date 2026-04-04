---
title: Share & QR Code — Profile + CV
status: ready
source: founder (multiple sessions, grilled 2026-04-03)
priority: medium
modules: [profile, cv, infrastructure]
estimated_effort: 3-4 hours (Sonnet, high effort)
grill_me_date: 2026-04-03
---

# Share & QR Code — Profile + CV

## Problem

No share button exists in the app. Crew have no quick way to show their profile to a captain (dock party, boat show, interview). No QR code. No way to see their own yachtie.link URL at a glance.

## Grill-me Decisions (2026-04-03)

| # | Question | Decision |
|---|----------|----------|
| 1 | Where does share live? | Two places: **(1)** My Profile — compact URL row that expands to QR + share options. **(2)** CV tab — QR in context of CV output (future: customizable colors/sizes). |
| 2 | My Profile placement | ~~(b) Slim row below hero card~~ **UPDATED 2026-04-04:** "Share your link" button in hero card opens a **full-screen share sheet** — QR code hero, native share (WhatsApp etc.) on mobile, elegant desktop fallback. Not an expand-in-place row. |
| 3 | QR code URL | **(c)** Tracking redirect: `yachtie.link/qr/{handle}`. Resolves to subdomain (Pro) or `/u/{handle}` (free). Enables scan analytics for Insights dashboard. |
| 4 | Share channels | **(a)** on mobile: Copy + Native Share (Web Share API handles WhatsApp/Email/SMS). **(b)** fallback on desktop: Copy + explicit WhatsApp/Email/SMS buttons. Detect with `navigator.canShare`. |

## Spec

### Task 1: QR redirect endpoint

**File:** `app/api/qr/[handle]/route.ts` (new) or Next.js middleware redirect

- `GET /qr/{handle}` → 302 redirect to:
  - `{handle}.yachtie.link` if user has Pro + custom subdomain
  - `yachtie.link/u/{handle}` otherwise
- Log the scan: increment a counter or insert a row for analytics
  - Could be a simple `qr_scans` table: `id, handle, scanned_at, user_agent, referer`
  - Or increment a counter on the user row (simpler, less granular)
- Fast — redirect must be instant, analytics is fire-and-forget

### Task 2: Full-Screen Share Sheet

**Trigger:** "Share your link" button in ProfileHeroCard opens a full-screen overlay/modal.

**File:** `components/profile/ShareSheet.tsx` (new)

**Full-screen share sheet layout:**
```
┌─────────────────────────────────────────┐
│                                    ✕    │
│         Share your YachtieLink          │
│                                         │
│         ┌───────────────┐               │
│         │               │               │
│         │   QR CODE     │               │
│         │   (LARGE)     │               │
│         │               │               │
│         └───────────────┘               │
│                                         │
│    charlotte.yachtie.link               │
│                                         │
│   ┌──────────┐  ┌──────────┐           │
│   │ WhatsApp │  │  Email   │           │
│   └──────────┘  └──────────┘           │
│   ┌──────────┐  ┌──────────┐           │
│   │   SMS    │  │  Copy    │           │
│   └──────────┘  └──────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

**Key concept (from founder, 2026-04-04):**
> "Imagine someone jumps on the app, taps Share your link. They get a full screen with options to send it to WhatsApp, send it wherever, but they also get the QR code — so if they're talking to someone in real life, they can show them the QR code and share their link right there."

**Behaviour:**
- Full-screen overlay (not a small modal — feels like a dedicated share experience)
- QR code is the hero — large, centred, immediately scannable from another phone
- Below QR: the user's URL displayed as text
- **Mobile** (`navigator.canShare`): show native share button (OS handles WhatsApp/Email/SMS routing) + "Copy Link" button
- **Desktop fallback**: explicit buttons for WhatsApp, Email, SMS, Copy Link — elegant grid layout
- QR encodes `yachtie.link/qr/{handle}` (tracking redirect from Task 1)
- QR code generated client-side — `qrcode.react` or `next-qrcode` package
- Copy Link: copies the direct profile URL (not the /qr/ redirect) with toast confirmation
- Close via X button or swipe down
- Track share event via `record_profile_event` RPC

**Wire into profile page:**
- `ProfileHeroCard.tsx` — "Share your link" button opens `ShareSheet` instead of current `shareProfile()` function
- The existing `shareProfile()` logic (clipboard copy + native share) moves into the sheet

### Task 3: QR context on CV tab

**File:** `app/(protected)/app/cv/page.tsx` or CV actions area

- Smaller mention: "Your profile QR code" with a link/button to view it
- Could just link to the My Profile share row, or show a mini QR inline
- Future: customizable QR (colors, Pro branding, sizes) — not in this scope, just a placeholder

### Task 4: Scan analytics in Insights

**File:** `app/(protected)/app/insights/page.tsx` or `components/insights/`

- "QR scans this month: N" metric card
- Uses data from the scan logging in Task 1
- Coral section color (insights)
- Only show if user has had at least 1 scan (don't show "0 scans" — negative signal)

## Edge Cases

- **No handle set** — user hasn't claimed a handle yet. Show prompt to set one instead of the URL row.
- **QR code size** — must be large enough to scan reliably from a phone screen held at arm's length. Minimum 200x200px.
- **Subdomain vs path URL** — the display URL shows the pretty version (subdomain for Pro), but the QR always goes through `/qr/{handle}` for tracking.
- **Offline** — QR code is client-generated, works without network. The redirect URL requires network when scanned (obvious but noting).
- **Dark mode** — QR codes need sufficient contrast. Use black-on-white regardless of theme.
- **Web Share API unavailability** — graceful fallback to explicit buttons. Check with `typeof navigator.share === 'function'` (not just `canShare`).

## Dependencies

- `qrcode.react` or equivalent package (add to package.json)
- Handle must be set (onboarding should already ensure this)

## Not in scope

- Customizable QR code colors/branding (future Pro feature, lives in CV tab)
- QR code on printed CV output
- QR code download as image (nice-to-have, add later)
- Scan source attribution (which captain scanned — privacy issue)
