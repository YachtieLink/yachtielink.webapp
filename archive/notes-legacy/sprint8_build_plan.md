# Sprint 8: Launch Prep — Detailed Build Plan for Sonnet

## Context

Sprint 8 is the final sprint before real users. Everything built in Sprints 1-7 gets hardened, instrumented, and made legally compliant. This is not a feature sprint — it's a production-readiness sprint. The goal is a system that is secure, observable, legally defensible, and performant enough to ship to real crew on the docks in the Med.

**Dependencies from prior sprints:**
- All API routes (Sprints 2-7): endorsements, endorsement-requests, cv/parse, cv/generate-pdf, cv/download-pdf, stripe/checkout, stripe/portal, stripe/webhook, cron/cert-expiry, cron/analytics-nudge, health/supabase
- Middleware with auth routing + subdomain rewriting (Sprints 1, 7)
- Email system via Resend (Sprint 2+)
- Supabase Auth with Google/Apple OAuth + email/password (Sprint 1)
- Public profile at `/u/:handle` (Sprint 6)
- All storage buckets: profile-photos, cert-documents, yacht-photos, cv-uploads, pdf-exports
- Stripe integration (Sprint 7)
- Profile analytics table (Sprint 4+)

**What Sprint 8 delivers:**
1. PostHog instrumentation + Sentry error tracking
2. Zod validation on all API routes
3. Rate limiting via Vercel KV on all endpoints
4. Security headers (CORS, X-Frame-Options, CSP, etc.)
5. Growth controls (invite-only toggle)
6. GDPR compliance (data export, account deletion, cookie consent)
7. Legal pages (Terms of Service, Privacy Policy)
8. Performance audit + optimizations
9. End-to-end QA checklist

---

## Implementation Order (8 task groups)

---

### TASK 1: Dependencies + Instrumentation Setup

#### 1A. Install npm packages

```bash
npm install zod posthog-js @sentry/nextjs @vercel/kv
npm install -D @types/posthog-js
```

Packages:
- `zod` — Runtime input validation for API routes
- `posthog-js` — PostHog analytics client (browser-side)
- `@sentry/nextjs` — Sentry error tracking (auto-instruments both client + server)
- `@vercel/kv` — Vercel KV (Upstash Redis) client for rate limiting

#### 1B. Environment variables

Add to `.env.local`:
```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_...
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx
CRON_SECRET=xxx
SIGNUP_MODE=public
```

Add all to Vercel dashboard env vars (production + preview).

Notes:
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are client-safe (prefixed `NEXT_PUBLIC_`)
- `SENTRY_DSN` is technically safe to expose but keep server-only for cleanliness — Sentry SDK auto-handles this
- `SENTRY_AUTH_TOKEN` is server-only (for source map uploads)
- `KV_REST_API_*` are server-only (rate limiting)
- `CRON_SECRET` is server-only (validates Vercel Cron requests)
- `SIGNUP_MODE` controls public vs invite-only signup. Start with `public`

#### 1C. Sentry initialization

Run the Sentry Next.js wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This auto-creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updates `next.config.ts` with `withSentryConfig` wrapper
- Creates `.sentryclirc` (add to `.gitignore`)

**After wizard runs, verify these files exist and configure:**

`sentry.client.config.ts`:
```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0,  // no session replays (privacy)
  replaysOnErrorSampleRate: 0.5,  // 50% of error sessions
  environment: process.env.NODE_ENV,
});
```

`sentry.server.config.ts`:
```ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**CRITICAL:** Set `replaysSessionSampleRate: 0`. Session replays capture user interactions on screen — this is a trust platform with personal data. We do NOT want session replays. Error replays at 50% are fine for debugging.

#### 1D. PostHog provider: `components/providers/PostHogProvider.tsx`

```tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage',
        autocapture: false,  // manual events only — less noise
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

**Add to root layout** (`app/layout.tsx`):
```tsx
import { PostHogProvider } from '@/components/providers/PostHogProvider';

// Wrap {children} with <PostHogProvider>
```

**CRITICAL:** Set `autocapture: false`. We want named events only, not auto-captured clicks on every button. Autocapture generates noise and makes dashboards useless.

#### 1E. PostHog event helper: `lib/analytics/events.ts`

```ts
import posthog from 'posthog-js';

// Client-side events
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

// Identify user (call after login)
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, traits);
  }
}

// Reset (call on logout)
export function resetAnalytics() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset();
  }
}
```

#### 1F. Wire up PostHog events across the app

Add `trackEvent()` calls at these locations. Each is a single line insertion — not a rewrite.

| Event | Location | When |
|-------|----------|------|
| `profile.created` | Onboarding done page | User completes onboarding |
| `cv.parsed` | CV parse API route (success path) | CV successfully parsed |
| `cv.parse_failed` | CV parse API route (failure path) | CV parse fails |
| `attachment.created` | Yacht attachment save handler | New attachment saved |
| `endorsement.requested` | Endorsement request API route | Request sent |
| `endorsement.created` | Endorsement creation API route | Endorsement submitted |
| `endorsement.deleted` | Endorsement deletion API route | Endorsement soft-deleted |
| `profile.shared` | Share button handler (profile + CV) | Link copied or share triggered |
| `pro.subscribed` | Stripe webhook (subscription.created) | User subscribes to Pro |
| `pro.cancelled` | Stripe webhook (subscription.deleted) | User cancels Pro |

**For server-side events** (API routes, webhooks): PostHog has a server-side SDK too. Install `posthog-node`:

