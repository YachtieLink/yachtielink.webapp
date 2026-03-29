# UX/UI Audit — Mobile (375px) — 2026-03-29

**Status:** fleshed-out
**Priority guess:** Mixed (see per-item)
**Date captured:** 2026-03-29

Full UX/UI pass across all app pages on mobile viewport (375x812). Issues ordered by page.

---

## Global

### P1 — Page content hidden behind bottom tab bar (all pages)
The fixed bottom tab bar (64px) overlaps page content because no page applies the `.pb-tab-bar` padding class. The CSS class exists in `globals.css` (`padding-bottom: calc(var(--tab-bar-height) + var(--safe-area-bottom))`) but is only used in `BottomSheet.tsx`, not in any page layout. This means the last ~64px of every page is hidden behind the nav bar. Users can't see or tap the bottom of any page.

**Fix:** Add `pb-tab-bar` to the app layout wrapper in `app/(protected)/app/layout.tsx` (or equivalent) so all protected pages get bottom padding on mobile.

---

## Profile Page

### P2 — Language chip not editable
"English (native)" displays as a static chip with no Edit link or tap target. Users can't add, remove, or edit languages from the profile page.

### P3 — Copy button alignment on profile links
The copy icon on `yachtie.link/u/{handle}` is right-aligned, but the copy icon on the subdomain line sits inline after the text because the PRO badge and "Upgrade" push it left. The two copy icons should be vertically aligned.

### P3 — PRO badge misleading for Free users
Free users see a teal "PRO" label next to their subdomain link. Intent is to label the feature, but visually reads as a status badge claiming the user is Pro. The "Upgrade" text next to it helps, but the badge itself is confusing.

### P3 — Education card shows institution name twice
Education section shows "UKSA" as preview text AND as a link below. Looks like a duplicate display.

### P3 — Hobby/Skill chip truncation on mobile
"Photograp..." and "Paint and var..." truncate at 375px. Chips should either wrap text or use a smaller font, or show fewer chips on mobile.

### P3 — Profile Strength CTA text wrapping
"Add a photo to make it yours" and "Add profile photos" break onto separate lines and look like two disconnected elements rather than a prompt + action.

### P3 — "1 CV detail set — edit on CV tab" feels orphaned
This text inside the Personal Details card refers to a different tab. Unclear what "1 CV detail set" means to a user.

---

## Network Page

### P2 — Request endorsements banner not dismissable
The large teal CTA banner has no close/dismiss button. It takes significant vertical space on every visit and can't be hidden once acknowledged. Should be dismissable, with state persisted.

### P2 — Tab bar crowded at 375px
4 tabs with count badges ("Endorsements 1 Colleagues 9 Yachts 2 Saved 1") run edge to edge with labels and badges touching. Needs scrollable tabs, shorter labels, or a different layout on mobile.

### P2 — "Unknown" in Requests Sent
A pending endorsement request shows "Unknown" as the recipient name instead of the actual person. Either recipient data isn't fetched or display_name is null.

### P3 — No saved yachts feature
Users can save profiles but not yachts. The Saved tab only links to Saved Profiles. Yacht bookmarking would be useful for job seekers browsing vessels.

### P3 — Profile photo alignment in colleague cards
Charlotte's photo avatar sits higher than the text block. Not vertically centered with the 3-line content (name, role, yacht).

---

## Colleagues Detail Page (/app/network/colleagues)

### P2 — Back button inconsistent across app
Back button style varies: yacht page uses a pill with "< Back", colleagues page uses a full-width rounded button, settings page uses inline with header. Should be one consistent component.

### P2 — Back button no top margin
On colleagues and saved profiles pages, the back button sits flush against the viewport top with no safe area padding.

### P3 — "2 share..." truncated on Elena's card
"2 shared yachts" text is cut off in the colleagues detail view.

### P3 — "No endorsement yet" messaging
Endorsement status shows "No endorsement yet" on colleagues who haven't exchanged endorsements. Reads slightly passive-aggressive. Could show nothing or use a subtler indicator.

---

## Endorsement Request Page

### P2 — Empty share button
Third share button (after WhatsApp and Copy Link) has `aria-label="Share via..."` but renders as an empty gray circle with no icon or text. Either add the Web Share API icon or remove the button.

### P2 — Invite token flow needs E2E testing
Tokens sent via email/WhatsApp/link must correctly allow the receiver to endorse the sender. Logic needs verification — see `endorsement-invite-token-qa.md`.

---

## Settings / More Page

### P3 — "Dark mode coming soon" placeholder
Takes prime screen real estate for a non-existent feature. Should be removed or moved to bottom of page.

### P3 — Background color mismatch
Settings page uses warm beige/cream background while all other pages use cool gray-green. Jarring transition when navigating between tabs.

### P3 — "YachtieLink · Phase 1A" visible to users
Internal phase label at bottom of settings. Should show version number or just the logo, not internal milestone names.
