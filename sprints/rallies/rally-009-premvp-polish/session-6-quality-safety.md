# Session 6 — Data Quality + Safety + Pro Consistency

**Rally:** 009 Pre-MVP Polish
**Status:** Ready (all grill-me decisions resolved)
**Grill-me decisions applied:** §7 (Q7.1–Q7.3), §8 (Q8.1–Q8.2)
**Estimated time:** ~8 hours across 3 workers
**Dependencies:** Sessions 1-2 merged (tech debt clean), Session 5 (LLM defense layer exists)

---

## Lane 1: CV Cert Matching Registry (Opus, high)

**Branch:** `feat/cert-registry`
**Objective:** Build canonical certification registry with ~60 seed entries. Fuzzy match parsed cert names during CV import. Auto-fill issuing body, smart expiry prompts, social proof.

**This lane has a migration.** Only one lane per session may have migrations.

### Locked decisions from grill-me

| Decision | Detail |
|----------|--------|
| Q7.1 — Crowdsourced moderation | Auto-approve after 10+ appearances, flag for admin review. Trusted invited crew at launch. |
| Q7.2 — Existing cert migration | Add new column alongside existing. Don't break existing data. |
| Q7.3 — Regional cert variants | **Separate entries per issuing authority** (MCA, AMSA, etc.). No aliases across authorities, no assumed equivalencies. Can flag with "Commonly accepted as ENG1 equivalent" note — but whether a yacht accepts it is the captain's/flag state's call, not the registry's. |

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
  issuing_authority TEXT NOT NULL,
  equivalence_note TEXT,
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
CREATE INDEX idx_cert_registry_authority ON public.certifications_registry(issuing_authority);

-- RLS: public read, admin write
ALTER TABLE public.certifications_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_registry: public read"
  ON public.certifications_registry FOR SELECT USING (review_status = 'approved');