```bash
npm install posthog-node
```

Create `lib/analytics/server.ts`:
```ts
import { PostHog } from 'posthog-node';

let posthogServer: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  if (!posthogServer) {
    posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogServer;
}

export function trackServerEvent(userId: string, event: string, properties?: Record<string, unknown>) {
  const ph = getPostHogServer();
  if (ph) {
    ph.capture({ distinctId: userId, event, properties });
  }
}
```

Use `trackServerEvent` in API routes and webhooks. Use `trackEvent` in client components.

#### 1G. PostHog dashboard setup (manual)

After instrumentation is deployed, the founder creates a PostHog dashboard with these charts:

| Chart | Type | Query |
|-------|------|-------|
| Signups per day | Line | `profile.created` count by day |
| Endorsements per day | Line | `endorsement.created` count by day |
| Endorsement-to-profile ratio | Formula | `endorsement.created` / `profile.created` (7-day rolling) |
| CV parse success rate | Formula | `cv.parsed` / (`cv.parsed` + `cv.parse_failed`) |
| Profile share rate | Line | `profile.shared` count by day |
| Pro conversion | Funnel | `profile.created` → `pro.subscribed` |
| Pro churn | Line | `pro.cancelled` count by day |

**Tripwire alerts** (set in PostHog):
- Endorsement-to-profile ratio drops below 0.3 → Slack/email alert
- CV parse failure rate > 30% → alert
- Pro cancellation spike (>3x daily average) → alert

**For Sonnet:** You don't configure PostHog dashboards. Just wire up the events. The founder handles dashboard setup.

---

### TASK 2: Zod Validation on All API Routes

This is systematic work — every API route gets a Zod schema.

#### 2A. Validation schemas: `lib/validation/schemas.ts`

Centralise all Zod schemas in one file:

```ts
import { z } from 'zod';

// Reusable atoms
const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/); // YYYY-MM or YYYY-MM-DD
const safeText = (max: number) => z.string().max(max).transform(s => s.trim());

// --- Endorsements ---

export const createEndorsementSchema = z.object({
  recipient_id: uuid,
  yacht_id: uuid,
  content: safeText(2000).refine(s => s.length >= 10, 'Endorsement must be at least 10 characters'),
  endorser_role_label: safeText(100).optional(),
  recipient_role_label: safeText(100).optional(),
  worked_together_start: isoDate.optional(),
  worked_together_end: isoDate.optional(),
});

export const updateEndorsementSchema = z.object({
  content: safeText(2000).refine(s => s.length >= 10, 'Endorsement must be at least 10 characters').optional(),
  endorser_role_label: safeText(100).optional(),
  recipient_role_label: safeText(100).optional(),
  worked_together_start: isoDate.optional(),
  worked_together_end: isoDate.optional(),
});

// --- Endorsement Requests ---

export const createEndorsementRequestSchema = z.object({
  yacht_id: uuid,
  recipients: z.array(z.object({
    email: z.string().email().optional(),
    phone: safeText(20).optional(),
  }).refine(r => r.email || r.phone, 'Email or phone required')).min(1).max(10),
  message: safeText(500).optional(),
});

// --- CV ---

export const parseCVSchema = z.object({
  storagePath: z.string().min(1).max(500),
});

export const generatePDFSchema = z.object({
  template: z.enum(['standard', 'classic-navy', 'modern-minimal']).optional().default('standard'),
});

// --- Stripe ---

export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'annual']),
});

// --- Profile updates (if API route exists) ---

export const updateProfileSchema = z.object({
  full_name: safeText(100).optional(),
  display_name: safeText(50).optional(),
  bio: safeText(500).optional(),
  primary_role: safeText(100).optional(),
  phone: safeText(20).optional(),
  whatsapp: safeText(20).optional(),
  email: z.string().email().optional(),
  location_country: safeText(100).optional(),
  location_city: safeText(100).optional(),
  phone_visible: z.boolean().optional(),
  whatsapp_visible: z.boolean().optional(),
  email_visible: z.boolean().optional(),
  location_visible: z.boolean().optional(),
});

// --- Account ---

export const updateHandleSchema = z.object({
  handle: z.string()
    .min(3).max(30)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Handle must be lowercase alphanumeric with hyphens, no leading/trailing hyphen'),
});
```

**Why one file:** Centralised schemas prevent duplication. Every API route imports from here. If a field's rules change, change it in one place.

#### 2B. Validation helper: `lib/validation/validate.ts`

```ts
import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) },
          { status: 400 },
        ),
      };
    }
    return {
      error: NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}
```

**Usage in an API route:**
```ts
import { validateBody } from '@/lib/validation/validate';
import { createEndorsementSchema } from '@/lib/validation/schemas';

export async function POST(req: Request) {
  const result = await validateBody(req, createEndorsementSchema);
  if ('error' in result) return result.error;
  const { data } = result;
  // data is fully typed and validated
}
```

#### 2C. Apply validation to all existing API routes

Update each route to use `validateBody()`:

| Route | Schema |
|-------|--------|
| `POST /api/endorsements` | `createEndorsementSchema` |
| `PUT /api/endorsements/[id]` | `updateEndorsementSchema` |
| `POST /api/endorsement-requests` | `createEndorsementRequestSchema` |
| `POST /api/cv/parse` | `parseCVSchema` |
| `POST /api/cv/generate-pdf` | `generatePDFSchema` |
| `POST /api/stripe/checkout` | `checkoutSchema` |

