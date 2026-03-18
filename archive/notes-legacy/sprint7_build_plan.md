# Sprint 7: Payments + Pro — Detailed Build Plan for Sonnet

## Context

Sprint 7 turns YachtieLink from a free product into a business. Everything built in Sprints 1-6 (profile, graph, endorsements, public profile, CV/PDF) now gets a monetisation layer: Stripe-powered Crew Pro subscriptions that unlock presentation upgrades.

**The golden rule (D-003, D-007):** You can't pay to be more trusted. You can only pay to present yourself better. Every Pro feature must be presentation/convenience — never trust, endorsement eligibility, or graph behaviour.

**Dependencies from prior sprints:**
- User profiles with all fields (Sprint 3)
- Employment history, yacht graph, endorsements (Sprints 2-5)
- Public profile at `/u/:handle` (Sprint 6)
- PDF generation with `@react-pdf/renderer` (Sprint 6)
- CV tab with template selector UI (Sprint 6)
- QR code generation (Sprint 1/6)
- Email via Resend (Sprint 2/5)
- `profile_analytics` table already exists (Sprint 4 migration)
- Templates table already seeded: Standard (free), Classic Navy (Pro), Modern Minimal (Pro)

**What already exists in the DB (from Sprint 3 migration):**
- `users.subscription_status` (default `'free'`) — `'free'` or `'pro'`
- `users.subscription_plan` — `'monthly'` or `'annual'`
- `users.subscription_ends_at` — timestamptz
- `users.stripe_customer_id` — text, unique
- `users.show_watermark` (default `true`) — `false` for Pro
- `users.template_id` — references `templates(id)`
- `users.custom_subdomain` — text, unique
- `templates` table with 3 rows seeded (Standard free, Classic Navy Pro, Modern Minimal Pro)
- `profile_analytics` table with `event_type`, `occurred_at`, `viewer_role`, `viewer_location`

**What Sprint 7 delivers:**
1. Stripe integration (Checkout, Customer Portal, webhooks)
2. Insights tab — free teasers + Pro analytics with time-series charts
3. Pro PDF templates (Classic Navy, Modern Minimal)
4. Watermark removal for Pro users
5. Custom subdomain routing (`handle.yachtie.link`)
6. Cert document manager with expiry dashboard
7. Higher endorsement request allowance (20/day Pro vs 10/day free)
8. Billing section in More tab
9. Free tier analytics nudge email

---

## Implementation Order (8 task groups)

---

### TASK 1: Stripe SDK + Environment Setup

#### 1A. Install npm packages

```bash
npm install stripe
```

One package only. Stripe's Node.js SDK handles everything server-side. No client-side Stripe SDK needed — we use Stripe Checkout (hosted page) and Stripe Customer Portal (hosted page), so no Stripe.js or Elements required.

#### 1B. Environment variables

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
```

Add all 5 to Vercel dashboard env vars (production + preview).

**CRITICAL:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must NEVER reach the client. Only use in API routes. `STRIPE_PUBLISHABLE_KEY` is safe for client-side but we don't need it since we use Checkout Sessions (server-generated URL).

#### 1C. Stripe Dashboard Setup (manual, not code)

Before coding, the founder must:
1. Create a Stripe account (or use existing)
2. Create a Product: "Crew Pro"
3. Create 2 Prices on that Product:
   - Monthly: EUR 12.00/month, recurring
   - Annual: EUR 108.00/year (EUR 9.00/month equivalent), recurring
4. Copy the Price IDs into the env vars above
5. Set up a webhook endpoint pointing to `https://yachtie.link/api/stripe/webhook`
6. Select events to send: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
7. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

**For Sonnet:** You don't need to do this. Just wire up the code that uses these env vars. The founder will configure Stripe.

#### 1D. Stripe client helper: `lib/stripe/client.ts`

```ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',  // use latest stable API version at build time
  typescript: true,
});
```

**CRITICAL:** This file must only be imported in server-side code (API routes, server components). Never import in client components.

#### 1E. Pro status helper: `lib/stripe/pro.ts`

```ts
import { createClient } from '@/lib/supabase/server';

export interface ProStatus {
  isPro: boolean;
  plan: 'monthly' | 'annual' | null;
  endsAt: string | null;
}

export async function getProStatus(userId?: string): Promise<ProStatus> {
  const supabase = await createClient();

  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return { isPro: false, plan: null, endsAt: null };

  const { data } = await supabase
    .from('users')
    .select('subscription_status, subscription_plan, subscription_ends_at')
    .eq('id', uid)
    .single();

  if (!data) return { isPro: false, plan: null, endsAt: null };

  const isPro = data.subscription_status === 'pro'
    && (!data.subscription_ends_at || new Date(data.subscription_ends_at) > new Date());

  return {
    isPro,
    plan: data.subscription_plan as 'monthly' | 'annual' | null,
    endsAt: data.subscription_ends_at,
  };
}
```

