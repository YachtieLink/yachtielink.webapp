# Feature Roadmap — Detailed Build Plan

## Context

This feature adds a public, community-driven feature roadmap accessible from the **More** tab. It gives crew members transparency into what's being built and a voice in what gets prioritised next.

Inspired by BuddyBoss's roadmap (three-tab structure, card layout, thumbs-up voting, status badges), the YachtieLink implementation is tailored to a professional network:

- **Free users:** read-only access — see the full roadmap and community requests but cannot vote or suggest
- **Pro users:** full participation — vote on roadmap items, vote on community requests, and submit their own feature ideas
- Roadmap items are admin-managed via Supabase dashboard; community requests are user-submitted and reviewed before going public
- Target mix: ~75% of roadmap items tagged `pro`, ~25% tagged `all` (editorial guideline, not enforced by code)

**Dependencies from prior sprints:**
- Pro subscription status on user record (Sprint 7)
- Zod validation + rate limiting patterns (Sprint 8)
- `getProStatus()` utility in `lib/stripe/pro.ts`
- `UpgradeCTA` component in `components/insights/UpgradeCTA.tsx`
- `SettingsRow`, `SectionHeader` components used in `app/(protected)/app/more/page.tsx`

**What Sprint 11 delivers:**
1. `roadmap_items` table — admin-created, categorised, status-tracked feature cards
2. `roadmap_votes` table — Pro user votes on roadmap items
3. `feature_requests` table — Pro user-submitted ideas with admin approval workflow
4. `feature_request_votes` table — Pro user votes on community requests
5. API routes for listing, voting, and submitting
6. Full component suite: tabs, cards, vote buttons, status badges, category filters, submission form
7. `/app/more/roadmap` route wired into the More tab

---

## Part 1: Database Migration

**File to create:** `supabase/migrations/20260318000001_sprint11_feature_roadmap.sql`