**For Sonnet:** Replace the existing manual validation (length checks, type checks) with the Zod schema. Don't keep both — the Zod schema IS the validation. Remove the old manual checks after adding Zod.

#### 2D. Sanitise all text output

Add a simple HTML sanitisation utility for any user-generated text that might be rendered:

```ts
// lib/validation/sanitize.ts
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**When to use:** When rendering user-generated text (bio, endorsement content) in server components. React already escapes JSX interpolation, so this is mainly for non-JSX contexts (meta tags, emails, PDFs).

---

### TASK 3: Rate Limiting

#### 3A. Rate limiter utility: `lib/rate-limit/limiter.ts`

```ts
import { kv } from '@vercel/kv';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // Unix timestamp
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`;

  const current = await kv.incr(windowKey);

  // Set expiry on first request in window
  if (current === 1) {
    await kv.expire(windowKey, windowSeconds);
  }

  const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetAt,
  };
}

export function rateLimitResponse(resetAt: number) {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetAt - Math.floor(Date.now() / 1000)),
        'X-RateLimit-Reset': String(resetAt),
      },
    },
  );
}
```

#### 3B. Rate limit helper with user/IP context: `lib/rate-limit/helpers.ts`

```ts
import { checkRateLimit, rateLimitResponse } from './limiter';
import { NextRequest } from 'next/server';

// Get client IP from request
export function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

// Pre-configured rate limiters matching yl_security.md specs
export const RATE_LIMITS = {
  auth:              { limit: 10, window: 15 * 60, scope: 'ip' as const },     // 10/15min/IP
  profileView:       { limit: 100, window: 60, scope: 'ip' as const },         // 100/min/IP
  profileEdit:       { limit: 30, window: 60, scope: 'user' as const },        // 30/min/user
  endorsementCreate: { limit: 5, window: 24 * 60 * 60, scope: 'user' as const }, // 5/24h/user
  endorsementEdit:   { limit: 20, window: 60 * 60, scope: 'user' as const },   // 20/1h/user
  pdfGenerate:       { limit: 10, window: 60 * 60, scope: 'user' as const },   // 10/1h/user
  fileUpload:        { limit: 20, window: 60 * 60, scope: 'user' as const },   // 20/1h/user
  search:            { limit: 60, window: 60, scope: 'user' as const },        // 60/min/user
  accountFlag:       { limit: 10, window: 7 * 24 * 60 * 60, scope: 'user' as const }, // 10/7days/user
} as const;

export async function applyRateLimit(
  req: NextRequest,
  category: keyof typeof RATE_LIMITS,
  userId?: string,
): Promise<Response | null> {
  const config = RATE_LIMITS[category];
  const scope = config.scope === 'ip' ? getClientIP(req) : (userId || 'anon');
  const key = `${category}:${scope}`;

  const result = await checkRateLimit(key, config.limit, config.window);

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt);
  }

  return null;  // allowed — proceed
}
```

#### 3C. Apply rate limiting to all API routes

Add rate limiting as the first check in each API route, before any other processing:

```ts
// Example: POST /api/endorsements
export async function POST(req: NextRequest) {
  // 1. Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Rate limit
  const limited = await applyRateLimit(req, 'endorsementCreate', user.id);
  if (limited) return limited;

  // 3. Validate
  const result = await validateBody(req, createEndorsementSchema);
  if ('error' in result) return result.error;

  // 4. Business logic...
}
```

| Route | Rate limit category |
|-------|-------------------|
| `POST /api/endorsements` | `endorsementCreate` |
| `PUT /api/endorsements/[id]` | `endorsementEdit` |
| `POST /api/endorsement-requests` | `endorsementCreate` (same budget) |
| `POST /api/cv/parse` | `fileUpload` |
| `POST /api/cv/generate-pdf` | `pdfGenerate` |
| `GET /api/cv/download-pdf` | `pdfGenerate` |
| `POST /api/stripe/checkout` | `auth` (by IP — prevent spam checkout) |

**For the public profile page:** Rate limit profile views at the page level. In the `/u/[handle]/page.tsx` server component or via middleware, check `profileView` by IP. This prevents scraping.

**Stripe webhook:** Do NOT rate limit the webhook endpoint. Stripe needs to deliver events reliably. The signature verification is sufficient protection.

#### 3D. Vercel KV setup (manual)

The founder must:
1. Go to Vercel dashboard → Storage → Create KV Database
2. Name it `yachtielink-ratelimit`
3. Connect it to the project
4. The `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars are auto-populated

**For Sonnet:** Just use `import { kv } from '@vercel/kv'` — the SDK auto-reads the env vars.

---

### TASK 4: Security Headers + CORS

#### 4A. Update `next.config.ts`

Add security headers:

```ts
import type { NextConfig } from 'next';
// import { withSentryConfig } from '@sentry/nextjs';  // added by Sentry wizard

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
// If Sentry wizard wrapped this, keep the withSentryConfig wrapper
```

**Header explanations:**
- `X-Frame-Options: DENY` — prevents clickjacking (nobody should iframe our pages)
- `X-Content-Type-Options: nosniff` — prevents MIME type sniffing attacks
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer info leakage
- `Strict-Transport-Security` — forces HTTPS for 2 years
- `Permissions-Policy` — disables camera/mic/geo (we don't use them)

**Why no CSP yet:** Content Security Policy is complex to get right with Next.js (inline scripts, nonces, etc.). Adding a broken CSP would block legitimate functionality. Defer to post-launch hardening. The other headers provide strong baseline protection.

#### 4B. CORS in API routes

For API routes that should only accept requests from yachtie.link origins, add CORS headers. Create `lib/cors.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://yachtie.link',
  'https://www.yachtie.link',
  'https://*.yachtie.link',  // custom subdomains
];

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = new RegExp('^' + allowed.replace('*', '[a-z0-9-]+') + '$');
      return pattern.test(origin);
    }
    return allowed === origin;
  });

  if (!isAllowed) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCorsPreFlight(req: NextRequest): NextResponse | null {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}
