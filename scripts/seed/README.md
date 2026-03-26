# Test Seed Assets

Offline generator for YachtieLink's seeded media pack.

## What It Produces

- `scripts/seed/assets/profiles/` — 25 square JPG profile portraits
- `scripts/seed/assets/gallery/` — shared yacht-life gallery JPGs
- `scripts/seed/assets/yachts/` — 10 yacht cover JPGs
- `scripts/seed/assets/cvs/` — 25 PDF CVs

## Generation Flow

1. Load the canonical 25 fake crew profiles, 10 `TS` yachts, and their employment history.
2. Generate synthetic raster artwork for headshots, gallery scenes, and yacht covers.
3. Convert raster sources into JPG assets.
4. Build structured CV data for each user from the same manifest.
5. Render parser-ready PDF CVs with layout variety across clean, alternate, and messy tiers.
6. Write an `asset-manifest.json` summary for seed/database follow-up work.

## Run

```bash
node scripts/seed/generate-test-assets.mjs
```

## Notes

- The images are intentionally synthetic and offline-generated so the pack can be rebuilt without external services.
- User handles/emails and yacht names stay aligned with the existing `test-seed-*` / `TS *` conventions.
