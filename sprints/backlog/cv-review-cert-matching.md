# CV Review — Certification Registry & Smart Matching

**Status:** fleshed-out
**Priority guess:** P2 (important)
**Date captured:** 2026-03-26
**Updated:** 2026-03-31 — founder added seeded registry concept + progressive enrichment loop

## Summary
Build a canonical `certifications_registry` table (like `yacht_builders`) seeded with the most common maritime certifications and their metadata. During CV import, fuzzy-match parsed cert names against this registry. Matched certs get auto-filled issuing body, smart expiry prompts ("This cert typically renews every 5 years — when does yours expire?"), and social proof. Unmatched certs go through generic fields but get counted — when the same unmatched cert appears across enough imports, it becomes a candidate for the registry.

The database gets smarter with every import without any extra effort from the user.

## Why This Matters
- **User effort drops to near-zero** — parser extracts "STCW10", registry fills in "Maritime & Coastguard Agency", knows it's a 5-year renewal, shows "412 crew hold this"
- **Data quality compounds** — every import either confirms an existing cert or teaches the system a new one
- **Expiry reminders become trivial** — if you know `typical_validity_years`, you can prompt renewals
- **Crew agents can filter by specific certs** — structured data, not free text
- **Same proven pattern as `yacht_builders`** — fuzzy match → auto-fill → crowdsource gaps

## The Registry Table

