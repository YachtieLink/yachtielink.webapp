# Discipline: Frontend

How YachtieLink does frontend. Read this when your task involves pages, components, layouts, or client/server splits.

---

## Component Conventions

- PascalCase filenames: `Button.tsx`, `ProfileAccordion.tsx`
- Named exports, not default: `export function ComponentName() {}`
- Props interfaces defined inline above the component, extending HTML types where appropriate: `interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>`
- `forwardRef` on UI primitives (Button, Input) to support refs
- Feature-organised in `/components`: `ui/`, `profile/`, `endorsement/`, `insights/`, `nav/`, `onboarding/`

## Client vs Server Components

Default to server components. Add `'use client'` only when you need hooks, browser APIs, or interactivity.

**Server components handle:** auth, data fetching, layout gating, metadata.

**Client components handle:** state, forms, animations, browser events.

**Client vs server decision tree for pages:**

1. **Does the page need server-side data gating?** (e.g. checking ownership of a resource, redirecting based on data state) → **Server page + client component split.** Server page.tsx fetches and gates, passes props to `EditFooClient.tsx`.
   - Example: `endorsement/[id]/edit/page.tsx` (server) → `EditEndorsementClient.tsx` (client)

2. **Does the page just need auth + a form?** (e.g. editing your own hobbies, skills, social links — RLS handles ownership) → **Fully `'use client'`.** The page fetches data client-side on mount. RLS ensures you can only access your own data.
   - Example: `hobbies/edit/page.tsx`, `skills/edit/page.tsx`, `social-links/edit/page.tsx`

3. **Is it a display page with no interactivity?** → **Server component.** Fetch data, render, done.
   - Example: `profile/page.tsx`, `cv/page.tsx`

**Rule of thumb:** if RLS enforces ownership and you don't need to redirect based on data, go fully client. If you need to check something server-side before rendering (ownership, existence, permissions), use the split pattern.

## Security Boundary — RLS vs Page-Level Checks

Most ownership enforcement happens at the **API/RLS level**, not in the page. The protected layout handles auth (redirects if not logged in). Individual pages don't re-check auth — they trust the layout gate. API routes always verify `getUser()` independently.

This means: an edit page doesn't need to verify "does this education entry belong to this user?" in the page component. The PUT/DELETE API route scopes queries to `user.id`, and RLS enforces it at the database level. If someone tries to edit another user's entry, the API returns empty data or 404.

**When to add page-level checks:** only when you need to redirect or show different UI based on ownership (e.g. public profile showing "edit" buttons only for the profile owner).

## Page Conventions

- Pages in `app/(protected)/app/*` are async server components by default
- Auth check at the top: `createClient()` → `getUser()` → redirect if not authed
- Data fetching via `Promise.all()` for parallel queries — never sequential
- Type-safe params: `params: Promise<{ id: string }>`
- Bottom padding: `pb-24` on page containers to clear the tab bar

```tsx
// Standard page structure
export default async function FooPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  const [data1, data2] = await Promise.all([
    getFirstThing(user.id),
    getSecondThing(user.id),
  ])

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="text-xl font-semibold">Page Title</h1>
      {/* content */}
    </div>
  )
}
```

## Layout Hierarchy

- Root: `app/layout.tsx` — providers (PostHog, Toast), fonts, dark mode script
- Protected: `app/(protected)/app/layout.tsx` — auth gate + onboarding gate
- Route-specific layouts as needed

## State Management

No Redux/Zustand. React primitives only:

- Server components + `React.cache()` for request-level dedup
- `useState` for form/UI state in client components
- `ToastProvider` context + `useToast()` hook for toast notifications
- `useNetworkBadge()` custom hook for client-side polling (badge count every 60s)
- No form library — manual `useState` + `fetch()` to API routes

## Form Patterns

- No `<form onSubmit>` — button click handlers call `fetch()` or Supabase client
- Optimistic updates where appropriate (save/unsave, visibility toggles)
- Rollback on failure (restore previous state)
- Toast notifications for success/error feedback
- Loading state via `useState` (`saving`, `loading`)

## File Naming

- Directories: kebab-case for routes (`endorsement/[id]/edit/`), feature-based for components (`components/profile/`)
- Components: PascalCase (`ProfileAccordion.tsx`)
- Utilities: camelCase or kebab-case (`motion.ts`, `profile-summaries.ts`)
- Next.js reserved: `page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`, `error.tsx`

## lib/ Structure

```
lib/
├── supabase/          # Server, client, admin, middleware clients
├── queries/           # Cached Supabase queries (React.cache())
├── hooks/             # Custom hooks (useNetworkBadge)
├── api/               # Error helpers
├── storage/           # Upload helpers with client-side validation
├── stripe/            # Subscription logic
├── email/             # Email templates
├── validation/        # Zod schemas + sanitisation
├── analytics/         # PostHog helpers
├── rate-limit/        # Redis-backed rate limiting
├── ai/                # Content moderation
├── cv/                # CV parsing prompts
├── motion.ts          # Framer Motion presets
├── profile-summaries.ts
└── utils.ts           # cn() — clsx + tailwind-merge
```

## Mobile Responsiveness Checklist

Every new page or component must pass these checks. Test at 375px (iPhone SE), 768px (tablet), and 1280px (desktop).

**Layout:**
- [ ] Page uses `pb-24` to clear bottom tab bar on mobile
- [ ] Content stays within `max-w-2xl mx-auto` (set in layout, not per-page)
- [ ] No horizontal overflow at 375px — check for fixed-width elements, wide tables, long unbroken strings
- [ ] Touch targets are at least 44×44px (buttons, links, interactive elements)

**Responsive patterns:**
- [ ] Base styles target mobile. Use `md:` for tablet/desktop enhancements. Never desktop-down.
- [ ] Mobile: single column stack. Desktop: side-by-side or grid only where it makes sense.
- [ ] `hidden md:flex` for desktop-only elements. `md:hidden` for mobile-only elements.
- [ ] Images use `object-cover` and constrained heights (no layout blow-out on tall images)

**Navigation:**
- [ ] Bottom tab bar visible on mobile (`md:hidden`), sidebar visible on desktop (`hidden md:flex`)
- [ ] Back links use `← Back` text, not just an icon (easier tap target, clearer intent)
- [ ] Edit page content doesn't extend behind the tab bar

**Scrolling:**
- [ ] Horizontal scroll containers have `overflow-x-auto` and items use `shrink-0`
- [ ] Photo strips: `flex gap-2 overflow-x-auto pb-1` with fixed-width items
- [ ] Long lists don't cause the page to feel infinite — consider pagination or "show more"

**Safe areas:**
- [ ] Viewport config: `maximumScale: 1` (no pinch zoom), `viewportFit: "cover"` (notch safe)
- [ ] Bottom elements account for safe area: `pb-[calc(var(--tab-bar-height)+var(--safe-area-bottom))]`

## Key Utilities

- `cn()` from `lib/utils.ts` — always use for composing Tailwind classes
- `createClient()` from `lib/supabase/server.ts` — server-side, cookie-aware
- `createClient()` from `lib/supabase/client.ts` — browser-side
- `getUserById()`, `getUserByHandle()` from `lib/queries/profile.ts` — cached
- `validateBody()` from `lib/validation/validate.ts` — Zod parsing for API routes
