# Rally 006 — Build Plan

**Last updated:** 2026-03-29
**Source of truth for decisions:** `BUILD-SPEC.md` (same directory)
**Execution strategy:** 4 waves — Wave 0 (Opus, sequential), Waves 1-2 (Sonnet agents, parallel), Wave 3 (Opus, integration)

---

## Wave 0 — Foundations (Opus, sequential)

These unblock everything else. Must complete before parallel waves start.

### 0A. Fix `pb-tab-bar` regression (P1)

**File:** `app/(protected)/app/layout.tsx`

**Current state (line 21-25):**
```tsx
<main className="flex-1 md:pl-16">
  <div className="mx-auto max-w-2xl px-4 md:px-6">
    {children}
  </div>
</main>
```

**Fix:** Add `pb-tab-bar` to the inner wrapper for mobile, remove on desktop:
```tsx
<main className="flex-1 md:pl-16">
  <div className="mx-auto max-w-2xl px-4 md:px-6 pb-tab-bar md:pb-0">
    {children}
  </div>
</main>
```

The `pb-tab-bar` utility is already defined in `globals.css`:
```css
.pb-tab-bar {
  padding-bottom: calc(var(--tab-bar-height) + var(--safe-area-bottom));
}
```

**Verify:** Content on all protected pages should no longer be hidden behind the bottom tab bar on mobile (375px). The `md:pb-0` ensures desktop isn't affected.

---

### 0B. Fix onboarding wizard skip logic

**File:** `components/onboarding/Wizard.tsx`

**Current state (line 41-45):**
```ts
function getStartingStep(data: WizardProps["initialData"]): number {
  if (data.handle) return 3;    // already has handle → done
  if (data.full_name) return 2; // has name but no handle → handle step
  return 0;                     // start at cv-upload
}
```

**Bug:** When `full_name` is set from the email prefix by the DB trigger (`handle_new_user()`), users skip past step 0 (CV upload) and step 1 (name) — they land directly on the handle step.

**Fix:** Only skip to step 3 (done) if `onboarding_complete` is true. Otherwise always start at step 0:
```ts
function getStartingStep(data: WizardProps["initialData"]): number {
  if (data.handle) return 3;    // onboarding was completed (handle = final step)
  return 0;                     // always start at cv-upload
}
```

Remove the `full_name` check entirely. The name step (step 1) should always be shown — it pre-fills from `full_name` if available, but the user still confirms it.

**Edge case:** User who partially completed onboarding (has `full_name` from a previous attempt but no handle) will restart from step 0. This is correct — they should re-confirm their name and optionally upload a CV.

---

### 0C. Fix avatar `object-top` default

**File:** `components/ui/ProfileAvatar.tsx`

**Current state (line 36):**
```tsx
<img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
```

**Fix:**
```tsx
<img src={src} alt={alt} className="w-full h-full rounded-full object-cover object-top" />
```

**Roll-your-own avatars to also fix** (apply `object-top` to all avatar `<img>` / `<Image>` tags):

| File | Line(s) | Current | Notes |
|------|---------|---------|-------|
| `components/public/layouts/PortfolioLayout.tsx` | ~239 | `object-cover` | Endorser avatar in portfolio layout |
| `components/public/layouts/RichPortfolioLayout.tsx` | ~467 | `object-cover` | Endorser avatar in rich portfolio |
| `components/public/bento/tiles/EndorsementsTile.tsx` | ~72 | `object-cover` (via Next Image) | Endorser avatar in bento tile |
| `components/profile/IdentityCard.tsx` | ~96 | `object-cover` (via Next Image) | Profile page identity card (72px) |
| `components/audience/AudienceTabs.tsx` | ~254, ~564 | `object-cover` (via Next Image) | Endorsement request + colleague avatars |

For each: add `object-top` alongside `object-cover`.

**Future cleanup (not Rally 006):** Migrate all roll-your-own avatars to use `ProfileAvatar` component. For now, just add `object-top` to each instance.

---

### 0D. Migration: Upgrade `search_yachts()` RPC

**New file:** `supabase/migrations/20260330000001_search_yachts_multi_signal.sql`

**Current `search_yachts` signature:**
```sql
search_yachts(p_query text, p_limit int default 10)
returns table (id uuid, name text, yacht_type text, length_meters numeric, flag_state text, sim real)
```

**New signature:**
```sql
search_yachts(
  p_query text,
  p_builder text default null,
  p_length_min numeric default null,
  p_length_max numeric default null,
  p_limit int default 10
)
returns table (
  id uuid,
  name text,
  yacht_type text,
  length_meters numeric,
  flag_state text,
  builder text,
  cover_photo_url text,
  crew_count bigint,
  current_crew_count bigint,
  sim real
)
```