```sql
-- Sprint 11: Feature Roadmap
-- Admin-managed roadmap + community feature requests with Pro voting

-- ═══════════════════════════════════════════════════════════
-- 1. ROADMAP ITEMS (admin-created)
-- ═══════════════════════════════════════════════════════════

create table roadmap_items (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) <= 120),
  description     text not null check (char_length(description) <= 1000),
  status          text not null default 'planned'
                    check (status in ('planned', 'in_progress', 'released')),
  category        text not null
                    check (category in (
                      'Profile',
                      'CV & Employment',
                      'Endorsements',
                      'Analytics',
                      'Networking',
                      'Messaging',
                      'Search & Discovery',
                      'General'
                    )),
  target_audience text not null default 'all'
                    check (target_audience in ('all', 'pro')),
  vote_count      integer not null default 0,
  sort_order      integer not null default 0,  -- admin-controlled ordering within status group
  released_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-set released_at when status → released
create or replace function set_roadmap_released_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'released' and old.status != 'released' then
    new.released_at = now();
  end if;
  if new.status != 'released' then
    new.released_at = null;
  end if;
  return new;
end;
$$;

create trigger roadmap_items_released_at
  before update on roadmap_items
  for each row execute function set_roadmap_released_at();

-- ═══════════════════════════════════════════════════════════
-- 2. ROADMAP VOTES (Pro users voting on roadmap items)
-- ═══════════════════════════════════════════════════════════

create table roadmap_votes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  roadmap_item_id uuid not null references roadmap_items(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(user_id, roadmap_item_id)
);

-- Keep vote_count in sync via triggers
create or replace function increment_roadmap_vote_count()
returns trigger language plpgsql as $$
begin
  update roadmap_items set vote_count = vote_count + 1 where id = new.roadmap_item_id;
  return new;
end;
$$;

create or replace function decrement_roadmap_vote_count()
returns trigger language plpgsql as $$
begin
  update roadmap_items set vote_count = greatest(vote_count - 1, 0) where id = old.roadmap_item_id;
  return old;
end;
$$;

create trigger roadmap_votes_insert
  after insert on roadmap_votes
  for each row execute function increment_roadmap_vote_count();

create trigger roadmap_votes_delete
  after delete on roadmap_votes
  for each row execute function decrement_roadmap_vote_count();

-- ═══════════════════════════════════════════════════════════
-- 3. FEATURE REQUESTS (Pro user-submitted ideas)
-- ═══════════════════════════════════════════════════════════

create table feature_requests (
  id           uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references users(id) on delete cascade,
  title        text not null check (char_length(title) >= 10 and char_length(title) <= 120),
  description  text not null check (char_length(description) >= 20 and char_length(description) <= 1000),
  category     text not null
                 check (category in (
                   'Profile',
                   'CV & Employment',
                   'Endorsements',
                   'Analytics',
                   'Networking',
                   'Messaging',
                   'Search & Discovery',
                   'General'
                 )),
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'merged', 'rejected')),
  vote_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════
-- 4. FEATURE REQUEST VOTES (Pro users voting on requests)
-- ═══════════════════════════════════════════════════════════

create table feature_request_votes (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  feature_request_id uuid not null references feature_requests(id) on delete cascade,
  created_at         timestamptz not null default now(),
  unique(user_id, feature_request_id)
);

create or replace function increment_request_vote_count()
returns trigger language plpgsql as $$
begin
  update feature_requests set vote_count = vote_count + 1 where id = new.feature_request_id;
  return new;
end;
$$;

create or replace function decrement_request_vote_count()
returns trigger language plpgsql as $$
begin
  update feature_requests set vote_count = greatest(vote_count - 1, 0) where id = old.feature_request_id;
  return old;
end;
$$;

create trigger feature_request_votes_insert
  after insert on feature_request_votes
  for each row execute function increment_request_vote_count();

create trigger feature_request_votes_delete
  after delete on feature_request_votes
  for each row execute function decrement_request_vote_count();

-- ═══════════════════════════════════════════════════════════
-- 5. INDEXES
-- ═══════════════════════════════════════════════════════════

create index roadmap_items_status_idx on roadmap_items(status);
create index roadmap_items_category_idx on roadmap_items(category);
create index roadmap_items_sort_idx on roadmap_items(status, sort_order, vote_count desc);
create index roadmap_votes_user_idx on roadmap_votes(user_id);
create index feature_requests_status_idx on feature_requests(status);
create index feature_requests_vote_count_idx on feature_requests(vote_count desc);
create index feature_request_votes_user_idx on feature_request_votes(user_id);

-- ═══════════════════════════════════════════════════════════
-- 6. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

alter table roadmap_items enable row level security;
alter table roadmap_votes enable row level security;
alter table feature_requests enable row level security;
alter table feature_request_votes enable row level security;

-- roadmap_items: anyone authenticated can read; only service role writes
create policy "roadmap_items_read" on roadmap_items
  for select to authenticated using (true);

-- roadmap_votes: authenticated users read own votes; Pro users insert/delete own votes
create policy "roadmap_votes_read_own" on roadmap_votes
  for select to authenticated using (auth.uid() = user_id);

create policy "roadmap_votes_insert_pro" on roadmap_votes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users where id = auth.uid() and subscription_status = 'pro'
    )
  );

create policy "roadmap_votes_delete_own" on roadmap_votes
  for delete to authenticated using (auth.uid() = user_id);

-- feature_requests: authenticated users can read approved+merged; submitter reads own pending
create policy "feature_requests_read_public" on feature_requests
  for select to authenticated
  using (status in ('approved', 'merged') or submitted_by = auth.uid());

-- Pro users can submit
create policy "feature_requests_insert_pro" on feature_requests
  for insert to authenticated
  with check (
    auth.uid() = submitted_by
    and exists (
      select 1 from users where id = auth.uid() and subscription_status = 'pro'
    )
  );

-- feature_request_votes: same Pro-only gating
create policy "feature_request_votes_read_own" on feature_request_votes
  for select to authenticated using (auth.uid() = user_id);

create policy "feature_request_votes_insert_pro" on feature_request_votes
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from users where id = auth.uid() and subscription_status = 'pro'
    )
  );

create policy "feature_request_votes_delete_own" on feature_request_votes
  for delete to authenticated using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 7. SEED DATA (initial roadmap items — adjust as needed)
-- ═══════════════════════════════════════════════════════════

insert into roadmap_items (title, description, status, category, target_audience, sort_order) values
  (
    'Direct messaging between crew',
    'Send private messages to other crew members directly within YachtieLink, with read receipts and push notifications.',
    'planned', 'Messaging', 'pro', 10
  ),
  (
    'Yacht owner & captain profiles',
    'Dedicated profile type for yacht owners and captains to post positions, browse crew, and endorse from the other side of the relationship.',
    'planned', 'Profile', 'all', 20
  ),
  (
    'Crew search for Pro members',
    'Search all crew by role, department, yacht history, location, and availability. Results show summary view; full profile available via link.',
    'in_progress', 'Search & Discovery', 'pro', 10
  ),
  (
    'Endorsement signals (agree / disagree)',
    'Crew who served on the same yacht can signal their agreement or disagreement with an endorsement, adding a social trust layer.',
    'in_progress', 'Endorsements', 'all', 20
  ),
  (
    'PDF resume snapshot',
    'Generate a professionally formatted, shareable PDF of your YachtieLink profile at any time.',
    'released', 'CV & Employment', 'pro', 10
  ),
  (
    'Profile analytics dashboard',
    'See who viewed your profile, when, and how they found you. Includes time-series charts and link share tracking.',
    'released', 'Analytics', 'pro', 20
  );
```

