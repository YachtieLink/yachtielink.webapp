---
date: 2026-03-26
agent: Codex
sprint: ad-hoc (test seed assets)
modules_touched: [profile, employment, infrastructure, onboarding]
---

## Summary
Generating a full offline test asset pack for seeded YachtieLink profiles: 25 headshots, shared gallery and yacht images, and 25 parser-ready CV PDFs under `scripts/seed/assets/`.

---

## Session Log

**10:13** — Read webapp startup docs and inspected `scripts/seed/`. Confirmed target asset folder exists but is empty. Confirmed current test seed script already contains the 25 users and 10 `TS` yachts.

**10:13** — Probed local tooling. No PDF/image helper binaries like ImageMagick or `pdftotext`, and no local AI image model. Decided to generate synthetic raster images offline and render PDFs locally from the same manifest.

**10:17** — Added `scripts/seed/README.md` and built `scripts/seed/generate-test-assets.mjs` as a single offline pipeline. Script owns the fake user dataset, yacht metadata, image generation, PDF rendering, and final `asset-manifest.json`.

**10:22** — Ran `node scripts/seed/generate-test-assets.mjs`. Generated 25 profile JPGs, 18 shared gallery JPGs, 10 yacht JPGs, 25 CV PDFs, and `scripts/seed/assets/asset-manifest.json`.

**10:23** — Spot-checked outputs: file counts correct, profile images are `400x400`, gallery/yacht images are `1600x900`, and clean/alternate/messy CV templates all render successfully. Important caveat: image assets are stylized offline placeholders rather than photoreal portraits because no local image model is available in this environment.

**10:25** — Corrected two visible fidelity details in the manifest (`Hugo Bergström`, `Lürssen`) and re-ran the generator so the rendered CV content matches the requested spec more closely while keeping stable ASCII-safe filenames.

**10:36** — Replaced the placeholder James portrait with two user-supplied mobile-style portraits, converted from PNG to JPEG and saved as `scripts/seed/assets/profiles/james.jpg` and `scripts/seed/assets/profiles/james-2.jpg`. Updated `asset-manifest.json` so James now declares a two-photo profile set.

**10:57** — Filed user-supplied Charlotte and Olivia portrait sets. Charlotte now has `charlotte.jpg` through `charlotte-3.jpg`; Olivia now has `olivia.jpg` through `olivia-4.jpg`. Updated `asset-manifest.json` so the current real multi-photo sets total 31 profile images across the seed pack.

**11:12** — Filed 7 user-supplied gallery shots into the shared gallery pool. Replaced placeholder JPGs for `tender-driving`, `engine-room-rounds`, `guest-table-setting`, `dockside-prep`, and `water-sports-launch`, and added two new scenes: `crew-life-collage` and `deck-rail-cleaning`. Removed the temporary UUID PNGs after conversion and updated the manifest gallery count to 20.
