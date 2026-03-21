# Rally R2 -- Features, Value Proposition & Growth Psychology (Challenger)

**Agent:** R2-A2 (Features/Value/Growth Deep Challenge)
**Date:** 2026-03-16
**Scope:** Challenge, deepen, and extend R1 findings on features, viral mechanics, free/Pro psychology, and the demand side (captains/recruiters).

---

## 0. What R1 Got Right

Before challenging, credit where due:

1. **R1-A2 correctly identified the aha moment**: "I have a professional page about me, with a clean URL, that I can send to anyone right now." This is exactly right. The public profile IS the product for crew.

2. **R1-A2 correctly identified endorsement reciprocity as the viral engine.** The post-endorsement CTA is indeed the highest-conversion moment. No argument.

3. **R1-A1 found real bugs** (broken legal links, theme localStorage mismatch, domain typo, "checkmark" literal text). These are legitimate ship-blockers.

4. **R1-A3 correctly flagged the no-`loading.tsx` problem** as the single biggest perceived-speed issue. Sequential profile queries are real latency.

5. **R1-A2 correctly identified WhatsApp as THE distribution channel.** This cannot be overstated.

What follows is not contradiction for its own sake. It is the argument that R1's analysis, while competent, stopped one or two layers short of what would actually move the needle.

---

## 1. Challenging R1's Public Profile CTA Recommendation

### What R1 said:
> "Add a 'Create your own profile' CTA at the bottom of every public profile page."

R1 said this three separate times across two agents. It became a refrain. But the recommendation is shallow.

### The deeper question: What EXACTLY should that CTA say, where should it go, and what is the psychology of the person seeing it?

**Who views a public profile?** Three personas:

1. **A captain/HOD reviewing a candidate** -- They are NOT going to create their own profile. They are evaluating. A "create your own profile" CTA is noise to them. What they need is: evidence that this platform is trustworthy, and a reason to PREFER YachtieLink profiles over PDF CVs in the future.

2. **A fellow crew member** -- They may or may not be interested. The trigger is NOT a generic CTA. The trigger is seeing something on the profile that they lack. "Sarah has 8 endorsements from 5 different yachts. I have zero." The CTA needs to activate that specific feeling.

3. **A recruiter/agency** -- Phase 2, but they will be viewing public profiles in Phase 1. What they need to see is standardization, credibility signals, and a reason to bookmark the platform.

### What the CTA should actually be:

**For persona 1 and 3 (evaluators):** Not a signup CTA. Instead, a subtle brand footer:

```
YachtieLink -- Verified employment history and peer endorsements for yacht crew.
```

This positions YachtieLink as an industry authority, not a consumer product begging for signups. Evaluators who see this on 5 different crew profiles will start to think "I should be checking YachtieLink for all my candidates."

**For persona 2 (fellow crew):** Not a footer CTA. A contextual nudge WITHIN the content. After the endorsements section:

```
[Name] has [N] endorsements from colleagues across [M] yachts.
Build your own profile -- it's free.  [Get Started]
```

The key psychological move: the nudge is attached to the social proof data, not floating at the bottom of the page. It fires when the viewer's attention is on what endorsements look like.

### A/B tests to run post-launch:

- **Test 1:** Footer-only CTA vs. contextual CTA after endorsements section. Measure signup conversion.
- **Test 2:** "Create your profile" (generic) vs. "Get endorsed by your crew" (specific). The hypothesis: the word "endorsed" is more compelling than "profile" because it implies social validation.
- **Test 3:** CTA visible to all visitors vs. CTA hidden when `viewer` is logged in (logged-in users already have accounts; showing them a signup CTA is wasted space -- show them "Endorse [Name]" instead).

### What R1 missed entirely: the logged-in viewer experience

When a logged-in user views a colleague's public profile, the CTA should NOT be "create your own profile." It should be one of:

- **"Endorse [Name]"** -- if they share a yacht and haven't endorsed yet. This is the most valuable action on the platform.
- **"Request an endorsement from [Name]"** -- if they share a yacht. Reciprocity.
- **"You have [N] colleagues in common"** -- if they are 2nd degree. Creates curiosity.

R1-A1 mentioned "No endorse action on public profile for logged-in viewers" as a bullet point. This deserves much more emphasis. It is not a nice-to-have. It is a core viral mechanic that is currently broken.

---

## 2. Challenging R1's Pro Value Assessment

