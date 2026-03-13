/**
 * Resend client — shared singleton.
 *
 * Imported only by the two pipeline modules (auth.ts, notify.ts).
 * Never imported directly by application code.
 */
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)
