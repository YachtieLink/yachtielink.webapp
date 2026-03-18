# Discipline: Auth & Security

How YachtieLink handles authentication, authorisation, privacy, and data protection. Read this when your task touches auth flows, RLS, storage access, GDPR, or security hardening.

---

## Auth Architecture

Supabase Auth with PKCE OAuth/email verification. Four client types:

| Client | File | RLS | Context |
|--------|------|-----|---------|
| Server | `lib/supabase/server.ts` | Yes | API routes, server components |
| Browser | `lib/supabase/client.ts` | Yes | Client components |
| Admin | `lib/supabase/admin.ts` | **No** | Account deletion, webhooks, data export only |
| Middleware | `lib/supabase/middleware.ts` | Yes | Session refresh between requests |

**Auth callback:** `/app/auth/callback/route.ts` — exchanges PKCE code for session, writes to cookies via SSR middleware. Redirect validated with `next.startsWith("/")` to prevent open redirect.

## Route Protection

**Protected layout** (`app/(protected)/app/layout.tsx`):
```typescript
if (!user) redirect('/welcome')
if (!profile?.onboarding_complete) redirect('/onboarding')
```

**Auth layout** (`app/(auth)/layout.tsx`): redirects already-authenticated users to `/app/profile`.

**API routes:** every route checks auth at the top. Never assume — always verify.

## RLS Policy Patterns

Every table has RLS enabled. Standard policies:

**Public read (reference data):**
```sql
create policy "departments: public read"
  on public.departments for select using (true);
```

**Own data:**
```sql
create policy "users: own update"
  on public.users for update using (auth.uid() = id);
```

**Soft-delete filter:**
```sql
create policy "attachments: public read (non-deleted)"
  on public.attachments for select using (deleted_at is null);
```

**Coworker gate (complex):**
```sql
create policy "endorsements: coworker insert"
  on public.endorsements for insert
  with check (
    auth.uid() = endorser_id
    and public.are_coworkers_on_yacht(auth.uid(), recipient_id, yacht_id)
  );
```

**Email-based access:**
```sql
create policy "endorsement_requests: recipient email read"
  on public.endorsement_requests for select
  using (auth.email() = recipient_email or auth.uid() = recipient_user_id);
```

**Key RPC functions** (in `20260313000004_functions.sql`):
- `are_coworkers(user_a, user_b)` — shared yacht attachment
- `are_coworkers_on_yacht(user_a, user_b, yacht)` — stricter, specific yacht
- `check_yacht_established(yacht_id)` — 60+ days + crew threshold

**Naming convention:** `"{table}: {operation} {who}"`

## Storage Bucket Security

| Bucket | Public | Size Limit | Types | Path Convention |
|--------|--------|------------|-------|-----------------|
| profile-photos | Yes | 5 MB | JPEG/PNG/WebP | `{user_id}/avatar.{ext}` |
| cert-documents | No | 10 MB | PDF/JPEG/PNG | `{user_id}/{cert_id}.{ext}` |
| cv-uploads | No | 10 MB | PDF/DOCX | `{user_id}/cv.{ext}` |
| pdf-exports | No | — | PDF | `{user_id}/export.pdf` |

**Ownership enforcement:** `auth.uid()::text = (string_to_array(name, '/'))[1]` — first path segment must be the user's ID.

**Private buckets** use signed URLs with 1-hour expiry, generated at render time.

**Client-side validation** in `lib/storage/upload.ts` — file type, size, image resizing (max 800px, WebP conversion) before upload.

## Rate Limiting

Redis-backed, fail-open (features work if Redis is down). Key limits:

| Category | Limit | Window | Scope |
|----------|-------|--------|-------|
| auth | 10 | 15 min | IP |
| profileView | 100 | 1 min | IP |
| profileEdit | 30 | 1 min | User |
| endorsementCreate | 5 | 24 hours | User |
| fileUpload | 20 | 1 hour | User |
| pdfGenerate | 10 | 1 hour | User |
| aiSummary | 10 | 1 hour | User |
| accountFlag | 10 | 7 days | User |

