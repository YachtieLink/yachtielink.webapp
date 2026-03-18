# Salty — YachtieLink Mascot & AI Personality Spec

> **Status:** Design spec. Ready for visual design exploration.
> **Created:** 2026-03-17

---

## 1. What Is Salty?

Salty is an ethereal spirit of wind and water — a wispy, luminous character that embodies the unseen forces that guide sailors. Not a person, not an animal, not a cartoon — something between a sea breeze and a current. Think of Salty as the helpful presence that's always been there on the water, now living in your pocket.

Salty is powered by AI but **we never say that.** Salty just knows things, notices things, and helps. The technology is invisible. The personality is everything.

---

## 2. Visual Identity

### Form
- **Shape:** An abstract, fluid form — part breeze, part ripple. Imagine a small swirl of wind and water that has coalesced into something with just enough personality to feel alive
- **Features:** Two soft glowing dots for eyes (like bioluminescence or starlight reflected on water). No mouth, nose, or hard edges. Expression comes from eye position, body shape, and motion
- **Body:** Translucent/semi-transparent with a gentle inner glow. Colour shifts between teal (water) and white/silver (wind) depending on context
- **Trail:** Leaves a subtle trail of tiny dots or wisps — like sea spray or wind-carried particles

### Design principles
- **Geometric but organic** — built from curves and circles, not hard angles. Like Notion's Nosey but more fluid
- **Scalable:** Must work at:
  - **16px** — favicon/tiny indicator (just the two eye dots)
  - **24px** — inline text hints (simplified silhouette)
  - **48px** — cards, badges, nav elements (recognisable form)
  - **120-200px** — empty states, onboarding, error pages (full detail with animation)
- **Colour:** Primarily teal-500 (`#11BABB`) with white highlights. In dark mode, slightly more luminous/glowing
- **Style:** SVG-based, single-weight strokes where needed, mostly filled shapes with transparency

### Moods / Poses
Salty's form shifts to express different states:

| Mood | Form | When |
|------|------|------|
| **Neutral/present** | Gently bobbing, calm shape | Default state, idle hints |
| **Curious** | Leaning forward, eyes wider | Viewing something, exploring |
| **Helpful** | Extending a wisp toward content | Offering a tip, nudging action |
| **Celebrating** | Expanding, sparkles/particles radiating | Profile complete, first endorsement, milestone |
| **Searching** | Elongated, scanning motion | Loading, processing, searching |
| **Alert** | Eyes brighter, slight pulse | Cert expiry, new endorsement, notification |
| **Sleeping** | Compact, eyes as crescents | Inactive feature, nothing to report |
| **Lost** | Swirling confused, scattered wisps | 404, error states |

---

## 3. Personality & Voice

### Character traits
- **Knows the ropes** — uses subtle nautical language naturally, not forced
- **Observant** — notices things before you do (cert expiring, profile incomplete, new colleague joined)
- **Warm but not chatty** — says what's needed, no filler. One line, not a paragraph
- **Never condescending** — respects that crew are professionals. Salty is a helpful shipmate, not a tutor
- **Quietly proud of you** — celebrates your milestones without being over the top

### Voice examples

| Context | Salty says | NOT this |
|---------|-----------|----------|
| Empty endorsements | "No endorsements yet. Your shipmates know your work — ask them." | "You haven't received any endorsements! Click here to request one." |
| Cert expiring 30 days | "Your STCW is coming up for renewal." | "WARNING: Your STCW Basic Safety Training certificate expires in 30 days! Take action now." |
| First endorsement received | "Your first endorsement just landed." | "Congratulations! You've received your first endorsement! 🎉" |
| Profile 100% complete | "All squared away." | "Amazing! Your profile is now 100% complete! You're in the top 20%!" |
| No CV yet | "Your CV is waiting to be built." | "You haven't created your CV yet. Get started now!" |
| 404 page | "Drifted off course. Let's get you back." | "Page not found. The page you're looking for doesn't exist." |
| Empty network | "Your crew will show up here as they come aboard." | "You don't have any connections yet. Share your profile to start building your network." |
| New colleague joined | "Someone from MY Serenity just came aboard." | "A new colleague has joined YachtieLink! Check out their profile." |

### Voice rules
- First person: never. Salty doesn't say "I" — the messages just appear, like they're spoken by the wind
- No exclamation marks. Calm confidence, not excitement
- No emoji. The illustration IS the personality
- Maximum 12 words per Salty message in-app. Longer only for onboarding or emails
- Nautical language is a spice, not the whole dish — one nautical word per message max

---

## 4. Feature Integration Map

### Onboarding

| Step | Salty's role | Visual | Message |
|------|-------------|--------|---------|
| Welcome screen | Appears for the first time, large (200px), gently swirling into existence | Fade-in with sparkle particles | "Welcome aboard." |
| Profile photo | Floats near the photo upload area | Curious pose, looking at the upload zone | "Put a face to the name." |
| Handle selection | Small, near the input field | Helpful pose, wisp pointing at input | "This is your address on the water." |
| Add first yacht | Beside the yacht form | Neutral, bobbing gently | "Where have you sailed?" |
| Request endorsements | Near the invite inputs | Encouraging, slightly expanded | "Your crew knows your worth. Ask them." |
| Completion | Centre screen, celebrating | Expanding with particles | "All squared away. Your profile is live." |

