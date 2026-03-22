# Ghost Profiles & Claimable Accounts

**Status:** Backlog — should be planned as a major sprint before or alongside CV-Parse
**Source:** Founder (2026-03-22)
**Priority:** HIGH — this is the viral growth loop

## The Concept

When someone receives an endorsement request (via WhatsApp, email, or shareable link) and responds to it, they shouldn't need to create a full account first. The friction kills conversion — especially for captains and senior crew who are busy and skeptical.

Instead:

1. **They tap the link** → land on a simple endorsement writing page
2. **They write the endorsement** → "Great deckhand, hard worker" (30 seconds)
3. **A ghost profile is created** with whatever we know about them:
   - Name (from the endorsement request or what they enter)
   - Role + yacht (from the attachment context)
   - The endorsement they just wrote
4. **They're done** — no password, no email verification, no onboarding flow
5. **Later, they can claim the account** — verify their email/phone, set a password, and the full profile is theirs with everything already populated

## Why This Matters

- **Captains won't sign up** through a normal flow. They're busy, they don't see the value yet. But they WILL write a quick endorsement for their crew if the link makes it frictionless.
- **Once they've written one endorsement**, they're invested. They have content on the platform. Their name appears on someone else's profile. Now they have a reason to come back.
- **The claim flow is the warm conversion** — "You've already got a profile with 3 endorsements you've written. Claim it to see who's endorsed you."

## How It Works

### Ghost Profile Creation

When an endorsement is submitted by a non-authenticated user:

1. Check if a `users` record exists for this email/phone
2. If not, create a minimal `users` record:
   - `full_name` — from what they entered or the request metadata
   - `email` or `phone` — from the endorsement request
   - `primary_role` — from the attachment context (if available)
   - `onboarding_complete = false`
   - `account_status = 'ghost'` (new column)
   - No `auth.users` record yet — no password, no login
3. Create the endorsement record linked to this ghost user
4. The ghost profile is visible on YachtieLink (name + endorsements written) but has no login

### The Endorsement Flow (Non-Authenticated)

```
WhatsApp/Email link
    ↓
Landing page: "Write an endorsement for {name} on {yacht}"
    ↓
Simple form:
  - Your name (pre-filled if we have it)
  - Your role on this yacht
  - Your endorsement (textarea, 10-2000 chars)
  - Your email (for claiming later)
    ↓
Submit → ghost profile created → endorsement saved
    ↓
Thank you page:
  "Thanks! Your endorsement is live on {name}'s profile."
  "We've reserved a profile for you — claim it anytime."
  [Claim my profile →]  (optional, no pressure)
```

### Verification Is Built Into the Flow

The endorsement request link IS the verification. No extra step needed:

- **Email request:** Mike clicks the unique token link in the email → email is verified by the click
- **WhatsApp request:** Mike taps the unique token link in WhatsApp → phone number is verified by the tap
- **Shareable link:** No contact verification — these are open links. Ghost profiles from shareable links require email/phone entry + a verification step before the profile is created.

The token proves identity: only the person who received the message at that contact method can access it. This can't be gamed because:
- Tokens are single-use and tied to a specific recipient contact
- You can only write an endorsement through a valid, unexpired token
- The ghost profile's verified contact comes from the token, not user input

### Claiming the Account

When a ghost user wants to claim their profile:

1. They click "Claim my profile" (from the thank you page, an email nudge, or the reserved profile page)
2. **No additional verification needed** — their email/phone was already verified when they clicked the endorsement token link
3. `auth.users` record created with the verified email → linked to existing `users` record
4. They set a password (optional — could stay passwordless with magic links)
5. `account_status` changes from `'ghost'` to `'active'`
6. They see their profile with: name, role, endorsements written, yacht connections
7. Lightweight "complete your profile" flow (add photo, bio, certs) — but they already have meaningful content

### Nudge Emails

After a ghost profile is created, periodic gentle nudges:

- **Day 1:** "Your endorsement for {name} is live! Claim your profile to see who's endorsed you."
- **Day 7:** "3 people have viewed your profile this week. Claim it to see who."
- **Day 30:** "You've written 2 endorsements on YachtieLink. Your crew network is growing — claim your profile to unlock it."

## Schema Changes

```sql
-- Add account_status to users table
ALTER TABLE users ADD COLUMN account_status text DEFAULT 'active'
  CHECK (account_status IN ('active', 'ghost', 'claimed'));

-- Ghost users have no auth.users record
-- When claimed: auth.users created, account_status → 'active'
-- The users.id for ghost profiles is a regular UUID (not from auth.users)
-- On claim: users.id is updated to match the new auth.users.id
--   OR: auth.users.id is set to match the existing users.id (if Supabase allows)
```

## Key Decisions Needed

1. **Identity mapping:** Ghost users have a `users.id` but no `auth.users.id`. On claim, do we:
   - Update `users.id` to match the new `auth.users.id`? (cascading FK updates needed)
   - Or create `auth.users` with a specific ID matching the existing `users.id`? (cleaner if Supabase supports it)

2. **Visibility:** Are ghost profiles publicly visible? Options:
   - Yes, minimal (name + endorsements written) — builds their presence
   - No, hidden until claimed — simpler but less viral
   - Semi-visible: shown as endorser on other profiles but no standalone profile page

3. **Duplicate handling:** What if the ghost's email matches an existing active account?
   - Merge: attach the endorsement to the existing account
   - Prompt: "It looks like you already have an account. Log in to add this endorsement."

4. **GDPR:** Ghost profiles contain PII (name, email). Need:
   - Clear consent during endorsement submission ("We'll create a profile for you")
   - Easy deletion if they don't want a profile
   - Data retention policy for unclaimed ghost profiles

## Relationship to CV Parse Sprint

The CV parse sprint extracts references with contact details. Those references become endorsement requests. If the reference responds, this ghost profile system creates their account automatically. The chain:

```
CV Upload → AI extracts references → Endorsement requests sent
    → Reference responds → Ghost profile created → Claim nudges
    → Captain claims profile → Full account with endorsements
```

This is the complete viral loop: one crew member's CV upload can bring 3-10 new users to the platform, each with real content from day one.

## Implementation Estimate

This is a major sprint — probably 2-3 days of focused work:
- Schema changes + migration
- Non-authenticated endorsement flow (new page, no auth required)
- Ghost profile creation logic
- Claim flow (magic link → auth.users creation → account linking)
- Nudge email system (3 templates + cron job)
- Duplicate detection + merge logic
- GDPR compliance (consent, deletion, retention)
