# Subdomain Cookie & Auth Audit

**Status:** fleshed-out
**Priority guess:** P1 (critical)
**Date captured:** 2026-03-27

## Summary
Auth cookies set on `yachtie.link` are not shared with `*.yachtie.link` subdomains. Logged-in users appear as guests on subdomain profile pages (see guest prompts, no edit/save buttons). Initial fix attempted (`.yachtie.link` cookie domain in all 3 Supabase clients) — did not work on first deploy. Needs deeper investigation.

## Known Issues
1. **Cookie domain not propagating:** Set `domain: '.yachtie.link'` in middleware, server, and browser Supabase clients but subdomain still doesn't see auth session. May need: Supabase project-level cookie config, or the domain needs to be set differently in `@supabase/ssr`.
2. **Existing cookies:** Users who logged in before the fix have cookies scoped to `yachtie.link` (no leading dot). These won't be sent to subdomains. May need a migration path (force re-login, or set both domains during transition).
3. **Links on subdomain:** Root-only rewrite is in place. Non-root paths redirect to main domain. But need to verify all edge cases.
4. **Favicon:** Subdomain root serves the profile page via rewrite — favicon may not load correctly since it's a rewrite not a redirect.

## Deep Scan Required
Do a repo-wide audit for everything that subdomains will break:

### Cookie & Auth
- [ ] Verify `@supabase/ssr` `cookieOptions.domain` is the correct API (check Supabase docs for wildcard subdomain support)
- [ ] Check if Supabase Dashboard has a project-level cookie domain setting
- [ ] Verify `Set-Cookie` headers in production responses include `Domain=.yachtie.link`
- [ ] Check if `sameSite` cookie attribute needs adjusting for cross-subdomain
- [ ] Test: clear all cookies, login fresh on `yachtie.link`, then visit `handle.yachtie.link`

### Links & Navigation
- [ ] Audit all `<Link>` and `<a>` tags in `PublicProfileContent` and section components — do any break on subdomain?
- [ ] Check `ShareButton` — does it share the correct URL (main domain, not subdomain)?
- [ ] Check social links — do they resolve correctly?
- [ ] Check CV download link — does `/api/cv/public-download/` work from subdomain?

### Assets & Meta
- [ ] Favicon on subdomain pages
- [ ] OG image URLs — do they resolve from subdomain?
- [ ] Canonical tags — verify they point to `yachtie.link/u/{handle}` not the subdomain
- [ ] `manifest.webmanifest` — does it load on subdomains?

### API & Data
- [ ] API routes called from subdomain pages (e.g. `record_profile_event`) — do they work cross-origin?
- [ ] PostHog analytics — does the provider work on subdomains?
- [ ] CORS — any API routes that check origin?

### Security
- [ ] CSRF — does the subdomain introduce cross-origin request risks?
- [ ] Cookie scope — ensure auth tokens can't be read by attacker-controlled subdomains (handle validation prevents `evil.yachtie.link` but verify)
- [ ] CSP headers — do they allow subdomain origins?

## Notes
- The cookie domain fix was deployed but didn't resolve the issue on first test. Founder needs to log out and back in for new cookie domain to take effect — this wasn't tested before session ended.
- May need Supabase support docs or community examples for wildcard subdomain cookie sharing.
