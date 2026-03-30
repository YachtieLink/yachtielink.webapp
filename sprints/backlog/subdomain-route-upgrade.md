# Subdomain Route Upgrade

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-03-29

## Summary

Pro user subdomains (`handle.yachtie.link`) currently redirect internal links and OG sharing to `/u/{handle}` on the main domain. This works but means the subdomain isn't a fully standalone experience — links within the profile bounce users to the main site, and sharing the subdomain URL previews as the main domain URL.

## Context

As of Rally 006 (2026-03-29), subdomains are verified working:
- Profile renders correctly on subdomain
- Non-Pro users see upgrade prompt
- Non-existent handles get signup encouragement
- Cookie auth works across subdomains
- Analytics events fire for subdomain views

The redirect behaviour is acceptable for launch. This upgrade is about making the subdomain feel like a true standalone presence for Pro users.

## Scope

### Build
- Internal links on subdomain profile stay on the subdomain (e.g., endorsement detail, yacht links)
- OG tags on subdomain pages use the subdomain URL as canonical
- Share actions from subdomain copy the subdomain URL, not the `/u/{handle}` URL
- Sub-pages render on subdomain: `handle.yachtie.link/endorsements`, `handle.yachtie.link/cv`

### Don't build yet
- Custom themes or branding per subdomain
- Subdomain analytics separate from main domain analytics

## Notes
- SEO consideration: canonical tags need to be correct to avoid duplicate content penalties. Decide whether subdomain or `/u/{handle}` is the canonical URL for Pro users.
- This is a Pro-only enhancement — low urgency since the current redirect approach works and Pro users are a small early cohort.
