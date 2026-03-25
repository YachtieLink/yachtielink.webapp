# Canonical Owner: Media And Pro Gating

## Target

Media flows should use shared upload/delete helpers, and plan gating should go through the shared Pro helper rather than inline checks.

## Canonical Owners

| Responsibility | Canonical owner |
|---|---|
| Pro status decision | `lib/stripe/pro.ts` |
| media storage helpers | `lib/storage/upload.ts` |
| shared rate limits | `lib/rate-limit/helpers.ts` |
| route-level validation and error handling | shared helpers in `lib/api/` and `lib/validation/` |

## Drift To Avoid

- `subscription_status === 'pro'` checks in pages and route handlers
- copy-pasted upload/delete logic across photos and gallery
- route-specific media behavior diverging without a product reason
- client UI hiding paid features because a transient status fetch failed

## Build Rules

- any UI or API Pro decision should start from `getProStatus()`
- media routes should call shared upload/delete helpers instead of open-coding storage behavior
- if photos and gallery need the same rule, implement it once

## Current Divergence

- `app/api/user-photos/route.ts` and `app/api/user-gallery/route.ts` both inline `subscription_status === 'pro'` checks instead of calling `getProStatus()`
- `lib/storage/upload.ts` duplicates upload/delete logic for `user-photos` and `user-gallery` buckets
- `app/api/user-photos/route.ts` and `app/api/user-gallery/route.ts` duplicate auth, plan-limit, create, and reorder logic
- `app/api/user-photos/[id]/route.ts` and `app/api/user-gallery/[id]/route.ts` duplicate ownership + storage deletion handling

## Cleanup Tracked In

CV Parse Bugfix sprint (Wave 5 or follow-up cleanup sprint) — media/CRUD standardization will be piggybacked if those files are touched, otherwise deferred to a focused cleanup sprint.

## Review Questions

- Did this branch bypass `lib/stripe/pro.ts`?
- Did it duplicate media storage behavior that already exists in `lib/storage/upload.ts`?
- Did it introduce a free-vs-Pro rule in a place that should have been shared?
