# Sprint 15 — Crew Search (Pro) + Expanded Analytics

> **RALPH LOOP DRAFT** — Written sequentially by automated planning loop. Each sprint reads and builds on the preceding sprint's output. This is a planning document, not a build spec. Once reviewed and approved by the founder, a separate session hardens this into a full `build_plan.md`.

**Phase:** 1C
**Status:** 📋 Draft
**Started:** —
**Completed:** —
**Builds on:** Sprint 14 (availability toggle with 7-day expiry, endorsement signals, availability events table, contact method visibility controls)

## Goal

Turn the graph into a discovery tool. Pro users — captains, HODs, senior crew who hire — can now search the crew database by role, yacht history, location, and availability status. This is the first feature that directly monetises graph density: search is only useful because hundreds of profiles, endorsements, and availability signals exist. Alongside search, an expanded analytics tab gives Pro users insight into how their profile performs — view trends, endorsement activity, and profile completeness signals. Sprint 14's availability toggle is the prerequisite: available crew become the searchable pool, and availability events feed into the new analytics.

## Scope

**In:**
- Crew search page for Pro users: `/app/search` (D-023)
- Search filters: role/department, yacht name, location (country/city), availability status, certification type
- Search results: profile summary cards (photo, name, role, department, sea time, yacht count, endorsement count)
- Result visibility: name and contact details visible to Pro users; locked for free users viewing search (D-025)
- Free user search teaser: free users can access the search page but results show blurred/locked profiles with "Upgrade to Pro to see full results" CTA
- 2nd-degree availability reach for Pro: Pro users see available crew up to 2 hops away in the graph (colleagues of colleagues), not just 1st-degree
- Expanded analytics tab: `/app/insights` for Pro users
- Analytics: profile view count (7d, 30d, all time), PDF download count, endorsement activity timeline, availability toggle history
- Anonymised viewer breakdown: by role category and location (never individual identity)
- Endorsement pinning: Pro users can reorder which endorsements appear first on their profile (display order, not trust weight)
- Notification preferences: email frequency controls for endorsement alerts, availability reminders, analytics digests

**Out:**
- NLP / semantic search (Sprint 20, AI-07 — requires vector infrastructure)
- Recruiter accounts and credit system (Sprint 19 — separate account type)
- Agency multi-seat plans (Sprint 20)
- Saved searches or search alerts (future — keep search simple for V1)
- AI-generated match explanations (Sprint 20, AI-07)
- Profile view identity reveal (viewer identity is never exposed — D-025)
- Endorsement signal analytics (signals are display-only per Sprint 14 — no analytics surface yet)
- AI profile insights (AI-15 — deferred, bundled with AI features)

## Dependencies

- Sprint 14 complete: availability toggle, `availability_status` and `availability_expires_at` columns on `users`, `availability_events` table, endorsement signals
- `users` table with: role, department, location fields — exists from Sprint 2–3
- `attachments` table with yacht references — exists from Sprint 2–4
- `endorsements` table — exists from Sprint 5
- `get_sea_time()` and `get_sea_time_detailed()` RPCs — exist from Sprint 12
- `get_colleagues()` RPC — exists from Sprint 4/12 (needed for 2nd-degree availability)
- PostHog integration — exists from Sprint 8 (profile view tracking already in place)
- Stripe Pro subscription check — exists from Sprint 7 (gate search behind Pro)
- Profile analytics (basic view count) — exists from Sprint 7 Pro tier

## Key Deliverables

### Crew Search Page — `/app/search`

- ⬜ New page at `/app/search`, accessible from bottom nav or sidebar
- ⬜ Pro gate: page loads for all users, but results are gated. Free users see the search UI and blurred result cards with upgrade CTA
- ⬜ Filter bar (collapsible on mobile):
  - Department: multi-select dropdown (Deck, Interior, Engineering, Galley, etc.)
  - Role: typeahead from seeded role list (same list as onboarding)
  - Location: country dropdown + optional city text input
  - Availability: toggle filter "Available now" (filters to `availability_status = 'available'`)
  - Certification: typeahead from cert type list (filter crew who hold a specific cert)
  - Yacht: typeahead yacht name search (find crew who worked on a specific yacht)
