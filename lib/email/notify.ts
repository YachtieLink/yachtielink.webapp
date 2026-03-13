/**
 * Notification email pipeline — product events.
 *
 * Sender: notifications@mail.yachtie.link
 *
 * Use for:
 *   - "You received an endorsement"
 *   - "A recruiter viewed your profile"
 *   - "New job posted"
 *   - System alerts
 *
 * Never use this sender for auth emails or marketing.
 */
import { resend } from './client'

const FROM = 'YachtieLink <notifications@mail.yachtie.link>'

export type NotifyEmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendNotifyEmail(payload: NotifyEmailPayload): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo,
  })

  if (error) {
    throw new Error(`Notification email failed: ${error.message}`)
  }
}