---

## Part 2: TypeScript Types

**File to create:** `lib/types/roadmap.ts`

```typescript
export type RoadmapStatus = 'planned' | 'in_progress' | 'released'
export type RoadmapAudience = 'all' | 'pro'
export type RequestStatus = 'pending' | 'approved' | 'merged' | 'rejected'

export const ROADMAP_CATEGORIES = [
  'Profile',
  'CV & Employment',
  'Endorsements',
  'Analytics',
  'Networking',
  'Messaging',
  'Search & Discovery',
  'General',
] as const
export type RoadmapCategory = typeof ROADMAP_CATEGORIES[number]

export interface RoadmapItem {
  id: string
  title: string
  description: string
  status: RoadmapStatus
  category: RoadmapCategory
  target_audience: RoadmapAudience
  vote_count: number
  sort_order: number
  released_at: string | null
  created_at: string
  user_has_voted: boolean  // joined from roadmap_votes for current user
}

export interface FeatureRequest {
  id: string
  submitted_by: string
  title: string
  description: string
  category: RoadmapCategory
  status: RequestStatus
  vote_count: number
  created_at: string
  user_has_voted: boolean  // joined from feature_request_votes for current user
  is_own: boolean          // submitted_by === current user
}

export interface VoteToggleResponse {
  voted: boolean
  vote_count: number
}
```

**Add to `lib/validation/schemas.ts`:**

```typescript
export const submitFeatureRequestSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  category: z.enum([
    'Profile', 'CV & Employment', 'Endorsements', 'Analytics',
    'Networking', 'Messaging', 'Search & Discovery', 'General'
  ]),
})

export const voteRoadmapItemSchema = z.object({
  roadmap_item_id: z.string().uuid(),
})

export const voteFeatureRequestSchema = z.object({
  feature_request_id: z.string().uuid(),
})
```

---

## Part 3: API Routes

### `GET /api/roadmap`

**File:** `app/api/roadmap/route.ts`

- Auth required. Returns all roadmap items ordered by `status` group (in_progress first, then planned, then released), then `sort_order ASC`, then `vote_count DESC`.
- Accepts query param `?category=Endorsements` for filtering.
- Joins with `roadmap_votes` to attach `user_has_voted` per item.
- Response: `{ items: RoadmapItem[] }`
- No rate limit (read-only).

```typescript
// Response shape per item
{
  id, title, description, status, category, target_audience,
  vote_count, sort_order, released_at, created_at,
  user_has_voted: boolean
}
```

### `POST /api/roadmap/vote`

**File:** `app/api/roadmap/vote/route.ts`

- Auth required + Pro check (`getProStatus`). Return 403 for free users.
- Zod: `voteRoadmapItemSchema`
- Toggle logic: if row exists in `roadmap_votes` → DELETE (unvote); else INSERT (vote).
- Returns `{ voted: boolean, vote_count: number }` — `vote_count` re-read from `roadmap_items` after mutation.
- PostHog event: `roadmap.voted` with `{ roadmap_item_id, voted: boolean, category, status }`
- Rate limit: none (bounded by toggle; one row per user per item)

