# Sprint 11 — CV Onboarding Rebuild + Public Polish

**Phase:** 1B
**Priority:** P0 — core user journey, direct path to profile population
**Status:** 📋 Ready for execution
**Runs after:** Sprint 10.1 complete, Sprint CV-Parse-Bugfix complete
**Runs before:** Sprint 12 (Yacht graph)
**Estimated effort:** 5–7 days
**Type:** Feature sprint — redesign onboarding to be one-file-drop or two-input minimal

---

## Why This Sprint Exists

Current onboarding is 6 steps: name → handle → role → yachts → endorsements → profile preview. Users must manually fill in or confirm every field. With CV parsing now mature and bugfixes from the previous sprint, we can collapse this to a **fork:**

- **CV path:** Drop file → parsing → auto-handle → done (one screen, ~5-8s load)
- **Manual path:** Name → handle → empty profile (two inputs, minimal friction)

This sprint rebuilds onboarding around this fork. New users either get an instant populated profile (CV path) or the fastest possible manual entry (no endorsements, no role selection — those come contextually later).

---

## Scope

### In — Core Onboarding Redesign

**A. CV Upload Fork** (centrepiece)
- New onboarding step: `StepCvUpload` — drag-drop area, file validation, upload + parse + auto-handle in parallel
- Auto-handle generation: call `suggest_handles` RPC, validate with `handle_available`, save as `users.handle`
- Shared save utility: `lib/cv/save-parsed-cv-data.ts` (from Sprint CV-Parse-Bugfix) used for both onboarding and standalone CV flow
- Error fallback: parse fails or rate limit → skip to manual path (name → handle)
- Delete `/app/onboarding/role`, `/app/onboarding/yachts`, `/app/onboarding/endorsements` steps
- Onboarding steps: `["cv-upload", "name", "handle", "done"]` (CV path skips name+handle)

**B. CvReviewClient Refactor**
- Standalone `/app/cv/upload` + `/app/cv/review` unchanged (still work)
- `CvReviewClient` now uses shared `lib/cv/save-parsed-cv-data.ts` (instead of own save logic)
- Reduces duplication between onboarding and standalone flows

**C. Section Colours on Public Profile** (visual polish)
- `accentColor` prop on ProfileAccordion (About, Experience, Yachts, Certs, Languages, etc.)
- Thread colour through 6 of 8 public profile sections
- Dark mode 700-level overrides for each colour
- EmptyState component respects `accentColor`

**D. Public Profile Motion Polish**
- Staggered card animations on endorsements list
- Hover effects on endorsement cards (interactive feel)
- Entrance animations: `fadeUp`, `staggerContainer` on page load

**E. OG Image Enhancement**
- Meta tags: DM Serif Display font, profile photo layout, branding (logo, gradient background)
- Shared OG generator utility (used by profile routes)
- Test on social platforms (Twitter, LinkedIn, Slack)

**F. QR Code Polish**
- Branded card design around QR code on public profile
- PNG download button (no auth required, free tier)
- Link points to public profile — shareable

### Out — Deferred

- Salty mascot (Phase 2/3 scope)
- Profile templates (Pro-gated, deferred to Phase 2)
- Onboarding endorsement requests (contextual, post-launch)
- Native contact access (Phase 2+)
- Own-profile section colours (future design pass)

---

## Dependencies

- **Sprint 10.1 complete** (Phase 1A closed, EmptyState component exists)
- **Sprint CV-Parse-Bugfix complete** (37 bugs fixed, data integrity solid)
- **Shared save utility:** `lib/cv/save-parsed-cv-data.ts` (from bugfix sprint, ready to reuse)
- **RPC:** `suggest_handles()` exists (auto-generate handle candidates)
- **RPC:** `handle_available()` exists (validate handle availability)

---

## Key Deliverables

### A. Onboarding Steps Rebuild

