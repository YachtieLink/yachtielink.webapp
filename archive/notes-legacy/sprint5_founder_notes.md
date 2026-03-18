# Sprint 5 — Founder Notes

## Session Handover Status (updated 2026-03-14)

### ✅ COMPLETE — Tasks 1-3
All foundation work is done and on `feat/sprint-5`. Build passes.

**Before starting Tasks 4-6, you MUST:**
1. Apply migration `supabase/migrations/20260314000012_sprint5_endorsements.sql` to production via Supabase SQL editor
2. Merge `feat/sprint-4` → `main` if not already done

### 🔧 Key implementation notes for Tasks 4-6

**Naming gotcha (critical — don't get this wrong):**
- `endorsement_requests.requester_id` = the person who WANTS the endorsement = eventual `endorsements.recipient_id`
- Person clicking `/r/:token` = the endorser = `endorsements.endorser_id`

**API shapes already built:**
- POST `/api/endorsement-requests` → `{ ok, token, deep_link }` (now returns token)
- GET `/api/endorsement-requests/:token` — pass the raw hex token as the URL param (same `[id]` route, GET detects it's a token)
- PUT `/api/endorsement-requests/:id` — pass the UUID record id, body `{ action: 'cancel' | 'resend' }`
- POST `/api/endorsements` → body: `{ recipient_id, yacht_id, content, endorser_role_label?, recipient_role_label?, worked_together_start?, worked_together_end?, request_token? }`
- GET `/api/endorsements?user_id=...` → `{ endorsements }` array with nested endorser + yacht
- PUT `/api/endorsements/:id` → partial update (content, roles, dates)
- DELETE `/api/endorsements/:id` → 204, soft-delete

**Components built:**
- `<WriteEndorsementForm>` — use this in Task 6 edit page. Pass `existingEndorsement` prop for edit mode.
- `<DeepLinkFlow>` — used only by `/r/[token]` page

**Pattern reminders for Tasks 4-6:**
- Toast: `const { toast } = useToast()` from `@/components/ui/Toast` — call as `toast('msg', 'success'|'error')`
- Server components fetch data; client components handle interaction
- `const supabase = await createClient()` in server components
- `params` is a Promise in Next.js 16: `const { id } = await params`

**Task 4 — request page route:** `/app/endorsement/request?yacht_id=...`
- Read `yacht_id` from `searchParams` (NOT `params` — it's a query param, not a segment)
- Use `get_colleagues` RPC filtered by yacht to show suggestions
- Rate limit: call `endorsement_requests_today` RPC + check `users.subscription_status`

**Task 5 — Audience tab data fetching:**
- Use parallel Promise.all for all 5 queries (see spec below)
- Expiry check: `new Date(request.expires_at) < new Date()` — done client-side
- Wheel B count: `endorsementsReceived.length` capped at 5

**Task 6 — edit page:**
- Route: `/app/endorsement/[id]/edit`
- Fetch endorsement by id, must be endorser
- Render `<WriteEndorsementForm existingEndorsement={...} />`

---


Context
Sprint 5 is the growth loop sprint. The /r/:token deep link flow is explicitly called out as a critical path item in yl_build_plan.md. If this flow is clunky, the graph doesn't compound.
What exists today (Sprints 1-4):

Full auth + onboarding flow (email/password, 6-step wizard)
Profile management (photo, bio, certs, contact info)
Yacht entities with creation, detail view, cover photo, duplicate detection
Attachment management (add/edit/delete work history)
Colleague graph derivation via get_colleagues() RPC
Endorsement request API (POST /api/endorsement-requests) — sends emails via Resend
Audience tab with basic colleague list and "Endorse" button stubs
Stub pages at /r/[token] and /u/[handle]
DB tables: endorsements, endorsement_requests with full RLS
DB functions: are_coworkers(), are_coworkers_on_yacht(), get_colleagues()
Two-pipeline email infra (Resend): lib/email/notify.ts

What Sprint 5 delivers:
Full endorsement loop: request → colleague receives link → adds yacht if needed → writes endorsement → it appears on requester's profile. Plus inbox management and email notifications.

Implementation Order (6 task groups, strictly sequential)
Sonnet should execute these in order. Each group depends on the previous.

TASK 1: Database Migration + API Routes (foundation)
Why first: Every UI page depends on these API contracts existing.
1A. Migration: supabase/migrations/20260314000012_sprint5_endorsements.sql
The existing schema is nearly complete. This migration adds:
sql-- 1. Add recipient_phone to endorsement_requests (nullable, for phone-based request tracking)
ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS recipient_phone text;

-- 2. Add cancelled_at to endorsement_requests (for cancel action)
ALTER TABLE public.endorsement_requests
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- 3. Create function to count today's endorsement requests for rate limiting
CREATE OR REPLACE FUNCTION public.endorsement_requests_today(p_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM public.endorsement_requests
  WHERE requester_id = p_user_id
    AND created_at > now() - interval '1 day'
    AND cancelled_at IS NULL;
$$;

-- 4. Grant execute on new function
GRANT EXECUTE ON FUNCTION public.endorsement_requests_today(uuid) TO authenticated;

-- 5. Update endorsement_requests RLS: allow recipient to read requests where
--    their email matches OR their user_id matches recipient_user_id
--    (Need to check if this already exists — it should from migration 000005)

-- 6. Add index for token lookups (critical for deep link performance)
CREATE INDEX IF NOT EXISTS idx_endorsement_requests_token
  ON public.endorsement_requests(token);

-- 7. Add index for recipient lookups
CREATE INDEX IF NOT EXISTS idx_endorsement_requests_recipient_email
  ON public.endorsement_requests(recipient_email);

-- 8. Add index for endorsements by recipient (for profile display)
CREATE INDEX IF NOT EXISTS idx_endorsements_recipient_not_deleted
  ON public.endorsements(recipient_id)
  WHERE deleted_at IS NULL;
```

**Apply to production** using `~/bin/supabase db push` or SQL Editor.

#### 1B. API Route: `app/api/endorsement-requests/[token]/route.ts` — GET

Purpose: Load an endorsement request by its token (for the deep link flow).
```
GET /api/endorsement-requests/:token
→ Returns: { request, yacht, requester } or 404
Implementation:

Use server Supabase client (no auth required for reading by token — the token IS the auth)
Query endorsement_requests by token
Join yachts for yacht details
Join users (requester) for display name
Check expires_at — if expired, return { expired: true } with request details still visible
Check status — if cancelled, return 410 Gone
Do NOT require auth for this endpoint (the token is the secret)

Pattern to follow: app/api/endorsement-requests/route.ts (existing POST handler)
1C. API Route: app/api/endorsements/route.ts — POST + GET
POST /api/endorsements — Create endorsement
Request body:
ts{
  recipient_id: string       // UUID
  yacht_id: string           // UUID
  content: string            // 10-2000 chars
  endorser_role_label?: string
  recipient_role_label?: string
  worked_together_start?: string  // ISO date
  worked_together_end?: string    // ISO date
  request_token?: string     // if responding to a request, update its status
}
Implementation:

Auth required — get endorser_id from session
Validate content length (10-2000 chars) — return 400 if invalid
Call are_coworkers_on_yacht(endorser_id, recipient_id, yacht_id) — return 403 if false
Insert into endorsements table
If request_token provided:

Update endorsement_requests set status = 'accepted', accepted_at = now(), recipient_user_id = endorser_id


Send notification email to recipient (non-fatal — wrap in try/catch):

Use sendNotifyEmail from lib/email/notify.ts
Subject: "[Name] endorsed you on YachtieLink"
Body: endorser name, yacht name, excerpt of endorsement text, CTA link to /app/audience


Return the created endorsement

Edge case — unique constraint violation: If (endorser_id, recipient_id, yacht_id) already exists (and not soft-deleted), return 409 Conflict with message "You've already endorsed this person for this yacht."
Edge case — endorser === recipient: Return 400. You can't endorse yourself.
GET /api/endorsements?user_id=... — List endorsements for a user

Returns endorsements where recipient_id = user_id and deleted_at IS NULL
Joined with endorser users for display name + photo
Joined with yachts for yacht name
Ordered by created_at DESC
No auth required (endorsements are public read per RLS)

1D. API Route: app/api/endorsements/[id]/route.ts — PUT + DELETE
PUT — Edit own endorsement

Auth required, must be endorser
Can update: content, endorser_role_label, recipient_role_label, worked_together_start, worked_together_end
Validate content length
Return updated endorsement

DELETE — Soft-delete own endorsement

Auth required, must be endorser
Set deleted_at = now() (not hard delete)
Return 204

1E. API Route: Update endorsement request status
Extend app/api/endorsement-requests/route.ts or create app/api/endorsement-requests/[id]/route.ts:
PUT /api/endorsement-requests/:id — Cancel or resend

Auth required, must be requester
Actions:

cancel: set status = 'cancelled', cancelled_at = now()
resend: check rate limit, resend email, don't create new record (reuse token)


Return updated request

1F. Update existing POST /api/endorsement-requests to support rate limiting
Modify app/api/endorsement-requests/route.ts:

Before creating request, call endorsement_requests_today(user_id)
Check against limit: 10 for free, 20 for Pro (check users.subscription_status)
If over limit, return 429 with { limit: N, used: N, resets_at: ISO timestamp }
Accept optional recipient_phone field (store on request, but don't send SMS)
Return the generated token in the response so the UI can construct the shareable deep link


TASK 2: Write Endorsement Form (reusable component)
Why second: The deep link flow and the direct endorsement flow both need this component.
2A. Component: components/endorsement/WriteEndorsementForm.tsx
Props:
tsinterface WriteEndorsementFormProps {
  recipientId: string
  recipientName: string
  yachtId: string
  yachtName: string
  requestToken?: string        // if responding to a request
  prefillEndorserRole?: string  // from attachment data
  prefillRecipientRole?: string
  prefillStartDate?: string
  prefillEndDate?: string
  existingEndorsement?: {      // for edit mode
    id: string
    content: string
    endorser_role_label?: string
    recipient_role_label?: string
    worked_together_start?: string
    worked_together_end?: string
  }
  onSuccess: () => void
}
UI (follow UX spec Screen E4):

Header: "Endorse [Name] from [Yacht]"
Read-only card showing yacht name + recipient name
Text area: "Write your endorsement" (10-2000 chars)

Character counter (bottom right): "X / 2000"
Minimum indicator: show "10 characters minimum" hint until met


Collapsible "Add details" section (optional structured fields):

Your role (text input, prefilled if available)
Their role (text input, prefilled if available)
Dates worked together: start + end date pickers (prefilled if available)


Primary CTA: "Submit Endorsement" (or "Save Changes" in edit mode)
Loading state on submit
Success state: "Endorsement sent." with CTA back to Audience tab
Error states: network error, already endorsed (409), not coworkers (403)

API call: POST /api/endorsements (or PUT /api/endorsements/:id for edit)
Pattern to follow: app/(protected)/app/about/edit/page.tsx for the full-screen editor pattern, components/ui/Input.tsx for form fields.

TASK 3: Deep Link Flow (/r/:token) — THE CRITICAL PATH
Why this is hard: Multi-step conditional flow that must handle 4 states gracefully. This is where Sonnet needs the most explicit guidance.
3A. Rewrite app/(public)/r/[token]/page.tsx
This is a server component that:

Calls GET /api/endorsement-requests/:token to load the request
If not found → show 404 page
If expired → show "This endorsement request has expired" with CTA to sign up anyway
If cancelled → show "This request was cancelled"
If valid → render the DeepLinkFlow client component with request data

CRITICAL: Auth handling for the deep link.
The middleware currently does NOT protect /r/ routes (they're public). The page must:

Check auth state on the server side using createClient() from lib/supabase/server.ts
If NOT authenticated: render a page that shows the request details (requester name, yacht) with a CTA "Sign in to write an endorsement" that links to /login?returnTo=/r/:token or /signup?returnTo=/r/:token
If authenticated: render the DeepLinkFlow component

Middleware change needed in middleware.ts:
Add returnTo query param support to the auth flow:

When redirecting from protected routes to /welcome, preserve returnTo
After login/signup, redirect to returnTo instead of /app/profile

Changes to app/(auth)/login/page.tsx and app/(auth)/signup/page.tsx:

Read returnTo from search params
After successful auth, redirect to returnTo if present, else /app/profile
Pass returnTo through to the auth callback

Changes to app/auth/callback/route.ts:

Accept returnTo in the next param (already uses next — verify it works)

3B. Component: components/endorsement/DeepLinkFlow.tsx
Client component that manages the multi-step flow:
tsinterface DeepLinkFlowProps {
  request: {
    id: string
    token: string
    requester_id: string
    yacht_id: string
    recipient_email: string
    status: string
    expires_at: string
  }
  requester: { display_name: string, profile_photo_url?: string }
  yacht: { id: string, name: string, yacht_type: string, length_m?: number, flag_state?: string, year_built?: number }
  currentUserId: string
}
```

**State machine (3 steps):**
```
Step 1: Request Details
  → Check: does current user have an attachment to this yacht?
    → YES: go to Step 3 (Write Endorsement)
    → NO: go to Step 2 (Add Yacht)

Step 2: Add Yacht (pre-filled)
  → Yacht name: read-only (locked from request)
  → Yacht details (type, length, flag, year): read-only if already set
  → Role on yacht: required input (text input or typeahead from roles list)
  → Dates: start (required), end or "Currently"
  → CTA: "Confirm Yacht" → creates attachment → go to Step 3
  → Secondary: "Decline" → navigate away

Step 3: Write Endorsement
  → Render <WriteEndorsementForm> with:
    - recipientId = request.requester_id (the person who REQUESTED is the RECIPIENT of the endorsement)
    - yachtId = request.yacht_id
    - requestToken = request.token
    - Prefill role/dates from the attachment just created (Step 2) or existing attachment
  → onSuccess: redirect to /app/audience
CRITICAL GOTCHA for Sonnet: The requester_id on the endorsement_request is the person who WANTS the endorsement. So:

endorsement_requests.requester_id = the person being endorsed (recipient of endorsement)
The person clicking the deep link = the endorser
endorsements.endorser_id = current user (the person writing)
endorsements.recipient_id = request.requester_id

This naming is counterintuitive. Make sure Sonnet gets it right.
Attachment check: Query attachments where user_id = currentUserId and yacht_id = request.yacht_id and deleted_at IS NULL. If exists → skip to write. If not → show add yacht step.
Attachment creation in Step 2: Call existing attachment creation logic. Look at how app/(protected)/app/attachment/new/page.tsx does it and reuse the same Supabase insert pattern.
Pattern to follow: The onboarding Wizard.tsx step machine pattern — state variable tracking current step, conditional rendering.
3C. Decline action
When a user clicks "Decline" on a request:

No API call needed (the request just stays pending and eventually expires)
Navigate to /app/profile with a toast "Request declined"
Optional: if we want to track declines, add a declined_at column later. Not needed for Sprint 5.


TASK 4: Request Endorsement UI
4A. Page: app/(protected)/app/endorsement/request/page.tsx
Route: /app/endorsement/request?yacht_id=...
Implementation:

Read yacht_id from search params (required — redirect to /app/audience if missing)
Fetch yacht details from Supabase
Fetch colleagues for this yacht using get_colleagues() filtered to this yacht
Fetch today's request count via endorsement_requests_today() for rate limit display
Fetch user's subscription status to determine limit (10 free / 20 Pro)

UI (follow UX spec Screen E1):

Yacht card at top (read-only): name, type, photo if exists
Suggested colleagues section: list of users who share this yacht attachment

Each row: name, role on yacht, "Request" button
Already-requested colleagues: show status pill (Pending/Accepted/Expired) instead of button
Skip users who have already endorsed you for this yacht


Manual add section:

Toggle between Email / Phone input
Email input: validates email format
Phone input: basic phone format
"Add" button → adds to chips list below
Chips: removable, show email/phone


Rate limit display: "X/10 requests remaining today" (or X/20 for Pro)
Shareable link section:

After sending at least one request, show "Or share a link" with copy button
Generate link: https://yachtie.link/r/{token}
Toast on copy: "Link copied"


Primary CTA: "Send Requests" (disabled until >= 1 recipient selected/added)
Loading + success states

API calls:

For each recipient: POST /api/endorsement-requests with { yacht_id, recipient_email or recipient_phone, yacht_name }
Show results: "Sent to X colleagues" with any failures noted

4B. Wire up the "Request endorsements" buttons
Update these existing pages to link to the new request page:

app/(protected)/app/audience/page.tsx — the "Endorse" button next to each colleague should become contextual:

If they've endorsed you on a shared yacht → "Endorsed" (no action)
If not → "Request" → links to /app/endorsement/request?yacht_id=...


components/profile/YachtsSection.tsx — the "Request endorsements" action in the yacht expand view should link to /app/endorsement/request?yacht_id=...
components/profile/EndorsementsSection.tsx — if empty state, CTA should link to request page for most recent yacht


TASK 5: Audience Tab Rewrite
5A. Rewrite app/(protected)/app/audience/page.tsx
The current page has basic colleague list. Rewrite to match UX spec Screens A0-A2.
Layout:

Wheel B card at top:

Count endorsements received (non-deleted)
Display as min(count, 5)/5
Tap → "Get endorsements" bottom sheet
Sheet content: "Endorsements add context to your work history."
Sheet CTA: "Request endorsements" → links to /app/endorsement/request?yacht_id={most_recent_yacht}


Segment control (tab toggle): Endorsements | Colleagues
Endorsements segment (Screen A1):

Requests received section:

Query: endorsement_requests where recipient_user_id = currentUser OR recipient_email = currentUser.email
Filter: non-cancelled, ordered by created_at DESC
Row: requester name, yacht name, date, status pill
If status = 'pending' and not expired: CTA "Write Endorsement" → /r/:token
If expired: grey status pill "Expired"
If accepted: green status pill "Completed"


Requests sent section:

Query: endorsement_requests where requester_id = currentUser
Row: recipient (email or name if user exists), yacht, status (Pending/Accepted/Expired/Cancelled)
Actions per row:

Pending: "Resend" (calls PUT with action=resend) + "Cancel" (calls PUT with action=cancel)
Expired: "Resend" (creates new request with same details)
Accepted: no actions
Cancelled: no actions (or hide)




Empty state: "No endorsement requests yet." CTA: "Request endorsements"


Colleagues segment (Screen A2):

Keep existing colleague list but enhance:
Row: name, photo, shared yacht(s), role
CTA per colleague: contextual

"Write Endorsement" if you share a yacht and haven't endorsed them yet
"Request Endorsement" if you share a yacht and they haven't endorsed you yet
"Endorsed" / "Received" status if already done





5B. Data fetching strategy
This page needs multiple queries. Use parallel fetching in the server component:
tsconst [
  { data: colleagues },
  { data: endorsementsReceived },
  { data: requestsReceived },
  { data: requestsSent },
  { data: endorsementsGiven },
] = await Promise.all([
  supabase.rpc('get_colleagues', { p_user_id: userId }),
  supabase.from('endorsements').select('*, endorser:users!endorser_id(display_name, profile_photo_url), yacht:yachts!yacht_id(name)').eq('recipient_id', userId).is('deleted_at', null).order('created_at', { ascending: false }),
  supabase.from('endorsement_requests').select('*, requester:users!requester_id(display_name, profile_photo_url), yacht:yachts!yacht_id(name)').or(`recipient_user_id.eq.${userId},recipient_email.eq.${userEmail}`).is('cancelled_at', null).order('created_at', { ascending: false }),
  supabase.from('endorsement_requests').select('*, yacht:yachts!yacht_id(name)').eq('requester_id', userId).order('created_at', { ascending: false }),
  supabase.from('endorsements').select('recipient_id, yacht_id').eq('endorser_id', userId).is('deleted_at', null),
]);
Compute expiry status client-side: new Date(request.expires_at) < new Date() → "Expired"

TASK 6: Endorsement Edit/Delete + Email Notifications
6A. Page: app/(protected)/app/endorsement/[id]/edit/page.tsx

Fetch endorsement by ID (must be endorser)
Render <WriteEndorsementForm> in edit mode with existingEndorsement prop
Add "Delete Endorsement" destructive button at bottom
Delete confirmation via bottom sheet: "This will remove your endorsement. Are you sure?"
On delete: DELETE /api/endorsements/:id → redirect to /app/audience with toast

6B. Endorsement received email template
Add to lib/email/notify.ts:
tsexport async function sendEndorsementReceivedEmail(params: {
  to: string
  endorserName: string
  yachtName: string
  excerpt: string  // first 100 chars of endorsement content
}) {
  // Follow same pattern as existing sendNotifyEmail
  // Subject: "[endorserName] endorsed you on YachtieLink"
  // Body: "[endorserName] wrote an endorsement for your time on [yachtName]:"
  //        "[excerpt]..."
  //        CTA button: "View Endorsement" → https://yachtie.link/app/audience
}
Wire this into the POST /api/endorsements handler (Task 1C) — called after successful insert, wrapped in try/catch (non-fatal).
6C. Wire endorsement display on profile
Update components/profile/EndorsementsSection.tsx:

Currently shows endorsements received
Add: if the endorsement was written by the current user (when viewing own profile in context), show "Edit" action
Add link to /app/endorsement/:id/edit for own endorsements


File Change Summary
New files (13):
FilePurposesupabase/migrations/20260314000012_sprint5_endorsements.sqlSchema additionsapp/api/endorsement-requests/[token]/route.tsGET request by tokenapp/api/endorsements/route.tsPOST create + GET listapp/api/endorsements/[id]/route.tsPUT edit + DELETE soft-deleteapp/api/endorsement-requests/[id]/route.tsPUT cancel/resendcomponents/endorsement/WriteEndorsementForm.tsxReusable write/edit formcomponents/endorsement/DeepLinkFlow.tsxMulti-step deep link state machineapp/(protected)/app/endorsement/request/page.tsxRequest endorsement UIapp/(protected)/app/endorsement/[id]/edit/page.tsxEdit/delete endorsement
Modified files (7):
FileChangeapp/(public)/r/[token]/page.tsxRewrite from stub → full deep link pageapp/(protected)/app/audience/page.tsxMajor rewrite: Wheel B, inbox, segmentsapp/api/endorsement-requests/route.tsAdd rate limiting + return tokenmiddleware.tsAdd returnTo query param supportapp/(auth)/login/page.tsxHandle returnTo redirectapp/(auth)/signup/page.tsxHandle returnTo redirectlib/email/notify.tsAdd endorsement received email templatecomponents/profile/EndorsementsSection.tsxAdd edit links for own endorsementscomponents/profile/YachtsSection.tsxWire request endorsement link

Key Constraints for Sonnet

No any types. TypeScript strict mode. Define interfaces for all API request/response shapes.
Follow existing patterns:

Server components for pages that fetch data
Client components (with 'use client') only for interactive elements
Supabase client from lib/supabase/server.ts in server components
Supabase client from lib/supabase/client.ts in client components
Toast notifications via useToast from components/ui/Toast.tsx
Bottom sheets via BottomSheet from components/ui/BottomSheet.tsx


RLS does the heavy lifting. The DB already has RLS policies on endorsements and endorsement_requests. The API routes add business logic validation (rate limits, coworker checks) on top.
Email is non-fatal. All email sends must be wrapped in try/catch. If Resend fails, the action still succeeds. Log the error.
Endorsement request naming is counterintuitive:

endorsement_requests.requester_id = the person who WANTS to be endorsed (the eventual endorsements.recipient_id)
The person clicking /r/:token = the endorser (the eventual endorsements.endorser_id)


No upsell in endorsement flows. UX spec Section 13 explicitly forbids upsell inside endorsement request/write flows.
Soft deletes only. endorsements.deleted_at — never hard delete. Retraction tracking happens automatically via the deleted_at timestamp.
Dark mode. All new components must work in both light and dark mode. Use CSS custom properties from app/globals.css, not hardcoded colours.


Verification Plan
After implementation, test this end-to-end flow:

User A (logged in) goes to Profile → Yachts → picks a yacht → "Request endorsements"
Request page loads with yacht fixed at top, colleagues listed
User A adds an email manually, sends request
Check: email arrives with deep link /r/:token
User B (logged out) clicks the deep link
Deep link page shows request details + "Sign in to endorse"
User B signs up → redirected back to /r/:token
If User B is NOT attached to the yacht → "Add yacht" step (pre-filled, locked name)
User B fills in role + dates → confirms yacht → moves to write step
User B writes endorsement (10+ chars) → submits
Check: endorsement appears on User A's profile
Check: User A receives "Someone endorsed you" email
Check: Audience tab shows updated Wheel B count
Check: Audience tab Endorsements segment shows the request as "Completed"
User B can edit their endorsement from the Audience tab
User B can soft-delete their endorsement

Also test edge cases:

Expired request (>30 days) → shows expired state
Duplicate endorsement attempt → 409 error with clear message
Rate limit exceeded → 429 with remaining count
Self-endorsement attempt → 400 error
User already attached to yacht → skips add-yacht step