```

Add CORS headers to API responses:
```ts
// In each API route:
const headers = corsHeaders(req);
return NextResponse.json(data, { headers });
```

**Exception:** The Stripe webhook route must NOT have CORS restrictions. Stripe sends webhooks from its own servers, not from a browser. The signature verification is the security layer.

---

### TASK 5: Growth Controls (Invite-Only Toggle)

#### 5A. Invite-only mode

The simplest possible implementation — a single env var.

**How it works:**
- `SIGNUP_MODE=public` → normal signup
- `SIGNUP_MODE=invite` → signup blocked with "YachtieLink is currently invite-only" message

#### 5B. Signup gate in middleware

In `middleware.ts`, add before the existing auth routing:

```ts
// Invite-only check
if (
  process.env.SIGNUP_MODE === 'invite'
  && (request.nextUrl.pathname === '/welcome' || request.nextUrl.pathname === '/signup')
  && !request.nextUrl.searchParams.has('invite')
) {
  // Allow if they have an invite token
  // Otherwise, redirect to an invite-only page
  return NextResponse.redirect(new URL('/invite-only', request.url));
}
```

#### 5C. Invite-only page: `app/(public)/invite-only/page.tsx`

Simple static page:

```
┌─────────────────────────────┐
│                              │
│  YachtieLink                 │
│                              │
│  We're currently in          │
│  invite-only mode.           │
│                              │
│  If you've received an       │
│  invitation, use the link    │
│  provided.                   │
│                              │
│  Questions?                  │
│  ari@yachtie.link            │
│                              │
└─────────────────────────────┘
```

#### 5D. Admin toggle API: `app/api/admin/signup-mode/route.ts`

**POST /api/admin/signup-mode**

Simple admin endpoint to flip the mode without a deploy:

```ts
// 1. Auth required
// 2. Check user is admin (hardcode founder's user ID for now)
// 3. Update a Vercel KV key: `config:signup_mode`
// 4. Middleware reads from KV if env var isn't set
```

Actually, simpler approach: just use the Vercel env var. Changing it triggers a redeploy (~30 seconds). No admin API needed. The founder can flip it in the Vercel dashboard.

**For Sonnet:** Implement the middleware check against `process.env.SIGNUP_MODE`. Skip the admin API — the Vercel dashboard is sufficient for a single-founder team.

---

### TASK 6: GDPR Compliance

#### 6A. Data export: `app/api/account/export/route.ts`

**GET /api/account/export**

Generates a JSON file containing all of the user's data.

Implementation:
1. Auth required
2. Rate limit: 1 export per day per user (use `fileUpload` rate limit)
3. Fetch all user data in parallel:
   ```ts
   const [user, attachments, certifications, endorsementsGiven, endorsementsReceived, endorsementRequests, analytics] = await Promise.all([
     supabase.from('users').select('*').eq('id', userId).single(),
     supabase.from('attachments').select('*, yacht:yachts!yacht_id(*)').eq('user_id', userId),
     supabase.from('certifications').select('*').eq('user_id', userId),
     supabase.from('endorsements').select('*').eq('endorser_id', userId),
     supabase.from('endorsements').select('*').eq('recipient_id', userId),
     supabase.from('endorsement_requests').select('*').eq('requester_id', userId),
     supabase.from('profile_analytics').select('*').eq('user_id', userId),
   ]);
   ```
4. Structure as a JSON export:
   ```ts
   const exportData = {
     exported_at: new Date().toISOString(),
     user: user.data,
     employment_history: attachments.data,
     certifications: certifications.data,
     endorsements_given: endorsementsGiven.data,
     endorsements_received: endorsementsReceived.data,
     endorsement_requests: endorsementRequests.data,
     profile_analytics: analytics.data,
   };
   ```
5. Return as downloadable JSON:
   ```ts
   return new Response(JSON.stringify(exportData, null, 2), {
     headers: {
       'Content-Type': 'application/json',
       'Content-Disposition': `attachment; filename="yachtielink-data-export-${new Date().toISOString().split('T')[0]}.json"`,
     },
   });
   ```

**CRITICAL:** Include ALL user data. GDPR requires complete data portability. Don't forget analytics events, storage file paths, and Stripe customer ID (but NOT the Stripe secret key or internal system fields).

#### 6B. Account deletion: `app/api/account/delete/route.ts`

**POST /api/account/delete**

Request body:
```ts
{ confirmation: 'DELETE MY ACCOUNT' }  // user must type this exact string
```

Implementation:
1. Auth required
2. Validate confirmation string with Zod
3. **Soft-delete approach** (preserves endorsement integrity):
   ```ts
   // 1. Cancel Stripe subscription if active
   if (user.stripe_customer_id) {
     const subscriptions = await stripe.subscriptions.list({
       customer: user.stripe_customer_id,
       status: 'active',
     });
     for (const sub of subscriptions.data) {
       await stripe.subscriptions.cancel(sub.id);
     }
   }

   // 2. Delete storage files
   await supabase.storage.from('profile-photos').remove([`${userId}/`]);
   await supabase.storage.from('cert-documents').remove([`${userId}/`]);
   await supabase.storage.from('cv-uploads').remove([`${userId}/`]);
   await supabase.storage.from('pdf-exports').remove([`${userId}/`]);

   // 3. Anonymise user record (don't hard-delete — preserves endorsement graph)
   await supabase.from('users').update({
     full_name: '[Deleted User]',
     display_name: '[Deleted User]',
     bio: null,
     phone: null,
     whatsapp: null,
     email: null,
     location_country: null,
     location_city: null,
     profile_photo_url: null,
     handle: `deleted-${userId.slice(0, 8)}`,
     deleted_at: new Date().toISOString(),
   }).eq('id', userId);

   // 4. Soft-delete attachments
   await supabase.from('attachments')
     .update({ deleted_at: new Date().toISOString() })
     .eq('user_id', userId);

   // 5. Soft-delete certifications
   await supabase.from('certifications')
     .update({ deleted_at: new Date().toISOString() })
     .eq('user_id', userId);

   // 6. Anonymise endorsements GIVEN by this user
   // Keep the endorsement text (it's about the recipient) but anonymise the endorser
   await supabase.from('endorsements')
     .update({ endorser_role_label: null })
     .eq('endorser_id', userId);

   // 7. Delete endorsement requests
   await supabase.from('endorsement_requests')
     .update({ deleted_at: new Date().toISOString() })
     .eq('requester_id', userId);

   // 8. Delete analytics data
   await supabase.from('profile_analytics')
     .delete()
     .eq('user_id', userId);

   // 9. Sign out the user (invalidate session)
   await supabase.auth.admin.deleteUser(userId);
   ```

**Design decision — anonymise vs hard-delete:**
- Hard-deleting a user who gave endorsements to others would delete those endorsements from the recipient's profile — that's unfair to the recipient
- Instead: anonymise the endorser to "[Deleted User]" and keep the endorsement text visible on the recipient's profile
- The deleted user's own profile, files, analytics, and personal data are fully erased
- The handle is changed to `deleted-{id_prefix}` so it's released for reuse (after a delay — add to Phase 1B)

**Migration addition:**
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
```

