# Lane 2 — Smart Coaching Nudges

**Session:** Rally 010 Session 4
**Branch:** `feat/r010-s4-coaching`
**Worktree:** `yl-wt-2`
**Effort:** Sonnet, high (~2h)

## Scope

Extend the endorsement banner pattern to profile completeness coaching and CV freshness nudges. Rate-limited, dismissible, localStorage-backed.

## Components

### 1. ProfileCoachingNudge — `components/coaching/ProfileCoachingNudge.tsx`
- Triggers based on Profile Strength thresholds
- Messages rotate based on what's missing:
  - No photo: "Add a photo — profiles with photos get 5x more views"
  - No bio: "Write a bio — tell captains who you are"
  - No certs: "Add certifications — captains filter by certs"
  - No yacht: "Add a yacht to build your crew network"
- Max 1 nudge per session (localStorage throttle)
- Dismissible with "Got it" or X
- Teal-colored (profile section)

### 2. CvFreshnessNudge — `components/coaching/CvFreshnessNudge.tsx`
- Shows when profile was updated but CV hasn't been regenerated in 7+ days
- Copy: "Your profile changed on {date}. Regenerate your CV to include updates."
- CTA: "Regenerate" → scrolls to or triggers regenerate action
- Amber-colored (CV section)
- Dismissible, re-appears after next profile update

## Integration

- Wire ProfileCoachingNudge into Profile page (above sections, below hero)
- Wire CvFreshnessNudge into CV page (above CvActions in warm state)
- Both use localStorage for throttling and dismissal

## Allowed Files

- `components/coaching/ProfileCoachingNudge.tsx` (new)
- `components/coaching/CvFreshnessNudge.tsx` (new)
- `app/(protected)/app/profile/page.tsx` (add nudge)
- `app/(protected)/app/cv/page.tsx` (add nudge)

## Forbidden Files

- Network, Insights pages
- StickyBottomBar, FirstVisitCard (separate concerns)
- API routes, migrations

## Acceptance Criteria

- Profile nudge shows relevant next action based on missing data
- CV nudge shows when profile changed > 7 days ago but CV not regenerated
- Both dismissible with localStorage
- Rate-limited: max 1 nudge per category per session
- Teal for profile, amber for CV
- No AI mentions
- `npx tsc --noEmit` passes
