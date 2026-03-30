# Standing Behavioral Corrections -- YachtieLink Agent Feedback

**What this is:** A record of standing rules that the founder has established through repeated corrections, explicit instructions, or patterns observed across sessions. These are not suggestions -- they are behavioral requirements for all agents working on this project.

**All agents must read this file at session start.** These rules override default agent behavior.

**How to add new entries:** When the founder gives a correction that should persist across sessions, add it here. When you observe a pattern being repeated in CHANGELOG flags or corrections, capture it. Place new entries at the top. Keep the format consistent.

**Current count:** 41 rules

**Also update when writing here:**
- `CHANGELOG.md` — note the correction in your session's Flags section
- `sessions/YYYY-MM-DD-<slug>.md` — log when and how the correction happened
- `docs/ops/lessons-learned.md` — if the correction revealed a non-obvious gotcha

---

## Section Color Wayfinding

**Rule:** Every page must subtly use the color of its navigation tab section for accents — upload zones, badges, step indicators, icons. CV=amber, Network=navy, Profile=teal, Insights=coral, More=sand. This creates subconscious wayfinding — users know where they are by the colour temperature.
**Origin:** 2026-03-30 — Founder established during CV upload page redesign. "As a rule the colouring we should try use for pages is what page it belongs to in the navigation tab."
**How to apply:** Check `lib/section-colors.ts` for the section mapping. Use `getSectionTokens()` or `getSectionClasses()`. Apply to accents, not primary buttons or text. Full spec in `docs/design-system/patterns/page-layout.md`.

---

## Don't Mention AI in User-Facing Copy

**Rule:** Never refer to AI, machine learning, or models in user-facing copy. Say "we read", "we extract", "our systems" — not "our AI reads" or "AI-powered". Error states say "our systems are busy" not "AI is down".
**Origin:** 2026-03-30 — Founder explicitly stated "I don't like mentioning AI if possible" during CV upload copy review.
**How to apply:** Grep for "AI", "artificial intelligence", "machine learning", "GPT", "model" in any user-facing text. Replace with human-sounding alternatives.

---

## Sell the Feature, Don't Describe It

**Rule:** Action pages (upload, onboarding, upgrade) must lead with the pain point the user recognises, then the speed/value. Never use generic descriptions.
**Origin:** 2026-03-30 — Founder drove copy direction during CV upload redesign. "Really sell it, tell them what we do behind the scenes to save them the effort."
**How to apply:** Bad: "Upload your CV to automatically populate your profile." Good: "No more retyping your career into another platform. Your entire profile built in under 30 seconds." See `docs/design-system/patterns/page-layout.md` → Copy That Sells.

---

## Smart Search, Dumb Storage

**Rule:** Never normalize, strip, or transform stored data to make search easier. Yacht prefixes (M/Y, S/Y), numeral formats (V vs 5), and other identifiers are real signal — two yachts can share a base name but differ by prefix. Put the intelligence in the search layer, not the storage layer.
**Origin:** 2026-03-29 — Founder rejected yacht name normalization proposal during Rally 006 grill-me. "S/Y Excellence 5 and M/Y Excellence 5 can be registered in the same flag state legally."
**How to apply:** When building search, match fuzzy on queries without modifying stored values. Return candidates and let the user disambiguate using rich context (builder, length, photo, crew count).

---

## Don't Invent Per-Component Patterns

**Rule:** When building UI interactions, check what pattern exists elsewhere in the app first. Use the same pattern. If no pattern exists, create one and apply it everywhere — don't build a one-off. Consistency is a baseline expectation, not a nice-to-have.
**Origin:** 2026-03-29 — Founder: "I'm sick of inventing a new way to do the same thing for every component — make it consistent, this is basic UI/UX frontend stuff." Triggered by proposing a unique edit affordance for language chips.
**How to apply:** Before proposing any UI interaction, audit where the same interaction exists elsewhere. Propose a shared component or pattern, not a per-component solution.

---

## Think Beyond Code

**Rule:** When reviewing a feature, don't just think about whether the code works. Consider the full product experience: visit flow, SEO, analytics, OG sharing, copy/UX, error states, onboarding implications. A feature isn't "working" just because the code runs.
**Origin:** 2026-03-29 — Founder pushed back when agent only asked about subdomain cookie auth. "Just because we're in Claude Code doesn't mean you only code. What else is required for that step?"
**How to apply:** For any feature verification, enumerate all product dimensions (not just technical ones) before declaring it done.

