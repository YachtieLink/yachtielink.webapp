---
module: employment
updated: 2026-03-21
status: shipped
phase: 1A
---

# Employment

One-line: Yacht entities as shared graph nodes, employment attachments linking crew to yachts, colleague discovery via shared attachments, and yacht detail pages with crew lists and cover photos.

## Current State

- Yacht entities: working — `yachts` table with name, yacht_type, size_category, length_meters, flag_state, year_built, is_established, cover_photo_url, created_by
- Yacht search: working — `ilike` name search used in both onboarding and attachment creation
- Yacht creation: working — users can create new yachts during onboarding or attachment flow (name, type, size, optional length)
- Duplicate prevention: planned per D-037 — fuzzy match at creation time with confirmation prompt; not yet implemented in code (current flow uses simple `ilike` search only)
- Yacht detail page: working at `/app/yacht/[id]` — shows cover photo, metadata (type, length, flag, year), crew count stat, and full crew list with role + date range
- Yacht cover photo: working — single photo per yacht, upload gated to users with attachment (D-038); overwrites previous photo
- Attachment creation: working — 3-step wizard at `/app/attachment/new` (yacht picker -> role selection with department filter -> date picker with "currently working" toggle)
- Attachment editing: working at `/app/attachment/[id]/edit` — edit role label, start/end dates, or soft-delete
- Attachment soft delete: working — sets `deleted_at` timestamp; preserves endorsements received for that yacht
- Role selection: working — loads from `roles` table with department grouping, search/filter, and custom role fallback
- Custom roles: logged to `other_role_entries` table for future reference taxonomy updates
- Colleague graph: working — `get_colleagues` RPC returns colleague IDs with shared yacht arrays; used for endorsement request flow
- Coworker verification: working — `are_coworkers_on_yacht` RPC used to gate endorsement creation
- Established yachts: `is_established` column exists; establishment rule (60 days + crew threshold per D-017) is defined but enforcement deferred
- No yacht merging: per D-006, duplicate yachts remain separate in Phase 1
- RLS: attachments scoped to own user via anon key; yacht reads are public (any authenticated user)
- Rate limiting: attachment creation goes through standard profile-edit limits

## Key Files

| What | Where |
|------|-------|
| Yacht detail page | `app/(protected)/app/yacht/[id]/page.tsx` |
| Yacht cover photo upload | `app/(protected)/app/yacht/[id]/photo/page.tsx` |
| New attachment wizard | `app/(protected)/app/attachment/new/page.tsx` |
| Edit attachment | `app/(protected)/app/attachment/[id]/edit/page.tsx` |
| Yacht picker component | `components/yacht/YachtPicker.tsx` |
| Profile queries (attachments) | `lib/queries/profile.ts` |
| Validation schemas | `lib/validation/schemas.ts` |

## Decisions That Bind This Module

- **D-006** — No yacht merging in Phase 1; duplicates remain separate
- **D-008** — Yacht graph in Phase 1: yacht entities as verification infrastructure
- **D-009** — Endorsement gating rule: endorsements require shared yacht attachment
- **D-017** — Yacht establishment rule: 60 days + crew threshold (defined, not enforced yet)
- **D-028** — Graph edges are reality-bound: only shared employment creates edges
- **D-036** — Phase 1A includes yacht entities and employment attachments
- **D-037** — Yacht duplicate prevention via creation-time fuzzy match prompt (not yet implemented)
- **D-038** — Yacht photo upload gated to users with attachment
- **D-039** — Single cover photo in Sprint 4; full gallery deferred to Phase 1B Sprint 11

## Next Steps

- [ ] Implement fuzzy match duplicate prevention at yacht creation time (D-037)
- [ ] Enforce yacht establishment rule (is_established auto-set after 60 days + crew threshold)
- [ ] Full yacht photo gallery (Phase 1B Sprint 11, per D-039)
- [ ] Yacht merge tooling (Phase 2, per D-006)
