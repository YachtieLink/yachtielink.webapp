import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { CV_PERSONAL_PROMPT } from '@/lib/cv/prompt'
import { validateBody } from '@/lib/validation/validate'
import { parseCVSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { extractCvText, isExtractError } from '@/lib/cv/extract-text'
import type { ParsedPersonal, ParsedLanguage } from '@/lib/cv/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit (separate category — doesn't compete with full parse or file uploads)
  const limited = await applyRateLimit(req, 'cvPersonalParse', user.id)
  if (limited) return limited

  // Body validation
  const result = await validateBody(req, parseCVSchema)
  if ('error' in result) return result.error
  const { storagePath } = result.data

  // Ownership guard
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Extract text (shared helper)
  console.log('[parse-personal] Extracting text from:', storagePath)
  const extraction = await extractCvText(storagePath)
  if (isExtractError(extraction)) {
    console.error('[parse-personal] Extraction failed:', extraction.error, 'status:', extraction.status)
    return NextResponse.json({ error: extraction.error }, { status: extraction.status })
  }
  console.log('[parse-personal] Extracted', extraction.text.length, 'chars')

  // AI call — no retry, 15s timeout
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'CV parsing is not configured' }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-5.4-mini',
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CV_PERSONAL_PROMPT },
          { role: 'user', content: extraction.text },
        ],
      },
      { signal: controller.signal },
    )
    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No content')

    const data = JSON.parse(content) as { personal: ParsedPersonal; languages: ParsedLanguage[] }
    return NextResponse.json({ ok: true, data, warning: extraction.warning })
  } catch (err) {
    clearTimeout(timeout)
    console.error('[parse-personal] AI call failed:', err)
    return NextResponse.json(
      { error: 'Could not parse personal details.' },
      { status: 422 },
    )
  }
  // Does NOT update cv_storage_path / cv_parsed_at (full parse handles that)
  // Does NOT count against check_cv_parse_limit RPC
}
