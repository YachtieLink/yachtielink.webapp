import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody } from '@/lib/validation/validate'
import { aiSummaryEditSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { handleApiError } from '@/lib/api/errors'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// POST — generate AI summary from profile data
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await applyRateLimit(req, 'aiSummary', user.id)
    if (limited) return limited

    // Optional: force=true bypasses the edited-summary guard
    const body = await req.json().catch(() => ({}))
    const force = body?.force === true

    // Fetch bio + attachments + top endorsement excerpts
    const [profileRes, attachRes, endorseRes] = await Promise.all([
      supabase.from('users').select('bio, primary_role, ai_summary_edited').eq('id', user.id).single(),
      supabase.from('attachments').select('role_label, started_at, ended_at, yachts ( name )').eq('user_id', user.id).is('deleted_at', null).order('started_at', { ascending: false }).limit(5),
      supabase.from('endorsements').select('content').eq('recipient_id', user.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(3),
    ])

    const profile = profileRes.data
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    if (profile.ai_summary_edited && !force) {
      return NextResponse.json({ error: 'Summary has been manually edited — pass force:true to regenerate.' }, { status: 400 })
    }

    const context = [
      profile.primary_role ? `Role: ${profile.primary_role}` : '',
      profile.bio ? `Bio: ${profile.bio}` : '',
      attachRes.data?.length
        ? `Experience: ${attachRes.data.map((a: any) => `${a.role_label} on ${a.yachts?.name ?? 'a yacht'}`).join(', ')}`
        : '',
      endorseRes.data?.length
        ? `Endorsements: ${endorseRes.data.map((e: any) => `"${e.content.slice(0, 150)}"`).join(' | ')}`
        : '',
    ].filter(Boolean).join('\n')

    if (!context.trim()) {
      return NextResponse.json({ error: 'Not enough profile data to generate a summary.' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You write concise professional summaries for maritime professionals. Write 2-3 sentences only. Do not use phrases like "passionate", "dynamic", or any AI clichés. Sound like a person, not a machine. No first-person pronouns.',
        },
        { role: 'user', content: `Write a professional summary for this crew member:\n${context}` },
      ],
      max_tokens: 120,
      temperature: 0.7,
    })

    const summary = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!summary) return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })

    await supabase.from('users').update({ ai_summary: summary, ai_summary_edited: false }).eq('id', user.id)

    return NextResponse.json({ summary })
  } catch (e) {
    return handleApiError(e)
  }
}

// PATCH — save manual edit to summary
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await validateBody(req, aiSummaryEditSchema)
    if ('error' in result) return result.error
    const { summary } = result.data

    await supabase
      .from('users')
      .update({ ai_summary: summary, ai_summary_edited: true })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleApiError(e)
  }
}
