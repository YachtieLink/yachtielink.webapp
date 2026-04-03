# Lane 1 — CV Cert Matching Registry

**Branch:** `feat/cert-registry`
**Worktree:** `yl-wt-1`
**Model:** Codex (GPT 5.4) | **Effort:** high
**Sprint ref:** Rally 009 Session 6, Lane 1

---

## Objective

Build the certification matching logic on top of the already-migrated `certifications_registry` table. The migration + seed data + search RPC are already on main. This lane builds the application-layer matching, wizard integration, alias learning, and expiry prompts.

## Migration Note

**DO NOT create or modify any migration files.** The migration (`20260403100001_certifications_registry.sql`) is already applied and committed on main. Types are regenerated. Use `Database["public"]["Tables"]["certifications_registry"]` from `lib/database.types.ts`.

## Tasks

### Task 1: Cert Matching Logic

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

Match tiers:
- `similarity >= 0.6` — Green (auto-match) — canonical name, auto-fill issuing authority
- `similarity 0.3–0.59` — Amber (ambiguous) — "Did you mean?" with top 3 matches
- `similarity < 0.3 or no results` — Blue (unmatched) — generic fields

Use the `search_certifications` RPC already in the database.

### Task 2: Wizard Integration — StepQualifications Card States

**File:** `components/cv/steps/StepQualifications.tsx` (modify)

Three card states:

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

### Task 3: Alias Learning

When user confirms an amber match (e.g., "ENG" → "ENG1 Medical Certificate"):
- Add the parsed text to the registry entry's `aliases` array
- Next time "ENG" appears, it matches as green
- If a crowdsourced alias appears 10+ times, auto-approve; otherwise flag for admin review (set `review_status = 'pending'` on the alias addition)

**File:** `lib/cv/save-parsed-cv-data.ts` — after user confirms, update aliases

### Task 4: Smart Expiry Prompts

If `typical_validity_years` is set and no expiry date was parsed:
- "STCW BST typically renews every 5 years. When does yours expire?"

If expiry is parsed and is past:
- "This expired {date}. Have you renewed?"

Integrate into the StepQualifications card UI.

### Task 5: Regenerate Types (SKIP)

Types are already regenerated on main. No action needed.

## Allowed Files

- `lib/cv/cert-matching.ts` — new
- `lib/cv/save-parsed-cv-data.ts` — alias learning (modify)
- `components/cv/steps/StepQualifications.tsx` — card states (modify)

## Forbidden Files

- `supabase/migrations/*` — DO NOT TOUCH
- `lib/database.types.ts` — already regenerated
- Endorsement components
- Profile/Network pages
- Any file outside the CV module

## Patterns to Follow

- Read existing `StepExperience.tsx` for wizard step patterns
- Read existing `save-parsed-cv-data.ts` for how cert data is saved
- Use Supabase client from `@/lib/supabase/client` or server equivalent
- Follow section color: CV = amber (`var(--color-amber-*)`)
