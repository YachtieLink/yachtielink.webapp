# Subdomain Full Experience

**Status:** idea
**Priority guess:** P3 (nice-to-have)
**Date captured:** 2026-03-29

## Summary

Upgrade Pro subdomain routing so all sub-pages (`/endorsements`, `/cv`, etc.) stay on the subdomain instead of redirecting to the main domain. Currently only the root profile page renders on `handle.yachtie.link`; any deeper navigation redirects to `yachtie.link/u/handle/...`.

## Why

Makes the Pro subdomain feel like a fully branded experience rather than just a vanity root URL. Lower priority because nobody shares deep links — the vanity URL on a business card or LinkedIn bio is the real value.

## Scope

- Update middleware to rewrite (not redirect) sub-pages under subdomains
- Ensure all internal links within `PublicProfileContent` stay on subdomain context when rendered via subdomain route
- Verify analytics, OG tags, canonical tags, and auth cookies work correctly on sub-pages
- Test navigation flow: subdomain root → endorsements → CV → back — all staying on subdomain

## What doesn't need to be built yet

- Custom domains (e.g. `crew.aristeele.com`) — that's a separate feature using the `custom_subdomain` DB column
