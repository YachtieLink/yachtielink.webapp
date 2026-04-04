# Lane 2 — Network + Insights Cold States

**Session:** Rally 010 Session 2
**Branch:** `feat/r010-s2-network-insights-cold`
**Worktree:** `yl-wt-2`
**Effort:** Sonnet, high (~2h)

## Scope

Fix cold-state failures on Network and Insights tabs. Zero-yacht users should see a clear path to building their network. Zero-stat insights should explain what's needed.

## Tasks

### Network Cold States

1. **Full empty state when 0 yachts** — In NetworkUnifiedView:
   - When `userYachts.length === 0`, replace the entire page content with a centered empty state
   - Icon: anchor or ship emoji (⚓ or 🚢)
   - Headline: "Add your first yacht to start building your network"
   - Description: "We'll connect you with crew you've worked with and make endorsements easy."
   - Primary CTA: "Add a Yacht" → `/app/attachment/new`
   - Secondary: "Upload a CV instead" → `/app/cv/upload` (CV parsing can also add yachts)

2. **Suppress endorsement cards when 0 yachts** — In NetworkUnifiedView:
   - Hide EndorsementSummaryCard and EndorsementCTACard when yacht count = 0
   - These are meaningless without any colleagues

3. **"Add another yacht" dashed card** — When yacht count is 1-3:
   - After the last yacht accordion, show a dashed-border card
   - "Add another yacht" with plus icon
   - Links to `/app/attachment/new`
   - Navy-themed (section color)

### Insights Cold States

4. **Insights Pro empty analytics** — When Pro user has zero views/downloads/shares/saves:
   - Replace triple-zero stat cards with a coaching state
   - Headline: "Share your profile to start seeing analytics"
   - Description: "Views, downloads, and shares will appear here once people discover your profile."
   - CTAs: [Share Profile Link] [Copy QR Code] (if QR exists, otherwise just share link)

5. **Insights Free zero-stat treatment** — When Free user has zero sea time/yachts/certs:
   - Replace the Career Snapshot stat cards with coaching text
   - "Upload your CV or add experience to see your career snapshot"
   - CTA: "Upload CV" → `/app/cv/upload`
   - Keep the blurred analytics section (it's the upgrade upsell)

## Allowed Files

- `components/network/NetworkUnifiedView.tsx` (empty state, suppress cards, dashed card)
- `app/(protected)/app/network/page.tsx` (pass yacht count if needed)
- `app/(protected)/app/insights/page.tsx` (cold state for Pro and Free)
- `components/insights/InsightsEmptyState.tsx` (new — Pro empty analytics)
- `components/network/AddYachtCard.tsx` (new — dashed "add another" card)

## Forbidden Files

- Profile, CV, Settings pages
- Tab bar, layout files
- API routes, migrations
- StickyBottomBar, ProfileCoachingBar (Session 1)

## Acceptance Criteria

- Network with 0 yachts: centered empty state, no endorsement cards
- Network with 1-3 yachts: "Add another yacht" dashed card after last accordion
- Insights Pro with zero stats: coaching state with share CTAs
- Insights Free with zero stats: coaching text with upload CTA
- `npx tsc --noEmit` passes
- Section colors respected: navy for Network, coral for Insights
- No AI mentions in user-facing copy