**Logic:**
1. Base similarity on `name_normalized` vs `lower(trim(p_query))` using `similarity()` (existing)
2. If `p_builder` is provided, boost score by 0.2 when `lower(yachts.builder) = lower(p_builder)`
3. If `p_length_min`/`p_length_max` provided, boost score by 0.15 when `length_meters` is within range (±10% tolerance)
4. `crew_count`: subquery `count(distinct user_id) from attachments where yacht_id = y.id and deleted_at is null`
5. `current_crew_count`: subquery `count(distinct user_id) from attachments where yacht_id = y.id and deleted_at is null and end_date is null`
6. Include `builder` and `cover_photo_url` in return
7. Order by boosted similarity desc, limit to `least(p_limit, 50)`
8. **Prefix-aware matching:** Also compute similarity against the query WITH common prefixes prepended (M/Y, S/Y, MY, SY). Take the highest similarity across all variants. This surfaces "M/Y Excellence V" when searching "Excellence 5" without stripping the stored name.
9. **Numeral awareness:** Compute additional similarity with roman↔digit substitution (V↔5, III↔3, II↔2, IV↔4). Take highest.
10. Grant to `authenticated` only (same as current).

**SQL sketch:**
```sql
CREATE OR REPLACE FUNCTION public.search_yachts(
  p_query text,
  p_builder text default null,
  p_length_min numeric default null,
  p_length_max numeric default null,
  p_limit int default 10
)
RETURNS TABLE (
  id uuid, name text, yacht_type text, length_meters numeric,
  flag_state text, builder text, cover_photo_url text,
  crew_count bigint, current_crew_count bigint, sim real
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q_norm text := lower(trim(p_query));
  safe_limit int := least(p_limit, 50);
BEGIN
  RETURN QUERY
  WITH prefix_variants AS (
    SELECT unnest(ARRAY[
      q_norm,
      'm/y ' || q_norm, 's/y ' || q_norm,
      'my ' || q_norm, 'sy ' || q_norm
    ]) AS variant
  ),
  numeral_map(roman, digit) AS (
    VALUES ('viii','8'),('vii','7'),('vi','6'),('iv','4'),
           ('v','5'),('iii','3'),('ii','2'),('i','1'),
           ('ix','9'),('x','10')
  ),
  base_scores AS (
    SELECT
      y.id, y.name, y.yacht_type, y.length_meters, y.flag_state,
      y.builder, y.cover_photo_url,
      (SELECT count(DISTINCT a.user_id) FROM attachments a WHERE a.yacht_id = y.id AND a.deleted_at IS NULL) AS crew_count,
      (SELECT count(DISTINCT a.user_id) FROM attachments a WHERE a.yacht_id = y.id AND a.deleted_at IS NULL AND a.end_date IS NULL) AS current_crew_count,
      GREATEST(
        similarity(y.name_normalized, q_norm),
        (SELECT max(similarity(y.name_normalized, pv.variant)) FROM prefix_variants pv)
      ) AS base_sim
    FROM yachts y
    WHERE similarity(y.name_normalized, q_norm) > 0.1
       OR EXISTS (SELECT 1 FROM prefix_variants pv WHERE similarity(y.name_normalized, pv.variant) > 0.1)
  )
  SELECT
    bs.id, bs.name, bs.yacht_type, bs.length_meters, bs.flag_state,
    bs.builder, bs.cover_photo_url,
    bs.crew_count, bs.current_crew_count,
    (bs.base_sim
     + CASE WHEN p_builder IS NOT NULL AND lower(bs.builder) = lower(trim(p_builder)) THEN 0.2 ELSE 0 END
     + CASE WHEN p_length_min IS NOT NULL AND bs.length_meters BETWEEN p_length_min AND p_length_max THEN 0.15 ELSE 0 END
    )::real AS sim
  FROM base_scores bs
  WHERE bs.base_sim > 0.1
  ORDER BY sim DESC
  LIMIT safe_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.search_yachts FROM anon;
GRANT EXECUTE ON FUNCTION public.search_yachts TO authenticated;
```

**Note:** Roman numeral matching can be a Phase 2 enhancement if the SQL gets too complex. The prefix variants + builder/length boosting handle 90% of cases. Flag in the code with a TODO comment.

---

## Wave 1 — Parallel Fleet (4 Sonnet agents)

### Agent A: CV Yacht Matching UI

**Files to create:**
- `components/yacht/YachtMatchCard.tsx` — yacht card for match states (green/amber/blue)

