/**
 * Server-side helpers that compute the one-line summary text shown in each
 * collapsed ProfileAccordion section.
 */

// ── Sea time ─────────────────────────────────────────────────────────────────

export function formatSeaTime(totalDays: number): string {
  if (totalDays <= 0) return '0 months'
  const years = Math.floor(totalDays / 365)
  const months = Math.floor((totalDays % 365) / 30)
  if (years === 0) return `${months}m`
  if (months === 0) return `${years}y`
  return `${years}y ${months}m`
}

type Attachment = {
  started_at: string
  ended_at: string | null
  yacht_id?: string
}

export function computeSeaTime(attachments: Attachment[]): { totalDays: number; yachtCount: number } {
  const yachtIds = new Set<string>()
  let totalDays = 0
  for (const a of attachments) {
    const start = new Date(a.started_at)
    const end = a.ended_at ? new Date(a.ended_at) : new Date()
    const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000))
    totalDays += days
    if (a.yacht_id) yachtIds.add(a.yacht_id)
  }
  return { totalDays, yachtCount: yachtIds.size }
}

// ── Cert expiry ───────────────────────────────────────────────────────────────

type Cert = { expires_at: string | null }

export function countExpiringCerts(certs: Cert[]): number {
  const soon = Date.now() + 90 * 24 * 60 * 60 * 1000
  return certs.filter((c) => c.expires_at && new Date(c.expires_at).getTime() <= soon).length
}

// ── Summary line text per section ─────────────────────────────────────────────

export function experienceSummary(attachments: Attachment[]): string {
  const { totalDays, yachtCount } = computeSeaTime(attachments)
  const time = formatSeaTime(totalDays)
  if (yachtCount === 0) return 'No experience added yet'
  return `${time} sea time · ${yachtCount} ${yachtCount === 1 ? 'yacht' : 'yachts'}`
}

export function endorsementsSummary(count: number, mutualCount: number): string {
  if (count === 0) return 'No endorsements yet'
  const mutual = mutualCount > 0 ? ` · ${mutualCount} from people you know` : ''
  return `${count} ${count === 1 ? 'endorsement' : 'endorsements'}${mutual}`
}

export function certificationsSummary(count: number, expiringCount: number): string {
  if (count === 0) return 'No certifications added'
  const expiring = expiringCount > 0 ? ` · ${expiringCount} expiring soon` : ''
  return `${count} ${count === 1 ? 'cert' : 'certs'}${expiring}`
}

export function aboutSummary(aiSummary: string | null | undefined, bio: string | null | undefined): string {
  const text = aiSummary || bio || ''
  if (!text) return 'No bio added yet'
  return text.length > 80 ? text.slice(0, 80) + '…' : text
}

type Education = { qualification?: string | null; institution: string; ended_at?: string | null }

export function educationSummary(education: Education[]): string {
  if (education.length === 0) return 'No education added'
  const sorted = [...education].sort((a, b) => {
    if (!a.ended_at) return -1
    if (!b.ended_at) return 1
    return new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()
  })
  const top = sorted[0]
  const label = top.qualification || top.institution
  return label.length > 60 ? label.slice(0, 60) + '…' : label
}

type Hobby = { name: string; emoji?: string | null }

export function hobbiesSummary(hobbies: Hobby[]): string {
  if (hobbies.length === 0) return 'No hobbies added'
  return hobbies
    .slice(0, 4)
    .map((h) => (h.emoji ? `${h.emoji} ${h.name}` : h.name))
    .join(' · ')
}

type Skill = { name: string }

export function skillsSummary(skills: Skill[]): string {
  if (skills.length === 0) return 'No skills added'
  return skills.slice(0, 4).map((s) => s.name).join(' · ')
}

export function gallerySummary(count: number): string {
  if (count === 0) return 'No photos yet'
  return `${count} ${count === 1 ? 'photo' : 'photos'}`
}

// ── Profile Strength ──────────────────────────────────────────────────────────

type StrengthInput = {
  hasPhoto: boolean
  hasRole: boolean
  hasBio: boolean
  hasYacht: boolean
  hasCert: boolean
  hasEndorsement: boolean
  hasHobby: boolean
  hasEducation: boolean
  hasSocialLink: boolean
}

export function computeProfileStrength(input: StrengthInput): { score: number; label: string; nextPrompt: string } {
  const weights: Array<[keyof StrengthInput, number, string]> = [
    ['hasPhoto',      20, 'Add a photo to make it yours'],
    ['hasRole',       15, 'Set your primary role'],
    ['hasBio',        15, 'Write your bio'],
    ['hasYacht',      15, 'Add your first yacht'],
    ['hasCert',       10, 'Add a certification'],
    ['hasEndorsement', 10, 'Request your first endorsement'],
    ['hasHobby',       5, 'Add hobbies to show your personality'],
    ['hasEducation',   5, 'Add your education'],
    ['hasSocialLink',  5, 'Add a social link'],
  ]

  let score = 0
  let nextPrompt = ''
  for (const [key, weight, prompt] of weights) {
    if (input[key]) {
      score += weight
    } else if (!nextPrompt) {
      nextPrompt = prompt
    }
  }

  let label: string
  if (score <= 30) label = 'Getting started'
  else if (score <= 60) label = 'Looking good'
  else if (score <= 85) label = 'Standing out'
  else label = 'All squared away'

  return { score, label, nextPrompt }
}
