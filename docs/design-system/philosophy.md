# Design Philosophy

This is the deepest layer — the *why* behind every design choice. Read this before reading patterns, flows, or the style guide. If you understand this, the right design decisions follow naturally.

---

## The Core Tension

YachtieLink is a professional network for yacht crew. Professional networks are boring. Yacht crew are not.

The design has to hold both: serious enough that a captain trusts it when reviewing a potential hire, alive enough that a 24-year-old deckhand wants to share it on Instagram.

**The answer is not "split the difference."** The answer is: be professional in substance, expressive in presentation. The data is rigorous (verified employment, coworker endorsements, real yacht history). The wrapper is warm, colourful, and personal.

---

## Five Principles

### 1. Crew First

Crew are the mobile, vulnerable party in yachting. They move between yachts, countries, and employers. Their professional identity doesn't belong to any employer — it belongs to them.

Every design choice should make crew feel like this is *their* space. Not a recruiter tool they're being squeezed through. Not an employer dashboard they're being monitored on. Their profile, their data, their presentation.

**What this means in practice:**
- The profile is the product, not the search results page
- Crew control what's visible, what's hidden, and how they present themselves
- Empty states are encouraging, never shaming ("make your profile incredible" not "your profile is incomplete")
- Trust signals (endorsements, verified yachts) are earned through real relationships, never purchasable

### 2. Photo-Forward

Yacht crew are physical, active people working in visually spectacular environments. The app should feel like that.

Photos are not an afterthought bolted onto a form. They're the first thing you see. The profile opens with a full-bleed photo gallery, not a text header. The public profile has a split layout where the photo is persistent.

**What this means in practice:**
- Profile hero: 65vh on mobile, 40% sticky on desktop. Photo first, text second.
- Work gallery is a first-class feature, not a settings page buried at the bottom
- Empty photo states use visual CTAs (icon + prompt), not just text links
- Image quality matters: resize, compress, WebP conversion before upload

### 3. Progressive Disclosure

Show what matters, hide what doesn't, reveal on demand. The profile should look complete at a glance, with depth available if you want it.

This is what makes accordion sections work: collapsed, you see a smart summary line ("3 yachts · 4 years at sea"). Expanded, you see the detail. The user controls the depth.

**What this means in practice:**
- Every section has a collapsed summary and an expanded detail view
- Sections with no data don't render — they're invisible, not empty
- The profile page is a stack of cards, not a long form
- Edit pages are spokes off the profile hub — go out, make a change, come back

### 4. Instant Good

The worst moment in any app is the blank profile. YachtieLink solves this with CV parsing — upload a PDF and the profile populates immediately. But the design has to support this.

A CV-parsed profile with 3 of 7 sections filled should look *good*, not broken. That means hidden-by-default empty sections, a strength meter that frames 60% as positive, and prompts that say "make it incredible" rather than "finish it."

**What this means in practice:**
- Profile Strength meter: "Getting started" → "Looking good" → "Standing out" → "All squared away"
- After CV parse, the profile should look polished before the user touches anything
- Uplift prompts are framed as enhancement, not completion
- One prompt at a time, most impactful first, dismissible

### 5. Trust Is Not For Sale

Paying should improve how a profile *looks* and works. It should never improve how *trustworthy* someone appears.

Endorsements, verified yachts, and the colleague graph work the same way for free and paid users. What Pro unlocks is presentation — better PDF templates, more photos, analytics, cosmetic features.

**What this means in practice:**
- Endorsement badges, connection indicators, and verification signals are identical across tiers
- Pro features are presentation: templates, gallery slots, analytics, QR customisation
- If a design choice makes it look like paid users are "more trusted," stop and flag it
- The monetisation colour rule: teal for trust, sand for Pro presentation

---

## The Feeling

When someone visits a YachtieLink profile, they should feel:

**"This person is a real professional who takes their career seriously, and they seem like someone I'd enjoy working with."**

Not "this person filled out a corporate form." Not "this person is on a dating app." The sweet spot between LinkedIn's rigour and Instagram's warmth.

When a crew member builds their profile, they should feel:

**"This is the best version of my professional self. I'm proud to share this."**

Not "I finally finished this chore." Not "I hope this is enough."

---

## Visual Identity Summary

| Attribute | Direction |
|-----------|-----------|
| Tone | Warm professional — 75% professional, 25% personality |
| Maritime feel | 25% — through colour and naming, never through clip art |
| Colour | Teal primary, sand warmth, coral/navy/amber for section identity |
| Typography | DM Serif Display for headlines (warmth), DM Sans for everything else (clean) |
| Animation | Purposeful — entrances, state changes, celebrations. Never gratuitous. |
| Photography | Full-bleed, high quality, the hero of the experience |
| Empty states | Encouraging illustrations (Salty mascot), never blank voids |
| Spacing | Generous whitespace, cards with breathing room |
| Corners | Rounded-2xl cards, rounded-xl inputs. Soft, approachable. |

---

## Product Invariants

These never change regardless of phase or feature:

- No scoring, no rankings, no "trust levels," no comparative language
- Absence of endorsements is neutral — no shame, no red states
- Endorsement gating: coworker on shared yacht, verified
- Paid = presentation only. Trust signals are tier-agnostic.
- Mobile Safari first. Responsive up, never desktop-down.
- No feeds, no discovery page. Profiles are accessed via direct link, QR, or share.
- Dark mode from launch. System preference respected, manual override available.

---

## How This Connects to Everything Else

| Question | Where to look |
|----------|---------------|
| What colour do I use? | `style-guide.md` → Colour Palette |
| What component pattern exists? | `patterns/` |
| Where does this page sit in the app? | `flows/` |
| Has this been tried before? | `decisions/` |
| What does the app look like right now? | `reference/screenshots/` |
| What are we inspired by? | `inspirations.md` |
| What are the exact CSS tokens? | `style-guide.md` → File References → `globals.css` |
