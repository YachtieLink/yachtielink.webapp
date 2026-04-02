# Session 6 — Data Quality + Safety + Pro Consistency

**Rally:** 009 Pre-MVP Polish
**Status:** BLOCKED — needs /grill-me for cert registry + reporting decisions
**Estimated time:** ~8 hours across 3 workers
**Dependencies:** Sessions 1-2 merged (tech debt clean), Session 5 (LLM defense layer exists)

---

## Lane 1: CV Cert Matching Registry (Opus, high)

**Branch:** `feat/cert-registry`
**Objective:** Build canonical certification registry with ~60 seed entries. Fuzzy match parsed cert names during CV import. Auto-fill issuing body, smart expiry prompts, social proof.

**This lane has a migration.** Only one lane per session may have migrations.

### Task 1: Migration — Registry Table + Seed Data

**File:** `supabase/migrations/YYYYMMDDHHMMSS_certifications_registry.sql`

```sql
-- Enable trigram extension for fuzzy matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.certifications_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('safety', 'medical', 'navigation', 'engineering', 'hospitality', 'deck', 'professional', 'watersports', 'other')),
  default_issuing_body TEXT,
  issuing_bodies TEXT[] DEFAULT '{}',
  typical_validity_years INT,
  description TEXT,
  crew_count INT DEFAULT 0,
  source TEXT DEFAULT 'seed' CHECK (source IN ('seed', 'crowdsourced', 'admin')),
  review_status TEXT DEFAULT 'approved' CHECK (review_status IN ('approved', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cert_registry_name_trgm ON public.certifications_registry USING gin (name gin_trgm_ops);
CREATE INDEX idx_cert_registry_abbrev_trgm ON public.certifications_registry USING gin (abbreviation gin_trgm_ops);
CREATE INDEX idx_cert_registry_category ON public.certifications_registry(category);

-- RLS: public read, admin write
ALTER TABLE public.certifications_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_registry: public read"
  ON public.certifications_registry FOR SELECT USING (review_status = 'approved');

-- Search RPC
CREATE OR REPLACE FUNCTION search_certifications(query TEXT, lim INT DEFAULT 5)
RETURNS TABLE (
  id UUID, name TEXT, abbreviation TEXT, category TEXT,
  default_issuing_body TEXT, typical_validity_years INT,
  crew_count INT, similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id, cr.name, cr.abbreviation, cr.category,
    cr.default_issuing_body, cr.typical_validity_years,
    cr.crew_count,
    GREATEST(
      similarity(cr.name, query),
      similarity(COALESCE(cr.abbreviation, ''), query),
      (SELECT MAX(similarity(alias, query)) FROM unnest(cr.aliases) AS alias)
    ) AS similarity
  FROM public.certifications_registry cr
  WHERE cr.review_status = 'approved'
    AND (
      cr.name % query
      OR COALESCE(cr.abbreviation, '') % query
      OR EXISTS (SELECT 1 FROM unnest(cr.aliases) AS alias WHERE alias % query)
    )
  ORDER BY similarity DESC
  LIMIT lim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Task 2: Seed Data Insert

Same migration file, after table creation. ~60 entries covering the vast majority of maritime certifications.

**Categories to seed:**
- **Safety (STCW):** BST, PST, FPFF, PSSR, EFA, PSC, AFF, MFA, Medical Care, Security Awareness, Crowd Management, Proficiency in Survival Craft
- **Medical:** ENG1, ML5, Ship Captain's Medical Training
- **Navigation/Deck:** Yachtmaster Offshore/Ocean/Coastal, Day Skipper, Powerboat Level 2, HELM-O/M, Master 200gt/500gt/3000gt, Chief Mate, OOW
- **Engineering:** AEC (Approved Engine Course), Y4/Y3 Engineer, MEOL
- **Hospitality:** Food Safety Level 2/3, WSET 1/2/3, Ships Cook Certificate, Cert III Commercial Cookery
- **Professional:** PYA Interior/Deck/Introduction, ISM Familiarization, ISPS SSO
- **Watersports:** PADI OW/AOW/Rescue/DM/Instructor, RYA Jetski/Dinghy/Windsurf, Kitesurfing, Waterski Instructor

Each entry needs: name, abbreviation, aliases array, category, default_issuing_body, issuing_bodies array, typical_validity_years.

**Pattern:** Follow `yacht_builders` seed migration for format.

### Task 3: Matching Logic in CV Import

**File:** `lib/cv/cert-matching.ts` (new)

```typescript
interface CertMatchResult {
  registryId: string | null;
  matchTier: 'green' | 'amber' | 'blue';
  confidence: number;
  canonicalName?: string;
  defaultIssuingBody?: string;
  typicalValidityYears?: number;
  crewCount?: number;
  alternatives?: Array<{ id: string; name: string; confidence: number; crewCount: number }>;
}

