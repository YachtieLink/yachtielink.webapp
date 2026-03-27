# Profile — Activity

Append-only. Never edit existing entries. Newest at top.

When you make changes to this module, append a one-line entry with date, agent name, and what changed.

**2026-03-27** — Claude Code (Opus 4.6) (CV-Parse-Bugfix): Country flag in public profile hero via `countryToFlag()` (HeroSection + PublicProfileContent). Visibility settings link on PersonalDetailsCard. ParseProgress `initial={false}` fix in CvImportWizard. CV view: share/download buttons, overflow-x-hidden, cv_public guard on download. Cert/education inline editing in StepQualifications with stale-index decrement fix.

**2026-03-27** — Claude Code (Opus 4.6) (Sprint 10.1): Typography pass — `font-serif` on ProfileAccordion section titles and profile/network/cv/more page h1s (replacing `font-bold` to avoid synthetic bold with DM Serif Display 400). Added `itemLinks` prop to ProfileSectionGrid for per-item education edit links with `.slice(0,3)` overflow. Added `popIn` animation to nav notification badges (BottomTabBar + SidebarNav) with stable key. Added `cardHover` to SavedProfileCard (without willChange).

**2026-03-26** — Claude Code (Opus 4.6) (Wave 5 QA): Wired `isPro` prop to ProfileHeroCard via `getProStatus`. Fixed `isProFromRecord` extraction into `lib/stripe/pro.ts` (canonical pure check). Fixed non-Pro copy toast UX. Created `/app/billing` placeholder page. Corrected Pro benefits list on reserved page (removed false "Priority in crew search", "Unlimited photos" → "Extended limits", added "Cert expiry reminders").

**2026-03-26** — Claude Code (Opus 4.6) (Phase 1 Wave 4): Added `PersonalDetailsCard` component to profile page (replaces CV completeness warning). Added chip preview in `ProfileSectionGrid` for skills/hobbies sections. Extracted `useProfileSettings` hook from `ProfileSettingsPage` (445 → 185 LOC page + 115 LOC hook).

**2026-03-25** — Claude Code (Opus 4.6) (Phase 1 Wave 2): Extended `lib/queries/profile.ts` with shared query helpers (`getPublicProfileSections`, `getCvSections`, `getViewerRelationship`); added `lib/queries/types.ts` with 12 typed interfaces; updated `lib/profile-summaries.ts` to handle null `started_at` and array/object FK yacht references with `resolveYachtId` helper.

**2026-03-24** — Claude Code (Opus 4.6) (QA Rally): Fixed StrictMode double-fire in CvImportWizard (hasFiredRef guard). Added 429 rate limit banner. Documented 37 bugs from founder QA walkthrough — bugfix sprint plan written and reviewed.

---

**2026-03-23** — Claude Code (Opus 4.6, CV Parse Sprint): Profile settings page — 8 new fields (DOB, home country, smoke pref, appearance, travel docs, license, show_dob, show_home_country). Languages edit page (CRUD via API, max 10). Profile page: flag emoji + sea time in hero card, languages row, CV completeness prompt, SeaTimeSummary removed. getUserById extended with 9 new columns. show_home_country privacy enforced.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Profile page redesign — hero card (photo + name + role + URL + copy + Preview/Share buttons), profile strength card with smart CTA, 2-col section grid with toggle switches, empty states with icons replacing "Add →" hyperlinks, removed accordion sections, teal-50 full-bleed background.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Custom month/year DatePicker replacing all native date inputs; 44px checkbox tap targets for "currently working here" / "no expiry"; cert category picker with Lucide icons in 2-col grid.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Hobbies emoji auto-suggest with 60+ mappings + manual override; skills suggestion chips per category with quick-add; styled file upload replacing raw `input[type=file]`; BackButton standardized with 44px tap target across all sub-pages.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Photo drag-to-reorder with @dnd-kit; multi-upload support; photo limits enforced free 3/pro 9, gallery limits free 3/pro 15.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.3): Bug fixes — `subscription_plan` → `subscription_status` check on photo/gallery APIs; `pt-safe-top` non-existent utility replaced with `env(safe-area-inset-top)`.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.2): Section color system — unique tab colors (teal/amber/coral/navy/sand); nav refactor with shared nav-config and section-colored active states.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 A1): Built education edit page `/app/education/[id]/edit` — load, edit, save, delete with loading skeleton and not-found handling.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 G): Storage helpers — `uploadUserPhoto`, `uploadGalleryItem`, `deleteUserPhoto`, `deleteGalleryItem`, `extractStoragePath` added to `lib/storage/upload.ts`; photos/gallery pages refactored; account deletion cleans user-photos and user-gallery.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 I): `PublicProfileContent` "N more" text made functional expand buttons.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 F): Zod validation on POST `/api/profile/ai-summary`; `force: true` body param for AI summary regeneration even after manual edit.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 B): Dark mode — ProfileStrength arc colours use `--color-strength-*` CSS vars; SidebarNav badge uses `--color-error`.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 C): Animation pass — `ProfileAccordion`, `IdentityCard`, `Toast`, `BottomSheet` wired to shared motion presets; `fadeUp` on page wrappers, `staggerContainer` on card lists, `cardHover` on cards, `popIn` on badge counts.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 D): Typography — DM Serif Display applied to profile names, section headings, page titles, auth pages (weight 400, no synthetic bold).

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1, Wave 1 E): Route cleanup — `pb-8` → `pb-24` on 6 edit pages; ghost " 2" directories removed.

