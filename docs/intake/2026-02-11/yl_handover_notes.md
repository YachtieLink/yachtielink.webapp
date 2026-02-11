# Yachtielink – PM Handover Notes (v1.0)

Created: 2026-01-27  
Source: Outgoing PM handover conversation  
Status: Pre-Ari meeting

---

## Open Questions for Ari

These require founder judgment and cannot be answered from documentation alone.

### Pricing & Revenue

1. **Crew Pro subscription price**: Range discussed is €8–15/month. Where are you anchored emotionally?
2. **Acceptable burn rate / runway**: What's tolerable for Phase 1 before cash-flow neutrality?
3. **PDF export monetisation**: Currently in free identity layer. Is charging for this on the table, or does it stay free as core infrastructure?

### Launch Strategy

4. **Launch mode**: Soft launch with real crew, or closed invite-only alpha first?
5. **Geographic focus**: Med season? Caribbean? Refit yards? Is there a target cluster for early users?
6. **Management company relationships**: How aggressively do you want to pursue these early, if at all?

### Jurisdiction & Legal

7. **France vs Monaco**: If forced to choose now, which way do you lean? Any tax, legal, or personal factors I should understand?
8. **Legal review status**: Any informal conversations with lawyers about GDPR, data residency, or defamation exposure?

### Founder Dynamics

9. **Working rhythm**: Daily check-ins? Weekly syncs? Async-first? What's your preferred cadence?
10. **Delegation boundaries**: What decisions do you want to be consulted on vs what can I just make?
11. **Closed doors**: What have you explicitly said no to that might come up again? Any rejected features, partnerships, or directions?

### Risk & Philosophy

12. **Pace vs purity**: If growth pressure appears, where are your personal red lines?
13. **Subtle failure modes**: What's the thing that could rot this from the inside that isn't obvious from the documents?
14. **Unresolved items**: Anything in the documentation that felt right when written but you're uncertain will survive contact with reality?

---

## Context from Outgoing PM

### On Business Model

- **Crew pay first, yachts pay later.** This sequencing is load-bearing. Whoever pays first has implicit power.
- **Cash-flow neutrality not precisely modeled.** Intent is to run sub-scale until trust density is achieved, then turn on revenue. Early burn is acceptable.
- **Organic sharing confidence** is based on observed behavior: crew already share CV PDFs, Dropbox links, QR codes informally. Yachtielink consolidates existing behavior, doesn't invent new habits.

### On Yacht Graph

- **Duplication tolerated early.** Multiple "Lady M" entries are fine in Phase 1.
- **No hard verification of yacht attachments in Phase 1.** Mitigation is that false claims don't accumulate reinforcing signals.
- **No merging of renamed yachts in Phase 1.** Complexity and risk decision—premature merging creates irreversible trust errors.

### On Endorsements

- **Both structured and free-text.** One endorsement per engagement per yacht.
- **Editing allowed. Deletion allowed.** But system treats removal as signal (backend only).
- **Retracted endorsements reduce reputation over time** via backend weighting, never visible in UI.

### On Trust & Safety

- **Phase 1 deliberately limits attack surface.** No open public messaging, no group coordination tools.
- **Kill-switch exists** to freeze features jurisdiction-locally if abused.
- **Legal review is mandatory before Phase 2**, not earlier.

### On Technical State

- **No production code.** Conceptual architecture and data model defined. Tech stack intentionally deferred.
- **This is a clean-sheet build.**

### On Timeline

- **Phase 1 private alpha**: ~3–4 months after build start.
- **Public beta**: When graph density hits usefulness, not a date.
- **No hard launch date committed.**

---

## Calibration Notes from Outgoing PM

### On My Approach

> "You're reasoning correctly. Your next risk is not judgment—it's over-correctness. At some point you'll need to let the system be slightly wrong in order to learn where it bends without breaking."

This is noted. I'll flag when I'm uncertain whether to hold for purity or ship to learn.

### On Remaining Risks

Per outgoing PM assessment:

1. **Founder–PM cadence mismatch** — solvable through explicit agreement
2. **Over-delaying learning in pursuit of purity** — I'll watch for this
3. **External shocks** — industry politics, copycats, legal noise — outside our control but worth monitoring

---

## Operational Handover Checklist

| Item | Status | Notes |
|------|--------|-------|
| Asset inventory (domains, credentials, storage) | Pending | Awaiting from outgoing PM |
| Contact list with context | Pending | Awaiting from outgoing PM |
| Prior art file (competitors, failure modes) | Pending | Awaiting from outgoing PM |
| Ari introduction | Scheduled | Tomorrow |
| Working rhythm agreement | Not started | First agenda item with Ari |
| Delegation boundaries | Not started | Second agenda item with Ari |

---

## First Meeting Agenda (Proposed)

1. Open questions above (prioritize pricing, launch mode, working rhythm)
2. Confirm delegation boundaries
3. Review `yl_phase1_actionables.json` — any disagreements or additions?
4. Establish communication cadence
5. Identify first concrete build milestone

---

Ready to proceed.
