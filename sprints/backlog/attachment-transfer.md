# Attachment Transfer — Move Work History Between Yachts

**Status:** promoted (Sprint 12)
**Priority guess:** P2 (important)
**Date captured:** 2026-03-22

## Summary

Users should be able to transfer an attachment (work history entry) from one yacht to another when they joined the wrong node — e.g. a duplicate yacht entry or a typo. Work history is immutable (you can't delete that you worked somewhere — GDPR review pending) but you can correct *which yacht* it's attached to.

This also handles the duplicate yacht problem from the user side — instead of an admin merge tool, users self-correct by moving their attachment to the canonical yacht entry.

## Design Principles

- **History is immutable.** Users cannot delete that they worked on a yacht. They can only move it to the correct yacht. This is a correction mechanism, not an erasure mechanism. (Requires legal/GDPR sign-off — captured as open question.)
- **Endorsements follow the attachment.** When an attachment transfers, endorsements on that yacht pair should cascade. The endorser endorsed the *person* for the *work*, not the database row.
- **Audit trail.** Every transfer is logged with from/to/reason/timestamp. This protects against abuse and supports dispute resolution later.

## Scope

### Build
- Transfer UI: "Wrong yacht?" action on attachment detail/edit page
- YachtPicker opens → user selects correct yacht
- Confirmation step: "Move your [role] history from [old yacht] to [new yacht]? Your endorsements will also be updated."
- API route: `POST /api/attachment/transfer` — validates ownership, moves attachment + endorsements, logs transfer
- Endorsement cascade: update `endorsements.yacht_id` for all endorsements where both parties had this attachment on the old yacht
- RLS policy on `attachment_transfers` table (user can read own transfers)

### Don't Build Yet
- Admin review queue for transfers (overkill at current scale)
- Rate limiting on transfers (one transfer per attachment is probably enough — add a check)
- Notification to endorsers that their endorsement was moved ("John moved his M/Y Horizon history to M/Y Example")
- Undo/revert mechanism

## Database (prework shipping in Sprint 12)

```sql
attachment_transfers
├── id (uuid, PK)
├── attachment_id (FK to attachments)
├── from_yacht_id (FK to yachts)
├── to_yacht_id (FK to yachts)
├── transferred_by (FK to auth.users — should be attachment owner)
├── transferred_at (timestamptz, default now())
├── reason (text, nullable — user can explain why)
└── endorsements_moved (boolean — did we cascade endorsements?)
```

Table created in Sprint 12 migration (empty, no UI).

## UX Flow

1. User views their attachment (edit page or profile employment section)
2. Taps "Wrong yacht?" or "Transfer to different yacht"
3. YachtPicker opens — search for correct yacht
4. Confirmation dialog shows:
   - From: M/Y Horizon (Motor · 62m · 12 crew)
   - To: M/Y Example (Motor · 62m · 3 crew)
   - "Your role and dates will stay the same. X endorsements will be updated."
5. User confirms → attachment.yacht_id updated, endorsements cascaded, transfer logged
6. Success: "Your work history has been moved to M/Y Example."

## Open Questions

- **GDPR:** Does preventing deletion of work history hold up legally? Need lawyer sign-off. The position is: we don't delete that you worked somewhere, but you can correct which yacht entry it's linked to. Soft-delete (deleted_at) exists in the schema but the product choice is not to surface it as "remove from profile."
- **Multiple transfers:** Can a user transfer the same attachment multiple times? Probably yes — they might pick the wrong replacement too. But worth a sanity limit.
- **Endorser notification:** When endorsements move, should the endorser be told? Probably yes eventually, but not for v1.
- **Transfer to yacht you're already on:** Edge case — user has two attachments (different roles/dates) on two yachts that are duplicates. Transfer one → now they have two attachments on the same yacht. Allow it? Probably yes, different time periods are valid.

## Files Likely Affected

- `supabase/migrations/` — `attachment_transfers` table (Sprint 12 prework)
- `app/api/attachment/transfer/route.ts` — new API route
- `app/(protected)/app/attachment/[id]/edit/page.tsx` — add "Transfer" action
- `components/yacht/YachtPicker.tsx` — reused for target yacht selection
- `lib/supabase/` — types update for new table
