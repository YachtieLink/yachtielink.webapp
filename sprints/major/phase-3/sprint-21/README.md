# Sprint 21 — Messaging & Contacts

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 3
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 20 (agency plans, NLP search, profile embeddings) — crossing Phase 2 → Phase 3 boundary. Also builds on Phase 3 README (design principles: communication not engagement, revocable participation).

## Goal

Give crew a way to communicate directly within the platform. Until now, crew coordinate via WhatsApp, email, or phone — contact methods exposed through availability settings (Sprint 14) or profile fields. Sprint 21 introduces a contact relationship model and direct messaging so crew can stay in touch without leaving YachtieLink. The critical constraint: contacts are explicitly non-graph (D-029). Adding someone as a contact does not create a colleague edge, does not enable endorsements, and does not affect trust. Contacts exist for messaging and limited timeline visibility (Sprint 23) only. This separation is constitutional — it protects the graph from being diluted by social connections that don't represent shared professional experience.

## Scope

**In:**
- Contact relationship model: mutual-confirmation contact requests between crew
- Contact request flow: send request → recipient accepts/declines → mutual contact established
- Contact list: `/app/contacts` — list of contacts with search/filter
- Direct messaging between contacts: 1:1 text conversations
- Message infrastructure: real-time delivery via Supabase Realtime (WebSocket subscriptions)
- Conversation list: `/app/messages` — list of conversations sorted by most recent message
- Conversation view: `/app/messages/[conversation_id]` — message thread with text input
- Unread count badge on messages tab in navigation
- Block and report: block a contact (removes contact, prevents re-request), report a conversation
- Contact removal: either party can remove the contact at any time (removes messaging access)
- Entry points for contact requests: profile pages, colleague explorer, yacht detail crew cards, position applicant cards

**Out:**
- Group messaging (future — 1:1 only for V1)
- Media/image sharing in messages (text only for V1)
- Read receipts, typing indicators, online status (Phase 3 design principle: communication not engagement)
- Message search (future — keep it simple)
- Recruiter-to-crew messaging (recruiters use unlocked contact methods from Sprint 19, not in-app messaging)
- Contact import from phone contacts (requires native app — deferred)
- Message reactions or emoji responses (future)
- Voice or video calls (far future — not a communication platform)
- Message encryption beyond transport (Supabase uses TLS; E2E encryption is overengineering for V1)
- AI-powered message suggestions or auto-reply

## Dependencies

