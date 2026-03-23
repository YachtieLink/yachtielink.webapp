export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
  charCount: number
}

export function validateExtractedText(text: string): ValidationResult {
  const charCount = text.length

  if (charCount === 0) {
    return { valid: false, error: "Couldn't read any text from this file. It may be a scanned image or encrypted PDF.", charCount }
  }

  if (charCount < 200) {
    return { valid: false, error: 'Not enough text for a CV. The file may be corrupted or mostly images.', charCount }
  }

  // Check for garbled text (high ratio of non-ASCII characters)
  const nonAscii = text.replace(/[\x20-\x7E\n\r\t]/g, '').length
  if (nonAscii / charCount > 0.4) {
    return { valid: false, error: 'The extracted text looks garbled. Try saving the file as a different format.', charCount }
  }

  if (charCount > 25000) {
    return { valid: true, warning: 'Long document — will focus on key sections.', charCount }
  }

  return { valid: true, charCount }
}