**New flow:**
```
Onboarding Start
    ├─ StepCvUpload — "Drop your CV or skip"
    │   ├─ If drop: upload + parse + auto-handle + save → done
    │   └─ If skip: continue to manual path
    ├─ StepName — "What's your full name?" (skipped if CV dropped)
    ├─ StepHandle — "Choose your YachtieLink username" (skipped if CV dropped)
    └─ StepDone — "You're all set!"
            ├─ CV path: populated profile waiting at /app/profile
            └─ Manual path: empty profile, fill in details later
```

**Implementation:**
- ⬜ Create `components/onboarding/StepCvUpload.tsx` — drag-drop, file validation (PDF/DOCX only), upload handler
- ⬜ Upload handler: upload file → call parse RPC → get extracted data → call `suggest_handles` → validate availability → auto-fill handle
- ⬜ Handle availability polling: check status every 500ms (max 30s timeout)
- ⬜ Error UI: "Parsing failed or rate limited" → offer skip to manual path
- ⬜ Update `app/(auth)/onboarding/page.tsx` to use new steps array
- ⬜ Refactor `steps` logic to skip name+handle if CV path taken
- ⬜ Delete `/app/onboarding/role`, `/app/onboarding/yachts`, `/app/onboarding/endorsements` directories
- ⬜ Update nav/routing to omit deleted steps

### B. CvReviewClient Refactor

- ⬜ Import and use `lib/cv/save-parsed-cv-data.ts` instead of own save logic
- ⬜ Consolidate duplicate save paths (onboarding, standalone CV, settings CV update)
- ⬜ Testing: verify standalone `/app/cv/upload` + `/app/cv/review` still work identically

### C. Section Colours on Public Profile

- ⬜ Add `accentColor?: 'about' | 'experience' | 'yachts' | 'certs' | 'languages' | 'endorsements'` prop to `ProfileAccordion`
- ⬜ Map to CSS custom properties: `--section-accent-{color}` (already defined in globals.css per Sprint 10.1)
- ⬜ Apply colour to: accordion header background, section icon, accent line
- ⬜ Dark mode: 700-level overrides in globals.css (already exists)
- ⬜ Apply to 6 sections on public profile: About, Experience, Yachts, Certs, Languages, Endorsements
- ⬜ EmptyState component: inherit `accentColor` from parent (already built in Sprint 10.1)

### D. Motion Polish

- ⬜ Endorsement cards: stagger on list load (`staggerContainer` + `cardHover`)
- ⬜ Hover: subtle scale + shadow on endorsement cards
- ⬜ Page load: `fadeUp` on hero section, `staggerContainer` on sections
- ⬜ No motion on mobile (prefers-reduced-motion respected)

### E. OG Image Enhancement

- ⬜ Create `lib/utils/generateOgImage.ts` — function to build OG meta tags for public profile
- ⬜ Include: profile name, title/role, photo (if available), location
- ⬜ Font: DM Serif Display for name (serif face makes it elegant)
- ⬜ Background: gradient (brand colours) or solid
- ⬜ Logo: YachtieLink mark in corner
- ⬜ Size: 1200x630 (standard OG size)
- ⬜ Use Next.js Image Optimization API (already available)
- ⬜ Apply to: `app/(public)/u/[handle]/page.tsx` (metadata export)

### F. QR Code Polish

- ⬜ Branded card frame around QR on public profile (border, padding, subtle shadow)
- ⬜ Add download button — generates PNG (using `html2canvas` or canvas API)
- ⬜ Link in QR points to: `https://yachtie.link/u/[handle]` (public profile URL)
- ⬜ Test QR scan on mobile (various QR readers)
- ⬜ PNG download: trigger browser download without auth

---

## Build Order (Sequential, No Blocking Dependencies)

