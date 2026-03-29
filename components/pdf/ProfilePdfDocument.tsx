import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { formatDate } from '@/lib/format-date'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserProfile {
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
  contact_email?: string | null
  location_country?: string | null
  location_city?: string | null
  show_phone?: boolean
  show_whatsapp?: boolean
  show_email?: boolean
  show_location?: boolean
  dob?: string | null
  home_country?: string | null
  smoke_pref?: string | null
  appearance_note?: string | null
  travel_docs?: string[] | null
  license_info?: string | null
  languages?: Array<{ language: string; proficiency: string }> | null
  show_dob?: boolean
}

interface Attachment {
  id: string
  role_label?: string | null
  started_at?: string | null
  ended_at?: string | null
  employment_type?: string | null
  yacht_program?: string | null
  description?: string | null
  cruising_area?: string | null
  yachts: {
    name: string
    yacht_type?: string | null
    length_meters?: number | null
    flag_state?: string | null
    builder?: string | null
  } | null
}

interface Education {
  id: string
  institution: string
  qualification?: string | null
  field_of_study?: string | null
  started_at?: string | null
  ended_at?: string | null
}

interface Skill {
  id: string
  name: string
}

interface Hobby {
  id: string
  name: string
}

interface Certification {
  id: string
  custom_cert_name?: string | null
  issued_at?: string | null
  expires_at?: string | null
  issuing_body?: string | null
  certification_types: {
    name: string
    category?: string | null
  } | null
}

interface Endorsement {
  id: string
  content: string
  created_at: string
  endorser: {
    display_name?: string | null
    full_name: string
  } | null
  yacht: {
    name: string
  } | null
}

export type PdfTemplate = 'standard' | 'classic-navy' | 'modern-minimal'

interface ProfilePdfProps {
  user: UserProfile
  attachments: Attachment[]
  certifications: Certification[]
  endorsements: Endorsement[]
  education?: Education[]
  skills?: Skill[]
  hobbies?: Hobby[]
  qrDataUrl: string
  isPro: boolean
  template?: PdfTemplate
}

// ── Styles ─────────────────────────────────────────────────────────────────────

// Standard template styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a202c',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748b',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  role: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2,
  },
  url: {
    fontSize: 8,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#94a3b8',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  bio: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  contactRow: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 2,
  },
  employmentRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#243b53',
    marginTop: 3,
    marginRight: 8,
  },
  employmentContent: {
    flex: 1,
  },
  yachtName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  roleLabel: {
    fontSize: 10,
    color: '#475569',
  },
  dates: {
    fontSize: 8,
    color: '#94a3b8',
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  certName: {
    fontSize: 10,
  },
  certExpiry: {
    fontSize: 8,
    color: '#64748b',
  },
  endorsementBlock: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0',
  },
  endorsementText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 1.4,
  },
  endorsementAuthor: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 16,
  },
  qr: {
    width: 60,
    height: 60,
  },
  watermark: {
    fontSize: 8,
    color: '#cbd5e1',
  },
  moreEndorsements: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
  },
})

// ── Classic Navy template styles ───────────────────────────────────────────────