-- Search RPC
CREATE OR REPLACE FUNCTION search_certifications(query TEXT, lim INT DEFAULT 5)
RETURNS TABLE (
  id UUID, name TEXT, abbreviation TEXT, category TEXT,
  issuing_authority TEXT, equivalence_note TEXT,
  typical_validity_years INT,
  crew_count INT, similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.id, cr.name, cr.abbreviation, cr.category,
    cr.issuing_authority, cr.equivalence_note,
    cr.typical_validity_years,
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

**Schema changes from grill-me Q7.3:**
- Removed `default_issuing_body` and `issuing_bodies TEXT[]` — replaced with single `issuing_authority TEXT NOT NULL`. Each authority gets its own row.
- Added `equivalence_note TEXT` — e.g. "Commonly accepted as ENG1 equivalent" for cross-authority recognition hints.
- Added index on `issuing_authority` for filtering.

### Task 2: Seed Data Insert

Same migration file, after table creation. ~60 entries covering the vast majority of maritime certifications.

**Key change from Q7.3:** Each issuing authority gets a **separate row**, not aliases. For example:

```sql
-- ENG1 is MCA-specific
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years)
VALUES ('ENG1 Medical Certificate', 'ENG1', 'medical', 'MCA', 2);

-- Australian equivalent is a separate entry with equivalence note
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years, equivalence_note)
VALUES ('Maritime Medical Certificate', NULL, 'medical', 'AMSA', 2, 'Commonly accepted as ENG1 equivalent');

-- ML5 is separate (MCA, different purpose)
INSERT INTO certifications_registry (name, abbreviation, category, issuing_authority, typical_validity_years)
VALUES ('ML5 Medical Certificate', 'ML5', 'medical', 'MCA', 5);
```

**Categories to seed (with separate entries per authority where applicable):**
- **Safety (STCW):** BST, PST, FPFF, PSSR, EFA, PSC, AFF, MFA, Medical Care, Security Awareness, Crowd Management, Proficiency in Survival Craft — issued by MCA, AMSA, USCG, MNZ etc. as separate rows where relevant
- **Medical:** ENG1 (MCA), ML5 (MCA), Maritime Medical Certificate (AMSA), USCG Medical Certificate (USCG)
- **Navigation/Deck:** Yachtmaster Offshore/Ocean/Coastal (RYA), Day Skipper (RYA), Powerboat Level 2 (RYA), HELM-O/M (MCA), Master 200gt/500gt/3000gt (MCA/AMSA/MNZ), Chief Mate, OOW
- **Engineering:** AEC (Approved Engine Course), Y4/Y3 Engineer, MEOL
- **Hospitality:** Food Safety Level 2/3, WSET 1/2/3, Ships Cook Certificate, Cert III Commercial Cookery
- **Professional:** PYA Interior/Deck/Introduction, ISM Familiarization, ISPS SSO
- **Watersports:** PADI OW/AOW/Rescue/DM/Instructor, RYA Jetski/Dinghy/Windsurf, Kitesurfing, Waterski Instructor

Each entry needs: name, abbreviation, category, issuing_authority, typical_validity_years, equivalence_note (where applicable).

**Pattern:** Follow `yacht_builders` seed migration for format.

### Task 3: Matching Logic in CV Import

**File:** `lib/cv/cert-matching.ts` (new)

```typescript
interface CertMatchResult {
  registryId: string | null;
  matchTier: 'green' | 'amber' | 'blue';
  confidence: number;
  canonicalName?: string;
  issuingAuthority?: string;
  equivalenceNote?: string;
  typicalValidityYears?: number;
  crewCount?: number;
  alternatives?: Array<{ id: string; name: string; issuingAuthority: string; confidence: number; crewCount: number }>;
}

export async function matchCertification(parsedName: string, supabase: SupabaseClient): Promise<CertMatchResult>
```

**Match tiers:**
- `similarity >= 0.6` — Green (auto-match) — canonical name, auto-fill issuing authority
- `similarity 0.3–0.59` — Amber (ambiguous) — "Did you mean?" with top 3 matches (may include same cert from different authorities)
- `similarity < 0.3 or no results` — Blue (unmatched) — generic fields

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
  → ENG1 Medical Certificate (MCA)          891 crew
  → Maritime Medical Certificate (AMSA)      67 crew
    ↳ Commonly accepted as ENG1 equivalent
  → None of these — keep as is
```

**Blue — Unmatched:**
```
? Ships Galley Management Course
  Issuing Authority: [          ]
  Expires:           [          ]
```

### Task 5: Alias Learning

When user confirms an amber match (e.g., "ENG" -> "ENG1 Medical Certificate"):
- Add the parsed text to the registry entry's `aliases` array
- Next time "ENG" appears, it matches as green
- Q7.1: If a crowdsourced alias appears 10+ times, auto-approve; otherwise flag for admin review

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

## Lane 2: Reporting/Flagging + Bug Reporter + Transfer (Sonnet, high)

**Branch:** `feat/reporting-bugs`
**Objective:** Ship trust infrastructure (report button with yacht-specific duplicate flagging), user feedback (bug report form), founder email alerts, and yacht graph integrity tools (experience transfer, endorsement visibility).

### Locked decisions from grill-me

| Decision | Detail |
|----------|--------|
| Q8.1 — Report categories | **Profiles:** fake profile, false employment claim, inappropriate content, harassment, spam, other. **Yachts:** duplicate yacht (primary — with search to select the other entry), incorrect details, other. Yacht reporting is primarily a duplicate flagging tool. |
| Q8.2 — Admin workflow | **Email notification to founder on every report.** Not just Supabase dashboard. Could scale beyond 20-50 fast. |
| NEW — Transfer experience | User-initiated: move employment attachment from one yacht node to another. Dates, role, everything moves. |
| NEW — Endorsement visibility on transfer | Endorsement hidden (dormant, not deleted) until BOTH endorser and endorsee attached to same yacht node. Reappears automatically on merge/transfer. No user confirmation needed. |
| NEW — Colleague connections | Rebuild automatically based on new shared yacht after transfer. |

### Part A: Reporting & Flagging

#### Task 1: Migration

**File:** Separate migration with later timestamp than Lane 1.

```sql
-- Report categories are different for profiles vs yachts (Q8.1)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'yacht', 'attachment', 'endorsement')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 2000),
  category TEXT NOT NULL,
  -- Profile categories: fake_profile, false_employment_claim, inappropriate_content, harassment, spam, other
  -- Yacht categories: duplicate_yacht, incorrect_details, other
  duplicate_of_yacht_id UUID REFERENCES public.yachts(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Validate categories match target_type
  CONSTRAINT valid_profile_category CHECK (
    target_type != 'profile' OR category IN ('fake_profile', 'false_employment_claim', 'inappropriate_content', 'harassment', 'spam', 'other')
  ),
  CONSTRAINT valid_yacht_category CHECK (
    target_type != 'yacht' OR category IN ('duplicate_yacht', 'incorrect_details', 'other')
  ),
  -- duplicate_of_yacht_id required when category is duplicate_yacht
  CONSTRAINT duplicate_requires_target CHECK (
    category != 'duplicate_yacht' OR duplicate_of_yacht_id IS NOT NULL
  )
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert reports and read their own
CREATE POLICY "reports: user insert" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports: user read own" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_duplicate ON public.reports(duplicate_of_yacht_id) WHERE duplicate_of_yacht_id IS NOT NULL;
```

**IMPORTANT:** Since Lane 1 already has a migration, this lane must use a SEPARATE migration file with a later timestamp. Only one lane creates each migration file — no shared files.

#### Task 2: API Route

**File:** `app/api/report/route.ts`
- POST with auth
- Rate limit: 10 reports/hour/user
- Zod validation (target_type, target_id, reason, category)
- Validate category matches target_type (profile vs yacht categories)
- If `category === 'duplicate_yacht'`, require `duplicate_of_yacht_id`
- Insert into reports table
- **Q8.2: Send email notification to founder on every report** (use Resend or equivalent — same pattern as other transactional emails)
- Return 201

#### Task 3: Report Button Component

**File:** `components/ui/ReportButton.tsx`
- Small "Flag" or "Report" icon button (flag icon from lucide)
- Opens modal with: category selector (dynamically filtered by target_type) + reason textarea
- For yacht duplicate reports: includes yacht search to select the duplicate target
- Submit -> API call -> success toast "Report submitted"
- Reusable — takes `targetType` + `targetId` props

#### Task 4: Wire Report Button

Add `ReportButton` to:
- Public profile page (report fake profile) — shows profile categories
- Yacht detail page (report wrong info / duplicate) — shows yacht categories with duplicate search
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
- Submit -> success confirmation (replaces form to prevent double-submit)
- Follow roadmap page layout pattern (PageHeader + card)

#### Task 7: API Route

**File:** `app/api/bug-reports/route.ts`
- POST with auth, rate limit 10/hr/user, Zod validation
- Capture `user_agent` from request headers server-side

#### Task 8: Settings Link

**File:** `app/(protected)/app/more/page.tsx`
- Add "Report a Bug" row in Help section

### Part C: Experience Transfer + Endorsement Visibility

#### Task 9: Migration — Transfer Support

Same migration file as Part A (or separate if cleaner).

```sql
-- Track experience transfers for audit trail
CREATE TABLE public.experience_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employment_id UUID NOT NULL,
  from_yacht_id UUID NOT NULL REFERENCES public.yachts(id),
  to_yacht_id UUID NOT NULL REFERENCES public.yachts(id),
  transferred_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.experience_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experience_transfers: user read own" ON public.experience_transfers
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "experience_transfers: user insert own" ON public.experience_transfers
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add dormant flag to endorsements for yacht graph integrity
-- Endorsement is dormant when endorser and endorsee are NOT both attached to the same yacht
ALTER TABLE public.endorsements ADD COLUMN IF NOT EXISTS is_dormant BOOLEAN DEFAULT false;
```

#### Task 10: Transfer Experience API

**File:** `app/api/transfer-experience/route.ts`
- POST with auth
- Params: `employment_id`, `to_yacht_id`
- Validates user owns the employment record
- Moves the employment attachment from old yacht to new yacht (dates, role, everything)
- Logs the transfer in `experience_transfers` for audit
- Triggers endorsement visibility recalculation (Task 11)
- Triggers colleague connection rebuild (Task 12)
- Returns 200

#### Task 11: Endorsement Visibility Logic

**File:** `lib/endorsements/visibility.ts` (new)

After any experience transfer or yacht merge:
- For each endorsement involving the transferred user:
  - Check if BOTH endorser and endorsee are now attached to the same yacht node
  - If yes: set `is_dormant = false` (endorsement visible)
  - If no: set `is_dormant = true` (endorsement hidden but not deleted)
- No user confirmation needed — automatic based on graph state
- Foundational principle: an endorsement always means two people were on the same yacht at the same time. The shared yacht attachment IS the proof.

#### Task 12: Colleague Connection Rebuild

**File:** `lib/network/colleague-rebuild.ts` (new)

After experience transfer:
- Recalculate colleague connections for the transferred user based on new shared yacht
- New colleagues (people on the destination yacht with overlapping dates) appear automatically
- Old colleagues from the source yacht are removed if no other shared yacht exists

#### Task 13: Transfer UI

**File:** `components/experience/TransferExperienceButton.tsx` (new)
- Available on employment records in profile/career section
- Opens modal with yacht search to select destination yacht
- Confirmation step: "Move your [role] experience from [Yacht A] to [Yacht B]? Dates and details will transfer. Endorsements will update automatically."
- Submit -> API call -> success toast

**Allowed files:**
- `supabase/migrations/` — new migration (reports + bug_reports + experience_transfers tables, endorsement dormant column)
- `app/api/report/route.ts` — new
- `app/api/bug-reports/route.ts` — new
- `app/api/transfer-experience/route.ts` — new
- `components/ui/ReportButton.tsx` — new
- `components/experience/TransferExperienceButton.tsx` — new
- `lib/endorsements/visibility.ts` — new
- `lib/network/colleague-rebuild.ts` — new
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
- Registry uses separate entries per issuing authority (no cross-authority aliases)
- Alias learning improves matching over time (auto-approve at 10+ appearances)
- Smart expiry prompts guide users to fill missing dates
- Report button available on profiles, yachts, and endorsements with target-appropriate categories
- Yacht duplicate reporting includes search to select the other entry
- Founder receives email notification on every report
- Experience transfer moves employment between yacht nodes with full audit trail
- Endorsements go dormant when endorser/endorsee no longer share a yacht, reappear automatically on transfer/merge
- Colleague connections rebuild automatically after transfer
- Bug report form accessible from More tab
- All Pro upsells use consistent component, copy, and CTA pattern
- All new tables have proper RLS policies