### `GET /api/feature-requests`

**File:** `app/api/feature-requests/route.ts`

- Auth required. Returns `approved` and `merged` requests + the current user's own `pending` requests.
- Ordered by `vote_count DESC`, then `created_at DESC`.
- Accepts `?category=` filter.
- Joins with `feature_request_votes` to attach `user_has_voted`.
- Attaches `is_own: submitted_by === current user`.
- Response: `{ requests: FeatureRequest[] }`

### `POST /api/feature-requests`

**File:** same `app/api/feature-requests/route.ts` (method branch)

- Auth required + Pro check. Return 403 for free users.
- Zod: `submitFeatureRequestSchema`
- Run AI-01 content moderation on `title` + `description`. Return 422 if flagged.
- Insert with `status = 'pending'` and `submitted_by = user.id`.
- Rate limit: `featureRequestSubmit` — 3/day per Pro user.
- PostHog event: `feature_request.submitted` with `{ category }`
- Response: `{ request: FeatureRequest }` (the created row)

### `POST /api/feature-requests/vote`

**File:** `app/api/feature-requests/vote/route.ts`

- Auth required + Pro check.
- Zod: `voteFeatureRequestSchema`
- Verify the target request has `status in ('approved', 'merged')` — cannot vote on pending/rejected.
- Toggle logic: if row exists → DELETE; else INSERT.
- Returns `{ voted: boolean, vote_count: number }`
- PostHog event: `feature_request.voted` with `{ feature_request_id, voted: boolean }`

---

## Part 4: Components

**Directory:** `components/roadmap/`

### `StatusBadge.tsx`
Coloured pill badge for roadmap item status.

```
planned     → Amber background, "Planned"
in_progress → Teal background, "In Progress"
released    → Deep Blue background, "Released"
```

No interactivity. Pure display.

### `AudienceBadge.tsx`
Small "Pro" tag shown when `target_audience === 'pro'`. Uses the same Pro badge style as the rest of the app. Hidden when `target_audience === 'all'`.

### `VoteButton.tsx`
Thumbs-up toggle button.

Props: `{ voted: boolean, count: number, isPro: boolean, onVote: () => void, loading?: boolean }`

- **Pro users:** active toggle — teal when voted, muted when not. Shows count. Spinner while `loading`.
- **Free users:** visually identical but clicking opens `UpgradeCTA` dialog instead of triggering vote. Shows a small lock icon overlay.
- Optimistic UI: flip `voted` state and update count immediately on click; revert on API error with toast.

### `CategoryFilter.tsx`
Horizontal scrollable row of filter pill buttons.

Props: `{ selected: RoadmapCategory | 'All', onChange: (cat) => void }`

- First pill: "All" (default)
- One pill per category from `ROADMAP_CATEGORIES`
- Active pill: teal fill. Inactive: ghost/outline.
- Overflow scrolls horizontally on mobile (no wrap).

### `RoadmapCard.tsx`
Card for a single `RoadmapItem`.

Layout:
```
┌─────────────────────────────────────────┐
│ [StatusBadge] [AudienceBadge]  [VoteBtn]│
│ Title (DM Serif Display, 18px)          │
│ Description (DM Sans, 14px, 3-line clamp│
│ Category tag                            │
└─────────────────────────────────────────┘
```

- Tapping description expands to full text (toggle `expanded` state).
- No navigation — everything inline.

### `FeatureRequestCard.tsx`
Card for a single `FeatureRequest`. Same layout as `RoadmapCard` minus `StatusBadge` and `AudienceBadge`. Shows `[VoteBtn]` and `[Category tag]`. If `is_own && status === 'pending'`, show a small "Pending review" pill in muted grey.

### `FeatureRequestForm.tsx`
Bottom sheet / drawer (use shadcn `Sheet` component) for Pro users to submit a request.

Fields:
- **Title** — text input, 10–120 chars, with live char count
- **Category** — dropdown select from `ROADMAP_CATEGORIES`
- **Description** — textarea, 20–1000 chars, with live char count

Submit button: "Submit Idea" — calls `POST /api/feature-requests`, shows loading state, closes on success with success toast. Shows inline field errors on validation failure. Free users never see this (the trigger button is Pro-gated).

### `RoadmapTab.tsx`
Displays planned and in_progress items.

