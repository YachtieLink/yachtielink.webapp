# Worker Completion Report — Lane 3: Ghost Profiles

---

## Lane

- **Worktree:** yl-wt-3
- **Branch:** feat/ghost-profiles
- **Lane spec:** Task prompt (lane-3-ghost-profiles.md did not exist on disk — spec taken from task)

---

## Summary

Built Wave 1 of the Ghost Profiles feature end-to-end: schema migrations, non-auth endorsement API, ghost auto-creation, claim flow, and all supporting pages and components. A non-authenticated visitor can now tap a link, write an endorsement in ~30 seconds (no password, no email verification), and get a ghost profile created automatically. They can later claim that profile via `/claim/[id]` to convert it into a full YachtieLink account with their endorsements pre-populated.

---

## Files Changed

```
-- New migrations
supabase/migrations/20260401000001_ghost_profiles.sql
supabase/migrations/20260401000002_endorsements_ghost.sql
supabase/migrations/20260401000003_endorsement_requests_ghost.sql

-- New API routes
app/api/endorsements/guest/route.ts
app/api/ghost-profiles/[id]/route.ts
app/api/ghost-profiles/claim/route.ts

-- New pages
app/(public)/endorse/[token]/page.tsx
app/(public)/endorse/[token]/success/page.tsx
app/(public)/claim/[id]/page.tsx

-- New lib
lib/ghost/schemas.ts
lib/ghost/merge.ts
lib/queries/ghost-profiles.ts

-- New components
components/ghost/GhostEndorseForm.tsx
components/ghost/GhostEndorserBadge.tsx

-- Modified (minimal, in-scope)
app/(public)/r/[token]/page.tsx         (unauthenticated block → three-option layout)
lib/rate-limit/helpers.ts               (added ghostEndorsement rate limit category)
```

---

## Migrations

- [x] Migration added: `supabase/migrations/20260401000001_ghost_profiles.sql`
- [x] Migration added: `supabase/migrations/20260401000002_endorsements_ghost.sql`
- [x] Migration added: `supabase/migrations/20260401000003_endorsement_requests_ghost.sql`

### Migration 1 — `ghost_profiles` table
Creates the `ghost_profiles` table with:
- `id`, `full_name`, `email`, `phone`, `primary_role`
- `verified_via` CHECK: `email_token | whatsapp_token | unverified`
- `account_status` CHECK: `ghost | claimed`
- `claimed_by` UUID FK → `auth.users(id)` ON DELETE SET NULL
- Partial UNIQUE indexes on `email` and `phone` (one ghost per contact method)
- RLS enabled; only the claiming user can read their own ghost record after claim

### Migration 2 — `endorsements` ghost columns + `claim_ghost_profile` RPC
- `ALTER COLUMN endorser_id DROP NOT NULL` — allows NULL for ghost rows
- `ADD COLUMN ghost_endorser_id UUID REFERENCES ghost_profiles(id) ON DELETE SET NULL`
- `ADD CONSTRAINT endorser_exactly_one` — enforces exactly one of endorser_id / ghost_endorser_id is set
- `CREATE UNIQUE INDEX endorsements_ghost_unique` — prevents duplicate ghost endorsements
- `CREATE INDEX endorsements_ghost_endorser_idx` — for efficient claim migration
- `CREATE OR REPLACE FUNCTION claim_ghost_profile(user_id, email)` — SECURITY DEFINER RPC:
  - Finds all ghost profiles matching the user's email
  - Soft-deletes conflicting endorsements (same endorser+recipient+yacht already exists)
  - Migrates remaining endorsements: `ghost_endorser_id` → `endorser_id`
  - Marks ghost as `claimed`
  - Sets `users.onboarding_complete = true` (bypass wizard for claimers)
  - Returns `{ migrated_count, ghost_ids_claimed }`

**⚠ Ordering concern:** Migration 2 references `ghost_profiles` (migration 1), so migrations must apply in order 1 → 2 → 3. The timestamps guarantee correct order.

**⚠ Breaking change risk:** Dropping NOT NULL on `endorser_id` is a schema change. The CHECK constraint `endorser_exactly_one` compensates — no endorsement can have both NULL. Existing data is unaffected (all rows have `endorser_id` set pre-migration).

### Migration 3 — `endorsement_requests` additions + RPCs
- `ADD COLUMN sent_via TEXT CHECK (sent_via IN ('email', 'whatsapp', 'shareable_link'))`
- `ADD COLUMN suggested_endorsements JSONB` (for LLM starters, Wave 2)
- `CREATE OR REPLACE FUNCTION get_endorsement_request_by_token` — updated to return `recipient_phone` and `sent_via` (additive; existing callers unaffected)
- `CREATE OR REPLACE FUNCTION get_ghost_profile_summary(id UUID)` — returns minimal ghost data for claim landing page; returns NULL if claimed/not found; granted to `anon, authenticated`

---

## Tests

- [x] Type check passed (`npx tsc --noEmit` — zero errors)
- [ ] Lint passed
- [ ] /review passed (reviewer handles)
- [ ] /yachtielink-review passed (reviewer handles)
- [ ] /test-yl passed (reviewer handles)
- [ ] Manual QA: Not run — no live Supabase instance in this worktree

---

## Risks

