# Ghost Profiles & Claimable Accounts

**Status:** Backlog — design complete, ready for sprint planning (2026-03-23)
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

## Delivery Waves

### Wave 1 — Ghost Profiles + Non-Auth Endorsement + Claim Flow
The core loop: someone gets a link, writes an endorsement without signing up, ghost profile is created, they can claim it later. Includes the signup shortcut flow and contact consolidation on claim.

### Wave 2 — Growth Amplifiers
- CV-parse auto-requests (wiring `ParsedReference[]` → endorsement requests)
- Nudge email system (3 templates + cron job)
- Name collision / fraud detection (fuzzy matching against real users on same yacht)
- Passive ghost recapture (when real users add contact info matching orphan ghosts, prompt to merge)

---

## Resolved Decisions (from design interview 2026-03-23)

### Data Model

1. **Separate table, not `users`.** Ghost profiles live in a dedicated `ghost_profiles` table. The `public.users.id` FK to `auth.users(id) ON DELETE CASCADE` means ghost profiles literally can't exist in the `users` table without an auth record. Separate table avoids touching that constraint and keeps ghost logic isolated from real user queries.

   ```sql
   CREATE TABLE ghost_profiles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     full_name TEXT NOT NULL,
     email TEXT,
     phone TEXT,
     primary_role TEXT,
     verified_via TEXT CHECK (verified_via IN ('email_token', 'whatsapp_token', 'unverified')),
     account_status TEXT DEFAULT 'ghost' CHECK (account_status IN ('ghost', 'claimed')),
     claimed_by UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ DEFAULT now()
   );

   CREATE UNIQUE INDEX ghost_profiles_email_key ON ghost_profiles(email) WHERE email IS NOT NULL;
   CREATE UNIQUE INDEX ghost_profiles_phone_key ON ghost_profiles(phone) WHERE phone IS NOT NULL;
   ```

2. **Dual nullable endorser columns.** Endorsements reference either a real user or a ghost, never both. CHECK constraint enforces exactly one is set.

   ```sql
   ALTER TABLE endorsements
     ALTER COLUMN endorser_id DROP NOT NULL,
     ADD COLUMN ghost_endorser_id UUID REFERENCES ghost_profiles(id),
     ADD CONSTRAINT endorser_exactly_one CHECK (
       (endorser_id IS NOT NULL AND ghost_endorser_id IS NULL) OR
       (endorser_id IS NULL AND ghost_endorser_id IS NOT NULL)
     );
   ```

   On claim: migrate endorsements by setting `endorser_id` to real user, nulling `ghost_endorser_id`.

