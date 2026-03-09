# YachtieLink Canonical Planning

This folder holds the implementation-facing planning truth.

## Canonical naming convention
- Active canonical docs use stable filenames without `.vNext` suffix.
- Example: `yl_phase_scope.json` (canonical) was promoted from `yl_phase_scope.vNext.json` (intake).

## Source lineage
- Intake source batch: `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11`
- Legacy counterparts: `/Users/ari/yachtielink.webapp/docs/intake/2026-02-11/archive/legacy_counterparts/`
- Metadata registry: `/Users/ari/yachtielink.webapp/docs/canonical/METADATA.json`

## Current status
- Coherence audit completed: see `/Users/ari/yachtielink.webapp/docs/canonical/COHERENCE_AUDIT_2026-02-11.md`
- `vNext` set promoted into canonical filenames with lineage metadata.
- Next step: resolve open items in the audit and update canonical checksums in metadata when files change.
