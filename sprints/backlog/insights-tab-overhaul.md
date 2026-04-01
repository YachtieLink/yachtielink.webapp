# Insights Tab Overhaul — Make Pro a No-Brainer

**Status:** fleshed-out
**Priority guess:** P1 (Insights is the primary Pro value driver — currently it's 3 empty cards)
**Date captured:** 2026-04-02

## Problem
Insights is the weakest tab in the app. It has a profile views chart, two zero-count cards (PDF Downloads, Link Shares), a Cert Document Manager that doesn't belong here, and a subscription status card. The bottom 60% of the screen is empty space. For a Pro feature that's supposed to justify a monthly subscription, this is catastrophically underwhelming.

## What needs to happen
Transform Insights from a sparse stats page into a **career intelligence dashboard** — the tab that makes Pro users feel like they have an unfair advantage, and makes Free users desperate to upgrade.

## Remove from Insights
- **Cert Document Manager** → move to More/Settings, with a link from Certifications section on Profile
- **Crew Pro subscription card** → move to More/Settings (it's account management, not insights)

## Analytics to Build

### Tier 1: Profile Analytics (expand what exists)
| Metric | Free | Pro | Notes |
|--------|------|-----|-------|
| Profile Views | Total count only | Chart + breakdown by day/week + trend arrows | Already exists, needs enhancement |
| PDF Downloads | Total count | Chart + which CV template was downloaded + by whom | Track template preference |
| Link Shares | Total count | Chart + which link was shared (yachtie.link vs subdomain) + click-through rate | |
| **Search Appearances** | — | How many times you appeared in search results + what searches matched you | New — requires tracking |
| **Profile Completion Impact** | — | "Your profile views increased 40% after adding certifications" | Correlate completeness with engagement |
| **Peak Activity Times** | — | "Most views happen Tuesday-Thursday 9am-2pm" | Help users time their profile updates and shares |

### Tier 2: Who's Looking (the killer feature)
**"Who viewed your profile"** — LinkedIn's most addictive feature, adapted for yachting.

| Feature | Free | Pro |
|---------|------|-----|
| View count | Yes (number only) | Yes |
| Who viewed | "3 people viewed your profile" (blurred names) | Full list with names, roles, yachts |
| Viewer details | — | Name, role, current yacht, when they viewed |
| Viewer trends | — | "More Captains are viewing you this month" |
| **Repeat viewers** | — | "Capt. James has viewed your profile 4 times" — strong hiring signal |
| **Mutual opt-in model** | Pro users can opt out of being visible to others, BUT if they opt out they also lose the ability to see who viewed theirs. Reciprocity — you have to give to get. |

**Implementation note:** This requires a `profile_views` table that logs viewer_id + viewed_id + timestamp. Privacy-sensitive — needs GDPR-compliant retention (auto-delete after 90 days?). Opt-out is per-user setting.

### Tier 3: Salary Benchmark Tool (massive Pro value)
**"How does your pay compare?"** — privately input your salary, get benchmarked against similar roles.

| Input | What they enter |
|-------|----------------|
| Current role | e.g. Chief Stewardess |
| Yacht size | e.g. 50m+ |
| Season type | Med / Caribbean / Year-round |
| Base salary | Private, encrypted |
| Benefits | Flights, insurance, bonus structure |
| Contract type | Permanent / Rotational / Freelance |

| Output | What they see |
|--------|-------------|
| Percentile | "You're in the 65th percentile for Chief Stewardess on 50m+ yachts" |
| Range | "Typical range: €4,500-€6,500/month for this role" |
| Comparison | "Your benefits package is above average" |
| Trends | "Salaries for this role have increased 8% in the last year" |
| Recommendations | "Chief Stewardesses with Wine certifications earn 12% more on average" |

**Privacy model:** Salary data is NEVER shown to other users. It feeds into aggregate anonymized benchmarks only. Minimum threshold (e.g. 10+ data points) before showing any benchmark to prevent identification. User can delete their salary data anytime.

**This is a massive Pro differentiator.** No one in yachting has reliable salary data. Crew talk to each other informally but there's no authoritative source. YachtieLink becomes that source.

### Tier 4: Career Intelligence
| Feature | Description | Tier |
|---------|-------------|------|
| **Endorsement analytics** | Who endorsed you, when, response rate on requests | Pro |
| **Network growth** | Colleague count over time, new connections per month | Pro |
| **Cert expiry timeline** | Visual timeline of upcoming cert expirations (moved from Insights to here as a widget, not a full manager) | Free (basic) / Pro (reminders) |
| **Profile strength trends** | How your profile completeness has changed over time | Pro |
| **Industry benchmarks** | "Average Chief Stewardess has 4 endorsements — you have 2" | Pro |
| **Engagement score** | Composite metric: views + downloads + shares + endorsements = your visibility score | Pro |
| **Seasonal demand** | "Hiring for your role peaks in March-April (Med season prep)" | Pro |
| **Skill gap analysis** | "85% of Chief Stewardesses in your bracket also have Wine & Spirit certification" | Pro |
| **Certification premium** | "Crew with Wine cert earn 12% more in your role" — ties salary data to specific credentials | Pro |

### Tier 5: Actionable Recommendations
Not just data — tell them what to DO with it.

| Recommendation | Trigger |
|---------------|---------|
| "Add a profile photo — profiles with photos get 3x more views" | No profile photo |
| "Request endorsements — you're below average for your role" | Low endorsement count |
| "Your STCW expires in 60 days — renew now to avoid gaps on your CV" | Cert approaching expiry |
| "Consider adding Wine certification — it's the #1 skill gap for your role" | Skill gap analysis |
| "Update your bio — profiles updated in the last 30 days rank higher in search" | Stale profile |
| "Share your profile this week — hiring activity for your role is peaking" | Seasonal demand signal |

### Tier 6: Weekly Digest Email
Drive users back into the app with a weekly summary email:
- Profile views this week (with trend vs last week)
- New viewers (names if Pro, count if Free)
- Top recommendation of the week
- Cert expiry warnings
- Salary benchmark changes (if data has shifted)
- "Your engagement score this week: 78 (+5)"

Free users get a stripped version that teases Pro data: "3 people viewed your profile this week. Upgrade to Pro to see who."

## Free vs Pro Strategy
The Insights tab should be **visible to everyone** but with clear Pro gates:

- **Free users see:** Profile views count, basic stats, blurred "who viewed" teasers, and recommendations that say "Upgrade to Pro to unlock..."
- **Pro users see:** Everything — full analytics, viewer list, salary benchmarks, career intelligence, actionable recommendations

The tab itself is the upsell. Every visit to Insights as a Free user should show them exactly what they're missing.

## Page Layout (proposed)
```
┌─────────────────────────────┐
│ Insights            Pro ✓   │
│ 7d | [30d] | All            │
├─────────────────────────────┤
│ Profile Views          429  │
│ ████████████░░░░░░░░░░░░░░  │
├──────────┬──────────────────┤
│ Downloads│ Shares   │ Search│
│    12    │   8      │  340  │
├──────────┴──────────────────┤
│ WHO'S LOOKING               │
│ 👤 Capt. James — M/Y Azure  │
│ 👤 Sarah K. — HR, Burgess   │
│ 👤 +3 more this week        │
├─────────────────────────────┤
│ SALARY BENCHMARK            │
│ 65th percentile   ████▓░░░  │
│ Your role: €5,200/mo        │
│ Range: €4,500-€6,500        │
├─────────────────────────────┤
│ RECOMMENDATIONS             │
│ 💡 Add Wine cert (+12% avg) │
│ 💡 Hiring peaks in 3 weeks  │
├─────────────────────────────┤
│ CAREER TRENDS               │
│ Network: +4 this month      │
│ Engagement score: 78        │
│ Cert renewals: 1 in 60 days │
└─────────────────────────────┘
```

## Files Likely Affected
- `app/(protected)/app/insights/` — complete page rewrite
- `components/insights/` — new section components
- `supabase/migrations/` — profile_views table (viewer tracking), salary_benchmarks table
- `app/api/` — new endpoints for salary input, viewer tracking, benchmark calculations
- `lib/analytics/` — new analytics utilities
- `app/(protected)/app/more/` — receive Cert Document Manager + subscription card

## Phasing
- **Phase 1:** Enhanced profile analytics (views, downloads, shares, search appearances) + move Cert Manager and subscription card out
- **Phase 2:** Who viewed your profile (viewer tracking + opt-in/opt-out model)
- **Phase 3:** Salary benchmark tool (data collection + anonymized benchmarks)
- **Phase 4:** Career intelligence (endorsement analytics, network growth, skill gaps, seasonal demand)
- **Phase 5:** Actionable recommendations engine

## Notes
- Needs /grill-me before building — especially salary benchmark privacy model, viewer tracking GDPR compliance, and Free vs Pro gate placement
- The salary tool alone could be worth the Pro subscription — no one in yachting has this data
- Viewer tracking opt-in/opt-out reciprocity model ("give to get") is critical for adoption
- Coral section color should be applied throughout (currently is, keep it)
- This is a multi-sprint initiative, not a single sprint