#### 6C. Account deletion confirmation page: `app/(protected)/app/more/delete-account/page.tsx`

```
┌─────────────────────────────┐
│  Delete Your Account         │
├─────────────────────────────┤
│                              │
│  This will permanently       │
│  delete your account and     │
│  all associated data.        │
│                              │
│  What happens:               │
│  • Your profile, photos,     │
│    and documents are deleted  │
│  • Your certifications are   │
│    removed                   │
│  • Your employment history   │
│    is removed                │
│  • Endorsements you've       │
│    written will show          │
│    "[Deleted User]"          │
│  • Your Pro subscription     │
│    (if active) is cancelled  │
│                              │
│  This cannot be undone.      │
│                              │
│  Type DELETE MY ACCOUNT       │
│  to confirm:                 │
│  [________________________]  │
│                              │
│  [Delete Account]  ← red     │
│  [Cancel]                    │
│                              │
└─────────────────────────────┘
```

#### 6D. Data export button in More tab

Add to the Privacy section of `app/(protected)/app/more/page.tsx`:

```
Privacy
  [Download my data]  → calls GET /api/account/export
  [Delete my account] → navigates to /app/more/delete-account
```

#### 6E. Cookie consent banner

YachtieLink uses essential cookies only (auth session). No tracking cookies. Still need a minimal banner for GDPR compliance.

Create `components/CookieBanner.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t z-50">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm">
          We use essential cookies for authentication. No tracking cookies.{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
        <button
          onClick={() => { localStorage.setItem('cookie_consent', 'true'); setVisible(false); }}
          className="px-4 py-2 bg-foreground text-background rounded-lg text-sm whitespace-nowrap"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
```

Add to root layout, below `PostHogProvider`.

**Why so simple:** We don't use tracking cookies. PostHog uses localStorage (not cookies). Auth cookies are essential (exempt from consent in GDPR). This banner exists purely for transparency and legal completeness.

---

### TASK 7: Legal Pages

#### 7A. Terms of Service: `app/(public)/terms/page.tsx`

Server component — static content page.

**Content structure** (founder will refine the text, but provide this structure):

```markdown
# Terms of Service

Last updated: [date]

## 1. Acceptance of Terms
By using YachtieLink, you agree to these terms.

## 2. Account Registration
- You must provide accurate information
- You are responsible for your account security
- One account per person

## 3. User Content
- You own your content (profile, bio, endorsements)
- You grant YachtieLink a license to display your content
- You must not post false or misleading information
- Endorsements must reflect genuine professional experience

## 4. Endorsement Rules
- Endorsements require shared yacht employment
- You may edit or delete endorsements you've written
- Fake endorsements may result in account suspension

## 5. Crew Pro Subscription
- Pricing: EUR 12/month or EUR 9/month billed annually
- Cancel anytime via account settings
- No refunds for partial billing periods
- Pro features are revoked upon cancellation

## 6. Prohibited Conduct
- Creating fake accounts
- Harassing other users
- Scraping or automated access
- Impersonating others

## 7. Termination
- We may suspend accounts that violate these terms
- You may delete your account at any time

## 8. Limitation of Liability
- YachtieLink is provided "as is"
- We don't verify employment claims or endorsements
- We are not responsible for hiring decisions made based on profiles

## 9. Governing Law
[To be determined — likely Ireland or Netherlands based on company registration]

## 10. Contact
ari@yachtie.link
```