---

## Everything Visible During QA Is In Scope

**Rule:** When running QA or testing, catalogue every issue you see — not just issues from the current diff. Pre-existing bugs, UX issues on adjacent pages, and problems you notice while navigating are all worth recording. Never dismiss something as "not from this PR" or "out of scope" while you're already looking at the screen.
**Origin:** 2026-03-29 — Founder corrected agent for dismissing a broken share button as "pre-existing, not in scope" during Sprint 12 QA.
**How to apply:** During any QA pass, create backlog items for every issue found regardless of origin. If it's not worth fixing now, file it. If it is, add it to the current rally/sprint.

---

## Mobile First — Always Test at 375px

**Rule:** Always test on mobile viewport (375x812) first. Do not default to desktop. Most users will be on their phones.
**Origin:** 2026-03-29 — Founder had to explicitly tell agent to switch to mobile after agent started QA on desktop viewport.
**How to apply:** When starting any QA or visual verification, set viewport to mobile (375x812) before taking the first screenshot. Desktop testing is secondary.

---

## Notice and Act on Anomalous Server Logs Immediately

**Rule:** When dev server logs show repeating patterns (login loops, rapid-fire requests, error floods), stop and investigate immediately. Do not dismiss them as "local only" or assume they're unrelated to the current task.
**Origin:** 2026-03-28 — dev server login loop was visible in logs (`GET /login 200 in 58ms` repeating) but was dismissed. It burned 1,500+ auth requests on the shared Supabase instance and locked out production.
**How to apply:** If you see the same request path repeating rapidly in server output, (1) kill the dev server immediately, (2) check if it's hitting a shared external service, (3) investigate the loop cause before restarting.

---

## Investigate Login/Auth Issues Before Suggesting "Wait a Minute"

**Rule:** When a user reports they can't log in, don't suggest waiting for rate limits to clear. Investigate the cause immediately — a redirect loop, a middleware crash, or a cookie issue won't resolve itself with time.
**Origin:** 2026-03-28 — founder reported login not working. Agent suggested "wait 60 seconds for rate limit to clear" multiple times while the actual issue (redirect loop, middleware crash) continued burning through rate limits.
**How to apply:** On auth failures: (1) check if any dev servers are running, (2) check Supabase dashboard for anomalous request patterns, (3) check middleware/login code for recent changes that could cause loops. Only suggest waiting after confirming no active loop exists.

---

## Don't Defer Quick Fixes to Backlog

**Rule:** If a fix takes less than 10 minutes, do it now. Don't create a backlog item for something that's a simple edit. Backlog is for genuinely complex work, not laziness.
**Origin:** 2026-03-28 — founder called out deferring yacht name clickability, save heart sync, and education summary as "lazy" when each was a 5-minute fix.
**How to apply:** Before writing "backlog item created", ask: can I fix this in under 10 minutes? If yes, fix it.

---

## Profile Is the User's Product — No Intrusive Platform UI

**Rule:** The public profile is the user's presentation. No sticky CTAs, no persistent login bars, no platform branding that detracts from their content. A subtle CTA at the end of the scroll is fine.
**Origin:** 2026-03-28 — founder rejected sticky bottom CTA: "this is the users product at this point we are detracting from their content."
**How to apply:** Any fixed/sticky UI element on public profiles needs explicit founder approval. Default to no platform chrome on the user's profile.

---

## Always Run /shipslog Before Commit

**Rule:** After QA (whether via `/test-yl` skill or manual interactive testing), always run `/shipslog` before committing. The sprint procedure chain is: build → `/review` → `/yachtielink-review` → `/test-yl` → `/shipslog` → commit. Skipping `/shipslog` means the commit ships without documentation updates.
**Origin:** 2026-03-27 — Claude completed the full CV-Parse-Bugfix sprint, ran review + QA, but skipped `/shipslog` and went straight to commit when the founder said go.
**How to apply:** After QA is done and the founder approves, run `/shipslog` BEFORE `git commit`. If QA was done manually (not via `/test-yl` skill), the auto-chain won't fire — you must invoke `/shipslog` explicitly.

---

