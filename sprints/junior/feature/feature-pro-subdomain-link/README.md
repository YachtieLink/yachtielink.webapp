# Feature: Pro custom subdomain link

**Started:** 2026-03-22
**Status:** ⚡ Planned
**Complexity:** Medium — UI is simple, subdomain routing needs middleware + DNS

---

## What We're Building

Two profile link rows on the IdentityCard:

| Link | Who sees it | Behaviour |
|------|-------------|-----------|
| `yachtie.link/u/{handle}` | Everyone | Clickable + copy (already exists) |
| `{handle}.yachtie.link` | Everyone | Clickable + copy — Pro badge on the row — locked until Pro active |

When a **non-Pro user** visits `{handle}.yachtie.link`:
→ Landing page: "This page is reserved. Activate it with Pro." + Pro benefits list + upgrade CTA

When a **Pro user** visits `{handle}.yachtie.link`:
→ Renders their normal public profile (same as `/u/{handle}`)

---

## Parts

### 1. IdentityCard UI — add Pro link row

File: `components/profile/IdentityCard.tsx`

- Below the existing free link row, add a second row for the Pro subdomain
- Row shows `{handle}.yachtie.link` in the same teal link style
- A small `PRO` badge sits inline before or after the URL
- Copy button next to it (copies `https://{handle}.yachtie.link`)
- If user is not Pro: clicking the link opens the reserved page (external); copy still works
- If user is Pro: same as the free link — clickable, copy works
- Need to pass `isPro` prop into `IdentityCard` (fetch from user record in parent)

### 2. Middleware — subdomain detection

File: `middleware.ts` (create if not exists)

- Detect requests where `hostname` matches `*.yachtie.link` and is not `www` or `yachtie.link`
- Extract handle from subdomain: `aristeele.yachtie.link` → `aristeele`
- Rewrite to an internal route: `/subdomain/{handle}`
- Must not interfere with existing auth or app routes

```ts
// Pseudocode
const host = request.headers.get('host') ?? ''
const subdomainMatch = host.match(/^([a-z0-9-]+)\.yachtie\.link$/)
if (subdomainMatch && subdomainMatch[1] !== 'www') {
  const handle = subdomainMatch[1]
  return NextResponse.rewrite(new URL(`/subdomain/${handle}`, request.url))
}
```

### 3. Subdomain route — reserved or profile

File: `app/(public)/subdomain/[handle]/page.tsx`

Server component. Fetches the user by handle, checks Pro status.

**If Pro:** Render the full public profile (reuse `PublicProfileContent` or redirect to `/u/{handle}` — redirect is simpler but loses the subdomain URL in the bar. Reuse the component directly to keep the URL.)

**If not Pro (or handle not found):** Render the "Reserved" page (see Part 4).

### 4. Reserved page

File: `app/(public)/subdomain/[handle]/reserved.tsx` (component, rendered by the route above)

Design:
- YachtieLink logo / wordmark at top
- Heading: "This page is reserved"
- Subheading: "`{handle}.yachtie.link` is claimed by a YachtieLink member."
- Pro benefits list (see below)
- CTA button: "Activate with Pro" → `/app/billing` or Stripe checkout
- Secondary: "View their profile" → `/u/{handle}` (in case visitor wants to see the free profile)

Pro benefits to show:
- Custom subdomain (`{handle}.yachtie.link`)
- Priority in crew search
- Unlimited photos & gallery
- Pro CV templates
- Advanced analytics
- Verified profile badge (future)

### 5. DNS / infrastructure (not in this sprint)

The wildcard `*.yachtie.link` DNS record needs to point to the app's deployment.
On Vercel this means adding a wildcard domain in project settings.
This is a deployment step, not a code step — flag for founder before going live.

---

## Props change: IdentityCard

The parent page that renders `IdentityCard` needs to pass `isPro`:

```ts
// app/(protected)/app/profile/page.tsx (or wherever IdentityCard is rendered)
const { data: user } = await supabase.from('users').select('subscription_status, ...').single()
const isPro = user?.subscription_status === 'pro'

<IdentityCard ... isPro={isPro} />
```

---

## Out of Scope

- Actual Pro paywall gating on the subdomain route (non-Pro users just see the reserved page, that's all)
- Custom domain support (e.g. bringing your own domain) — future
- SEO/canonical tags on subdomain pages — future

---

## Verification Checklist

- [ ] IdentityCard shows two link rows
- [ ] Non-Pro: Pro link row has badge, copy works, clicking opens reserved page
- [ ] Pro: Pro link row has no lock, both click + copy work
- [ ] `{handle}.yachtie.link` (local via hosts file or deployed) routes to reserved page for non-Pro
- [ ] `{handle}.yachtie.link` routes to full profile for Pro users
- [ ] Reserved page shows handle, benefits, CTA to upgrade
- [ ] Reserved page "View their profile" link goes to `/u/{handle}`
- [ ] Middleware doesn't break any existing routes (auth, app, public)
