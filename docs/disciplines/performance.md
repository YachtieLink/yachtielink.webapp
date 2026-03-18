# Discipline: Performance

How YachtieLink handles speed, caching, loading, and bundle size. Read this when your task involves data fetching, page load, or optimisation work.

---

## The Problem We're Solving

Yacht crew use the app on marina WiFi — 150-300ms latency per round trip. Sequential Supabase queries kill perceived performance. Every millisecond matters.

## Caching Strategy

**RSC client cache:** `staleTimes: { dynamic: 120 }` in `next.config.ts`. Navigating between tabs serves stale RSC payloads instantly, refreshes in background. 120 seconds before refetch.

**Request-level dedup:** `React.cache()` on shared queries in `lib/queries/profile.ts`. Multiple components reading the same user data in one render share a single DB round trip.

```typescript
export const getUserById = cache(async (userId: string) => {
  const supabase = await createClient()
  return supabase.from('users').select('...').eq('id', userId).single()
})
```

## Query Optimisation

**Rule: never sequential queries.** Always `Promise.all()`:

```typescript
// Bad — sequential, ~600ms on marina WiFi
const attachments = await getAttachments(userId)
const certs = await getCerts(userId)
const endorsements = await getEndorsements(userId)

// Good — parallel, ~200ms
const [attachments, certs, endorsements] = await Promise.all([
  getAttachments(userId),
  getCerts(userId),
  getEndorsements(userId),
])
```

**Shared helpers:** `getProfileSections()` batches 3 queries. `getExtendedProfileSections()` batches 5. Use these instead of writing individual queries.

**Don't re-fetch auth in child pages.** The layout already fetches `getUser()` — pass the user ID down, don't call `getUser()` again in the page.

## Prefetching

**Tab navigation:** `BottomTabBar` and `SidebarNav` prefetch all 5 main routes on mount:
```typescript
useEffect(() => {
  tabs.forEach((tab) => router.prefetch(tab.href))
}, [router])
```

This means tab switches feel instant after initial load.

## Loading States

File-based `loading.tsx` for every main route. Each one renders a skeleton matching the actual page layout — not a spinner, not a blank screen.

Current loading pages: profile, insights, network, more, cv.

**When adding a new route:** always create a `loading.tsx` with a skeleton that matches the page structure.

## Image Handling

- Client-side validation before upload (type, size)
- Image resizing: max 800px, WebP conversion via `lib/storage/upload.ts`
- Remote image patterns in `next.config.ts` for Supabase CDN URLs
- Profile photos served from public Supabase storage bucket — no signed URLs needed

## Bundle

- No explicit `next/dynamic` usage yet — automatic code splitting per route via App Router
- Opportunity: dynamic import for heavy components (BottomSheet, PhotoGallery) if bundle becomes an issue
- Framer Motion is the heaviest client dependency — already tree-shakes via named imports

## How to Profile

When a page feels slow, measure before guessing:

### Browser DevTools (Chrome)
1. **Network tab** — throttle to "Slow 3G" or custom (150ms RTT, 1.5Mbps) to simulate marina WiFi
2. **Performance tab** — record a page load, look for long tasks and layout shifts
3. **Waterfall view** — are Supabase requests sequential (staircase pattern) or parallel (flat)?

### Timing in Code

Add temporary timing to server components to find the bottleneck:
```typescript
const start = Date.now()
const [data1, data2] = await Promise.all([query1(), query2()])
console.log(`Queries took ${Date.now() - start}ms`)
```
Remove before committing. Never leave timing logs in production code.

### Supabase Dashboard
- **SQL Editor** — run slow queries directly with `EXPLAIN ANALYZE` to check execution plans
- **Logs** — check for slow queries (>200ms) in the Supabase dashboard logs tab
- **RLS overhead** — complex RLS policies (especially those calling RPC functions) add latency. If a query is slow, test it with the service role client (bypasses RLS) to isolate whether RLS is the bottleneck.

### Performance Targets

| Context | Target | Unacceptable |
|---------|--------|-------------|
| Marina WiFi (150-300ms RTT) | Page usable in <1s | Blank screen >2s |
| Good connection (<50ms RTT) | Page usable in <500ms | Any visible loading delay |
| Tab switch (cached) | Instant (<100ms) | Any visible loading |
| Photo gallery swipe | Instant | Frame drops |

### Known Slow Patterns in This Codebase

1. **Sequential Promise.all blocks** — two `Promise.all()` calls where the second depends on the first. Merge into one where possible, or at minimum overlap what you can.
2. **RPC functions with complex joins** — `get_colleagues` does multi-table lookups. Can be slow with large datasets.
3. **OR conditions in Supabase filters** — polymorphic queries like `recipient_user_id.eq.X,recipient_email.eq.Y` are slower than direct ID lookups.
4. **Missing React.cache()** on RPC calls — unlike `.from()` queries, RPC calls aren't automatically deduplicated.

## Performance Checklist

When adding a new page or feature:

1. Are all data queries parallel? (`Promise.all()`)
2. Are shared queries using `React.cache()`?
3. Is there a `loading.tsx` with an appropriate skeleton?
4. Are images resized and served from CDN?
5. Are client components as small as possible? (Don't make the whole page `'use client'` if only one section needs it)
6. Is the tab bar route prefetched?
7. Test at 375px with "Slow 3G" throttling — does the page load in under 2s?
