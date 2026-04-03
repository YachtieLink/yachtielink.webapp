---
module: network
updated: 2026-04-03
status: shipped
phase: 1A
---

# Network

One-line: The Network tab — colleague graph from shared yacht attachments, endorsement management (received/sent/requests), saved profiles with bookmark folders.

## Current State

- Network page with tabbed interface (Endorsements / Colleagues / Saved): working
- Colleague graph via `get_colleagues` RPC: working — computes colleagues from overlapping yacht attachments
- Colleague list with shared yacht names, profile photos, role, and "Endorse" CTA: working
- Endorsements received list with excerpt, endorser name, yacht, date: working
- Endorsement requests received (with "Write endorsement" and "Decline" actions): working
- Endorsement requests sent (with status pills: Pending/Completed/Expired/Cancelled): working
- Request actions (cancel, resend): working via `RequestActions` component
- Saved profiles page at `/app/network/saved`: working
- Bookmark folders (create, delete, filter, move profiles between folders): working
- Save/unsave profiles via API: working — upsert on `(user_id, saved_user_id)`
- Self-save prevention: working — API returns 400 if you try to save your own profile
- Folder deletion moves profiles to null (no folder) via FK `ON DELETE SET NULL`: working
- PostHog tracking on profile save: working
- Framer Motion animations (stagger, fadeUp, cardHover, popIn): working throughout
- Known issues: none identified

## Key Files

| What | Where |
|------|-------|
| Network page (server) | `app/(protected)/app/network/page.tsx` |
| Network unified view (client) | `components/network/NetworkUnifiedView.tsx` |
| Yacht accordion | `components/network/YachtAccordion.tsx` |
| Colleague row | `components/network/ColleagueRow.tsx` |
| Endorsement summary card | `components/network/EndorsementSummaryCard.tsx` |
| Endorsement CTA card | `components/network/EndorsementCTACard.tsx` |
| Network loading skeleton | `app/(protected)/app/network/loading.tsx` |
| AudienceTabs (client component) | `components/audience/AudienceTabs.tsx` |
| RequestActions (cancel/resend) | `components/audience/RequestActions.tsx` |
| Saved profiles page (server) | `app/(protected)/app/network/saved/page.tsx` |
| SavedProfilesClient (client) | `app/(protected)/app/network/saved/SavedProfilesClient.tsx` |
| Saved profiles API (GET/POST/DELETE) | `app/api/saved-profiles/route.ts` |
| Move to folder API (PATCH) | `app/api/saved-profiles/[id]/route.ts` |
| Profile folders API (GET/POST) | `app/api/profile-folders/route.ts` |
| Folder update/delete API (PUT/DELETE) | `app/api/profile-folders/[id]/route.ts` |
| DB migration | `supabase/migrations/20260317000021_profile_robustness.sql` |

## DB Schema

**`saved_profiles`**:
- `id` (uuid PK), `user_id`, `saved_user_id`, `folder_id` (nullable FK to `profile_folders`), `created_at`
- Unique constraint: `(user_id, saved_user_id)`
- Check constraint: `user_id != saved_user_id`
- RLS: users can only CRUD their own rows

**`profile_folders`**:
- `id` (uuid PK), `user_id`, `name` (max 50 chars), `emoji` (max 10 chars), `sort_order`, `created_at`
- RLS: users can only CRUD their own folders

**Colleague graph** (computed, not stored):
- `get_colleagues(p_user_id)` RPC returns `{ colleague_id, shared_yachts[] }` based on overlapping attachments

## Network Page Data Flow

The server component fetches five queries in parallel:
1. `get_colleagues` RPC for colleague list
2. Endorsements received (with endorser + yacht joins)
3. Endorsement requests received (matching on user ID or email)
4. Endorsement requests sent
5. Endorsements given (for context)

Then fetches colleague profiles and yacht names in a second parallel batch. All data is passed to the `AudienceTabs` client component.

## API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/saved-profiles` | GET, POST, DELETE | List (paginated with folder filter), save, unsave |
| `/api/saved-profiles/[id]` | PATCH | Move saved profile to a different folder |
| `/api/profile-folders` | GET, POST | List user's folders, create new folder |
| `/api/profile-folders/[id]` | PUT, DELETE | Rename folder, delete folder |

## Decisions

**2026-03-08** — D-036: Colleague graph included in Phase 1A build target. Timeline, messaging, and IRL interactions deferred. — Ari

**2026-02-05** — D-035: Phase 1 hiring surfaces are constrained by design. Future phases may leverage the graph for hiring workflows. No Phase 1 constraint should be interpreted as a permanent prohibition. — Ari

**2026-02-05** — D-034: Yachtielink is open to yachting professionals beyond crew under identical edge-formation and visibility rules, with no privileged trust or visibility. — Ari

**2026-02-05** — D-033: Any participant or tagged user may remove themselves from an interaction or post at any time. Consent must be revocable to prevent coercion. — Ari

**2026-02-05** — D-032: In-person encounters are first-class interaction objects requiring mutual confirmation. Public or private, with private interactions visible only to participants. — Ari

**2026-02-05** — D-031: Timeline ordering is strictly chronological. Trending, boosting, virality, and engagement-weighted ranking are prohibited. Algorithmic surfacing corrupts truth-seeking. — Ari

**2026-02-05** — D-030: A chronological timeline is permitted when visibility is bounded to a user's network. Users maintain real career memory without incentivising global engagement loops. — Ari

**2026-02-05** — D-029: Contacts exist for messaging and limited timeline visibility only. They never create trust, endorsements, or graph edges. — Ari

**2026-02-05** — D-028: Graph edges are created only by shared employment (colleagues) or verified in-person encounters (IRL connections). The graph must represent real-world overlap. — Ari

