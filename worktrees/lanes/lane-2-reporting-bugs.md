# Lane 2 — Reporting/Flagging + Bug Reporter

**Branch:** `feat/reporting-bugs`
**Worktree:** `yl-wt-2`
**Model:** Sonnet | **Effort:** high
**Sprint ref:** Rally 009 Session 6, Lane 2

---

## Objective

Ship trust infrastructure: report button (profiles, yachts, endorsements) with target-appropriate categories, yacht duplicate flagging with search, bug report form, and founder email alerts. Tables already exist in the database — build the API routes, components, and wiring.

## Migration Note

**DO NOT create or modify any migration files.** The migration (`20260403100002_reports_bug_reports.sql`) is already applied and committed on main. Types are regenerated. Use `Database["public"]["Tables"]["reports"]` and `Database["public"]["Tables"]["bug_reports"]` from `lib/database.types.ts`.

## Tasks

### Task 1: Report API Route

**File:** `app/api/report/route.ts` (new)
- POST with auth (use `createClient` from `@/lib/supabase/server`)
- Rate limit: 10 reports/hour/user (check with a count query, not middleware)
- Zod validation: target_type, target_id, reason (10-2000 chars), category
- Validate category matches target_type (profile vs yacht categories)
- If `category === 'duplicate_yacht'`, require `duplicate_of_yacht_id`
- Insert into reports table
- **Send email notification to founder** on every report (use Resend — check existing email patterns in `app/api/` or `lib/`)
- Return 201

### Task 2: ReportButton Component

**File:** `components/ui/ReportButton.tsx` (new)
- Small flag icon button (lucide `Flag` icon)
- Opens modal/sheet with: category selector (dynamically filtered by `targetType`) + reason textarea
- For yacht `duplicate_yacht` category: includes yacht search to select the duplicate target (reuse existing yacht search if available)
- Submit → API call → success toast "Report submitted"
- Reusable — takes `targetType` + `targetId` props

### Task 3: Wire ReportButton

Add `ReportButton` to:
- Public profile page (`app/(public)/u/[handle]/page.tsx`) — profile categories
- Yacht detail page (find it — endorsement cards or network yacht views) — yacht categories
- Endorsement cards (wherever endorsements are displayed)
- Keep it subtle — small icon, doesn't dominate the UI

### Task 4: Bug Report API Route

**File:** `app/api/bug-reports/route.ts` (new)
- POST with auth, rate limit 10/hr/user, Zod validation
- Capture `user_agent` from request headers server-side
- Return 201

### Task 5: Bug Report Page

**File:** `app/(protected)/app/more/report-bug/page.tsx` (new)
- Category selector (bug, UI issue, performance, other)
- Description textarea (10-2000 chars)
- Optional page URL input
- Submit → success confirmation (replaces form to prevent double-submit)
- Follow roadmap page layout pattern (PageHeader + card)
- Sand section color

### Task 6: Settings Link

**File:** `app/(protected)/app/more/page.tsx` (modify)
- Add "Report a Bug" row in the Help section
- Use `Bug` icon from lucide

## Allowed Files

- `app/api/report/route.ts` — new
- `app/api/bug-reports/route.ts` — new
- `components/ui/ReportButton.tsx` — new
- `app/(protected)/app/more/report-bug/page.tsx` — new
- `app/(protected)/app/more/page.tsx` — add link
- `app/(public)/u/[handle]/page.tsx` — add ReportButton
- Endorsement card components — add ReportButton
- Yacht detail / network yacht components — add ReportButton

## Forbidden Files

- `supabase/migrations/*` — DO NOT TOUCH
- `lib/database.types.ts` — already regenerated
- CV wizard components (Lane 1)
- Endorsement write/request pages (Session 5 territory)
- Experience transfer components (Lane 3)
- ProUpsellCard (Lane 4)

## Patterns to Follow

- Read existing API routes in `app/api/` for auth pattern (`createClient`, `getUser`)
- Read `app/(protected)/app/more/page.tsx` for More tab layout
- Read existing modal/sheet patterns in `components/ui/`
- Check for existing email sending patterns (Resend) in the codebase
- Sand section color for More tab pages
