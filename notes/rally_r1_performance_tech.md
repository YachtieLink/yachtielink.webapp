# Rally R1 — Performance & Technical Quality Audit

**Agent 3 | 2026-03-16 | Research only — no source edits**

---

## 1. Page Load Performance

### 1A. Waterfall Queries That Could Be Parallelized

**CRITICAL — Profile page (`app/(protected)/app/profile/page.tsx`)**
- Lines 18-62: Four sequential queries (profile, attachments, certs, endorsements) are executed one after another. Only the profile fetch needs to happen first (to get `user.id` and check `onboarding_complete`). The remaining three should be wrapped in `Promise.all()`.
- Estimated savings: ~200-400ms (3 round trips to Supabase eliminated).

**CRITICAL — Insights page (`app/(protected)/app/insights/page.tsx`)**
- Lines 32-45: Two sequential `Promise.all()` blocks. The first fetches profile + pro status, and the second fetches attachments + certs. These two blocks could be merged into a single `Promise.all()` since neither depends on the other — only the `proStatus.isPro` check at line 78 gates the analytics queries. The milestones check (attachments/certs) is independent and could run in the first block.
- Lines 82-93: The 5 analytics RPCs are already parallelized (good).

**HIGH — Public profile page (`app/(public)/u/[handle]/page.tsx`)**
- Lines 14-44 (`generateMetadata`) + lines 51-63 (page function): The user is fetched TWICE — once for metadata and once for the page. Next.js deduplicates `fetch()` but not Supabase client calls. The `generateMetadata` query fetches `full_name, display_name, primary_role, profile_photo_url, bio` and the page fetches 18 columns. Both hit the same row. Consider using React `cache()` wrapper around the Supabase query to deduplicate.
- Lines 103-209 (viewer relationship): Phase 3 queries run sequentially AFTER Phase 2 completes. The `viewer.getUser()` call and viewer's attachments fetch could start in parallel with Phase 2 data fetches.

**MEDIUM — Network page (`app/(protected)/app/network/page.tsx`)**
- Lines 73-83: Second `Promise.all()` for colleague profiles and yacht names runs after the first RPC. This is inherently sequential (needs RPC results). Acceptable pattern.

### 1B. Unnecessary Data Fetches

**HIGH — App layout double-fetch (`app/(protected)/app/layout.tsx` + child pages)**
- The layout fetches `getUser()` + queries `users.onboarding_complete` (lines 10-24).
- Every child page (profile, insights, network, cv, more) also calls `getUser()` and often re-fetches `users.*` from the same table.
- The layout's auth check is necessary for the redirect, but the `onboarding_complete` check could be moved to middleware or a shared helper that caches the result.
- This means every page load inside `/app/*` makes 2+ auth calls and 2+ profile reads.

**MEDIUM — More page (`app/(protected)/app/more/page.tsx`)**
- This is a `'use client'` page that fetches subscription status in a `useEffect` on mount (line 72-91). This causes a visible delay — subscription info isn't available on first paint. Should be a server component that passes subscription data as props, or use the layout to pass it down.

**LOW — CV page (`app/(protected)/app/cv/page.tsx`)**
- Fetches the full profile with 21 columns (line 13-22) including `latest_pdf_path` and `subscription_status`. The `PublicProfileContent` component receives this as `profile as any`. The `as any` cast hides type mismatches.

### 1C. Server vs Client Component Decisions

**Good decisions:**
- Profile page, Insights page, Network page, CV page, Public profile — all server components. Correct.
- Onboarding Wizard, BottomTabBar, More/Settings, CvActions, WriteEndorsementForm — all client components with interactivity. Correct.

**Questionable:**
- More page (`app/(protected)/app/more/page.tsx`) is entirely `'use client'` but only needs client behavior for theme toggle and sign-out. The subscription status display, settings links, and legal links are all static. Consider splitting into a server component wrapper with small client islands.

### 1D. Image Optimization