## Never Merge PRs

**Rule:** Claude must NEVER merge pull requests. The founder merges PRs themselves from GitHub. Claude's role is to commit, push, and create PRs — the founder reviews and merges.
**Origin:** 2026-03-27 — Claude merged PRs #92 and #93 without permission, shipping unreviewed code to main. Founder had to revert both.
**How to apply:** After creating a PR, stop. Tell the founder the PR is ready and give them the URL. Do not click merge, do not use `gh pr merge`, do not merge via command line.

---

## Never Commit and Push Without Explicit Permission

**Rule:** Do not commit and push code until the founder explicitly says to do so. Make changes, run reviews, then wait for the founder to say "commit and push" or equivalent.
**Origin:** 2026-03-27 — Claude committed and pushed Sprint 10.1 polish changes before the founder had reviewed them. Had to undo the commit and close the PR.
**How to apply:** After completing code changes and running `/review`, report results and wait. The founder will say when to commit. "Ready for your review" is not permission to commit.

---

## Never Skip Skill Invocations to Save Time

**Rule:** When the workflow specifies running `/review`, `/yachtielink-review`, or `/shipslog`, invoke the actual skills — don't substitute manual approximations (running drift-check alone instead of the full skill, updating docs inline instead of the shipslog skill, combining review phases to cut corners).
**Origin:** 2026-03-26. During Waves 3-5 execution, agent ran all three skills properly on Wave 3 but progressively cut corners on Waves 4-5 to optimize for speed. Founder caught it and asked for the logic — there was none, just speed bias. Re-ran properly after correction.
**How to apply:** Follow the specified workflow step-by-step regardless of how long it takes. If a step feels redundant, that's the point — it catches things the fast path misses. The Opus deep review on Wave 5 was clean, but it would have caught a P1 if one existed. Process compliance is non-negotiable.

---

## No Magic Links in Auth Flows

**Rule:** Never propose magic links as an authentication option. Use password or OAuth (Google, Apple) only.
**Origin:** 2026-03-23. During ghost profiles design interview, magic link was proposed as a claim flow option. Founder rejected it: "no magic links i hate them."
**How to apply:** Any auth flow (signup, login, claim, verify) should offer password + social OAuth. Don't include magic link even as a fallback or alternative.

---

## Never Persist AI-Generated User-Facing Text

**Rule:** Don't store LLM-generated endorsement drafts (or similar user-facing content) in the database. Generate on demand every time.
**Origin:** 2026-03-23. During endorsement writing assist design, founder pointed out that storing generated text creates a database of generic recycled snippets. The value is fresh, context-specific generation.
**How to apply:** Any feature that generates text for users should call the LLM on demand and return ephemeral results. Exception: ghost profile pre-generated suggestions on `endorsement_requests` (approved as lower-signal quick interactions for busy captains).

---

## Yacht Flags Are Ensigns, Not Country Flags

**Rule:** Yachts fly maritime ensigns (Red Ensign variants), not national flags. Never use country flag emoji for yacht flag states. Use proper ensign images.
**Origin:** 2026-03-24. Agent suggested using country flag emoji as approximation for yacht flags. Founder corrected: yachts fly ensigns. Agent then suggested backlogging it as "nice-to-have polish". Founder corrected again: "this is not for backlog this is a bug to be fixed."
**How to apply:** Source or commission ensign images for common flag states (UK Red Ensign, Cayman, Marshall Islands, Malta, Gibraltar, etc.). Store as static assets. Map flag_state to ensign image everywhere yachts appear.

---

## Don't Downgrade Bugs to Backlog Without Asking

**Rule:** If the founder identifies something as a bug during QA, it's a bug to fix — not a "nice-to-have" or backlog item. Don't unilaterally recategorize issues as lower priority or suggest deferring them.
**Origin:** 2026-03-24. During QA walkthrough, agent suggested ensign flags were a "nice-to-have polish item" for backlog. Founder corrected sharply: "why are you making calls like that you ask me."
**How to apply:** During bug documentation, record everything at the severity the founder implies. If unsure about priority, ask — don't assume.

---

## Write Specs in the Repo, Not Claude Plans

