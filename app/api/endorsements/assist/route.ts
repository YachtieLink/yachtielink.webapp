import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { moderateText } from '@/lib/ai/moderation'
import { validateOutput } from '@/lib/llm/sanitize'
import { buildEndorsementAssistPrompt } from '@/lib/llm/prompt-guard'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 5 per hour per user (endorsement assist is moderately expensive)
  const rl = await applyRateLimit(req, 'aiSummary', user.id)
  if (rl) return rl

  // Parse body
  let body: { recipient_id?: string; yacht_id?: string; partial_text?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { recipient_id, yacht_id, partial_text } = body
  if (!recipient_id || !yacht_id) {
    return NextResponse.json({ error: 'recipient_id and yacht_id are required' }, { status: 400 })
  }

  // Fetch endorsee info
  const { data: endorsee } = await supabase
    .from('users')
    .select('full_name, primary_role')
    .eq('id', recipient_id)
    .single()

  if (!endorsee) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
  }

  // Fetch yacht name
  const { data: yacht } = await supabase
    .from('yachts')
    .select('name')
    .eq('id', yacht_id)
    .single()

  // Fetch endorser's role on this yacht (from attachments)
  const { data: endorserAttachment } = await supabase
    .from('attachments')
    .select('role_title')
    .eq('user_id', user.id)
    .eq('yacht_id', yacht_id)
    .is('deleted_at', null)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  // Optionally fetch endorsee's CV summary (if available)
  let endorseeCvSummary: string | undefined
  const { data: endorseeProfile } = await supabase
    .from('users')
    .select('bio')
    .eq('id', recipient_id)
    .single()

  if (endorseeProfile?.bio) {
    endorseeCvSummary = endorseeProfile.bio
  }

  // Build prompt
  const { system, user: userMessage } = buildEndorsementAssistPrompt({
    endorserRole: endorserAttachment?.role_title ?? undefined,
    endorseeName: endorsee.full_name ?? 'this crew member',
    endorseeRole: endorsee.primary_role ?? undefined,
    yachtName: yacht?.name ?? 'the yacht',
    endorseeCvSummary,
    partialText: partial_text,
  })

  // Call LLM
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'LLM service unavailable' }, { status: 503 })
  }

  const openai = new OpenAI({ apiKey })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 500,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    })

    const draft = completion.choices[0]?.message?.content
    if (!draft) {
      return NextResponse.json({ error: 'No response from LLM' }, { status: 500 })
    }

    // Validate output
    const validation = validateOutput(draft, {
      maxLength: 1000,
      maxSentences: 5,
      plainTextOnly: true,
    })

    if (!validation.valid) {
      console.error('Endorsement assist output validation failed:', validation.reason)
      return NextResponse.json({ error: 'Generated text did not pass quality checks. Please try again.' }, { status: 500 })
    }

    // Run moderation
    const modResult = await moderateText(validation.text)
    if (modResult.flagged) {
      return NextResponse.json({ error: 'Generated text flagged by moderation. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ draft: validation.text })
  } catch (err) {
    console.error('Endorsement assist error:', err)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
