/**
 * vCard generation — shared helper for contact download.
 * Used by ContactModal and any other place that needs "Add to Contacts".
 */

export function generateVCard(opts: {
  displayName: string
  email?: string | null
  phone?: string | null
  role?: string | null
  profileUrl: string
}): void {
  const parts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${opts.displayName}`,
    opts.email ? `EMAIL:${opts.email}` : '',
    opts.phone ? `TEL:${opts.phone}` : '',
    opts.role ? `TITLE:${opts.role}` : '',
    'ORG:YachtieLink',
    `URL:${opts.profileUrl}`,
    'END:VCARD',
  ].filter(Boolean).join('\n')

  const blob = new Blob([parts], { type: 'text/vcard' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.displayName.replace(/\s+/g, '_')}.vcf`
  a.click()
  URL.revokeObjectURL(url)
}