- ⬜ Results list: paginated (20 per page), sorted by relevance (available first, then endorsement count, then sea time)
- ⬜ Result card: profile photo, display name, role, department, location, sea time summary, endorsement count (e.g., "5 endorsements from 3 yachts"), availability badge if active
- ⬜ Card tap → navigate to full profile (`/u/[handle]` or `/app/profile/[id]`)
- ⬜ Empty state: "No crew match your filters" with suggestions to broaden search
- ⬜ Result count header: "47 crew match your search" (or "3 available now")

### Search RPC — `search_crew()`

- ⬜ `search_crew(p_filters jsonb, p_page int, p_page_size int)` — server-side search with pagination
- ⬜ Filters applied as WHERE clauses: department, role (ILIKE), location country/city, availability_status, cert type (JOIN to certifications), yacht_id (JOIN to attachments)
- ⬜ Sort order: `availability_status = 'available'` DESC, `endorsement_count` DESC, `total_sea_time_days` DESC
- ⬜ Returns: user summary fields, total_count for pagination
- ⬜ Index: composite index on `users(availability_status, department, location_country)` for common filter combinations
- ⬜ Performance: must return in <500ms for typical queries at 10K+ profiles

### 2nd-Degree Availability Reach (Pro)

- ⬜ `get_available_in_network(p_user_id, p_degree int DEFAULT 1)` RPC
- ⬜ Degree 1: colleagues (shared yacht) who are currently available
- ⬜ Degree 2: colleagues-of-colleagues who are available (Pro only)
- ⬜ Display: separate section on search page — "Available in your network" with degree indicator ("Colleague" vs "2nd degree — via [mutual colleague name]")
- ⬜ Network availability shown above general search results for context
- ⬜ Free users see 1st-degree only; Pro users see up to 2nd-degree

### Expanded Analytics — `/app/insights`

- ⬜ New tab/page at `/app/insights`, linked from profile or More menu
- ⬜ Pro gate: free users see a preview with blurred charts and upgrade CTA
- ⬜ **Profile views:** line chart (7d and 30d views), total count all-time
- ⬜ **PDF downloads:** count with trend (up/down vs previous period)
- ⬜ **Endorsement activity:** timeline of endorsements received, with names and yacht context
- ⬜ **Viewer breakdown:** anonymised aggregates — "Viewed by: 40% Deck, 30% Interior, 20% Engineering, 10% Other" and "Top locations: France, USA, Australia" (never individual names)
- ⬜ **Availability history:** graph of toggle events from `availability_events` table (Sprint 14) — shows when you were available and how many days total
- ⬜ **Profile completeness score:** percentage based on filled fields (photo, bio, 1+ yacht, 1+ cert, 1+ endorsement) with "Complete next step" CTA
- ⬜ Data source: PostHog for view/download counts (via PostHog API or server-side query), `availability_events` table for toggle history, direct DB queries for endorsement timeline

### Endorsement Pinning (Pro)

- ⬜ `endorsement_display_order` jsonb column on `users` table (array of endorsement IDs in preferred order)
- ⬜ Drag-to-reorder UI on endorsement section (Pro only) — long press on mobile, drag handle on desktop
- ⬜ Pinned order applies to profile page and public profile
- ⬜ Non-pinned endorsements fall back to reverse chronological
- ⬜ Free users see endorsements in chronological order (no reorder UI shown)
- ⬜ Pinning is display order only — no effect on trust weight, search ranking, or signals (D-003)

### Notification Preferences

- ⬜ New settings section: `/app/more/notifications`
- ⬜ Toggle controls for:
  - Endorsement received email (default: on)
  - Endorsement request received email (default: on)
  - Availability expiry reminder (default: on)
  - Weekly analytics digest email (Pro only, default: off)
  - Cert expiry reminders (Pro only, default: on — already specced in Sprint 7)
- ⬜ `notification_preferences` jsonb column on `users` table
- ⬜ All email sends check preference before dispatching
- ⬜ Unsubscribe links in emails map to these toggles

### Database Migration

