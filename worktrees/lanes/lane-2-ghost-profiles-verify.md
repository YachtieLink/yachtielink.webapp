# Lane 2 — Ghost Profiles Verification + GhostEndorserBadge

## Objective

PR #133 (Ghost Profiles Wave 1) is merged. Verify the claim flow and ghost-to-real profile merge work end-to-end. Then wire the `GhostEndorserBadge` into profile views so ghost endorsements display the endorser status correctly.

## Background

Ghost profiles are created when a user adds a yacht and names crew. Those ghosts become claimable accounts when the real person signs up. This is the primary viral growth loop.

Key pages:
- `/endorse/[token]` — non-auth endorsement flow (ghost endorser writes an endorsement without signing up)
- `/claim/[id]` — claim flow (real person claims their ghost profile)

## Required Reading Before Coding
- `AGENTS.md` — project instructions
- `sprints/backlog/ghost-profiles-claimable-accounts.md` — full design spec (24 decisions)
- `PHASE1-CLOSEOUT.md` section 3 — Ghost Profiles checklist

## Tasks

### Verification (read + test, don't build unless broken)
1. Read the ghost profiles migration files to understand the schema
2. Read `/endorse/[token]` page — trace the flow: token → ghost profile lookup → endorsement write → confirmation
3. Read `/claim/[id]` page — trace the flow: claim → auth check → profile merge → redirect
4. Read the RPC/API that handles ghost-to-real merge — verify it transfers endorsements, yacht associations, and colleague links
5. Document any issues found — if something is broken, fix it; if it needs design decisions, note it in the report

### Build: GhostEndorserBadge
6. Find or create a `GhostEndorserBadge` component — a small visual indicator that an endorsement came from a ghost endorser (not yet a YachtieLink member)
7. Wire it into endorsement display on profile views — wherever endorsements are rendered, if `endorser_id` is null (ghost endorsement), show the badge
8. The badge should communicate "endorsement from someone not yet on YachtieLink" in a positive way — not "unknown user"
9. `npx tsc --noEmit` — zero type errors
10. `npm run drift-check` — zero drift
11. Self-review diff, write report

## Allowed Files
- `app/(public)/endorse/[token]/**` — verify + fix if broken
- `app/(public)/claim/[id]/**` — verify + fix if broken
- `components/endorsements/**` — badge component + endorsement card wiring
- `components/profile/**` — if endorsements are rendered in profile components
- `lib/endorsements.*` — if endorsement helpers need ghost awareness
- `supabase/migrations/**` — READ ONLY (do not create new migrations)
- Any file in `app/(protected)/app/endorsement/` — for wiring badge into endorsement views
- Any file in `app/(public)/u/[handle]/` — for wiring badge into public profile endorsement display

## Forbidden Files
- `components/ui/PageHeader.tsx` (Lane 1)
- `app/not-found.tsx` (Lane 3)
- CHANGELOG.md, STATUS.md, sprint docs
- New Supabase migrations (READ existing ones only)
