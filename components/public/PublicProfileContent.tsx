/**
 * PublicProfileContent — Sprint 10 redesign
 * Bumble-style hero photo + accordion sections.
 */
import Image from 'next/image'
import Link from 'next/link'
import { ShareButton } from './ShareButton'
import { EndorsementCard } from './EndorsementCard'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { PhotoGallery } from '@/components/profile/PhotoGallery'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'
import {
  aboutSummary,
  experienceSummary,
  endorsementsSummary,
  certificationsSummary,
  educationSummary,
  hobbiesSummary,
  skillsSummary,
  gallerySummary,
  countExpiringCerts,
} from '@/lib/profile-summaries'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  full_name: string
  display_name?: string | null
  handle: string
  primary_role?: string | null
  departments?: string[] | null
  bio?: string | null
  ai_summary?: string | null
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
  founding_member?: boolean
  social_links?: Array<{ platform: string; url: string }> | null
}

export interface PublicProfileContentProps {
  user: UserProfile
  attachments: any[]
  certifications: any[]
  endorsements: any[]
  profilePhotos: Array<{ id: string; photo_url: string; sort_order: number }>
  hobbies: Array<{ id: string; name: string; emoji?: string | null }>
  education: Array<{ id: string; institution: string; qualification?: string | null; field_of_study?: string | null; started_at?: string | null; ended_at?: string | null }>
  skills: Array<{ id: string; name: string; category?: string | null }>
  gallery: Array<{ id: string; image_url: string; caption?: string | null; yachts?: { name: string } | null }>
  isFoundingMember?: boolean
  isLoggedIn?: boolean
  viewerRelationship?: {
    isOwnProfile: boolean
    sharedYachtIds: string[]
    mutualColleagues: Array<{
      id: string; name: string; photoUrl: string | null
      throughYachtWithProfile: string; throughYachtWithViewer: string
    }>
  }
  sectionVisibility?: Record<string, boolean>
  savedStatus?: { id: string; folder_id: string | null } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function sectionVisible(visibility: Record<string, boolean>, key: string, hasData: boolean): boolean {
  // Show if explicitly enabled OR (data exists AND not explicitly disabled)
  return visibility[key] !== false && hasData
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PublicProfileContent({
  user,
  attachments,
  certifications,
  endorsements,
  profilePhotos,
  hobbies,
  education,
  skills,
  gallery,
  isFoundingMember = false,
  isLoggedIn,
  viewerRelationship,
  sectionVisibility = {},
  savedStatus,
}: PublicProfileContentProps) {
  const displayName = user.display_name ?? user.full_name
  const isOwnProfile = viewerRelationship?.isOwnProfile ?? false
  const sharedYachtIdSet = new Set(viewerRelationship?.sharedYachtIds ?? [])
  const isColleague = sharedYachtIdSet.size > 0
  const mutualColleagues = viewerRelationship?.mutualColleagues ?? []
  const showMutual = !isColleague && mutualColleagues.length > 0
  const firstMutual = mutualColleagues[0]

  const profileUrl = `https://yachtie.link/u/${user.handle}`
  const expiringCount = countExpiringCerts(certifications)

  // Mutual endorser count (endorsers on shared yachts)
  const mutualEndorserCount = endorsements.filter((e: any) => {
    // endorser is on a shared yacht if we have a sharedYacht link
    return sharedYachtIdSet.size > 0
  }).length

  return (
    <div className="flex flex-col md:flex-row md:min-h-screen">

      {/* ── PHOTO SECTION (left on desktop, full-width on mobile) ─────────── */}
      <div className="md:w-2/5 md:sticky md:top-0 md:h-screen md:overflow-hidden shrink-0">
        <PhotoGallery
          photos={profilePhotos}
          profilePhotoUrl={user.profile_photo_url}
          displayName={displayName}
        />
      </div>

      {/* ── CONTENT SECTION (right on desktop, below photo on mobile) ──────── */}
      <div className="flex-1 md:overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Link href="/" className="text-sm text-[var(--color-interactive)] hover:underline">
            ← YachtieLink
          </Link>
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Link
                href="/app/profile"
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-interactive)] text-white hover:bg-[var(--color-interactive-hover)] transition-colors font-medium"
              >
                Edit profile
              </Link>
            ) : isLoggedIn ? (
              <SaveProfileButton
                savedUserId={user.id}
                initialSaved={!!savedStatus}
                initialFolderId={savedStatus?.folder_id}
              />
            ) : null}
            <ShareButton url={profileUrl} name={displayName} />
          </div>
        </div>

        {/* Identity block */}
        <div className="px-4 py-3 flex flex-col gap-2">
          <div>
            <h1 className="font-semibold text-xl text-[var(--color-text-primary)]">{displayName}</h1>
            {user.primary_role && (
              <p className="text-sm text-[var(--color-text-secondary)]">{user.primary_role}</p>
            )}
            {user.departments && user.departments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.departments.map((dept) => (
                  <span key={dept} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">
                    {dept}
                  </span>
                ))}
              </div>
            )}
          </div>

          {user.show_location && (user.location_city || user.location_country) && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              📍 {[user.location_city, user.location_country].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Social links */}
          {user.social_links && user.social_links.length > 0 && (
            <SocialLinksRow links={user.social_links as any} />
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {isFoundingMember && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                ⚓ Founding Member
              </span>
            )}
            {isColleague && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-interactive)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-interactive)]">
                🤝 Colleague
                {sharedYachtIdSet.size > 1 && ` · ${sharedYachtIdSet.size} yachts`}
              </span>
            )}
            {showMutual && firstMutual && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                2nd connection · via {firstMutual.name}
              </span>
            )}
          </div>
        </div>

        {/* Accordion sections */}
        <div className="flex flex-col gap-2 px-4 pb-24">

          {/* About */}
          {sectionVisible(sectionVisibility, 'about', !!(user.ai_summary || user.bio)) && (
            <ProfileAccordion
              title="About"
              summary={aboutSummary(user.ai_summary, user.bio)}
            >
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                {user.ai_summary || user.bio}
              </p>
            </ProfileAccordion>
          )}

          {/* Experience */}
          {sectionVisible(sectionVisibility, 'experience', attachments.length > 0) && (
            <ProfileAccordion
              title="Experience"
              summary={experienceSummary(attachments)}
            >
              <div className="flex flex-col gap-3">
                {attachments.map((att: any) => {
                  const isShared = att.yachts?.id ? sharedYachtIdSet.has(att.yachts.id) : false
                  return (
                    <div key={att.id} className="flex gap-3">
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isShared ? 'bg-[var(--color-interactive)] ring-2 ring-[var(--color-interactive)]/30' : 'bg-[var(--color-interactive)]'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {att.yachts?.name ?? 'Unknown Yacht'}
                          {att.role_label && <span className="font-normal text-[var(--color-text-secondary)]"> — {att.role_label}</span>}
                          {isShared && <span className="ml-2 text-xs text-[var(--color-interactive)]">You worked here</span>}
                        </p>
                        {(att.started_at || att.ended_at) && (
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {formatDate(att.started_at)}{att.started_at && ' – '}{att.ended_at ? formatDate(att.ended_at) : 'Present'}
                          </p>
                        )}
                        {att.yachts?.flag_state && (
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            🏳 {att.yachts.flag_state}{att.yachts.length_m ? ` · ${att.yachts.length_m}m` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ProfileAccordion>
          )}

          {/* Endorsements */}
          {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
            <ProfileAccordion
              title="Endorsements"
              summary={endorsementsSummary(endorsements.length, mutualEndorserCount)}
            >
              <div className="flex flex-col gap-3">
                {endorsements.slice(0, 5).map((end: any) => (
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
                {endorsements.length > 5 && (
                  <p className="text-sm text-[var(--color-interactive)] text-center pt-1">
                    {endorsements.length - 5} more endorsements
                  </p>
                )}
              </div>
            </ProfileAccordion>
          )}

          {/* Certifications */}
          {sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) && (
            <ProfileAccordion
              title="Certifications"
              summary={certificationsSummary(certifications.length, expiringCount)}
            >
              <div className="flex flex-col gap-2">
                {certifications.map((cert: any) => {
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
          )}

          {/* Education */}
          {sectionVisible(sectionVisibility, 'education', education.length > 0) && (
            <ProfileAccordion
              title="Education"
              summary={educationSummary(education)}
            >
              <div className="flex flex-col gap-3">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{edu.institution}</p>
                    {edu.qualification && <p className="text-sm text-[var(--color-text-secondary)]">{edu.qualification}</p>}
                    {edu.field_of_study && <p className="text-xs text-[var(--color-text-secondary)]">{edu.field_of_study}</p>}
                    {(edu.started_at || edu.ended_at) && (
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {edu.started_at ? new Date(edu.started_at).getFullYear() : ''}{edu.started_at && edu.ended_at ? ' – ' : ''}{edu.ended_at ? new Date(edu.ended_at).getFullYear() : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ProfileAccordion>
          )}

          {/* Hobbies */}
          {sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) && (
            <ProfileAccordion
              title="Hobbies"
              summary={hobbiesSummary(hobbies)}
            >
              <div className="flex flex-wrap gap-2">
                {hobbies.map((h) => (
                  <span key={h.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
                    {h.emoji ? `${h.emoji} ${h.name}` : h.name}
                  </span>
                ))}
              </div>
            </ProfileAccordion>
          )}

          {/* Skills */}
          {sectionVisible(sectionVisibility, 'skills', skills.length > 0) && (
            <ProfileAccordion
              title="Extra Skills"
              summary={skillsSummary(skills)}
            >
              {/* Group by category */}
              {(() => {
                const grouped = skills.reduce((acc, s) => {
                  const cat = s.category ?? 'other'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(s)
                  return acc
                }, {} as Record<string, typeof skills>)
                return Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-1.5 capitalize">{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((s) => (
                        <span key={s.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              })()}
            </ProfileAccordion>
          )}

          {/* Gallery */}
          {sectionVisible(sectionVisibility, 'gallery', gallery.length > 0) && (
            <ProfileAccordion
              title="Gallery"
              summary={gallerySummary(gallery.length)}
            >
              <div className="grid grid-cols-3 gap-1.5">
                {gallery.slice(0, 9).map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-raised)]">
                    <Image
                      src={item.image_url}
                      alt={item.caption ?? 'Gallery photo'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
              {gallery.length > 9 && (
                <p className="text-sm text-[var(--color-interactive)] text-center pt-2">{gallery.length - 9} more photos</p>
              )}
            </ProfileAccordion>
          )}
        </div>

        {/* Bottom CTA */}
        {!isLoggedIn && (
          <div className="px-4 pb-8 flex flex-col gap-3">
            <Link
              href="/signup"
              className="w-full flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
            >
              Build your crew profile — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Sign in to see how you know {displayName}
            </Link>
          </div>
        )}

        <footer className="text-center pb-6">
          <p className="text-xs text-[var(--color-text-secondary)]">
            <Link href="/welcome" className="hover:underline">YachtieLink</Link> — Professional profiles for yacht crew
          </p>
        </footer>
      </div>
    </div>
  )
}
