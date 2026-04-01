# Feature Voting & Public Roadmap

**Status:** idea
**Priority guess:** P2 (community engagement + product signal — tells you what to build next)
**Date captured:** 2026-04-02

## Problem
The current "Feature Roadmap" page in More is static — a read-only list of what's coming. Users have no voice. They can't suggest features, vote on what matters to them, or see that their feedback influences the product.

## What it should be

### Feature suggestion + voting board
Think Canny / ProductBoard but built into the app:

- **Suggest a feature** — any user can submit an idea (title + description)
- **Vote on features** — upvote features you want. One vote per user per feature.
- **See what's popular** — sorted by votes. The community surfaces what matters.
- **Status tracking** — each feature has a status: Suggested → Under Review → Planned → In Progress → Shipped
- **Official responses** — founder/team can respond to suggestions ("Love this, it's on our radar" or "Here's why we're not doing this yet")

### Public roadmap
- **Now / Next / Later** columns — what's being built, what's coming, what's further out
- **Shipped** section — recently released features with "New" badges
- **Linked to voting** — features on the roadmap show their vote count. Users see their voice mattered.

### Why this matters
- **Product signal** — votes tell you what to build next (real data, not guesses)
- **Community engagement** — users feel heard, invested in the product's direction
- **Reduces support load** — "When will you add X?" → "Go vote for it on the roadmap"
- **Retention driver** — users check back to see if their suggestion shipped
- **Transparency builds trust** — especially important for a paid Pro product

### Implementation options
| Approach | Pros | Cons |
|----------|------|------|
| **Build in-app** | Fully integrated, native feel, no context switch | Dev time, maintenance |
| **Canny / Nolt / Frill embed** | Fast to ship, proven UX, moderation tools built in | External dependency, branding mismatch, monthly cost |
| **Hybrid** — voting in-app, board on external tool | Best of both — quick to ship, looks native for voting | Two systems to maintain |

**Recommendation:** Start with an external tool (Canny is the standard) embedded via iframe or linked from More tab. Migrate to in-app when the feature request volume justifies it.

### In-app integration points
- **More tab → "Feature Roadmap"** — becomes the entry point (already exists, just needs to link to the real board)
- **After shipping a feature** — push notification or in-app banner: "You voted for [feature] — it's here! Check it out."
- **Onboarding** — mention the roadmap: "Have ideas? We build what the community wants."
- **Pro users get weighted votes?** — consideration for Pro value, but could feel unfair. Discuss in /grill-me.

## Notes
- Low effort to start — link to Canny, ship in a day
- High signal value — immediately start learning what crew care about
- The roadmap is also a marketing tool — public roadmap shows the product is alive and evolving