```
Wave 1 — Onboarding Rebuild (~2 days)
  ├─ Create StepCvUpload component
  ├─ Refactor onboarding flow logic
  ├─ Delete old steps (role, yachts, endorsements)
  ├─ Refactor CvReviewClient to use shared save
  └─ Test: CV path end-to-end, manual path end-to-end

Wave 2 — Public Profile Polish (~1.5 days)
  ├─ Section colours on ProfileAccordion
  ├─ Motion effects (stagger, hover, entrance)
  ├─ OG image enhancement
  └─ QR code branded card + PNG download

Wave 3 — Final Polish & Validation (~1.5 days)
  ├─ Mobile testing (cv-upload drag-drop, motions, QR)
  ├─ Cross-browser OG validation
  ├─ Accessibility audit (color contrast, motion)
  └─ Merge → main, tag v1.1-phase-1b-onboarding
```

---

## Exit Criteria — All Required

- [ ] CV path: drag-drop file → loading screen → auto-handle → populated profile (~5-8s)
- [ ] Manual path: skip → name input → handle input → empty profile
- [ ] CV path and manual path don't overlap (mutual exclusion in flow)
- [ ] Handle auto-generation works (suggest_handles called, availability checked)
- [ ] Auto-handle persisted to `users.handle` after CV parse completes
- [ ] Errors (parse fail, rate limit) gracefully fallback to manual path
- [ ] Standalone `/app/cv/upload` + `/app/cv/review` still work (CvReviewClient refactor verified)
- [ ] Section colours visible on public profile (About, Experience, Yachts, Certs, Languages, Endorsements)
- [ ] Dark mode section colours render correctly (700-level overrides)
- [ ] Motion: cards stagger on load, hover effects smooth, entrance animations present
- [ ] Reduced motion respected (no motion on prefers-reduced-motion)
- [ ] OG image renders (test on Twitter, LinkedIn, Slack)
- [ ] QR code branded, downloadable as PNG, links to public profile
- [ ] Mobile-first: all onboarding steps responsive at 375px
- [ ] `npm run build` zero errors, `npm run drift-check` PASS
- [ ] All old onboarding steps (role, yachts, endorsements) deleted
- [ ] Branch merged to main, tagged `v1.1-phase-1b-onboarding`

---

## Estimated Effort

- **Wave 1:** 2 days (onboarding rebuild, CvReviewClient refactor)
- **Wave 2:** 1.5 days (colours, motion, OG, QR)
- **Wave 3:** 1.5 days (testing, polish, merge)
- **Total:** 5–7 days

---

## Notes

**One drop, one loading screen, you're in.** The CV path is the hero of this sprint. New users should see: "Drop your CV" → (loading) → profile page already filled with name, role, yachts, certs, sea time, bio. No forms, no multi-step confirmations. The profile page is where they review and edit anything that parsed wrong.

**The profile page is the review.** This is intentional. Instead of a confirmation screen in the onboarding flow (slower, more friction), land users on their profile page. They see everything parsed, they can click into any section to edit. This design keeps onboarding tight and puts editing where it belongs.

**Manual path is explicit.** Users who don't have a CV, or prefer to skip, get name + handle only. No role selection, no yacht selection — these are contextual choices that happen later (when adding their first yacht, when requesting an endorsement). This respects user intent: some crew don't have a PDF CV, some use LinkedIn profiles, some are joining mid-season with no CV. Support all paths equally.

**Standalone CV flow unchanged.** The `/app/cv/upload` and `/app/cv/review` pages are still used by authenticated users who want to update their CV after onboarding. CvReviewClient refactors to use the shared save utility — same code path as onboarding, proven and tested.

**Section colours are a small win.** Theming each public profile section (About in blue, Experience in green, Yachts in teal, etc.) makes profiles feel more personalized and easier to scan. It's visual hierarchy without adding structure. Colors already defined in globals.css per Sprint 10.1.

**Post-launch:** After this sprint ships, the next major feature is Ghost Profiles + Claimable Accounts (design spec ready, ~2-3 days). Then Endorsement Writing Assist (quick junior sprint). Then Yacht Graph (Sprint 12). This sprint unblocks all of that by making onboarding a pleasant one-file-drop experience.