Layout:
1. `CategoryFilter` at top
2. **"In Progress"** section header (only if any in_progress items after filter)
3. Grid of `RoadmapCard` for in_progress items
4. **"Planned"** section header (only if any planned items after filter)
5. Grid of `RoadmapCard` for planned items, sorted by vote_count desc
6. Empty state if no items match filter: "Nothing planned in this category yet."

### `ReleasedTab.tsx`
Same structure but only `released` items, sorted by `released_at DESC`.

### `RequestsTab.tsx`
Displays approved + merged community requests for the current filter.

Layout:
1. **"Suggest a Feature"** button (Pro users) or locked button (free users, shows Pro badge). Tapping opens `FeatureRequestForm`.
2. `CategoryFilter`
3. List of `FeatureRequestCard` sorted by vote_count desc
4. Empty state: "No community ideas in this category yet. Be the first to suggest one."

### `RoadmapPage.tsx`
Top-level client component for the `/app/more/roadmap` route.

State:
- `tab: 'roadmap' | 'requests' | 'released'` (default `'roadmap'`)
- `category: RoadmapCategory | 'All'` (default `'All'`)
- `items: RoadmapItem[]`
- `requests: FeatureRequest[]`
- `isPro: boolean`
- `loading: boolean`

On mount: parallel fetch `GET /api/roadmap` + `GET /api/feature-requests`. Store results. Determine `isPro` from existing user context (pass down from server component or re-fetch).

Tabs: standard shadcn `Tabs` component with three triggers: `Roadmap | Community Ideas | Released`.

Vote handler: calls `POST /api/roadmap/vote` or `POST /api/feature-requests/vote`, updates local state optimistically.

---

## Part 5: Route Page

**File to create:** `app/(protected)/app/more/roadmap/page.tsx`

Server component. Fetches `getProStatus(user.id)` server-side and passes `isPro` to `RoadmapPage` as a prop. This avoids a client-side waterfall for the Pro check.

```tsx
import { createClient } from '@/lib/supabase/server'
import { getProStatus } from '@/lib/stripe/pro'
import { RoadmapPage } from '@/components/roadmap/RoadmapPage'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Feature Roadmap — YachtieLink' }

export default async function RoadmapRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const proStatus = await getProStatus(user.id)

  return <RoadmapPage isPro={proStatus.isPro} />
}
```

---

## Part 6: More Page Entry

**File to modify:** `app/(protected)/app/more/page.tsx`

Add a `SettingsRow` entry in the **Help** section, above the feedback email link:

```tsx
<SettingsRow
  href="/app/more/roadmap"
  label="Feature Roadmap"
  description="See what's coming and vote for features"
  icon={<MapIcon className="w-5 h-5" />}
/>
```

Use whatever icon import pattern is already in the file (likely from `lucide-react`). `Map` or `Milestone` are reasonable choices.

---

## Files to Create / Modify

### New files
```
supabase/migrations/20260318000001_sprint11_feature_roadmap.sql
lib/types/roadmap.ts
app/api/roadmap/route.ts
app/api/roadmap/vote/route.ts
app/api/feature-requests/route.ts
app/api/feature-requests/vote/route.ts
app/(protected)/app/more/roadmap/page.tsx
components/roadmap/RoadmapPage.tsx
components/roadmap/RoadmapTab.tsx
components/roadmap/RequestsTab.tsx
components/roadmap/ReleasedTab.tsx
components/roadmap/RoadmapCard.tsx
components/roadmap/FeatureRequestCard.tsx
components/roadmap/FeatureRequestForm.tsx
components/roadmap/VoteButton.tsx
components/roadmap/StatusBadge.tsx
components/roadmap/AudienceBadge.tsx
components/roadmap/CategoryFilter.tsx
```

### Modified files
```
lib/validation/schemas.ts          — add 3 new Zod schemas
lib/rate-limit/helpers.ts          — add featureRequestSubmit (3/day, Pro)
app/(protected)/app/more/page.tsx  — add SettingsRow for roadmap
CHANGELOG.md                       — log this sprint before commit
```

---

## Rate Limit Config

Add to `lib/rate-limit/helpers.ts`:

```typescript
featureRequestSubmit: {
  requests: 3,
  window: '1d',
  keyPrefix: 'feature-request-submit',
}
```