const navyStyles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#1a202c',
    backgroundColor: '#ffffff',
  },
  headerBand: {
    backgroundColor: '#1B3A5C',
    padding: 32,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 18,
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    objectFit: 'cover',
    borderWidth: 2,
    borderColor: '#C5A55A',
  },
  photoPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#243B5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInitial: {
    fontSize: 28,
    color: '#C5A55A',
    fontFamily: 'Times-Roman',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    color: '#ffffff',
    fontFamily: 'Times-Bold',
    marginBottom: 3,
  },
  role: {
    fontSize: 11,
    color: '#C5A55A',
    fontFamily: 'Times-Roman',
    marginBottom: 2,
  },
  url: {
    fontSize: 8,
    color: '#93B4D0',
    fontFamily: 'Times-Roman',
  },
  body: {
    padding: 32,
    paddingTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#C5A55A',
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#1B3A5C',
    marginBottom: 3,
  },
  bio: { fontSize: 10, lineHeight: 1.5, color: '#334155', fontFamily: 'Times-Roman' },
  contactRow: { fontSize: 9, color: '#475569', marginBottom: 2, fontFamily: 'Times-Roman' },
  employmentRow: { flexDirection: 'row', marginBottom: 6 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#C5A55A', marginTop: 3, marginRight: 8 },
  employmentContent: { flex: 1 },
  yachtName: { fontSize: 10, fontFamily: 'Times-Bold', color: '#1B3A5C' },
  roleLabel: { fontSize: 10, color: '#475569', fontFamily: 'Times-Roman' },
  dates: { fontSize: 8, color: '#94a3b8', fontFamily: 'Times-Roman' },
  certRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  certName: { fontSize: 10, fontFamily: 'Times-Roman' },
  certExpiry: { fontSize: 8, color: '#64748b', fontFamily: 'Times-Roman' },
  endorsementBlock: { marginBottom: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#C5A55A' },
  endorsementText: { fontSize: 9, fontStyle: 'italic', color: '#334155', lineHeight: 1.4, fontFamily: 'Times-Italic' },
  endorsementAuthor: { fontSize: 8, color: '#64748b', marginTop: 2, fontFamily: 'Times-Roman' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 16 },
  qr: { width: 56, height: 56 },
  watermark: { fontSize: 8, color: '#cbd5e1', fontFamily: 'Times-Roman' },
  moreEndorsements: { fontSize: 8, color: '#64748b', marginTop: 4, fontFamily: 'Times-Roman' },
})

// ── Modern Minimal template styles ─────────────────────────────────────────────

const minimalStyles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a202c',
    backgroundColor: '#ffffff',
  },
  heroBand: {
    height: 80,
    backgroundColor: '#0D9488',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroOverlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 4,
    objectFit: 'cover',
    marginBottom: -16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 4,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  photoInitial: { fontSize: 24, color: '#ffffff' },
  nameBlock: { marginBottom: -12 },
  name: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  role: { fontSize: 10, color: '#ccfbf1' },
  body: { padding: 36, paddingTop: 28 },
  url: { fontSize: 8, color: '#94a3b8', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#94a3b8',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  bio: { fontSize: 10, lineHeight: 1.6, color: '#334155' },
  contactRow: { fontSize: 9, color: '#475569', marginBottom: 2 },
  employmentRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0D9488', marginTop: 3, marginRight: 8 },
  employmentContent: { flex: 1 },
  yachtName: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  roleLabel: { fontSize: 10, color: '#475569' },
  dates: { fontSize: 8, color: '#94a3b8' },
  certRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  certName: { fontSize: 10 },
  certExpiry: { fontSize: 8, color: '#64748b' },
  endorsementBlock: { marginBottom: 10, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 4 },
  endorsementText: { fontSize: 9, fontStyle: 'italic', color: '#334155', lineHeight: 1.4 },
  endorsementAuthor: { fontSize: 8, color: '#64748b', marginTop: 3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 16 },
  qr: { width: 56, height: 56 },
  watermark: { fontSize: 8, color: '#cbd5e1' },
  moreEndorsements: { fontSize: 8, color: '#64748b', marginTop: 4 },
})

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}

function calculateAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000))
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function renderPersonalDetailsSection(user: UserProfile, s: Record<string, any>) {
  const details: string[] = []
  if (user.smoke_pref) details.push(humanize(user.smoke_pref))
  if (user.appearance_note && user.appearance_note !== 'not_specified') details.push(`Tattoos: ${humanize(user.appearance_note)}`)
  if (user.travel_docs?.length) details.push(`Visas: ${user.travel_docs.join(', ')}`)
  if (user.license_info) details.push(`License: ${user.license_info}`)
  if (user.languages?.length) details.push(`Languages: ${user.languages.map(l => `${l.language} (${l.proficiency})`).join(', ')}`)

  if (details.length === 0) return null
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Personal Details</Text>
      {details.map((d, i) => <Text key={i} style={s.contactRow}>{d}</Text>)}
    </View>
  )
}