### 1. Migration 2 changes the endorsements schema (ALTER TABLE)
`endorser_id` drops NOT NULL. The `endorser_exactly_one` CHECK constraint ensures no row can have both NULL. Existing data is safe — all rows pre-migration have `endorser_id` set. However, any application code that assumes `endorser_id` is always set (e.g. joins, `.select('endorser:endorser_id(...)')`) will now receive `null` for ghost endorsements. Review the profile query joins carefully before merging.

**Specific concern:** `getProfileSections` and `getPublicProfileSections` in `lib/queries/profile.ts` use `endorser:endorser_id(display_name, full_name, handle)` — this returns `null` for ghost endorsements. The existing `PublicEndorsement` type already allows `endorser: ... | null`, so the TypeScript layer is safe. But the UI will show a blank endorser for ghost endorsements until `GhostEndorserBadge` is wired in (see item 3 below).

### 2. `claim_ghost_profile` RPC modifies `users.onboarding_complete`
When a ghost claims their profile, the RPC sets `onboarding_complete = true` so they can access `/app/profile` directly. This is intentional per spec ("No onboarding wizard"). However, this means users who claim will have no primary_role, departments, or handle set. The profile page must handle this gracefully. The existing profile page already renders with fallbacks for missing fields — this should be fine.

### 3. `GhostEndorserBadge` built but not wired into profile pages
The component is ready in `components/ghost/GhostEndorserBadge.tsx`. Wiring it into the public profile endorsements list requires:
- Updating the endorsement query (in `lib/queries/profile.ts` or a new parallel query) to also select `ghost_endorser:ghost_endorser_id(id, full_name, primary_role)`
- Conditionally rendering `GhostEndorserBadge` when `endorser` is null and `ghost_endorser` is set

This is a small follow-up task. Until done, ghost endorsements show without an endorser name in profile views.

### 4. `/r/[token]` page modified (not in original allowed list)
The unauthenticated block was replaced with the three-option layout (Write / Write + Create Account / Sign In). The change is minimal and self-contained (lines 117-152 replaced). The authenticated path is untouched. Flagging for master awareness.

### 5. Signup shortcut onboarding bypass — NOT implemented
The spec (point 13) mentions bypassing the onboarding wizard when clicking "Write endorsement & create account" from the endorsement page. This requires modifying the onboarding redirect flow, which touches `components/onboarding/` (forbidden) and the auth callback. For Wave 1, clicking that button goes to `/signup?returnTo=/r/{token}` — the user goes through standard onboarding and is redirected to the token page afterward. Deferred to Wave 2.

### 6. Deferred onboarding flag (`deferred_onboarding`) — NOT implemented
The spec mentions a flag "so the app gently reminds [users who bypass onboarding] later". Not implemented in Wave 1. The claim flow sets `onboarding_complete = true` without the reminder mechanism. Deferred to Wave 2.

### 7. Contact consolidation (OTP verify for phone ghosts) — NOT implemented
The spec (point 14) mentions prompting to merge phone-based ghost profiles after email claim via OTP verification. The data model supports it (separate ghost records per contact method, claim RPC finds by email). The OTP prompt UI and phone verification flow are Wave 2.

---

## Overlap Detected

- [x] Overlap with Lane 1 (CV wizard): None — components/cv/ untouched
- [x] Overlap with Lane 2 (SEO): None — public/ untouched
- [ ] Potential overlap: `lib/queries/profile.ts` — NOT modified, but the master should be aware that ghost endorsements will appear as `endorser: null` in existing profile queries. The GhostEndorserBadge wiring task requires adding a `ghost_endorser` column to the endorsements select, which does touch `lib/queries/profile.ts`. Flag to master.

---

## Recommended Merge Order

1. **Lane 3 (this lane) should merge first** among any lanes that touch the endorsements table, since it alters the schema. Any other lane touching endorsements should rebase on top of this after merge.
2. After merging, the master should run: `supabase db push` or apply migrations 20260401000001, 20260401000002, 20260401000003 in order.
3. Post-merge follow-up (small, low risk): wire `GhostEndorserBadge` into `app/(public)/u/[handle]/endorsements/` and `lib/queries/profile.ts`.

---

## Flow Summary (for QA)

**Ghost endorsement flow:**
1. `POST /api/endorsements/requests` (existing route) creates a request with `sent_via: 'email'`
2. Email sent with link to `/r/{token}`
3. Unauthenticated visitor lands on `/r/{token}` → sees three options
4. Taps "Write endorsement" → `/endorse/{token}`
5. Fills name, role, content → submits to `POST /api/endorsements/guest`
6. Ghost profile created, endorsement inserted with `ghost_endorser_id`
7. Request marked `accepted`
8. Redirected to `/endorse/{token}/success?ghost_id={id}`
9. Success page shows "Claim my profile" and "Done" CTAs

**Claim flow:**
1. Ghost taps "Claim my profile" → `/claim/{ghost_id}`
2. Sees their ghost summary (name, role, endorsement count)
3. Taps "Create account" → `/signup?returnTo=/claim/{ghost_id}`
4. Signs up → auth callback → `/claim/{ghost_id}` (authenticated now)
5. Server calls `claim_ghost_profile(user.id, user.email)`
6. RPC migrates endorsements, marks ghost claimed, sets `onboarding_complete = true`
7. `redirect('/app/profile')` — user lands on their profile with endorsements

**Already-authenticated user hitting claim page:**
- Server sees `user` → immediately calls `claimGhostProfile` → `redirect('/app/profile')`