**Files to extend (already exists):**
- `components/yacht/YachtPicker.tsx` — ALREADY EXISTS with search, create mode, duplicate detection, BottomSheet. Extend with: builder/length display in results, cover_photo_url display, crew counts from new RPC, modal wrapper for use in StepExperience (currently renders inline, needs a modal/sheet wrapper for the CV import context).

**Files to modify:**
- `components/cv/steps/StepExperience.tsx` — replace current yacht cards with YachtMatchCard
- `components/cv/CvImportWizard.tsx` — wire match confidence data from parse → StepExperience
- `lib/cv/types.ts` — extend types if needed

**YachtMatchCard props:**
```ts
interface YachtMatchCardProps {
  // Match state
  matchState: 'green' | 'amber' | 'blue'
  similarity: number

  // Yacht data (from search_yachts result)
  yacht: {
    id: string
    name: string
    builder: string | null
    length_meters: number | null
    yacht_type: string | null
    cover_photo_url: string | null
    crew_count: number
    current_crew_count: number
  } | null

  // CV-parsed data (what the user's CV said)
  parsedName: string
  parsedBuilder: string | null
  parsedLength: number | null

  // Employment data
  role: string
  startDate: string | null
  endDate: string | null  // null = "Current"
  cruisingArea: string | null

  // Actions
  onSelect: (yachtId: string) => void
  onReject: () => void
  onCreateNew: () => void
  onOpenPicker: () => void
}
```

**YachtMatchCard states:**

**Green (high confidence, `similarity >= 0.8`):**
- Yacht photo (if `cover_photo_url`, else placeholder)
- Name, builder, length
- "4 registered crew currently on this yacht" (from `current_crew_count`)
- "12 crew on YachtieLink" (from `crew_count`)
- Card tappable → links to `/app/yacht/{id}` in new tab for verification
- Auto-selected (green check badge)
- "Wrong yacht?" link → opens YachtPicker

**Amber (fuzzy, `0.3 <= similarity < 0.8`):**
- "Did you mean...?" header
- Show top 1-3 yacht suggestions as mini cards (name, builder, length, crew count)
- Each tappable to select
- "This yacht may not exist — create a new one?" fallback link → onCreateNew
- "Search for a different yacht" → opens YachtPicker

**Blue (no match, `similarity < 0.3` or no results):**
- "You're the first crew member to register this yacht"
- "Please ensure all details are correct so your crew mates can find it"
- Shows the CV-parsed yacht data as editable fields
- Creates new yacht entry on confirm

**YachtPicker modal:**
```ts
interface YachtPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (yacht: YachtSearchResult) => void
  initialQuery?: string
  initialBuilder?: string
  initialLength?: number
}
```
- Search input with debounce (300ms)
- Results as yacht cards: name, builder, length, photo, crew count, current crew
- Each card tappable to select
- "Yacht not listed? Create a new one" at bottom
- Cards link to `/app/yacht/{id}` for verification (open in new tab)
- **Reusable** — will be used later for profile experience editing

**StepExperience changes:**
- Currently maps parsed yachts to simple cards with `matched` / `new` / `skipped` badges
- Replace with: for each parsed yacht, call `search_yachts()` with the parsed name + builder + length
- Classify the best result into green/amber/blue based on similarity score
- Render YachtMatchCard for each
- Wire onSelect/onReject/onCreateNew/onOpenPicker handlers
- The `onConfirm` callback now passes matched yacht IDs (not just parsed data)

**Data flow:**
```
CV parse → ParsedYachtEmployment[] → StepExperience
  → For each: call search_yachts(name, builder, length)
  → Classify: green (≥0.8), amber (0.3-0.79), blue (<0.3)
  → Render YachtMatchCard with appropriate state
  → User confirms/changes → ConfirmedYacht[] with matched yacht IDs
```

**search_yachts call:** Client-side via Supabase RPC:
```ts
const { data } = await supabase.rpc('search_yachts', {
  p_query: parsedYacht.yacht_name,
  p_builder: parsedYacht.builder,
  p_length_min: parsedYacht.length_meters ? parsedYacht.length_meters * 0.9 : null,
  p_length_max: parsedYacht.length_meters ? parsedYacht.length_meters * 1.1 : null,
  p_limit: 5
})
```

**Edge cases:**
- CV parser returns empty yacht name → skip matching, show blue state with editable fields
- Multiple parsed yachts match the same DB yacht → show a warning "Two of your jobs matched the same yacht — is this correct?"
- User already attached to the yacht → show "Already on your profile" badge, auto-skip

---

### Agent B: Plan Management Page

**Files to create:**
- `app/(protected)/app/settings/plan/page.tsx` — the plan management page

