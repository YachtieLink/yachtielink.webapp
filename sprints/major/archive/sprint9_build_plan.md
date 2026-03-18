# Sprint 9: Availability + Search + Endorsement Signals — Detailed Build Plan for Sonnet

## Context

Sprint 9 is the first Phase 1B sprint. Phase 1A shipped the core loop: profile → yacht → endorsement → public page → Pro. Sprint 9 adds discoverability — crew can signal they're available, Pro users can search, and the endorsement layer gets its first social signals.

**Gate:** Phase 1A graph loop should be showing health before building this (endorsement-to-profile ratio >0.3, organic share rate >10%). But at current build velocity, it makes sense to have the code ready even if the gate metrics need time to materialise.

**Dependencies from prior sprints:**
- User profiles with all fields (Sprint 3)
- Employment history, yacht graph, colleague derivation (Sprints 2-5)
- Endorsements with shared-yacht gating (Sprint 5)
- Public profile at `/u/:handle` (Sprint 6)
- Pro subscription status on user record (Sprint 7)
- Profile analytics table `profile_analytics` (Sprint 4+)
- Zod validation + rate limiting patterns (Sprint 8)
- Content moderation via AI-01 (Sprint 8)

**What Sprint 9 delivers:**
1. Availability toggle with 7-day auto-expiry
2. Limited crew search (Pro only)
3. Endorsement signals (agree/disagree)

---

## Part 1: Availability Toggle

### Database

**New table: `availability`**
```sql
create table availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  available boolean not null default false,
  available_from date,
  notes text check (char_length(notes) <= 300),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);
```

- RLS: users can read/write their own row. Pro users can read other users' availability (for search results). Public profile shows availability if user has opted in.
- Index on `(available, expires_at)` for search queries filtering active availability.

### API Routes

**`PUT /api/availability`** — Set or update availability
- Zod schema: `{ available: boolean, available_from?: date, notes?: string }`
- When `available = true`: set `expires_at = now() + 7 days`
- When `available = false`: set `available = false` (keep row for history)
- Run AI-01 content moderation on `notes` field before saving
- PostHog event: `availability.toggled` with `{ available: boolean }`

**`GET /api/availability`** — Get current user's availability
- Returns availability row or null

### Expiry Logic

**Cron job: `app/api/cron/availability-expiry/route.ts`**
- Runs daily (Vercel cron)
- Finds all rows where `available = true AND expires_at < now()`
- Sets `available = false` on expired rows
- PostHog event: `availability.expired`

**Day-6 reminder email:**
- Cron finds rows where `available = true AND expires_at BETWEEN now() AND now() + 1 day`
- Sends email via Resend: "Your availability expires tomorrow — re-confirm to stay visible"
- Email includes one-tap re-confirm link (authenticated deep link that re-sets the 7-day window)

### UI

**Profile tab — availability card:**
- Prominent toggle at top of profile (below identity card, above About)
- When off: "Set yourself as available" with toggle
- When on: green indicator, "Available from [date]", notes preview, "Expires in X days", re-confirm button
- Tap to edit: bottom sheet with available_from date picker + notes text field (300 char max)

**Public profile:**
- If available: green "Available" badge below name/role
- If available_from is in the future: "Available from [date]"
- Notes shown if present

---

## Part 2: Limited Crew Search (Pro Only)

### Database

No new tables needed. Search queries existing tables:
- `users` (role, department, location)
- `attachments` (yacht history)
- `availability` (available status)
- `yachts` (yacht name matching)

**New index:** `users(location_country)` for location-based search.

### API Routes

**`GET /api/search/crew`** — Search crew (Pro only)
- Auth required + Pro subscription check. Return 403 for free users.
- Zod query params:
  ```
  {
    q?: string,           // free text (name, role)
    role?: string,        // exact role match
    department?: string,  // exact department match
    yacht_name?: string,  // fuzzy yacht name match
    location?: string,    // country code
    available_only?: boolean,  // filter to available crew
    page?: number,        // pagination (default 1)
    limit?: number        // results per page (default 20, max 50)
  }
  ```
- Search logic:
  - `q` searches against `users.display_name` and `users.primary_role` using ILIKE
  - `yacht_name` joins through `attachments` → `yachts` using trigram similarity
  - `available_only` joins to `availability` where `available = true AND expires_at > now()`
  - Results sorted by: available first, then by endorsement count (desc), then by profile completeness
- Rate limit: 30 searches/hour for Pro users (prevent scraping)
- PostHog event: `search.executed` with `{ filters_used: string[], result_count: number }`

**Response format (summary view per D-025):**
```json
{
  "results": [
    {
      "id": "uuid",
      "display_name": "John D.",  // truncated last name for summary
      "primary_role": "Chief Engineer",
      "departments": ["Engineering"],
      "last_yacht": "MY Seahorse",
      "available": true,
      "available_from": "2026-04-01",
      "endorsement_count": 7,
      "photo_url": "..."
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 3
}
```

**Contextual profile visibility (D-025):**
- Search results show **summary only**: display name (truncated last name), role, last yacht, availability, endorsement count, photo
- Full name, contact info, endorsement text, full employment history only visible via direct profile link (`/u/:handle`)
- This means search result cards link to `/u/:handle` for full view

