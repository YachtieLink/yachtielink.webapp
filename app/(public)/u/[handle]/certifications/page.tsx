import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { getUserByHandle, getPublicProfileSections } from '@/lib/queries/profile'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) return { title: 'Not Found' }
  const name = user.display_name || user.full_name
  return { title: `Certifications — ${name} — YachtieLink` }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function certStatus(expiryDate: string | null | undefined): { label: string; color: string } {
  if (!expiryDate) return { label: '', color: '' }
  const expiry = new Date(expiryDate)
  const now = new Date()
  const soon = new Date(); soon.setMonth(soon.getMonth() + 3)
  if (expiry < now) return { label: 'Expired', color: 'text-red-500' }
  if (expiry < soon) return { label: `Expires ${formatDate(expiryDate)}`, color: 'text-amber-500' }
  return { label: `Valid until ${formatDate(expiryDate)}`, color: 'text-green-600' }
}

export default async function CertificationsPage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const { certifications } = await getPublicProfileSections(user.id)
  const name = user.display_name || user.full_name

  return (
    <div className="max-w-[680px] mx-auto px-4 py-6 flex flex-col gap-4">
      <Link
        href={`/u/${handle}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Back to {name}
      </Link>

      <h1 className="text-2xl font-serif tracking-tight text-[var(--color-text-primary)]">
        Certifications
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        {certifications.length} certification{certifications.length !== 1 ? 's' : ''}
      </p>

      <div className="flex flex-col gap-3">
        {certifications.map((cert) => {
          const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
          const status = certStatus(cert.expires_at)
          return (
            <div key={cert.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{name}</p>
                {cert.issued_at && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Issued {formatDate(cert.issued_at)}</p>
                )}
              </div>
              {status.label && (
                <span className={`shrink-0 text-xs font-medium ${status.color}`}>{status.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
