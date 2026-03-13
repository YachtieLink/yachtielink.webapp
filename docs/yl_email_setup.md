# YachtieLink — Email Setup (Resend)

Two-pipeline architecture. Each pipeline has a separate sending identity so reputation is isolated.

| Pipeline | From address | Used for |
|----------|-------------|----------|
| Auth | `login@mail.yachtie.link` | Magic links, password reset, email verification |
| Notify | `notifications@mail.yachtie.link` | Endorsements, profile views, job alerts |
| Marketing (future) | `hello@yachtie.link` | Newsletters, feature announcements |

---

## Step 1 — Resend account

1. Sign up at https://resend.com
2. Create an API key with **Full access** (or Send access for production)
3. Copy the key → paste into `.env.local` as `RESEND_API_KEY`

---

## Step 2 — Add sending domain in Resend

1. Resend dashboard → **Domains** → **Add domain**
2. Add `mail.yachtie.link`
3. Resend will show you DNS records to add

---

## Step 3 — DNS records

Add these to your DNS provider (wherever `yachtie.link` is managed):

### SPF
```
Type: TXT
Name: mail.yachtie.link
Value: v=spf1 include:amazonses.com ~all
```
*(Resend will give you the exact value — use theirs)*

### DKIM
Resend provides two DKIM CNAME records. Add both:
```
Type: CNAME
Name: resend._domainkey.mail.yachtie.link
Value: (from Resend dashboard)
```

### DMARC (recommended)
```
Type: TXT
Name: _dmarc.mail.yachtie.link
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yachtie.link
```

Start with `p=none` while verifying, move to `p=quarantine` once confirmed working.

---

## Step 4 — Supabase SMTP (auth emails)

This routes Supabase's built-in auth emails (magic link, password reset, email confirmation) through Resend.

### Production (Supabase dashboard)
1. Supabase dashboard → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Fill in:

```
Host:       smtp.resend.com
Port:       465
Username:   resend
Password:   (your RESEND_API_KEY)
Sender name: YachtieLink
From email: login@mail.yachtie.link
```

### Local dev (supabase/config.toml)
Uncomment and fill the `[auth.email.smtp]` block:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 465
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "login@mail.yachtie.link"
sender_name = "YachtieLink"
```

Then `supabase stop && supabase start` to pick up the config.

---

## Step 5 — Vercel environment variables

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```
RESEND_API_KEY = re_...
```

Add to: **Production**, **Preview**, and **Development** environments.

If you use separate API keys per environment (recommended for production isolation):
- Production key → Production only
- Test key (free tier ok) → Preview + Development

**Note (2026-03-13):** Vercel's "Sensitive" toggle was not used — sensitive env vars can't be added to the Development environment. Before go-live, create a separate production-only API key in Resend, add it as a new env var scoped to Production only with Sensitive toggled on, and delete the current shared key.

---

## Step 6 — Verify domain in Resend

After DNS propagation (up to 48h, usually <1h):
- Resend dashboard → Domains → your domain → **Verify**
- Green = ready to send

---

## Code usage

```typescript
// Notification email
import { sendNotifyEmail } from '@/lib/email'

await sendNotifyEmail({
  to: user.email,
  subject: 'You received an endorsement',
  html: '<p>...</p>',
  replyTo: 'support@yachtie.link',
})

// Auth email (for any auth emails sent directly from app code)
import { sendAuthEmail } from '@/lib/email'

await sendAuthEmail({
  to: user.email,
  subject: 'Your login link',
  html: '<p>...</p>',
})
```

Supabase auth emails don't need code — they go through SMTP automatically.

---

## Postmark migration path

When moving to Postmark:
1. Get Postmark API key
2. Add a `POSTMARK_API_KEY` env var
3. Update `lib/email/client.ts` to use `postmark` instead of `resend`
4. The pipeline structure (auth.ts, notify.ts) stays identical — only the client changes

---

## Checklist

- [x] Resend account created, API key obtained
- [x] `RESEND_API_KEY` in `.env.local`
- [x] `mail.yachtie.link` domain added in Resend
- [x] DNS records added (SPF, DKIM) on Cloudflare
- [x] Domain verified green in Resend
- [x] Supabase SMTP configured (dashboard)
- [x] `RESEND_API_KEY` added in Vercel (non-sensitive, all environments)
- [ ] Vercel: create separate production-only sensitive key before go-live
- [ ] `supabase/config.toml` SMTP block uncommented for local dev
- [x] Test email sent — auth pipeline confirmed working (2026-03-13)
- [ ] **Before go-live: re-enable email confirmation in Supabase** — Auth → Settings → "Enable email confirmations" was turned OFF during development. Must be turned ON before launch so users are required to verify their email on signup. (Supabase dashboard → Authentication → Providers → Email → "Confirm email")