### UI

**Search tab or section in Audience tab:**
- Search bar with filter pills: Role, Department, Yacht, Location, Available Only
- Results list: card per crew member showing summary fields
- Tap card → navigate to `/u/:handle`
- Empty state: "No crew match your search"
- Free user state: search bar visible but disabled, with upgrade CTA: "Search is a Pro feature — find crew by role, yacht, and availability"

**Search filters:**
- Role: typeahead from roles reference data
- Department: dropdown (Deck, Interior, Engineering, etc.)
- Yacht: text input with fuzzy match
- Location: country dropdown
- Available only: toggle

---

## Part 3: Endorsement Signals (Agree/Disagree)

### Database

**New table: `endorsement_signals`**
```sql
create table endorsement_signals (
  id uuid primary key default gen_random_uuid(),
  endorsement_id uuid references endorsements(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  signal text not null check (signal in ('agree', 'disagree')),
  created_at timestamptz default now(),
  unique(endorsement_id, user_id)
);
```

- RLS: users can read signals on endorsements they can already view. Users can create/update/delete their own signal. Unique constraint prevents multiple signals per user per endorsement.
- Index on `endorsement_id` for aggregation queries.

**Eligibility check:** User must have an overlapping yacht attachment with the endorsement's yacht. Same shared-yacht gating as endorsement writing, but for signals.

### API Routes

**`POST /api/endorsements/:id/signal`** — Add or update signal
- Zod schema: `{ signal: 'agree' | 'disagree' }`
- Shared-yacht gating: verify the signalling user has an attachment to the endorsement's yacht
- Upsert: if signal exists, update it; if not, create it
- PostHog event: `endorsement.signalled` with `{ signal: string }`

**`DELETE /api/endorsements/:id/signal`** — Remove signal
- Remove the user's signal on this endorsement

**`GET /api/endorsements/:id/signals`** — Get signal counts
- Returns: `{ agree: number, disagree: number, user_signal: 'agree' | 'disagree' | null }`
- `user_signal` is the current user's signal (if any)

### UI

**Endorsement card (on profile and public profile):**
- Below each endorsement: small agree/disagree buttons with counts
- Agree: thumbs up or checkmark icon + count
- Disagree: thumbs down or X icon + count
- Only show signal buttons to users who have a shared yacht attachment (hide for others)
- Active state: highlight the user's own signal
- Tap again to remove signal (toggle behaviour)

**Important:** Signals are display-only in Phase 1B. They don't trigger any moderation, don't hide endorsements, and don't affect trust calculations. Trust weight integration is deferred to Phase 2+.

---

## Files to Create/Modify

### New files
- `app/api/availability/route.ts` — GET/PUT availability
- `app/api/cron/availability-expiry/route.ts` — daily expiry cron
- `app/api/search/crew/route.ts` — Pro crew search
- `app/api/endorsements/[id]/signal/route.ts` — signal CRUD
- Migration: `availability` table + `endorsement_signals` table + new indexes
- Components: AvailabilityCard, AvailabilityEditor (bottom sheet), SearchBar, SearchResults, SearchFilters, EndorsementSignalButtons
- Email template: availability expiry reminder

### Modified files
- Profile page: add AvailabilityCard above About section
- Public profile page: add availability badge
- Audience tab: add search section (or replace with search + colleagues layout)
- Endorsement card component: add signal buttons
- Vercel cron config: add availability-expiry schedule
- Resend email templates: add availability reminder

---

## Decision Log

| ID | Decision | Rationale |
|----|----------|-----------|
| D-023 | Search is Pro-only | Searching to find candidates = recruiting = pay for it |
| D-025 | Search results show summary, not full profile | Prevents profile harvesting. Full details require direct link |
| D-027 | Availability is active opt-in with 7-day expiry | Keeps the pool current. Crew stay in control |
| D-019 | Endorsement signals are display-only | Trust weight deferred to Phase 2+. Signals are social proof, not moderation |

---

## Build Order

1. **Availability toggle** — database + API + profile UI + public profile badge (most visible, most useful)
2. **Availability expiry cron + reminder email** — complete the availability lifecycle
3. **Endorsement signals** — database + API + UI on endorsement cards (independent of search)
4. **Crew search** — database indexes + API + search UI (most complex, build last)

---

## Success Criteria

- [ ] Crew can toggle availability on/off with date and notes
- [ ] Availability auto-expires after 7 days
- [ ] Day-6 reminder email sends and re-confirm link works
- [ ] Available crew show green badge on public profile
- [ ] Pro users can search by role, department, yacht, location, availability
- [ ] Search results show summary only (truncated name, no contact info)
- [ ] Free users see search locked with upgrade CTA
- [ ] Users with shared yacht attachment can agree/disagree on endorsements
- [ ] Signal counts display on endorsement cards
- [ ] Users without shared yacht cannot see signal buttons
- [ ] All new API routes have Zod validation and rate limiting
- [ ] All user-generated text (availability notes) passes AI-01 content moderation
- [ ] PostHog events firing: `availability.toggled`, `availability.expired`, `search.executed`, `endorsement.signalled`
