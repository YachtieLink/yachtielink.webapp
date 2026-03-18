# Discipline: Backend & Database

How YachtieLink does API routes, Supabase queries, validation, RLS, and migrations. Read this when your task involves data, APIs, or schema changes.

---

## API Route Pattern

Routes live in `app/api/{resource}/route.ts`. Multi-method files with named exports:

```typescript
// app/api/foo/route.ts
export async function GET(req: NextRequest) { ... }
export async function POST(req: NextRequest) { ... }

// app/api/foo/[id]/route.ts
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // ...
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { ... }
```

**Every route starts with:**
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

## Supabase Clients

Three clients, different contexts:

| Client | File | RLS | Used In |
|--------|------|-----|---------|
| Server | `lib/supabase/server.ts` | Yes | API routes, server components |
| Browser | `lib/supabase/client.ts` | Yes | Client components |
| Admin | `lib/supabase/admin.ts` | **No** (service_role) | Account deletion, webhooks, data export |

Server client must be `await`ed. Admin client bypasses RLS — use only when necessary, never on client side.

## Query Patterns

**Cached queries** in `lib/queries/profile.ts`:
```typescript
export const getUserById = cache(async (userId: string) => {
  const supabase = await createClient()
  return supabase.from('users').select('...').eq('id', userId).single()
})
```

**Parallel batching** — never sequential:
```typescript
const [attachments, certs, endorsements] = await Promise.all([
  supabase.from('attachments').select('*').eq('user_id', userId),
  supabase.from('certifications').select('*').eq('user_id', userId),
  supabase.from('endorsements').select('*').eq('recipient_id', userId),
])
```

**Soft deletes** — use `deleted_at` timestamp, never hard delete user data:
```typescript
// Delete
await supabase.from('attachments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
// Query (always filter)
supabase.from('attachments').select('*').is('deleted_at', null)
```

**Ownership enforcement** — always scope queries to the authed user:
```typescript
.eq('user_id', user.id)
```

## Validation

Zod schemas in `lib/validation/schemas.ts`. Reusable atoms at the top:
```typescript
const uuid = z.string().uuid()
const isoDate = z.string().datetime()
const safeText = (max: number) => z.string().trim().max(max)
```

**Application via `validateBody()`:**
```typescript
import { validateBody } from '@/lib/validation/validate'
import { createEndorsementSchema } from '@/lib/validation/schemas'

const result = await validateBody(req, createEndorsementSchema)
if ('error' in result) return result.error  // short-circuit with 400
const { recipient_id, content } = result.data
```

Returns structured error with field paths on failure. Always use this — never parse body manually.

## Error Handling

**Standard pattern** from `lib/api/errors.ts`:
```typescript
import { apiError, handleApiError } from '@/lib/api/errors'

try {
  // route logic
} catch (error) {
  return handleApiError(error)  // logs to Sentry, returns generic 500
}
```

**Constraint violations:**
```typescript
if (insertError?.code === '23505') {
  return NextResponse.json({ error: 'Already exists' }, { status: 409 })
}
```

**Non-fatal errors** (email, analytics) — catch and continue, don't fail the request.

## Rate Limiting

Redis-backed, fail-open. Applied at the top of POST routes:
```typescript
const limited = await applyRateLimit(req, 'endorsementCreate', user.id)
if (limited) return limited  // 429 with Retry-After header
```

Pre-configured limits in `lib/rate-limit/helpers.ts`: `endorsementCreate` (5/24h), `fileUpload` (20/1h), `pdfGenerate` (10/1h), `aiSummary` (10/1h), `search` (60/min).

## Bulk Mutations — Rollback Pattern

For bulk replace operations (hobbies, skills):
1. Snapshot existing rows
2. Delete all
3. Insert new rows
4. On insert failure: restore snapshot

```typescript
const { data: snapshot } = await supabase.from('user_hobbies').select('*').eq('user_id', user.id)
await supabase.from('user_hobbies').delete().eq('user_id', user.id)
const { error: insertError } = await supabase.from('user_hobbies').insert(newRows)
if (insertError) {
  await supabase.from('user_hobbies').insert(snapshot)  // rollback
  return apiError('Failed to save', 500)
}
```

## RLS Policies

Every table gets RLS enabled. Standard policy set:

| Pattern | Example |
|---------|---------|
| Public read | `using (true)` for reference tables |
| Soft-delete filter | `using (deleted_at is null)` |
| Own data | `using (auth.uid() = user_id)` |
| Coworker gate | `using (public.are_coworkers_on_yacht(...))` via RPC |
| Email match | `using (auth.email() = recipient_email)` |

**Naming convention:** `"{table}: {operation} {who}"` — e.g. `"users: own update"`, `"endorsements: public read (non-deleted)"`

## Migration Conventions

File naming: `YYYYMMDDHHMMSS_{semantic_name}.sql`

Structure: grouped by concern:
```
20260313000001_extensions.sql
20260313000002_reference_tables.sql
20260313000003_core_tables.sql
20260313000004_functions.sql
20260313000005_rls.sql
20260317000021_profile_robustness.sql  ← sprint-specific
```

Always include in new table migrations:
- `alter table public.X enable row level security;`
- RLS policies for select/insert/update/delete as appropriate
- Functions use `security definer set search_path = public`

## Pro/Free Gating

Check subscription status for feature gating:
```typescript
const { data: profile } = await supabase.from('users')
  .select('subscription_plan').eq('id', user.id).single()
const isPro = profile?.subscription_plan === 'pro'
```

Use `getProStatus()` from `lib/stripe/pro.ts` in server components.
