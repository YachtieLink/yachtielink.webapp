# Yachtielink – Phase History

---

## Phase 0 – Problem Formation (Complete)

**Objective:** Define why trust fails in yachting, which models are invalid, and the non-negotiables that prevent incentive collapse.

**Completed:** 2025-11-15

**Artifacts produced:**
- Problem definition and root cause analysis
- Constitutional decisions (D-001 through D-003)
- Non-goals documentation
- Core principles

**Key insight:** The industry doesn't lack information—it lacks a neutral place for information to accumulate without being corrupted by money or power.

---

## Phase 1 – Identity Anchors + Revenue MVP (Current)

**Objective:** Ship free identity infrastructure and paid presentation upgrades that crew will pay for immediately.

**Started:** 2026-01-01  
**Target alpha:** ~3–4 months after build start  
**Target beta:** When graph density hits usefulness, not a calendar date

### What Phase 1 Ships

**Identity layer (free):**
- Profile, employment history, certifications
- Endorsements (gated by shared yacht attachment)
- Public profile page
- PDF snapshot

**Presentation layer (paid):**
- Premium templates
- Custom subdomains
- Watermark removal
- Endorsement pinning
- Basic analytics

**Infrastructure:**
- Yacht graph (entities, attachments, crew counts)
- Connections and messaging (minimal, private)
- Growth pause mechanism

### Completion Envelope (Stop Condition)

Phase 1 is complete once all three conditions are met:

1. **Cash-flow neutral:** Platform covers operating costs from Crew Pro subscriptions
2. **Organic sharing:** ≥10% of active users sharing their profile unprompted per month
3. **Endorsement density:** Endorsement-to-profile ratio ≥0.3 at 500+ active profiles

**Tripwires that would pause Phase 1 growth:**
- Endorsement-to-profile ratio below 0.3 at 500 profiles
- Organic share rate below 10%
- Repeat flag rate above 5% of endorsements
- Time-to-first-endorsement median exceeding 30 days

See `yl_phase1_actionables.json` for full metric definitions and response protocols.

Once the envelope is reached, Phase 1 polish stops and Phase 2 trust activation begins.

---

## Phase 2 – Trust Layer (Planned)

**Objective:** Introduce validated trust signals and protection mechanisms that make the graph meaningfully safer.

**Prerequisites:**
- Phase 1 completion envelope met
- Legal review complete (GDPR, defamation exposure, jurisdiction)
- Abuse escalation protocol battle-tested

**Planned features:**
- Structured negative flags (not free-text accusations)
- Consensus validation (multiple independent signals required)
- Signal weighting (recency, severity, consensus)
- Yacht dashboards (read-only, built on Phase 1 yacht graph)
- Role-relative context for endorsement density (without scoring)

**Key constraint:** No feature ships that allows payment to influence trust outcomes.

---

## Phase 3 – Industry Diagnostics (Intended)

**Objective:** Aggregate validated signals into higher-order insights that benefit the industry without exposing individuals to raw accusations.

**Prerequisites:**
- Phase 2 trust layer stable
- Sufficient graph density for statistical validity
- Clear data governance and privacy framework

**Intended features:**
- Pattern detection (turnover clusters, repeat issues)
- Turnover risk indicators for yachts
- Diagnostic dashboards for management companies
- Anonymised industry health metrics

**Key constraint:** Diagnostics never expose individual accusations. Patterns, not people.
