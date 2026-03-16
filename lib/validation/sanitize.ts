// HTML sanitisation for user-generated text in non-JSX contexts
// (React already escapes JSX interpolation — use this for meta tags, emails, PDFs)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