**CRITICAL — Public profile uses raw `<img>` tags instead of `next/image`**
- `components/public/PublicProfileContent.tsx` line 137: `<img src={user.profile_photo_url}` — no lazy loading, no size optimization, no responsive sizing, no blur placeholder.
- `components/public/EndorsementCard.tsx` line 39: Same issue for endorser photos.
- Profile photos are served from Supabase Storage (`*.supabase.co`), which IS configured in `next.config.ts` remotePatterns. So `next/image` would work.
- `components/audience/AudienceTabs.tsx` line 212: Uses `next/image` correctly for colleague photos. Inconsistent.
- Impact: Public profile (the most SEO-critical, shareable page) has unoptimized images.

### 1E. Bundle Size Concerns

**HIGH — `@react-pdf/renderer` in client bundle**
- `components/pdf/ProfilePdfDocument.tsx` is imported by `app/api/cv/generate-pdf/route.ts` (server-only API route). This is fine — it should tree-shake. But if it's ever imported by a client component, it would add ~200KB+ to the bundle.
- `react-image-crop` (~50KB) — used only on photo pages. Good candidate for dynamic import.

**MEDIUM — `openai` package (~100KB+)**
- Imported in API routes only. Safe.

**MEDIUM — `react-qr-code` imported in `PublicProfileContent.tsx`**
- This component is rendered server-side for the public profile. The QR code component uses SVG (lightweight). But it's also imported in `CvActions.tsx` (client component) where it's conditionally rendered. Could be dynamically imported: `const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })`.

**LOW — `posthog-js` (~50KB)**
- Loaded via PostHogProvider at root layout. Acceptable for analytics. `autocapture: false` is good.

---

## 2. Database Query Efficiency

### 2A. N+1 Query Patterns

**HIGH — Endorsement creation notification (`app/api/endorsements/route.ts` lines 79-94)**
- After inserting an endorsement, three separate queries fetch: recipient profile, endorser profile, and yacht name. These are already individual queries but could be combined into a single RPC or joined query. Minor — only runs on endorsement creation.

**MEDIUM — Cert expiry cron (`app/api/cron/cert-expiry/route.ts` lines 50-70)**
- Loops through certs and updates each one individually (line 62/68). For 100+ Pro users with expiring certs, this becomes `2N` queries (1 email + 1 update per cert). Should batch updates.

**MEDIUM — Analytics nudge cron (`app/api/cron/analytics-nudge/route.ts` lines 22-33)**
- Fetches ALL `profile_analytics` rows for the past 7 days (line 22-24), then counts them in JS (lines 31-33). With 1000 users and 10 views each, that's 10,000 rows transferred. Should use a `GROUP BY` query or RPC.

### 2B. Missing Indexes

**Based on query patterns observed:**

- `users.subscription_status` + `users.founding_member`: Used by founding member count query in checkout (`app/api/stripe/checkout/route.ts`). **Composite index recommended**: `(subscription_status, founding_member) WHERE subscription_status = 'pro'`.
- `endorsement_requests.requester_id` + `created_at`: Used by `endorsement_requests_today` RPC (referenced but not in visible migrations). Check if this function uses an efficient query.
- `certifications.expires_at` combined with `user_id` and join to `users.subscription_status`: The cert-expiry cron does an inner join on `users` with a filter on `subscription_status = 'pro'`. The join on `certifications.user_id = users.id` with the date range filter should be efficient given existing indexes.

**Existing indexes look good:**
- `idx_profile_analytics_user_event_date` covers analytics queries.
- `idx_users_handle` and `idx_users_stripe_customer` cover lookup patterns.
- Partial indexes on `deleted_at IS NULL` for attachments/endorsements are correct.

### 2C. Over-Fetching

**MEDIUM — Account export (`app/api/account/export/route.ts` lines 27-34)**
- Uses `select('*')` on every table. For GDPR export this is intentional and correct.

**LOW — Profile page and CV page fetch many columns but use most of them.**

### 2D. RPC Efficiency

