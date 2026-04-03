import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotifyEmail } from '@/lib/email/notify'
import { sanitizeHtml } from '@/lib/validation/sanitize'
import { handleApiError } from '@/lib/api/errors'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'

/**
 * POST /api/endorsement-requests/[id]/remind
 * Send a single reminder for a pending endorsement request.
 * Rules: requester only, 1 reminder max, ≥7 days after creation.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Load request — must belong to current user as requester
    const { data: request, error: loadError } = await supabase
      .from('endorsement_requests')
      .select('id, token, requester_id, recipient_email, recipient_user_id, yacht_id, status, cancelled_at, created_at, reminded_at')
      .eq('id', id)
      .eq('requester_id', user.id)
      .single()

    if (loadError || !request) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Must be pending
    if (request.status !== 'pending' || request.cancelled_at) {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    // Already reminded
    if (request.reminded_at) {
      return NextResponse.json({ error: 'Reminder already sent' }, { status: 409 })
    }

    // Must be at least 7 days since creation
    const daysSinceCreation = (Date.now() - new Date(request.created_at).getTime()) / 86400000
    if (daysSinceCreation < 7) {
      const daysLeft = Math.ceil(7 - daysSinceCreation)
      return NextResponse.json({ error: `Too soon. Try again in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.` }, { status: 429 })
    }

    // Atomic CAS: only update if reminded_at is still null (prevents TOCTOU race)
    const { data: updated, error: updateError } = await supabase
      .from('endorsement_requests')
      .update({ reminded_at: new Date().toISOString() })
      .eq('id', id)
      .is('reminded_at', null)
      .select('id')

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update reminder status' }, { status: 500 })
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Reminder already sent' }, { status: 409 })
    }

    // Send reminder email
    try {
      const [requesterRes, yachtRes] = await Promise.all([
        supabase.from('users').select('display_name, full_name').eq('id', user.id).single(),
        supabase.from('yachts').select('name').eq('id', request.yacht_id).single(),
      ])

      const requesterName = requesterRes.data?.display_name ?? requesterRes.data?.full_name ?? 'A colleague'
      const yachtName = yachtRes.data?.name ?? ''
      const deepLink = `${APP_URL}/r/${request.token}`
      const safeRequesterName = sanitizeHtml(requesterName)
      const safeYachtName = sanitizeHtml(yachtName)

      if (request.recipient_email) {
        const subjectYacht = yachtName ? ` on ${yachtName}` : ''
        await sendNotifyEmail({
          to: request.recipient_email,
          subject: `Reminder: ${requesterName} is waiting for your endorsement${subjectYacht}`,
          html: buildReminderHtml(safeRequesterName, safeYachtName, deepLink),
          text: `${requesterName} sent you an endorsement request and is still waiting. Write one here: ${deepLink}`,
        })
      }
    } catch (e) {
      console.error('Reminder email failed:', e)
      // Don't fail the request — the reminded_at flag is already set
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}

function buildReminderHtml(requesterName: string, yachtName: string, deepLink: string) {
  const yachtLine = yachtName ? ` on <strong>${yachtName}</strong>` : ''
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">YachtieLink</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">Friendly reminder from ${requesterName}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">They asked for an endorsement${yachtLine} and are still hoping to hear from you. It only takes a couple of minutes.</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${deepLink}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Write an endorsement →</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