### What R1 said:
> "Honest answer: It's solid but not slam-dunk."

R1 then listed incremental improvements: better analytics context, auto-updating PDF, cert calendar export, endorsement pinning. All reasonable. But R1 failed to address the fundamental tension:

### The real problem: Pro's value prop is BACKWARDS

The current Pro features are oriented around **passive monitoring** (analytics, expiry reminders) and **cosmetic upgrades** (templates, no watermark, subdomain). These appeal to a crew member who is already invested and wants to optimize. But the founding member audience is early adopters -- people who sign up in the first weeks. Early adopters are not optimizing. They are exploring.

**What early adopters actually want from Pro:**

They want to feel like insiders. They want features that make them visibly different from free users. They want something they can SHOW other crew.

The current Pro feature list has NO visible differentiator on the public profile. A captain viewing a Pro user's profile and a free user's profile sees the same thing. Pro is invisible to the outside world.

### Proposal: The "Pro glow" -- visible but not trust-altering

Per the constitutional monetization rule: "You can't pay to be more trusted. You can only pay to present yourself better." This means visible Pro differentiation is explicitly allowed, as long as it is cosmetic.

**Concrete implementation:**

1. **Founding Member badge on public profile.** A small, elegant badge: "Founding Member" in a gold-tinted pill. Positioned next to the name. Does not affect trust. Does not affect endorsement eligibility. It is pure presentation. But it creates FOMO when non-Pro crew see it on a colleague's profile.

2. **Enhanced profile header for Pro.** Free profiles have the standard card layout. Pro profiles get a subtle gradient banner, or a slightly larger photo frame, or a teal accent line. The difference should be noticeable but not dramatic. Think LinkedIn Premium's gold frame.

3. **Endorsement count visible to all, breakdown visible to Pro only.** Free users see "12 endorsements." Pro users see "12 endorsements from 8 colleagues across 5 yachts." The breakdown is the Pro value -- it is a richer presentation of the same trust data.

These are all presentation-layer enhancements. They do not cross the trust/money boundary. But they make Pro VISIBLE, which is the single biggest driver of subscription envy.

### R1 missed the annual pricing psychology

The founding member pricing is 4.99/mo or 49.99/yr. R1 said this is "well-executed." It is not. The annual price is 49.99 -- effectively 10 months for 12. That is a 17% discount. The "save 53%" claim in the UpgradeCTA compares founding annual to non-founding monthly (49.99 vs 8.99*12=107.88). This is misleading math that compares across two different dimensions (founding vs. non-founding AND monthly vs. annual).

**The fix:** Be honest about what the comparison is. "Founding member: 49.99/yr (4.17/mo). Regular price after spots fill: 69.99/yr." The founding vs. regular comparison is clean and compelling without needing to cross-reference monthly.

Also: the UpgradeCTA currently says "save 44%" for founding monthly. That compares 4.99 to 8.99. This is accurate and clear. Keep it. But drop the annual "save 53%" which is apples-to-oranges.

---

## 3. The Recruiter/Captain Persona -- What R1 Ignored

R1 was almost entirely crew-focused. This makes sense for Phase 1A. But it ignores a critical fact: **captains and agencies will be the most important viewers of public profiles from day one.** They do not need to be users to matter.

### What makes a captain think "I only accept YachtieLink profiles now"?

This is the founder's question and it is THE question for long-term platform dominance. R1 did not address it.

**The answer is not features. It is consistency.**

A captain reviewing 10 candidates currently receives:
- 3 Word doc CVs (different formats, different quality)
- 4 PDF CVs (2 are blurry phone scans)
- 2 links to Crew4Yachts profiles (outdated)
- 1 YachtieLink profile

That one YachtieLink profile has: structured employment history in reverse chronological order, cert status with color indicators, 6 endorsements from named colleagues on named yachts, a professional photo, and a clean URL.

The captain bookmarks it. Next time they are hiring, they remember: "That one profile from YachtieLink was actually useful." After seeing 5-10 of these, they start saying to candidates: "Do you have a YachtieLink?"

**This is not a feature to build. It is a behavior to enable.** The only thing the product needs to do is make the public profile so clearly superior to a PDF that captains naturally prefer it.

### What the public profile is missing for captains (desktop view):

The current public profile renders at `max-w-[640px]` -- a mobile-optimized single column. R1-A1 noted the photo is only 96x96. On a desktop monitor, this looks like a phone screen floating in empty space.

