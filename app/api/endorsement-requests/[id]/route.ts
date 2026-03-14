import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotifyEmail } from '@/lib/email/notify'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'

// ─── GET /api/endorsement-requests/:token ─────────────────────────────────────
// Public endpoint — no auth required. The token IS the credential.
// Used by the /r/:token deep link page to load request details.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: token } = await params
  const supabase = await createClient()

  const { data: request, error } = await supabase
    .from('endorsement_requests')
    .select(`
      id, token, requester_id, yacht_id, recipient_email,
      status, expires_at, created_at, accepted_at, cancelled_at,
      requester:users!requester_id(display_name, full_name, profile_photo_url),
      yacht:yachts!yacht_id(id, name, yacht_type, length_meters, flag_state, year_built)
    `)
    .eq('token', token)
    .single()

  if (error || !request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Cancelled
  if (request.cancelled_at || request.status === 'cancelled') {
    return NextResponse.json({ error: 'This request was cancelled' }, { status: 410 })
  }

  // Expired
  const isExpired = new Date(request.expires_at) < new Date()
  if (isExpired) {
    return NextResponse.json({ expired: true, request }, { status: 200 })
  }

  return NextResponse.json({ request })
}

// ─── PUT /api/endorsement-requests/:id ────────────────────────────────────────
// Auth required. Requester only. Actions: cancel | resend.

interface UpdateRequestBody {
  action: 'cancel' | 'resend'
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as UpdateRequestBody
  const { action } = body

  if (action !== 'cancel' && action !== 'resend') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Load request (must belong to current user)
  const { data: request, error: loadError } = await supabase
    .from('endorsement_requests')
    .select('id, token, requester_id, recipient_email, yacht_id, status, cancelled_at')
    .eq('id', id)
    .eq('requester_id', user.id)
    .single()

  if (loadError || !request) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'cancel') {
    const { data: updated, error } = await supabase
      .from('endorsement_requests')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
    return NextResponse.json({ request: updated })
  }

  // action === 'resend' — rate limit check then re-send email with existing token
  const { data: todayCount } = await supabase.rpc('endorsement_requests_today', { p_user_id: user.id })
  const { data: profile } = await supabase.from('users').select('subscription_status').eq('id', user.id).single()
  const limit = profile?.subscription_status === 'pro' ? 20 : 10
  if ((todayCount ?? 0) >= limit) {
    return NextResponse.json({ error: 'Rate limit exceeded', limit, used: todayCount }, { status: 429 })
  }

  try {
    const { data: requester } = await supabase.from('users').select('display_name, full_name').eq('id', user.id).single()
    const { data: yacht } = await supabase.from('yachts').select('name').eq('id', request.yacht_id).single()
    const requesterName = requester?.display_name ?? requester?.full_name ?? 'A colleague'
    const yachtName = yacht?.name ?? ''
    const deepLink = `${APP_URL}/r/${request.token}`
    const subjectYacht = yachtName ? ` on ${yachtName}` : ''
    if (request.recipient_email) {
      await sendNotifyEmail({
        to: request.recipient_email,
        subject: `${requesterName} asked you to endorse their work${subjectYacht}`,
        html: buildResendHtml(requesterName, yachtName, deepLink),
        text: `${requesterName} is asking for an endorsement. Write one here: ${deepLink}`,
      })
    }
  } catch (e) {
    console.error('Resend email failed:', e)
  }

  return NextResponse.json({ ok: true, token: request.token })
}

function buildResendHtml(requesterName: string, yachtName: string, deepLink: string) {
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
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;">${requesterName} is asking for an endorsement</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">They've worked${yachtLine} and would like you to write a short endorsement.</p>
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