- `get_colleagues`: Self-join on `attachments` table. Efficient with the `user_id` and `yacht_id` indexes. Good.
- `get_analytics_timeseries`: Uses `date_trunc('day')` with `GROUP BY`. Covered by the composite index. Good.
- `are_coworkers_on_yacht`: Simple `EXISTS` with indexed join. Good.
- `record_profile_event`: Simple `INSERT`. Good. Fire-and-forget pattern in public profile page (line 66) is correct.

### 2E. Supabase Client Creation

- Server: `createClient()` creates a new client per request via `await cookies()`. This is the correct pattern for Next.js App Router.
- Client: `createClient()` creates a new browser client per call. The `@supabase/ssr` `createBrowserClient` returns a singleton internally — correct.
- Admin: `createServiceClient()` creates a new client per call. NOT a singleton. For webhook/cron routes that make multiple admin calls, this means multiple `createClient` invocations. Should be cached or created once per request.
- **Issue in `app/api/cv/parse/route.ts` line 33-36**: Creates a raw `createSupabaseClient` instead of using `createServiceClient()` from `lib/supabase/admin.ts`. Same in `generate-pdf/route.ts` line 108, and `download-pdf/route.ts` line 20. Inconsistent — should use the centralized admin helper.

---

## 3. API Route Quality

### 3A. Error Handling Consistency

**MEDIUM — Inconsistent error response patterns:**
- Most routes return `NextResponse.json({ error: '...' }, { status: N })`. Good.
- `lib/api/errors.ts` provides `apiError()` and `handleApiError()` with Sentry integration, but NO API route actually uses `handleApiError()`. The function exists but is dead code.
- API routes catch errors inline and return custom messages. Top-level unhandled exceptions would 500 without Sentry capture. Should wrap route handlers in try/catch using `handleApiError()`.

**Specific issues:**
- `app/api/endorsement-requests/[id]/route.ts` line 63: `PUT` handler parses body without Zod validation (line 63 `await req.json() as UpdateRequestBody`). The `action` field is validated manually but not with a schema. Inconsistent with other routes that use `validateBody()`.
- `app/api/endorsement-requests/share-link/route.ts` line 21: `await req.json()` with no validation. `yacht_id` is not validated as UUID.

### 3B. Input Validation

**Good:**
- All primary mutation routes (endorsements CRUD, endorsement-requests POST, CV parse, Stripe checkout, account delete) use `validateBody()` + Zod schemas. Solid pattern.

**Gaps:**
- `app/api/endorsement-requests/share-link/route.ts`: No Zod validation on `yacht_id`.
- `app/api/endorsement-requests/[id]/route.ts` PUT: No Zod validation on body.
- `app/api/endorsements/route.ts` GET: `user_id` query param not validated as UUID.
- `app/api/cv/download-pdf/route.ts`: GET with no rate limiting.

### 3C. Rate Limiting

**Good coverage:**
- Endorsement create: 5/24h/user
- Endorsement edit: 20/1h/user
- PDF generate: 10/1h/user
- File upload: 20/1h/user
- Checkout: Uses `auth` rate limit (10/15min/IP)
- CV parse: Double-rate-limited (both `applyRateLimit` and `check_cv_parse_limit` RPC). Redundant but safe.

**Missing:**
- `app/api/cv/download-pdf/route.ts`: No rate limit. Could be abused to generate excessive signed URLs.
- `app/api/stripe/portal/route.ts`: No rate limit. Could spam Stripe portal session creation.
- `app/api/endorsement-requests/share-link/route.ts`: No rate limit.
- `app/api/account/export/route.ts`: Uses `fileUpload` budget — acceptable.

### 3D. Auth Checks

**All protected routes check auth.** Verified:
- Every route that requires auth calls `supabase.auth.getUser()` and returns 401 if missing.
- Cron routes verify `CRON_SECRET` header.
- Stripe webhook verifies signature.
- Endorsement request GET (`/api/endorsement-requests/[id]`) is intentionally public (token = credential). Acceptable.
- Account delete: Auth + confirmation phrase. Good.

### 3E. Response Format Consistency

- All routes return `{ error: string }` on failure and `{ data | ok | endorsement | ... }` on success.
- Some routes return `{ ok: true }`, others return the created entity. Inconsistent but not harmful.
- Recommendation: Standardize on `{ ok: true, data: T }` for success.