- ⬜ `ALTER TABLE users ADD COLUMN endorsement_display_order jsonb DEFAULT '[]'`
- ⬜ `ALTER TABLE users ADD COLUMN notification_preferences jsonb DEFAULT '{}'`
- ⬜ Composite index: `users(availability_status, department, location_country)` for search
- ⬜ Index: `certifications(user_id, cert_type)` for cert-filtered search
- ⬜ Index: `attachments(yacht_id, user_id)` for yacht-filtered search (if not already present)
- ⬜ `search_crew(p_filters jsonb, p_page int, p_page_size int)` RPC
- ⬜ `get_available_in_network(p_user_id uuid, p_degree int)` RPC
- ⬜ RLS: search results respect profile visibility settings (users who have hidden their profile are excluded)
- ⬜ GRANT EXECUTE on all new functions

### PostHog Events

- ⬜ `crew_search_executed` with filter params and result count
- ⬜ `crew_search_result_tapped` with result position
- ⬜ `search_upgrade_cta_shown` / `search_upgrade_cta_tapped` (free user conversion tracking)
- ⬜ `analytics_tab_viewed` with Pro status
- ⬜ `endorsement_pinned` / `endorsement_unpinned`
- ⬜ `notification_preference_changed` with preference key and value

## Exit Criteria

- Pro users can search crew by role, department, location, availability, cert type, and yacht
- Search results display profile summaries with endorsement count and availability badge
- Free users see search page with blurred results and upgrade CTA
- 2nd-degree available crew shown for Pro users with mutual colleague attribution
- Search returns in <500ms for typical queries
- Analytics tab shows view trends, PDF downloads, endorsement timeline, anonymised viewer breakdown
- Endorsement pinning: Pro users can reorder endorsements, order persists on profile and public page
- Notification preferences page functional, all email sends respect preferences
- All components work at 375px width (mobile-first)
- Pro gate enforced consistently (search results, analytics detail, pinning, 2nd-degree reach)
- PostHog events firing for search, analytics, pinning, and notification changes
- Graph navigation preserved: search result cards link to profiles, profiles link to yachts, yachts link to crew

## Estimated Effort

7–10 days

## Notes

**Search is the Pro value inflection point (D-023).** Before this sprint, Pro offered PDF templates, watermark removal, custom subdomain, and basic analytics — nice-to-haves. Search makes Pro essential for anyone who hires: captains finding deckhands, chief stews finding stewardesses, bosuns staffing for a refit. This is where the EUR 12/month subscription starts to feel like a bargain.

**Sorting by endorsement count is ordering, not trust weighting (D-026).** Recruiters and Pro users see results sorted by availability then endorsement count. This rewards active platform users without crossing the trust monetisation line. Endorsement count can't be gamed because endorsements require shared yacht attachment (D-009). More endorsements = more real colleagues vouching = exactly what a hiring captain wants to see.

**Profile visibility in search results follows D-025.** Direct links and graph browsing always show full profiles. Search results show profile summaries (photo, name, role, stats). For free users viewing search, names and contact details are locked behind the Pro paywall. This creates a natural conversion funnel without restricting the core identity/sharing use case.

**2nd-degree availability is the social graph unlock.** When a captain sees "Available — 2nd degree via Chief Stew Maria" they get both a candidate and a reference in one glance. This is something no job board can offer. It's the graph making hiring better.

**Hardest technical challenge:** The `search_crew()` RPC needs to handle multi-filter queries across joined tables (users, attachments, certifications) efficiently at scale. Composite indexes are critical. At 500–1000 profiles this is trivial; the design needs to hold at 10K+ (Phase 2 gate). Consider materialized views or denormalized search columns if query plans degrade.

**Analytics data source trade-off.** Profile view counts could come from PostHog (external API call, slight latency) or from a local `profile_views` table (more control, but another table to maintain). The build plan should evaluate both. PostHog already tracks page views — querying it via API avoids duplicating data. If latency is a problem, a nightly sync to a local summary table is a clean middle ground.

**Next sprint picks up:** Sprint 16 introduces AI Pack 1 — the endorsement writing assistant (AI-04), cert OCR (AI-02), multilingual endorsement requests (AI-03), and profile suggestions (AI-17). These features build on the profile and endorsement infrastructure that's now mature, adding AI convenience without touching the trust layer.
