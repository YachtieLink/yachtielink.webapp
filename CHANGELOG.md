# CHANGELOG.md — Cross-Agent Handover Log

All coding agents (Claude Code, Codex, etc.) must read this file at session start and update it throughout the session.

**Format:** Reverse chronological. One entry per session. Heading: `## YYYY-MM-DD — Agent Name`. Two sessions on the same day get separate entries with the same date. Sections: Done / Context / Next / Flags.

**Reading rules:**
- Read the last 3 sessions before doing any work
- Read older sessions only if the current task needs deeper historical context

**Writing rules:**
- This is a running log — update it as work happens, not just at session end
- Update after any meaningful decision, significant file change, or flag raised to the founder
- Confirm it's current before committing and pushing
- Confirm it's complete at session end
- Be concise but specific — the next agent needs to understand what happened and what's next

---

## 2026-03-13 — Claude Code (Sonnet 4.6) — Sprint 1

### Done
- Created `feat/sprint-1` branch from main
- Installed Supabase CLI v2.78.1 (via direct binary download to `~/bin/supabase`) + ran `supabase init`
- Wrote 7 database migrations to `supabase/migrations/` and applied all to production (`xnslbbgfuuijgdfdtres`):
  - `000001_extensions.sql` — pg_trgm, unaccent, pgcrypto, uuid-ossp, internal schema
  - `000002_reference_tables.sql` — departments, roles, certification_types, templates, other_role_entries, other_cert_entries
  - `000003_core_tables.sql` — users (handle, onboarding_complete, departments[], subscription fields), yachts (yacht_type: 'Motor Yacht'/'Sailing Yacht'), attachments (role_label for "Other" entries), endorsements, endorsement_requests (token + 30-day expiry), certifications (custom_cert_name fallback), profile_analytics, internal.flags. Fixed: schema-qualified `extensions.gen_random_bytes()` (Supabase puts pgcrypto in extensions schema, not public)
  - `000004_functions.sql` — handle_new_user trigger, set_updated_at triggers, are_coworkers, are_coworkers_on_yacht, yacht_crew_count, get_yacht_crew_threshold, check_yacht_established, get_colleagues, handle_available, suggest_handles
  - `000005_rls.sql` — RLS on every table (reference tables: public read; users: public read + own update; yachts: public read + authenticated create; attachments/endorsements/endorsement_requests/certifications: owner-scoped writes; analytics: own read + public insert; internal.flags: no user access)
  - `000006_seed_reference.sql` — 7 departments, 56 roles across 8 departments (Other entries tracked separately), 57 cert types across 8 categories, 3 templates. Note: "Purser" removed from Interior seed (kept in Admin/Purser only) pending constraint fix in 000007
  - `000007_fix_roles_constraint.sql` — dropped unique constraint on `roles.name`, added unique on `(name, department)`, re-inserted Interior Purser (sort_order 205)
- Updated `app/globals.css` — brand token system (navy, ocean, gold palettes), semantic CSS vars with dark overrides, dark mode via `.dark` class variant, tab bar helpers
- Updated `app/layout.tsx` — YachtieLink metadata, viewport config, inline dark mode init script (reads localStorage, falls back to system preference, no FOUC)
- Built app shell:
  - `app/page.tsx` — root redirect (auth check → /app/profile or /welcome)
  - `app/(protected)/app/layout.tsx` — authenticated layout with auth gate + BottomTabBar
  - `app/(protected)/app/{profile,cv,insights,audience,more}/page.tsx` — placeholder pages
  - `app/(auth)/layout.tsx` — auth layout (redirects signed-in users to /app/profile)
  - `app/(auth)/welcome/page.tsx` — landing/auth method selection (email only; Google/Apple commented as placeholders)
  - `app/(auth)/login/page.tsx` — email/password sign-in form
  - `app/(auth)/signup/page.tsx` — email/password signup with email verification confirmation screen
  - `app/(auth)/reset-password/page.tsx` — sends Supabase reset email with redirectTo `/auth/callback?next=/update-password`
  - `app/(auth)/update-password/page.tsx` — new password form, calls `supabase.auth.updateUser({ password })`, redirects to /app/profile on success
- Built auth infrastructure:
  - `lib/supabase/middleware.ts` — middleware Supabase client
  - `middleware.ts` — route protection (PROTECTED_PREFIXES → /welcome; AUTH_ONLY_PREFIXES → /app/profile)
  - `app/auth/callback/route.ts` — PKCE code exchange, handles error params, safe redirect
