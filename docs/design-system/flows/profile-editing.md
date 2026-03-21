# Profile Editing Flow

## Journey

The profile page is the hub. Every edit page is a spoke — you go out, make a change, come back.

```
/app/profile (hub)
  ├─→ /app/profile/photos        → edit → save → back to profile
  ├─→ /app/profile/gallery       → edit → save → back to profile
  ├─→ /app/about/edit            → edit → save → back to profile
  ├─→ /app/hobbies/edit          → edit → save → back to profile
  ├─→ /app/skills/edit           → edit → save → back to profile
  ├─→ /app/social-links/edit     → edit → save → back to profile
  ├─→ /app/education/new         → fill → save → back to profile
  ├─→ /app/attachment/new        → fill → save → back to profile
  ├─→ /app/certification/new     → fill → save → back to profile
  ├─→ /app/endorsement/request   → fill → send → back to profile
  └─→ /app/more/account          → edit name/role/handle → save → back
```

## Profile Page Layout (top to bottom)

1. **Page header** — "My Profile" + "Preview →" link to public profile
2. **Photo strip** — horizontal scroll of photos, "Edit photos" link (or empty state CTA)
3. **Identity card** — name, role, departments, social links, "Edit" link
4. **Profile Strength** — donut meter with label and next-step prompt
5. **Section Manager** — visibility toggles for each section
6. **Accordion sections** — About, Experience, Certifications, Endorsements, Education, Hobbies, Skills, Gallery

Each accordion shows a smart summary line when collapsed (e.g. "3 yachts · 4 years at sea"). The "Edit" button on each accordion links to the relevant edit page.

## Edit Page Pattern

Every edit page follows the same structure:

1. `← Back` link (top left) → goes to `/app/profile`
2. Page title (h1)
3. Optional description (text-secondary)
4. Form content (varies by page)
5. Save button (full width, bottom) or two-button footer (Cancel + Save)

The user always knows where they are and how to get back. No nested edit pages.

## State During Editing

- No draft persistence — if you leave without saving, changes are lost
- Loading skeleton shown while fetching current data
- Save button shows "Saving…" state, disables during save
- Success → navigate back to profile
- Error → toast notification, stay on edit page
- Optimistic updates only for toggle-style interactions (save/unsave, visibility)
