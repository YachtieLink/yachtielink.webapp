/**
 * LLM input sanitization + output validation.
 * All LLM features should use these utilities for defense in depth.
 */

// ── Input Sanitization ───────────────────────────────────────────────

const ZERO_WIDTH_CHARS = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g
const HTML_TAG = /<[^>]*>/g
const SCRIPT_PATTERN = /(<script[\s>]|javascript:|on\w+\s*=)/gi

/**
 * Sanitize user-supplied text before sending to LLM.
 * Strips HTML, scripts, zero-width chars, normalizes Unicode, truncates.
 */
export function sanitizeInput(text: string, maxLength = 5000): string {
  let clean = text
    // Strip delimiter tokens (prevent fake boundary injection)
    .replace(/<<<USER_CONTENT_START>>>/g, '')
    .replace(/<<<USER_CONTENT_END>>>/g, '')
    // Strip HTML tags
    .replace(HTML_TAG, '')
    // Remove script injection attempts
    .replace(SCRIPT_PATTERN, '')
    // Remove zero-width characters (used for invisible prompt injection)
    .replace(ZERO_WIDTH_CHARS, '')
    // Normalize Unicode (NFC form)
    .normalize('NFC')
    // Collapse excessive whitespace
    .replace(/\s+/g, ' ')
    .trim()

  // Truncate to max length
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength)
  }

  return clean
}

// ── Output Validation ────────────────────────────────────────────────

export interface OutputConstraints {
  maxLength?: number
  maxSentences?: number
  /** Reject if output contains these patterns */
  forbidPatterns?: RegExp[]
  /** Must be plain text (no markdown, code blocks, URLs) */
  plainTextOnly?: boolean
}

const CODE_BLOCK = /```[\s\S]*?```/
const MARKDOWN_HEADING = /^#{1,6}\s/m
const URL_PATTERN = /https?:\/\/[^\s]+/
const INSTRUCTION_PATTERN = /\b(ignore previous|disregard|forget|system prompt|as an ai|i am an ai|i'm an ai)\b/i

/**
 * Validate LLM output against constraints.
 * Returns { valid: true, text } or { valid: false, reason }.
 */
export function validateOutput(
  text: string,
  constraints: OutputConstraints = {}
): { valid: true; text: string } | { valid: false; reason: string } {
  const {
    maxLength = 2000,
    maxSentences,
    forbidPatterns = [],
    plainTextOnly = false,
  } = constraints

  if (!text || text.trim().length === 0) {
    return { valid: false, reason: 'Empty output' }
  }

  const trimmed = text.trim()

  if (trimmed.length > maxLength) {
    return { valid: false, reason: `Output exceeds ${maxLength} characters` }
  }

  if (plainTextOnly) {
    if (CODE_BLOCK.test(trimmed)) {
      return { valid: false, reason: 'Output contains code blocks' }
    }
    if (MARKDOWN_HEADING.test(trimmed)) {
      return { valid: false, reason: 'Output contains markdown headings' }
    }
    if (URL_PATTERN.test(trimmed)) {
      return { valid: false, reason: 'Output contains URLs' }
    }
  }

  if (INSTRUCTION_PATTERN.test(trimmed)) {
    return { valid: false, reason: 'Output contains instruction patterns' }
  }

  if (maxSentences) {
    const sentences = trimmed.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3)
    if (sentences.length > maxSentences) {
      return { valid: false, reason: `Output exceeds ${maxSentences} sentences` }
    }
  }

  for (const pattern of forbidPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'Output matches forbidden pattern' }
    }
  }

  return { valid: true, text: trimmed }
}

// ── User Content Wrapping ────────────────────────────────────────────

const DELIMITER_START = '<<<USER_CONTENT_START>>>'
const DELIMITER_END = '<<<USER_CONTENT_END>>>'

/**
 * Wrap user-supplied content in delimiter tokens for prompt injection resistance.
 * The system prompt tells the LLM to treat content between these delimiters
 * as data to process, never as instructions to follow.
 */
export function wrapUserContent(text: string): string {
  return `${DELIMITER_START}\n${text}\n${DELIMITER_END}`
}
