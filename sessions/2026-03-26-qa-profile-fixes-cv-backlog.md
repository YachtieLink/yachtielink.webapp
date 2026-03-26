---
date: 2026-03-26
agent: Claude Code (Opus 4.6)
sprint: CV Parse Bugfix (QA session)
modules_touched: [public-profile, cv-import]
---

## Summary

Continued founder QA testing session. Fixed 3 bugs on public profile (photo framing, experience summary, name readability). Captured 10 backlog proposals from CV import walkthrough covering the founder's vision for CV review as a graph-building engine. Created gallery seed script for test data.

---

## Session Log

**Session start** — Resumed from compacted context. On branch `fix/phase1-wave3-wizard-onboarding` with unstaged changes from earlier session (CV save fix, backlog files, seed script).

**Early** — Founder reported "experience is not showing her yachts" on Charlotte's public profile. Investigated: data correct (2 attachments, `deleted_at: null`, RLS passes), section_visibility `experience: true`. Snapshot revealed Experience accordion present but summary said "No experience added yet". Root cause: `yacht_id` not in Supabase select statement — `computeSeaTime()` couldn't count yachts. Fix: added `yacht_id` to the attachments query.

**Early** — Founder reported "profile photo is cut off, needs to naturally start from the top". Photo using `object-cover` without `object-position` defaulted to `center`, cutting off heads. Fix: added `object-top` to `PhotoGallery.tsx`.

**Mid** — Founder asked "will that white show up on a white background?" referring to the name overlay. Checked: `drop-shadow-lg` is only 15% opacity black. Strengthened to explicit `textShadow` with 60%/40% opacity on name and role text in both mobile (HeroSection) and desktop (PublicProfileContent) heroes.

**Mid** — Founder asked about making photo positioning adjustable. Discussion: lightweight focal-point presets vs full drag-to-reposition. Founder preference: "default to this frame but let them crop or zoom or reposition a bit". Captured as backlog item `profile-photo-reposition.md`.

**Late** — Committed all work in 2 commits: (1) bug fixes for photo, experience, CV save, name shadow; (2) 10 backlog proposals + gallery seed script. Branch now 2 ahead of origin.

## Decisions

- **Photo default is `object-top`** — sensible for headshots. Full repositioning is a backlog item, not a quick fix.
- **Text shadow > gradient alone** for hero name readability — gradient provides the base, text-shadow ensures legibility on any photo.

## End of Session

- Branch `fix/phase1-wave3-wizard-onboarding` has 2 new commits, **not yet pushed**. Push and PR #91 update deferred — founder ended session for reno work.
- Wave 5 branch (`fix/phase1-wave5-network-endorsement`) has a stashed CTA fix from an earlier session — separate concern, not part of this session's commits.
- Shipslog completed. All logging files updated.
