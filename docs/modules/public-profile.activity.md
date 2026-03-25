# Public Profile — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

**2026-03-25** — Claude Code (Opus 4.6) (Phase 1 Wave 2): Major refactor — extracted shared query helpers (getPublicProfileSections, getCvSections, getViewerRelationship), split PublicProfileContent into 5 section components, replaced all any[] with typed interfaces, added hero age+sea time, fixed CV 404 (cv_public null semantics), fixed available_for_work missing from getUserByHandle.

**2026-03-24** — Claude Code (Opus 4.6) (QA Rally): Documented 8 bugs on public profile — missing age/sea time/flag in hero, CV view 404/blank/horizontal scroll, yacht names not clickable, no ensign flags. Bugfix sprint Wave 2 covers all.

---

**2026-03-23** — Claude Code (Opus 4.6, CV Parse Sprint): Public CV viewer at /u/[handle]/cv (generated HTML via CvPreview or uploaded PDF iframe, gated by cv_public). PublicProfileContent "View CV" + download icon split replacing single download link. getUserByHandle extended with new personal fields (excluding dob due to column-level REVOKE). show_home_country + show_dob privacy respected in CvPreview viewer mode.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Public profile hero identity — larger name (text-4xl), unified "Role · Dept" line; top bar with icon-only circular buttons (back/edit/share) replacing labelled pills.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1): `PublicProfileContent` "N more" text made functional expand buttons.

**2026-03-18** — Claude Code (Sonnet 4.6, post-Phase1A fixes): Fixed mutual endorser count bug — `PublicProfileContent.tsx` was returning all endorsements when any shared yacht existed; now correctly counts only endorsers in the mutual colleague set.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): Public profile `/u/[handle]` full rewrite — Bumble-style split layout (photo left 40% sticky on desktop, content right), accordion sections with smart summaries, save button for logged-in viewers, sectionVisibility respected (empty + hidden = don't render), social links row, extended data sections (hobbies, education, skills, gallery).

**2026-03-17** — Claude Code (Sonnet 4.6, pre-merge audit): Fixed `app/api/cv/generate-pdf/route.ts` — `isPro: false` → `isPro: profile?.subscription_status === 'pro'`; was hardcoded false since Sprint 8, all users got free PDF tier regardless of plan.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 08): Created `app/api/og/route.tsx` — dynamic OG image generation (edge runtime, teal gradient, photo + name + role); OG images now use `/api/og?handle=` instead of raw photo URLs; public profile signup CTA section for non-logged-in viewers; branding footer linking to /welcome.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 10): Public profile — added founding member badge (amber), available-for-work status (green pulse), sea time stats.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup): Public profile CTAs reworked — not logged in: dual CTAs (build own profile + sign in to see connection); logged in own profile: "Back to dashboard"; logged in other profile: "Back to my profile".

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 06): Public profile container widened — `max-w-[640px] lg:max-w-4xl`, two-column grid at `lg:` breakpoint.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 06): Cached `getUserByHandle` between `generateMetadata` and page render; parallel section fetches.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 6): Public profile page full rewrite — server-rendered, parallel data fetch, all sections (hero, about, contact with visibility, employment history, certs with expiry status, endorsements, QR code); `generateMetadata` with OG + Twitter card tags.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 6): Created `components/public/PublicProfileContent.tsx` — shared component used by both `/u/:handle` and `/app/cv`; `components/public/EndorsementCard.tsx` with collapsible 150-char truncation.

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): CV tab rewrite — profile preview + actions via `CvActions.tsx` (share link, PDF generate/download/regenerate, CV upload link, QR code toggle/download, template selector with Pro lock).

**2026-03-15** — Claude Code (Opus 4.6, Sprint 7): Custom subdomain routing — middleware detects `*.yachtie.link` (excluding apex + www), rewrites to `/u/{subdomain}`; only the UI badge is gated to Pro.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 1): Built public route shells — `/u/[handle]` (public profile) and `/r/[token]` (endorsement deep link stub).