**For Sonnet:** Create the page with this structure and placeholder text. Mark sections that need legal review with `[LEGAL REVIEW NEEDED]`. The founder will have a lawyer refine it before launch.

#### 7B. Privacy Policy: `app/(public)/privacy/page.tsx`

Server component — static content page.

**Content structure:**

```markdown
# Privacy Policy

Last updated: [date]

## 1. Information We Collect
- Account information (name, email, phone)
- Professional information (employment history, certifications)
- Content you create (endorsements, bio)
- Usage data (page views, feature usage)
- Payment information (processed by Stripe — we don't store card details)

## 2. How We Use Your Information
- To provide the YachtieLink service
- To display your public profile
- To send transactional emails (endorsement requests, cert expiry alerts)
- To improve the service (anonymised analytics)

## 3. Information Sharing
- Your public profile is visible to anyone with the link
- Contact info visibility is controlled by your settings
- We do not sell your data
- We share payment data with Stripe for billing

## 4. Data Storage
- Data stored in the EU (Supabase EU region)
- Files stored securely with access controls
- Passwords are hashed (handled by Supabase Auth)

## 5. Your Rights (GDPR)
- Access: View your data in your profile
- Export: Download all your data (JSON export)
- Deletion: Delete your account and all associated data
- Correction: Edit your profile at any time
- Portability: Export and take your data elsewhere

## 6. Cookies
- Essential cookies only (authentication)
- No tracking cookies
- PostHog analytics uses localStorage, not cookies

## 7. Data Retention
- Active accounts: data retained while account is active
- Deleted accounts: personal data removed within 30 days
- Anonymised analytics may be retained indefinitely

## 8. Children
- YachtieLink is for professional use by adults only
- We do not knowingly collect data from anyone under 18

## 9. Changes to This Policy
- We will notify users of material changes via email

## 10. Contact
Data Controller: [Company name — TBD]
Email: ari@yachtie.link
```

#### 7C. Link legal pages from More tab

Update the legal section in `app/(protected)/app/more/page.tsx`:
- "Terms of Service" → links to `/terms` (open in new tab or navigate)
- "Privacy Policy" → links to `/privacy`

Remove the "Coming soon" labels.

#### 7D. Link legal pages from footer/welcome

Add links to Terms and Privacy Policy on:
- `/welcome` page (bottom, small text)
- Any signup form footer: "By signing up, you agree to our Terms of Service and Privacy Policy"

---

### TASK 8: Performance + QA

#### 8A. Image optimization

Audit all `<img>` tags in the codebase and replace with `next/image`:

```tsx
import Image from 'next/image';

// Replace:
<img src={user.profile_photo_url} alt={user.display_name} />

// With:
<Image
  src={user.profile_photo_url}
  alt={user.display_name || 'Profile photo'}
  width={80}
  height={80}
  className="rounded-full object-cover"
/>
```

Check these locations:
- Profile page (IdentityCard)
- Public profile page
- Endorsement cards (endorser photos)
- Onboarding
- CV tab preview

**Add `remotePatterns` to `next.config.ts`:**
```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',  // Supabase storage
    },
  ],
},
```

#### 8B. Database query audit

Review all Supabase queries for:
1. **Missing indexes:** Any query filtering on a column without an index
2. **N+1 queries:** Any loop that makes individual DB queries (should be a single query with joins)
3. **Over-fetching:** Any `select('*')` that should be `select('id, name, ...')`
4. **Missing `.single()`:** Any query expecting one row but not using `.single()`

**Key indexes to add** (if not already present):

```sql
-- Sprint 8 performance indexes
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_endorsements_recipient ON public.endorsements (recipient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON public.endorsements (endorser_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_endorsement_requests_requester ON public.endorsement_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.certifications (user_id);
CREATE INDEX IF NOT EXISTS idx_users_handle ON public.users (handle);
```

Add to the Sprint 8 migration.

#### 8C. Lighthouse audit

Run Lighthouse on the public profile page:

```bash
npx lighthouse https://yachtie.link/u/[test-handle] --output json --output-path ./lighthouse.json
```

Target scores:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

Common fixes:
- Add `alt` text to all images
- Ensure colour contrast meets WCAG AA
- Add `<html lang="en">`
- Ensure all interactive elements are keyboard accessible
- Add proper heading hierarchy (h1 → h2 → h3)

**For Sonnet:** Run the audit, fix anything under 90. Don't spend time on micro-optimizations. Focus on obvious wins: missing alt text, contrast issues, missing lang attribute.

#### 8D. Error boundary

Create `app/error.tsx` (Next.js App Router error boundary):

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted mb-4">We've been notified and are looking into it.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-foreground text-background rounded-lg"
      >
        Try again
      </button>
    </div>
  );
}
```

Also create `app/not-found.tsx`:

```tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted mb-4">The page you're looking for doesn't exist.</p>
      <a href="/" className="px-4 py-2 bg-foreground text-background rounded-lg">
        Go home
      </a>
    </div>
  );
}
```

#### 8E. API error standardisation

Create `lib/api/errors.ts`:

```ts
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  console.error('API error:', error);
  Sentry.captureException(error);

  // Never expose stack traces or internal details
  return apiError('An unexpected error occurred', 500);
}
```

Update all API routes to use `handleApiError` in catch blocks instead of returning raw error messages.

#### 8F. End-to-end QA checklist

This is not code — it's a testing checklist the founder runs manually before launch. Save as `notes/launch_qa_checklist.md`:

```markdown
# Launch QA Checklist