**Files to modify:**
- `components/profile/ProfileHeroCard.tsx` — change `/app/billing` links to `/app/settings/plan`
- `components/public/HeroSection.tsx` — change `/app/billing` link to `/app/settings/plan`
- `app/(public)/subdomain/[handle]/reserved.tsx` — change `returnTo=/app/billing` to `returnTo=/app/settings/plan`
- `app/api/stripe/portal/route.ts` — change `return_url` from `/app/more` to `/app/settings/plan`

**Files to delete:**
- `app/(protected)/app/billing/page.tsx`

**Plan page structure:**
```tsx
// Server component
export default async function PlanPage() {
  // 1. Get auth user
  // 2. Fetch: subscription_status, subscription_plan, subscription_ends_at,
  //          stripe_customer_id, founding_member from users
  // 3. Determine state: 'free' | 'pro_active' | 'pro_cancelled'
  // 4. Fetch Stripe prices via /api/stripe/prices (new lightweight route)
  //    OR hardcode display prices and let Stripe Checkout handle actuals
  // 5. Render appropriate state
}
```

**Three states:**

**Free user:**
```
[BackButton → /app/more]
[h1: "Your Plan"]

[Card: Current Plan]
  "Free" badge (grey)

[Card: Upgrade to Crew Pro]
  Benefits list:
  - Custom subdomain (handle.yachtie.link)
  - Profile analytics & insights
  - Premium CV templates
  - Priority support

  [Monthly price] / [Annual price + "Save X%"]
  [Upgrade button → POST /api/stripe/checkout { plan: 'monthly' }]
  [Annual button → POST /api/stripe/checkout { plan: 'annual' }]

  Founding member callout (if slots remaining):
  "Join as a founding member — locked-in pricing forever"
```

**Pro active:**
```
[BackButton → /app/more]
[h1: "Your Plan"]

[Card: Current Plan]
  "Pro" badge (teal)
  Plan: Monthly/Annual
  Renews: {date}
  Founding member badge (if applicable)

[Card: Upgrade to Annual]  (only if on monthly)
  "Switch to annual and save X%"
  [Switch button → POST /api/stripe/checkout { plan: 'annual' }]

[Card: Manage Subscription]
  [Manage button → POST /api/stripe/portal]
  "Update payment method, view invoices, or cancel"
```

**Pro cancelled (grace period):**
```
[BackButton → /app/more]
[h1: "Your Plan"]

[Card: Current Plan]
  "Pro" badge with "Expires {date}" subtitle

[Card: You'll lose access to:]
  - Custom subdomain
  - Profile analytics
  - Premium CV templates
  - Priority support

  "Your Pro data is saved — upgrade anytime to restore it"

  [Resubscribe button → POST /api/stripe/checkout]

[Card: Manage Subscription]
  [Manage button → POST /api/stripe/portal]
  "View invoices"
```

**Stripe price display:** Use the env var price IDs. For display amounts, create a small lookup:
```ts
const PLAN_PRICES = {
  monthly: { standard: '€8.99', founding: '€4.99' },
  annual: { standard: '€69.99', founding: '€49.99' },
}
```

These match the Stripe dashboard prices. If they change in Stripe, update here too. Acceptable for MVP — proper Stripe price fetching is a post-launch enhancement.

**Detect state:**
```ts
const isPro = isProFromRecord(user)
const isCancelled = user.subscription_status === 'pro' &&
  user.subscription_ends_at && new Date(user.subscription_ends_at) > new Date()
// Actually: cancelled = subscription_ends_at is set and in the future
// Active = subscription_status === 'pro' && (!subscription_ends_at || subscription_ends_at > now)
// Free = subscription_status !== 'pro'
```

Wait — need to check how the webhook sets these. From the webhook handler:
- `subscription.created` / `subscription.updated`: sets `subscription_status = 'pro'`, `subscription_ends_at = current_period_end`
- `subscription.deleted`: sets `subscription_status = 'free'`, clears plan/ends_at

So `subscription_ends_at` is ALWAYS set for active Pro users (it's the renewal date). Cancelled = webhook fires `subscription.deleted` which clears status to `'free'`. But during the cancellation grace period (user cancelled but period hasn't ended), Stripe sends `subscription.updated` with `cancel_at_period_end = true` — need to check if the webhook handles this.

**Action for Agent B:** Read `app/api/stripe/webhook/route.ts` to understand exact state transitions. Use `getProStatus()` from `lib/stripe/pro.ts` which already handles the logic.

**Pattern to follow:** The More page (`app/(protected)/app/more/page.tsx`) for layout, card styling, and section structure. Use `card-soft rounded-2xl` for cards. Use design system tokens. Follow the serif heading pattern from profile settings (`text-[28px] font-serif`).

