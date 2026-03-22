# Sprint 23 — Timeline & Community

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 3
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 22 (in-app notification system with central `createNotification()`, multilingual profile translation, Supabase Realtime notifications)

## Goal

Give crew a shared professional memory. The timeline surfaces career milestones (new yacht, new endorsement, new cert, position filled) and user-created posts within a network-bounded feed. IRL connections let crew who meet in person — at marinas, boat shows, port bars — create reality-bound graph edges without shared yacht history. Together, these features make YachtieLink feel like a living professional community rather than a static profile database. The constitutional guardrails are strict: the timeline is chronological only (D-031), visibility is bounded to the viewer's network (D-030), IRL connections require mutual confirmation (D-032), and anyone can remove themselves from any interaction at any time (D-033). Sprint 22's notification system delivers timeline activity to crew: "Your colleague started on M/Y Atlas", "Captain James confirmed your IRL connection."

## Scope

**In:**
- Timeline feed: `/app/timeline` — chronological reverse-order feed of network activity
- Auto-generated milestones: new yacht attachment, endorsement received, certification added, position posted/filled, profile created
- User-created posts: short text posts (max 1000 chars), optionally tagged to a yacht or location
- Timeline visibility: bounded to viewer's network — colleagues (shared yacht) + contacts (Sprint 21) (D-030)
- Strictly chronological ordering — no algorithm, no trending, no boosting (D-031)
- IRL connections: in-person encounter verification via mutual confirmation (D-028, D-032)
- IRL creates a graph edge: connected users appear in each other's network (extends colleague graph beyond employment)
- IRL visibility: public or private per the initiator's choice (D-032)
- Right of exit: any participant can remove themselves from a post or IRL connection at any time (D-033)
- Reactions on posts/milestones: simple acknowledgment (single reaction type — e.g., "wave" 👋 — not a like button)
- Post deletion: author can delete their own posts at any time
- Timeline entry points: bottom nav or sidebar, profile page (show user's own milestones)

**Out:**
- Photos/media in posts (text only for V1 — reduces moderation complexity)
- Comments on posts (future — reactions are sufficient for V1, comments risk turning the timeline into a feed)
- Hashtags or topics (no discovery mechanism — the timeline is bounded, not browsable by topic)
- Reposting or sharing posts outside the network (no virality — D-031)
- Follower/following model (the network is defined by colleagues + contacts, not by following)
- Post editing (delete and repost — keeps things simple)
- Timeline for recruiters (recruiters don't see the timeline — it's a crew-only space)
- IRL connection via QR code or NFC (future — manual request flow for V1)
- Location-based IRL discovery (future — "who else is in Antibes right now")
- Post scheduling or drafts
- AI-generated milestones or post suggestions

## Dependencies

- Sprint 22 complete: `createNotification()` service, notification delivery infrastructure, Supabase Realtime on notifications
- Sprint 21 complete: `contacts` table with accepted contacts (contact visibility for timeline)
- Sprint 12 complete: `get_colleagues()` RPC (colleague visibility for timeline)
- Sprint 18 complete: `positions` table (position milestones surface in timeline)
- Sprint 14 complete: `endorsement_signals` (endorsement milestones surface in timeline)
- `attachments` table — exists from Sprint 2–4 (new attachment → milestone)
- `endorsements` table — exists from Sprint 5 (endorsement received → milestone)
- `certifications` table — exists from Sprint 3 (new cert → milestone)
- AI content moderation from Sprint 16 (moderate post text)
- PostHog from Sprint 8

## Key Deliverables

### Timeline Data Model

- ⬜ `timeline_entries` table:
  - `id` uuid PK
  - `user_id` uuid FK → users (the author/subject of the entry)
  - `entry_type` text NOT NULL CHECK (entry_type IN ('milestone_yacht', 'milestone_endorsement', 'milestone_cert', 'milestone_position', 'milestone_profile', 'post', 'irl_connection'))
  - `content` text (user-written text for posts; auto-generated text for milestones)
  - `entity_id` uuid (FK to the relevant entity: attachment, endorsement, cert, position, irl_connection)
  - `entity_type` text (yacht, endorsement, certification, position, irl_connection)
  - `yacht_tag` uuid FK → yachts (optional — user can tag a post to a yacht)
  - `location_tag` text (optional — free text location)
  - `visibility` text DEFAULT 'network' CHECK (visibility IN ('network', 'private'))
  - `created_at` timestamptz DEFAULT now()
- ⬜ Index: `timeline_entries(created_at DESC)` for feed queries
- ⬜ Index: `timeline_entries(user_id, created_at DESC)` for profile timeline
- ⬜ RLS: complex — users can read entries from their network (colleagues + contacts). Implemented via RPC rather than row-level policy for performance.

### Auto-Generated Milestones

- ⬜ Milestone triggers (created automatically, no user action):
  - **New yacht attachment** (status = active/confirmed): "[Name] joined M/Y [Yacht] as [Role]"
  - **Endorsement received**: "[Name] received an endorsement from [Endorser] on M/Y [Yacht]"
  - **Certification added**: "[Name] added [Cert Type] to their certifications"
  - **Position posted**: "[Name] is hiring: [Role] on M/Y [Yacht]"
  - **Position filled**: "[Name] filled the [Role] position on M/Y [Yacht]"
  - **Profile created**: "[Name] joined YachtieLink" (one-time, on profile completion)
- ⬜ Milestones are auto-generated by database triggers or application-level hooks on the relevant INSERT/UPDATE events
- ⬜ User can hide individual milestones from their timeline (sets visibility → 'private') but cannot edit the auto-generated text
- ⬜ Milestones respect right of exit (D-033): if a user deletes an attachment, the corresponding milestone is removed

### User-Created Posts

- ⬜ "Post" button on timeline page — opens compose UI (bottom sheet on mobile, modal on desktop)
- ⬜ Text input: max 1000 chars
- ⬜ Optional yacht tag: typeahead from user's attached yachts
- ⬜ Optional location tag: free text
- ⬜ AI content moderation on submit (reuse Sprint 16 infrastructure)
- ⬜ Post appears in author's network timeline immediately
- ⬜ Author can delete their own posts at any time
- ⬜ No editing — delete and repost (keeps it simple, avoids edit history complexity)

### Timeline Feed — `/app/timeline`

- ⬜ Reverse chronological feed of entries from the viewer's network:
  - Colleagues (from `get_colleagues()` — shared yacht attachment)
  - Contacts (from `contacts` table — accepted contacts)
  - Own entries
- ⬜ `get_timeline_feed(p_user_id uuid, p_cursor timestamptz, p_limit int DEFAULT 20)` RPC:
  1. Get viewer's colleague IDs (via `get_colleagues()` or cached)
  2. Get viewer's contact IDs (accepted contacts)
  3. Union: colleague_ids + contact_ids + own user_id
  4. SELECT from `timeline_entries` WHERE `user_id IN (network_ids)` AND `visibility = 'network'` ORDER BY `created_at DESC` LIMIT p_limit
  5. Cursor-based pagination using `created_at` for infinite scroll
- ⬜ Feed entry card:
  - Author photo, name, role (tap → profile)
  - Entry type badge (milestone icon vs post icon)
  - Content text
  - Yacht tag (tap → yacht detail page) and/or location tag
  - Timestamp
  - Reaction count + react button
  - For milestones: entity link (tap endorsement → endorsement detail, tap yacht → yacht page)
- ⬜ **Strictly chronological** — no re-ordering, no "top posts", no engagement weighting (D-031)
- ⬜ Empty state: "Your network has no recent activity. Connect with colleagues or add contacts to see updates."
- ⬜ Accessible from bottom nav or sidebar

### Profile Timeline

- ⬜ On each user's profile page: "Activity" section showing their milestones and posts (reverse chronological)
- ⬜ Visible to anyone who can view the profile (respects existing profile visibility rules)
- ⬜ Filtered to that user's entries only

### Reactions

- ⬜ Single reaction type: "Wave" (👋) — a professional acknowledgment, not a "like"
- ⬜ `timeline_reactions` table:
  - `id` uuid PK
  - `entry_id` uuid FK → timeline_entries
  - `user_id` uuid FK → users
  - `created_at` timestamptz DEFAULT now()
- ⬜ Unique constraint: `timeline_reactions(entry_id, user_id)` — one reaction per user per entry
- ⬜ Tap to react, tap again to unreact (toggle)
- ⬜ Display: wave count on entry card, tap count to see who reacted (name, role)
- ⬜ Only users in the author's network can react (same visibility rules as the feed)
- ⬜ Reaction triggers notification to the entry author: "[Name] waved at your post/milestone"

### IRL Connections

- ⬜ `irl_connections` table:
  - `id` uuid PK
  - `initiator_id` uuid FK → users
  - `recipient_id` uuid FK → users
  - `location` text (optional — where they met)
  - `event` text (optional — what event, e.g., "Monaco Yacht Show 2026")
  - `visibility` text DEFAULT 'public' CHECK (visibility IN ('public', 'private'))
  - `status` text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'removed'))
  - `created_at` timestamptz DEFAULT now()
  - `confirmed_at` timestamptz