## Critical Path (must pass)
- [ ] Signup with email → verify email → login
- [ ] Signup with Google OAuth → login
- [ ] Signup with Apple OAuth → login
- [ ] Complete onboarding (all 6 steps)
- [ ] Add yacht (new + existing)
- [ ] Add certification with document upload
- [ ] Edit profile (bio, photo, contact info)
- [ ] Request endorsement → email received with deep link
- [ ] Follow deep link → write endorsement → appears on recipient profile
- [ ] View public profile at /u/:handle (logged out)
- [ ] Share public profile link → OG preview correct
- [ ] Upload CV → parse → review → save
- [ ] Generate PDF → download → content correct
- [ ] Subscribe to Pro → Stripe Checkout → webhook fires → status updates
- [ ] Cancel Pro → Stripe Portal → webhook fires → features revoked
- [ ] Download data export → JSON contains all user data
- [ ] Delete account → data removed → session invalidated

## Mobile Safari (iPhone)
- [ ] All screens render correctly
- [ ] Bottom tab bar doesn't overlap iOS home indicator
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll on any screen
- [ ] Dark mode works (system preference)
- [ ] Photo upload works (camera + library)
- [ ] File upload works (CV PDF/DOCX)

## Desktop (Chrome)
- [ ] Responsive layout works at 1024px+
- [ ] All features accessible
- [ ] Keyboard navigation works

