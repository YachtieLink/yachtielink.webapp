import Link from 'next/link'
import { formatDate } from '@/lib/format-date'

interface CvPreviewProps {
  mode: 'owner' | 'viewer'
  user: Record<string, any>
  attachments: any[]
  certifications: any[]
  endorsements: any[]
  education: any[]
  skills: any[]
  hobbies: any[]
}

function calculateAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function CvPreview({ mode, user, attachments, certifications, endorsements, education, skills, hobbies }: CvPreviewProps) {
  const displayName = user.display_name ?? user.full_name
  const isOwner = mode === 'owner'

  const headerParts: string[] = []
  if (user.home_country && (isOwner || user.show_home_country !== false)) headerParts.push(user.home_country)
  if (user.dob && user.show_dob === true) headerParts.push(`${calculateAge(user.dob)} years old`)

  const contactParts: string[] = []
  if (user.show_email && user.email) contactParts.push(user.email)
  if (user.show_phone && user.phone) contactParts.push(user.phone)
  if (user.show_location && (user.location_city || user.location_country)) {
    contactParts.push([user.location_city, user.location_country].filter(Boolean).join(', '))
  }

  const personalDetails: string[] = []
  if (user.smoke_pref) personalDetails.push(humanize(user.smoke_pref))
  if (user.appearance_note && user.appearance_note !== 'not_specified') personalDetails.push(`Tattoos: ${humanize(user.appearance_note)}`)
  if (user.travel_docs?.length) personalDetails.push(user.travel_docs.join(', '))
  if (user.license_info) personalDetails.push(`License: ${user.license_info}`)

  const languages = user.languages as Array<{ language: string; proficiency: string }> | null

  return (
    <div className="max-w-[700px] mx-auto bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden min-w-0">
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
        {user.primary_role && <p className="text-sm text-gray-600 mt-0.5">{user.primary_role}</p>}
        {headerParts.length > 0 && <p className="text-sm text-gray-500">{headerParts.join(' · ')}</p>}
        {contactParts.length > 0 && <p className="text-xs text-gray-400 mt-1">{contactParts.join(' · ')}</p>}
      </div>

      {/* Personal Details */}
      {(personalDetails.length > 0 || (languages && languages.length > 0)) && (
        <div className="px-6 pb-4">
          {personalDetails.length > 0 && <p className="text-xs text-gray-500">{personalDetails.join(' · ')}</p>}
          {languages && languages.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}
            </p>
          )}
        </div>
      )}

      <hr className="border-gray-100" />

      {/* About */}
      {user.bio ? (
        <Section title="About" editHref={isOwner ? '/app/about/edit' : undefined}>
          <p className="text-sm text-gray-700 leading-relaxed break-words">{user.bio}</p>
        </Section>
      ) : isOwner ? (
        <MissingField label="Add your bio" href="/app/about/edit" />
      ) : null}

      {/* Experience */}
      {attachments.length > 0 && (
        <Section title="Experience" editHref={isOwner ? '/app/attachment/new' : undefined}>
          <div className="flex flex-col gap-3">
            {attachments.map((att: any) => {
              const specs = [
                att.yachts?.length_meters ? `${att.yachts.length_meters}m` : null,
                att.yachts?.builder,
                att.yacht_program ? humanize(att.yacht_program) : null,
              ].filter(Boolean).join(' · ')
              return (
                <div key={att.id}>
                  <p className="text-sm font-medium text-gray-900">
                    {att.yachts?.yacht_type === 'Motor Yacht' ? 'MY ' : att.yachts?.yacht_type === 'Sailing Yacht' ? 'SY ' : ''}
                    {att.yachts?.name ?? 'Unknown'}
                    {specs && <span className="font-normal text-gray-500"> · {specs}</span>}
                  </p>
                  <p className="text-xs text-gray-600">
                    {att.role_label} · {formatDate(att.started_at)} — {att.ended_at ? formatDate(att.ended_at) : 'Present'}
                  </p>
                  {att.cruising_area && <p className="text-xs text-gray-400">{att.cruising_area}</p>}
                  {att.description && <p className="text-xs text-gray-500 mt-1 break-words">{att.description.slice(0, 500)}</p>}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <Section title="Certifications" editHref={isOwner ? '/app/certification/new' : undefined}>
          <div className="flex flex-col gap-1">
            {certifications.map((cert: any) => (
              <div key={cert.id} className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-900">{cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'}</span>
                  {cert.issuing_body && <span className="text-gray-400 text-xs ml-1">({cert.issuing_body})</span>}
                </div>
                <span className="text-xs text-gray-500">
                  {cert.expires_at ? `Exp. ${formatDate(cert.expires_at)}` : cert.issued_at ? `Issued ${formatDate(cert.issued_at)}` : ''}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Section title="Education" editHref={isOwner ? '/app/education/new' : undefined}>
          <div className="flex flex-col gap-1">
            {education.map((edu: any) => (
              <div key={edu.id}>
                <p className="text-sm text-gray-900">{edu.institution}</p>
                <p className="text-xs text-gray-500">
                  {[edu.qualification, edu.started_at && edu.ended_at ? `${formatDate(edu.started_at)} — ${formatDate(edu.ended_at)}` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Skills">
          <p className="text-sm text-gray-700">{skills.map((s: any) => s.name).join(' · ')}</p>
        </Section>
      )}

      {/* Endorsements */}
      {endorsements.length > 0 && (
        <Section title="Endorsements">
          <div className="flex flex-col gap-3">
            {endorsements.slice(0, 3).map((end: any) => (
              <div key={end.id} className="border-l-2 border-gray-200 pl-3">
                <p className="text-sm text-gray-600 italic break-words">&ldquo;{end.content.slice(0, 200)}&rdquo;</p>
                <p className="text-xs text-gray-400 mt-0.5">— {end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="p-6 pt-2 flex gap-3">
        {isOwner ? (
          <>
            <Link href="/app/profile" className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]">
              Edit Profile
            </Link>
            <Link href="/api/cv/generate-pdf" className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium bg-[var(--color-interactive)] text-white hover:opacity-90">
              Download PDF
            </Link>
          </>
        ) : (
          <>
            <Link href={`/u/${user.handle}`} className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]">
              Back to profile
            </Link>
            {user.cv_public !== false && (user.latest_pdf_path || user.cv_storage_path) && (
              <a
                href={`/api/cv/public-download/${user.handle}`}
                target="_blank"
                rel="noopener"
                className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium bg-[var(--color-interactive)] text-white hover:opacity-90"
              >
                Download CV
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children, editHref }: { title: string; children: React.ReactNode; editHref?: string }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h2>
        {editHref && (
          <Link href={editHref} className="text-xs text-[var(--color-interactive)]">Edit</Link>
        )}
      </div>
      {children}
    </div>
  )
}

function MissingField({ label, href }: { label: string; href: string }) {
  return (
    <div className="px-6 py-3">
      <Link href={href} className="text-xs text-amber-600 hover:underline">[!] {label}</Link>
    </div>
  )
}
