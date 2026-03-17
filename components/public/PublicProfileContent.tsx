import { EndorsementCard } from './EndorsementCard'
import { ShareButton } from './ShareButton'
import { PublicQRCode } from './PublicQRCode'

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
  available_for_work?: boolean
  available_from?: string | null
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
  isFoundingMember?: boolean
  isPro?: boolean
  isLoggedIn?: boolean
  viewerRelationship?: {
    isOwnProfile: boolean
    sharedYachtIds: string[]
    mutualColleagues: Array<{
      id: string
      name: string
      photoUrl: string | null
      throughYachtWithProfile: string
      throughYachtWithViewer: string
    }>
  }
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

function computeSeaTime(attachments: Attachment[]): string | null {
  if (attachments.length === 0) return null
  let totalDays = 0
  const now = new Date()
  for (const att of attachments) {
    if (!att.started_at) continue
    const start = new Date(att.started_at)
    const end = att.ended_at ? new Date(att.ended_at) : now
    const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    totalDays += days
  }
  if (totalDays === 0) return null
  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)
  if (years > 0 && months > 0) return `${years}y ${months}m at sea`
  if (years > 0) return `${years}y at sea`
  if (months > 0) return `${months}m at sea`
  return `${totalDays}d at sea`
}

export function PublicProfileContent({
  user,
  attachments,
  certifications,
  endorsements,
  showQrCode = false,
  isFoundingMember = false,
  isPro: _isPro = false,
  isLoggedIn,
  viewerRelationship,
}: PublicProfileContentProps) {
  const displayName = user.display_name ?? user.full_name
  const sharedYachtIdSet = new Set(viewerRelationship?.sharedYachtIds ?? [])
  const isColleague = sharedYachtIdSet.size > 0
  const mutualColleagues = viewerRelationship?.mutualColleagues ?? []
  // Only show 2nd-degree if not already a direct colleague
  const showMutual = !isColleague && mutualColleagues.length > 0
  const firstMutual = mutualColleagues[0]

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
        {isFoundingMember && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Founding Member
          </span>
        )}
        {user.available_for_work && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {user.available_from
              ? `Available from ${new Date(user.available_from).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`
              : 'Available for work'}
          </span>
        )}
        {(user.primary_role || user.departments?.length) && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {[user.primary_role, ...(user.departments ?? [])].filter(Boolean).join(' · ')}
          </p>
        )}
        {(() => {
          const seaTime = computeSeaTime(attachments)
          return seaTime ? (
            <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
              {seaTime} · {attachments.length} yacht{attachments.length !== 1 ? 's' : ''}
              {endorsements.length > 0 ? ` · ${endorsements.length} endorsement${endorsements.length !== 1 ? 's' : ''}` : ''}
            </p>
          ) : null
        })()}
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          yachtie.link/u/{user.handle}
        </p>
        {isColleague && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-interactive)] px-3 py-1 text-xs font-medium text-[var(--color-interactive)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 17l4-8 4 4 4-6 4 10" />
              <path d="M3 21h18" />
            </svg>
            Colleague
            {sharedYachtIdSet.size === 1 ? ' · 1 yacht in common' : ` · ${sharedYachtIdSet.size} yachts in common`}
          </span>
        )}
        {showMutual && firstMutual && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              2nd connection
              {mutualColleagues.length > 1 && ` · ${mutualColleagues.length} mutual colleagues`}
            </span>
            <p className="text-xs text-[var(--color-text-tertiary)] text-center max-w-[260px]">
              {firstMutual.name} worked with {displayName}
              {firstMutual.throughYachtWithProfile ? ` on ${firstMutual.throughYachtWithProfile}` : ''}
              {firstMutual.throughYachtWithViewer ? ` · and with you on ${firstMutual.throughYachtWithViewer}` : ''}
            </p>
          </div>
        )}
        <ShareButton
          url={`https://yachtie.link/u/${user.handle}`}
          name={displayName}
        />
      </div>

      {/* ── Two-column grid (desktop) / single column (mobile) ────────────── */}
      <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8 flex flex-col gap-6 lg:gap-y-6">

        {/* ── Left column: About + Contact + Certifications ─────────────── */}
        <div className="flex flex-col gap-6">

          {/* ── About ───────────────────────────────────────────────────── */}
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

          {/* ── Contact ─────────────────────────────────────────────────── */}
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

          {/* ── Certifications ──────────────────────────────────────────── */}
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

        </div>

        {/* ── Right column: Employment History + Endorsements ───────────── */}
        <div className="flex flex-col gap-6">

          {/* ── Employment History ──────────────────────────────────────── */}
          {attachments.length > 0 && (
            <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-3">
                Employment History
              </h2>
              <div className="flex flex-col gap-3">
                {attachments.map((att) => {
                  const isShared = att.yachts?.id ? sharedYachtIdSet.has(att.yachts.id) : false
                  return (
                    <div key={att.id} className="flex gap-3">
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isShared ? 'bg-[var(--color-interactive)] ring-2 ring-[var(--color-interactive)] ring-offset-1 ring-offset-[var(--color-surface)]' : 'bg-[var(--color-interactive)]'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {att.yachts?.yacht_type === 'Motor Yacht' ? 'MY' : att.yachts?.yacht_type === 'Sailing Yacht' ? 'SY' : ''}{' '}
                          {att.yachts?.name ?? 'Unknown Yacht'}
                          {att.role_label && (
                            <span className="font-normal text-[var(--color-text-secondary)]">
                              {' — '}{att.role_label}
                            </span>
                          )}
                          {isShared && (
                            <span className="ml-2 text-xs font-normal text-[var(--color-interactive)]">You worked here</span>
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
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Endorsements ────────────────────────────────────────────── */}
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
                    endorserRole={end.endorser_role_label}
                    endorserPhoto={end.endorser?.profile_photo_url}
                    yachtName={end.yacht?.name}
                    date={end.created_at}
                    content={end.content}
                  />
                ))}
              </div>
            </section>
          )}

        </div>

      </div>

      {/* ── CTA section ──────────────────────────────────────────────────── */}
      {isLoggedIn ? (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
          {viewerRelationship?.isOwnProfile ? (
            <a
              href="/app/profile"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
            >
              Back to dashboard
            </a>
          ) : (
            <a
              href="/app/profile"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            >
              Back to my profile
            </a>
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            {displayName} has {endorsements.length} endorsement{endorsements.length !== 1 ? 's' : ''} from colleagues
            {attachments.length > 0 ? ` across ${attachments.length} yacht${attachments.length !== 1 ? 's' : ''}` : ''}.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
            >
              Build your own profile — it&apos;s free
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            >
              Sign in to see how you know {displayName}
            </a>
          </div>
        </section>
      )}

      {/* ── QR Code (full width) ──────────────────────────────────────────── */}
      {showQrCode && (
        <div className="flex justify-start px-4 pb-4">
          <PublicQRCode handle={user.handle} />
        </div>
      )}

      {/* ── Branding footer ───────────────────────────────────────────────── */}
      <footer className="text-center pt-4 pb-2">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          <a href="/welcome" className="hover:underline">YachtieLink</a> — Professional profiles for yacht crew
        </p>
      </footer>
    </div>
  )
}
