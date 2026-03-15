import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { CV_EXTRACTION_PROMPT } from '@/lib/cv/prompt'

interface ParseRequestBody {
  storagePath: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as ParseRequestBody
  const { storagePath } = body
  if (!storagePath) {
    return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 })
  }

  // Rate limit check
  const { data: allowed } = await supabase.rpc('check_cv_parse_limit', { p_user_id: user.id })
  if (!allowed) {
    return NextResponse.json(
      { error: 'You can parse up to 3 CVs per day. Try again tomorrow.' },
      { status: 429 },
    )
  }

  // Download file from storage using service role (server-side)
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: fileData, error: downloadErr } = await serviceClient.storage
    .from('cv-uploads')
    .download(storagePath)

  if (downloadErr || !fileData) {
    return NextResponse.json({ error: 'Could not download CV file' }, { status: 500 })
  }

  // Extract text based on file type
  let extractedText: string
  try {
    const buffer = Buffer.from(await fileData.arrayBuffer())

    if (storagePath.endsWith('.pdf')) {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const textResult = await parser.getText()
      extractedText = textResult.pages.map((p) => p.text).join('\n')
    } else if (storagePath.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }
  } catch {
    return NextResponse.json(
      { error: 'Could not extract text from your CV. Try entering your details manually.' },
      { status: 422 },
    )
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: 'No text found in the CV. The file may be a scanned image. Try entering your details manually.' },
      { status: 422 },
    )
  }

  // Truncate to 15000 chars
  const truncated = extractedText.slice(0, 15000)

  // Call OpenAI API
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'CV parsing is not configured' }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey })

  let parsedData: Record<string, unknown>
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: CV_EXTRACTION_PROMPT,
          },
          {
            role: 'user',
            content: truncated,
          },
        ],
      },
      { signal: controller.signal },
    )

    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in response')
    }

    parsedData = JSON.parse(content)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'CV parsing timed out. Try again or enter your details manually.' },
        { status: 504 },
      )
    }
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

  return NextResponse.json({ ok: true, data: parsedData })
}
