/**
 * Email — two-pipeline architecture.
 *
 * Import from here. Do not import auth.ts or notify.ts directly.
 *
 * Pipelines:
 *   sendAuthEmail    → login@mail.yachtie.link     (magic links, password reset, verification)
 *   sendNotifyEmail  → notifications@mail.yachtie.link  (endorsements, profile views, alerts)
 *
 * Supabase Auth emails (magic link, password reset, email confirmation) are routed
 * through Resend SMTP — configured in Supabase dashboard, not here.
 * See: docs/yl_email_setup.md
 */
export { sendAuthEmail } from './auth'
export { sendNotifyEmail } from './notify'
export type { AuthEmailPayload } from './auth'
export type { NotifyEmailPayload } from './notify'
