'use client'

import Link from 'next/link'

interface Cert {
  id: string
  custom_cert_name: string | null
  issued_at: string | null
  expires_at: string | null
  document_url: string | null
  certification_types: {
    name: string
    short_name: string | null
    category: string
  } | null
}

interface CertsSectionProps {
  certs: Cert[]
}

function expiryStatus(expiresAt: string | null): 'valid' | 'expiring-soon' | 'expired' | 'no-expiry' {
  if (!expiresAt) return 'no-expiry'
  const exp  = new Date(expiresAt)
  const now  = new Date()
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0)   return 'expired'
  if (diff < 90)  return 'expiring-soon'
  return 'valid'
}

const STATUS_STYLES: Record<string, string> = {
  valid:          'bg-green-500/10 text-green-600 dark:text-green-400',
  'expiring-soon':'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  expired:        'bg-red-500/10 text-red-500',
  'no-expiry':    'bg-[var(--muted)] text-[var(--muted-foreground)]',
}

const STATUS_LABELS: Record<string, string> = {
  valid:           'Valid',
  'expiring-soon': 'Expiring soon',
  expired:         'Expired',
  'no-expiry':     'No expiry',
}

export function CertsSection({ certs }: CertsSectionProps) {
  return (
    <div className="bg-[var(--card)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[var(--foreground)]">Certifications</h2>
        <Link
          href="/app/certification/new"
          className="text-sm text-[var(--ocean-500)] hover:underline"
        >
          Add
        </Link>
      </div>

      {certs.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Add your certifications to complete your profile.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {certs.map((cert) => {
            const name   = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Unknown'
            const status = expiryStatus(cert.expires_at)

            return (
              <li key={cert.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{name}</p>
                  {cert.issued_at && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Issued {new Date(cert.issued_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      {cert.expires_at && ` · Expires ${new Date(cert.expires_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                    </p>
                  )}
                  {cert.document_url && (
                    <p className="text-xs text-[var(--ocean-500)] mt-0.5">Document attached</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  <Link
                    href={`/app/certification/${cert.id}/edit`}
                    className="text-xs text-[var(--muted-foreground)] hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
