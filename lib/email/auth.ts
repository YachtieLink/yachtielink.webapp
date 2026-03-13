/**
 * Auth email pipeline — highest priority sender.
 *
 * Sender: login@mail.yachtie.link
 *
 * Use ONLY for:
 *   - Magic login links
 *   - Password reset
 *   - Email verification
 *   - Account invitations
 *
 * This identity is never mixed with product or marketing emails.
 * Keeping it low-volume protects deliverability for login flows.
 *
 * NOTE: Supabase Auth emails (magic link, password reset, email confirmation)
 * are routed through Resend SMTP — not this module.
 * This module is for any auth emails sent directly from application code.
 */
import { resend } from './client'

const FROM = 'YachtieLink <login@mail.yachtie.link>'

export type AuthEmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendAuthEmail(payload: AuthEmailPayload): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })

  if (error) {
    throw new Error(`Auth email failed: ${error.message}`)
  }
}
