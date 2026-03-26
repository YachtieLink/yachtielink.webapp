# Network — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-26** — Claude Code (Opus 4.6, Phase 1 Wave 5): Rewrote ColleaguesTab from flat list to yacht-grouped view (D7: list-based). Extracted `sendEndorsementRequest()` + `sendBatchRequests()` into `lib/endorsements/send-request.ts`. Slimmed `RequestEndorsementClient.tsx` by replacing inline fetch with shared helper. Fixed Endorse link yacht_id for multi-yacht colleagues.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Network page — colleague cards link to `/u/{handle}`, endorsement text links converted to proper buttons; page title added.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 A2): Saved profiles promoted to `/app/network/saved` — server-side data fetching, folder CRUD, move-to-folder, empty state; `SavedTab` in `AudienceTabs` replaced with link card.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1): Added `PATCH /api/saved-profiles/[id]` route for folder assignment.

**2026-03-18** — Claude Code (Sonnet 4.6, post-Phase1A fixes): Added error handling to `SavedTab` in `AudienceTabs.tsx` — `Promise.all` fetch now has `.catch()/.finally()` so tab shows empty state instead of hanging on network failure.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): New tables — `profile_folders`, `saved_profiles` with RLS; new API routes `/api/saved-profiles` (GET/POST/DELETE), `/api/profile-folders` (GET/POST), `/api/profile-folders/[id]` (PUT/DELETE); `SaveProfileButton` component with optimistic toggle; `getSavedStatus()`, `getSavedProfiles()`, `getProfileFolders()` query helpers.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 10): BottomTabBar — added `networkBadge` prop with red dot indicator on Network tab; app layout fetches pending endorsement request count server-side.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup): New `/api/badge-count` endpoint + `lib/hooks/useNetworkBadge.ts` — polls every 60s client-side; moved network badge from server layout → client-side hook so app shell renders instantly.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 06): `SidebarNav.tsx` — desktop sidebar (`hidden md:flex`, fixed left, 64px, 5 tabs + YL logo); `components/nav/icons.tsx` shared icon SVGs; BottomTabBar gets `md:hidden` for mobile-only.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): `AudienceTabs.tsx` — replaced BottomSheet indirection with prominent teal CTA card linking to `/app/endorsement/request`, progress bar embedded.

**2026-03-15** — Claude Code (Sonnet 4.6, Sprint 8): `lib/queries/notifications.ts` — `getPendingRequestCount` with React.cache for dedup.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Replaced `app/audience` placeholder — `get_colleagues` RPC → profile + yacht lookup → colleague cards with shared yacht label and "Endorse" shortcut; colleague graph derived on access, not stored.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): `app/(protected)/app/audience/page.tsx` full rewrite — parallel fetch of all 5 data sets (colleague graph + endorsement requests/sent + endorsements received), passes to `AudienceTabs`.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 5): `AudienceTabs.tsx` — client tab component with endorsements/colleagues segment toggle, request-received list, endorsements-received list, requests-sent list with status pills, `RequestActions` component for cancel/resend.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): DB function `get_colleagues` — derives colleague graph on access via shared yacht attachments.