**Important:** After building the plan page, update the More page billing section to link to `/app/settings/plan` instead of `/app/insights`.

---

### Agent C: Analytics Wiring

**Files to modify:**
- `app/api/cv/download-pdf/route.ts` — add `pdf_download` event
- `app/api/cv/public-download/[handle]/route.ts` — add `pdf_download` event
- `app/api/cv/generate-pdf/route.ts` — add `profile_view` event
- `components/public/ShareButton.tsx` — add `link_share` event
- `components/cv/ShareModal.tsx` — add `link_share` event
- `components/profile/ProfileHeroCard.tsx` — add `link_share` event

**How to call `record_profile_event`:**

From API routes (server-side), use the service client:
```ts
import { createServiceClient } from '@/lib/supabase/service'

const supabase = createServiceClient()
await supabase.rpc('record_profile_event', {
  p_user_id: userId,
  p_event_type: 'pdf_download'  // or 'profile_view' or 'link_share'
})
```

From client components, use the user's client:
```ts
const supabase = createClient()
await supabase.rpc('record_profile_event', {
  p_user_id: profileOwnerId,
  p_event_type: 'link_share'
})
```

**Route-by-route instructions:**

**`download-pdf/route.ts`** — After the signed URL is created successfully, before returning:
```ts
// Track download event (don't await — fire and forget)
const serviceClient = createServiceClient()
serviceClient.rpc('record_profile_event', {
  p_user_id: user.id,
  p_event_type: 'pdf_download'
}).then(() => {}).catch(() => {})
```

**`public-download/[handle]/route.ts`** — After finding the user and creating signed URL, before redirect:
```ts
// Need to get the profile owner's user_id from the handle lookup
// The query already fetches it — use data.id (assuming the select includes id)
// Track: fire and forget
const serviceClient = createServiceClient()
serviceClient.rpc('record_profile_event', {
  p_user_id: data.id,  // profile owner, not visitor
  p_event_type: 'pdf_download'
}).then(() => {}).catch(() => {})
```
**Check:** Does the current query select `id`? If not, add it to the select.

**`generate-pdf/route.ts`** — After successful generation and upload, before returning:
```ts
serviceClient.rpc('record_profile_event', {
  p_user_id: user.id,
  p_event_type: 'profile_view'
}).then(() => {}).catch(() => {})
```

**`ShareButton.tsx`** — After successful share or clipboard copy:
```ts
// Need profile owner's userId passed as prop
// Add prop: userId: string
const supabase = createClient()
supabase.rpc('record_profile_event', {
  p_user_id: userId,
  p_event_type: 'link_share'
}).then(() => {}).catch(() => {})
```
**Check:** ShareButton needs to know whose profile is being shared. Trace callers to ensure `userId` is available.

**`ShareModal.tsx`** — After share/copy:
```ts
// Same pattern — add userId prop
```

**`ProfileHeroCard.tsx`** — After `shareProfile()` or `copyUrl()`:
```ts
// The component already knows the user's profile — it has handle, displayName etc.
// Need userId prop or get it from context
```

**Key principle:** All analytics calls are fire-and-forget. Never block the user action on analytics. Never fail the user action if analytics fails.

**Edge case:** Public download route is unauthenticated — use service client, not user client. The `record_profile_event` function is `SECURITY DEFINER` so it works regardless.

---

### Agent D: Endorsement Engagement System

**Files to create:**
- `components/endorsement/EndorsementBanner.tsx` — the collapsible engagement bar

**Files to modify:**
- `components/audience/AudienceTabs.tsx` — replace the current endorsement CTA with EndorsementBanner
- `app/(protected)/app/network/page.tsx` — pass additional data (endorsement freshness) to AudienceTabs

**Current endorsement CTA** (AudienceTabs lines ~149-168): Full-width teal card linking to `/app/endorsement/request` with progress bar. Always visible. Not dismissible.

**EndorsementBanner props:**
```ts
interface EndorsementBannerProps {
  endorsementCount: number
  mostRecentEndorsementDate: string | null  // ISO date
  mostRecentSharedTenureEnd: string | null  // ISO date of when endorser/endorsee last worked together
  hasRecentEndorsementRequest: boolean      // request sent to someone within 12 months
}
```

**State machine:**

```
Phase 1 (count < 5):
  expanded: progress bar + motivational copy
  collapsed: small bar "2/5 endorsements"

Phase 2 (count >= 5):
  always collapsed: tier badge
  5-9: "Good" badge
  10-19: "Great" badge
  20+: "Outstanding" badge

Phase 3 (staleness — overlaid on Phase 2):
  if stale (12+ months since later of endorsement date / tenure end):
    re-expand with freshness nudge copy
    collapsed: same tier badge (user can re-collapse)
```