- ⬜ Unique constraint: `irl_connections(LEAST(initiator_id, recipient_id), GREATEST(initiator_id, recipient_id))` — one IRL connection per pair
- ⬜ IRL connection request flow:
  1. User A taps "Met in person" on User B's profile (or from colleague/contact list)
  2. Optional: add location and event context
  3. Choose visibility: public (appears in both timelines) or private (visible only to the two participants)
  4. Request sent → User B receives notification
  5. User B confirms or declines
  6. On confirm: IRL connection active, both users added to each other's network, timeline milestone created
- ⬜ IRL connection creates a graph edge (D-028): connected users appear in `get_colleagues()`-like queries but via a separate `irl_connections` source
- ⬜ `get_network(p_user_id uuid)` RPC (new or extended): returns union of colleague IDs (shared yacht) + IRL connection IDs (confirmed) — used by timeline feed and graph proximity
- ⬜ IRL edges do NOT enable endorsements (endorsements still require shared yacht attachment per D-009) — IRL connections expand the social graph, not the trust graph
- ⬜ Right of exit (D-033): either party can remove the IRL connection at any time → connection status → 'removed', timeline milestone deleted, graph edge removed

### Right of Exit (D-033) — Cross-Cutting

- ⬜ Posts: author can delete at any time
- ⬜ Milestones: user can hide (set to private) at any time
- ⬜ Milestones generated by entity changes: if the underlying entity is deleted (e.g., attachment removed), the milestone is automatically deleted
- ⬜ IRL connections: either party can remove at any time
- ⬜ Reactions: user can unreact at any time
- ⬜ Tagged in a post (future — not in V1): tagged user can remove the tag
- ⬜ All removals are immediate and propagate to all viewers

