import { EndorsementCard } from './EndorsementCard'
import QRCode from 'react-qr-code'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  full_name: string
  display_name?: string | null
  handle: string
  primary_role?: string | null
  departments?: string[] | null
  bio?: string | null
  profile_photo_url?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  location_country?: string | null
  location_city?: string | null
  show_phone?: boolean
  show_whatsapp?: boolean
  show_email?: boolean
  show_location?: boolean
}

interface Attachment {
  id: string
  role_label?: string | null
  started_at?: string | null
  ended_at?: string | null
  yachts: {
    id: string
    name: string
    yacht_type?: string | null
    length_m?: number | null
    flag_state?: string | null
  } | null
}

interface Certification {
  id: string
  custom_cert_name?: string | null
  issued_at?: string | null
  expires_at?: string | null
  certification_types: {
    name: string
    category?: string | null
  } | null
}

interface Endorsement {
  id: string
  content: string
  created_at: string
  endorser_role_label?: string | null
  recipient_role_label?: string | null
  endorser: {
    display_name?: string | null
    full_name: string
    profile_photo_url?: string | null
  } | null
  yacht: {
    name: string
  } | null
}

export interface PublicProfileContentProps {
  user: UserProfile
  attachments: Attachment[]
  certifications: Certification[]
  endorsements: Endorsement[]
  showQrCode?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function certStatus(expiryDate: string | null | undefined): { label: string; color: string } {
  if (!expiryDate) return { label: '', color: '' }
  const expiry = new Date(expiryDate)
  const now = new Date()
  const threeMonths = new Date()
  threeMonths.setMonth(threeMonths.getMonth() + 3)

  if (expiry < now) return { label: 'Expired', color: 'text-[var(--color-error)]' }
  if (expiry < threeMonths) return { label: `Expires ${formatDate(expiryDate)}`, color: 'text-[var(--color-warning)]' }
  return { label: `Valid until ${formatDate(expiryDate)}`, color: 'text-[var(--color-success)]' }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PublicProfileContent({
  user,
  attachments,
  certifications,
  endorsements,
  showQrCode = false,
}: PublicProfileContentProps) {
  const displayName = user.display_name ?? user.full_name

  // Contact visibility
  const hasVisibleContact =
    (user.show_phone && user.phone) ||
    (user.show_whatsapp && user.whatsapp) ||
    (user.show_email && user.email) ||
    (user.show_location && (user.location_city || user.location_country))

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center">
        {user.profile_photo_url ? (
          <img
            src={user.profile_photo_url}
            alt={displayName}
            className="h-24 w-24 rounded-full object-cover border-2 border-[var(--color-border)]"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-surface-overlay)] text-2xl font-semibold text-[var(--color-text-secondary)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          {displayName}
        </h1>
        {(user.primary_role || user.departments?.length) && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {[user.primary_role, ...(user.departments ?? [])].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          yachtie.link/u/{user.handle}
        </p>
      </div>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      {user.bio && (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
            About
          </h2>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
            {user.bio}
          </p>
        </section>
      )}

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      {hasVisibleContact && (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
            Contact
          </h2>
          <div className="flex flex-col gap-1.5 text-sm text-[var(--color-text-primary)]">
            {user.show_email && user.email && (
              <p>{user.email}</p>
            )}
            {user.show_phone && user.phone && (
              <p>{user.phone}</p>
            )}
            {user.show_whatsapp && user.whatsapp && (
              <p>WhatsApp: {user.whatsapp}</p>
            )}
            {user.show_location && (user.location_city || user.location_country) && (
              <p>{[user.location_city, user.location_country].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Employment History ─────────────────────────────────────────────── */}
      {attachments.length > 0 && (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
            Employment History
          </h2>
          <div className="flex flex-col gap-3">
            {attachments.map((att) => (
              <div key={att.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-interactive)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {att.yachts?.yacht_type === 'Motor Yacht' ? 'MY' : att.yachts?.yacht_type === 'Sailing Yacht' ? 'SY' : ''}{' '}
                    {att.yachts?.name ?? 'Unknown Yacht'}
                    {att.role_label && (
                      <span className="font-normal text-[var(--color-text-secondary)]">
                        {' — '}{att.role_label}
                      </span>
                    )}
                  </p>
                  {(att.started_at || att.ended_at) && (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {formatDate(att.started_at)}
                      {att.started_at && ' — '}
                      {att.ended_at ? formatDate(att.ended_at) : 'Present'}
                    </p>
                  )}
                  {att.yachts?.flag_state && (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {att.yachts.flag_state}
                      {att.yachts.length_m && ` · ${att.yachts.length_m}m`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications ────────────────────────────────────────────────── */}
      {certifications.length > 0 && (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
            Certifications
          </h2>
          <div className="flex flex-col gap-2">
            {certifications.map((cert) => {
              const name = cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'
              const status = certStatus(cert.expires_at)
              return (
                <div key={cert.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {name}
                    </p>
                    {cert.certification_types?.category && (
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {cert.certification_types.category}
                      </p>
                    )}
                  </div>
                  {status.label && (
                    <span className={`shrink-0 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Endorsements ──────────────────────────────────────────────────── */}
      {endorsements.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3 px-4">
            Endorsements
          </h2>
          <div className="flex flex-col gap-3">
            {endorsements.map((end) => (
              <EndorsementCard
                key={end.id}
                endorserName={end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                endorserPhoto={end.endorser?.profile_photo_url}
                yachtName={end.yacht?.name}
                date={end.created_at}
                content={end.content}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── QR Code ───────────────────────────────────────────────────────── */}
      {showQrCode && (
        <div className="flex justify-start px-4 pb-4">
          <QRCode
            value={`https://yachtie.link/u/${user.handle}`}
            size={80}
            level="M"
            bgColor="transparent"
            fgColor="var(--color-text-tertiary)"
          />
        </div>
      )}
    </div>
  )
}
