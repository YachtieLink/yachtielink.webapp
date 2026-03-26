# Critical Flow Smoke Checklist

Use this when a branch touches any launch-critical surface or when closing a sprint that changed shared profile/CV/network/media behavior.

> **Also check `docs/ops/test-backlog.md`** — it tracks specific untested changes from recent PRs. This checklist catches regressions; the test backlog catches whether new work actually works.

## Always Run First

1. `npm run build`
2. `npm run drift-check`
3. `npm run lint` (informational — lint has pre-existing failures repo-wide; review output but don't block on it until the lint baseline is clean)

Use the dev account in `AGENTS.md` unless a sprint doc says otherwise.

## 1. Onboarding

Route: `/onboarding`

Check:
- authenticated user reaches the wizard without redirect loops
- existing profile data pre-fills where expected
- next/back/progress state behaves correctly on mobile
- completing the flow lands on the intended protected surface

## 2. CV Import And Review

Routes: `/app/cv/upload`, `/app/cv/review`, `/app/cv`

Check:
- upload accepts the supported file types
- parse starts once, not twice
- review flow resumes correctly after refresh
- confirmed data saves without duplicate yachts/certs/attachments
- old CV state does not leak between uploads

## 3. Public Profile

Routes: `/u/[handle]`, `/u/[handle]/cv`

Check:
- logged-out viewer can load the public profile
- profile sections match privacy rules
- mutual/relationship data renders only when expected
- public CV view matches the intended presentation mode

## 4. Endorsement Requests

Routes: `/app/endorsement/request`, `/api/endorsement-requests`

Check:
- request form creates a request successfully
- limits behave correctly for free vs Pro users
- share links or direct links resolve to the right profile/request
- duplicate or invalid requests fail cleanly with a user-facing error

## 5. Photos And Gallery

Routes: `/app/profile/photos`, `/app/profile/gallery`

Check:
- upload succeeds and renders immediately
- reorder persists after refresh
- delete removes the asset cleanly
- Pro gates match the current plan rules without hiding paid features on transient failures

## 6. PDF Generation

Routes: `/app/cv`, `/api/cv/generate-pdf`

Check:
- generate action succeeds for the intended plan tier
- downloaded/exported PDF uses the selected template
- key profile sections match the HTML CV surface
- retry/error states are clear when generation fails

## Exit Rule

If a branch touched one of these flows, do not mark verification complete until the relevant checklist items were actually exercised. If a flow could not be tested, say so explicitly in the sprint log or final handoff.
