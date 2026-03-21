/**
 * PublicProfileContent — Bumble-style hero photo with identity overlaid,
 * then scrollable accordion sections below.
 */
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ChevronLeft, Pencil } from 'lucide-react'
import { ShareButton } from './ShareButton'
import { EndorsementCard } from './EndorsementCard'
import { ShowMoreButton } from './ShowMoreButton'
import { HeroSection } from './HeroSection'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { PhotoGallery } from '@/components/profile/PhotoGallery'
import { SocialLinksRow } from '@/components/profile/SocialLinksRow'
import { SaveProfileButton } from '@/components/profile/SaveProfileButton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
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
  const mutualColleagueIds = new Set((viewerRelationship?.mutualColleagues ?? []).map((c) => c.id))
  const mutualEndorserCount = endorsements.filter(
    (e: any) => e.endorser?.id && mutualColleagueIds.has(e.endorser.id)
  ).length

  const location = [user.location_city, user.location_country].filter(Boolean).join(', ')

  return (
    // ── Outer: stacked on mobile, side-by-side on desktop ────────────────────
    <div className="flex flex-col md:flex-row md:min-h-screen">

      {/* ── MOBILE: Animated hero (client component, md:hidden) ────────────── */}
      <HeroSection
        displayName={displayName}
        primaryRole={user.primary_role}
        departments={user.departments}
        location={location}
        showLocation={user.show_location}
        availableForWork={user.available_for_work}
        isFoundingMember={isFoundingMember}
        isOwnProfile={isOwnProfile}
        isLoggedIn={isLoggedIn}
        isColleague={isColleague}
        sharedYachtCount={sharedYachtIdSet.size}
        showMutual={showMutual}
        firstMutualName={firstMutual?.name}
        socialLinks={user.social_links}
        profilePhotos={profilePhotos}
        profilePhotoUrl={user.profile_photo_url}
        profileUrl={profileUrl}
        savedUserId={user.id}
        savedStatus={savedStatus}
      />

      {/* ── LEFT: Desktop hero photo panel (hidden on mobile) ─────────────── */}
      <div className="relative hidden md:block md:w-2/5 md:sticky md:top-0 md:h-screen shrink-0 overflow-hidden">

        {/* Photo fills this panel */}
        <div className="relative h-full w-full">
          <PhotoGallery
            photos={profilePhotos}
            profilePhotoUrl={user.profile_photo_url}
            displayName={displayName}
            fillContainer
          />
        </div>

        {/* Strong gradient — dark at top (for buttons) and bottom (for identity) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top fade for nav readability */}
          <div className="h-28 bg-gradient-to-b from-black/50 to-transparent" />
          {/* Bottom fade for identity readability */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>

        {/* Top bar — icon-only buttons over photo */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-[env(safe-area-inset-top,0.75rem)] z-10">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Link
                href="/app/profile"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
                aria-label="Edit profile"
              >
                <Pencil size={16} />
              </Link>
            ) : isLoggedIn ? (
              <SaveProfileButton
                savedUserId={user.id}
                initialSaved={!!savedStatus}
                initialFolderId={savedStatus?.folder_id}
              />
            ) : null}
            <ShareButton url={profileUrl} name={displayName} variant="compact" />
          </div>
        </div>

        {/* Identity — overlaid at bottom of photo */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 z-10 flex flex-col gap-3">
          {/* Availability badge */}
          {user.available_for_work && (
            <span className="self-start flex items-center gap-1.5 bg-green-500/25 backdrop-blur-md border border-green-400/40 rounded-full px-3 py-1 text-xs font-semibold text-green-300 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Available for work
            </span>
          )}

          {/* Name — large, confident */}
          <h1 className="text-white font-serif text-4xl md:text-5xl leading-[1.1] drop-shadow-lg tracking-tight">{displayName}</h1>

          {/* Role + Department — unified line */}
          {(user.primary_role || (user.departments && user.departments.length > 0)) && (
            <p className="text-white/90 text-base font-medium drop-shadow-sm">
              {user.primary_role}
              {user.primary_role && user.departments && user.departments.length > 0 && (
                <span className="text-white/50 mx-2">·</span>
              )}
              {user.departments && user.departments.length > 0 && (
                <span className="text-white/70">{user.departments.join(', ')}</span>
              )}
            </p>
          )}

          {/* Location */}
          {user.show_location && location && (
            <p className="text-white/60 text-sm flex items-center gap-1.5 font-medium">
              <MapPin size={13} className="text-white/50" />{location}
            </p>
          )}

          {/* Social links row (white variant on dark bg) */}
          {user.social_links && user.social_links.length > 0 && (
            <SocialLinksRow links={user.social_links as any} variant="light" />
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {isFoundingMember && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 backdrop-blur-sm border border-amber-400/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                ⚓ Founding Member
              </span>
            )}
            {isColleague && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 backdrop-blur-sm border border-teal-400/30 px-2.5 py-0.5 text-xs font-medium text-teal-300">
                🤝 Colleague{sharedYachtIdSet.size > 1 ? ` · ${sharedYachtIdSet.size} yachts` : ''}
              </span>
            )}
            {showMutual && firstMutual && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white/70">
                2nd connection · via {firstMutual.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT / BOTTOM: Scrollable content ────────────────────────────── */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="flex flex-col gap-4 px-4 pt-4 pb-24">

          {/* Contact info — only shown when user has opted in */}
          {(
            (user.show_email && user.email) ||
            (user.show_phone && user.phone) ||
            (user.show_whatsapp && user.whatsapp)
          ) && (
            <div className="bg-[var(--color-surface)] rounded-2xl p-4 flex flex-col gap-1.5 border border-[var(--color-border-subtle)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">Contact</p>
              {user.show_email && user.email && (
                <a href={`mailto:${user.email}`} className="text-sm text-[var(--color-interactive)] hover:underline">{user.email}</a>
              )}
              {user.show_phone && user.phone && (
                <a href={`tel:${user.phone}`} className="text-sm text-[var(--color-text-primary)]">{user.phone}</a>
              )}
              {user.show_whatsapp && user.whatsapp && (
                <a href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-interactive)] hover:underline">
                  WhatsApp: {user.whatsapp}
                </a>
              )}
            </div>
          )}

          {/* About */}
          {sectionVisible(sectionVisibility, 'about', !!(user.ai_summary || user.bio)) && (
            <ScrollReveal>
            <ProfileAccordion
              title="About"
              summary={aboutSummary(user.ai_summary, user.bio)}
            >
              <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                {user.ai_summary || user.bio}
              </p>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* Experience */}
          {sectionVisible(sectionVisibility, 'experience', attachments.length > 0) && (
            <ScrollReveal>
            <ProfileAccordion
              title="Experience"
              summary={experienceSummary(attachments)}
            >
              <div className="flex flex-col gap-3">
                {attachments.map((att: any) => {
                  const isShared = att.yachts?.id ? sharedYachtIdSet.has(att.yachts.id) : false
                  return (
                    <div key={att.id} className="flex gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-interactive)]" />
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
            </ScrollReveal>
          )}

          {/* Endorsements */}
          {sectionVisible(sectionVisibility, 'endorsements', endorsements.length > 0) && (
            <ScrollReveal>
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
                  <ShowMoreButton label={`${endorsements.length - 5} more endorsements`}>
                    {endorsements.slice(5).map((end: any) => (
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
                  </ShowMoreButton>
                )}
              </div>
            </ProfileAccordion>
            </ScrollReveal>
          )}

          {/* Certifications */}
          {sectionVisible(sectionVisibility, 'certifications', certifications.length > 0) && (
            <ScrollReveal>
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
            </ScrollReveal>
          )}

          {/* Education */}
          {sectionVisible(sectionVisibility, 'education', education.length > 0) && (
            <ScrollReveal>
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
            </ScrollReveal>
          )}

          {/* Hobbies */}
          {sectionVisible(sectionVisibility, 'hobbies', hobbies.length > 0) && (
            <ScrollReveal>
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
            </ScrollReveal>
          )}

          {/* Skills */}
          {sectionVisible(sectionVisibility, 'skills', skills.length > 0) && (
            <ScrollReveal>
            <ProfileAccordion
              title="Extra Skills"
              summary={skillsSummary(skills)}
            >
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
            </ScrollReveal>
          )}

          {/* Gallery */}
          {sectionVisible(sectionVisibility, 'gallery', gallery.length > 0) && (
            <ScrollReveal>
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
                <ShowMoreButton label={`${gallery.length - 9} more photos`}>
                  <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                    {gallery.slice(9).map((item) => (
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
                </ShowMoreButton>
              )}
            </ProfileAccordion>
            </ScrollReveal>
          )}
        </div>

        {/* Bottom CTAs */}
        <div className="px-4 pb-8 flex flex-col gap-3">
          {!isLoggedIn ? (
            <>
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
            </>
          ) : isOwnProfile ? (
            <Link
              href="/app/profile"
              className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              ← Back to my profile
            </Link>
          ) : (
            <Link
              href="/app/profile"
              className="w-full flex items-center justify-center rounded-xl border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              ← Back to dashboard
            </Link>
          )}
        </div>

        <footer className="text-center pb-6">
          <p className="text-xs text-[var(--color-text-secondary)]">
            <Link href="/welcome" className="hover:underline">YachtieLink</Link> — Professional profiles for yacht crew
          </p>
        </footer>
      </div>

      {/* ── Sticky bottom CTA for non-logged-in viewers (mobile only) ───────── */}
      {!isLoggedIn && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-surface)]/80 backdrop-blur-md border-t border-[var(--color-border-subtle)] z-40 md:hidden">
          <Link
            href="/welcome"
            className="w-full flex items-center justify-center rounded-xl bg-[var(--color-interactive)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-interactive-hover)] transition-colors"
          >
            Build your crew profile
          </Link>
        </div>
      )}
    </div>
  )
}