### Schema: `certifications_registry`
```sql
create table certifications_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,                          -- "STCW Basic Safety Training"
  abbreviation text,                           -- "STCW BST", "STCW BCT"
  aliases text[] default '{}',                 -- ["STCW10", "Basic Safety", "BST"]
  category text not null,                      -- safety | medical | navigation | engineering | hospitality | deck | other
  default_issuing_body text,                   -- "MCA" (most common issuer)
  issuing_bodies text[] default '{}',          -- ["MCA", "AMSA", "Transport Malta", "RYA"]
  typical_validity_years int,                  -- 5 (null = no expiry / lifetime)
  description text,                            -- short description for disambiguation
  crew_count int default 0,                    -- denormalized count of users holding this cert
  source text default 'seed',                  -- 'seed' | 'crowdsourced' | 'admin'
  review_status text default 'approved',       -- 'approved' | 'pending' (for crowdsourced)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Seed Data (Priority 1 — the ones every yachtie knows)

**Safety (STCW)**
| Name | Abbreviation | Aliases | Default Issuer | Validity |
|------|-------------|---------|---------------|----------|
| STCW Basic Safety Training | STCW BST | STCW10, STCW BCT, Basic Safety | MCA | 5 years |
| STCW Personal Survival Techniques | PST | Personal Survival | MCA | 5 years |
| STCW Fire Prevention & Fire Fighting | FPFF | Fire Fighting, Fire Prevention | MCA | 5 years |
| STCW Personal Safety & Social Responsibility | PSSR | Social Responsibility | MCA | No expiry |
| STCW Elementary First Aid | EFA | Elementary First Aid | MCA | 5 years |
| STCW Proficiency in Survival Craft | PSC | Survival Craft, PSCRB | MCA | 5 years |
| STCW Advanced Fire Fighting | AFF | Advanced Fire | MCA | 5 years |
| STCW Medical First Aid | MFA | Medical First Aid | MCA | 5 years |
| STCW Medical Care | Medical Care | Ship's Medical | MCA | 5 years |
| STCW Security Awareness | Security Awareness | Ship Security | MCA | No expiry |
| STCW Crowd Management | Crowd Management | Crowd & Crisis | MCA | 5 years |

**Medical**
| Name | Abbreviation | Aliases | Default Issuer | Validity |
|------|-------------|---------|---------------|----------|
| ENG1 Medical Certificate | ENG1 | ENG1 Medical, Seafarer Medical | MCA | 2 years |
| ENG1 ML5 Medical | ML5 | ML5 Medical | MCA | 2 years |
| Ship Captain's Medical Training | SCMT | Ship's Doctor | — | No expiry |

**Navigation / Deck**
| Name | Abbreviation | Aliases | Default Issuer | Validity |
|------|-------------|---------|---------------|----------|
| Yachtmaster Offshore | YM Offshore | Yachtmaster | RYA | No expiry |
| Yachtmaster Ocean | YM Ocean | — | RYA | No expiry |
| Yachtmaster Coastal | YM Coastal | Coastal Skipper | RYA | No expiry |
| Day Skipper | Day Skipper | — | RYA | No expiry |
| Powerboat Level 2 | PB2 | Powerboat, Powerboat II | RYA | No expiry |
| HELM Operational | HELM-O | HELM Op | MCA | 5 years |
| HELM Management | HELM-M | HELM Mgmt | MCA | 5 years |
| Master 200gt | Master 200 | OOW 200gt, Y2 | MCA | 5 years (revalidation) |
| Master 3000gt | Master 3000 | Y1, Master Unlimited | MCA | 5 years (revalidation) |
| Chief Mate 3000gt | Chief Mate | Mate 3000, C/M 3000 | MCA | 5 years (revalidation) |
| AEC (Approved Engine Course) | AEC | Engineering Course | MCA | No expiry |
| Y4 Engineer | Y4 | Engineer Officer | MCA | 5 years (revalidation) |
| Y3 Engineer | Y3 | — | MCA | 5 years (revalidation) |

**Hospitality / Interior**
| Name | Abbreviation | Aliases | Default Issuer | Validity |
|------|-------------|---------|---------------|----------|
| Food Safety Level 2 | Food Safety L2 | Food Hygiene L2, Food Safety Lvl 2 | Various | 3 years |
| Food Safety Level 3 | Food Safety L3 | Food Hygiene L3, Food Safety Lvl 3 | Various | 3 years |
| WSET Level 1 | WSET 1 | Wine Level 1 | WSET | No expiry |
| WSET Level 2 | WSET 2 | Wine Level 2 | WSET | No expiry |
| WSET Level 3 | WSET 3 | Wine Level 3 | WSET | No expiry |
| Ships Cook Certificate | Ships Cook | Ship's Cook, Cook Cert | MCA | No expiry |
| Certificate III in Commercial Cookery | Cert III Cookery | Cert 3 Commercial Cookery | Various (AU) | No expiry |

**PYA / Professional**
| Name | Abbreviation | Aliases | Default Issuer | Validity |
|------|-------------|---------|---------------|----------|
| PYA Interior Course | PYA Interior | — | PYA | No expiry |
| PYA Deckhand Course | PYA Deck | — | PYA | No expiry |
| Guest PYA Introduction | PYA Intro | PYA Guest, GUEST | PYA | No expiry |
| ISM Familiarisation | ISM | ISM Awareness | Various | No expiry |
| ISPS Security Officer | ISPS SSO | Ship Security Officer, SSO | MCA | 5 years |

**Watersports / Diving**
| Name | Abbreviation | Aliases | Default Issuer | Validity |
|------|-------------|---------|---------------|----------|
| PADI Open Water | OW | Open Water Diver | PADI | No expiry |
| PADI Advanced Open Water | AOW | Advanced Diver | PADI | No expiry |
| PADI Rescue Diver | Rescue Diver | — | PADI | No expiry |
| PADI Divemaster | DM | Divemaster | PADI | Annual renewal |
| RYA Jetski Instructor | Jetski | PWC, Personal Watercraft | RYA | No expiry |
| RYA Dinghy Instructor | Dinghy Instructor | — | RYA | No expiry |
| Kitesurfing Instructor | Kite Instructor | IKO Instructor | IKO | Annual renewal |
| Wakeboard / Waterski Instructor | Waterski | — | BWSW / Various | No expiry |

This is ~60 seed entries covering the vast majority of what CV imports will see. Can be expanded over time.

## Matching Logic

### Fuzzy Match Pipeline
Same approach as `yacht_builders` using `pg_trgm`:

```sql
create or replace function search_certifications(query text, lim int default 5)
returns table(id uuid, name text, abbreviation text, category text,
              default_issuing_body text, typical_validity_years int,
              crew_count int, sim float4)
language sql stable as $$
  select cr.id, cr.name, cr.abbreviation, cr.category,
         cr.default_issuing_body, cr.typical_validity_years,
         cr.crew_count,
         greatest(
           similarity(lower(cr.name), lower(query)),
           similarity(lower(coalesce(cr.abbreviation, '')), lower(query)),
           -- Check aliases array
           (select max(similarity(lower(a), lower(query))) from unnest(cr.aliases) a)
         ) as sim
  from certifications_registry cr
  where cr.review_status = 'approved'
    and (
      lower(cr.name) % lower(query)
      or lower(coalesce(cr.abbreviation, '')) % lower(query)
      or exists (select 1 from unnest(cr.aliases) a where lower(a) % lower(query))
      -- Also prefix match for short queries like "ENG" or "PST"
      or lower(cr.name) like lower(query) || '%'
      or lower(coalesce(cr.abbreviation, '')) like lower(query) || '%'
    )
  order by sim desc
  limit lim;