- Built base component library in `components/ui/`:
  - `Button.tsx` — 4 variants (primary/secondary/ghost/destructive), 3 sizes, loading spinner
  - `Card.tsx` — Card, CardHeader, CardTitle, CardBody; interactive prop for tappable cards
  - `Input.tsx` — label, hint, error, suffix; accessible with aria-describedby/aria-invalid
  - `Toast.tsx` — ToastProvider + useToast hook; 3 types; 4-second auto-dismiss
  - `BottomSheet.tsx` — fixed bottom drawer with backdrop, drag handle, Escape key, body scroll lock
  - `ProgressWheel.tsx` — SVG ring for profile completion (Wheel A) and endorsements (Wheel B)
  - `index.ts` — barrel export
- Built `components/nav/BottomTabBar.tsx` — 5 tabs (Profile, CV, Insights, Audience, More), active state, outline/filled icon pairs, safe-area aware
- Built public route shells: `/u/[handle]` (public profile, Sprint 6) and `/r/[token]` (endorsement deep link, Sprint 5)
- Build passes cleanly. All routes correct: `/app/profile`, `/app/cv`, etc.
- PR merged to main ✓

### Context
- OAuth (Google, Apple) deliberately excluded — founder decision: email/password only until paying users justify the setup cost. OAuth is commented in `welcome/page.tsx` for easy re-activation
- Production Supabase project ref: `xnslbbgfuuijgdfdtres`. Staging: `zsxmlcksbxlvbptnxiok`. Both in `.env.local` (production active, staging commented)
- Reset password redirect requires the app URL to be whitelisted in Supabase dashboard → Authentication → URL Configuration → Redirect URLs. Add: `http://localhost:3000/**` for local dev, production URL when deployed
- `yl_schema.md` is out of date (v1.1, 2026-01-28) — migrations are the source of truth
- Key schema decisions: `yacht_type` = 'Motor Yacht'/'Sailing Yacht'; `departments[]` array on users; `role_label` on attachments; `endorsement_requests` table added; `handle` field with format constraint; subscription fields on users (ready for Sprint 7); `other_role_entries`/`other_cert_entries` for "Other" tracking

### Next
- Start Sprint 2: onboarding flow (name → handle → department/role → yacht → endorsement requests → done)
- Add production URL to Supabase redirect URLs whitelist once deployed (needed for reset password email link to work end-to-end)

### Flags
- `yl_schema.md` is now out of date — low priority, migrations are source of truth
- `~/bin/supabase` is not on PATH — use full path or add `~/bin` to PATH
- Reset password flow UI is complete but email link will 404 until the app is deployed and the redirect URL is whitelisted in Supabase dashboard

---

## 2026-03-13 — Claude Code (Opus 4.6)

### Done
- Comprehensive feature clarification session with founder — 33 questions answered covering auth, onboarding, profile, yachts, endorsements, CV/PDF, payments, notifications, and UX
- Rewrote `docs/yl_features.md` (v1.1 → v2.0) — all Phase 1A features now have detailed implementation specs including:
  - Email verification required for email/password accounts
  - Department multi-select (7 departments including Medical, Admin/Purser, Land-based)
  - Full seeded role list by department with "Other" tracking mechanism
  - Full seeded certification type list with hierarchical tree UI for selection
  - Certifications: document upload for all users, document manager + expiry alerts for Pro
  - Yacht type limited to Motor Yacht / Sailing Yacht, length in exact metres, flag state dropdown, year built optional
  - Endorsement request expiry: 30 days
  - Endorsement signals moved to Phase 1B
  - Contacts import deferred to native app
  - Pro pricing: EUR 12/month or EUR 9/month annual (no free trial — free tier is the trial)
  - Custom subdomain is alias (both URLs active)
  - Profile analytics as time-series (7d/30d/all time)
  - PDF includes top 3 endorsements + QR code
  - Dark mode from launch
  - Notification strategy: email only for webapp, in-app deferred to native
- Added Reference Data section to `yl_features.md` — departments, roles, cert types, yacht types, flag states
- Rewrote `docs/yl_build_plan.md` (v1.0 → v2.0) — all sprints updated to reflect clarified features
- Rewrote `docs/yl_mobile_first_ux_spec_for_pm_v1.md` (v1.0 → v2.0) — stripped deferred features (Timeline, Contacts, IRL), updated all screens with new details, added deferred section at bottom
- Cleaned up parent folder: moved redundant `Project Files/`, `Config/`, `files/`, `files.zip` into `Archived/pre_webapp_cleanup_2026-03-13/`
- Archived `yachtielink.webapp 2` (confirmed identical older snapshot of webapp)

