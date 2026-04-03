import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotifyEmail } from '@/lib/email/notify'
import { validateBody } from '@/lib/validation/validate'
import { createEndorsementSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { moderateText } from '@/lib/ai/moderation'
import { trackServerEvent } from '@/lib/analytics/server'
import { sanitizeHtml } from '@/lib/validation/sanitize'
import { handleApiError } from '@/lib/api/errors'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yachtie.link'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'endorsementCreate', user.id)
    if (limited) return limited

    const result = await validateBody(req, createEndorsementSchema)
    if ('error' in result) return result.error
    const { recipient_id, yacht_id, content, endorser_role_label, recipient_role_label, worked_together_start, worked_together_end, request_token } = result.data

    if (user.id === recipient_id) {
      return NextResponse.json({ error: "You can't endorse yourself." }, { status: 400 })
    }

    // Coworker check
    const { data: coworkers } = await supabase.rpc('are_coworkers_on_yacht', {
      user_a: user.id,
      user_b: recipient_id,
      yacht: yacht_id,
    })
    if (!coworkers) {
      return NextResponse.json({ error: 'You can only endorse people you have worked with on this yacht.' }, { status: 403 })
    }

    // AI-01: Content moderation
    const moderation = await moderateText(content)
    if (moderation.flagged) {
      trackServerEvent(user.id, 'moderation.flagged', { context: 'endorsement.create', categories: moderation.categories })
      return NextResponse.json({ error: 'Your endorsement was flagged as potentially inappropriate. Please revise it.' }, { status: 422 })
    }

    const { data: endorsement, error: insertError } = await supabase
      .from('endorsements')
      .insert({
        endorser_id: user.id,
        recipient_id,
        yacht_id,
        content,
        endorser_role_label: endorser_role_label ?? null,
        recipient_role_label: recipient_role_label ?? null,
        worked_together_start: worked_together_start ?? null,
        worked_together_end: worked_together_end ?? null,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: "You've already endorsed this person for this yacht." }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create endorsement' }, { status: 500 })
    }

    trackServerEvent(user.id, 'endorsement.created', { recipient_id, yacht_id })

    // If responding to a request, update its status
    if (request_token) {
      await supabase
        .from('endorsement_requests')
        .update({ status: 'accepted', accepted_at: new Date().toISOString(), recipient_user_id: user.id })
        .eq('token', request_token)
    }

    // Send notification email to recipient (non-fatal)
    try {
      const { data: recipient } = await supabase
        .from('users')
        .select('email, display_name, full_name')
        .eq('id', recipient_id)
        .single()
      const { data: endorser } = await supabase
        .from('users')
        .select('display_name, full_name')
        .eq('id', user.id)
        .single()
      const { data: yacht } = await supabase
        .from('yachts')
        .select('name')
        .eq('id', yacht_id)
        .single()

      if (recipient?.email) {
        const endorserName = endorser?.display_name ?? endorser?.full_name ?? 'A colleague'
        const yachtName = yacht?.name ?? 'your yacht'
        const excerpt = content.length > 100 ? content.slice(0, 97) + '…' : content
        const safeEndorserName = sanitizeHtml(endorserName)
        const safeYachtName = sanitizeHtml(yachtName)
        const safeExcerpt = sanitizeHtml(excerpt)
        await sendNotifyEmail({
          to: recipient.email,
          subject: `${endorserName} endorsed you on YachtieLink`,
          html: buildEndorsementReceivedHtml(safeEndorserName, safeYachtName, safeExcerpt),
          text: `${endorserName} wrote an endorsement for your time on ${yachtName}:\n\n"${excerpt}"\n\nView it at: ${APP_URL}/app/network`,
        })
      }
    } catch (e) {
      console.error('Endorsement notification email failed:', e)
    }

    return NextResponse.json({ endorsement }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

  const { data: endorsements, error } = await supabase
    .from('endorsements')
    .select(`
      id, content, endorser_role_label, recipient_role_label,
      worked_together_start, worked_together_end, created_at, updated_at,
      endorser:users!endorser_id(id, display_name, full_name, profile_photo_url),
      yacht:yachts!yacht_id(id, name)
    `)
    .eq('recipient_id', userId)
    .is('deleted_at', null)
    .or('is_dormant.is.null,is_dormant.eq.false')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch endorsements' }, { status: 500 })

  return NextResponse.json({ endorsements })
}

function buildEndorsementReceivedHtml(endorserName: string, yachtName: string, excerpt: string) {
  const profileUrl = `${APP_URL}/app/network`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a1628;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">YachtieLink</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;font-weight:600;line-height:1.4;">
            ${endorserName} endorsed you on YachtieLink
          </p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            They wrote an endorsement for your time on <strong>${yachtName}</strong>:
          </p>
          <blockquote style="margin:0 0 24px;padding:16px;background:#f9fafb;border-left:3px solid #0a1628;border-radius:4px;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">
            "${excerpt}"
          </blockquote>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#0a1628;border-radius:8px;">
              <a href="${profileUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                View endorsement →
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            You received this because someone endorsed you on YachtieLink.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