- Sprint 20 complete: Phase 2 delivered, platform has active user base with colleague relationships
- `users` table — exists from Sprint 2
- `get_colleagues()` RPC from Sprint 4/12 (suggest contacts from colleague graph)
- `get_graph_proximity()` RPC from Sprint 18 (display relationship context on contact requests)
- Supabase Realtime — available on current Supabase plan (verify WebSocket subscription support)
- Resend email infrastructure from Sprint 5/8 (contact request notification emails)
- AI content moderation from Sprint 16's `lib/ai/` (moderate message content)
- PostHog from Sprint 8 (messaging event tracking)
- Notification preferences from Sprint 15 (respect user's email notification settings)

## Key Deliverables

### Contact Relationship Model

- ⬜ `contacts` table:
  - `id` uuid PK
  - `requester_id` uuid FK → users
  - `recipient_id` uuid FK → users
  - `status` text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'))
  - `created_at` timestamptz DEFAULT now()
  - `accepted_at` timestamptz
- ⬜ Unique constraint: `contacts(LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id))` — one contact relationship per pair, regardless of who initiated
- ⬜ RLS: users can read contacts where they are requester or recipient; can update status on contacts where they are recipient
- ⬜ Contact is non-graph (D-029): no changes to `get_colleagues()`, `are_coworkers_on_yacht()`, or any endorsement eligibility check. Contacts exist in a completely separate table with no foreign keys to graph tables (attachments, endorsements, etc.)

### Contact Request Flow

- ⬜ "Add contact" button on:
  - Profile pages (both app and public profile)
  - Colleague explorer cards (Sprint 12)
  - Yacht detail crew cards (Sprint 12)
  - Position applicant cards (Sprint 18)
- ⬜ Request sends: creates `contacts` record with status `pending`
- ⬜ Recipient notification: email via Resend + in-app indicator (Sprint 22 builds the full notification system — for Sprint 21, use a badge on the contacts page)
- ⬜ Recipient actions: "Accept" (status → `accepted`, `accepted_at` set) or "Decline" (status → `declined`)
- ⬜ Declined requests: requester sees "Request sent" state (not told it was declined — reduces social pressure). Can re-request after 30 days.
- ⬜ Cancel: requester can cancel a pending request
- ⬜ Graph context on request: show `get_graph_proximity()` result — "Colleague from M/Y Horizon" or "2nd degree via Chief Stew Maria" helps recipient decide
- ⬜ Contact suggestions: show colleagues (from `get_colleagues()`) who aren't yet contacts, with "Add contact" action

### Contact List — `/app/contacts`

- ⬜ List of accepted contacts: photo, name, role, last message preview (if conversation exists)
- ⬜ Pending requests section: incoming requests with Accept/Decline, outgoing requests with Cancel
- ⬜ Search within contacts: filter by name
- ⬜ Tap contact → navigate to conversation or profile
- ⬜ Contact count in header

### Messaging Infrastructure

- ⬜ `conversations` table:
  - `id` uuid PK
  - `participant_1` uuid FK → users
  - `participant_2` uuid FK → users
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now() (updated on each new message)
- ⬜ Unique constraint: `conversations(LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2))` — one conversation per pair
- ⬜ `messages` table:
  - `id` uuid PK
  - `conversation_id` uuid FK → conversations
  - `sender_id` uuid FK → users
  - `content` text NOT NULL (max 5000 chars)
  - `created_at` timestamptz DEFAULT now()
- ⬜ `conversation_participants` view or check: conversation only permitted between accepted contacts (enforce via RPC, not just RLS)
- ⬜ `send_message(p_conversation_id uuid, p_sender_id uuid, p_content text)` RPC:
  - Verify sender is a participant
  - Verify contact relationship is `accepted` (prevents messaging after block/removal)
  - AI content moderation check on message content (reuse Sprint 16 infrastructure)
  - Insert message
  - Update `conversations.updated_at`
  - Return created message
- ⬜ RLS: users can read messages in conversations they participate in; users can insert messages in conversations they participate in

### Real-Time Delivery

- ⬜ Supabase Realtime subscription on `messages` table filtered by `conversation_id`
- ⬜ On new message: push to active conversation view immediately (optimistic UI — show message before server confirms)
- ⬜ Conversation list subscription: listen for `conversations.updated_at` changes to re-sort conversation list
- ⬜ Unread tracking: `conversation_read_status` table:
  - `conversation_id` uuid FK
  - `user_id` uuid FK
  - `last_read_at` timestamptz
  - Primary key: `(conversation_id, user_id)`
- ⬜ Unread count: messages in conversation where `created_at > last_read_at` and `sender_id != user_id`
- ⬜ Mark as read: update `last_read_at` when user opens conversation
- ⬜ Total unread badge: sum of unread counts across all conversations → displayed on messages tab in nav

### Conversation List — `/app/messages`

- ⬜ List of conversations sorted by `updated_at` DESC (most recent message first)
- ⬜ Conversation preview: contact photo, name, last message snippet (truncated), timestamp, unread badge
- ⬜ Tap → navigate to conversation view
- ⬜ Empty state: "No messages yet. Add contacts to start conversations."
- ⬜ Accessible from bottom nav (new "Messages" tab) or sidebar

### Conversation View — `/app/messages/[conversation_id]`

- ⬜ Message bubbles: sender's messages right-aligned (coloured), recipient's left-aligned (grey)
- ⬜ Timestamps: grouped by day, individual timestamps on tap
- ⬜ Text input: fixed bottom bar with text field and send button
- ⬜ Auto-scroll to bottom on new messages
- ⬜ Load older messages on scroll up (pagination — 50 messages per page)
- ⬜ Contact header: name, photo, role, tap → profile
- ⬜ No read receipts, no typing indicator, no online status (Phase 3 design principle)
- ⬜ Menu: view profile, block contact, report conversation

### Block & Report

- ⬜ Block: sets contact status → `blocked`
- ⬜ Blocking removes the contact relationship and prevents future contact requests from the blocked user
- ⬜ Blocked user cannot see the blocker's profile in contact suggestions
- ⬜ Conversation is hidden from both parties (messages preserved in DB for moderation review if needed)
- ⬜ Report: flags conversation for admin review (logged to `moderation_reports` table with conversation_id, reporter_id, reason text)
- ⬜ Unblock: user can unblock from settings → blocked users list (does NOT re-establish the contact — a new request is needed)

### Contact Removal

- ⬜ Either party can remove a contact at any time (D-033: revocable participation)
- ⬜ Removal sets contact status to a terminal state and hides the conversation
- ⬜ The removed party is not notified (reduces social friction)
- ⬜ Re-request possible after removal (treated as a new contact request)

### Database Migration

- ⬜ `CREATE TABLE contacts (id uuid PK, requester_id uuid FK, recipient_id uuid FK, status text DEFAULT 'pending', created_at timestamptz DEFAULT now(), accepted_at timestamptz)`
- ⬜ Unique index: `contacts(LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id))`
- ⬜ Index: `contacts(recipient_id, status)` for pending request queries
- ⬜ `CREATE TABLE conversations (id uuid PK, participant_1 uuid FK, participant_2 uuid FK, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
- ⬜ Unique index: `conversations(LEAST(participant_1, participant_2), GREATEST(participant_1, participant_2))`
- ⬜ `CREATE TABLE messages (id uuid PK, conversation_id uuid FK, sender_id uuid FK, content text NOT NULL, created_at timestamptz DEFAULT now())`
- ⬜ Index: `messages(conversation_id, created_at)` for paginated message loading
- ⬜ `CREATE TABLE conversation_read_status (conversation_id uuid FK, user_id uuid FK, last_read_at timestamptz DEFAULT now(), PRIMARY KEY (conversation_id, user_id))`
- ⬜ `CREATE TABLE moderation_reports (id uuid PK, reporter_id uuid FK, conversation_id uuid FK, reason text, created_at timestamptz DEFAULT now())`
- ⬜ `send_message(p_conversation_id uuid, p_sender_id uuid, p_content text)` RPC
- ⬜ `get_unread_count(p_user_id uuid)` RPC — total unread across all conversations
- ⬜ RLS policies on all tables
- ⬜ Enable Supabase Realtime on `messages` and `conversations` tables
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `contact_request_sent` with graph_proximity level
- ⬜ `contact_request_accepted` / `contact_request_declined`
- ⬜ `contact_removed` / `contact_blocked`
- ⬜ `message_sent` with conversation_age_days (first message vs ongoing)
- ⬜ `conversation_opened` with unread_count
- ⬜ `moderation_report_submitted`

## Exit Criteria

- Contact requests: send, accept, decline flow works end-to-end
- Contacts are non-graph: adding a contact does not affect colleague count, endorsement eligibility, or graph proximity
- DMs: accepted contacts can exchange text messages in real-time
- Real-time: messages appear instantly via Supabase Realtime (no page refresh)
- Unread counts: accurate badge on messages tab, clears when conversation opened
- Conversation list sorted by most recent message
- Block removes contact and hides conversation; report flags for admin review
- Contact removal is instant and unnotified (revocable participation)
- Graph context shown on contact requests (colleague, 2nd degree, shared yacht)
- No read receipts, no typing indicators, no online status
- AI content moderation runs on messages
- All components work at 375px width (mobile-first)
- PostHog events firing for contact lifecycle and messaging
- Graph navigation preserved: contact cards link to profiles, conversation header links to profile

## Estimated Effort

8–10 days

## Notes

**Contacts ≠ colleagues is the most important architectural decision in this sprint (D-029).** The `contacts` table has zero foreign keys to `attachments`, `endorsements`, or any graph table. This is by design. A contact is "I want to message this person." A colleague is "I verifiably worked with this person on a yacht." These are fundamentally different relationships and must stay in separate systems. If a future developer tries to add endorsement eligibility based on contact status, the code review should catch it immediately.

**No read receipts is a crew-first decision.** In a hierarchical industry where captains have power over deckhands, read receipts create pressure to respond immediately. A deckhand who reads a captain's message and doesn't reply instantly shouldn't face consequences on-platform. The same logic applies to typing indicators and online status. Communication features should facilitate conversation, not surveillance.

**Declined requests are invisible to the requester.** Showing "declined" creates social awkwardness that doesn't serve anyone. The requester sees "Request sent" indefinitely. After 30 days, they can send a new request. This is a deliberate trade-off: slight confusion for the requester is better than social pressure on the recipient.

**Supabase Realtime is the right choice for V1.** It's built into the existing Supabase infrastructure, requires no additional services, and handles WebSocket subscriptions natively. At scale (10K+ concurrent users), Supabase Realtime may need to be supplemented with a dedicated WebSocket service (e.g., Ably, Pusher), but for Phase 3 the built-in solution is sufficient.

**Hardest technical challenge:** The unread count system must be efficient at scale. A naive approach (count all messages after `last_read_at` per conversation for every nav render) creates N+1 queries. The `get_unread_count()` RPC should use a single aggregate query across all conversations. Consider a denormalized `unread_count` column on `conversation_read_status` that's incremented on message insert and reset on read — this trades write cost for read performance, which is the right trade for a badge that renders on every page.

**Content moderation on messages.** Messages should run through the same AI moderation pipeline as endorsements and bios (Sprint 16). Block message sending if flagged. This is essential for a platform where power dynamics exist between captains and junior crew. The moderation prompt should be tuned for professional context — flagging threats, harassment, or coercion, not casual language.

**Next sprint picks up:** Sprint 22 introduces the in-app notification system (bell icon, notification list, push if native app available) and multilingual profile translation (AI-10). The notification system replaces email-only notifications with in-app delivery, and provides the infrastructure that Sprint 21's contact request notifications will use retroactively.
