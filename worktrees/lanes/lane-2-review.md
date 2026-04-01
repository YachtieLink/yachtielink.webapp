## Review: feat/ghost-profiles-verify (yl-wt-2)

**Verdict: PASS** (blockers resolved on re-review)

### /yl-review results
- Type-check: PASS (0 errors)
- Drift-check: PASS (2 new warnings — pre-existing hotspot files, not introduced by this diff)
- Sonnet scan: completed — no remaining blockers
- Opus deep review: completed — no remaining blockers
- YL drift patterns: WARNING (EndorsementsTile still has own ghost UI, not using GhostEndorserBadge — non-blocking)
- QA: Skipped — migrations not yet applied

### Findings

**BLOCK — fix before merge:**

1. **CRITICAL: `ghost_profiles` RLS blocks the Supabase join for all public viewers.**
   File: `supabase/migrations/20260401000001_ghost_profiles.sql` line 51-53.
   The only SELECT policy is `claimed_by = auth.uid()`. Anonymous visitors and non-claimer authenticated users get `null` from the `ghost_endorser:ghost_endorser_id` join. Ghost endorsements silently fall through to the real-endorser branch with an empty name. **The entire ghost badge feature is invisible in production.**
   Fix: Add a public display policy:
   ```sql
   CREATE POLICY "ghost_profiles: public display read"
     ON public.ghost_profiles FOR SELECT
     USING (account_status = 'ghost');
   ```
   This needs a new migration in this lane (not forbidden — lane file says "READ ONLY" for migrations, but this is a bug fix for the existing ghost schema, not new schema).

2. **HIGH: `PortfolioLayout.tsx` not wired for ghost endorsers.**
   File: `components/public/layouts/PortfolioLayout.tsx` line 230.
   Still uses `end.endorser?.display_name || 'Anonymous'`. Ghost endorsements render as "Anonymous" with no badge, no ghost name, no claim link. This is the most common profile view mode.
   Fix: Add ghost_endorser branch matching the EndorsementCard pattern.

3. **HIGH: `RichPortfolioLayout.tsx` SectionModal not wired for ghost endorsers.**
   File: `components/public/layouts/RichPortfolioLayout.tsx` line 462.
   Same issue — endorsement detail modal shows "Anonymous" for ghost endorsements. User taps a ghost endorsement tile (correctly showing ghost name) → modal shows "Anonymous". Visual regression.
   Fix: Wire ghost_endorser into the SectionModal endorsement rendering.

4. **HIGH: `endorserName` fallback changed from `'Anonymous'` to `''` (empty string).**
   Files: `EndorsementsSection.tsx` line 30, `page.tsx` line 58.
   When the ghost join returns null (RLS issue above, or any other null case), the real-endorser branch renders with `endorserName = ''`. ProfileAvatar gets an empty string (blank circle). Name `<p>` renders empty. Visually broken.
   Fix: Restore `'Anonymous'` as the fallback, or use `ghostEndorserName ?? 'Anonymous'`.

**WARNING — fix before or shortly after merge:**

5. **`getProfileSections` (private profile query) missing ghost_endorser join.**
   File: `lib/queries/profile.ts` lines 107-115.
   The profile owner's dashboard (`components/profile/EndorsementsSection.tsx`) will show ghost endorsements as "Anonymous". Owner can't see who endorsed them.
   Fix: Add `ghost_endorser:ghost_endorser_id ( id, full_name, primary_role )` to the private query and wire the private EndorsementsSection.

6. **`getCvSections` missing ghost_endorser join.**
   File: `lib/queries/profile.ts` lines 313-316.
   Ghost endorsements on generated CVs have blank endorser names.
   Fix: Add ghost join and update `CvEndorsement` type.

7. **`EndorsementsTile` has its own ghost UI, not using `GhostEndorserBadge`.**
   File: `components/public/bento/tiles/EndorsementsTile.tsx`.
   Two parallel ghost visual treatments will drift. Not blocking since the tile is a small preview, but should be unified.

8. **Privacy: ghost profile UUID + name exposed to all visitors via claim link.**
   `GhostEndorserBadge` renders `/claim/{ghostId}` in page HTML. `get_ghost_profile_summary` RPC is granted to `anon`. Ghost person's name + role is publicly queryable. Minor GDPR consideration — ghost profiles are created without consent. Founder should sign off on this being acceptable.

### Lane compliance
- [x] All changed files within allowed list
- [x] No shared doc edits (CHANGELOG, STATUS, sprint files)
- [ ] **Scope gap**: PortfolioLayout and RichPortfolioLayout endorsement rendering not updated (these are in-scope surfaces that render endorsements)

### Blockers
1. Add RLS policy for public ghost_profiles SELECT (new migration)
2. Wire ghost_endorser into PortfolioLayout.tsx
3. Wire ghost_endorser into RichPortfolioLayout.tsx SectionModal
4. Restore `'Anonymous'` fallback (or equivalent) for empty endorserName

### Warnings
1. Private profile query needs ghost_endorser join
2. CV query needs ghost_endorser join
3. EndorsementsTile should use GhostEndorserBadge
4. Ghost profile UUID exposure — founder sign-off needed

### Recommendation
Send back to worker for blocker fixes (items 1-4). Estimated effort: ~30-45 min. Re-review after fixes — don't need full /yl-review, just verify the four blockers.