### Context
- All three core docs (features, build plan, UX spec) are now at v2.0 and aligned with each other
- Feature registry is now the definitive "what and why" — build plan is "how and when" — UX spec is "exact screens and flows"
- Founder will provide PDF template reference sample during Sprint 6

### Next
- Start Sprint 1: database migrations (with full reference data seeding), RLS policies, auth setup (with email verification), app shell, dark mode, base components
- Apple Developer Account setup still needed for Apple OAuth
- Sonnet is sufficient for Sprint 1 (mechanical work). Reserve Opus for Sprint 5 (endorsement deep links), Sprint 6 (CV parsing prompts), Sprint 7 (Stripe webhooks)

### Flags
- Cert type seed list is large but non-exhaustive — "Other" tracking mechanism needed from day 1 to capture edge cases
- Role seed list same — track "Other" entries for periodic promotion into seed list
- Contacts import documented for future native app implementation

---

## 2026-03-10 — Claude Code (Codex GUI session)

### Done
- Created `docs/yl_features.md` — feature registry covering all 25 features across Phase 1A/1B/1C/2+ with what, why, phase assignment, and crew-first notes. New canonical reference doc.
- Restructured `AGENTS.md` — now the primary instruction set for all coding agents (Claude Code, Cursor, Codex, Copilot). Includes persona, workflow, code standards, and decision principles.
- Restructured `CLAUDE.md` — now a thin Claude Code-specific wrapper that defers to `AGENTS.md`.
- Softened language across all agent-facing docs — replaced hard prohibitions ("never", "irreversible", "constitutional", "rejected/never-build") with crew-first principles and flag-and-ask behaviour. Agents surface concerns to founder rather than blocking unilaterally.
- Updated `yl_phase1_execution.md` — "Hard Constraints" → "Guiding Principles", language softened throughout.
- Updated `yl_system_state.json` — `phase_invariants` softened.
- Created `notes/delta_canonical_vs_root_2026-03-09.md` — full diff of docs/canonical/ (from PR #9) vs root-level docs. Documents all meaningful differences for founder review before any content is merged.
- Added `.claude/worktrees/` to `.gitignore`.
- Discovered and resolved branch staleness — our branch was behind by 4 PRs. Merged origin/main, no manual conflicts.
- Switched GitHub remote from SSH to HTTPS — SSH keys weren't configured, GitHub CLI now handles auth.
- Opened PR #11 — all session work pushed to `feat/project-setup`.
- Clarified changelog format: one entry per session (not per day, not per alteration), reading rule is "last 3 sessions", updated both `AGENTS.md` and `CHANGELOG.md` header to reflect this.

### Context
- `docs/canonical/` (from PR #9) is a historical baseline from 2026-02-11. Root-level `docs/` is the working set. Do not overwrite root docs with canonical versions without founder review.
- The delta notes doc flags specific conflicts to resolve — notably D-016 (paid verified status path exists in canonical, removed in root as crew-first violation), recruiter pricing detail, and bootstrapping plan missing from root.
- `yl_features.md` was built from the root docs. Some Phase 1C details (recruiter pricing, full Crew Pro feature list) are more complete in `docs/canonical/` — pending founder review of delta notes before incorporating.

### Next
- Founder to review `notes/delta_canonical_vs_root_2026-03-09.md` and decide what to adopt
- Merge PR #11 once reviewed
- Set up git global user.name and user.email (commits currently attributed to ari@MacBookAir.net)
- Begin Sprint 1: database migrations, RLS policies, app shell, base components

### Flags
- `yl_features.md` is a good working doc but Phase 1C descriptions (recruiter access, Crew Pro full feature list) should be reconciled against `docs/canonical/yl_phase_scope.json` once delta review is done
- The 2026-03-08 warning about constitutional principles being non-negotiable has been intentionally softened — principles are now guidelines with flag-and-ask behaviour, founder makes final calls

---

## 2026-03-09 — Claude Code

### Done
- Created 5-year revenue strategy doc (`notes/5yr_plan_10m_arr.md`) — brainstorming, non-canonical
- Created `notes/` directory with README explaining it's non-critical brainstorming
- Created `docs/yl_build_plan.md` — canonical sprint-by-sprint build plan for Phase 1A (8 sprints, ~16 weeks), Phase 1B (3 sprints), and Phase 1C (4 sprints)
- Added `yl_build_plan.md` to canonical docs in `CLAUDE.md` and `AGENTS.md` startup sequences
- Updated `yl_system_state.json` status from "Pre-build" to "Building" with build plan reference
- Added build plan cross-reference in `yl_phase1_execution.md`
- Added `notes/` to repository map in `CLAUDE.md`

### Context
- Founder confirmed Phase 1A target: ship by end of June 2026 for Med season
- Build plan breaks 1A into 8 sequential sprints with clear dependencies and deliverables
- Sprints 3 (Profile) and 4 (Yacht Graph) can overlap if a second developer joins
- Revenue strategy explores path to €10M ARR via verification API + enterprise contracts (Years 3–5), but this is brainstorming only — current build is crew-side only

### Next
- Start Sprint 1: database migrations, RLS policies, Supabase Auth config, app shell, base components
- Apple Developer Account setup needed early (blocks Apple OAuth)
- Commit existing uncommitted work (Supabase client, health check) before starting Sprint 1

### Warnings
- `notes/` folder is explicitly non-canonical — do not treat strategy sketches as build requirements
- `docs/yl_build_plan.md` IS canonical — treat it as the execution sequence for current work
- The build plan references the UX spec (`yl_mobile_first_ux_spec_for_pm_v1.md`) as design source of truth — some screens in that spec (timeline, IRL interactions, messaging) are deferred and should not be built

---

## 2026-03-08 — Codex

### Done
- Rewrote the planning set around the yacht graph wedge: profile, yacht entities, attachments, colleague graph, endorsement requests, endorsements, and paid presentation upgrades
- Split the roadmap into Phase 1A / 1B / 1C and deferred recruiter access, hiring, timeline, messaging, and IRL interactions out of the current build target
- Removed the paid path to verified status and tightened monetisation language to forbid payment-based moderation power
- Added `AGENTS.md` at repo root to force a consistent Codex startup flow
- Rewrote `CLAUDE.md` into a compact operating manual that points to the canonical Phase 1A docs
- Changed startup guidance so agents read only the latest 3 `CHANGELOG.md` entries by default instead of the entire file

### Next
- Review the narrowed scope with the founder and confirm whether recruiter access stays fully deferred to Phase 1C
- Align any remaining secondary docs that still describe recruiter or timeline features as active near-term scope
- If build work starts next session, treat `docs/yl_system_state.json` and `docs/yl_phase1_execution.md` as the implementation source of truth

### Warnings
- The decision log still contains future-state recruiter and timeline decisions for later phases; treat the rewritten canonical docs as the source of truth for the current build target
- If recruiter access is reintroduced earlier, preserve the boundary that payment may buy efficiency, never trust creation, moderation power, or credibility outcomes
- `AGENTS.md` now instructs agents to read `CLAUDE.md`, the latest 3 `CHANGELOG.md` entries, `docs/yl_system_state.json`, and `docs/yl_phase1_execution.md` before substantive work

## 2026-03-08 — Claude Code

### Done
- Consolidated project structure: planning docs moved from separate `Project Files/` directory into `docs/` within the webapp repo
- Archived superseded `ops/STACK.md`, `ops/TODO.md`, `ops/test.md` to `ops/archived/`
- Created `CLAUDE.md` at repo root — operating manual for all coding agents
- Created `CHANGELOG.md` (this file) — centralized cross-agent handover log
- Replaced boilerplate `README.md` with project-specific version
- Previously: promoted vNext files (relationship model update, timeline system), archived pre-vNext originals

### Context
- Founder confirmed Phase 1 focus: presentation layer (shareable digital profile and CV for crew). This is the validated entry point — useful with zero network effects.
- Graph, endorsements, recruiter search come later as organic consequences of adoption.
- Timeline/posts/interactions system is designed (in docs) but parked — not Phase 1 launch scope.
- NLP search, conversational onboarding, multilingual support also parked.
- Prior to this session: Phases A (DNS/identity) and B (code/deployment) complete. Phase C (backend/auth) partially done — Supabase projects created, auth enabled, RLS and env var connection still pending.

### Next
- No production features built yet. Next session should focus on whatever the founder prioritizes for build start.
- Existing uncommitted changes in repo: Supabase client setup (`lib/supabase/`), API health check (`app/api/health/`), package.json updates. These should be reviewed and committed.

### Warnings
- Do not build parked features (timeline, NLP search, conversational onboarding) without explicit founder approval
- The relationship taxonomy changed: "connection" is now split into colleague (graph edge), IRL connection (graph edge), and contact (messaging only). Use current terminology.
- Constitutional principles are non-negotiable. Read `docs/yl_principles.md` before touching anything trust-related.
- `.env.local` exists with Supabase credentials — never commit this file.
