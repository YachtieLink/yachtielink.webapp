import { Shield } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { certificationsSummary, countExpiringCerts } from '@/lib/profile-summaries'
import type { PublicCertification } from '@/lib/queries/types'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function certStatus(expiryDate: string | null | undefined): { label: string; color: string } {
  if (!expiryDate) return { label: '', color: '' }
  const expiry = new Date(expiryDate)
  const now = new Date()
  const soon = new Date(); soon.setMonth(soon.getMonth() + 3)
  if (expiry < now) return { label: 'Expired', color: 'text-[var(--color-error)]' }
  if (expiry < soon) return { label: `Expires ${formatDate(expiryDate)}`, color: 'text-[var(--color-warning)]' }
  return { label: `Valid until ${formatDate(expiryDate)}`, color: 'text-[var(--color-success)]' }
}

interface CertificationsSectionProps {
  certifications: PublicCertification[]
}

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  const expiringCount = countExpiringCerts(certifications)

  return (
    <ScrollReveal>
      <ProfileAccordion
        title="My Certifications"
        summary={certificationsSummary(certifications.length, expiringCount)}
        accentColor="sand"
        icon={<Shield size={16} />}
      >
        <div className="flex flex-col gap-2">
          {certifications.map((cert) => {
            const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
            const status = certStatus(cert.expires_at)
            return (
              <div key={cert.id} className="flex items-start justify-between gap-2">
                <p className="text-sm text-[var(--color-text-primary)]">{name}</p>
                {status.label && (
                  <span className={`shrink-0 text-xs font-medium ${status.color}`}>{status.label}</span>
                )}
              </div>
            )
          })}
        </div>
      </ProfileAccordion>
    </ScrollReveal>
  )
}