**localStorage keys:**
```ts
`yl-endorsement-banner-collapsed`: 'true' | null
`yl-endorsement-banner-collapsed-at`: ISO timestamp
```

**Collapse/expand logic:**
```ts
// Phase 1
if (count < 5) {
  const collapsedAt = localStorage.getItem('yl-endorsement-banner-collapsed-at')
  if (collapsedAt) {
    const daysSince = (Date.now() - new Date(collapsedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince >= 7) {
      // Re-expand after 7 days
      expanded = true
    } else {
      expanded = false  // Stay collapsed
    }
  } else {
    expanded = true  // Never collapsed, show expanded
  }
}

// Phase 2: always collapsed (tier badge), no nudging unless stale
// Phase 3: check staleness
if (count >= 5 && isStale) {
  // Same 7-day re-expand logic as Phase 1
  // Different copy: freshness nudge
}
```

**Staleness calculation:**
```ts
function isEndorsementStale(
  mostRecentEndorsementDate: string | null,
  mostRecentSharedTenureEnd: string | null
): boolean {
  if (!mostRecentEndorsementDate) return true  // No endorsements at all

  const endorsementDate = new Date(mostRecentEndorsementDate)
  const tenureEnd = mostRecentSharedTenureEnd ? new Date(mostRecentSharedTenureEnd) : null

  // Clock starts from the LATER of endorsement date or tenure end
  const clockStart = tenureEnd && tenureEnd > endorsementDate ? tenureEnd : endorsementDate

  const monthsSince = (Date.now() - clockStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
  return monthsSince >= 12
}
```

**Server data needed:** The network page server component needs to compute:
1. `mostRecentEndorsementDate` — `max(created_at) from endorsements where endorsee_id = user.id`
2. `mostRecentSharedTenureEnd` — More complex: for each endorsement, find the shared attachment between endorser and endorsee, get the later `end_date`. Take the max across all endorsements. If any shared attachment has `end_date = null` (still working together), use the endorsement date (endorsement still goes stale if old).
3. `hasRecentEndorsementRequest` — `exists(endorsement_requests where requester_id = user.id and created_at > now() - interval '12 months')`

**Note:** The staleness query is complex. For Rally 006, simplify: use `mostRecentEndorsementDate` only for the staleness clock. The full shared-tenure calculation can be a fast-follow. This still catches the main case (old endorsements) without the complex join.

**Celebration at 5:** When `count` transitions from 4→5 (or first load with count=5 and no localStorage flag for `yl-endorsement-5-celebrated`), show a brief animation or toast: "You've hit 5 endorsements!" Set flag to avoid repeat.

**Copy:**
- Phase 1 expanded: "Yachties with 5+ endorsements get significantly more responses"
- Phase 3 expanded: "You've got great endorsements — consider getting a recent one so employers see a current picture of your working relationships"
- Keep copy concise. One line max.

**Endorsement cards in AudienceTabs:** While touching the endorsements section, also remove the `border-l-2 border-[var(--color-interactive)]` pattern from endorsement cards — the founder explicitly rejected this as "textbook AI frontend." Replace with the standard `card-soft rounded-2xl` pattern used elsewhere.

---

## Wave 2 — Parallel Fleet (3 Sonnet agents)

### Agent E: Network IA + "Unknown" Fix

**Files to modify:**
- `components/audience/AudienceTabs.tsx` — remove Saved tab, fix "Unknown" display
- `app/(protected)/app/network/page.tsx` — remove savedCount fetch, add recipient profile join
- `app/(protected)/app/more/page.tsx` — add Saved section

**Remove Saved tab:**

In `AudienceTabs.tsx`:
1. Remove `'saved'` from the tab type union
2. Remove `savedCount` from props
3. Remove the Saved tab button from the segment control
4. Remove the `SavedTab` component entirely
5. Default tab stays `'endorsements'`

In `network/page.tsx`:
1. Remove the `savedCount` query (`saved_profiles` count)
2. Remove `savedCount` prop passed to `AudienceTabs`

**Add Saved to More page:**

In `more/page.tsx`, add a new "Saved" section between "Profile" and "Account":
```tsx
<SectionHeader>Saved</SectionHeader>
<div className="card-soft rounded-2xl overflow-hidden divide-y divide-[var(--color-border)]">
  <SettingsRow href="/app/network/saved" label="Saved Profiles" sublabel="View your saved profiles" />
</div>
```

Also update the SavedProfilesClient back button to point to `/app/more` instead of `/app/network`.

**Fix "Unknown" in requests sent:**