This helper is used everywhere to check Pro status. It checks both the flag AND the expiry date (belt + suspenders — webhook should keep these in sync, but if a webhook is missed, expiry date is the fallback).

---

### TASK 2: Stripe Checkout + Customer Portal API Routes

#### 2A. Checkout Session: `app/api/stripe/checkout/route.ts`

**POST /api/stripe/checkout**

Request body:
```ts
{ plan: 'monthly' | 'annual' }
```

Implementation:
1. Auth required — get user from session
2. Fetch user record to get `stripe_customer_id`
3. If no `stripe_customer_id`, create a Stripe Customer:
   ```ts
   const customer = await stripe.customers.create({
     email: user.email,
     metadata: { supabase_user_id: user.id },
   });
   // Save stripe_customer_id to users table
   await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', user.id);
   ```
4. Determine price ID from plan:
   ```ts
   const priceId = plan === 'annual'
     ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
     : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
   ```
5. Create Checkout Session:
   ```ts
   const session = await stripe.checkout.sessions.create({
     customer: stripeCustomerId,
     mode: 'subscription',
     line_items: [{ price: priceId, quantity: 1 }],
     success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/insights?upgraded=true`,
     cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/insights`,
     subscription_data: {
       metadata: { supabase_user_id: user.id },
     },
   });
   ```
6. Return `{ url: session.url }`

