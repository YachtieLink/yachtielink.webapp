/**
 * Server-side helpers that compute the one-line summary text shown in each
 * collapsed ProfileAccordion section.
 */

import { calculateSeaTimeDays, formatSeaTime, type DateRange } from './sea-time'

// ── Sea time ─────────────────────────────────────────────────────────────────


type Attachment = {
  started_at: string | null
  ended_at: string | null
  yacht_id?: string
  yachts?: { id: string } | { id: string }[] | null
}

function resolveYachtId(a: Attachment): string | undefined {
  if (a.yacht_id) return a.yacht_id
  if (!a.yachts) return undefined
  // Supabase FK joins may be typed as array; runtime is single object
  const y = Array.isArray(a.yachts) ? a.yachts[0] : a.yachts
  return y?.id
}

export function computeSeaTime(attachments: Attachment[]): { totalDays: number; yachtCount: number } {
  const yachtIds = new Set<string>()
  const ranges: DateRange[] = []
  for (const a of attachments) {
    if (!a.started_at) continue
    const start = new Date(a.started_at)
    const end = a.ended_at ? new Date(a.ended_at) : new Date()
    ranges.push({ start, end })
    const yachtId = resolveYachtId(a)
    if (yachtId) yachtIds.add(yachtId)
  }
  return { totalDays: calculateSeaTimeDays(ranges), yachtCount: yachtIds.size }
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
  const time = formatSeaTime(totalDays).displayShort
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
  const top = education[0]
  const label = top.institution || top.qualification || 'Education'
  const extra = education.length > 1 ? ` + ${education.length - 1} more` : ''
  const full = label + extra
  return full.length > 60 ? full.slice(0, 60) + '…' : full
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