No rate limit on voting (toggle-bounded, one row per user per item enforced by DB unique constraint).

---

## Admin Workflow

Roadmap items are managed directly in Supabase dashboard — no admin UI in scope for this sprint.

| Admin action | How |
|---|---|
| Add a roadmap item | Insert row in `roadmap_items` |
| Change status to released | Update `status = 'released'` — trigger sets `released_at` automatically |
| Approve a community request | Update `feature_requests.status = 'approved'` |
| Merge a request into roadmap | Update status to `merged`, then insert corresponding `roadmap_item` |
| Reject a request | Update status to `rejected` (disappears from public view) |
| Reorder items within a status | Update `sort_order` values |

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-031 | Roadmap lives in More tab, not a top-level nav item | Roadmap is a settings-adjacent feature, not a daily-use screen. Keeps the 5-tab nav clean |
| D-032 | Roadmap items are admin-only, no user-facing admin UI | Keeps scope tight for sprint 11. Admin via Supabase dashboard is sufficient at current scale |
| D-033 | Free users see everything but cannot vote or submit | Transparency builds trust; voting/submitting is a Pro value-add, not a paywall on information |
| D-034 | Vote counts maintained by DB triggers, not application code | Prevents race conditions and removes client-side count management complexity |
| D-035 | Feature requests require admin approval before going public | Prevents spam, duplicate noise, and off-topic submissions from appearing in the feed |
| D-036 | `target_audience` is an editorial field, not enforced by RLS | Free users can see "pro" items — the label sets expectation, not access |
| D-037 | ~75% Pro / ~25% All item mix is a guideline, not a hard rule | Gives flexibility based on what's actually being built; avoids gaming the metric |
| D-038 | Optimistic UI for vote toggle | Vote latency should feel instant. Revert on failure with toast. Acceptable eventual consistency |

---

## Build Order

1. **Migration** — tables, RLS, triggers, seed data → apply to dev Supabase
2. **Types + Validation schemas** — `lib/types/roadmap.ts` + Zod schemas in `lib/validation/schemas.ts`
3. **Rate limit config** — add `featureRequestSubmit` to `lib/rate-limit/helpers.ts`
4. **API routes** — in order: GET roadmap → POST vote → GET requests → POST request → POST request vote
5. **Components bottom-up** — `StatusBadge` → `AudienceBadge` → `VoteButton` → `CategoryFilter` → `RoadmapCard` → `FeatureRequestCard` → `FeatureRequestForm` → `RoadmapTab` → `ReleasedTab` → `RequestsTab` → `RoadmapPage`
6. **Route page** — `app/(protected)/app/more/roadmap/page.tsx`
7. **More page entry** — add `SettingsRow` row
8. **CHANGELOG** — update before commit

---

## Success Criteria

- [ ] Migration applies cleanly to dev Supabase with seed data visible
- [ ] Free user (`dev@yachtie.link` on free plan) sees roadmap page with all three tabs populated
- [ ] Free user vote button shows lock icon; clicking opens `UpgradeCTA`
- [ ] Free user "Suggest a Feature" button shows Pro badge; clicking opens `UpgradeCTA`
- [ ] Pro user vote button toggles; count updates immediately (optimistic UI)
- [ ] Pro user unvote works (clicking again removes vote, count decrements)
- [ ] Pro user submits a feature request → success toast → request appears in their own Requests tab view with "Pending review" pill
- [ ] Admin approves request in Supabase dashboard → request appears publicly in Requests tab for all users
- [ ] `CategoryFilter` on each tab filters cards correctly; "All" resets filter
- [ ] Direct `POST /api/roadmap/vote` by free user returns 403
- [ ] Direct `POST /api/feature-requests` by free user returns 403
- [ ] `POST /api/feature-requests` rate limit: 4th submission in one day returns 429
- [ ] Content moderation blocks profanity/abuse in feature request submissions
- [ ] PostHog events fire: `roadmap.voted`, `feature_request.submitted`, `feature_request.voted`
- [ ] Page loads correctly in dark mode
- [ ] `CategoryFilter` scrolls horizontally on mobile without layout break
- [ ] `SettingsRow` link visible in More tab and navigates correctly