**For Phase 2+ (recruiter desktop view), but worth designing for now:**

1. **Wider layout on desktop.** `max-w-[640px]` is fine for mobile. On screens > 1024px, use a two-column layout: left column for identity card + contact + certifications, right column for employment history + endorsements. This mirrors how captains mentally evaluate: "Who is this person?" (left) and "What have they done?" (right).

2. **Print-optimized CSS.** Captains print things. A `@media print` stylesheet that renders the public profile cleanly on A4 would be a quiet power feature. No one asks for it, but the captain who prints a YachtieLink profile and puts it in a candidate folder becomes an evangelist.

3. **Summary stats at the top.** On desktop, a horizontal stat bar: "[X] years experience | [Y] yachts | [Z] endorsements | [W] certs current." This is the one-second scan that a captain needs. The data already exists in the profile -- it just needs to be computed and displayed.

4. **PDF download button on public profile.** Currently, only the profile owner can generate PDFs. A captain viewing a public profile should be able to download a PDF version (free template, watermarked). This is the bridge from "I visited the website" to "I have a document in my candidate folder." The watermark is viral marketing.

### The demand-side viral loop R1 did not describe:

```
Captain receives YachtieLink profile from Candidate A
  -> Captain is impressed by the format
  -> Captain asks Candidate B: "Do you have a YachtieLink?"
  -> Candidate B signs up to meet the captain's expectation
  -> Candidate B requests endorsements from colleagues
  -> Colleagues sign up to endorse
  -> Colleagues share their own profiles with other captains
```

This loop is entirely different from the endorsement viral loop. It is a demand-side pull. It cannot be built -- it must be earned by making the product so good that captains ask for it. But it can be ACCELERATED by two things:

1. **Making it easy for crew to say "Here's my YachtieLink" instead of "Here's my CV."** The share message should offer a captain-specific variant: "Hi [Captain], here's my professional profile with endorsements and current cert status: yachtie.link/u/handle"

2. **Making the PDF export include "View full profile at yachtie.link/u/handle" with a QR code.** Every PDF that gets emailed to an agency becomes an advertisement for the web profile.

---

## 4. The Habit Loop -- What R1 Missed About "Check It Every Morning"

R1-A2 identified re-engagement hooks: endorsement notifications, cert expiry, profile views. But it did not answer the founder's deep question: What makes crew check YachtieLink habitually?

### Why TikTok's dopamine model does not apply

TikTok's loop is: open app -> consume variable-reward content -> get dopamine -> repeat. YachtieLink is not a content platform. There is nothing to consume. Trying to create a "check it every morning" habit through content or notifications is the wrong model and would violate the "no engagement hacking" principle in yl_non_goals.md.

### The right model: YachtieLink as a STATUS MONITOR

The correct analogy is not TikTok. It is a bank account or a credit score app. People check their bank balance not for entertainment but because the NUMBER matters to them. The number is their status.

**YachtieLink's equivalent of the bank balance:**

1. **Profile views (Pro).** "23 people viewed your profile this week." This is the core re-engagement metric. Not because it is entertaining, but because it tells you: am I visible? Is my profile working? Am I on people's radar?

2. **Endorsement count.** "You have 8 endorsements." This number is your professional social capital. Like a credit score, you want it to go up, and you check periodically to see if anyone has added one.

3. **Cert status.** "4 of 5 certs valid. STCW expires in 47 days." This is practical monitoring. You check it because missing an expiry has real consequences.

**The habit is not dopamine. It is stewardship.** Crew check YachtieLink because their professional reputation lives there, and they want to make sure it is accurate, current, and growing. Like checking your LinkedIn profile when you are passively job seeking.

### How to make stewardship feel good without gamification:

- **Monthly profile report (email).** "March: 45 profile views, 2 new endorsements, all certs current. Your profile is in the top 15% by endorsement count in your department." This is not gamification. It is a status report. It creates a monthly touchpoint without requiring the user to open the app.

- **Freshness indicator (subtle).** On the private profile, show "Last updated 3 days ago" in the identity card. If stale (30+ days): "Your profile hasn't been updated recently. Agencies and captains prefer fresh profiles." This is not manipulation -- it is true. Stale profiles ARE less useful.

- **Post-season prompt (email).** When an attachment's `ended_at` passes, send: "It looks like your time on MY Serenity has ended. Update your profile and request endorsements from your crew before the memories fade." Timing endorsement requests to end-of-contract is psychologically perfect: the relationship is fresh, the emotions are warm, and the crew member has free time.