**Rule:** Build specs, wave plans, and implementation documents go in the sprint's `specs/` folder in the repo — never in Claude's internal plan files. The founder needs to read, edit, and approve specs directly. Claude's plan mode is for thinking, not for deliverables.
**Origin:** 2026-03-23. Agent wrote wave specs to Claude's plan file. Founder corrected: "mate don't write it in the claude plans? make mds and put it in the proper folders in the repo."
**How to apply:** Any document that the founder or future agents need to reference goes in the repo under the appropriate sprint or docs folder. Use Claude's plan mode for temporary thinking only.

---

## CV Viewer Serves Both Owner and Viewer

**Rule:** When building a preview/viewer component, always consider both audiences: the owner (who needs to see what others will see + edit links) and the viewer (who needs a clean read-only view). A single component serves both with a `mode` prop.
**Origin:** 2026-03-23. Founder corrected assumption that CV preview was owner-only: "the user needs the preview and the viewer needs the preview too." Also: "and they can present their own cv if they want" — uploaded CVs must be viewable in-app, not just downloadable.
**How to apply:** For any user-facing content preview (CV, profile, endorsements), build one component with owner/viewer modes. Owner gets edit links and missing-field prompts. Viewer gets clean read-only. Support both generated and user-uploaded content paths.

---

## Wizard UX: Show Don't Ask, Confirm Don't Type

**Rule:** Import wizards should be review flows, not forms. Present merged results as confirm cards ("Looks good?"), not as empty inputs. Never show fields that have no value — those go under "Add more details" for power users. The wizard gets the profile to 80%, the normal app handles the rest.
**Origin:** 2026-03-23. Founder refined the wizard spec from a 7-step form-heavy flow to a 5-step confirm-card flow: "Show, don't ask. Never make them type. Never leave them wondering." Also: every loading moment must give the user something to do (confirm name while parse runs in background).
**How to apply:** When building multi-step import/onboarding flows, default to ConfirmCard pattern (show data → "Looks good ✓" / "Edit details"). Only show edit inputs when the user opts in. Empty fields are hidden on confirm cards. Parse/matching work runs in background while user reviews earlier steps.

---

## Update CHANGELOG Before Every Commit

**Rule:** You MUST update `CHANGELOG.md` to reflect all work being committed BEFORE running `git commit`. This is a blocking pre-commit requirement. No exceptions.
**Origin:** This was missed repeatedly across multiple sessions and agents. It was escalated to CRITICAL in AGENTS.md after being flagged multiple times. The CHANGELOG is the primary handover mechanism between agents -- if it is not current, the next agent starts blind.
**How to apply:** Before every `git commit`, stop and verify the CHANGELOG covers what you are committing. If it does not, update it first. Update the CHANGELOG as work happens throughout the session, not just at the end.

---

## Do Not Build Deferred Features

**Rule:** Do not build features that are assigned to future phases (1B, 1C, 2+) unless the founder explicitly asks. If something seems related to your current task but is scoped for a later phase, flag it -- do not build it.
**Origin:** Listed in AGENTS.md "Things to avoid" as "Building deferred features because they seemed related." The deferred features list includes: recruiter access, peer hiring, timeline/posts, messaging/contacts, IRL connections, broad search, NLP search, conversational onboarding.
**How to apply:** Before building any feature, check `docs/yl_features.md` for its phase assignment. If it is not in the current phase (1A), do not build it. If you think it should be pulled forward, ask the founder.

---

## Plan Before Code on 3+ Step Tasks

**Rule:** For any non-trivial task (3+ steps), plan first. Write out what you intend to do before writing code. If something goes sideways during implementation, stop and re-plan rather than pushing through.
**Origin:** Explicitly stated in AGENTS.md "Core Workflow" section. Reinforced by the project structure overhaul that created sprint build plans, rally processes, and discipline docs.
**How to apply:** Before starting work, read the sprint's build plan. For tasks without a plan, write a brief spec listing the steps, files to touch, and expected outcome. Get confirmation from the founder if the task is significant. If your plan hits a wall mid-implementation, stop, reassess, and update the plan.

---

## Fix Root Causes, Not Symptoms