export async function matchCertification(parsedName: string, supabase: SupabaseClient): Promise<CertMatchResult>
```

**Match tiers:**
- `similarity >= 0.6` → Green (auto-match) — canonical name, auto-fill issuing body
- `similarity 0.3–0.59` → Amber (ambiguous) — "Did you mean?" with top 3 matches
- `similarity < 0.3 or no results` → Blue (unmatched) — generic fields

### Task 4: Wizard Integration — StepQualifications Card States

**File:** `components/cv/steps/StepQualifications.tsx`

Three card states replacing the current uniform card:

**Green — Matched:**
```
✓ STCW Basic Safety Training          MCA
  Valid until 15 Mar 2028              412 crew
```

**Amber — Ambiguous:**
```
⟡ "ENG" — did you mean?
  → ENG1 Medical Certificate (MCA)     891 crew
  → ENG2 Medical Certificate (MCA)      43 crew
  → None of these — keep as is
```

**Blue — Unmatched:**
```
? Ships Galley Management Course
  Issuing Body: [          ]
  Expires:      [          ]
```

### Task 5: Alias Learning

When user confirms an amber match (e.g., "ENG" → "ENG1 Medical Certificate"):
- Add the parsed text to the registry entry's `aliases` array
- Next time "ENG" appears, it matches as green

**File:** `lib/cv/save-parsed-cv-data.ts` — after user confirms, update aliases

### Task 6: Smart Expiry Prompts

If `typical_validity_years` is set and no expiry date was parsed:
- "STCW BST typically renews every 5 years. When does yours expire?"

If expiry is parsed and is past:
- "This expired {date}. Have you renewed?"

### Task 7: Regenerate Types

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

**Allowed files:**
- `supabase/migrations/` — new migration (registry table + seed + RPC)
- `lib/cv/cert-matching.ts` — new
- `lib/cv/save-parsed-cv-data.ts` — alias learning
- `components/cv/steps/StepQualifications.tsx` — card states
- `lib/database.types.ts` — regenerate

**Forbidden files:**
- Endorsement components (Session 5)
- Profile/Network pages (Sessions 3-4)

---

## Lane 2: Reporting/Flagging + Bug Reporter (Sonnet, high)

**Branch:** `feat/reporting-bugs`
**Objective:** Ship both trust infrastructure (report button) and user feedback (bug report form). Same pattern: new table, API route, simple UI.

### Part A: Reporting & Flagging

#### Task 1: Migration

**File:** Add to Session 6's migration (Lane 1 owns the migration file — coordinate, or use a separate migration with higher timestamp):

```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'yacht', 'attachment', 'endorsement')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 2000),
  category TEXT NOT NULL CHECK (category IN ('fake_profile', 'false_attachment', 'inappropriate_content', 'harassment', 'spam', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports and read their own
CREATE POLICY "reports: user insert" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports: user read own" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status);
```

**IMPORTANT:** Since Lane 1 already has a migration, this lane must use a SEPARATE migration file with a later timestamp. Only one lane creates each migration file — no shared files.

#### Task 2: API Route

**File:** `app/api/report/route.ts`
- POST with auth
- Rate limit: 10 reports/hour/user
- Zod validation (target_type, target_id, reason, category)
- Insert into reports table
- Return 201

#### Task 3: Report Button Component

**File:** `components/ui/ReportButton.tsx`
- Small "Flag" or "Report" icon button (flag icon from lucide)
- Opens modal with: category selector + reason textarea
- Submit → API call → success toast "Report submitted"
- Reusable — takes `targetType` + `targetId` props

#### Task 4: Wire Report Button

Add `ReportButton` to:
- Public profile page (report fake profile)
- Yacht detail page (report wrong info)
- Endorsement cards (report inappropriate endorsement)
- Keep it subtle — small icon, doesn't dominate the UI

### Part B: Bug Reporter

#### Task 5: Migration

```sql
CREATE TABLE public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'ui_issue', 'performance', 'other')),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  page_url TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'fixed', 'wontfix')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bug_reports: user insert" ON public.bug_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bug_reports: user read own" ON public.bug_reports
  FOR SELECT USING (user_id = auth.uid());
