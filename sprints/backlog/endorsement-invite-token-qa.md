# Endorsement Invite Token QA

**Status:** idea
**Priority guess:** P2 (important)
**Date captured:** 2026-03-29

## Summary
End-to-end test that endorsement invitation tokens always allow the receiver to give an endorsement back to the sender. The token flow needs to be verified — sender invites via email/WhatsApp/link, receiver opens token, receiver can write and submit an endorsement for the sender regardless of whether they have an account.

## Scope
- Verify token generation includes correct sender identity and yacht context
- Verify token links resolve to the endorsement form pre-filled for the sender
- Verify unauthenticated users can submit via token (no account required)
- Verify authenticated users who open a token also land correctly
- Verify expired/invalid tokens show clear error states
- Verify a token can't be reused to endorse someone else (scoped to sender)
- Verify the endorsement lands on the sender's profile after submission

## Why
This is a trust-critical flow — if invitations don't correctly map to the sender, endorsements could land on the wrong profile or fail silently. The logic connecting invitation tokens to endorsement submission needs to be airtight before launch.

## Files to investigate
- `app/(protected)/app/endorsement/request/` — token generation
- Supabase RPC for token creation/validation
- Public endorsement submission flow (token consumer side)