### Profile Page

| Scenario | Salty's role | Size | Where |
|----------|-------------|------|-------|
| Profile completeness < 100% | Appears near the progress wheel | 48px | Beside ProgressWheel |
| Profile 100% complete | Hidden (not needed — profile speaks for itself) | — | — |
| Empty bio section | Inline hint | 24px | Within empty bio card |
| No profile photo | Near avatar placeholder | 48px | Corner of avatar |

### CV

| Scenario | Salty | Message |
|----------|-------|---------|
| No CV created | Empty state illustration (120px) | "Your CV is waiting to be built." |
| CV outdated (profile changed since last generation) | Small alert near regenerate button (24px) | "Your profile has changed since this was generated." |
| Upload + parse success | Brief celebration (48px) | "Got it. Review your details." |

### Endorsements

| Scenario | Salty | Message |
|----------|-------|---------|
| No endorsements yet | Empty state (120px) | "No endorsements yet. Your shipmates know your work — ask them." |
| First endorsement received | Celebration animation (120px, one-time) | "Your first endorsement just landed." |
| Endorsement request sent | Brief confirmation (48px) | "Sent." |
| Writing an endorsement for someone else | Small encouraging presence (24px) | "Be specific. The best endorsements tell a story." |

### Certifications

| Scenario | Salty | Message |
|----------|-------|---------|
| No certs added | Empty state (120px) | "Add your certifications. They matter." |
| Cert expiring in 60 days | Alert pose beside cert card (24px) | "Coming up for renewal." |
| Cert expired | Alert pose, slightly more urgent (24px) | "This one's lapsed." |
| All certs valid | Hidden (not needed) | — |

### Network

| Scenario | Salty | Message |
|----------|-------|---------|
| Empty network | Empty state (120px) | "Your crew will show up here as they come aboard." |
| New colleague joined | Small notification accent (24px) | "Someone from [Yacht] just came aboard." |
| Pending endorsement request | Alert near the request (24px) | "Someone's asking for your word." |

### Insights (Analytics)

| Scenario | Salty | Message |
|----------|-------|---------|
| No views yet | Empty state (120px) | "Share your profile and the views will come." |
| First profile view | Curious pose (48px) | "Someone's looking." |
| Pro upsell teaser | Helpful pose near locked card (48px) | "Want to know who's watching?" |
| Weekly summary (email/notification) | Header illustration | "This week: [X] views, [Y] new from [location]." |

### Errors & Edge Cases

| Scenario | Salty | Message |
|----------|-------|---------|
| 404 page | Lost pose, large (200px) | "Drifted off course. Let's get you back." |
| Server error (500) | Confused, scattered (200px) | "Something went sideways. Try again in a moment." |
| Offline | Sleeping/waiting (120px) | "No signal. We'll catch up when you're back." |
| Session expired | Alert (120px) | "You've been logged out. Sign back in to continue." |

### Pro Upgrade Moments

| Scenario | Salty | Message |
|----------|-------|---------|
| Analytics locked | Peering at locked content (48px) | "Want to know who's watching?" |
| Premium CV templates | Beside template previews (48px) | "Stand out from the stack." |
| Cert reminders (Pro feature) | Near cert list (24px) | "Never miss a renewal." |

### Marketing / Landing Page

| Section | Salty | Role |
|---------|-------|------|
| Hero | Large (200px+), animated entrance | The welcoming presence — swirls in from off-screen |
| Feature sections | Small (48px) beside each feature card | Different pose per feature (curious for profiles, alert for certs, celebrating for endorsements) |
| CTA section | Helpful pose (120px) | Near "Get started" button |
| Footer | Tiny (24px) | Subtle presence, sleeping or neutral |

### Notifications & Emails

| Type | Salty | Role |
|------|-------|------|
| Email header | Small illustration (48px) | Consistent branding element in all transactional emails |
| Push notification icon | 16px favicon-style | The two-dot eyes as the notification icon |
| Cert expiry email | Alert pose beside cert name | Visual anchor for the email content |
| Weekly insights email | Curious pose | Accompanies the stats summary |

### Future AI Features (invisible AI, visible Salty)

| Feature | How Salty presents it | How it works behind the scenes |
|---------|----------------------|-------------------------------|
| CV auto-generation | "Your CV has been drafted from your profile." | AI generates CV content from structured profile data |
| Smart endorsement prompts | "Sarah's a good one to ask — you sailed together for 2 seasons." | AI analyses attachment overlap to suggest best endorsers |
| Cert package checker | "For your role, you're missing one certification." | AI maps role to required cert packages |
| Cover letter generation (Pro) | "Here's a starting point for your application." | AI drafts cover letter from profile + job context |
| Profile strength suggestions | "Adding a bio would help. Captains read them." | AI analyses profile completeness and engagement data |
| Anomaly detection | "Something doesn't look right with this endorsement." | AI moderation flags suspicious content |