## Security
- [ ] Cannot access /app/* without auth
- [ ] Cannot view other user's private data via API
- [ ] Cannot create endorsement without shared yacht
- [ ] Rate limits trigger on abuse
- [ ] Stripe webhook rejects invalid signatures
- [ ] No console errors or warnings in production

## Dark Mode
- [ ] Every screen checked in dark mode
- [ ] No invisible text or broken contrast
- [ ] Public profile respects viewer's system preference
```

---

## Migration: Sprint 8 Database Changes

### `supabase/migrations/YYYYMMDDNNNNNN_sprint8_launch_prep.sql`

```sql
-- Sprint 8: Launch Prep

-- 1. Soft-delete column on users for GDPR account deletion
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_attachments_user_active
  ON public.attachments (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_endorsements_recipient_active
  ON public.endorsements (recipient_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_endorsements_endorser_active
  ON public.endorsements (endorser_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_endorsement_requests_requester
  ON public.endorsement_requests (requester_id);

CREATE INDEX IF NOT EXISTS idx_certifications_user
  ON public.certifications (user_id);

CREATE INDEX IF NOT EXISTS idx_users_handle
  ON public.users (handle)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
```

---

## File Change Summary

### New files (18):
| File | Purpose |
|------|---------|
| `components/providers/PostHogProvider.tsx` | PostHog analytics provider |
| `lib/analytics/events.ts` | Client-side event tracking |
| `lib/analytics/server.ts` | Server-side event tracking |
| `lib/validation/schemas.ts` | Centralised Zod schemas |
| `lib/validation/validate.ts` | Request validation helper |
| `lib/validation/sanitize.ts` | HTML sanitisation |
| `lib/rate-limit/limiter.ts` | Rate limit core (Vercel KV) |
| `lib/rate-limit/helpers.ts` | Pre-configured rate limit categories |
| `lib/cors.ts` | CORS headers helper |
| `lib/api/errors.ts` | Standardised API error responses |
| `app/error.tsx` | Error boundary |
| `app/not-found.tsx` | 404 page |
| `app/(public)/terms/page.tsx` | Terms of Service |
| `app/(public)/privacy/page.tsx` | Privacy Policy |
| `app/(public)/invite-only/page.tsx` | Invite-only landing page |
| `app/api/account/export/route.ts` | GDPR data export |
| `app/api/account/delete/route.ts` | Account deletion |
| `app/(protected)/app/more/delete-account/page.tsx` | Deletion confirmation UI |
| `components/CookieBanner.tsx` | Cookie consent banner |
| `notes/launch_qa_checklist.md` | Manual QA checklist |
| `supabase/migrations/NNNN_sprint8_launch_prep.sql` | DB changes |

### Modified files (12+):
| File | Change |
|------|--------|
| `next.config.ts` | Security headers + Sentry + image config |
| `app/layout.tsx` | Add PostHogProvider + CookieBanner |
| `middleware.ts` | Invite-only gate |
| `app/(protected)/app/more/page.tsx` | Privacy section (export/delete), legal links |
| `app/api/endorsements/route.ts` | Add Zod + rate limit |
| `app/api/endorsements/[id]/route.ts` | Add Zod + rate limit |
| `app/api/endorsement-requests/route.ts` | Add Zod + rate limit |
| `app/api/cv/parse/route.ts` | Add Zod + rate limit |
| `app/api/cv/generate-pdf/route.ts` | Add Zod + rate limit |
| `app/api/stripe/checkout/route.ts` | Add Zod + rate limit |
| `app/(public)/u/[handle]/page.tsx` | Add profile view rate limit |
| `package.json` | New dependencies |
| Various components | Replace `<img>` with `next/image` |
| Various API routes | Add PostHog events + Sentry + error standardisation |

### New npm packages (5):
| Package | Purpose |
|---------|---------|
| `zod` | Input validation |
| `posthog-js` | Client analytics |
| `posthog-node` | Server analytics |
| `@sentry/nextjs` | Error tracking |
| `@vercel/kv` | Rate limiting (Redis) |

### New environment variables (7):
| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | PostHog API host |
| `SENTRY_DSN` | Server | Sentry error tracking |
| `SENTRY_AUTH_TOKEN` | Server | Sentry source map uploads |
| `KV_REST_API_URL` | Server | Vercel KV endpoint |
| `KV_REST_API_TOKEN` | Server | Vercel KV auth |
| `CRON_SECRET` | Server | Vercel Cron auth |
| `SIGNUP_MODE` | Server | `public` or `invite` |

---

## Key Constraints for Sonnet

1. **Zod replaces manual validation — don't keep both.** When adding Zod schemas to existing routes, remove the old manual checks (length checks, type checks). The Zod schema IS the validation layer now. Keeping both creates confusion about which is the source of truth.

2. **Rate limiting must use Vercel KV, not in-memory counters.** Serverless functions are stateless — in-memory counters reset on every cold start. Vercel KV (Upstash Redis) persists across invocations.

3. **PostHog `autocapture: false`.** We want named events only. Autocapture generates thousands of noisy click events that make dashboards useless. Every event we track should be intentionally placed.

4. **Sentry `replaysSessionSampleRate: 0`.** No session replays. This is a trust platform with personal data. We capture error replays (50%) for debugging but never record normal user sessions.

5. **Never expose stack traces in production.** All API catch blocks should use `handleApiError()` which logs to Sentry and returns a generic message. Don't return `error.message` or `error.stack` to the client.

6. **Account deletion is anonymisation, not hard-delete.** Don't delete endorsements written by a deleted user — they belong to the recipient's profile. Anonymise the endorser to "[Deleted User]" instead. Hard-delete the user's own data (profile, files, analytics).

7. **Cookie banner is minimal because we don't use tracking cookies.** PostHog uses localStorage. Auth uses HTTP-only session cookies (essential, GDPR-exempt). The banner exists for transparency, not because we need consent.

8. **CORS exception for Stripe webhook.** Do NOT add CORS headers to the Stripe webhook endpoint. Stripe sends webhooks server-to-server, not from a browser. CORS would break webhook delivery.

9. **Legal pages are placeholders.** Mark sections needing legal review with `[LEGAL REVIEW NEEDED]`. The founder will have a lawyer review before launch. Don't skip creating the pages — having the structure is better than nothing.

10. **Performance: fix obvious wins only.** Replace `<img>` with `next/image`. Add missing indexes. Don't over-optimise. If Lighthouse scores >90, stop. The product ships to a small initial userbase — premature performance tuning wastes time.

11. **Growth control is env-var based.** No admin panel, no database flag. Just `SIGNUP_MODE=invite` in Vercel env vars. Change it → auto-redeploy → done. Simplest possible approach for a single-founder team.

12. **The QA checklist is manual.** Don't try to automate it with Playwright or Cypress. That's Sprint 9+ work. Sprint 8 is about the founder clicking through every flow on their phone and verifying it works.

---

## Verification Plan

### Instrumentation
1. Sign up → PostHog receives `profile.created` event
2. Create endorsement → PostHog receives `endorsement.created`
3. Trigger a server error → Sentry receives the exception with context
4. Check PostHog dashboard → all 10 events flowing

### Validation
5. POST /api/endorsements with missing content → 400 with Zod error details
6. POST /api/endorsements with content < 10 chars → 400 with validation error
7. POST /api/endorsements with valid data → 200 (no regression)
8. POST /api/stripe/checkout with invalid plan → 400

### Rate Limiting
9. Hit endorsement create 6 times in 24h → 6th request returns 429
10. Check `Retry-After` header is present on 429 response
11. Hit public profile 101 times in 1 minute from same IP → 101st returns 429

### Security
12. Check response headers include X-Frame-Options, X-Content-Type-Options, etc.
13. Cross-origin request from non-yachtie.link domain → CORS blocked
14. Stripe webhook with tampered signature → 400 rejected

### Growth Controls
15. Set `SIGNUP_MODE=invite` → `/welcome` redirects to invite-only page
16. Set `SIGNUP_MODE=public` → `/welcome` works normally

### GDPR
17. Download data export → JSON contains all user data across all tables
18. Delete account → profile shows "[Deleted User]", files deleted, session invalidated
19. Deleted user's endorsements still visible on recipient profiles (anonymised)
20. Cookie banner shows on first visit, hidden after "Got it"

### Legal
21. `/terms` page renders with full content
22. `/privacy` page renders with full content
23. Links from More tab work
24. Signup page links to Terms + Privacy Policy

### Performance
25. Lighthouse on public profile page: all scores >90
26. All images use next/image
27. No N+1 queries in server components
28. Page load <2 seconds on 3G throttle

### Dark Mode
29. Every screen visually checked in dark mode
30. Public profile respects viewer's system preference
31. No invisible text or broken contrast anywhere

---

## Implementation Sequence

Build in this order — each group unlocks the next:

1. **Task 1** (Dependencies + PostHog + Sentry) — foundational, everything else uses these
2. **Task 2** (Zod validation) — hardens all API routes, clean up existing validation
3. **Task 3** (Rate limiting) — depends on Vercel KV setup
4. **Task 4** (Security headers + CORS) — independent, can run alongside
5. **Task 6** (GDPR) — data export + account deletion + cookie consent
6. **Task 7** (Legal pages) — independent, simple static pages
7. **Task 5** (Growth controls) — simple middleware change
8. **Task 8** (Performance + QA) — final pass, runs last
