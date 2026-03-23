import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { CV_EXTRACTION_PROMPT } from '@/lib/cv/prompt'
import { validateBody } from '@/lib/validation/validate'
import { parseCVSchema } from '@/lib/validation/schemas'
import { applyRateLimit } from '@/lib/rate-limit/helpers'
import { trackServerEvent } from '@/lib/analytics/server'
import { extractCvText, isExtractError } from '@/lib/cv/extract-text'
import type { ParsedCvData } from '@/lib/cv/types'

export const maxDuration = 60

async function callAiWithRetry(openai: OpenAI, text: string, maxRetries = 1): Promise<ParsedCvData> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          max_tokens: 8000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: CV_EXTRACTION_PROMPT },
            { role: 'user', content: text },
          ],
        },
        { signal: controller.signal },
      )

      clearTimeout(timeout)

      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('No content in response')

      return JSON.parse(content) as ParsedCvData
    } catch (err) {
      clearTimeout(timeout)
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt < maxRetries) continue
    }
  }

  throw lastError!
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await applyRateLimit(req, 'fileUpload', user.id)
  if (limited) return limited

  const result = await validateBody(req, parseCVSchema)
  if ('error' in result) return result.error
  const { storagePath } = result.data

  // Ownership guard: users can only parse their own CV files
  if (!storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Rate limit check
  const { data: allowed } = await supabase.rpc('check_cv_parse_limit', { p_user_id: user.id })
  if (!allowed) {
    return NextResponse.json(
      { error: 'You can parse up to 3 CVs per day. Try again tomorrow.' },
      { status: 429 },
    )
  }

  // Extract text (shared helper — handles download, PDF/DOCX extraction, validation, truncation)
  const extraction = await extractCvText(storagePath)
  if (isExtractError(extraction)) {
    return NextResponse.json({ error: extraction.error }, { status: extraction.status })
  }
  const truncated = extraction.text

  // Call OpenAI API
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'CV parsing is not configured' }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey })

  let parsedData: ParsedCvData
  try {
    parsedData = await callAiWithRetry(openai, truncated)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      trackServerEvent(user.id, 'cv.parse_failed', { reason: 'timeout' })
      return NextResponse.json(
        { error: 'CV parsing timed out. Try again or enter your details manually.' },
        { status: 504 },
      )
    }
    trackServerEvent(user.id, 'cv.parse_failed', { reason: 'parse_error' })
    return NextResponse.json(
      { error: 'Could not parse CV data. Try entering your details manually.' },
      { status: 422 },
    )
  }

  // Update user record
  await supabase
    .from('users')
    .update({ cv_storage_path: storagePath, cv_parsed_at: new Date().toISOString() })
    .eq('id', user.id)

  trackServerEvent(user.id, 'cv.parsed')
  return NextResponse.json({ ok: true, data: parsedData, warning: extraction.warning })
}
