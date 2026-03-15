import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

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
  location_country?: string | null
  location_city?: string | null
  phone_visible?: boolean
  whatsapp_visible?: boolean
  email_visible?: boolean
  location_visible?: boolean
}

interface Attachment {
  id: string
  role_label?: string | null
  started_at?: string | null
  ended_at?: string | null
  yachts: {
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
  endorser: {
    display_name?: string | null
    full_name: string
  } | null
  yacht: {
    name: string
  } | null
}

interface ProfilePdfProps {
  user: UserProfile
  attachments: Attachment[]
  certifications: Certification[]
  endorsements: Endorsement[]
  qrDataUrl: string
  isPro: boolean
}

// ── Styles ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProfilePdfDocument({
  user,
  attachments,
  certifications,
  endorsements,
  qrDataUrl,
  isPro,
}: ProfilePdfProps) {
  const displayName = user.display_name ?? user.full_name

  const hasVisibleContact =
    (user.phone_visible && user.phone) ||
    (user.whatsapp_visible && user.whatsapp) ||
    (user.email_visible && user.email) ||
    (user.location_visible && (user.location_city || user.location_country))

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
            {user.email_visible && user.email && (
              <Text style={styles.contactRow}>{user.email}</Text>
            )}
            {user.phone_visible && user.phone && (
              <Text style={styles.contactRow}>{user.phone}</Text>
            )}
            {user.whatsapp_visible && user.whatsapp && (
              <Text style={styles.contactRow}>WhatsApp: {user.whatsapp}</Text>
            )}
            {user.location_visible && (user.location_city || user.location_country) && (
              <Text style={styles.contactRow}>
                {[user.location_city, user.location_country].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        )}

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
                <Text style={styles.certName}>
                  {cert.certification_types?.name ?? cert.custom_cert_name ?? 'Certificate'}
                </Text>
                {cert.expires_at && (
                  <Text style={styles.certExpiry}>
                    Exp. {formatDate(cert.expires_at)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

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
