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

### 5. Reserved handle blocklist

File: `lib/constants/reserved-handles.ts`

Handles that must be blocked at registration and handle-change time to prevent subdomain abuse/confusion. Check against this list in both `app/(protected)/app/more/account/page.tsx` (where `HANDLE_RE` already validates format) and the onboarding wizard if handles are set there.

```ts
export const RESERVED_HANDLES = new Set([
  // Infrastructure subdomains
  'www', 'api', 'app', 'admin', 'dashboard', 'mail', 'email', 'smtp', 'imap',
  'ftp', 'ssh', 'cdn', 'assets', 'static', 'media', 'img', 'images',
  // Auth / system
  'auth', 'login', 'signup', 'register', 'account', 'billing', 'settings',
  'oauth', 'callback', 'webhook', 'webhooks', 'status', 'health',
  // Brand / trust
  'support', 'help', 'info', 'contact', 'about', 'team', 'careers', 'jobs',
  'blog', 'news', 'press', 'legal', 'terms', 'privacy', 'security',
  'yachtielink', 'yachtie', 'pro', 'enterprise', 'crew',
  // Phishing vectors
  'paypal', 'stripe', 'google', 'apple', 'facebook', 'instagram',
  // Common DNS records
  'ns1', 'ns2', 'mx', 'autodiscover', 'autoconfig',
])
```

Validation: `if (RESERVED_HANDLES.has(handle)) → reject with "This handle is reserved"`

### 6. Canonical tags on subdomain pages

File: subdomain route `app/(public)/subdomain/[handle]/page.tsx`

Add a `<link rel="canonical">` pointing to the `/u/{handle}` URL to prevent duplicate content indexing:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  return {
    alternates: {
      canonical: `https://yachtie.link/u/${handle}`,
    },
  }
}
```

This ensures Google treats the `/u/` path as authoritative regardless of which URL a visitor or crawler hits.

### 7. Crawler control on reserved pages

Add `noindex` to reserved (non-Pro) pages so Google doesn't index hundreds of "This page is reserved" pages with near-identical content:

```ts
// In the reserved page metadata
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```

Pro subdomain pages (real profiles) should remain indexable.

### 8. DNS / infrastructure — founder action required

**Vercel (project settings):**
1. Go to Project → Settings → Domains
2. Add `*.yachtie.link` as a wildcard domain
3. Vercel will provide a CNAME target (e.g. `cname.vercel-dns.com`)

**Domain registrar (DNS records):**
1. Add CNAME record: `*` → `cname.vercel-dns.com` (or the target Vercel gives)
2. Verify existing explicit records (`yachtie.link`, `www`, MX, SPF, DKIM) are untouched — explicit records always take priority over wildcards

**SSL:** Vercel Pro plan handles wildcard certificate provisioning automatically. No action needed (confirmed: we're on Vercel Pro).

**What NOT to do:**
- Do not add a wildcard MX record — this would interfere with email deliverability
- Do not remove or modify existing A/CNAME records for the root domain or `www`

### 9. Analytics — subdomain traffic attribution

Verify that analytics (Vercel Analytics, any third-party) treats subdomain traffic as same-property. Vercel Analytics does this by default. If using Google Analytics or similar, ensure the measurement config covers `*.yachtie.link` so subdomain visits aren't siloed into separate properties.

### 10. Handle abuse / moderation

Beyond the static blocklist (Part 5), add the ability to suspend a handle's subdomain without deleting the account:

- A `subdomain_suspended boolean DEFAULT false` column on `users` (or reuse an existing moderation flag)
- Middleware or the subdomain route checks this flag — if suspended, render the reserved page regardless of Pro status
- This is a safety net for phishing/impersonation reports. Can be a simple admin-only DB update initially — no UI needed at launch.

---

## DNS / infrastructure summary

| Step | Who | When |
|------|-----|------|
| Add `*.yachtie.link` in Vercel project settings | Founder | Before go-live |
| Add wildcard CNAME at registrar | Founder | Before go-live |
| Verify SSL cert provisioned | Founder | After DNS propagation (~minutes) |
| Confirm analytics covers subdomains | Founder | Before go-live |
| No wildcard MX record | N/A | Never — leave email records as-is |

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
- Moderation UI for suspending handles — admin uses direct DB update at launch

---

## Verification Checklist

### UI
- [ ] IdentityCard shows two link rows
- [ ] Non-Pro: Pro link row has badge, copy works, clicking opens reserved page
- [ ] Pro: Pro link row has no lock, both click + copy work

### Routing
- [ ] `{handle}.yachtie.link` (local via hosts file or deployed) routes to reserved page for non-Pro
- [ ] `{handle}.yachtie.link` routes to full profile for Pro users
- [ ] Reserved page shows handle, benefits, CTA to upgrade
- [ ] Reserved page "View their profile" link goes to `/u/{handle}`
- [ ] Middleware doesn't break any existing routes (auth, app, public)

### Handle safety
- [ ] Reserved handles (www, api, admin, support, etc.) rejected at registration and account edit
- [ ] Existing handles checked against blocklist (report any conflicts — don't auto-revoke)

### SEO / crawlers
- [ ] Subdomain Pro pages have `<link rel="canonical">` pointing to `/u/{handle}`
- [ ] Reserved pages have `noindex, nofollow`
- [ ] Pro profile pages remain indexable

### Infrastructure (founder)
- [ ] Wildcard domain added in Vercel project settings
- [ ] Wildcard CNAME added at registrar
- [ ] SSL cert provisioned (automatic on Vercel Pro)
- [ ] No wildcard MX record exists
- [ ] Analytics covers subdomain traffic
