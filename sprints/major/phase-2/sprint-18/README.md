# Sprint 18 — Peer Hiring

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 2
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 17 (attachment confirmation, smart yacht autocomplete, graph integrity controls) — crossing Phase 1C → Phase 2 boundary. Also builds on Phase 2 README (phase gate: 10K+ crew, recruiter demand confirmed).

## Goal

Make the graph economically useful for crew. Captains, HODs, and senior crew can post open positions on yachts they're currently attached to. Other crew can apply with their YachtieLink profile — no CV upload, no cover letter, just their existing profile with its employment history, endorsements, and certifications. Both sides see graph proximity: mutual colleagues, shared yachts, endorsement overlap. This is the first feature where the trust graph directly facilitates a real-world outcome (getting hired). Sprint 17's graph integrity controls (attachment confirmation, semantic yacht matching) ensure that the graph being used for hiring decisions is trustworthy. Peer hiring is free — it's a use case for the graph, not a separate product (D-022).

## Scope

**In:**
- Job position posting: crew with full profiles + current yacht attachment can post open positions
- Position details: role, department, yacht (pre-filled from poster's current attachment), start date, duration, description
- Position feed: `/app/positions` — list of open positions, filterable by department/role/location
- Graph proximity display: mutual colleagues, shared yachts, endorsement overlap between viewer and poster
- Apply with profile: one-tap application that shares the applicant's profile with the poster
- Application inbox for posters: see applicants with their profiles, graph proximity, and endorsement highlights
- Post limits: 1 active position/month (free), 3 active positions/month (Pro) per D-023
- 30-day position expiry with option to renew
- Position visibility: graph-adjacent crew (1st degree for free, 2nd degree for Pro) + available crew who match the role
- Email notification to poster on new application, to applicant on position status change

**Out:**
- Recruiter job posting (Sprint 19 — different account type, different rules)
- Paid job listings or featured positions (D-022: no paid listings, no placement fees)
- Algorithmic job matching or recommendation (no AI matching — the graph provides context, humans decide)
- In-app messaging between poster and applicant (Phase 3 Sprint 21 — use existing contact methods for now)
- Position search by salary/compensation (crew set expectations directly — not a compensation platform)
- Position analytics or metrics dashboard (keep it simple for V1)
- External job board aggregation or syndication
- Application tracking beyond basic status (applied/viewed/shortlisted/rejected — no full ATS)

## Dependencies

- Sprint 17 complete: graph integrity controls operational, semantic yacht search working
- Phase 2 gate met: 10K+ crew, recruiter demand confirmed
- `users` table with profile completeness check — exists (profile setup milestones from Sprint 3)
- `attachments` table with current attachments (no `ended_at`) — exists from Sprint 2–4
- `yachts` table — exists from Sprint 4
- `search_crew()` RPC from Sprint 15 (reuse filter patterns for position search)
- `get_colleagues()` and `get_mutual_colleagues()` RPCs from Sprint 4/12 (for graph proximity display)
- Availability toggle infrastructure from Sprint 14 (available crew surfaced in position matching)
- Stripe Pro subscription check from Sprint 7 (for post limit enforcement)
- Resend email infrastructure from Sprint 5/8 (notifications)
- PostHog from Sprint 8 (event tracking)

## Key Deliverables

### Position Data Model

- ⬜ `positions` table:
  - `id` uuid PK
  - `poster_id` uuid FK → users (who posted it)
  - `yacht_id` uuid FK → yachts (which yacht the position is on — must have current attachment)
  - `role` text NOT NULL (from seeded role list)
  - `department` text NOT NULL (from department list)
  - `description` text (free text, 50–2000 chars)
  - `start_date` date (when the position starts — required)
  - `duration` text (e.g., "Permanent", "Season (6 months)", "Temporary (3 months)", "Day work")
  - `location` text (optional — port/region if known)
  - `status` text DEFAULT 'open' CHECK (status IN ('open', 'filled', 'expired', 'closed'))
  - `expires_at` timestamptz (created_at + 30 days)
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()
- ⬜ `position_applications` table:
  - `id` uuid PK
  - `position_id` uuid FK → positions
  - `applicant_id` uuid FK → users
  - `status` text DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected'))
  - `message` text (optional short note from applicant, max 500 chars)
  - `created_at` timestamptz DEFAULT now()
  - `updated_at` timestamptz DEFAULT now()
- ⬜ Unique constraint: `position_applications(position_id, applicant_id)` — one application per position per user
- ⬜ RLS policies:
  - Positions: anyone authenticated can read open positions; only poster can update/delete their own
  - Applications: poster can read applications to their positions; applicant can read their own applications

### Post Position Flow

- ⬜ "Post a position" button on profile page (near yacht section) and on yacht detail page
- ⬜ Full profile check: poster must have completed profile (photo, bio, 1+ yacht, role set) — show "Complete your profile first" if not met
- ⬜ Current attachment check: poster must have a current attachment (no `ended_at`) to the yacht they're posting for
- ⬜ Post limit check: count active positions by poster in current month. Free: max 1, Pro: max 3. Show upgrade CTA if at limit
- ⬜ Position form (bottom sheet on mobile, modal on desktop):
  - Yacht: pre-selected from poster's current attachments (if multiple, dropdown to choose)
  - Role: typeahead from seeded role list (same as onboarding)
  - Department: auto-filled from role selection, editable
  - Start date: date picker (required)
  - Duration: dropdown (Permanent, Season, Temporary, Day work)
  - Location: optional text (port/region)
  - Description: free text area (50–2000 chars) with Sprint 16's AI-17 "Improve" button for text polish
- ⬜ Preview step: show how the position will appear before publishing
- ⬜ On publish: create position record, set `expires_at = now() + 30 days`
- ⬜ AI content moderation check on description text (reuse AI-01 moderation if available, or Sprint 16's shared AI infrastructure)

### Position Feed — `/app/positions`

- ⬜ New page accessible from bottom nav or sidebar
- ⬜ Feed of open positions, most recent first
- ⬜ Filter bar (collapsible on mobile):
  - Department: multi-select
  - Role: typeahead
  - Location: text search
  - "In my network": toggle to show only positions from graph-adjacent crew
- ⬜ Position card:
  - Role + department
  - Yacht name + type + length (tap → yacht detail page)
  - Poster: name, photo, role (tap → profile)
  - Start date + duration
  - Graph proximity badge: "Colleague" / "2nd degree via [name]" / "Worked on same yacht" / no badge (outside network)
  - "X applications" count
  - Posted date + expires in X days
- ⬜ Visibility rules:
  - All users see all open positions (the feed is public within the app)
  - Graph proximity badges are personalised per viewer
  - Pro users see 2nd-degree proximity; free users see 1st-degree only
- ⬜ Pagination: infinite scroll or "Load more" (20 positions per page)

### Graph Proximity Display

- ⬜ `get_graph_proximity(p_viewer_id uuid, p_target_id uuid)` RPC — returns proximity level and context:
  - `direct_colleague`: shared yacht attachment → return shared yacht names
  - `second_degree`: colleague of colleague → return the connecting colleague's name
  - `shared_yacht_history`: both worked on the same yacht but different time periods → return yacht name
  - `endorsement_overlap`: viewer endorsed or was endorsed by the target → return endorsement context
  - `none`: no graph connection
- ⬜ Proximity badge component: reusable across position cards, application cards, and profile views
- ⬜ Badge includes tap-to-expand detail: "You both worked on M/Y Horizon" or "Connected via Chief Stew Maria (M/Y Atlas)"
- ⬜ Reuses `get_colleagues()` and `get_mutual_colleagues()` from Sprint 12

### Apply with Profile

- ⬜ "Apply" button on position card → confirmation: "Your profile will be shared with [poster name]. They'll see your employment history, endorsements, and certifications."
- ⬜ Optional message field (max 500 chars) — not required, keeps friction low
- ⬜ One-tap submit: creates `position_applications` record
- ⬜ Cannot apply to own position
- ⬜ Cannot apply twice to same position (show "Applied" state)
- ⬜ Email notification to poster: "[Applicant name] applied to your [role] position on [yacht]" with deep link to application inbox
- ⬜ Applicant sees their application status on the position card: "Applied", "Viewed", "Shortlisted"

### Application Inbox — `/app/positions/[id]/applications`

- ⬜ Accessible to position poster only
- ⬜ List of applicants with:
  - Profile summary: photo, name, role, department, sea time, endorsement count
  - Graph proximity badge (same component as position feed)
  - Endorsement highlights: top 2 endorsements relevant to the posted role (same department or yacht)
  - Application message (if provided)
  - Application date
  - Status controls: mark as "Viewed" (auto on open), "Shortlisted", or "Rejected"
- ⬜ Tap applicant → navigate to their full profile
- ⬜ Status change triggers email notification to applicant (if not rejected — rejected applications receive no email to avoid discouragement, unless the poster writes a note)
- ⬜ "Contact" action: deep link to applicant's visible contact methods (phone, email, WhatsApp) if applicant has made them available via availability contact settings (Sprint 14)

### Position Lifecycle

- ⬜ Expiry cron: daily, checks `expires_at < now()` for open positions, sets status → `expired`
- ⬜ 3-day expiry warning: email to poster "Your [role] position on [yacht] expires in 3 days"
- ⬜ Renew: poster can renew expired position for another 30 days (counts against monthly limit on renewal date)
- ⬜ Close: poster can manually close position at any time (status → `closed`)
- ⬜ Fill: poster can mark position as "filled" (status → `filled`) — does not auto-notify applicants
- ⬜ Expired/closed positions hidden from feed but accessible via poster's "My positions" page

### My Positions — `/app/positions/mine`

- ⬜ List of poster's positions (open, filled, expired, closed)
- ⬜ Application count per position
- ⬜ Quick actions: view applications, renew, close
- ⬜ Post limit indicator: "1 of 1 position used this month" (free) or "2 of 3" (Pro)

### Database Migration

- ⬜ `CREATE TABLE positions (...)` — schema as described above
- ⬜ `CREATE TABLE position_applications (...)` — schema as described above
- ⬜ Unique index: `position_applications(position_id, applicant_id)`
- ⬜ Index: `positions(status, department, created_at)` for feed queries
- ⬜ Index: `positions(poster_id, status)` for "my positions" queries
- ⬜ Index: `positions(expires_at)` for expiry cron
- ⬜ `get_graph_proximity(p_viewer_id uuid, p_target_id uuid)` RPC
- ⬜ RLS policies on both tables
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `position_created` with role, department, yacht_id, poster Pro status
- ⬜ `position_viewed` with viewer graph proximity to poster
- ⬜ `position_applied` with applicant graph proximity to poster, message included (bool)
- ⬜ `position_application_viewed` / `position_application_shortlisted` / `position_application_rejected`
- ⬜ `position_expired` / `position_renewed` / `position_closed` / `position_filled`
- ⬜ `position_post_limit_hit` with user Pro status (conversion tracking)
- ⬜ `position_feed_filtered` with filter params

## Exit Criteria

- Crew with full profiles can post positions on yachts they're currently attached to
- Post limits enforced: 1/month free, 3/month Pro, with upgrade CTA at limit
- Position feed shows open positions with filter controls (department, role, location, network toggle)
- Graph proximity badges display on position cards and application cards (1st degree free, 2nd degree Pro)
- One-tap apply shares profile with poster; poster sees applicants in inbox with profiles and graph context
- Application status flow works: applied → viewed → shortlisted/rejected
- Position lifecycle: 30-day expiry, 3-day warning email, renew/close/fill actions
- "My positions" page shows poster's position history with application counts
- Email notifications: new application (to poster), 3-day expiry warning (to poster), status change (to applicant)
- AI content moderation runs on position descriptions
- All components work at 375px width (mobile-first)
- PostHog events firing for full position and application lifecycle
- Graph navigation preserved: position cards link to yacht and poster profile, application cards link to applicant profile

## Estimated Effort

8–10 days

## Notes

**Peer hiring is a graph feature, not a job board (D-022).** The position feed looks like a job board on the surface, but every card includes graph proximity context that no job board can replicate. "This captain worked on M/Y Horizon with your colleague Maria, and has 7 endorsements from 4 yachts" — that's the graph creating value. The design should emphasise graph context over job details. If the feed ever starts feeling like Indeed or Deveraux, the design has drifted.

**No in-app messaging yet — use existing contact methods.** When a poster wants to contact an applicant, they use the applicant's available contact methods (phone, WhatsApp, email — surfaced via Sprint 14's availability contact controls). This is intentional: messaging is Phase 3 (Sprint 21). For peer hiring to work without messaging, the applicant's contact methods must be visible to the poster when the applicant has opted in via availability. If the applicant hasn't toggled availability, the poster sees their public profile contact fields (whatever the applicant has made visible).

**Graph proximity is the killer feature of this sprint.** The `get_graph_proximity()` RPC is reusable far beyond position cards — it'll be used in recruiter search results (Sprint 19), agency views (Sprint 20), and eventually messaging (Sprint 21). Design it as a general-purpose utility from the start. The RPC should return structured data (proximity level, connecting entities, context text) that the frontend formats into badges.

**Post limits create Pro conversion pressure.** A captain who fills one position via YachtieLink and needs to post again has a clear reason to upgrade to Pro. Track `position_post_limit_hit` events closely — this is a high-intent conversion moment. The upgrade CTA should appear inline in the post flow, not as a blocking modal.

**Hardest technical challenge:** Graph proximity computation at scale. `get_graph_proximity()` needs to check shared yachts (JOIN attachments), mutual colleagues (2-hop graph traversal), and endorsement overlap for every (viewer, poster) pair. At 10K+ users, the 2-hop traversal can get expensive. Consider caching proximity results per session or pre-computing common pairs. The Sprint 15 `get_available_in_network()` RPC already does 2-hop traversal — reuse its approach.

**Next sprint picks up:** Sprint 19 introduces recruiter accounts — a new user type with separate signup, EUR 29/month subscription, and the credit system for profile unlocks. Recruiter search builds on Sprint 15's `search_crew()` with additional filters (endorsement count sorting per D-026) and locked name/contact in results. The recruiter account model is the first time a non-crew entity interacts with the platform.
