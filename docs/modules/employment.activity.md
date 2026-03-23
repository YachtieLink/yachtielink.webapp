# Employment — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

---

**2026-03-23** — Claude Code (Opus 4.6, CV Parse Sprint): Attachment edit — 4 new fields (employment_type, yacht_program, description w/ 2000 char counter, cruising_area). Cert edit — issuing_body field. CvUploadClient rewritten with two-button split. 5-step import wizard with yacht cards, skip/edit, celebration screen. saveConfirmedImport() with yacht search→create, cert type matching, batch operations. PDF templates enhanced with builder, program, description, cruising area per employment + issuing body per cert. CvPreview HTML component + owner preview + public CV viewer routes. CvActions preview link added.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): CV page bento button hierarchy — Share primary, Generate/Upload secondary, QR/Edit ghost; lock icons on Pro templates; router.push replacing window.location.href.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): `profile_queries.ts` extended — `getExtendedProfileSections()`, `getEndorserRoleOnYacht()` added to support new employment context on public profile.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 01): Fixed Wizard.tsx — `yachtielink.com` → `yachtie.link`, `Audience tab` → `Network tab`.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4 pre-planning): Decided yacht merging deferred to Phase 2 — invest in creation-time duplicate prevention instead; single cover photo per yacht in Sprint 4 (attachment-gated); updated docs for Sprint 4 scope.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Migration `20260314000011_yacht_sprint4.sql` — `cover_photo_url` on yachts, `yacht_near_miss_log` table, `search_yachts` fuzzy RPC (trigram, 0.45 threshold), `yacht-photos` storage bucket (public, 5 MB, crew-attachment-gated RLS).

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Built `YachtPicker.tsx` — search+create with duplicate detection; fuzzy match on create shows BottomSheet with candidates; logs near-miss to `yacht_near_miss_log`.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Built `app/attachment/new` — 3-step flow: YachtPicker → role picker (dept filter + search + custom fallback) → dates.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Built `app/attachment/[id]/edit` — pre-filled edit of role/dates, soft-delete with double-confirm.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Built `app/yacht/[id]` — yacht detail with cover photo (attachment-gated upload CTA), metadata, crew count, crew list with avatars.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Built `app/yacht/[id]/photo` — cover photo upload (upsert to `yacht-photos`, saves CDN URL to `yachts.cover_photo_url`).

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 4): Fixed `YachtsSection` — `/u/:yacht_id` → `/app/yacht/:yacht_id` link correction.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 3): Built `YachtsSection` component — reverse-chronological attachment list, expand to view yacht / request endorsements / edit attachment.

**2026-03-13** — Claude Code (Sonnet 4.6, Sprint 1): Core schema — `yachts` table (yacht_type: 'Motor Yacht'/'Sailing Yacht', length, flag_state, year_built), `attachments` table (role_label for "Other" entries); DB functions `are_coworkers`, `are_coworkers_on_yacht`, `yacht_crew_count`, `get_yacht_crew_threshold`, `check_yacht_established`, `get_colleagues`; seeded 7 departments and 56 roles across 8 departments.

**2026-03-13** — Claude Code (Opus 4.6): Feature spec — yacht type limited to Motor Yacht / Sailing Yacht, length in exact metres, flag state dropdown, year built optional; endorsement signals from yacht history deferred to Phase 1B.
