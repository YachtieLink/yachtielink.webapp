# Yacht Reviews — Glassdoor for Yachting

**Status:** fleshed-out
**Priority guess:** P1 (primary viral driver — the feature that captures imagination and drives organic growth)
**Date captured:** 2026-04-02

## The Insight
Crew already gossip about yachts — in marina bars, WhatsApp groups, during handovers. "Did you hear about M/Y ABC?" is the most common conversation in yachting. YachtieLink gives it a home and makes it verifiable.

Every departure is a content moment. Every review is a reason for someone new to sign up. Every yacht page becomes a destination that people check before accepting a job.

## Why This Wins

### For crew:
- Check a yacht's reputation BEFORE accepting a position (the #1 thing crew wish they had)
- Leave honest feedback after departing (cathartic, helpful to others)
- See patterns: high turnover yacht? Crew love it? Management issues?

### For the platform:
- Every review is content that drives SEO traffic
- Every review is a conversation starter that gets shared
- "Did you see what [role] said about M/Y [yacht]?" → people come to look → sign up to see more
- Reviews are ONLY possible because the yacht graph verifies employment — no fakes

### For the industry:
- Forces accountability — bad management gets surfaced
- Rewards good yachts — high ratings attract better crew
- Creates transparency where there is none

## Review Model

### Who can review
- Only crew who have a **verified tenure** on the yacht (added via CV parse or manual entry with date range)
- Review unlocks **only after departure** — you cannot review while your end date is in the future or "Present"
- One review per tenure period (if you did two stints on the same yacht, you can leave two reviews)

### What they review

**Structured ratings (1-5 stars):**
| Category | What it measures |
|----------|-----------------|
| Management & Leadership | Captain, HODs — communication, fairness, professionalism |
| Work-Life Balance | Hours, time off, shore leave, rotation fairness |
| Crew Culture | Team dynamics, morale, social environment onboard |
| Maintenance & Safety | Is the yacht well-maintained? Do they cut corners? |
| Career Development | Do they invest in crew? Training, promotions, references |
| Compensation & Benefits | Fair pay for the role? Benefits package? Flights? |

**Freeform sections:**
- "What was the best part?" (required, min 20 chars)
- "What could be improved?" (required, min 20 chars)
- "Advice for incoming crew" (optional)
- "Would you work here again?" (Yes / Maybe / No)

### Privacy & anonymity
- **Default: anonymous by role** — shows "Chief Stewardess · 2023-2024" but NOT the reviewer's name
- **Optional: named review** — reviewer can choose to attach their name for more credibility
- **Role + department visible** — so readers know the perspective (a Deckhand and a Chief Engineer have very different experiences)
- **Aggregate scores always visible** — individual reviews require login
- **Minimum threshold:** 3+ reviews before showing aggregate scores (prevents identification when crew count is small)
- **Auto-redaction:** Flag reviews that name specific people by name for moderation

### Management response
- Captain or senior crew can respond to reviews (publicly, like Glassdoor)
- Response is tagged with their verified role and current status on the yacht
- Professional responses show the yacht in a good light even when the review is negative
- No ability to remove or suppress reviews — only flag for ToS violations

### Moderation
- Reviews are held for 24h before publishing (cooling off period)
- AI-assisted moderation: flag reviews that contain names of individuals, discriminatory language, or potential defamation
- Community reporting: other users can flag reviews as inappropriate
- Appeals process: yacht management can request review of a review they believe is factually false
- YachtieLink team makes final call on disputed reviews

## The Viral Mechanics

### Content loop
1. Crew member departs a yacht
2. YachtieLink sends a prompt: "You've left M/Y Big Sky. How was it? Your review helps other crew make better decisions."
3. They write a review (low friction — structured categories + short freeform)
4. Review publishes after 24h
5. Former colleagues get notified: "A new review was posted for M/Y Big Sky"
6. They come to read it, share it, maybe write their own
7. People outside the platform hear about it: "Have you seen what's on YachtieLink about M/Y ABC?"
8. They sign up to read the full review → new user

