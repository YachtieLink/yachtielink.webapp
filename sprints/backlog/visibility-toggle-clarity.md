# Visibility Toggle Clarity — What Does Each Toggle Control?

**Status:** proposed
**Priority guess:** P2 (UX confusion)
**Date captured:** 2026-03-27

## Problem
Throughout the app, visibility toggles exist but it's unclear what each one controls. Some affect the public profile, some affect the generated CV, some affect both. Users don't know what they're turning on or off.

Current toggle locations:
- **Profile page section grid:** Toggle per section (About, Experience, Endorsements, etc.) — controls public profile visibility
- **Settings page:** Toggle for show_dob, show_home_country, show_phone, show_whatsapp, show_email, show_location — controls public profile visibility
- **CV page / CvActions:** Toggle for cv_public — controls whether CV is viewable at /u/handle/cv
- **CV page / CvActions:** Toggle for cv_public_source — controls whether public CV shows uploaded PDF or generated HTML

## What's confusing
- "Show About on public profile" toggle on profile page — clear enough
- "Show age on profile" toggle in Settings — does "profile" mean public profile? Generated CV? Both?
- cv_public toggle — does turning this off also hide the CV download button? The "View CV" link on the public profile?
- Section visibility toggles don't mention the CV at all — but the generated CV uses the same data

## Proposed Fix
- Add descriptive subtext under every toggle explaining exactly what it controls
- Use consistent language: "public profile" vs "generated CV" vs "both"
- Consider grouping toggles by what they affect:
  - "Public profile visibility" section
  - "CV sharing" section
  - "Contact info visibility" section
- Add a preview link next to each toggle group: "See how your public profile looks →"

## Scope
- Audit every toggle in the app
- Write clear copy for each
- May need design input on grouping/layout
- Sprint 13 (Launch Polish) is the right home for this