### Database Migration

- ⬜ `CREATE TABLE timeline_entries (id uuid PK, user_id uuid FK, entry_type text NOT NULL, content text, entity_id uuid, entity_type text, yacht_tag uuid FK, location_tag text, visibility text DEFAULT 'network', created_at timestamptz DEFAULT now())`
- ⬜ Index: `timeline_entries(created_at DESC)`
- ⬜ Index: `timeline_entries(user_id, created_at DESC)`
- ⬜ `CREATE TABLE timeline_reactions (id uuid PK, entry_id uuid FK, user_id uuid FK, created_at timestamptz DEFAULT now())`
- ⬜ Unique index: `timeline_reactions(entry_id, user_id)`
- ⬜ `CREATE TABLE irl_connections (id uuid PK, initiator_id uuid FK, recipient_id uuid FK, location text, event text, visibility text DEFAULT 'public', status text DEFAULT 'pending', created_at timestamptz DEFAULT now(), confirmed_at timestamptz)`
- ⬜ Unique index: `irl_connections(LEAST(initiator_id, recipient_id), GREATEST(initiator_id, recipient_id))`
- ⬜ `get_timeline_feed(p_user_id uuid, p_cursor timestamptz, p_limit int)` RPC
- ⬜ `get_network(p_user_id uuid)` RPC — union of colleagues + IRL connections
- ⬜ RLS policies on all tables
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `timeline_viewed` with entry_count, scroll_depth
- ⬜ `timeline_post_created` with has_yacht_tag, has_location_tag, content_length
- ⬜ `timeline_post_deleted`
- ⬜ `timeline_milestone_hidden` with milestone_type
- ⬜ `timeline_reaction_added` / `timeline_reaction_removed` with entry_type
- ⬜ `irl_connection_requested` with has_location, has_event
- ⬜ `irl_connection_confirmed` / `irl_connection_declined` / `irl_connection_removed`

