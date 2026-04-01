# Network Tab Overhaul — Make the Yacht Graph Visible and Endorsements Obvious

**Status:** fleshed-out
**Priority guess:** P1 (this is the core differentiator — yacht graph + endorsements — and it's currently invisible)
**Date captured:** 2026-04-02

## Problem
The Network tab is the most important tab in the app — it's the yacht graph, the endorsement engine, the thing that makes YachtieLink different from a regular CV builder. But right now it's three flat lists with tabs, zero education, and no visible connections between yachts, colleagues, and endorsements.

A new user hits this tab and has no idea:
- What endorsements are or why they should care
- How to get them
- What the yacht graph even is
- How yachts, colleagues, and endorsements relate to each other
- What "0/5 endorsements" means

## What Needs to Change

### 1. Education — Tell the story
The Network tab needs to teach the user on first visit:

**What is the yacht graph?**
"Every yacht you've worked on connects you to every crew member who was aboard. That's your professional network — people who can vouch for your work because they've seen it firsthand."

**Why endorsements matter:**
"Endorsements from colleagues who've actually worked alongside you are worth more than any reference letter. Captains trust crew who are vouched for by people they know."

**How it works (3-step visual):**
1. "Your yachts → imported from your CV or added manually"
2. "Your colleagues → crew who worked on the same yachts"
3. "Your endorsements → ask colleagues to vouch for you"

This should be a first-time onboarding card that can be dismissed but also revisited from a "How it works" link.

### 2. Make the graph VISIBLE
The three tabs (Endorsements, Colleagues, Yachts) hide the connections. The user should SEE the graph.

**Proposed: One unified view with visible connections**

Instead of three separate tab lists, show the network as a connected structure:

```
┌─────────────────────────────────┐
│ Your Network                    │
│ 11 yachts · 9 colleagues · 0 endorsements │
├─────────────────────────────────┤
│                                 │
│ M/Y Big Sky ────── 5 crew      │
│   ├ Olivia Chen (Purser)     [Endorse] │
│   ├ Kai Nakamura (ETO)       [Endorse] │
│   ├ Finn Murphy (2nd Off)    [Endorse] │
│   └ +2 more                    │
│                                 │
│ TS Golden Reef ─── 5 crew      │
│   ├ Sofia R. (First Off)  ✓ Endorsed you │
│   ├ Pierre M. (Head Chef)  ✓ Endorsed you │
│   └ +3 more                    │
│                                 │
│ TS Jade Wave ──── Current      │
│   └ No colleagues on YachtieLink yet │
│     [Invite crew from this yacht]    │
│                                 │
└─────────────────────────────────┘
```

**The key insight:** Group by yacht, show colleagues nested under each yacht, show endorsement status per colleague. The user sees the GRAPH — yacht → crew → endorsement — in one view.

- Yachts with no colleagues on the platform get an "Invite crew" CTA
- Yachts with colleagues show endorse buttons or endorsement status
- Colleagues who endorsed you show a checkmark
- Colleagues you've endorsed show a different indicator
- The whole thing is expandable/collapsible per yacht (compact list pattern from design system)

### 3. Fix the empty state
Current: "No endorsements yet" / "Request endorsements" button

Proposed:
- **Headline:** "Build your reputation"
- **Subtext:** "Endorsements from crew who've worked alongside you tell captains you're the real deal. Start by asking someone from your last yacht."
- **Smart CTA:** Don't just say "Request endorsements" — pre-select the most likely candidate: "Ask [Name] from [Yacht] for an endorsement" based on most recent yacht with colleagues on the platform.
- **Social proof:** "Crew with 3+ endorsements get 2x more profile views" (or whatever the data shows)

### 4. Fix the pending state
Current: "Pending" with yacht name, Resend/Cancel buttons

The user doesn't know:
- WHO they sent the request to (just shows yacht name)
- WHEN they sent it
- What happens next

Proposed:
- Show the person's name and photo: "Waiting for Olivia Chen"
- Show when sent: "Sent 3 days ago"
- Show context: "From your time on Big Sky"
- Smart nudge: "Most people respond within a week. Resend if it's been longer."
- Resend shows last sent time to avoid spamming

### 5. Fix the "0/5 endorsements" mystery
This dropdown is unexplained. Is 5 a limit? A goal? A tier?

Proposed:
- If it's a Free tier limit: "0 of 5 endorsements (Free plan)" with Pro upsell: "Unlimited endorsements with Pro"
- If it's a goal: "0 of 5 — get your first 5 endorsements to reach 'Trusted' status"
- Either way, explain what it means and why 5 matters

### 6. Endorsement quality guidance
When requesting endorsements, guide the user:
- "Who should you ask?" — suggest colleagues from recent yachts, especially senior crew
- "What makes a good endorsement?" — short example: "Professional, reliable, and always calm under pressure" vs a generic "Great person"
- "How many do you need?" — "3 endorsements gets you noticed. 5+ makes you stand out. 10+ puts you in the top tier."

### 7. Yachts tab — the crown jewel
The yachts tab is what makes YachtieLink unique. No other platform has yacht-as-a-node. This tab should feel like the most special thing in the app — it's the user's career map, their proof of experience, and the source of all their connections.

Current: just a list of yacht names. Should be:
- **Visual career timeline** — yachts ordered chronologically, with role, dates, and a visual timeline bar. The user sees their career at a glance.
- How many colleagues from each yacht are on the platform
- Endorsement status per yacht (have you asked anyone from this yacht?)
- "Invite crew" option for yachts with no colleagues yet
- Yacht details preview (type, size, builder, your role, dates)
- **Yacht photo** if one exists — even a placeholder silhouette by yacht type (motor yacht, sailing yacht)
- Tap into a yacht → see the full crew graph for that vessel, who's on the platform, who's endorsed who
- **Future:** yacht page becomes a living entity (see below).

### 7c. Yachts as living entities — the long-term vision
Yachts are why non-yachties will come to the platform. Agents, captains, fleet managers, brokers, shipyards — they all want yacht data. The yacht page becomes the single source of truth for a vessel's professional history.

**The yacht as a profile:**
Every yacht gets its own profile page, like a company page on LinkedIn. It has:
- **Identity:** Name, type, builder, length, year built, flag state, refit history
- **Current crew:** Who works there now (maintained by current crew)
- **Alumni:** Everyone who ever worked there, with roles and dates
- **Gallery:** Photos from current and past crew — the yacht's visual history
- **Stats:** Average tenure, crew turnover rate, total crew who've passed through
- **History timeline:** Name changes, refits, ownership changes (where known)

**Crew as maintainers:**
Current crew are the stewards of the yacht's data. They keep it alive:
- **Current crew can edit yacht details** — update length after a refit, add new photos, update the description
- **Verification model:** Changes by current crew are trusted. Changes by alumni need consensus or moderation.
- **"Claim this yacht"** — if no current crew are on the platform, anyone who adds it can become the initial maintainer
- **Handover:** When crew leave, their status changes to "alumni" and new crew become maintainers
- **Yacht activity feed:** "New photo added by [crew member]", "Crew roster updated", "[Name] joined as Chief Officer" — a living timeline of the yacht

**The yacht as a forum/community:**
Each yacht becomes a mini-community for its crew — past and present:
- **Discussion/updates:** Current crew post updates ("Just finished a Med season refit"), alumni can comment
- **Shared memories:** "Remember that crossing in 2019?" — the yacht's story told by its crew
- **Job postings:** Current crew or captain posts an opening → visible to alumni and their networks first
- **Reviews (private):** Crew can privately rate their experience — visible only in aggregate. "4.2/5 from 12 crew" (like Glassdoor). Helps crew make informed job decisions. Sensitive — needs careful design.

**Why non-yachties come:**
- **Agents/recruiters:** Search yachts, see crew history, find candidates who've worked on similar vessels. "Show me all Chief Stews who've worked on 60m+ motor yachts" — only YachtieLink has this data.
- **Fleet managers:** Monitor their fleet's crew history, tenure patterns, turnover.
- **Brokers/buyers:** See a yacht's professional history — who maintained it, how long crew stayed (indicator of management quality).
- **Shipyards:** Find crew experienced with specific builders or yacht types for delivery/commissioning work.
- **Insurance:** Crew stability data as a factor in yacht risk assessment.

**Data integrity system:**
- Crew self-report their yachts during onboarding (CV parse or manual entry)
- Cross-referencing: if 3 people independently say they worked on "M/Y Big Sky" in the same time period, the data is high-confidence
- Builder and yacht name normalization (already built — prefix-aware search, builder autocomplete from DB)
- Yacht merge: if "Big Sky" and "MY Big Sky" and "M/Y BIG SKY" are clearly the same vessel, merge them
- **AIS integration (future):** Cross-reference yacht names with AIS vessel data for verification
- **IMO numbers:** Use IMO/MMSI numbers as the canonical vessel identifier where available

**The viral moment:**
"Holy hell, something was going down on M/Y ABC — did you see the review the Purser left when she was going?"

That's the moment the platform captures imagination. Crew already gossip about yachts — in marina bars, WhatsApp groups, during handovers. YachtieLink gives it a home. When someone leaves a yacht and their departure review says something interesting, people TALK. And they come to the platform to see it.

This is Glassdoor energy for yachting — but more personal because everyone knows each other. The reviews need to be:
- **Tied to verified tenure** — you can only review a yacht you actually worked on, for the dates you were there
- **Visible only after departure** — can't review while you're still onboard (prevents retaliation)
- **Structured + freeform** — rate categories (management, work-life, crew culture, maintenance standards) + free text
- **Anonymous-ish** — shows role and department but not name, unless the reviewer chooses to be named
- **Aggregate first** — the yacht's page shows aggregate scores. Individual reviews are behind a tap. You need to be logged in to see them.
- **Response option** — yacht management (captain/chief stew) can respond to reviews. Shows professionalism.

The review system turns every yacht into a destination page. People come to look up a yacht before accepting a job. They check back after someone leaves. They share reviews with friends. Every review is a reason for someone new to sign up.

This is Phase 2+ territory but the data model should be designed now to support it. Every yacht entry today should be a node that can grow into a full yacht profile later.

### 7b. Colleagues — the connection point
Colleagues are YachtieLink's equivalent of "friends" on other platforms. They're automatically created from shared yacht history — you don't add them, you discover them. But right now they're just a flat list.

**Future interactability to plan for:**
- **Direct messaging** — message a colleague, especially around endorsement requests or job opportunities
- **Availability status** — "Looking for a position" / "Available from [date]" — colleagues can see each other's availability
- **Recommendations** — "Know someone who'd be great for [role]? Recommend a colleague"
- **Shared history** — when you tap a colleague, show all yachts you overlapped on, not just one
- **Mutual colleagues** — "You and Pierre have 4 mutual colleagues" — builds trust, shows the graph depth
- **Colleague activity** — "Olivia updated her profile" / "Kai got endorsed by someone you know" — lightweight social feed that drives engagement
- **Colleague groups** — natural grouping by yacht, but also allow custom groups ("My references", "Med season crew", "Port contacts")

This doesn't need to be built now, but the data model and UI should be designed with this trajectory in mind. Colleagues are the social layer — the thing that keeps people coming back.

### 8. The viral loop — make it obvious
The yacht graph IS the viral loop:
1. User adds yachts to their profile
2. Ghost profiles are created for colleagues
3. Colleagues get invited, sign up, claim their profile
4. They endorse each other
5. Both profiles are now stronger → more views → more people join

But the user doesn't see this loop. The Network tab should visualize it:
- "3 of your colleagues have joined YachtieLink" (progress)
- "Invite [Name] — they have a ghost profile waiting for them" (growth)
- "When [Name] joins, they can endorse you instantly" (incentive)

### 9. Scale — must stay navigable at 30 endorsements and 200 colleagues
The yacht-grouped view works great at 3 yachts and 9 colleagues. But a senior crew member with 15 years' experience might have:
- 20+ yachts
- 200+ colleagues
- 30+ endorsements
- 50+ pending/sent requests

**Design for the veteran, not just the newcomer:**

- **Search and filter** — search colleagues by name, filter by yacht, filter by endorsement status (endorsed me / I endorsed / not yet / pending)
- **Yacht grouping with smart collapse** — default: expand current yacht + most recent 2, collapse the rest. Show counts: "Big Sky — 12 colleagues · 3 endorsed"
- **Endorsement summary at the top** — not buried in a list. "30 endorsements from 18 colleagues across 8 yachts" with a quality breakdown (how many from Captains, from department heads, from peers)
- **Sort by relevance** — most recent yachts first, but also surface colleagues who are MOST endorsable (recently active, senior roles, mutual connections)
- **Pagination / infinite scroll** — don't load 200 colleague cards at once
- **"Featured endorsements"** — let the user pin their best 3-5 endorsements to show on their public profile. Not all 30.

### 10. Endorsements are the growth engine — optimize for external invites
Endorsements are the #1 viral loop. Every endorsement request to someone NOT on the platform is a potential new user. The flow must make inviting outsiders frictionless and rewarding.

**Current problem:** The endorsement request flow asks "which yacht?" then shows colleagues from that yacht. But if the colleague isn't on YachtieLink, the user hits a dead end. The ghost profiles feature (PR #133) helps — but the user needs to be actively encouraged to invite people outside the platform.

**Proposed:**
- **"Request from anyone" option** — not just colleagues on the platform. "Enter their email or phone" → sends an invite + endorsement request in one step. They don't need to be on YachtieLink yet.
- **Ghost profile pre-creation** — when you invite someone for an endorsement, we create their ghost profile so when they sign up their endorsement is already attached. This exists (PR #133) but the UX needs to surface it.
- **Incentivize inviting:** "You have 8 colleagues from Big Sky who aren't on YachtieLink yet. Invite them — when they join, they can endorse you instantly."
- **Track invite success:** Show the user which invites converted: "Olivia joined from your invite! She can now endorse you."
- **Make it feel reciprocal:** "When you endorse someone, they're more likely to endorse you back." Show mutual endorsement opportunities: "You endorsed Pierre. Pierre hasn't endorsed you yet — send a gentle nudge?"
- **Endorsement request templates:** Don't make the user write from scratch. Offer 2-3 templates: casual ("Hey, would you mind writing a quick endorsement?"), professional ("I'm building my professional profile and..."), specific ("Could you speak to my skills in..."). Personalizable but not blank.
- **Follow-up nudges:** Smart reminders — "Your request to Olivia was sent 7 days ago. People who follow up get 3x more endorsements. Send a friendly reminder?"
- **External endorsement landing page:** When a non-user receives an endorsement request, they land on a beautiful page that:
  1. Shows who's asking and from which yacht
  2. Lets them write the endorsement WITHOUT signing up (ghost endorsement flow)
  3. Then gently asks: "Want your own YachtieLink profile? Your endorsement of [Name] will appear on your profile too."
  4. Low friction: they've already invested time writing the endorsement, signing up is the natural next step

**Metrics to track:**
- Endorsement request → completion rate (what % of requests result in an endorsement?)
- External invite → signup conversion rate
- Endorsement → reciprocal endorsement rate
- Time from request to endorsement (optimize with reminders)
- Invites per user (are power users inviting their whole crew?)

## Related Backlog Items
- `ghost-profiles-claimable-accounts.md` — ghost profiles feed directly into this
- `insights-tab-overhaul.md` — endorsement analytics, network growth metrics
- `profile-page-redesign.md` — endorsements section on profile page

## Phasing
- **Phase 1:** Unified yacht-grouped view (replace three tabs with connected graph view), fix empty states, fix pending state UX
- **Phase 2:** Education onboarding, endorsement quality guidance, smart CTAs
- **Phase 3:** Invite flow integration (ghost profiles → invite → claim → endorse loop)
- **Phase 4:** Advanced graph visualization (visual network map — who connects to who)

## Notes
- Needs /grill-me before building — especially the unified view layout, tab replacement strategy, invite flow
- Navy section color should be applied throughout (already is for Network tab)
- This is arguably more important than the profile page redesign — this is the product's competitive moat
- The yacht graph is the reason YachtieLink exists. If users can't see it, feel it, or use it, the product has no soul.
