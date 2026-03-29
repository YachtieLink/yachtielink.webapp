# Junior Sprints

Junior sprints are reactive, unplanned, or supplementary work that sits outside the main phase roadmap. They exist because bugs surface mid-sprint, quick features get needed fast, or the UI needs a polish pass that isn't worth blocking a major sprint for.

They are first-class work — they get their own folder, their own README, and they live here so they're discoverable.

---

## Active Junior Sprints

> Update this table whenever you start or close a junior sprint.

| Type | Slug | Status | Summary |
|------|------|--------|---------|
| debug | debug-cv-parse-extraction | 🐛 In Progress | CV upload text extraction fails on all file types |
| debug | debug-photo-upload-limit | 🐛 In Progress | Photo page uses Pro limit for free users — wrong add button + count |
| feature | feature-cv-sharing-rework | ⚡ Planned | Full CV & Sharing page rework — always-on QR, share modal, CV toggle |
| feature | feature-saved-profiles-rework | ⚡ Planned | Saved profiles — notes, availability watch, relationship context, folders |
| ui-ux | settings-information-architecture | 🎨 Built — awaiting commit | Settings page IA rewrite, contact_email, CV-only fields on CV tab |
| ui-ux | ui-public-profile-button-margin | 🎨 In Progress | Top bar buttons on public profile sit flush against screen edge |

---

## Types

### 🐛 Debug
Bug fixing, error investigation, stability work. Anything where something is broken and needs to not be broken.

→ [debug/README.md](./debug/README.md)

### ⚡ Feature
Quick feature additions or tweaks — underplanned things that need shipping now, outside the scope of the current major sprint. Keep these focused and time-boxed.

→ [feature/README.md](./feature/README.md)

### 🎨 UI/UX
Layout, styling, responsive fixes, animation, visual polish. Not new features — just making existing things look and feel better.

→ [ui-ux/README.md](./ui-ux/README.md)

---

## How to Start a Junior Sprint

1. Pick the right type folder (`debug/`, `feature/`, or `ui-ux/`)
2. Create a subfolder with a short descriptive slug — e.g. `debug-cert-badge-overflow/` or `feature-quick-connect-btn/`
3. Add a `README.md` inside using the template in that type's README
4. Add a row to the Active table above
5. When done, move the row to the Completed table and mark the subfolder README as complete

---

## Completed Junior Sprints

| Type | Slug | Completed | Summary |
|------|------|-----------|---------|
| feature | feature-pro-subdomain-link | 2026-03-27 | Pro custom subdomain (`{handle}.yachtie.link`) — middleware, reserved page, handle blocklist, DNS migration |
| ~~debug~~ | ~~debug-cv-regenerate-date~~ | ~~Obsolete (2026-03-28)~~ | ~~CV regeneration replaced by on-demand generation in Sprint 11a~~ |
| feature | feature-two-pass-cv-parse | 2026-03-23 | Split CV parse into fast personal + background full parse for better UX |