Returns 429 with `Retry-After` and `X-RateLimit-Reset` headers.

## Content Moderation

OpenAI moderation API on endorsement content (`lib/ai/moderation.ts`). Flagged content returns 422, tracked via PostHog event.

## Security Headers

Set in `next.config.ts`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## GDPR Compliance

**Account deletion** (`/api/account/delete`) — multi-step:
1. Cancel Stripe subscriptions
2. Delete all storage files (`Promise.allSettled`)
3. Anonymise user record (name → "[Deleted User]", handle → "deleted-{uuid}", clear PII)
4. Soft-delete attachments, certifications, endorsement requests
5. Anonymise endorsements given (keep text, remove endorser context)
6. Hard-delete auth user (cascades)

**Data export** (`/api/account/export`) — GDPR-compliant JSON of all user data. Batches 7 parallel queries, returns as downloadable attachment.

**Privacy controls:**
- Per-field visibility flags: `show_phone`, `show_whatsapp`, `show_email`, `show_location`
- Section visibility via `section_visibility` JSONB on user record
- Enforced at display layer (public profile)

**Confirmation requirement:** Account deletion requires literal string `"DELETE MY ACCOUNT"`.

## OWASP Top 10 — YachtieLink Context

Quick audit checklist mapped to our stack:

| # | Vulnerability | What to check in this codebase |
|---|--------------|-------------------------------|
| 1 | **Injection** | Supabase uses parameterised queries by default — safe. Watch for raw SQL in migrations or RPC functions. Never string-concatenate user input into `.rpc()` calls. |
| 2 | **Broken Auth** | Supabase Auth handles password hashing. Check: every API route calls `getUser()`, session refresh works via middleware, no auth bypass on protected routes. |
| 3 | **Sensitive Data Exposure** | Secrets in `.env.local` only (never `NEXT_PUBLIC_`). PII controlled by visibility flags. Logs sanitised via `handleApiError()` — no stack traces to client. |
| 4 | **XXE** | Not applicable — no XML parsing in this stack. |
| 5 | **Broken Access Control** | RLS on every table. Queries scoped to `user.id`. Admin client (`service_role`) used only in account deletion + webhooks. |
| 6 | **Misconfiguration** | Security headers set in `next.config.ts`. Debug mode off in production. Default Supabase anon key has limited RLS-gated access. |
| 7 | **XSS** | React auto-escapes JSX. `dangerouslySetInnerHTML` not used. User content in non-JSX contexts (emails, PDFs, meta tags) goes through `lib/validation/sanitize.ts`. |
| 8 | **Insecure Deserialization** | JSON.parse on API request bodies only — validated by Zod before use. No eval, no dynamic require. |
| 9 | **Known Vulnerabilities** | Run `npm audit --audit-level=high` periodically. Check before major deploys. |
| 10 | **Insufficient Logging** | Sentry captures server errors. PostHog tracks key events. Rate limit violations logged. Account deletion and moderation flags tracked. |

## Dangerous Patterns — Flag Immediately

| Pattern | Severity | Fix |
|---------|----------|-----|
| Hardcoded secrets in source | CRITICAL | Use `process.env` |
| String-concatenated SQL in RPC | CRITICAL | Parameterised queries |
| Missing `getUser()` check on API route | CRITICAL | Add auth check |
| `as any` on user input | HIGH | Validate with Zod |
| `fetch(userProvidedUrl)` | HIGH | Whitelist allowed domains |
| No rate limiting on POST endpoint | HIGH | Add `applyRateLimit()` |
| Logging PII or tokens | MEDIUM | Sanitise log output |
| Missing `.is('deleted_at', null)` on query | MEDIUM | Add soft-delete filter |

## Security Checklist for New Features

1. Does the API route check auth?
2. Do queries scope to the authed user?
3. Are there RLS policies for any new tables?
4. Is user input validated with Zod?
5. Is rate limiting applied on abuse-prone endpoints?
6. Are there soft deletes, not hard deletes?
7. Is user-generated text moderated?
8. Are storage uploads validated (type, size)?
9. Are private bucket files served via signed URLs?
10. Is PII handled according to privacy controls?
