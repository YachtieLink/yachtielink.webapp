import { createServiceClient } from '@/lib/supabase/admin'
import { validateExtractedText } from '@/lib/cv/validate'

interface ExtractSuccess {
  text: string
  warning?: string
}

interface ExtractError {
  error: string
  status: number
}

export type ExtractResult = ExtractSuccess | ExtractError

export function isExtractError(r: ExtractResult): r is ExtractError {
  return 'error' in r && 'status' in r
}

/**
 * Shared CV text extraction pipeline:
 * 1. Download file from Supabase storage
 * 2. Extract text (PDF via pdf-parse, DOCX via mammoth)
 * 3. Pre-flight validation (empty, too short, garbled)
 * 4. Truncate to 25K chars
 */
export async function extractCvText(storagePath: string): Promise<ExtractResult> {
  // .doc rejection
  if (storagePath.endsWith('.doc') && !storagePath.endsWith('.docx')) {
    return { error: "Can't read .doc files. Please save as .pdf or .docx and try again.", status: 400 }
  }

  // Download file from storage
  const serviceClient = createServiceClient()
  const { data: fileData, error: downloadErr } = await serviceClient.storage
    .from('cv-uploads')
    .download(storagePath)

  if (downloadErr || !fileData) {
    return { error: 'Could not download CV file', status: 500 }
  }

  // Extract text based on file type
  let extractedText: string
  try {
    const buffer = Buffer.from(await fileData.arrayBuffer())

    if (storagePath.endsWith('.pdf')) {
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const textResult = await Promise.race([
        parser.getText(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF extraction timed out')), 15000)
        ),
      ])
      extractedText = textResult.pages.map((p: { text: string }) => p.text).join('\n')
    } else if (storagePath.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      return { error: 'Unsupported file type', status: 400 }
    }
  } catch {
    return { error: 'Could not extract text from your CV. Try entering your details manually.', status: 422 }
  }

  // Pre-flight validation
  const validation = validateExtractedText(extractedText.trim())
  if (!validation.valid) {
    return { error: validation.error!, status: 400 }
  }

  // Truncate to 25K chars
  const text = extractedText.trim().slice(0, 25000)

  return { text, warning: validation.warning }
}
