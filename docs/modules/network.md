---
module: network
updated: 2026-03-26
status: shipped
phase: 1A
---

# Network

One-line: The Network tab — colleague graph from shared yacht attachments, endorsement management (received/sent/requests), saved profiles with bookmark folders.

## Current State

- Network page with tabbed interface (Endorsements / Colleagues / Saved): working
- Colleague graph via `get_colleagues` RPC: working — computes colleagues from overlapping yacht attachments
- Colleagues tab: yacht-grouped view (D7: list-based) — colleagues sorted by yacht with link headers, dedup guard, per-group Endorse button with correct yacht_id
- Endorsement request sending: shared `sendEndorsementRequest()` helper in `lib/endorsements/send-request.ts` — used by both colleague-direct and contact-batch flows in `RequestEndorsementClient.tsx`
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

## Decisions That Bind This Module

- **D-009**: Endorsements require shared yacht attachment — colleague graph is the gating mechanism
- **D-028**: Graph edges are reality-bound — only shared employment creates connections
- **D-029**: Contacts are non-graph — the colleague list is derived from real shared yachts, not follows
- **D-011**: Absence of endorsements is neutral — empty endorsement list shows encouraging empty state, never shaming

## Next Steps

- [ ] Add colleague count badge to the Network tab bar icon
- [ ] Consider "People you may know" suggestions based on 2nd-degree yacht connections
- [ ] Add search/filter within the colleagues list (by yacht, by role)
- [ ] Pagination for colleagues list if graph grows large