---

## 5. Phase 1 Minimal Versions of Phase 2 Features

R1 correctly avoided recommending Phase 2 features (search, discovery, messaging). But the founder's brief asks: are there MINIMAL versions that could exist in Phase 1 without violating principles?

### Availability status -- YES, minimal version is trivial

The feature registry says availability is Phase 1B. But a minimal version could ship in Phase 1A with almost zero effort:

**Implementation:** A single boolean field `available_for_work` (default false) and an optional `available_from` date. Displayed on the public profile as a green badge: "Available" or "Available from [date]."

**Why this is safe for Phase 1A:** It is self-reported, like all profile data. It does not create a search or discovery surface. It does not advantage paid users. It simply adds one more piece of information to the profile that captains/agencies actually care about. The schema already supports it -- it is just a column on the `users` table and a conditional render on the public profile.

**Why it matters now:** Availability is THE first question agencies ask. If a captain views a YachtieLink profile and sees "Available from May 2026," that profile just became 10x more actionable than a PDF that might be 6 months old. This single data point makes YachtieLink profiles categorically more useful than static CVs.

### Crew search -- NO, but consider "shared yachts" browse

Full search violates Phase 1 principles. But the colleague graph already exists. Consider making yacht alumni browsable:

When you are viewing your own profile's yacht section, each yacht shows "7 crew on YachtieLink." Tapping it shows the list of crew who have attachments to that yacht. This is NOT discovery -- it is browsing your own known professional network. It is the Network tab but organized by yacht instead of by person.

This already partially exists (the Network tab shows colleagues grouped by yacht). The minimal extension: make it linkable. When viewing a colleague's public profile, clicking on a shared yacht shows "Other crew from MY Serenity" (only those you share a connection with). This creates organic profile-to-profile navigation without global search.

### Messaging -- NO, not even minimal

Per yl_non_goals.md: "The product is identity and trust, not communication." WhatsApp already handles messaging. Adding any in-app messaging before the graph wedge is proven would be a distraction. Contact info (phone, WhatsApp, email) is already available on profiles. The communication channel should remain external.

### Languages -- YES, this is specced and overdue

The feature registry shows "Languages" as specced but not yet built. This is a significant gap. Charter yachts make hiring decisions based on language skills. French, Italian, and Spanish are premium skills in the Med. Russian and Arabic are premium for certain owners. The schema is trivial (JSONB array of `{ language, proficiency }`) and the UI is a multi-select. This should ship before launch or in the first post-launch sprint.

---

## 6. Features R1 Did Not Think Of

### 6A. "Endorse Back" Button (Reciprocity Engine)

R1-A2 mentioned "endorse back" as a bullet point. It deserves full design treatment.

**When someone endorses you:**
1. You receive a notification (email and/or in-app).
2. On the notification: "Sarah endorsed your work on MY Serenity. Read it." [View Endorsement]
3. After viewing: "Write one back? It only takes 2 minutes." [Endorse Sarah on MY Serenity]

This button should deep-link directly to a pre-filled WriteEndorsementForm with Sarah as the recipient, MY Serenity as the yacht, and the viewer's attachment data pre-populated. Zero friction.

**Why this is psychologically powerful:** Robert Cialdini's reciprocity principle is the most reliable social force in behavioral science. When someone does something nice for you (writes an endorsement), you feel obligated to return the favor. The "endorse back" button is not manipulation -- it is facilitation of a natural social impulse. And every reciprocal endorsement deepens the graph.

### 6B. "Sea Time" Auto-Calculator

R1-A2 mentioned this briefly. It deserves more emphasis.

**Implementation:** Sum of `(ended_at - started_at)` across all attachments. For ongoing attachments, use today's date. Display prominently on public profile and in PDF.

**Why it matters more than R1 realized:**
- Sea time is a regulatory concept. MCA and MLC requirements specify minimum sea time for various certifications (OOW, Master). Crew manually count days in spreadsheets.
- YachtieLink already HAS the data in attachment date ranges. Computing it is free.
- Displaying "4 years, 7 months at sea" on a profile is an immediate credibility signal.
- For Pro users: break it down by yacht type (motor/sail) and yacht size. This matters for captains hiring for specific vessel types.
- Free users get the total. Pro users get the breakdown. Clean freemium split that aligns with "you can only pay to present yourself better."