$$;
```

### Match Confidence Tiers
- **sim >= 0.6** → Green (auto-match) — show canonical name, auto-fill issuing body
- **sim 0.3–0.59** → Amber (ambiguous) — "Did you mean one of these?" with top matches
- **sim < 0.3 or no results** → Blue (unmatched) — generic fields, contribute to learning

### Alias Learning
When a user confirms an amber match (e.g. "STCW10" → "STCW Basic Safety Training"), the parsed text gets added to the `aliases` array automatically. Next time "STCW10" appears, it's a green match.

## Import Flow UX

### Card States in StepQualifications

**Green — Matched**
```
✓ STCW Basic Safety Training          MCA
  Valid until 15 Mar 2028              412 crew
```
- Canonical name replaces parsed text
- Issuing body auto-filled from registry
- Social proof: crew count
- Tap to expand → edit expiry, override issuing body

**Amber — Ambiguous**
```
⟡ "ENG" — did you mean?
  → ENG1 Medical Certificate (MCA)     891 crew
  → ENG2 Medical Certificate (MCA)      43 crew
  → None of these — keep as is
```
- User taps the right one → becomes green
- "None of these" → becomes blue

**Blue — Unmatched**
```
? Ships Galley Management Course
  Issuing Body: [          ]
  Expires:      [          ]
  + Add to our database
```
- Generic fields like today
- "Add to our database" creates a pending registry entry
- Gets reviewed/merged by admin later

### Smart Expiry Prompts
When a cert has `typical_validity_years`:
- If no expiry date parsed: "STCW BST typically renews every 5 years. When does yours expire?"
- If expiry date parsed and it's past: "This expired {date} — STCW BST renews every 5 years. Have you renewed?"

## Progressive Enrichment Loop

```
Seed (~60 certs)
  → User imports CV
    → Fuzzy match against registry
      → Matched: auto-fill, increment crew_count
      → Unmatched: save as custom, tally appearances
        → Same unmatched cert appears 10+ times across users
          → Admin review → promote to registry with most common issuing body
            → Future imports auto-match
```

Over time:
- The 60 seed entries cover ~90% of imports
- User corrections teach the alias table
- Crowdsourced entries fill the long tail
- The system converges toward a near-complete maritime certification database

## Relationship to Other Proposals
- **Same pattern as `yacht_builders`** — canonical table, fuzzy match, auto-fill, crowdsource. Proven.
- **Same pattern as `cv-review-existing-yacht-badge.md`** — match against DB, show confidence, let user override
- **Enables future features**: cert expiry reminders, crew filtering by qualification, "certs you're missing for [role]" recommendations, compliance tracking for yacht managers

## Files Likely Affected
- New: Supabase migration — `certifications_registry` table, seed data, `search_certifications` RPC
- `components/cv/steps/StepQualifications.tsx` — green/amber/blue card states, smart expiry prompts
- `components/cv/CvImportWizard.tsx` — thread match results from API
- `lib/cv/save-parsed-cv-data.ts` — save with `certification_registry_id` link, alias learning
- New: API route for batch cert matching (or server action)
- Possibly: admin view to review crowdsourced cert entries

## Open Questions
- Do we need admin moderation for crowdsourced entries, or auto-approve after N confirmations?
- Should `user_certifications.certification_type_id` be migrated to point at the new registry, or keep the existing `certification_types` table and merge?
- AMSA (Australian) certs have different naming conventions than MCA (UK) — do we handle regional variants as aliases or separate entries?

## Notes
- Founder (2026-03-31): "Run these like a database... if it's something we don't know they get the generic fields, but if it's matched against a cert in our database it gets prefilled. Eventually we would have all the certs and the issuing bodies. We could also do the legwork and prepopulate for the most well known."
- The `certification_types` table already exists in the DB — may be able to extend it rather than creating a new table. Needs schema review.