---

## 4. Auth & Security

### 4A. Session Handling

- Uses `@supabase/ssr` with cookie-based sessions. Correct for Next.js.
- Server components use `createClient()` which reads cookies.
- **No middleware.ts at the app root.** The `lib/supabase/middleware.ts` file exists but is never imported. Session refresh on navigation relies on the server component cookie handler's try/catch pattern (line 29 of `lib/supabase/server.ts`). This means expired JWT tokens may not be refreshed until a Server Action or API call. Could cause stale sessions on long-idle tabs.
- Fix: Add a root `middleware.ts` that calls `createMiddlewareClient()` to refresh sessions proactively.

### 4B. CSRF Protection

- No explicit CSRF tokens. Relies on:
  1. SameSite cookies (Supabase default)
  2. JSON Content-Type requirement (browser won't send JSON cross-origin without CORS preflight)
  3. CORS restrictions in `lib/cors.ts`
- **Note:** `corsHeaders()` is defined but never imported by any API route. CORS headers are not being applied to API responses. This is actually fine because Next.js API routes on the same domain don't need CORS, and the security headers in `next.config.ts` include `X-Frame-Options: DENY`. But the dead code should be cleaned up.

### 4C. XSS Vectors

**LOW risk:**
- React auto-escapes JSX interpolation. All user-generated content (bio, endorsement text, names) is rendered via JSX `{variable}` syntax. Safe.
- `sanitizeHtml()` exists in `lib/validation/sanitize.ts` for non-JSX contexts (emails, PDFs). Good.
- `dangerouslySetInnerHTML` is used ONLY in the root layout for the theme script (line 47). Content is hardcoded, not user-supplied. Safe.

**MEDIUM risk — Email templates:**
- Endorsement notification emails (`app/api/endorsements/route.ts` lines 136-176) embed `endorserName`, `yachtName`, and `excerpt` directly into HTML strings via template literals. These are NOT sanitized through `sanitizeHtml()`.
- If a user's display name contains HTML like `<script>alert('xss')</script>`, it would be injected into the email HTML. Most email clients strip `<script>` tags, but `<img onerror=...>` or CSS injection attacks could work in some clients.
- Same issue in `app/api/endorsement-requests/route.ts` lines 13-65.
- Fix: Pass all user-supplied strings through `sanitizeHtml()` before embedding in email templates.

### 4D. SQL Injection

- All queries use Supabase client's parameterized query builder (`.eq()`, `.select()`, etc.). Safe.
- RPCs use parameterized calls. Safe.
- **One concern:** `app/(protected)/app/network/page.tsx` line 51 builds an `.or()` filter:
  ```
  .or(`recipient_user_id.eq.${user.id},recipient_email.eq.${userEmail}`)
  ```
  The `user.id` comes from auth (trusted UUID). The `userEmail` comes from `user.email` (also from auth). But if email contained special PostgREST filter syntax, it could manipulate the query. Since `user.email` is from the auth provider and validated, this is low risk but should use proper parameterization.

### 4E. File Upload Security

- `lib/storage/upload.ts`: MIME type validation against allowlists. Good.
- Size limits enforced client-side (5MB photos, 10MB certs/CVs). Good.
- Image resizing to 800px max dimension before upload. Good.
- **Gap:** Server-side validation relies on Supabase Storage policies (not shown in code). The client-side validation is bypassable. Ensure storage bucket policies enforce size limits and MIME types.
- **Gap:** No virus/malware scanning on uploaded files (cert documents, CVs). Low risk for Phase 1 but worth noting.

### 4F. Rate Limiting on Sensitive Endpoints

- Auth-related: Login page has no rate limiting visible. Supabase has built-in rate limiting on `signInWithPassword`, but application-level rate limiting would add defense in depth.
- Account deletion: No rate limiting (uses Zod validation + confirmation phrase instead). Acceptable.
- Password reset (`app/(auth)/reset-password/page.tsx`): Not audited — uses Supabase's `resetPasswordForEmail()`. Supabase rate limits this.

---

## 5. State Management & Client-Side Quality

### 5A. Unnecessary Re-renders

**MEDIUM — Onboarding Wizard (`components/onboarding/Wizard.tsx`)**
- The `supabase` client is created at component scope (line 205, 395, 566, 814, 985). Each `createClient()` call during every render creates a new object. Should use `useMemo` or move outside component.
- Actually, `@supabase/ssr`'s `createBrowserClient` returns a singleton. So this is safe. But the pattern is confusing.

**LOW — DeepLinkFlow (`components/endorsement/DeepLinkFlow.tsx`)**
- `useEffect` at line 84 has `[currentUserId, request.yacht_id, request.requester_id]` as deps. These are stable props. Effect runs once. Correct.

### 5B. Memory Leaks

**LOW — Wizard debounce timers**
- `components/onboarding/Wizard.tsx` lines 204, 565: `debounceRef` timers are set up but never cleaned up on unmount. If the component unmounts mid-debounce, the timer fires after unmount and calls `setState` on an unmounted component. React 18+ suppresses the warning but it's still a leak.
- Fix: Add `useEffect` cleanup that clears `debounceRef.current` on unmount.

### 5C. Stale Data After Mutations

**HIGH — No router refresh after mutations**
- When an endorsement is created via `WriteEndorsementForm`, the component calls `onSuccess()` which navigates to `/app/network`. But the network page is a server component that was rendered with stale data. Next.js caching may serve the old version.
- Same issue: After creating an attachment in the onboarding wizard, navigating to `/app/profile` may show stale data if the router cache is warm.
- Fix: Call `router.refresh()` after navigation, or use `revalidatePath()` in server actions.

**MEDIUM — More page subscription display**
- Subscription status is fetched client-side in `useEffect`. After upgrading via Stripe, the user returns to `/app/insights?upgraded=true`. If they then navigate to More, the subscription status may be stale if the Stripe webhook hasn't completed yet. The `useEffect` re-fetches on every mount, which mitigates this, but there's a race condition window.

### 5D. Error Boundaries

- Root `app/error.tsx` with Sentry capture. Good.
- `app/not-found.tsx` exists. Good.
- **No nested error boundaries.** If the profile page throws, the entire app layout's error boundary catches it, which is the root error page. Adding `app/(protected)/app/error.tsx` would provide a better UX (error within the tab bar).

### 5E. Loading States

**CRITICAL — No `loading.tsx` files anywhere in the app.**
- No Suspense boundaries, no loading.tsx files, no skeleton screens for server components.
- Every navigation between tabs (Profile, CV, Insights, Network, More) is a full server render with NO visual loading indicator. The user sees either a blank screen or a flash of old content during navigation.
- Fix: Add `app/(protected)/app/loading.tsx` with a skeleton/spinner. Add per-tab loading files if needed.

---

## 6. Edge Cases & Error Handling

### 6A. Empty States

**Good coverage:**
- Network page: Shows "No endorsements yet" card with CTA.
- Colleagues tab: Shows message about adding yachts.
- Insights chart: Shows "No data yet" for empty charts.

**Gaps:**
- Profile page: If `attachments`, `certs`, or `endorsements` are empty, the section components should handle empty arrays gracefully. Need to verify (sections not fully read). Likely OK since they map over arrays.

### 6B. Network Failure Handling

**LOW — Client-side fetch calls lack retry logic**
- `WriteEndorsementForm`, `CvActions`, `RequestActions` all call `fetch()` without retry. If the network blips, the user gets a single toast error and must manually retry.
- Not critical for MVP but would improve UX.

### 6C. Concurrent Modification

**MEDIUM — Endorsement uniqueness**
- DB constraint `unique_endorsement (endorser_id, recipient_id, yacht_id)` prevents duplicates. API route handles `23505` error code (line 61 of endorsements POST). Good.
- No optimistic locking on endorsement edits. Two tabs editing the same endorsement will last-write-wins. Acceptable for Phase 1.

### 6D. Deleted/Deactivated Accounts

**Good:**
- Account deletion flow (`app/api/account/delete/route.ts`) is thorough: cancels Stripe, deletes storage, anonymizes user, soft-deletes related records, deletes auth user.
- Public profile page handles `notFound()` if user doesn't exist.

**Gap:**
- Deleted users (`deleted_at IS NOT NULL`) can still appear in endorsement data as endorsers. The public profile and network pages don't filter out deleted endorsers. A deleted user's endorsement will show `[Deleted User]` as the name (from anonymization), which is acceptable.

### 6E. Expired Endorsement Request Tokens

- Token lookup page (`app/(public)/r/[token]/page.tsx`) handles: expired (with message), cancelled (with message), not found (404). Good.
- API route (`app/api/endorsement-requests/[id]/route.ts` GET) also handles expired and cancelled. Good.

### 6F. Stripe Webhook Failure Recovery

**MEDIUM:**
- Webhook handler (`app/api/stripe/webhook/route.ts`) processes events synchronously. If the Supabase update fails after signature verification, the webhook returns 200 (line 132) and the event is lost.
- Stripe retries failed webhooks (non-2xx responses), but since the handler always returns 200, retries won't happen.
- Fix: Return 500 if critical database updates fail, so Stripe retries.
- `invoice.payment_failed` handler correctly does NOT downgrade the user (Stripe retries automatically). Good.

---

## 7. Mobile Web Performance

### 7A. Touch Responsiveness

- All interactive elements use Tailwind transition classes. Good.
- `maximumScale: 1` in viewport config prevents pinch-to-zoom. This is a deliberate choice for app-like feel but may cause accessibility issues (users who need to zoom).

### 7B. Scroll Performance

- No virtualized lists. For the network page with potentially hundreds of colleagues, rendering all items at once could be slow on older devices.
- Endorsement lists, attachment lists are typically small (< 50 items). OK.

### 7C. PWA Capabilities

**NOT IMPLEMENTED:**
- No `manifest.json` or `manifest.webmanifest` in `/public/`.
- No service worker.
- No offline support.
- No install prompt.
- No apple-touch-icon in `<head>`.
- Given the mobile-first positioning, this is a significant gap for user experience. Users can't "install" the app on their home screen with a proper icon, splash screen, or offline mode.

### 7D. Viewport Meta Tags

- Viewport correctly set in root layout: `width: device-width, initialScale: 1, maximumScale: 1`. Good.
- Theme color set for both light and dark modes. Good.
- Safe area handling via CSS: `env(safe-area-inset-bottom)` used for tab bar. Good.

### 7E. CSS Performance

- Tailwind v4 with PostCSS. Efficient — no complex selectors.
- CSS variables used extensively. Good for theme switching.
- `overscroll-behavior: none` on html/body prevents iOS Safari bounce. Good.
- No complex animations that would trigger layout thrashing.

---

## 8. Code Quality & Maintainability

### 8A. TypeScript Strictness

**`tsconfig.json` has `"strict": true`.** Good.

**`as any` usage (24 occurrences across 9 files):**
- `app/(protected)/app/profile/page.tsx` lines 102, 105, 108: Section components receive `(attachments as any)`. This bypasses type checking for Supabase's inferred join types.
- `app/(protected)/app/cv/page.tsx` lines 75-78: Same pattern.
- `app/(public)/u/[handle]/page.tsx` lines 129, 174, 217-219: Same pattern.
- `app/api/stripe/webhook/route.ts` lines 51-52: Casting Stripe types.
- `app/api/cv/generate-pdf/route.ts` lines 95-98: Same `as any` for section data.
- `app/api/cron/cert-expiry/route.ts` lines 51, 56: Casting join results.

**Root cause:** Supabase's `.select()` with joins (`yachts(name)`) returns deeply nested types that don't match the component prop interfaces. The `as any` casts are a workaround.

**Fix:** Define shared types that match the Supabase select shapes, or use generated types from `supabase gen types`.

### 8B. Consistent Patterns

**Good:**
- Auth check pattern is consistent: `getUser()` -> redirect/401.
- Soft deletion with `deleted_at` + `.is('deleted_at', null)` filter. Consistent.
- Rate limiting pattern: `applyRateLimit()` -> return if limited. Consistent.
- Validation pattern: `validateBody()` -> return error. Consistent.

**Inconsistencies:**
- Variable naming: `var(--teal-500)` vs `var(--color-teal-500)`. Some components use the non-prefixed form (e.g., `AudienceTabs.tsx`, `MorePage.tsx`) while others use the prefixed `--color-teal-*` form. Both are defined — the non-prefixed ones are shadcn variables. But mixing them is confusing.
- Service client creation: Some API routes use `createServiceClient()` from `lib/supabase/admin.ts`, others use inline `createClient(url, key)` (e.g., `cv/parse/route.ts`).

### 8C. Error Handling Patterns

- `handleApiError()` exists but is unused. Dead code.
- Most API routes handle errors inline. Acceptable but could be DRYer.
- Try/catch for email sending is consistently non-fatal (catches and logs). Good.

### 8D. Code Duplication

**HIGH — Profile data fetching is duplicated across 4 files:**
1. `app/(protected)/app/profile/page.tsx` (lines 18-62)
2. `app/(protected)/app/cv/page.tsx` (lines 13-56)
3. `app/(public)/u/[handle]/page.tsx` (lines 51-100)
4. `app/api/cv/generate-pdf/route.ts` (lines 40-78)

Each file independently selects the same columns from users, attachments, certifications, endorsements with the same filters and ordering. This should be extracted into a shared `getFullProfile(userId)` helper.

**MEDIUM — Email HTML templates duplicated:**
- Endorsement received email (`app/api/endorsements/route.ts` lines 136-176)
- Endorsement request email (`app/api/endorsement-requests/route.ts` lines 13-65)
- Resend email (`app/api/endorsement-requests/[id]/route.ts` lines 146-172)
All three have near-identical HTML structure. Should be a shared template function.

### 8E. Component Abstractions

- UI components (`Button`, `Input`, `Card`, `Toast`, `BottomSheet`) are well-abstracted.
- `PublicProfileContent` is reused in both public profile and CV preview. Good.
- `WriteEndorsementForm` handles both create and edit modes. Good.
- `AudienceTabs` is a well-structured compound component. Good.

---

## 9. Infrastructure & DevOps

### 9A. Caching Strategy

**CRITICAL — No caching configuration.**
- No `revalidate` exports on any page. Default Next.js 16 behavior applies.
- No `cache: 'force-cache'` or `cache: 'no-store'` on fetch calls. Supabase client calls don't use `fetch()` directly, so Next.js cache doesn't apply.
- Public profile pages (`/u/[handle]`) are dynamically rendered every time. These are prime candidates for ISR (Incremental Static Regeneration) with a 60-second revalidation.
- Static pages (terms, privacy, invite-only) should have `export const revalidate = 3600` or be fully static.

### 9B. CDN Usage

- Supabase Storage serves public files via CDN URLs. Profile photos use public URLs with cache-bust timestamps. Good.
- No custom CDN configuration. Vercel's edge network handles Next.js assets. Adequate.

### 9C. Error Monitoring

- Sentry configured for client, server, and edge runtimes. Good.
- `tracesSampleRate: 0.1` (10% of transactions traced). Appropriate for early stage.
- `replaysOnErrorSampleRate: 0.5` — captures 50% of error sessions. Good.
- Root error boundary captures to Sentry. Good.
- **Gap:** API route errors are logged to `console.error` but NOT captured by Sentry (only `handleApiError()` uses Sentry, and it's never called).

### 9D. Logging

- `console.error` used for non-fatal errors (email failures, Stripe issues). Adequate for Vercel's log drain.
- No structured logging library. For Phase 1, `console.*` + Vercel logs + Sentry is sufficient.

### 9E. Database Migrations

- 20 migration files, numbered sequentially. Good.
- Migrations use `IF NOT EXISTS` for idempotency. Good.
- Functions use `CREATE OR REPLACE`. Good.
- No down migrations. Standard for Supabase workflow.

---

## 10. Specific Performance Improvements

### 10A. Making Every Interaction Feel Instant

1. **Add `loading.tsx` files** for the main app routes. This is the single biggest UX improvement available. Even a simple spinner removes the "is it working?" feeling.

2. **Optimistic updates for endorsement submission.** Show a success state immediately while the API call completes in the background. Revert on failure.

3. **Prefetch profile data in the layout.** The app layout already fetches `getUser()` and `onboarding_complete`. Extend this to fetch the full profile and pass it to children via a server-side context or parallel route. Eliminates the child page's profile query.

4. **Use React `cache()` for Supabase queries.** Wrap common queries (user profile, pro status) in `React.cache()` so they deduplicate within a single request.

### 10B. Biggest Latency Bottlenecks

1. **Public profile page:** Potentially 5-7 sequential Supabase queries for a logged-in viewer viewing someone else's profile (Phase 1-3 + viewer relationship). Could be 500ms+ total. The viewer relationship computation (lines 124-209) is the heaviest.

2. **PDF generation:** Downloads file from storage, extracts text, calls OpenAI, renders PDF, uploads to storage. Could be 5-10 seconds. Already has a 15-second timeout. Consider background processing with polling.

3. **Profile page sequential queries:** 4 queries in series instead of parallel. Easy 200ms+ savings.

4. **Onboarding wizard step 3 (Role):** Fetches all departments and roles from Supabase on component mount (`useEffect` line 397). This data is static reference data. Should be fetched server-side and passed as props, or cached aggressively.

### 10C. What Could Be Cached/Preloaded

1. **Reference data (departments, roles, certification_types):** These change rarely. Fetch once server-side and pass to client, or use `unstable_cache` with long TTL.

2. **Public profiles:** Add `export const revalidate = 60` to the public profile page. Most profiles don't change every minute.

3. **Pro status:** Called on multiple pages. Wrap in `React.cache()` for request-level deduplication.

4. **Founding member count:** Queried on every checkout page load AND every insights page load for free users. This count changes rarely. Cache for 5 minutes.

### 10D. Optimistic Update Opportunities

1. **Endorsement creation** — show success immediately, revert on error.
2. **Profile edits (bio, name, etc.)** — update UI immediately, sync in background.
3. **Endorsement request actions (cancel, resend)** — update status pill immediately.
4. **Theme toggle** — already instant (localStorage + DOM manipulation). Good.

### 10E. Streaming/Suspense Opportunities

1. **Public profile page:** Stream the hero section immediately, suspend on endorsements/attachments. Users see the name/photo fast, details load progressively.
2. **Insights page:** Stream the header and time range selector immediately, suspend on analytics data (which involves 5 RPC calls for Pro users).
3. **Network page:** Stream the CTA card, suspend on the colleagues RPC and endorsement data.
4. **Profile page:** Stream the identity card, suspend on attachments/certs/endorsements.

---

## Summary — Top 10 Most Impactful Issues

| Priority | Issue | Category | Impact |
|----------|-------|----------|--------|
| P0 | No `loading.tsx` files — blank screens during navigation | UX/Performance | Every user, every navigation |
| P0 | Profile page: 4 sequential queries should be parallel | Performance | Every profile view, ~200ms wasted |
| P0 | Public profile: `<img>` instead of `next/image` | Performance/SEO | Every shared profile view |
| P1 | No middleware.ts — session refresh not proactive | Auth/Security | Stale sessions on idle tabs |
| P1 | Public profile: duplicate query in `generateMetadata` + page | Performance | Every public profile view |
| P1 | Email templates: user content not sanitized | Security | XSS via email injection |
| P1 | Profile data fetching duplicated across 4 files | Maintainability | Dev velocity, bug surface |
| P1 | Stripe webhook returns 200 even on DB failure | Reliability | Lost subscription events |
| P2 | No PWA manifest or service worker | Mobile UX | Can't install on home screen |
| P2 | No caching strategy (no revalidate, no ISR) | Performance | Every page dynamically rendered |
