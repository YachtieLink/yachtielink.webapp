import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { sendNotifyEmail } from '@/lib/email/notify'

const PROFILE_CATEGORIES = ['fake_profile', 'false_employment_claim', 'inappropriate_content', 'harassment', 'spam', 'other'] as const
const YACHT_CATEGORIES = ['duplicate_yacht', 'incorrect_details', 'other'] as const
const ENDORSEMENT_CATEGORIES = ['fake_endorsement', 'inappropriate_content', 'harassment', 'spam', 'other'] as const

const reportSchema = z.object({
  target_type: z.enum(['profile', 'yacht', 'endorsement']),
  target_id: z.string().uuid(),
  category: z.string().min(1),
  reason: z.string().min(10).max(2000),
  duplicate_of_yacht_id: z.string().uuid().optional(),
})

const FOUNDER_EMAIL = 'hello@yachtie.link'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { target_type, target_id, category, reason, duplicate_of_yacht_id } = parsed.data

    // Self-report guard
    if (target_type === 'profile' && target_id === user.id) {
      return NextResponse.json({ error: 'Cannot report your own profile' }, { status: 400 })
    }

    // Validate category matches target_type
    if (target_type === 'profile' && !(PROFILE_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Invalid category for profile report' }, { status: 400 })
    }
    if (target_type === 'yacht' && !(YACHT_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Invalid category for yacht report' }, { status: 400 })
    }
    if (target_type === 'endorsement' && !(ENDORSEMENT_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Invalid category for endorsement report' }, { status: 400 })
    }

    // duplicate_of_yacht_id required when category is duplicate_yacht
    if (category === 'duplicate_yacht' && !duplicate_of_yacht_id) {
      return NextResponse.json({ error: 'duplicate_of_yacht_id is required for duplicate_yacht reports' }, { status: 400 })
    }

    // Rate limit: 10 reports/hour/user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .gte('created_at', oneHourAgo)

    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    // Insert report
    const { error: insertError } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type,
      target_id,
      category,
      reason,
      duplicate_of_yacht_id: category === 'duplicate_yacht' ? duplicate_of_yacht_id : null,
    })

    if (insertError) throw insertError

    // Email founder (fire-and-forget — don't fail the request if email fails)
    const categoryLabel = category.replace(/_/g, ' ')
    const reporterDisplay = escapeHtml(user.email ?? user.id)
    void sendNotifyEmail({
      to: FOUNDER_EMAIL,
      subject: `[Report] New ${target_type} report — ${categoryLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
          <h2 style="margin-top:0">New ${target_type} report</h2>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:4px 0;color:#64748b;width:160px">Reporter</td><td>${reporterDisplay}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b">Target type</td><td>${target_type}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b">Target ID</td><td>${target_id}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b">Category</td><td>${categoryLabel}</td></tr>
            ${category === 'duplicate_yacht' && duplicate_of_yacht_id ? `<tr><td style="padding:4px 0;color:#64748b">Duplicate of</td><td>${duplicate_of_yacht_id}</td></tr>` : ''}
          </table>
          <h3 style="margin-top:20px">Reason</h3>
          <p style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:14px;white-space:pre-wrap">${escapeHtml(reason)}</p>
        </div>
      `,
      text: `New ${target_type} report\nReporter: ${user.email ?? user.id}\nCategory: ${categoryLabel}\nTarget ID: ${target_id}\n\nReason:\n${reason}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}