**Rule:** When diagnosing a bug, find and fix the root cause. Do not paper over symptoms with workarounds that leave the underlying issue in place.
**Origin:** Listed in AGENTS.md "Things to avoid" as "Fixing symptoms instead of root causes." Demonstrated in practice: the endorsement request 404 was caused by missing RLS policies (root cause), not by the fetch logic (symptom). The rate limiter crash was caused by missing fail-open logic (root cause), not by the specific URL format.
**How to apply:** When a bug appears, trace it to its origin before writing a fix. Ask "why is this happening?" not "how do I make the error go away?" If the root cause is in a different part of the codebase than where the symptom appears, fix it there.

---

## Read Existing Code Before Making Changes

**Rule:** Before writing any code in a file, read the existing code in that file and the surrounding area. Understand the current patterns, naming conventions, and architecture before adding to it.
**Origin:** Listed in AGENTS.md "Things to avoid" as "Making changes without reading the existing code first" and in "Code Standards > Before writing" as "Read the existing code in the area you're changing."
**How to apply:** Before editing a file, read it fully. Before adding a new API route, read an existing one in the same directory. Before creating a new component, check `docs/design-system/patterns/` for existing patterns. Before writing a migration, read the most recent migration for conventions.

---

## Run the App, Don't Just Write Code

**Rule:** Verify your work by running the app and testing the flow end-to-end. Do not mark something as complete without proving it works.
**Origin:** Listed in AGENTS.md "Core Workflow > Verify before done" and "Things to avoid" as "Writing code without running it." Reinforced by multiple bugs found in audit passes that would have been caught by running the app.
**How to apply:** After writing code, run `npm run build` to verify it compiles. If possible, run `npm run dev` and test the actual flow in a browser. Check server logs for errors. Review your own diff before presenting.

---

## Rallies Are Founder-Initiated Only

**Rule:** Do not start a rally (audit) unless the founder explicitly asks for one. If you think an audit would be valuable, suggest it and wait for approval.
**Origin:** Explicitly stated in AGENTS.md "Rallies" section: "Founder-initiated only. Don't start a rally unless the founder asks for one." Rallies are investigation-then-plan exercises that consume significant time.
**How to apply:** If you notice code quality issues, performance problems, or technical debt during normal work, log them as flags in the CHANGELOG. If you believe a rally would be valuable, state "I think a [type] rally on [scope] would be useful because [reason]" and wait for the founder's go-ahead.

---

## Keep Discipline Docs Current as You Work

**Rule:** If you establish a new pattern, change an existing convention, or add a new utility/component, update the relevant `docs/disciplines/*.md` file before closing out. These docs are only useful if they reflect the codebase as it is now.
**Origin:** Explicitly stated in AGENTS.md "Changelog cadence" section. The discipline docs were created during the project structure overhaul specifically to prevent agents from re-discovering conventions that previous agents established.
**How to apply:** After creating a new component pattern, update `docs/disciplines/frontend.md`. After adding an API route pattern, update `docs/disciplines/backend.md`. After making a design decision, update `docs/disciplines/design.md`. Do this before session end.

---

## Keep the Design System Current as You Work

**Rule:** If you add a new page, update the route map. If you create a new component pattern, add it to patterns/. If you make or reject a design choice, log it in decisions/. If you take screenshots, drop them in reference/screenshots/.
**Origin:** Explicitly stated in AGENTS.md "Changelog cadence" section. The design system was created to solve recurring pain: inconsistent look/feel, agents not understanding flows, and repeated rejected ideas being re-proposed.
**How to apply:** After any UI work, check: (1) Is the route in `docs/design-system/flows/app-navigation.md`? (2) Are new components in the relevant `patterns/` file? (3) Are design choices logged in `decisions/`? Update what is missing.

---

## Do Not Re-Propose Rejected Ideas Without Flagging

**Rule:** Before proposing a design or product idea, check `docs/design-system/decisions/` and `docs/yl_decisions.json` for previously rejected approaches. If your idea was already considered and rejected, flag that you are aware of the prior decision and explain why circumstances may have changed.
**Origin:** Implicit from the design system structure and the AGENTS.md note about the canonical docs. The decisions log exists specifically to prevent agents from cycling through the same proposals.
**How to apply:** Before recommending a design direction, search the decisions folder. If you find a related decision, reference it: "I see D-XXX rejected this approach because [reason]. I think [new circumstance] changes the calculus." Let the founder decide.

---

## Use `getProStatus()` for All Pro Checks