### Sharing mechanics
- Reviews are shareable via link (preview shows yacht name + aggregate score, not full text — must sign up to read)
- OG card: "M/Y Big Sky — 4.2/5 from 12 crew reviews" with yacht photo
- Teaser for non-logged-in: first sentence of 2-3 reviews visible, rest blurred
- "Sign up to read all reviews and check any yacht before you accept"

### Departure trigger
- When a user updates their yacht end date (or we detect they've moved to a new yacht), prompt them to review
- Smart timing: prompt 2 weeks after departure (enough distance for perspective, still fresh)
- Reminder at 30 days if they haven't reviewed
- Make it part of the "moving on" flow — natural, not intrusive

## Integration with Yacht Profile

The yacht page (from yacht-as-living-entity in network-tab-overhaul.md) gains:

```
┌─────────────────────────────────┐
│ M/Y Big Sky                     │
│ Motor Yacht · Oceanfast · 49m   │
├─────────────────────────────────┤
│ ★ 4.2 from 12 reviews          │
│ ████████████▓░░░░░  │
├──────────┬──────────┬───────────┤
│ Mgmt 4.5 │ Culture │ Comp 3.8  │
│          │  4.1    │           │
├──────────┴──────────┴───────────┤
│ CURRENT CREW (3)                │
│ ALUMNI (24)                     │
│ GALLERY (8 photos)              │
│ REVIEWS (12)                    │
│   "Best yacht I've worked on"   │
│   — Chief Stew · 2023-2024     │
│   [Read all reviews →]          │
└─────────────────────────────────┘
```

## Data Model (high level)

```
yacht_reviews
  id: uuid
  yacht_id: uuid (FK → yachts)
  reviewer_id: uuid (FK → users)
  user_yacht_id: uuid (FK → user_yachts — links to specific tenure)
  is_anonymous: boolean (default true)
  rating_management: int (1-5)
  rating_work_life: int (1-5)
  rating_culture: int (1-5)
  rating_maintenance: int (1-5)
  rating_career_dev: int (1-5)
  rating_compensation: int (1-5)
  best_part: text
  could_improve: text
  advice: text (nullable)
  would_work_again: enum (yes/maybe/no)
  status: enum (pending/published/flagged/removed)
  published_at: timestamp
  created_at: timestamp

yacht_review_responses
  id: uuid
  review_id: uuid (FK → yacht_reviews)
  responder_id: uuid (FK → users)
  responder_role: text
  body: text
  created_at: timestamp
```

## Free vs Pro
| Feature | Free | Pro |
|---------|------|-----|
| See aggregate yacht scores | Yes | Yes |
| Read individual reviews | 3 per month | Unlimited |
| Write reviews | Yes | Yes |
| See which yachts have reviews | Yes | Yes |
| Filter/sort reviews | Basic | Advanced (by role, date, rating) |
| Review response (as management) | — | Yes |
| Export review data | — | Yes |

## Phasing
- **Phase 1:** Review submission flow (structured ratings + freeform) + yacht page integration (aggregate scores). Departure trigger prompt.
- **Phase 2:** Moderation system (24h hold, AI flagging, community reporting, management responses)
- **Phase 3:** Viral mechanics (sharing, OG cards, teaser for logged-out, departure reminders)
- **Phase 4:** Advanced features (review trends over time, comparison between yachts, "best yachts to work for" rankings)

## Dependencies
- `network-tab-overhaul.md` — yacht pages need to exist as rich profiles before reviews layer on
- Yacht graph verification — reviews only work because tenure is verified
- Ghost profiles — alumni who aren't on the platform yet have ghost profiles; their reviews arrive when they join

## Notes
- Needs /grill-me — especially moderation policy, anonymity model, minimum thresholds, management response rules
- Legal review needed — defamation risk, GDPR (right to be forgotten vs review integrity)
- This is the feature that makes YachtieLink a PLATFORM, not just a tool. It creates content, drives traffic, builds a community.
- The review system is only credible because the yacht graph verifies employment. That's the moat. Glassdoor has fake reviews. YachtieLink can't — you either worked there or you didn't.