**2026-03-21** — Claude Code (Opus 4.6, Sprint 10.1): Created `EmptyState` component (card + inline variants); replaced 6 ad-hoc empty states; added `GET /api/user-education/[id]` route.

**2026-03-18** — Claude Code (Sonnet 4.6, post-Phase1A fixes): Fixed client-side fetch error handling in 6 files — `SectionManager.tsx` (optimistic visibility toggle + rollback), `profile/photos/page.tsx`, `profile/gallery/page.tsx`, `hobbies/edit/page.tsx`, `skills/edit/page.tsx`, `social-links/edit/page.tsx`.

**2026-03-18** — Claude Code (Sonnet 4.6, post-Phase1A fixes): Added date validation to education schema — `.refine()` ensures `ended_at >= started_at`; fixed DELETE `/api/user-education/[id]` to return 404 for non-existent/unowned records.

**2026-03-18** — Claude Code (Sonnet 4.6, post-Phase1A fixes): Hardened hobbies and skills bulk-replace APIs — snapshot existing rows before delete, restore on insert failure to prevent data loss.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): DB migration with 7 new tables (user_photos, user_gallery, profile_folders, saved_profiles, user_hobbies, user_education, user_skills), 4 new columns on users (ai_summary, ai_summary_edited, section_visibility jsonb, social_links jsonb), 12 Zod schemas.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): 6 new core components — ProfileAccordion, PhotoGallery (swipeable hero 65vh), SocialLinksRow, ProfileStrength (donut SVG), SaveProfileButton, SectionManager (toggle switches with optimistic PATCH).

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): 14 new API routes for photos, gallery, saved profiles, profile folders, hobbies, education, skills, social links, section visibility, and AI summary.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): 6 new edit pages — `/app/profile/photos`, `/app/profile/gallery`, `/app/hobbies/edit`, `/app/skills/edit`, `/app/education/new`, `/app/social-links/edit`.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): Profile page full rewrite — PhotoGallery editable with add button, ProfileStrength meter replacing WheelACard, SectionManager card, SocialLinksRow, all sections as ProfileAccordion with edit links.

**2026-03-18** — Claude Code (Opus 4.6, Phase 1A Profile Robustness): `lib/profile-summaries.ts` — server-side summary line helpers: formatSeaTime, experienceSummary, endorsementsSummary, certificationsSummary, educationSummary, hobbiesSummary, skillsSummary, gallerySummary, computeProfileStrength.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 08): OG images now use `/api/og?handle=` for public profile; EndorsementCard shows `endorserRole` below name.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 10): Public profile — added founding member badge (amber), available-for-work status (green pulse), sea time stats; `founding_member` and `subscription_status` now fetched in public profile query.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 07): Added framer-motion; created `AnimatedCard.tsx` and `ProfileCardList.tsx`; profile page cards wrapped in stagger-in animation; BottomSheet spring slide-up animation; IdentityCard QR panel with AnimatePresence height animation.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 06): Profile page parallel query performance — cached `getUserById` with React.cache(), replaced 7 sequential queries with `Promise.all`.

**2026-03-17** — Claude Code (Opus 4.6, Phase 1A Cleanup, Spec 01): Fixed theme storage key `'yl-theme'`; replaced stale CSS vars across 18+ files; floating profile CTA uses tiered logic (next milestone → request endorsements → share profile).

**2026-03-17** — Claude Code (Opus 4.6, UI/UX refresh + Salty): Created `lib/motion.ts` with shared Framer Motion presets; updated Card.tsx with shadow-sm + interactive hover lift; updated Button.tsx with refined press animation.

**2026-03-15** — Claude Code (Opus 4.6, AI Feature Registry): Added Languages section to profile — multi-select with proficiency levels (Native/Fluent/Conversational/Basic); added Native Profile Sharing as Phase 1A feature.

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 3): Built profile page with IdentityCard (photo + QR), WheelACard (5-milestone progress wheel), AboutSection, YachtsSection, CertsSection, EndorsementsSection; photo upload with react-image-crop (800px WebP), about/bio edit page, profile settings page, account page (handle live availability check + debounce).

**2026-03-14** — Claude Code (Sonnet 4.6, Sprint 3): Migration for `profile-photos` (public, 5 MB) and `cert-documents` (private, 10 MB) storage buckets with full RLS; `lib/storage/upload.ts` with uploadProfilePhoto, uploadCertDocument, getCertDocumentUrl helpers.

**2026-03-13** — Claude Code (Opus 4.6): Feature clarification session — 33 questions answered covering profile, bio, certs, photo, contact visibility, handle format, department multi-select, role list. Rewrote `docs/yl_features.md` v1.1 → v2.0 with detailed implementation specs.
