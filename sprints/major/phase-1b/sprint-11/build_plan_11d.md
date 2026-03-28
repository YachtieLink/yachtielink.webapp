# Sprint 11d — Profile Rewrite Remaining Polish

**Goal:** Ship everything from the design interview that wasn't covered in 11a/b/c QA sessions. Settings UI, sub-pages, photo management, CV rework, endorsement pinning, and Pro gating polish.

**Estimated effort:** 2-3 days
**Depends on:** Sprint 11c QA complete, branch merged to main

---

## Outstanding Items

### Settings & Customisation
1. **Scrim preset + accent colour settings UI** — picker in `/app/profile/settings` to change hero scrim (Dark/Light/Teal/Warm) and profile-wide accent colour. Schema columns exist, no UI yet.
2. **Template selection** — Classic/Bold picker in settings, Pro-only. Visible when `profile_view_mode === 'rich_portfolio'`. Schema column exists (`profile_template`), no UI yet.
3. **Photo focal point picker** — `FocalPointPicker` component exists. Wire into `/app/profile/photos` page with modal per photo. Hero + gallery photos.
4. **Gallery photo reorder** — drag-to-reorder already exists on photos page. Confirm order maps to bento placement priority.

### Sub-Pages (shareable routes)
5. **`/u/{handle}/experience`** — full yacht history, timeline layout
6. **`/u/{handle}/endorsements`** — all endorsements, owner can pin top 3
7. **`/u/{handle}/certifications`** — detailed certs with expiry dates, issuers
8. **`/u/{handle}/gallery`** — full photo gallery grid
9. All sub-pages: back button returns to profile, shareable URLs, consistent hero/header

### Endorsement Pinning
10. **Pro users pin top 3 endorsements** — on the `/u/{handle}/endorsements` page, star/pin toggle. Free shows 3 most recent. Pinned endorsements appear first in profile/portfolio tiles.

### CV Rework
11. **On-demand CV generation** — kill the "regenerate" button. PDF generates when someone views/downloads. Always current.
12. **CV preview page** (`/u/{handle}/cv`) — currently opens a modal. Build as actual route for direct linking.

### Pro Gating & Upsell
13. **Viewer Pro status** — pass actual viewer Pro status to hero (currently hardcoded `false`). Needed for Pro badge click gating.
14. **Pro upsell consistency** — standardise upsell pattern across the app (backlog item exists)

### Visual Polish
15. **Avatar thumbnail framing** — `object-top` or focal point on avatars in endorsement cards, saved profiles, etc.
16. **Inner page header component** — consistent header across all inner app pages
17. **Stock gallery placeholders** — Pro profiles with Rich Portfolio but no gallery get department-appropriate stock photos. Department hero stock photos for users without a profile photo.

### Data Fixes
18. **CV parser dedup** — education has zero dedup, certs have weak fuzzy match, hobbies exact-match only. Separate from profile display but affects data quality.

---

## Not in Scope (separate sprints/backlog)
- Visibility toggle rework (junior sprint)
- Colleague graph explorer (Phase 2)
- Ghost profiles & claimable accounts (Phase 2)
- Social links add prompt (backlog)
- Skill/hobby notes (backlog)
- Share button QR code (backlog)

---

## Notes

> This sprint covers the "last mile" of the profile rewrite. The core layout (11a/b/c) is done. This is settings, sub-pages, and polish that make the feature complete. Some items (stock photos, inner page header) could be deferred to Sprint 12 if time pressure exists — flag with founder.