## Exit Criteria

- Timeline feed shows network activity in strict reverse chronological order (D-031)
- Auto-generated milestones appear for new yachts, endorsements, certs, positions, profile creation
- User-created posts publish to network feed with optional yacht/location tags
- Timeline visibility bounded to viewer's network: colleagues + contacts + IRL connections (D-030)
- No algorithmic surfacing, trending, boosting, or engagement-weighted ordering anywhere
- Wave reactions work: tap to react, tap to unreact, count visible, tap count to see who
- IRL connections: request → confirm → graph edge created, timeline milestone generated
- IRL connections do NOT enable endorsements (D-009 unchanged — shared yacht required)
- Right of exit honoured everywhere: posts deletable, milestones hideable, IRL connections removable (D-033)
- `get_network()` RPC returns union of colleagues + IRL connections
- AI content moderation runs on user-created posts
- Notifications delivered for reactions and IRL confirmations (via Sprint 22 infrastructure)
- All components work at 375px width (mobile-first)
- PostHog events firing for timeline, posts, reactions, and IRL connections
- Graph navigation preserved: timeline entries link to profiles, yachts, endorsements, positions

## Estimated Effort

9–12 days

## Notes

**The timeline is not a social media feed (D-031).** This is the single most important design constraint. No "top posts." No engagement-weighted ranking. No "you might like." No trending. The timeline shows what happened, in the order it happened, within your network. If this feels boring compared to Instagram — good. The timeline serves professional memory, not entertainment. If a future metric review shows "low engagement," the response is not to add algorithmic surfacing — it's to question whether the metric is the right one.

**IRL connections extend the graph without diluting trust (D-028).** Meeting someone in person is a reality-bound event (D-028), so it creates a legitimate graph edge. But IRL connections are weaker than colleague edges: they don't enable endorsements (D-009 is unchanged — endorsements require shared yacht attachment). IRL connections affect network visibility (timeline, proximity badges) but not trust operations. This distinction is constitutional and must be enforced at the RPC level: `can_endorse()` checks shared yacht attachment only, never IRL connection status.

**"Wave" instead of "Like" is a deliberate choice.** A "like" button creates an implicit value judgment — posts with more likes feel more important. A wave (👋) is an acknowledgment: "I saw this, hey." It doesn't create a ranking signal, doesn't gamify posting, and matches how crew actually interact — a nod across the dock, not a popularity contest. If wave counts start being used as a metric for profile quality or search ranking, that's a violation of D-031 and should be flagged.

**Milestone auto-generation needs careful scoping.** Not every database change should create a milestone. Adding a minor cert shouldn't flood the timeline. The build plan should define a "significance threshold": milestones for yacht attachments (always), endorsements received (always), first cert (yes), subsequent certs (only if notable — e.g., STCW, Master, not a food hygiene refresher). Position milestones are always significant. The threshold can be tuned based on timeline density after launch.

**Hardest technical challenge:** The timeline feed query. `get_timeline_feed()` must union colleagues + contacts + IRL connections, then select timeline entries from that network, ordered by `created_at DESC` with cursor pagination. At 10K+ users where a crew member might have 50–100 network connections, the `IN (network_ids)` query can be slow. Options: (1) materialised `user_network` table updated on connection changes, (2) denormalized `timeline_feed` table populated by triggers, (3) the raw query with proper indexing. Start with option (3) — at Phase 3 scale it should be fast enough. Option (1) is the fallback if query plans degrade.

**This sprint closes Phase 3.** After Sprint 23, YachtieLink has: profiles, graph, hiring, recruiter access, messaging, notifications, multilingual profiles, a chronological timeline, and IRL connections. Phase 4 opens with AI career intelligence tools (cert intelligence, season readiness, portfolio advisor, gap analyzer) and culminates with verified status and community moderation.

**Next sprint picks up:** Sprint 24 (Phase 4) introduces AI career tools — cert expiry intelligence (AI-05), season readiness score (AI-06), endorsement portfolio advisor (AI-09), and yacht history gap analyzer (AI-12). These are Pro features that transform the platform from a tool crew use reactively into one that proactively guides their career.