In `network/page.tsx`, update the endorsement requests sent query:
```ts
// Current:
.select('id, token, recipient_email, recipient_phone, status, expires_at, cancelled_at, yacht:yachts!yacht_id(name)')

// New — add recipient profile join:
.select('id, token, recipient_email, recipient_phone, recipient_user_id, status, expires_at, cancelled_at, yacht:yachts!yacht_id(name), recipient:users!recipient_user_id(display_name, full_name)')
```

Update the `RequestSent` interface in `AudienceTabs.tsx`:
```ts
interface RequestSent {
  id: string
  token: string
  recipient_email: string | null
  recipient_phone: string | null
  recipient_user_id: string | null
  status: string
  expires_at: string
  cancelled_at: string | null
  yacht: { name: string } | null
  recipient: { display_name: string | null; full_name: string | null } | null
}
```

Update the display logic:
```ts
// Current:
const recipient = req.recipient_email ?? req.recipient_phone ?? 'Unknown'

// New:
const recipient = req.recipient?.display_name
  ?? req.recipient?.full_name
  ?? req.recipient_email
  ?? req.recipient_phone
  ?? 'Pending'  // Better than "Unknown" — the link was shared but nobody has used it yet
```

---

### Agent F: PageHeader Component + Back Button Audit

**Files to create:**
- `components/ui/PageHeader.tsx`

**Files to modify (all inner pages):**
- `app/(protected)/app/network/saved/SavedProfilesClient.tsx`
- `app/(protected)/app/about/edit/page.tsx` (or client component)
- `app/(protected)/app/certification/new/page.tsx` (or client component)
- `app/(protected)/app/certification/[id]/edit/page.tsx`
- `app/(protected)/app/education/[id]/edit/page.tsx`
- `app/(protected)/app/profile/settings/page.tsx` (or client component)
- `app/(protected)/app/profile/photos/page.tsx` (or client component)
- `app/(protected)/app/profile/gallery/page.tsx`
- `app/(protected)/app/attachment/page.tsx` (or client component)
- `app/(protected)/app/attachment/new/page.tsx`
- `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx`
- `app/(protected)/app/endorsement/[id]/edit/EditEndorsementClient.tsx`
- `app/(protected)/app/billing/page.tsx` — DELETE (replaced by settings/plan)
- Any other inner pages found during audit

**PageHeader component:**
```tsx
interface PageHeaderProps {
  backHref: string
  backLabel?: string      // default: 'Back'
  title: string
  subtitle?: string
  actions?: React.ReactNode  // right-side slot
  count?: number             // shown as "(N)" after title
}

export function PageHeader({ backHref, backLabel, title, subtitle, actions, count }: PageHeaderProps) {
  return (
    <div className="flex items-start gap-3 pt-2 mb-6">
      <BackButton href={backHref} label={backLabel} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-serif tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          {count !== undefined && (
            <span className="text-sm text-[var(--color-text-secondary)]">({count})</span>
          )}
          {actions && <div className="ml-auto">{actions}</div>}
        </div>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
```

