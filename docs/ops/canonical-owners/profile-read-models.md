# Canonical Owner: Profile Read Models

## Target

Profile, CV, and network presentation surfaces should read from shared query/build helpers rather than re-assembling the same shapes in pages and route handlers.

## Canonical Owners

| Responsibility | Canonical owner |
|---|---|
| shared profile reads | `lib/queries/profile.ts` |
| public profile page shell | `app/(public)/u/[handle]/page.tsx` stays thin and delegates shaping |
| public profile rendering | `components/public/` section components fed by typed props |
| protected profile reads | shared helpers under `lib/queries/` before new inline Supabase page queries |

## Drift To Avoid

- page files assembling large viewer-relationship objects inline
- near-duplicate profile/CV/network query shapes across pages, APIs, and PDF routes
- repeated `as any` casts at the page/component boundary instead of defining a shared type

## Build Rules

- if two surfaces need the same profile shape, extract or extend a shared helper
- page files should handle auth, call shared readers, and render typed props
- large presentation files should be section-oriented, not one giant render hub

## Current Divergence

- `app/(protected)/app/cv/preview/page.tsx` and `app/(public)/u/[handle]/cv/page.tsx` repeat the same six section queries (attachments, certs, endorsements, education, skills, hobbies)
- `app/(protected)/app/profile/page.tsx` re-queries `user_photos` despite `lib/queries/profile.ts` already returning photos
- `app/(public)/u/[handle]/page.tsx` builds a bespoke public-profile read model with inline viewer-relationship logic and `as any` casts instead of using a shared helper
- `components/public/PublicProfileContent.tsx` defines `attachments`, `certifications`, and `endorsements` as `any[]`

## Cleanup Tracked In

CV Parse Bugfix sprint (Waves 2-3) — public profile and CV view fixes will provide the natural opportunity to extract shared read models.

## Review Questions

- Is this branch adding another profile read model?
- Is data shaping happening in a page that should be delegated?
- Should this query move into `lib/queries/profile.ts` or a sibling shared builder?