## Recent Activity

**2026-04-03** — Rally 009 Session 6, Lane 3 (feat/experience-transfer): Network page and colleagues page updated to filter dormant endorsements. `.or('is_dormant.is.null,is_dormant.eq.false')` appended to queries in `app/(protected)/app/network/page.tsx` and `app/(protected)/app/network/colleagues/page.tsx`. Multiple `.or()` calls are ANDed in PostgREST (produces expected SQL: `WHERE (...) AND (is_dormant IS NULL OR is_dormant = false)`).

**2026-04-03** — Rally 009 Session 3: Full Network tab redesign. Replaced tabbed interface with yacht-grouped accordion view (`NetworkUnifiedView` orchestrator). New components: `YachtAccordion` (navy wayfinding, easeGentle animation), `ColleagueRow` (endorsement status indicators), `EndorsementSummaryCard`, `EndorsementCTACard`. Server component fetches colleagues RPC, endorsements, ghost profiles in parallel. Navy section color wayfinding throughout.

**2026-04-03** — Rally 009 Review: Fixed `Set<string>` RSC serialization bug — `endorsedColleagueIds` and `pendingColleagueIds` converted from `Set` to `string[]` before crossing server→client boundary. `NetworkUnifiedView` props updated to match.

**2026-04-02** — Rally 009 Session 1 Lane 2 (`fix/p2-bug-fixes`): `SavedProfileCard` sea time fully wired — `page.tsx` computes `seaTimeDays`/`yachtCount` from attachment dates (mirrors `get_sea_time()` SQL), passed through `SavedProfilesClient.tsx`, rendered as "1y 6mo at sea · 2 yachts" detail line. `Math.max(0, ...)` guard prevents negative-days edge case.
**2026-04-01** — Lane 2 (PR #137): Colleague display names updated to show full `"First Last"` throughout. Nickname pattern `"Charlotte 'Charlie' Beaumont"` when display_name differs from first name. Applied to colleagues page and endorsement request page. `get_colleagues` RPC confirmed to deduplicate correctly — multi-accordion is intentional UX.
**2026-03-27** — Sprint 10.1: `font-serif` on network page h1. `cardHover` animation on SavedProfileCard (lift on hover, scale on tap). `popIn` on nav notification badges (BottomTabBar + SidebarNav).

**2026-03-21** — Sprint 10.3: Network page — colleague cards link to `/u/{handle}`, endorsement text links converted to proper buttons; page title added.

**2026-03-21** — Sprint 10.1 Wave 1 A2: Saved profiles promoted to `/app/network/saved` — server-side data fetching, folder CRUD, move-to-folder, empty state; `SavedTab` in `AudienceTabs` replaced with link card.

**2026-03-21** — Sprint 10.1: Added `PATCH /api/saved-profiles/[id]` route for folder assignment.

**2026-03-18** — Post-Phase1A fixes: Added error handling to `SavedTab` in `AudienceTabs.tsx` — `Promise.all` fetch now has `.catch()/.finally()` so tab shows empty state instead of hanging on network failure.

**2026-03-18** — Phase 1A Profile Robustness: New tables — `profile_folders`, `saved_profiles` with RLS; new API routes `/api/saved-profiles` (GET/POST/DELETE), `/api/profile-folders` (GET/POST), `/api/profile-folders/[id]` (PUT/DELETE); `SaveProfileButton` component with optimistic toggle; `getSavedStatus()`, `getSavedProfiles()`, `getProfileFolders()` query helpers.

**2026-03-17** — Phase 1A Cleanup Spec 10: BottomTabBar — added `networkBadge` prop with red dot indicator on Network tab; app layout fetches pending endorsement request count server-side.

**2026-03-17** — Phase 1A Cleanup: New `/api/badge-count` endpoint + `lib/hooks/useNetworkBadge.ts` — polls every 60s client-side; moved network badge from server layout → client-side hook so app shell renders instantly.

**2026-03-17** — Phase 1A Cleanup Spec 06: `SidebarNav.tsx` — desktop sidebar (`hidden md:flex`, fixed left, 64px, 5 tabs + YL logo); `components/nav/icons.tsx` shared icon SVGs; BottomTabBar gets `md:hidden` for mobile-only.

**2026-03-15** — Sprint 7: `AudienceTabs.tsx` — replaced BottomSheet indirection with prominent teal CTA card linking to `/app/endorsement/request`, progress bar embedded.

**2026-03-15** — Sprint 8: `lib/queries/notifications.ts` — `getPendingRequestCount` with React.cache for dedup.

**2026-03-14** — Sprint 4: Replaced `app/audience` placeholder — `get_colleagues` RPC → profile + yacht lookup → colleague cards with shared yacht label and "Endorse" shortcut; colleague graph derived on access, not stored.

**2026-03-14** — Sprint 5: `app/(protected)/app/audience/page.tsx` full rewrite — parallel fetch of all 5 data sets (colleague graph + endorsement requests/sent + endorsements received), passes to `AudienceTabs`.

**2026-03-14** — Sprint 5: `AudienceTabs.tsx` — client tab component with endorsements/colleagues segment toggle, request-received list, endorsements-received list, requests-sent list with status pills, `RequestActions` component for cancel/resend.

**2026-03-13** — Sprint 1: DB function `get_colleagues` — derives colleague graph on access via shared yacht attachments.

## Next Steps

- [ ] Add colleague count badge to the Network tab bar icon
- [ ] Consider "People you may know" suggestions based on 2nd-degree yacht connections
- [ ] Add search/filter within the colleagues list (by yacht, by role)
- [ ] Pagination for colleagues list if graph grows large