The client redirects the user to `session.url` (Stripe's hosted checkout page). On success, Stripe redirects back to `/app/insights?upgraded=true`.

**Why hosted Checkout:** No PCI scope. No custom payment form. No Stripe.js on the client. The user goes to Stripe's page, pays, and comes back. This is the simplest and most secure approach.

#### 2B. Customer Portal: `app/api/stripe/portal/route.ts`

**POST /api/stripe/portal**

Implementation:
1. Auth required
2. Fetch user's `stripe_customer_id` — if null, return 400 ("No subscription to manage")
3. Create portal session:
   ```ts
   const session = await stripe.billingPortal.sessions.create({
     customer: stripeCustomerId,
     return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/app/more`,
   });
   ```
4. Return `{ url: session.url }`

The client redirects to Stripe's Customer Portal where users can:
- Cancel subscription
- Update payment method
- Switch between monthly/annual
- View invoice history

**No custom billing UI needed.** Stripe handles all of this.

#### 2C. Add `NEXT_PUBLIC_SITE_URL` to env

```
NEXT_PUBLIC_SITE_URL=https://yachtie.link
```

This is a public env var (starts with `NEXT_PUBLIC_`). Used for Stripe redirect URLs and email links. Add to `.env.local` and Vercel dashboard.

---

### TASK 3: Stripe Webhook Handler

This is the most critical piece of Sprint 7. If the webhook handler is wrong, subscription status will be out of sync.

#### 3A. Webhook route: `app/api/stripe/webhook/route.ts`

**POST /api/stripe/webhook**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/admin';

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = 'nodejs';  // NOT edge — need raw body access

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const isActive = ['active', 'trialing'].includes(subscription.status);
      const plan = subscription.items.data[0]?.price.recurring?.interval === 'year'
        ? 'annual' : 'monthly';

      await supabase.from('users').update({
        subscription_status: isActive ? 'pro' : 'free',
        subscription_plan: isActive ? plan : null,
        subscription_ends_at: isActive
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        show_watermark: !isActive,
      }).eq('id', userId);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      await supabase.from('users').update({
        subscription_status: 'free',
        subscription_plan: null,
        subscription_ends_at: null,
        show_watermark: true,
        custom_subdomain: null,  // revoke custom subdomain
        template_id: null,       // reset to default template
      }).eq('id', userId);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      // Look up user by stripe_customer_id
      const { data: user } = await supabase
        .from('users')
        .select('id, email, display_name, full_name')
        .eq('stripe_customer_id', customerId)
        .single();

      if (user) {
        // Send payment failed email
        // Import and use sendPaymentFailedEmail (see Task 8)
        console.error(`Payment failed for user ${user.id}`);
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

#### 3B. Supabase admin/service client: `lib/supabase/admin.ts`

The webhook handler can't use the user's session (it's called by Stripe, not the user). It needs a service role client.

```ts
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
```

**Check if this file already exists.** If there's already a service role client pattern in the codebase, use that. If not, create this file.

**Environment variable:** `SUPABASE_SERVICE_ROLE_KEY` must already exist (used for storage operations in Sprint 6). If not, add it.

#### 3C. Webhook event handling logic

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Set status=pro, plan, ends_at, watermark=false |
| `customer.subscription.updated` | Same as created (handles plan changes, renewals) |
| `customer.subscription.deleted` | Set status=free, clear plan/ends_at, revoke subdomain + template, watermark=true |
| `invoice.payment_failed` | Log + send email warning. Do NOT downgrade yet — Stripe retries automatically |

**CRITICAL for Sonnet:**
- On `subscription.deleted`: revoke `custom_subdomain` and `template_id`. The user loses these Pro features.
- On `payment_failed`: do NOT downgrade. Stripe has its own retry logic (typically 3 attempts over ~2 weeks). Only `subscription.deleted` triggers the downgrade.
- The `metadata.supabase_user_id` is set during Checkout Session creation (Task 2A, step 5). This is how we link Stripe events to our users.

---

### TASK 4: Insights Tab (Free Teasers + Pro Analytics)

#### 4A. Migration: Analytics event recording function

Sprint 6's public profile page should already be recording `profile_view` events. If not, we need to add that. But the `profile_analytics` table already exists.

Create migration `supabase/migrations/YYYYMMDDNNNNNN_sprint7_analytics_helpers.sql`:

```sql
-- Function to record a profile analytics event
-- Called from API routes when someone views a profile, downloads a PDF, or shares a link
CREATE OR REPLACE FUNCTION public.record_profile_event(
  p_user_id uuid,
  p_event_type text,
  p_viewer_role text DEFAULT NULL,
  p_viewer_location text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profile_analytics (user_id, event_type, viewer_role, viewer_location, occurred_at)
  VALUES (p_user_id, p_event_type, p_viewer_role, p_viewer_location, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text, text, text) TO anon;

-- Function to get analytics summary for a time range
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  event_type text,
  event_count bigint,
  latest_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    event_type,
    count(*)::bigint as event_count,
    max(occurred_at) as latest_at
  FROM public.profile_analytics
  WHERE user_id = p_user_id
    AND occurred_at >= now() - (p_days || ' days')::interval
  GROUP BY event_type;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_summary(uuid, integer) TO authenticated;

-- Function to get daily event counts for time-series charts
CREATE OR REPLACE FUNCTION public.get_analytics_timeseries(
  p_user_id uuid,
  p_event_type text,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  day date,
  event_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    date_trunc('day', occurred_at)::date as day,
    count(*)::bigint as event_count
  FROM public.profile_analytics
  WHERE user_id = p_user_id
    AND event_type = p_event_type
    AND occurred_at >= now() - (p_days || ' days')::interval
  GROUP BY date_trunc('day', occurred_at)::date
  ORDER BY day;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_timeseries(uuid, text, integer) TO authenticated;

-- Update endorsement request daily limit based on Pro status
CREATE OR REPLACE FUNCTION public.get_endorsement_request_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN subscription_status = 'pro' THEN 20
    ELSE 10
  END
  FROM public.users
  WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_endorsement_request_limit(uuid) TO authenticated;
```

Use the next sequential migration number after Sprint 6's last migration.

#### 4B. Record profile view events

Add event recording to the public profile page. In `app/(public)/u/[handle]/page.tsx`, after fetching user data:

```ts
// Record profile view (fire-and-forget, don't block page render)
supabase.rpc('record_profile_event', {
  p_user_id: user.id,
  p_event_type: 'profile_view',
}).then(() => {}).catch(() => {});
```

Similarly, add `'pdf_download'` event recording in the PDF download API route, and `'link_share'` in the share button handler.

#### 4C. Rewrite `app/(protected)/app/insights/page.tsx`

This is a **server component** that fetches Pro status and either shows teasers or real analytics.

**Layout — Free user (Screen I0):**

```
┌─────────────────────────────┐
│  Header: "Insights"          │
├─────────────────────────────┤
│                              │
│  ┌── Teaser Card ──────────┐│
│  │  Profile Views           ││
│  │  [blurred/hidden number] ││
│  │  🔒 Upgrade to see      ││
│  └──────────────────────────┘│
│                              │
│  ┌── Teaser Card ──────────┐│
│  │  PDF Downloads           ││
│  │  [blurred/hidden number] ││
│  │  🔒 Upgrade to see      ││
│  └──────────────────────────┘│
│                              │
│  ┌── Teaser Card ──────────┐│
│  │  Link Shares             ││
│  │  [blurred/hidden number] ││
│  │  🔒 Upgrade to see      ││
│  └──────────────────────────┘│
│                              │
│  ┌── Teaser Card ──────────┐│
│  │  Premium Templates       ││
│  │  2 additional PDF styles ││
│  │  🔒 Upgrade to unlock    ││
│  └──────────────────────────┘│
│                              │
│  ┌── Teaser Card ──────────┐│
│  │  Cert Document Manager   ││
│  │  Expiry tracking +       ││
│  │  reminders               ││
│  │  🔒 Upgrade to unlock    ││
│  └──────────────────────────┘│
│                              │
│  ┌── Pricing Card ─────────┐│
│  │  Crew Pro                ││
│  │                          ││
│  │  EUR 12/month            ││
│  │  or EUR 9/month billed   ││
│  │  annually (save 25%)     ││
│  │                          ││
│  │  [Upgrade to Pro]        ││  ← calls POST /api/stripe/checkout
│  │  [Monthly ▼]             ││  ← plan toggle
│  └──────────────────────────┘│
│                              │
└─────────────────────────────┘
```

**Rule from UX spec:** If onboarding is not complete (Wheel A < 5/5), do NOT show upgrade. Show "Finish setting up your profile first" with CTA to `/app/profile`. Check Wheel A milestones: role, yacht, bio, cert, photo.

**Layout — Pro user (Screen I1):**

```
┌─────────────────────────────┐
│  Header: "Insights"  [Pro ✓]│
├─────────────────────────────┤
│                              │
│  Segment: [7 days] [30 days]│
│           [All time]         │
├─────────────────────────────┤
│                              │
│  ┌── Analytics Card ───────┐│
│  │  Profile Views           ││
│  │  47 views                ││
│  │  ┌─────────────────────┐││
│  │  │  ▁▃▅▇▅▃▁▃▅▇▅▃▅▇   │││  ← simple bar/line chart
│  │  └─────────────────────┘││
│  └──────────────────────────┘│
│                              │
│  ┌── Analytics Card ───────┐│
│  │  PDF Downloads           ││
│  │  12 downloads            ││
│  │  ┌─────────────────────┐││
│  │  │  ▁▁▃▁▁▅▁▁▃▁▁▇▁▁▃  │││
│  │  └─────────────────────┘││
│  └──────────────────────────┘│
│                              │
│  ┌── Analytics Card ───────┐│
│  │  Link Shares             ││
│  │  8 shares                ││
│  │  ┌─────────────────────┐││
│  │  │  ▁▁▁▃▅▁▁▁▁▃▅▁▁▁▁  │││
│  │  └─────────────────────┘││
│  └──────────────────────────┘│
│                              │
│  ┌── Cert Expiry Card ─────┐│
│  │  Cert Document Manager   ││
│  │  → View & manage         ││  ← link to /app/certs (Task 6)
│  │  2 certs expiring soon   ││
│  └──────────────────────────┘│
│                              │
│  ┌── Manage Plan ──────────┐│
│  │  Crew Pro — Monthly      ││
│  │  [Manage Subscription]   ││  ← Stripe Customer Portal
│  └──────────────────────────┘│
│                              │
└─────────────────────────────┘
```

#### 4D. Analytics chart component: `components/insights/AnalyticsChart.tsx`

A simple client component that renders a bar chart from time-series data. No external charting library — use pure CSS/SVG for simplicity.

```ts
'use client';

interface AnalyticsChartProps {
  data: { day: string; count: number }[];
  color?: string;
}

// Renders a simple bar chart:
// - Each bar = 1 day
// - Bar height proportional to max value
// - Show day labels on x-axis (abbreviated)
// - Show count on hover/tap
```

**Why no charting library:** The charts are simple bar/line charts. Adding Chart.js or Recharts for 3 small charts is overkill. Pure CSS bars (`height: ${(count/max)*100}%`) with flex layout is sufficient. Keep it simple.

#### 4E. Upgrade CTA component: `components/insights/UpgradeCTA.tsx`

Client component for the pricing card with plan toggle:

```ts
'use client';

// State: selectedPlan ('monthly' | 'annual')
// On "Upgrade to Pro" click:
//   1. POST /api/stripe/checkout with { plan: selectedPlan }
//   2. Redirect to returned URL (Stripe Checkout page)
// Show loading spinner while API call in progress
```

#### 4F. Handle `?upgraded=true` on insights page

When user returns from Stripe Checkout with `?upgraded=true`:
- Show a success toast: "Welcome to Crew Pro!"
- The webhook should have already updated the user's subscription status
- If status is still 'free' (webhook hasn't fired yet), show "Your upgrade is processing..." and refresh after 3 seconds

---

### TASK 5: Pro PDF Templates

#### 5A. Update `components/pdf/ProfilePdfDocument.tsx`

The Sprint 6 PDF component accepts a `template` prop. Now implement the 2 Pro templates.

**Template: "Classic Navy"**
- Navy (#1B3A5C) header bar with white text
- Gold (#C5A55A) accent lines for section dividers
- Serif font for headers (use "Times-Roman" — built into @react-pdf/renderer)
- Clean, traditional maritime feel
- Slightly larger photo than Standard
- Section headers in navy blue, uppercase
- Footer: `yachtie.link/u/{handle}` centered

**Template: "Modern Minimal"**
- Full-bleed photo at top (landscape crop, 80px height)
- Sans-serif (Helvetica — built into @react-pdf/renderer)
- Light grey (#F5F5F5) alternating section backgrounds
- Thin (#E0E0E0) hairline dividers
- Name + role overlapping the photo bottom edge
- Very generous whitespace
- Accent colour: teal (#0D9488)

**CRITICAL for Sonnet:** `@react-pdf/renderer` only supports a limited set of fonts out of the box: Courier, Helvetica, Times-Roman. To use custom fonts you'd need `Font.register()` which adds complexity. For Sprint 7, stick to built-in fonts. Custom fonts can be a Phase 1B improvement.

**Both Pro templates:**
- No watermark (Pro users have `show_watermark = false`)
- Same content as Standard (name, photo, role, about, employment, certs, endorsements, QR code)
- Different visual styling only

#### 5B. Template preview images

For the CV tab template selector, we need static preview thumbnails of each template. Create simple placeholder preview images:

- `public/templates/standard-preview.png`
- `public/templates/classic-navy-preview.png`
- `public/templates/modern-minimal-preview.png`

**For Sonnet:** Create these as simple SVG or use solid colour placeholder images. The founder can replace with real screenshots later. The important thing is the template selector UI works.

#### 5C. Update CV tab template selector

In `app/(protected)/app/cv/page.tsx`, update the template selector:

- Show all 3 templates as selectable cards with preview thumbnails
- Standard: selectable by all users
- Classic Navy + Modern Minimal: show preview but with lock icon for free users
- On selecting a locked template: show upgrade CTA → `/app/insights`
- On selecting Standard (or a Pro template if user is Pro): update `users.template_id` and regenerate PDF

---

### TASK 6: Certification Document Manager

This is a Pro-only feature that organises cert documents and tracks expiry.

#### 6A. Route: `app/(protected)/app/certs/page.tsx`

**New page** — accessible from Insights tab (Pro) and from the Certifications section on the profile.

**Layout:**

```
┌─────────────────────────────┐
│  Header: "Certifications"    │
├─────────────────────────────┤
│                              │
│  ┌── Expiry Alert Card ────┐│
│  │  ⚠ 2 certs expiring     ││
│  │  within 60 days          ││
│  │                          ││
│  │  ENG1 — Expires Apr 2026 ││
│  │  STCW BST — Exp May 2026││
│  └──────────────────────────┘│
│                              │
│  Segment: [All] [Valid]      │
│           [Expiring] [Expired]│
├─────────────────────────────┤
│                              │
│  ┌── Cert Row ─────────────┐│
│  │  STCW BST               ││
│  │  Safety & Sea Survival   ││
│  │  Issued: Jun 2023        ││
│  │  Expires: Jun 2028       ││
│  │  Status: ● Valid          ││
│  │  📄 Document attached    ││
│  │  [View] [Replace]        ││
│  └──────────────────────────┘│
│                              │
│  ┌── Cert Row ─────────────┐│
│  │  ENG1                    ││
│  │  Medical                 ││
│  │  Expires: Apr 2026       ││
│  │  Status: ⚠ Expiring soon ││
│  │  📄 No document          ││
│  │  [Upload]                ││
│  └──────────────────────────┘│
│                              │
│  [+ Add certification]      │
│                              │
└─────────────────────────────┘
```

**Access control:**
- Free users who navigate here: show the cert list (it's their data) but show a banner "Upgrade to Pro for expiry tracking and reminders" with CTA
- Pro users: full experience with expiry alerts, filtering, document management

**Expiry status logic:**
- **Valid:** `expiry_date` is null OR more than 60 days away
- **Expiring soon:** `expiry_date` is within 60 days
- **Expired:** `expiry_date` is in the past

**Document management:**
- View: signed URL from `cert-documents` bucket (use existing `getCertDocumentUrl` from `lib/storage/upload.ts`)
- Replace: upload new document using existing `uploadCertDocument`
- Upload: same as add cert document flow

#### 6B. Cert expiry reminder emails

Create `lib/email/cert-expiry.ts`:

```ts
// Function to check for upcoming cert expirations and send reminder emails
// This will be called by a scheduled job (pg_cron or Vercel Cron)
// Only sends to Pro users
// Sends at 60 days before expiry and 30 days before expiry
// Track sent reminders to avoid duplicates
```

Migration addition — add a tracking column to prevent duplicate reminders:

```sql
ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS expiry_reminder_60d_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_reminder_30d_sent boolean DEFAULT false;
```

#### 6C. Cron job API route: `app/api/cron/cert-expiry/route.ts`

**GET /api/cron/cert-expiry**

This runs daily via Vercel Cron. Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cert-expiry",
    "schedule": "0 9 * * *"
  }]
}
```

Implementation:
1. Verify the request is from Vercel Cron (check `CRON_SECRET` header)
2. Query: all Pro users' certs where expiry_date is within 60 days AND the relevant reminder hasn't been sent
3. For each: send email via Resend, update reminder flag

**Email content:**
- Subject: "Your [cert name] expires in [X] days"
- Body: cert name, expiry date, link to `/app/certs` to manage
- Keep it short and useful — not marketing

---

### TASK 7: Custom Subdomain Routing

Pro users get `handle.yachtie.link` as an alias for `/u/:handle`.

#### 7A. Vercel wildcard domain setup (manual)

The founder must:
1. Add `*.yachtie.link` as a domain in Vercel project settings
2. Add a wildcard DNS record: `*.yachtie.link → CNAME cname.vercel-dns.com`

**For Sonnet:** You just need to handle the routing in Next.js middleware.

#### 7B. Update middleware: `middleware.ts`

Update the existing middleware to detect subdomain requests:

```ts
// In the existing middleware function:

const host = request.headers.get('host') || '';
const isSubdomain = host.endsWith('.yachtie.link') && host !== 'yachtie.link' && host !== 'www.yachtie.link';

if (isSubdomain) {
  const subdomain = host.split('.yachtie.link')[0];

  // Rewrite to the public profile page
  const url = request.nextUrl.clone();
  url.pathname = `/u/${subdomain}`;
  return NextResponse.rewrite(url);
}
```

This makes `jane.yachtie.link` serve the same content as `yachtie.link/u/jane`.

**CRITICAL:** The subdomain must match the user's `handle`, not their `custom_subdomain` field. The `custom_subdomain` field is just a flag that this user has activated the feature. The subdomain IS the handle.

Wait — re-reading the spec: "Custom subdomain: `handle.yachtie.link` routing via Vercel wildcard DNS." This means the subdomain equals the handle. So `custom_subdomain` in the DB is redundant for routing — it's just a boolean-like flag showing the user has this Pro feature enabled.

**Simpler approach:** Since the wildcard routes ALL `*.yachtie.link` to the app, and the middleware rewrites to `/u/{subdomain}`, it works for ALL users automatically. The difference is:
- Pro users: we show the `handle.yachtie.link` URL on their profile and in their QR code
- Free users: we only show `yachtie.link/u/handle`

So the custom_subdomain column is really just used to determine which URL to display, not for routing.

#### 7C. Update public profile + QR code URL

In the `PublicProfileContent` component and the QR code generation:

```ts
const profileUrl = user.custom_subdomain
  ? `https://${user.handle}.yachtie.link`
  : `https://yachtie.link/u/${user.handle}`;
```

Pro users see and share their custom subdomain URL. Free users see the standard URL.

#### 7D. Subdomain activation UI

In the More tab billing section or a settings page, Pro users can activate their custom subdomain:

- Show: "Your custom URL: `handle.yachtie.link`"
- Toggle: Enable/disable
- On enable: set `users.custom_subdomain = handle`
- On disable: set `users.custom_subdomain = null`

Keep this simple — it's a toggle in settings, not a separate page.

---

### TASK 8: Billing Section in More Tab + Emails

#### 8A. Update `app/(protected)/app/more/page.tsx`

Replace the billing placeholder with a real section:

**Free user:**
```
Billing
  Current plan: Free
  [Upgrade to Pro] → /app/insights
```

**Pro user:**
```
Billing
  Current plan: Crew Pro (Monthly/Annual)
  Renews: [date]
  [Manage Subscription] → Stripe Customer Portal
```

The "Manage Subscription" button calls `POST /api/stripe/portal` and redirects to the returned URL.

#### 8B. Update endorsement request rate limit

Find the existing endorsement request rate limit logic (Sprint 5). It currently uses a hardcoded limit of 10/day. Update it to call `get_endorsement_request_limit(user_id)` which returns 20 for Pro users, 10 for free.

Show the correct limit in the UI: "X/10 requests remaining today" (free) or "X/20 requests remaining today" (Pro).

#### 8C. Free tier analytics nudge email

Create `lib/email/analytics-nudge.ts`:

Send a one-time email to free users whose profile views are above average.

**Logic:**
1. Run weekly via cron (add to `vercel.json`)
2. Calculate average profile views per user in the last 7 days
3. Find free users whose views are > 2x the average
4. Check they haven't received this nudge before (add `analytics_nudge_sent boolean DEFAULT false` to users table in migration)
5. Send email: "Your profile got [X] views this week. Upgrade to Crew Pro to see who's viewing your profile and track your analytics."
6. Mark `analytics_nudge_sent = true`

**CRITICAL:** Send sparingly. This is a ONE-TIME nudge, not a weekly nag. Once sent, never send again to that user.

#### 8D. Cron route: `app/api/cron/analytics-nudge/route.ts`

**GET /api/cron/analytics-nudge**

Add to `vercel.json`:
```json
{
  "path": "/api/cron/analytics-nudge",
  "schedule": "0 10 * 1 *"
}
```

That's weekly on Mondays at 10am UTC.

#### 8E. Payment failed email

Create `lib/email/payment-failed.ts`:

Called from the webhook handler (Task 3A) when `invoice.payment_failed` fires.

**Email content:**
- Subject: "Payment failed for your Crew Pro subscription"
- Body: "We couldn't process your payment. Please update your payment method to keep your Pro features."
- CTA: "Update Payment" → links to Stripe Customer Portal URL
- Keep it factual, not threatening

#### 8F. Subscription welcome email

Create `lib/email/subscription-welcome.ts`:

Called from the webhook handler when `customer.subscription.created` fires.

**Email content:**
- Subject: "Welcome to Crew Pro"
- Body: Brief list of what they've unlocked (premium templates, analytics, cert manager, custom subdomain, watermark removal, 20/day endorsement requests)
- CTA: "Explore your new features" → `/app/insights`

---

### TASK 9 (Migration): Sprint 7 Database Changes

#### 9A. Migration: `supabase/migrations/YYYYMMDDNNNNNN_sprint7_payments.sql`

```sql
-- Sprint 7: Payments + Pro

-- 1. Add analytics nudge tracking to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS analytics_nudge_sent boolean DEFAULT false;

-- 2. Add cert expiry reminder tracking
ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS expiry_reminder_60d_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_reminder_30d_sent boolean DEFAULT false;

-- 3. Analytics helper functions (see Task 4A for full SQL)
-- record_profile_event
-- get_analytics_summary
-- get_analytics_timeseries
-- get_endorsement_request_limit

-- (paste full function definitions from Task 4A here)

-- 4. Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_analytics_user_event_date
  ON public.profile_analytics (user_id, event_type, occurred_at DESC);

-- 5. Index for cert expiry queries
CREATE INDEX IF NOT EXISTS idx_certifications_expiry
  ON public.certifications (expiry_date)
  WHERE expiry_date IS NOT NULL;
```

**IMPORTANT:** Combine all Sprint 7 SQL into a single migration file. Use the next sequential number after Sprint 6's last migration.

Apply to production.

---

## File Change Summary

### New files (15):
| File | Purpose |
|------|---------|
| `lib/stripe/client.ts` | Stripe SDK singleton |
| `lib/stripe/pro.ts` | Pro status helper |
| `lib/supabase/admin.ts` | Service role client (if doesn't exist) |
| `app/api/stripe/checkout/route.ts` | Create Checkout Session |
| `app/api/stripe/portal/route.ts` | Create Customer Portal session |
| `app/api/stripe/webhook/route.ts` | Stripe webhook handler |
| `app/api/cron/cert-expiry/route.ts` | Daily cert expiry check |
| `app/api/cron/analytics-nudge/route.ts` | Weekly analytics nudge |
| `components/insights/AnalyticsChart.tsx` | Simple bar chart |
| `components/insights/UpgradeCTA.tsx` | Pricing card with plan toggle |
| `app/(protected)/app/certs/page.tsx` | Cert document manager |
| `lib/email/cert-expiry.ts` | Cert expiry reminder emails |
| `lib/email/analytics-nudge.ts` | Free tier nudge email |
| `lib/email/payment-failed.ts` | Payment failed email |
| `lib/email/subscription-welcome.ts` | Pro welcome email |
| `supabase/migrations/NNNN_sprint7_payments.sql` | DB changes |

### Modified files (7):
| File | Change |
|------|--------|
| `app/(protected)/app/insights/page.tsx` | Rewrite from stub → full Insights tab |
| `app/(protected)/app/more/page.tsx` | Real billing section |
| `app/(protected)/app/cv/page.tsx` | Template selector with Pro templates |
| `components/pdf/ProfilePdfDocument.tsx` | Add Classic Navy + Modern Minimal templates |
| `middleware.ts` | Subdomain routing |
| `app/(public)/u/[handle]/page.tsx` | Record profile_view events |
| `package.json` | Add `stripe` |
| `vercel.json` | Add cron jobs (create if doesn't exist) |

### New npm packages (1):
| Package | Purpose |
|---------|---------|
| `stripe` | Stripe Node.js SDK |

### New environment variables (5):
| Variable | Scope | Purpose |
|----------|-------|---------|
| `STRIPE_SECRET_KEY` | Server only | Stripe API key |
| `STRIPE_PUBLISHABLE_KEY` | Server only (unused client-side since we use Checkout) | Reference only |
| `STRIPE_WEBHOOK_SECRET` | Server only | Webhook signature verification |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Server only | Monthly price lookup |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Server only | Annual price lookup |
| `NEXT_PUBLIC_SITE_URL` | Public | Redirect URLs |

---

## Key Constraints for Sonnet

1. **Stripe webhook is the source of truth.** The user's Pro status is set by the webhook, not by the client. The Checkout redirect `?upgraded=true` is just a UX hint — always verify against the database.

2. **Never expose Stripe keys to the client.** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only. We don't use Stripe.js or Elements — Checkout and Portal are hosted pages.

3. **Webhook signature verification is mandatory.** Use `stripe.webhooks.constructEvent()` with the raw body. If the signature doesn't match, reject with 400. Never process unverified webhook events.

4. **Don't downgrade on `payment_failed`.** Stripe retries failed payments automatically (typically 3 attempts over ~2 weeks). Only `customer.subscription.deleted` triggers a downgrade. Premature downgrade = angry paying customer.

5. **On subscription deletion, revoke Pro features.** Set `subscription_status = 'free'`, clear `custom_subdomain`, reset `template_id` to null (falls back to Standard), set `show_watermark = true`. Don't leave orphaned Pro state.

6. **`@react-pdf/renderer` only has built-in fonts.** Helvetica, Times-Roman, Courier. Don't try to load custom fonts — it adds complexity and potential failures. Design Pro templates using these fonts.

7. **Analytics charts: no external library.** Use pure CSS/SVG bars. The data is simple (daily counts over 7-30 days). Adding Chart.js or Recharts for this is overkill and adds bundle size.

8. **Cert expiry emails: Pro only.** Free users can see their certs but don't get email reminders. The cert document manager page is viewable by all (it's their data) but the Pro features (expiry alerts, reminders) are gated.

9. **Custom subdomain routing is a middleware rewrite.** The wildcard DNS and Vercel setup handle the infrastructure. The Next.js middleware just detects `*.yachtie.link` and rewrites to `/u/{subdomain}`. No special pages or routes needed.

10. **One-time nudge email.** The analytics nudge is sent ONCE per user, ever. After `analytics_nudge_sent = true`, never send again. Don't turn this into a weekly marketing email.

11. **Onboarding gate on Insights.** If Wheel A < 5/5 (profile incomplete), don't show the upgrade CTA. Show "Finish setting up your profile first" instead. We don't want to sell Pro to users who haven't experienced the free product.

12. **The `metadata.supabase_user_id` on Stripe.** This is set during Checkout Session creation (on `subscription_data.metadata`). It's how the webhook handler knows which Supabase user to update. If this metadata is missing, the webhook should silently skip (log an error but return 200).

---

## Verification Plan

### Stripe Integration
1. Create a test subscription (Stripe test mode) → user becomes Pro
2. Check database: `subscription_status = 'pro'`, `show_watermark = false`
3. Cancel subscription via Stripe Portal → user reverts to free
4. Check database: status free, subdomain null, template null, watermark true
5. Simulate payment failure → email sent, user NOT downgraded

### Insights Tab
6. Free user sees teaser cards with blurred numbers + upgrade CTA
7. Free user with incomplete profile sees "Finish setup first" instead of upgrade
8. Pro user sees real analytics with time-series charts
9. Time range toggle works (7d / 30d / all time)
10. Profile view counter increments when public profile is visited

### Pro Features
11. Pro user can select Classic Navy template → PDF generates with navy styling
12. Pro user can select Modern Minimal template → PDF generates with minimal styling
13. Free user sees Pro templates as locked with upgrade CTA
14. Pro user's PDF has no watermark
15. Free user's PDF still has watermark

### Custom Subdomain
16. Navigate to `handle.yachtie.link` → shows the same profile as `/u/handle`
17. Pro user sees custom subdomain URL in their profile link
18. Free user sees standard `/u/handle` URL
19. QR code encodes the correct URL based on Pro status

### Cert Document Manager
20. Pro user navigates to `/app/certs` → sees all certs with expiry status
21. Filter by status works (All / Valid / Expiring / Expired)
22. Upload/replace document works
23. Expiry reminder email fires for certs expiring within 60 days

### Endorsement Rate Limit
24. Free user limited to 10 endorsement requests/day
25. Pro user limited to 20 endorsement requests/day
26. UI shows correct remaining count

### Billing
27. More tab shows current plan + manage link (Pro) or upgrade link (free)
28. "Manage Subscription" opens Stripe Portal
29. "Upgrade to Pro" opens Stripe Checkout
30. Welcome email sent on subscription creation

### Nudge Email
31. Free user with above-average views receives nudge email
32. Same user doesn't receive it again (one-time flag)

---

## Implementation Sequence

Build in this order to avoid blocking:

1. **Task 1** (Stripe setup + helpers) — everything else depends on this
2. **Task 3** (Webhook handler) — needs to be ready before any test payments
3. **Task 2** (Checkout + Portal routes) — can test payments now
4. **Task 9** (Migration) — run before building analytics/certs
5. **Task 4** (Insights tab) — the main Pro landing page
6. **Task 5** (Pro templates) — extends existing Sprint 6 PDF work
7. **Task 6** (Cert manager) — independent feature
8. **Task 7** (Custom subdomain) — needs middleware change
9. **Task 8** (Billing UI + emails) — finishing touches