**The pattern is always the same:** Salty delivers the insight in plain, warm language. The AI is never mentioned. The user experiences a helpful companion, not a technology.

---

## 5. Animation Spec

### Idle state
- Gentle bobbing: `translateY` oscillation, ±3px, 3s duration, infinite loop
- Subtle inner glow pulse: opacity 0.7 → 1.0, 4s duration
- Eye dots occasionally blink (opacity 1 → 0 → 1, 150ms, every 5-8s random interval)

### Entrance
- Swirl in from nothing: scale 0 → 1 with rotation, particles scatter outward
- Duration: 600ms with spring physics
- Use only on first appearance per session, not on every page load

### Celebration
- Scale up briefly (1 → 1.15 → 1), particles radiate outward in a burst
- 3-5 small sparkle dots animate outward and fade
- Duration: 800ms total
- Trigger: profile complete, first endorsement, milestone achievements

### Alert / notification
- Brief brightening of eye dots
- Single gentle pulse (scale 1 → 1.05 → 1)
- Duration: 400ms

### Transition between pages
- Salty does NOT animate between pages — it simply appears in the correct position on each page
- Avoids performance overhead and keeps focus on content

### Implementation
- All Salty animations use Framer Motion (already in the project)
- Idle animation: CSS `@keyframes` for performance (runs on compositor thread)
- Interactive animations: Framer Motion variants from `lib/motion.ts`
- SVG-based — no raster images, no Lottie dependency (keep it simple)

---

## 6. Technical Implementation

### Component structure

```
components/
  salty/
    Salty.tsx              — Main component, accepts mood/size/message props
    SaltyEmptyState.tsx    — Salty + message + optional CTA for empty states
    SaltyHint.tsx          — Inline Salty tip (24px, one line of text)
    SaltyIllustration.tsx  — The SVG illustration with mood variants
    salty-moods.ts         — SVG path data for each mood/pose
```

### Props API

```tsx
interface SaltyProps {
  mood?: 'neutral' | 'curious' | 'helpful' | 'celebrating' | 'searching' | 'alert' | 'sleeping' | 'lost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'  // 16, 24, 48, 120, 200px
  message?: string
  animate?: boolean  // enable/disable animation (default true)
  className?: string
}
```

### Size mapping

| Size | Pixels | Use case |
|------|--------|----------|
| `xs` | 16px | Favicon, tiny indicators |
| `sm` | 24px | Inline hints beside text |
| `md` | 48px | Cards, badges, small callouts |
| `lg` | 120px | Empty states, celebrations |
| `xl` | 200px | Onboarding welcome, error pages, marketing hero |

### Rendering rules
- Salty only renders client-side (needs Framer Motion for animation)
- Use `'use client'` directive
- Lazy-load for pages where Salty is non-critical (marketing page hero can eager-load)
- Respect `prefers-reduced-motion`: disable all animation, show static pose

---

## 7. What Salty Is NOT

- **Not a chatbot.** Salty doesn't have a conversation interface. Messages are one-way contextual hints
- **Not AI-branded.** Never say "Salty is powered by AI" or "AI assistant." Salty just helps
- **Not always present.** Salty appears when there's something to say or an empty state to fill. Full, active pages don't need Salty cluttering them
- **Not a tutorial system.** Salty doesn't walk you through features step by step. It offers brief, contextual nudges
- **Not gendered.** Salty is an it/they, never he/she. An elemental spirit has no gender
- **Not a product mascot in the marketing sense.** Salty doesn't appear on business cards, pitch decks, or investor materials. Salty lives in the product experience only

---

## 8. Design Deliverables Needed

Before implementation, we need:

1. **SVG artwork** for each of the 8 moods at the `lg` (120px) reference size
2. **Simplified versions** at `md` (48px) and `sm` (24px) — fewer details, same character
3. **Favicon version** — just the two eye dots at 16px
4. **Colour variants** — light mode (teal on white) and dark mode (luminous on dark)
5. **Animation storyboards** — entrance, celebration, and idle sequences

These could come from a designer, or we could build the initial version programmatically as SVG paths and iterate from there.

---

## 9. Rollout Plan

### Phase 1 — Empty states (highest impact, simplest)
- Replace all "no data" text-only states with SaltyEmptyState
- Screens: endorsements, network, CV, certs, insights
- Error pages: 404, 500

### Phase 2 — Onboarding
- Add Salty to each onboarding step
- Welcome screen entrance animation
- Completion celebration

### Phase 3 — Contextual hints
- SaltyHint for cert expiry warnings
- SaltyHint for profile completeness nudges
- SaltyHint for endorsement request encouragement

### Phase 4 — AI feature integration
- Salty as the face of smart suggestions
- CV generation messaging
- Endorsement prompts
- Profile strength recommendations

### Phase 5 — Marketing & brand
- Landing page hero illustration
- Email header branding
- Notification icon