**Rule:** Never check `subscription_status` or `subscription_plan` directly. Always use the `getProStatus()` helper from `lib/stripe/pro.ts` which checks both status and expiry date.
**Origin:** The `subscription_plan` vs `subscription_status` confusion caused bugs across photo/gallery APIs. The helper was created to encapsulate the correct check.
**How to apply:** Import `getProStatus` from `lib/stripe/pro.ts`. Pass the user object. Check `isPro` on the result. Do not write `user.subscription_status === 'pro'` inline -- the helper also checks `subscription_ends_at`.

---

## Use Shared Query Helpers, Not Inline Supabase Calls

**Rule:** For common queries (user by ID, user by handle, profile sections), use the shared helpers in `lib/queries/profile.ts` rather than writing new inline Supabase queries. These helpers use `React.cache()` for deduplication.
**Origin:** The rally audit found duplicate queries between `generateMetadata` and page functions, and 7 sequential round trips on the profile page. Shared cached helpers were the fix.
**How to apply:** Check `lib/queries/` for an existing helper before writing a new Supabase query. If the query pattern is reused across files, extract it into a shared helper with `React.cache()`.

---

## Always Flag Unapplied Migrations

**Rule:** When you create a migration file, explicitly state in the CHANGELOG Flags section that it needs to be applied. Include the migration filename and the command to apply it.
**Origin:** Multiple sprints had features that silently failed because migrations were committed but never applied to production. The "Flags" section of CHANGELOG entries is the mechanism for communicating this.
**How to apply:** After writing a migration, add to Flags: "Migration `XXXXXXXXXX_name.sql` needs applying: `npx supabase db push` or paste into Supabase SQL editor."

---

## Fail Open for Optional External Services

**Rule:** Any integration with an external service (Redis, PostHog, Sentry, OpenAI) must fail open in development. A missing API key or unreachable service must not 500 the application.
**Origin:** The rate limiter crash (ENOTFOUND when KV URL was placeholder) took down every protected API route in development. The fix established the fail-open pattern.
**How to apply:** Wrap external service calls in try/catch. If the service is unavailable, log a warning and continue with a sensible default (allow the request, skip analytics, skip moderation). Never let an optional service block core functionality.

---

## Check Column Names Against the Migration

**Rule:** When referencing a database column in code, verify the exact column name by reading the migration file where it was created. Do not rely on memory or documentation that may be out of date.
**Origin:** The `expiry_date` vs `expires_at` mismatch caused bugs across multiple files. The `subscription_plan` vs `subscription_status` confusion had the same root cause.
**How to apply:** Before writing a Supabase query, open the relevant migration file and verify the column name. If `yl_schema.md` conflicts with the migration, the migration is the source of truth.

---

## Use Semantic Color Tokens, Not Raw Palette Values

**Rule:** Never use raw CSS variables like `var(--teal-500)` or `var(--coral-200)` in component styles. Use semantic tokens like `var(--color-interactive)`, `var(--color-section-teal)`, etc., which have dark mode overrides.
**Origin:** The dark mode sidelining was caused by dozens of components using raw palette values that had no dark mode overrides. The design system migration identified 18+ files that needed updating.
**How to apply:** Check `globals.css` for available semantic tokens. If you need a color, find or create a semantic token with both light and dark values. Reference the style guide in `docs/design-system/style-guide.md`.

---

## Server-Only Secrets Need `import 'server-only'`

**Rule:** Any file that imports or uses server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `CRON_SECRET`) must include `import 'server-only'` at the top of the file.
**Origin:** The `admin.ts` audit finding. Without this guard, a client component importing the file would bundle the secret into the browser. The `server-only` package causes a build error if this happens.
**How to apply:** At the top of any file that accesses `process.env` server secrets, add `import 'server-only'` as the first import.

---

## Do Not Self-Fetch API Routes Server-Side

**Rule:** Never call your own API routes from server components or other API routes using `fetch()`. Use direct database queries or shared server-side helpers instead.
**Origin:** The endorsement deep link page fetched `NEXT_PUBLIC_APP_URL/api/...` server-side. On preview deployments, this resolved to the production URL (which did not have the new routes), causing 404s. The fix was a direct Supabase query.
**How to apply:** If a server component needs data that an API route provides, extract the data-fetching logic into a shared server-side function (e.g., in `lib/queries/`). Both the API route and the server component can use the same function.