3. **Endorsement requests: one new column.** Table already supports non-user recipients via nullable `recipient_email`/`recipient_phone`/`recipient_user_id`. Add `sent_via TEXT CHECK (sent_via IN ('email', 'whatsapp', 'shareable_link'))` — populated at request creation time, determines which contact method is verified and maps to `ghost_profiles.verified_via`. Also add `suggested_endorsements JSONB` for LLM-generated endorsement starters (populated at request creation from endorsee's parsed CV data).

4. **One ghost per unique contact method.** Unique partial indexes on email and phone independently. Same person reached via email and WhatsApp = two ghost profiles until claimed and merged. No cross-contact dedup at creation time — unreliable without verification. Consolidation happens at claim time.

5. **Passive ghost recapture (Wave 2).** When a real user adds a phone or email to their profile that matches an orphan ghost, prompt them to claim/merge.

### Authorization & Trust

6. **Ghost profiles are endorsement writers only.** They cannot send endorsement requests. Requesting endorsements requires a real account. Once they want their own endorsements, they sign up and become a real user — their ghost endorsements migrate to the new account.

7. **Coworker gate bypassed for ghost endorsements.** The `are_coworkers_on_yacht()` check is skipped when `ghost_endorser_id` is set. The endorsement request token is the trust mechanism — the real user vouched for the relationship by sending the request to a specific person about a specific yacht.

8. **Fraud prevention (Wave 1):**
   - API-level self-request blocking — `recipient_email`/`recipient_phone` cannot match the requester's contact info.
   - Ghost endorsements get a subtle visual distinction (no profile link, softer presentation). Not a scary "UNVERIFIED" badge, but clearly different from a fully-accounted endorsement.
   - Endorsement "upgrades" to full weight automatically when ghost claims account and has a matching yacht attachment.

9. **Name collision detection deferred to Wave 2.** Fuzzy matching against real users on same yacht, moderation queue.

### API Design

10. **Separate guest endorsement route: `POST /api/endorsements/guest`**. Isolated from the existing authenticated `/api/endorsements` endpoint so a bug in guest flow can't break the platform.

    ```
    POST /api/endorsements/guest
    Body: {
      token: string,           // endorsement request token (trust gate)
      content: string,         // endorsement text (10-2000 chars)
      endorser_name: string,   // what they enter
      endorser_role: string,   // their role on the yacht
      endorser_email?: string, // only for shareable links (not pre-verified)
    }
    ```

    - Validates token (exists, not expired, not accepted)
    - Runs `moderateText()` content check
    - Creates/reuses `ghost_profiles` row (matched by verified contact from token)
    - Creates endorsement with `ghost_endorser_id`, `endorser_id` null
    - Marks request as accepted
    - Rate limited by IP
    - No auth required

### UX Flows

11. **Three-option endorsement landing page on `/r/:token`.** All CTAs lead with "write endorsement" so no one picks the wrong path thinking they'll miss it.

    ```
    {name} asked you to endorse their work on {yacht}.
    It takes about two minutes.

    [Write endorsement]                      ← ghost flow (primary)
    [Write endorsement & create account]     ← signup, skip onboarding, redirect back
    [Sign in & write endorsement]            ← login, redirect back
    ```

    Currently this page exists at `app/(public)/r/[token]/page.tsx` and already handles token validation, expiry, and cancellation states. The unauthenticated block (lines 117-152) currently forces login — this gets replaced with the three-option layout.

12. **Ghost endorsement form (token-verified requests): 3 fields only.**
    - Your name (pre-filled from request metadata if available)
    - Your role on {yacht} (free text)
    - Your endorsement (textarea, 10-2000 chars)
    - No email field — contact already verified via token
    - Consent line: "We'll create a profile for you. You can claim or delete it anytime."

    Shareable link variant adds: email field + verification step before ghost creation.

    **Suggested endorsement starters:** 3-4 tappable snippets above the textarea, generated from the endorsee's parsed CV data. When the endorsement request is created, match the `yacht_id` to the endorsee's `employment_yacht` entry from their parsed CV and run a small LLM call to generate context-aware suggestions using role, yacht, period, and description. Stored as `suggested_endorsements JSONB` on the `endorsement_requests` row — ready when the ghost opens the form, not generated on the fly.

    Example (Deckhand, M/Y Eclipse, Med charter 2024):
    - "Excellent with tender ops and water sports — guests loved them during charter season on Eclipse."
    - "Dependable deckhand on Eclipse. Kept the deck in great shape across a busy Med season."
    - "Worked alongside them on Eclipse for the 2024 charter season. Professional and capable crew member."

    Ghost taps one to insert as starting point, encouraged to edit and add their own personal touch. Cursor lands at end of inserted text, subtle hint: "Add your personal touch." Fallback for no CV data: role-based templates ("Worked with {name} on {yacht}. Reliable and professional {role}.").

    **Authenticated endorsers get the same assist.** "Give me a hand writing this" button on the existing endorsement form. Same generation logic but richer context — we know both users' profiles, shared yacht, overlapping dates, respective roles. Generates a 2-3 sentence draft they can edit. Ships alongside ghost suggestions since it shares the same LLM call pattern.

13. **Signup shortcut flow.** If a ghost (or unauthenticated visitor) clicks "create account" from the endorsement page:
    - Auth via Supabase (password, Google, Apple) with `?next=/r/:token`
    - Bypass full onboarding (O1-O6 wizard) — land directly back on endorsement page
    - Write endorsement as a real user (normal `endorser_id`, no ghost created)
    - After submit: soft prompt "Finish setting up your profile whenever you're ready"
    - `deferred_onboarding` flag or similar so the app gently reminds later, doesn't hard-block

14. **Contact consolidation on claim/signup.** After authenticating (via email), auto-match ghost profiles by verified email. Then prompt: "We also found activity linked to +44 7700 900123. Is this you?" → verify via OTP → merge that ghost too. All ghost endorsements migrate to real account.

---

### UX Flows (continued)

15. **Ghost profile visibility: semi-visible (option 3).** Ghost endorser name appears on endorsee profiles. Clicking it leads to a "Claim this profile" landing page — not a full public profile. No standalone discoverability, no search engine indexing. Keeps GDPR surface small.

16. **Duplicate handling: redirect to login.** If the ghost's email matches an existing active user, the `/api/endorsements/guest` route catches this before ghost creation and returns a redirect signal. Frontend sends them to login with `?next=/r/:token` preserved. No ghost created.

17. **Token-to-contact extraction.** Guest route looks up the endorsement request by token → gets `recipient_email`/`recipient_phone` + `sent_via`. Populates `ghost_profiles.email` or `.phone` accordingly. `verified_via` set based on `sent_via` value.

18. **Thank you page.** Shows endorsement preview, warm "we've reserved a profile" message. Two equal-weight CTAs: "Claim my profile" and "Done" (redirects to marketing homepage). Not pushy — they just did someone a favour.

19. **Claim flow.** Ghost clicks "Claim my profile" (from thank you page, ghost landing page, or nudge email in Wave 2).
    - Shows verified email, auth options: set password, Google, or Apple. **No magic links.**
    - After auth: `auth.users` created → `public.users` row created → auto-match ghost by email → migrate endorsements (`ghost_endorser_id` → `endorser_id`) → contact consolidation prompt for other ghost profiles (OTP verify) → ghost marked `claimed`
    - **No onboarding wizard.** Land on profile with endorsements already populated.
    - Users can self-serve onboarding later by uploading a CV from the profile page, which triggers the existing profile population flow.

### GDPR & Compliance

20. **Consent at creation.** Clear "By submitting, you agree we'll create a profile for you" line directly above the submit button, linking to privacy policy. Not a checkbox — the endorsement submission is the intentional act.

21. **Deletion.** Manual request via email to support. No self-serve flow needed for Wave 1. Must action within 30 days per GDPR.

22. **Retention.** 12-month retention for unclaimed ghost profiles. After 12 months with no claim, auto-anonymize: endorsement text stays (valuable to endorsee), ghost PII scrubbed (name → "Former colleague", email/phone nulled). Auto-anonymization cron is Wave 2 but policy decided now so consent language can reference it.

### Edge Cases

23. **Token expiry mid-form.** Guest route validates token at submit time. If expired, returns error. Frontend shows "This link has expired. Ask {name} to send a new request."

24. **Double submission.** Guest route checks request status. If already `accepted`, returns error. Frontend shows "You've already submitted this endorsement" with link to claim flow.

---

## Design Interview Status

**Complete.** All Wave 1 branches resolved (2026-03-23). 24 decisions documented. Ready for sprint planning and build plan creation.

---

## Relationship to CV Parse Sprint

The CV parse sprint extracts references with contact details (`ParsedReference[]` with name, role, yacht_or_company, phone, email). Those references become endorsement requests. If the reference responds, this ghost profile system creates their account automatically. The chain:

```
CV Upload → AI extracts references → Endorsement requests sent (Wave 2)
    → Reference responds → Ghost profile created → Claim nudges (Wave 2)
    → Captain claims profile → Full account with endorsements
```

This is the complete viral loop: one crew member's CV upload can bring 3-10 new users to the platform, each with real content from day one.

## Implementation Estimate

### Wave 1 (core loop)
- Schema: `ghost_profiles` table + endorsements dual-column migration
- `POST /api/endorsements/guest` route
- `/r/:token` page rework (three-option layout + ghost form)
- Signup shortcut flow (onboarding bypass + redirect back)
- Claim flow (contact consolidation + endorsement migration)
- Ghost endorsement visual distinction in UI

### Wave 2 (growth amplifiers)
- CV-parse → auto endorsement requests pipeline
- Nudge email system (3 templates + cron)
- Name collision / fraud detection
- Passive ghost recapture on profile contact addition