function renderHeaderSubline(user: UserProfile): string {
  const parts: string[] = []
  if (user.home_country) parts.push(user.home_country)
  if (user.dob && user.show_dob !== false) parts.push(`${calculateAge(user.dob)} years old`)
  return parts.join(' · ')
}

function renderAttachmentDetails(att: Attachment, s: Record<string, any>) {
  const specs = [
    att.yachts?.length_meters ? `${att.yachts.length_meters}m` : null,
    att.yachts?.builder,
    att.yacht_program ? humanize(att.yacht_program) : null,
    att.yachts?.flag_state,
  ].filter(Boolean).join(' · ')

  return (
    <>
      {specs && <Text style={s.dates}>{specs}</Text>}
      {att.cruising_area && <Text style={s.dates}>{att.cruising_area}</Text>}
      {att.description && <Text style={{ ...s.dates, marginTop: 2 }}>{truncate(att.description, 500)}</Text>}
    </>
  )
}

function renderEducationSection(education: Education[] | undefined, s: Record<string, any>) {
  if (!education?.length) return null
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Education</Text>
      {education.map((edu) => (
        <View key={edu.id} style={{ marginBottom: 4 }}>
          <Text style={s.certName}>{edu.institution}</Text>
          <Text style={s.dates}>
            {[edu.qualification, edu.field_of_study, edu.started_at && edu.ended_at ? `${formatDate(edu.started_at)} — ${formatDate(edu.ended_at)}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ))}
    </View>
  )
}

function renderSkillsHobbiesSection(skills: Skill[] | undefined, hobbies: Hobby[] | undefined, s: Record<string, any>) {
  if (!skills?.length && !hobbies?.length) return null
  return (
    <View style={s.section}>
      {skills && skills.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Skills</Text>
          <Text style={s.contactRow}>{skills.map(sk => sk.name).join(' · ')}</Text>
        </>
      )}
      {hobbies && hobbies.length > 0 && (
        <>
          <Text style={{ ...s.sectionTitle, marginTop: skills?.length ? 8 : 0 }}>Hobbies</Text>
          <Text style={s.contactRow}>{hobbies.map(h => h.name).join(' · ')}</Text>
        </>
      )}
    </View>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProfilePdfDocument({
  user,
  attachments,
  certifications,
  endorsements,
  education,
  skills,
  hobbies,
  qrDataUrl,
  isPro,
  template = 'standard',
}: ProfilePdfProps) {
  const displayName = user.display_name ?? user.full_name

  if (template === 'classic-navy') {
    return <ClassicNavyPdf user={user} attachments={attachments} certifications={certifications} endorsements={endorsements} education={education} skills={skills} hobbies={hobbies} qrDataUrl={qrDataUrl} isPro={isPro} />
  }
  if (template === 'modern-minimal') {
    return <ModernMinimalPdf user={user} attachments={attachments} certifications={certifications} endorsements={endorsements} education={education} skills={skills} hobbies={hobbies} qrDataUrl={qrDataUrl} isPro={isPro} />
  }

  const hasVisibleContact =
    user.phone ||
    user.whatsapp ||
    (user.contact_email || user.email) ||
    (user.location_city || user.location_country)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {user.profile_photo_url ? (
            <Image src={user.profile_photo_url} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.name}>{displayName}</Text>
            {user.primary_role && (
              <Text style={styles.role}>
                {[user.primary_role, ...(user.departments ?? [])].filter(Boolean).join(' · ')}
              </Text>
            )}
            {(() => { const sub = renderHeaderSubline(user); return sub ? <Text style={styles.role}>{sub}</Text> : null })()}
            <Text style={styles.url}>yachtie.link/u/{user.handle}</Text>
          </View>
        </View>

        {/* About */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        )}

        {/* Contact */}
        {hasVisibleContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {(user.contact_email || user.email) && (
              <Text style={styles.contactRow}>{user.contact_email ?? user.email}</Text>
            )}
            {user.phone && (
              <Text style={styles.contactRow}>{user.phone}</Text>
            )}
            {user.whatsapp && (
              <Text style={styles.contactRow}>WhatsApp: {user.whatsapp}</Text>
            )}
            {(user.location_city || user.location_country) && (
              <Text style={styles.contactRow}>
                {[user.location_city, user.location_country].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        )}

        {/* Personal Details */}
        {renderPersonalDetailsSection(user, styles)}

        {/* Employment History */}
        {attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employment History</Text>
            {attachments.map((att) => (
              <View key={att.id} style={styles.employmentRow}>
                <View style={styles.bullet} />
                <View style={styles.employmentContent}>
                  <Text>
                    <Text style={styles.yachtName}>
                      {att.yachts?.yacht_type === 'Motor Yacht' ? 'MY ' : att.yachts?.yacht_type === 'Sailing Yacht' ? 'SY ' : ''}
                      {att.yachts?.name ?? 'Unknown'}
                    </Text>
                    {att.role_label && (
                      <Text style={styles.roleLabel}> — {att.role_label}</Text>
                    )}
                  </Text>
                  {(att.started_at || att.ended_at) && (
                    <Text style={styles.dates}>
                      {formatDate(att.started_at)}
                      {att.started_at && ' — '}
                      {att.ended_at ? formatDate(att.ended_at) : 'Present'}
                    </Text>
                  )}
                  {renderAttachmentDetails(att, styles)}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>
                    {cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'}
                  </Text>
                  {cert.issuing_body && <Text style={styles.certExpiry}>{cert.issuing_body}</Text>}
                </View>
                <Text style={styles.certExpiry}>
                  {cert.expires_at ? `Exp. ${formatDate(cert.expires_at)}` : cert.issued_at ? `Issued ${formatDate(cert.issued_at)}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {renderEducationSection(education, styles)}

        {/* Skills & Hobbies */}
        {renderSkillsHobbiesSection(skills, hobbies, styles)}

        {/* Endorsements (top 3) */}
        {endorsements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Endorsements</Text>
            {endorsements.map((end) => (
              <View key={end.id} style={styles.endorsementBlock}>
                <Text style={styles.endorsementText}>
                  &ldquo;{truncate(end.content, 200)}&rdquo;
                </Text>
                <Text style={styles.endorsementAuthor}>
                  — {end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                  {end.yacht?.name && `, ${end.yacht.name}`}
                </Text>
              </View>
            ))}
            {endorsements.length >= 3 && (
              <Text style={styles.moreEndorsements}>
                View all endorsements at yachtie.link/u/{user.handle}
              </Text>
            )}
          </View>
        )}

        {/* Footer: QR + watermark */}
        <View style={styles.footer}>
          <Image src={qrDataUrl} style={styles.qr} />
          {!isPro && (
            <Text style={styles.watermark}>Created with YachtieLink</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}

// ── Classic Navy PDF ───────────────────────────────────────────────────────────

function ClassicNavyPdf({ user, attachments, certifications, endorsements, education, skills, hobbies, qrDataUrl, isPro }: Omit<ProfilePdfProps, 'template'>) {
  const displayName = user.display_name ?? user.full_name
  const s = navyStyles
  const hasVisibleContact =
    user.phone ||
    user.whatsapp ||
    (user.contact_email || user.email) ||
    (user.location_city || user.location_country)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Navy header band */}
        <View style={s.headerBand}>
          {user.profile_photo_url ? (
            <Image src={user.profile_photo_url} style={s.photo} />
          ) : (
            <View style={s.photoPlaceholder}>
              <Text style={s.photoInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.headerText}>
            <Text style={s.name}>{displayName}</Text>
            {user.primary_role && (
              <Text style={s.role}>
                {[user.primary_role, ...(user.departments ?? [])].filter(Boolean).join(' · ')}
              </Text>
            )}
            {(() => { const sub = renderHeaderSubline(user); return sub ? <Text style={s.url}>{sub}</Text> : null })()}
            <Text style={s.url}>yachtie.link/u/{user.handle}</Text>
          </View>
        </View>

        <View style={s.body}>
          {user.bio && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <View style={s.divider} />
              <Text style={s.bio}>{user.bio}</Text>
            </View>
          )}

          {hasVisibleContact && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Contact</Text>
              <View style={s.divider} />
              {(user.contact_email || user.email) && <Text style={s.contactRow}>{user.contact_email ?? user.email}</Text>}
              {user.phone && <Text style={s.contactRow}>{user.phone}</Text>}
              {user.whatsapp && <Text style={s.contactRow}>WhatsApp: {user.whatsapp}</Text>}
              {(user.location_city || user.location_country) && (
                <Text style={s.contactRow}>{[user.location_city, user.location_country].filter(Boolean).join(', ')}</Text>
              )}
            </View>
          )}

          {renderPersonalDetailsSection(user, s)}

          {attachments.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Employment History</Text>
              <View style={s.divider} />
              {attachments.map((att) => (
                <View key={att.id} style={s.employmentRow}>
                  <View style={s.bullet} />
                  <View style={s.employmentContent}>
                    <Text>
                      <Text style={s.yachtName}>
                        {att.yachts?.yacht_type === 'Motor Yacht' ? 'MY ' : att.yachts?.yacht_type === 'Sailing Yacht' ? 'SY ' : ''}
                        {att.yachts?.name ?? 'Unknown'}
                      </Text>
                      {att.role_label && <Text style={s.roleLabel}> — {att.role_label}</Text>}
                    </Text>
                    {(att.started_at || att.ended_at) && (
                      <Text style={s.dates}>
                        {formatDate(att.started_at)}{att.started_at && ' — '}
                        {att.ended_at ? formatDate(att.ended_at) : 'Present'}
                      </Text>
                    )}
                    {renderAttachmentDetails(att, s)}
                  </View>
                </View>
              ))}
            </View>
          )}

          {certifications.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Certifications</Text>
              <View style={s.divider} />
              {certifications.map((cert) => (
                <View key={cert.id} style={s.certRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.certName}>{cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'}</Text>
                    {cert.issuing_body && <Text style={s.certExpiry}>{cert.issuing_body}</Text>}
                  </View>
                  <Text style={s.certExpiry}>{cert.expires_at ? `Exp. ${formatDate(cert.expires_at)}` : cert.issued_at ? `Issued ${formatDate(cert.issued_at)}` : ''}</Text>
                </View>
              ))}
            </View>
          )}

          {renderEducationSection(education, s)}
          {renderSkillsHobbiesSection(skills, hobbies, s)}

          {endorsements.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Endorsements</Text>
              <View style={s.divider} />
              {endorsements.map((end) => (
                <View key={end.id} style={s.endorsementBlock}>
                  <Text style={s.endorsementText}>&ldquo;{truncate(end.content, 200)}&rdquo;</Text>
                  <Text style={s.endorsementAuthor}>
                    — {end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                    {end.yacht?.name && `, ${end.yacht.name}`}
                  </Text>
                </View>
              ))}
              {endorsements.length >= 3 && (
                <Text style={s.moreEndorsements}>View all endorsements at yachtie.link/u/{user.handle}</Text>
              )}
            </View>
          )}

          <View style={s.footer}>
            <Image src={qrDataUrl} style={s.qr} />
            {!isPro && <Text style={s.watermark}>Created with YachtieLink</Text>}
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ── Modern Minimal PDF ─────────────────────────────────────────────────────────

function ModernMinimalPdf({ user, attachments, certifications, endorsements, education, skills, hobbies, qrDataUrl, isPro }: Omit<ProfilePdfProps, 'template'>) {
  const displayName = user.display_name ?? user.full_name
  const s = minimalStyles
  const hasVisibleContact =
    user.phone ||
    user.whatsapp ||
    (user.contact_email || user.email) ||
    (user.location_city || user.location_country)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Teal hero band */}
        <View style={s.heroBand}>
          <View style={s.heroOverlay}>
            {user.profile_photo_url ? (
              <Image src={user.profile_photo_url} style={s.photo} />
            ) : (
              <View style={s.photoPlaceholder}>
                <Text style={s.photoInitial}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={s.nameBlock}>
              <Text style={s.name}>{displayName}</Text>
              {user.primary_role && (
                <Text style={s.role}>
                  {[user.primary_role, ...(user.departments ?? [])].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.url}>yachtie.link/u/{user.handle}</Text>

          {user.bio && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <Text style={s.bio}>{user.bio}</Text>
            </View>
          )}

          {hasVisibleContact && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Contact</Text>
              {(user.contact_email || user.email) && <Text style={s.contactRow}>{user.contact_email ?? user.email}</Text>}
              {user.phone && <Text style={s.contactRow}>{user.phone}</Text>}
              {user.whatsapp && <Text style={s.contactRow}>WhatsApp: {user.whatsapp}</Text>}
              {(user.location_city || user.location_country) && (
                <Text style={s.contactRow}>{[user.location_city, user.location_country].filter(Boolean).join(', ')}</Text>
              )}
            </View>
          )}

          {renderPersonalDetailsSection(user, s)}

          {attachments.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Employment History</Text>
              {attachments.map((att) => (
                <View key={att.id} style={s.employmentRow}>
                  <View style={s.bullet} />
                  <View style={s.employmentContent}>
                    <Text>
                      <Text style={s.yachtName}>
                        {att.yachts?.yacht_type === 'Motor Yacht' ? 'MY ' : att.yachts?.yacht_type === 'Sailing Yacht' ? 'SY ' : ''}
                        {att.yachts?.name ?? 'Unknown'}
                      </Text>
                      {att.role_label && <Text style={s.roleLabel}> — {att.role_label}</Text>}
                    </Text>
                    {(att.started_at || att.ended_at) && (
                      <Text style={s.dates}>
                        {formatDate(att.started_at)}{att.started_at && ' — '}
                        {att.ended_at ? formatDate(att.ended_at) : 'Present'}
                      </Text>
                    )}
                    {renderAttachmentDetails(att, s)}
                  </View>
                </View>
              ))}
            </View>
          )}

          {certifications.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Certifications</Text>
              {certifications.map((cert) => (
                <View key={cert.id} style={s.certRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.certName}>{cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'}</Text>
                    {cert.issuing_body && <Text style={s.certExpiry}>{cert.issuing_body}</Text>}
                  </View>
                  <Text style={s.certExpiry}>{cert.expires_at ? `Exp. ${formatDate(cert.expires_at)}` : cert.issued_at ? `Issued ${formatDate(cert.issued_at)}` : ''}</Text>
                </View>
              ))}
            </View>
          )}

          {renderEducationSection(education, s)}
          {renderSkillsHobbiesSection(skills, hobbies, s)}

          {endorsements.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Endorsements</Text>
              {endorsements.map((end) => (
                <View key={end.id} style={s.endorsementBlock}>
                  <Text style={s.endorsementText}>&ldquo;{truncate(end.content, 200)}&rdquo;</Text>
                  <Text style={s.endorsementAuthor}>
                    — {end.endorser?.display_name ?? end.endorser?.full_name ?? 'Anonymous'}
                    {end.yacht?.name && `, ${end.yacht.name}`}
                  </Text>
                </View>
              ))}
              {endorsements.length >= 3 && (
                <Text style={s.moreEndorsements}>View all endorsements at yachtie.link/u/{user.handle}</Text>
              )}
            </View>
          )}

          <View style={s.footer}>
            <Image src={qrDataUrl} style={s.qr} />
            {!isPro && <Text style={s.watermark}>Created with YachtieLink</Text>}
          </View>
        </View>
      </Page>
    </Document>
  )
}
