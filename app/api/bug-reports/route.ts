import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/api/errors'
import { sendNotifyEmail } from '@/lib/email/notify'

const bugReportSchema = z.object({
  category: z.enum(['bug', 'ui_issue', 'performance', 'other']),
  description: z.string().min(10).max(2000),
  page_url: z.string().max(500).optional(),
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
    const parsed = bugReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    // Rate limit: 10/hr/user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('bug_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)

    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const userAgent = req.headers.get('user-agent') ?? null

    const { error } = await supabase.from('bug_reports').insert({
      user_id: user.id,
      category: parsed.data.category,
      description: parsed.data.description,
      page_url: parsed.data.page_url ?? null,
      user_agent: userAgent,
    })

    if (error) throw error

    // Email founder (fire-and-forget)
    const categoryLabel = parsed.data.category.replace(/_/g, ' ')
    void sendNotifyEmail({
      to: FOUNDER_EMAIL,
      subject: `[Bug Report] ${categoryLabel} — ${escapeHtml(parsed.data.description.slice(0, 60))}${parsed.data.description.length > 60 ? '…' : ''}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
          <h2 style="margin-top:0">Bug report</h2>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:4px 0;color:#64748b;width:160px">Reporter</td><td>${escapeHtml(user.email ?? user.id)}</td></tr>
            <tr><td style="padding:4px 0;color:#64748b">Category</td><td>${categoryLabel}</td></tr>
            ${parsed.data.page_url ? `<tr><td style="padding:4px 0;color:#64748b">Page</td><td>${escapeHtml(parsed.data.page_url)}</td></tr>` : ''}
          </table>
          <h3 style="margin-top:20px">Description</h3>
          <p style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:14px;white-space:pre-wrap">${escapeHtml(parsed.data.description)}</p>
        </div>
      `,
      text: `Bug report\nReporter: ${user.email ?? user.id}\nCategory: ${categoryLabel}${parsed.data.page_url ? `\nPage: ${parsed.data.page_url}` : ''}\n\n${parsed.data.description}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    return handleApiError(e)
  }
}