### 6C. Dynamic OG Image (WhatsApp Preview Card)

R1-A2 recommended optimizing OG images. But the specific implementation matters enormously for WhatsApp virality.

**Current state:** OG image is `profile_photo_url` (just the person's face). The WhatsApp preview shows:

```
[Photo] James Harrison -- YachtieLink
        Check out James's profile on YachtieLink
```

**Proposed:** Generate a dynamic OG image (using Vercel OG / @vercel/og) that includes:
- Profile photo (left)
- Name and role (right of photo)
- "8 endorsements | 5 yachts | All certs current" (stats bar)
- YachtieLink branding (bottom strip)

The WhatsApp preview becomes a BUSINESS CARD in the chat. Every share is a miniature advertisement. The stats create social proof before the recipient even clicks.

**This is arguably the single highest-ROI feature not currently built.** Every profile share on WhatsApp reaches 1-N people. Making that preview rich instead of bare text multiplies the conversion rate of every single share.

### 6D. "Your Crew on YachtieLink" Progress Indicator

When viewing your own yacht attachment, show:

```
MY Serenity -- 4 of your colleagues are on YachtieLink
[Photo] [Photo] [Photo] [Photo]  +8 not yet on board
```

The "+8 not yet on board" creates gentle social pressure. "I know 12 people from this yacht. Only 4 are here." The implied action: invite the others.

**Implementation:** The colleague graph already computes shared-yacht users. The "not yet on board" count requires knowing yacht crew size, which we do NOT have (no `crew_count` field on yachts). But the count of endorsement requests sent to non-users for that yacht would work as a proxy. Alternatively, skip the "not yet" count and just show the "X of your colleagues are here" with faces. The faces alone create the pull.

### 6E. "Verify My Certs" Pipeline (Zero-Effort Phase 1 Version)

Full cert verification is Phase 2. But there is a minimal signal that can ship now:

When a user uploads a cert document (PDF/image), show a "Document on file" badge next to that cert on the public profile. This is NOT verification -- it is documentation. The badge says: "This person bothered to upload proof." It is a weak signal, but it is better than nothing, and it creates a norm of documentation that makes Phase 2 verification feel natural.

The badge should be distinct from any future "Verified" badge to avoid confusion. Use a paper/document icon rather than a checkmark.

---

## 7. The Free-to-Evangelist Pipeline

### R1 said: "The free tier must solve the core problem completely."

Correct. But R1 did not explain HOW a free user becomes an evangelist. Understanding this pipeline is crucial for organic growth.

### The pipeline has 5 stages:

**Stage 1: First share.** The user creates their profile and shares it once (to a captain, to a crew WhatsApp group, in their WhatsApp bio). This is the activation event. Current time-to-first-share is approximately: signup (2 min) + onboarding (3 min) + customize profile (5 min) = ~10 minutes. This could be shorter if the onboarding "Done" screen had larger, more prominent share buttons with pre-formatted WhatsApp messages.

**Stage 2: First endorsement received.** Someone writes an endorsement for them. This is the validation event. "My profile just got more valuable without me doing anything." This creates ownership and pride. The notification for this event must be EXCELLENT. Not a bare toast. A mini-celebration: "Your first endorsement! Sarah said: '[first 100 chars]...' Your profile just got stronger."

**Stage 3: First profile view (Pro trigger).** After sharing, the user receives notification that someone viewed their profile. For free users, this is just a count ("Your profile was viewed"). For Pro, it is detailed. The GAP between what free and Pro show is the upgrade trigger. But -- and this is critical -- the free user must know that detail EXISTS. The notification should say: "Your profile was viewed 3 times this week. Upgrade to Pro to see who's looking." Not "Upgrade to see views" (they already know about views) but "Upgrade to see WHO" (the specific curiosity gap).

**Stage 4: First endorsement written.** The user endorses someone else. This is the generosity event. They have now invested emotional energy in the platform. Sunk cost + reciprocity + community identity all activate. After writing their first endorsement, they are no longer a user. They are a participant.

**Stage 5: First referral.** The user tells a colleague "You should get on YachtieLink." This happens when the user is proud enough of their profile to recommend the experience. It requires: a complete profile, at least 1-2 endorsements, and a positive emotional association with the platform.

### What accelerates the pipeline:

- **Stage 1 -> 2:** The onboarding endorsement request step (O5) already does this. The gap: only 5 invites, and they go to email. Adding WhatsApp share-link for endorsement requests would dramatically increase response rate. Crew check WhatsApp every few minutes. They check email every few days.

- **Stage 2 -> 3:** The profile view notification must arrive within 24 hours of the first share. If the user shares on Monday and gets no view notification until Thursday, the emotional connection is lost. Profile view recording is already fire-and-forget (`record_profile_event`). The gap: there is no notification system for profile views. Implement a daily digest email for users who received views: "Your profile was viewed 5 times yesterday."

- **Stage 3 -> 4:** The "endorse back" button (section 6A above).

- **Stage 4 -> 5:** The monthly profile report email (section 4 above) + seasonal prompts.

---

## 8. The Pro-as-Unfair-Advantage Framing

### Current framing (UpgradeCTA):
"Profile analytics | Premium CV templates | No watermark | Cert manager | Custom subdomain | 20 requests/day"

This is a feature list. It does not communicate WHY these features matter.

### Better framing: Pro = YOU LOOK MORE PROFESSIONAL

The target crew member is not buying features. They are buying status. The reframe:

**"Crew Pro: The professional edge"**

1. **"Know who's looking at you"** -- Profile analytics shows when agencies and captains view your profile. (Curiosity + actionable intelligence)
2. **"Stand out in the stack"** -- Premium CV templates that look different from the standard format every other candidate sends. (Differentiation anxiety)
3. **"Never miss a cert renewal"** -- Expiry reminders at 90/60/30/7 days with calendar export. (Peace of mind)
4. **"Your profile, your brand"** -- Founding Member badge, custom subdomain, no watermark. (Identity + status)

Each benefit is framed as what the crew member GAINS, not what the feature DOES.

### The founding member psychology needs a deadline

R1-A2 noted: "Missing element: deadline." Correct. "100 spots" creates scarcity but not urgency. Add: "Founding member pricing closes [date] or when 100 spots fill, whichever comes first." The date should be tied to a real event -- perhaps the start of Med season hiring (mid-April). "Founding member pricing closes April 15, 2026 or when 100 spots fill."

### The upgrade trigger should be contextual, not static

Currently, the UpgradeCTA lives only on the Insights page. The trigger is: complete your profile, visit Insights, see teaser cards, decide to upgrade.

Better: contextual upgrade nudges throughout the app:

1. **After first profile view event:** In-app banner on profile page: "Someone viewed your profile. Upgrade to see who."
2. **After generating free PDF:** "Your CV was generated with the standard template. See how the Classic Navy and Modern Minimal templates look." [Preview] + [Upgrade]
3. **After cert expiry warning:** "Your STCW expires in 58 days. Pro members get automated reminders at 90/60/30/7 days."
4. **After 5th endorsement received:** "You now have 5 endorsements. Pro members can pin their best endorsement to the top of their profile."

Each nudge appears ONCE, at the moment of maximum relevance. Not nagging. Contextual.

---

## 9. What Makes Free Users Tell EVERYONE

The founder's brief asks this directly. Here is the honest answer:

**Free users tell everyone when they feel proud of their profile AND when sharing it produces a positive reaction.**

The positive reaction comes from the recipient (the captain, the agency, the crew member who sees the link). If the recipient says "Wow, this is clean" or "I've never seen a crew profile like this," the sharer becomes an evangelist.

This means: **the public profile's visual quality IS the growth strategy.** Not viral loops. Not CTAs. Not gamification. The product itself, when shared, must produce the reaction: "This is better than anything I've seen in this industry."

### What would make the public profile produce that reaction:

1. **Summary stats bar** (years experience, yacht count, endorsement count, current cert status). One-second professional snapshot.

2. **Rich employment timeline** instead of bullet dots. A vertical line connecting entries, with yacht type icons (motor/sail), yacht length indicators, and date ranges that visually convey career trajectory. The current implementation uses a 2px dot. This should feel like a LinkedIn experience section, not a bulleted list.

3. **Endorsement cards with endorser credentials.** Currently, `EndorsementCard` does NOT show the endorser's role. The `endorser_role_label` field is available on the endorsement but not passed through to the card component. When a Chief Stewardess endorses a deckhand, the weight of that endorsement is dramatically different from a fellow deckhand endorsing them. Showing "Sarah, Chief Stewardess on MY Serenity" instead of just "Sarah" transforms the endorsement from a friendly note into a professional reference.

4. **Responsive desktop layout.** On screens > 768px, use two columns. On screens > 1024px, add generous whitespace and larger typography. The profile should look like a premium portfolio site, not a mobile screen stretched to fill a monitor.

5. **Subtle YachtieLink branding** that feels premium, not cheap. A thin teal line at the top of the page. The YachtieLink logo in the footer. "yachtie.link/u/handle" in small text below the name. These signal to captains: this is a platform, not a personal website.

---

## 10. Desktop Responsiveness -- The Recruiter View

The founder's brief notes: "Recruiters/captains will use desktop heavily in Phase 2+." And: "Think about how the public profile becomes a recruiter view on desktop."

### Current state: Everything is `max-w-[640px]`

The public profile, the private profile, the insights page -- all max out at 640px. This is correct for mobile-first but creates wasted space on desktop.

### The public profile as "recruiter view" -- design principles:

1. **No login required.** Captains and agencies will not create accounts to view profiles. The public profile must be fully functional without authentication. It already is -- good.

2. **Print-friendly.** Add `@media print` styles that hide the share button, adjust spacing, and render cleanly on A4/Letter. Captains print.

3. **Two-column layout at >= 1024px.** Left: identity card (photo, name, role, contact, certs). Right: employment history, endorsements. This mimics the mental model of a traditional CV (header + body).

4. **PDF download from public profile.** A "Download as PDF" button visible to all viewers (not just the profile owner). Uses the free template with watermark. Pro users' profiles generate PDFs with their chosen Pro template. This bridges the digital-to-paper gap that still dominates yacht hiring.

5. **Shareable subsections.** An agency reviewing 10 candidates might want to send just one person's endorsement section to a captain. Allow deep-linking to sections: `yachtie.link/u/handle#endorsements`. Already partially possible via HTML anchors but not explicitly designed.

### The private dashboard on desktop:

For Phase 2, when crew use desktop too, the tab bar should transform into a sidebar. But for Phase 1, the mobile-first tab bar is fine on desktop -- just ensure the content area does not look empty. The profile page, insights page, and network page should all be responsive at wider breakpoints.

---

## 11. Summary: Ranked Recommendations

### Tier 1: Do Before Launch (High Impact, Reasonable Effort)

1. **Endorser role on EndorsementCard.** The `endorser_role_label` exists on the endorsement data but is not displayed on public profiles. Pass it through and display it. One-line code change with massive credibility impact.

2. **Dynamic OG image for WhatsApp previews.** A Vercel OG route that renders name + role + stats. Every share becomes richer. Probably 2-4 hours of work.

3. **"Endorse [Name]" button on public profile for logged-in viewers with shared yachts.** The highest-value action is currently impossible from the most obvious place.

4. **Contextual signup CTA on public profile after endorsements section (non-logged-in viewers only).** Not a generic footer. A data-driven nudge.

5. **Availability status field** (simple boolean + date on profile). Single most useful data point for captains.

### Tier 2: Do In First Post-Launch Sprint (Growth Accelerators)

6. **Founding Member badge on public profile.** Visible Pro differentiation that drives upgrade FOMO.

7. **Sea time auto-calculator.** Compute from attachment dates. Display on profile and PDF.

8. **Daily/weekly profile view digest email.** "Your profile was viewed X times" with Pro teaser.

9. **"Endorse back" prompt.** Notification when someone endorses you with a one-tap reciprocal endorsement link.

10. **Desktop-responsive public profile layout** (two-column at >= 1024px).

### Tier 3: Do When Capacity Allows (Deepening Moats)

11. **PDF download from public profile** (free template, watermarked, for captains/agencies).

12. **Print-optimized CSS** for public profiles.

13. **Languages field** (specced, not yet built per feature registry).

14. **Monthly profile report email** with stats and seasonal prompts.

15. **Contextual Pro upgrade nudges** (after first view, after PDF gen, after cert expiry warning, after 5th endorsement).

---

## 12. Final Thought: The Real Competition

YachtieLink's competition is not another platform. It is the WhatsApp group chat where someone says "anyone know a good Chief Stew?" and 5 people forward PDF CVs. The way to win is not to build more features. It is to make the public profile so obviously superior to a PDF that forwarding a YachtieLink link becomes the natural response to that question.

Every feature decision should be evaluated against: "Does this make the public profile more compelling to the person receiving it?" If yes, prioritize. If no, defer.