```

#### Task 6: Bug Report Page

**File:** `app/(protected)/app/more/report-bug/page.tsx`
- Category selector (bug, UI issue, performance, other)
- Description textarea (10-2000 chars)
- Optional page URL input
- Submit → success confirmation (replaces form to prevent double-submit)
- Follow roadmap page layout pattern (PageHeader + card)

#### Task 7: API Route

**File:** `app/api/bug-reports/route.ts`
- POST with auth, rate limit 10/hr/user, Zod validation
- Capture `user_agent` from request headers server-side

#### Task 8: Settings Link

**File:** `app/(protected)/app/more/page.tsx`
- Add "Report a Bug" row in Help section

**Allowed files:**
- `supabase/migrations/` — new migration (reports + bug_reports tables)
- `app/api/report/route.ts` — new
- `app/api/bug-reports/route.ts` — new
- `components/ui/ReportButton.tsx` — new
- `app/(protected)/app/more/report-bug/page.tsx` — new
- `app/(protected)/app/more/page.tsx` — add link
- Public profile page, yacht detail page, endorsement card — add ReportButton

**Forbidden files:**
- CV wizard (Lane 1 territory)
- Endorsement write/request pages (Session 5)

---

## Lane 3: Pro Upsell Consistency (Sonnet, medium)

**Branch:** `chore/pro-upsell-consistency`
**Objective:** Create one standard upgrade CTA pattern and retrofit across the entire app.

### Task 1: Audit Current Upsells

Search codebase for all upgrade/upsell CTAs:
- Search for: "upgrade", "pro", "crew pro", "founding member", "upsell"
- Document each: location, copy, style, CTA action
- Note inconsistencies

### Task 2: Standard Upsell Component

**File:** `components/ui/ProUpsellCard.tsx`

Create a reusable upsell component with variants:

```typescript
interface ProUpsellCardProps {
  variant: 'inline' | 'banner' | 'card';
  feature: string; // "detailed analytics" | "15 gallery photos" | etc.
  context?: 'insights' | 'photos' | 'network' | 'profile';
}
```

**Inline:** Single line — "Upgrade to Crew Pro for {feature}" with arrow link
**Banner:** Full-width card — feature benefit + price + CTA button
**Card:** Compact card for grids — icon + benefit + CTA

All variants:
- Consistent copy pattern: lead with benefit, not product name
- Same CTA: "Upgrade to Crew Pro" (not "Go Pro", "Get Pro", "Upgrade now")
- Founding member pricing shown if applicable
- Links to `/app/more` billing section (or Stripe checkout)

### Task 3: Retrofit

Replace all existing upsell CTAs with `ProUpsellCard`:
- Insights tab (free tier teaser) — `variant="card"`
- Photo gallery (limit reached) — `variant="inline"`
- Profile (custom subdomain) — `variant="inline"`
- Network (if any Pro features gated) — `variant="banner"`
- CV generation (if Pro templates exist) — `variant="inline"`
- Any other locations found in audit

### Task 4: Design System Documentation

Add upsell pattern to `docs/design-system/patterns/` or note in existing `page-layout.md`:
- When to use each variant
- Copy formula: "{Benefit} with Crew Pro" not "Crew Pro gives you {feature}"
- Never use "Go Pro" (sounds like GoPro camera)

**Allowed files:**
- `components/ui/ProUpsellCard.tsx` — new
- Any page/component that currently has an upsell CTA
- `docs/design-system/` — pattern documentation

**Forbidden files:**
- `supabase/migrations/*`
- `app/api/*` (no new endpoints)

---

## Exit Criteria

- CV import fuzzy-matches certs against ~60 registry entries with green/amber/blue tiers
- Alias learning improves matching over time
- Smart expiry prompts guide users to fill missing dates
- Report button available on profiles, yachts, and endorsements
- Bug report form accessible from More tab
- All Pro upsells use consistent component, copy, and CTA pattern
- All new tables have proper RLS policies