**Design decisions:**
- `text-xl font-serif` — smaller than main page h1s (`text-[28px]`) but still serif for brand consistency
- `pt-2` — consistent top padding (safe area handled by layout)
- `mb-6` — consistent bottom margin before content
- `items-start` not `items-center` — handles multiline titles/subtitles better
- BackButton is always present (it's a required prop)

**Refactoring pattern for each page:**
```tsx
// Before (varies per page):
<div className="flex items-center gap-3">
  <BackButton href="/app/profile" />
  <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text-primary)]">About</h1>
</div>

// After (consistent):
<PageHeader backHref="/app/profile" title="About" subtitle="Tell people about your background and experience." />
```

**Special case — certification/new:** Uses a custom back button (not BackButton) for multi-step navigation. The back button calls `setStep('category')` not a URL. For in-page step navigation, keep the custom button but style it to match BackButton visually. The initial step should use PageHeader with a real back URL.

---

### Agent G: Share Fallback + Editable Fields + Pro Links

**Three small tasks, no file conflicts with other agents.**

**Task 1: Share button visual fix on endorsement request**

**File:** `app/(protected)/app/endorsement/request/RequestEndorsementClient.tsx`

The native share button already falls back to clipboard copy — the functionality works. The rally spec said "empty share button" which likely means the icon isn't rendering. Verify: does the share icon show? If the icon is missing, add it. If the button renders correctly, this task is done.

Current share button (line ~350):
```tsx
<button onClick={nativeShare} disabled={!shareLink} className="...">
  <Share2 size={18} />  // Verify this icon renders
</button>
```

If the icon is there but the button looks empty on certain browsers, add a text label fallback:
```tsx
<button onClick={nativeShare} disabled={!shareLink} className="...">
  <Share2 size={18} />
  <span className="text-xs">Share</span>
</button>
```

**Task 2: Editable field affordance on profile page**

**Files:**
- `app/(protected)/app/profile/page.tsx` — language chips section
- `components/profile/ProfileSectionGrid.tsx` — audit edit affordance

The `ProfileSectionGrid` already has edit/add links at the bottom of each section card — `text-xs font-medium text-[var(--color-interactive)]` labeled "Edit" or "Add". This is the existing pattern.

Languages are rendered OUTSIDE the grid as a standalone `<Link>` block with no visual edit affordance. Fix:

Option A: Move languages INTO `ProfileSectionGrid` as a proper section with the same edit/add pattern.

Option B: Add a pencil icon or "Edit" text to the standalone language block.

**Recommendation:** Option A — move languages into the grid. This makes them consistent with every other section. The grid already handles the edit link pattern.

**If languages array is empty:** Currently nothing renders. Add an empty state row in the grid: "Add languages" link to `/app/languages/edit`.

**Task 3: Pro upsell links → `/app/settings/plan`**

**Files to modify:**
- `components/profile/ProfileHeroCard.tsx` — line 132 and 153: change `/app/billing` to `/app/settings/plan`
- `components/public/HeroSection.tsx` — line 185: change `/app/billing` to `/app/settings/plan`
- `app/(public)/subdomain/[handle]/reserved.tsx` — line 62: change `returnTo=/app/billing` to `returnTo=/app/settings/plan`
- `app/(protected)/app/more/page.tsx` — Billing section: change `/app/insights` link to `/app/settings/plan` for free users
- `app/(protected)/app/certs/page.tsx` — Pro upsell banner: change `/app/insights` to `/app/settings/plan`
- `app/(protected)/app/profile/photos/page.tsx` — Pro upsell text: add link to `/app/settings/plan` if not already linked

All "upgrade" and "billing" CTAs should point to `/app/settings/plan`. The plan page handles routing to Stripe Checkout.

---

## Wave 3 — Integration (Opus)

After all agents complete:

1. **Type-check:** `npx tsc --noEmit`
2. **Drift-check:** `npm run drift-check`
3. **Build:** `npm run build`
4. **Fix any breakage** from parallel agent conflicts (import collisions, type mismatches)
5. **Visual QA at 375px** — test every changed surface on mobile
6. **Run `/review`** — two-phase code review
7. **Run `/yachtielink-review`** — architecture and drift review
8. **Run `/test-yl`** — interactive QA with test accounts

---

## Exit Criteria

- [ ] Onboarding always starts at CV upload step (step 0) — verify with a fresh signup
- [ ] Avatar thumbnails show heads (not cropped) — verify across: endorsement cards, colleague cards, profile page
- [ ] Yacht matching during CV import shows green/amber/blue states with yacht details
- [ ] YachtPicker modal opens, searches, and selects yachts
- [ ] "Excellence 5" search finds "M/Y Excellence V" with high confidence
- [ ] PDF download records `pdf_download` event in `profile_analytics`
- [ ] PDF generation records `profile_view` event
- [ ] Share actions record `link_share` event
- [ ] `/app/settings/plan` shows correct state for Free, Pro active, Pro cancelled
- [ ] Stripe Checkout session created from plan page
- [ ] Stripe Portal accessible from plan page
- [ ] `/app/billing` returns 404 (deleted)
- [ ] All former `/app/billing` links point to `/app/settings/plan`
- [ ] Endorsement banner collapses and remembers state
- [ ] Banner re-expands after 7 days
- [ ] Tier badges show at 5+/10+/20+ endorsements
- [ ] Network page has 3 tabs (no Saved)
- [ ] Saved Profiles accessible from More menu
- [ ] "Unknown" replaced with name/email/phone in requests sent
- [ ] All inner pages use PageHeader component
- [ ] Content not hidden behind bottom tab bar on mobile
- [ ] Endorsement cards do NOT use `border-l-2` pattern
- [ ] `npm run build` zero errors
- [ ] Type-check clean
- [ ] No new console errors
- [ ] All verified at 375px mobile viewport

---

## Not In Scope (explicit)

- Insights UI redesign
- Saved Yachts feature
- Subdomain route upgrade
- Sprint 13 items (SEO, sitemap, cookie banner)
- Settings preview UX
- Pro upsell visual consistency (badges/locks design)
- Visibility toggle UX
- Roman numeral ↔ digit matching in search (TODO comment, Phase 2)
- Dark mode (not yet implemented app-wide)
- Endorsement staleness based on shared tenure end date (simplified to endorsement date only for Rally 006)
