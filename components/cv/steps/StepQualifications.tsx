'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, DatePicker } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { matchCertification, type CertMatchAlternative } from '@/lib/cv/cert-matching'
import { formatDateDisplay } from '@/lib/cv/types'
import type { ParsedCertification, ParsedEducation, ConfirmedCert, ConfirmedEducation } from '@/lib/cv/types'

interface StepQualificationsProps {
  certifications: ParsedCertification[]
  education: ParsedEducation[]
  parseLoading: boolean
  onConfirm: (certs: WizardCert[], education: ConfirmedEducation[]) => void
  initialCerts?: WizardCert[]
  initialEducation?: ConfirmedEducation[]
}

type MatchTier = 'green' | 'amber' | 'blue'

export interface WizardCert extends ConfirmedCert {
  source_name: string
  registry_id: string | null
  match_tier: MatchTier
  match_confidence: number
  canonical_name: string | null
  equivalence_note: string | null
  typical_validity_years: number | null
  crew_count: number | null
  alternatives: CertMatchAlternative[]
  match_locked: boolean
  match_source: string | null
}

const inputClass = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)]'
const labelClass = 'text-xs font-medium text-[var(--color-text-secondary)]'

function toWizardCert(cert: ConfirmedCert | ParsedCertification): WizardCert {
  const existing = cert as Partial<WizardCert>
  const sourceName = typeof existing.source_name === 'string' && existing.source_name.trim()
    ? existing.source_name.trim()
    : cert.name.trim()

  return {
    name: cert.name.trim(),
    category: cert.category ?? null,
    issued_date: cert.issued_date ?? null,
    expiry_date: cert.expiry_date ?? null,
    issuing_body: cert.issuing_body ?? null,
    source_name: sourceName,
    registry_id: existing.registry_id ?? null,
    match_tier: existing.match_tier ?? 'blue',
    match_confidence: existing.match_confidence ?? 0,
    canonical_name: existing.canonical_name ?? null,
    equivalence_note: existing.equivalence_note ?? null,
    typical_validity_years: existing.typical_validity_years ?? null,
    crew_count: existing.crew_count ?? null,
    alternatives: existing.alternatives ?? [],
    match_locked: existing.match_locked ?? false,
    match_source: existing.match_source ?? null,
  }
}

function resetCertMatch(cert: WizardCert, nextName: string): WizardCert {
  return {
    ...cert,
    name: nextName,
    source_name: nextName,
    registry_id: null,
    match_tier: 'blue',
    match_confidence: 0,
    canonical_name: null,
    equivalence_note: null,
    typical_validity_years: null,
    crew_count: null,
    alternatives: [],
    match_locked: false,
    match_source: null,
  }
}

function getMatchQuery(cert: WizardCert): string {
  return cert.source_name.trim() || cert.name.trim()
}

function shouldResolveMatch(cert: WizardCert): boolean {
  const query = getMatchQuery(cert)
  if (!query) return false
  if (cert.match_locked && cert.match_source === query) return false
  return cert.match_source !== query
}

function mergeMatchResult(cert: WizardCert, result: Awaited<ReturnType<typeof matchCertification>>): WizardCert {
  const query = getMatchQuery(cert)

  if (result.matchTier === 'green') {
    return {
      ...cert,
      name: result.canonicalName ?? cert.name,
      issuing_body: cert.issuing_body ?? result.issuingAuthority ?? null,
      registry_id: result.registryId,
      match_tier: 'green',
      match_confidence: result.confidence,
      canonical_name: result.canonicalName ?? null,
      equivalence_note: result.equivalenceNote ?? null,
      typical_validity_years: result.typicalValidityYears ?? null,
      crew_count: result.crewCount ?? null,
      alternatives: result.alternatives ?? [],
      match_locked: false,
      match_source: query,
    }
  }

  if (result.matchTier === 'amber') {
    return {
      ...cert,
      registry_id: null,
      match_tier: 'amber',
      match_confidence: result.confidence,
      canonical_name: result.canonicalName ?? null,
      equivalence_note: result.equivalenceNote ?? null,
      typical_validity_years: result.typicalValidityYears ?? null,
      crew_count: result.crewCount ?? null,
      alternatives: result.alternatives ?? [],
      match_locked: false,
      match_source: query,
    }
  }

  return {
    ...cert,
    registry_id: null,
    match_tier: 'blue',
    match_confidence: result.confidence,
    canonical_name: null,
    equivalence_note: null,
    typical_validity_years: null,
    crew_count: null,
    alternatives: [],
    match_locked: false,
    match_source: query,
  }
}

function isExpired(date: string | null): boolean {
  return Boolean(date && new Date(date) < new Date())
}

function formatValidityYears(years: number): string {
  return `${years} year${years === 1 ? '' : 's'}`
}

function getExpiryPrompt(cert: WizardCert): string | null {
  if (cert.expiry_date && isExpired(cert.expiry_date)) {
    return `This expired ${formatDateDisplay(cert.expiry_date)}. Have you renewed?`
  }

  if (!cert.expiry_date && cert.typical_validity_years) {
    const displayName = cert.canonical_name ?? cert.name
    return `${displayName} typically renews every ${formatValidityYears(cert.typical_validity_years)}. When does yours expire?`
  }

  return null
}

function certDetailCount(c: ConfirmedCert): { filled: number; total: number } {
  const fields = [c.issuing_body, c.issued_date, c.expiry_date]
  return { filled: fields.filter(Boolean).length, total: fields.length }
}

function eduDetailCount(e: ConfirmedEducation): { filled: number; total: number } {
  const fields = [e.qualification, e.field_of_study, e.start_date, e.end_date]
  return { filled: fields.filter(Boolean).length, total: fields.length }
}

function AddCertInline({ onAdd }: { onAdd: (cert: WizardCert) => void }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--color-amber-200)] text-sm font-medium text-[var(--color-amber-700)] hover:bg-[var(--color-amber-50)] transition-colors"
      >
        + Add certification
      </button>
    )
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(
      toWizardCert({
        name: trimmed,
        category: null,
        issued_date: null,
        expiry_date: null,
        issuing_body: null,
      }),
    )
    setName('')
    setAdding(false)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Certification name"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="flex-1 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
      />
      <button type="button" onClick={handleAdd} className="text-sm text-[var(--color-interactive)]">Add</button>
      <button type="button" onClick={() => { setAdding(false); setName('') }} className="text-sm text-[var(--color-text-tertiary)]">×</button>
    </div>
  )
}

function AddEduInline({ onAdd }: { onAdd: (edu: ConfirmedEducation) => void }) {
  const [adding, setAdding] = useState(false)
  const [institution, setInstitution] = useState('')

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--color-amber-200)] text-sm font-medium text-[var(--color-amber-700)] hover:bg-[var(--color-amber-50)] transition-colors"
      >
        + Add education
      </button>
    )
  }

  function handleAdd() {
    const trimmed = institution.trim()
    if (!trimmed) return
    onAdd({ institution: trimmed, qualification: null, field_of_study: null, start_date: null, end_date: null })
    setInstitution('')
    setAdding(false)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        placeholder="Institution name"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        className="flex-1 h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
      />
      <button type="button" onClick={handleAdd} className="text-sm text-[var(--color-interactive)]">Add</button>
      <button type="button" onClick={() => { setAdding(false); setInstitution('') }} className="text-sm text-[var(--color-text-tertiary)]">×</button>
    </div>
  )
}

export function StepQualifications({
  certifications,
  education,
  parseLoading,
  onConfirm,
  initialCerts,
  initialEducation,
}: StepQualificationsProps) {
  const supabaseRef = useRef(createClient())
  const matchRequestRef = useRef(0)

  const [certs, setCerts] = useState<WizardCert[]>(() =>
    initialCerts && initialCerts.length > 0
      ? initialCerts.map(toWizardCert)
      : certifications.map(toWizardCert),
  )

  const [edu, setEdu] = useState<ConfirmedEducation[]>(() =>
    initialEducation && initialEducation.length > 0
      ? initialEducation
      : education.map((entry) => ({
          institution: entry.institution,
          qualification: entry.qualification,
          field_of_study: entry.field_of_study,
          start_date: entry.start_date,
          end_date: entry.end_date,
        })),
  )

  const [editing, setEditing] = useState(false)
  const [matching, setMatching] = useState(false)

  const [expandedCert, setExpandedCert] = useState<number | null>(null)
  const [certDraft, setCertDraft] = useState<WizardCert | null>(null)

  const [expandedEdu, setExpandedEdu] = useState<number | null>(null)
  const [eduDraft, setEduDraft] = useState<ConfirmedEducation | null>(null)
  const hasUnresolvedAmber = certs.some((cert) => cert.match_tier === 'amber' && cert.alternatives.length > 0)
  const matchTrigger = certs
    .filter(shouldResolveMatch)
    .map((cert) => [getMatchQuery(cert), cert.match_tier, cert.match_locked ? '1' : '0', cert.match_source ?? ''].join('::'))
    .join('|')
  const [lastCerts, setLastCerts] = useState(certifications)
  const [lastEdu, setLastEdu] = useState(education)

  if (certifications !== lastCerts && certifications.length > 0 && certs.length === 0) {
    setLastCerts(certifications)
    setCerts(certifications.map(toWizardCert))
  }

  if (education !== lastEdu && education.length > 0 && edu.length === 0) {
    setLastEdu(education)
    setEdu(education.map((entry) => ({
      institution: entry.institution,
      qualification: entry.qualification,
      field_of_study: entry.field_of_study,
      start_date: entry.start_date,
      end_date: entry.end_date,
    })))
  }

  useEffect(() => {
    if (parseLoading || editing || certs.length === 0) return

    if (!matchTrigger) return

    const currentCerts = certs.map(toWizardCert)

    const requestId = ++matchRequestRef.current

    void Promise.resolve().then(async () => {
      if (matchRequestRef.current !== requestId) return
      setMatching(true)

      const resolved = await Promise.all(
        currentCerts.map(async (cert) => {
          if (!shouldResolveMatch(cert)) return cert
          const result = await matchCertification(getMatchQuery(cert), supabaseRef.current)
          return mergeMatchResult(cert, result)
        }),
      )

      if (matchRequestRef.current !== requestId) return
      setCerts(resolved)
      setMatching(false)
    })
  }, [certs, editing, matchTrigger, parseLoading])

  function removeCert(i: number) {
    if (expandedCert === i) {
      setExpandedCert(null)
      setCertDraft(null)
    } else if (expandedCert !== null && expandedCert > i) {
      setExpandedCert(expandedCert - 1)
    }
    setCerts(certs.filter((_, j) => j !== i))
  }

  function removeEdu(i: number) {
    if (expandedEdu === i) {
      setExpandedEdu(null)
      setEduDraft(null)
    } else if (expandedEdu !== null && expandedEdu > i) {
      setExpandedEdu(expandedEdu - 1)
    }
    setEdu(edu.filter((_, j) => j !== i))
  }

  function toggleCert(i: number) {
    if (expandedCert === i) {
      if (certDraft) {
        setCerts(certs.map((cert, index) => (index === i ? certDraft : cert)))
      }
      setExpandedCert(null)
      setCertDraft(null)
      return
    }

    if (expandedCert !== null && certDraft) {
      setCerts(certs.map((cert, index) => (index === expandedCert ? certDraft : cert)))
    }

    setExpandedCert(i)
    setCertDraft({ ...certs[i] })
  }

  function toggleEdu(i: number) {
    if (expandedEdu === i) {
      if (eduDraft) setEdu(edu.map((entry, index) => (index === i ? eduDraft : entry)))
      setExpandedEdu(null)
      setEduDraft(null)
      return
    }

    if (expandedEdu !== null && eduDraft) {
      setEdu(edu.map((entry, index) => (index === expandedEdu ? eduDraft : entry)))
    }

    setExpandedEdu(i)
    setEduDraft({ ...edu[i] })
  }

  function handleEditDone() {
    if (expandedCert !== null && certDraft) {
      setCerts((previous) => previous.map((cert, index) => (index === expandedCert ? certDraft : cert)))
      setExpandedCert(null)
      setCertDraft(null)
    }
    if (expandedEdu !== null && eduDraft) {
      setEdu((previous) => previous.map((entry, index) => (index === expandedEdu ? eduDraft : entry)))
      setExpandedEdu(null)
      setEduDraft(null)
    }
    setEditing(false)
  }

  function confirmAmberMatch(index: number, alternative: CertMatchAlternative) {
    setCerts((previous) =>
      previous.map((cert, certIndex) => {
        if (certIndex !== index) return cert
        return {
          ...cert,
          name: alternative.name,
          issuing_body: cert.issuing_body ?? alternative.issuingAuthority,
          registry_id: alternative.id,
          match_tier: 'green',
          match_confidence: alternative.confidence,
          canonical_name: alternative.name,
          equivalence_note: alternative.equivalenceNote ?? null,
          typical_validity_years: alternative.typicalValidityYears ?? cert.typical_validity_years,
          crew_count: alternative.crewCount,
          alternatives: [],
          match_locked: true,
          match_source: getMatchQuery(cert),
        }
      }),
    )
  }

  function keepCertAsEntered(index: number) {
    setCerts((previous) =>
      previous.map((cert, certIndex) => {
        if (certIndex !== index) return cert
        return {
          ...cert,
          name: cert.source_name,
          registry_id: null,
          match_tier: 'blue',
          match_confidence: 0,
          canonical_name: null,
          equivalence_note: null,
          typical_validity_years: null,
          crew_count: null,
          alternatives: [],
          match_locked: true,
          match_source: getMatchQuery(cert),
        }
      }),
    )
  }

  function updateCert(index: number, updates: Partial<WizardCert>) {
    setCerts((previous) =>
      previous.map((cert, certIndex) => (certIndex === index ? { ...cert, ...updates } : cert)),
    )
  }

  if (parseLoading) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Your Qualifications</h2>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Hang tight — we&apos;re reading your qualifications.</p>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl shadow-sm flex flex-col">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Edit qualifications</h2>
          <button type="button" onClick={() => setEditing(false)} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Cancel</button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Certificates {certs.length > 0 && `(${certs.length})`}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Professional licences and training — STCW, ENG1, Yachtmaster, food safety, etc.
            </p>
            {certs.length > 0 && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Matching is automatic when you&apos;re done editing, so aliases and abbreviations still resolve cleanly.
              </p>
            )}
            {certs.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No certifications found on your CV. Most captains look for STCW at minimum — add yours below.
              </p>
            )}

            {certs.map((cert, i) => {
              const isExpanded = expandedCert === i
              const details = certDetailCount(cert)
              const hasGaps = details.filled < details.total
              const expired = isExpired(cert.expiry_date)

              return (
                <div key={`${cert.source_name}-${i}`} className={`rounded-xl border ${isExpanded ? 'border-[var(--color-amber-200)] bg-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]'} transition-colors`}>
                  <div
                    className="p-3 flex items-start justify-between cursor-pointer"
                    onClick={() => toggleCert(i)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cert.match_tier === 'green' && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700">Matched</span>
                        )}
                        {cert.match_tier === 'amber' && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--color-amber-50)] text-[var(--color-amber-700)]">Review</span>
                        )}
                        {cert.match_tier === 'blue' && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]">Manual</span>
                        )}
                        {expired && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-50 text-red-600">Expired</span>
                        )}
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{cert.name}</p>
                      </div>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        {[
                          cert.source_name !== cert.name ? `Parsed as ${cert.source_name}` : null,
                          cert.issuing_body,
                          cert.expiry_date ? `${expired ? 'Expired' : 'Valid until'} ${formatDateDisplay(cert.expiry_date)}` : null,
                        ].filter(Boolean).join(' · ') || (hasGaps ? 'Tap to add details' : '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {hasGaps && !isExpanded && (
                        <span className="text-xs text-[var(--color-amber-600)]">{details.filled}/{details.total}</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeCert(i) }}
                        className="h-10 w-10 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors rounded-lg hover:bg-[var(--color-surface-raised)]"
                        aria-label="Remove"
                      >×</button>
                    </div>
                  </div>

                  {isExpanded && certDraft && (
                    <div className="px-3 pb-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Name</label>
                        <input
                          className={inputClass}
                          value={certDraft.name}
                          onChange={(e) => setCertDraft(resetCertMatch(certDraft, e.target.value))}
                          placeholder="Certification name"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Issuing Body</label>
                        <input
                          className={inputClass}
                          value={certDraft.issuing_body ?? ''}
                          onChange={(e) => setCertDraft({ ...certDraft, issuing_body: e.target.value || null })}
                          placeholder="e.g. MCA, RYA, STCW"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <DatePicker
                          label="Issued"
                          value={certDraft.issued_date ?? null}
                          onChange={(v) => setCertDraft({ ...certDraft, issued_date: v })}
                          includeDay
                          optionalMonth
                          minYear={1970}
                          maxYear={new Date().getFullYear()}
                        />
                        <DatePicker
                          label="Expires"
                          value={certDraft.expiry_date ?? null}
                          onChange={(v) => setCertDraft({ ...certDraft, expiry_date: v })}
                          includeDay
                          optionalMonth
                          minYear={2000}
                          maxYear={new Date().getFullYear() + 15}
                          alignRight
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <AddCertInline onAdd={(cert) => setCerts([...certs, cert])} />
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Education {edu.length > 0 && `(${edu.length})`}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Degrees and diplomas — university, maritime academy, hospitality school, etc.
            </p>
            {edu.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)]">
                No education found on your CV — you can add degrees or diplomas anytime from your profile.
              </p>
            )}

            {edu.map((entry, i) => {
              const isExpanded = expandedEdu === i
              const details = eduDetailCount(entry)
              const hasGaps = details.filled < details.total

              return (
                <div key={`${entry.institution}-${i}`} className={`rounded-xl border ${isExpanded ? 'border-[var(--color-amber-200)] bg-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]'} transition-colors`}>
                  <div
                    className="p-3 flex items-start justify-between cursor-pointer"
                    onClick={() => toggleEdu(i)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{entry.institution}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        {[
                          entry.qualification,
                          entry.field_of_study,
                          entry.start_date && entry.end_date ? `${formatDateDisplay(entry.start_date)} — ${formatDateDisplay(entry.end_date)}` : entry.end_date ? formatDateDisplay(entry.end_date) : null,
                        ].filter(Boolean).join(' · ') || (hasGaps ? 'Tap to add details' : '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {hasGaps && !isExpanded && (
                        <span className="text-xs text-[var(--color-amber-600)]">{details.filled}/{details.total}</span>
                      )}
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); removeEdu(i) }}
                        className="h-10 w-10 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors rounded-lg hover:bg-[var(--color-surface-raised)]"
                        aria-label="Remove"
                      >×</button>
                    </div>
                  </div>

                  {isExpanded && eduDraft && (
                    <div className="px-3 pb-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Institution</label>
                        <input
                          className={inputClass}
                          value={eduDraft.institution}
                          onChange={(event) => setEduDraft({ ...eduDraft, institution: event.target.value })}
                          placeholder="University or school name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Qualification</label>
                          <input
                            className={inputClass}
                            value={eduDraft.qualification ?? ''}
                            onChange={(event) => setEduDraft({ ...eduDraft, qualification: event.target.value || null })}
                            placeholder="e.g. BSc, Diploma"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Field of Study</label>
                          <input
                            className={inputClass}
                            value={eduDraft.field_of_study ?? ''}
                            onChange={(event) => setEduDraft({ ...eduDraft, field_of_study: event.target.value || null })}
                            placeholder="e.g. Marine Engineering"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <DatePicker
                          label="Start"
                          value={eduDraft.start_date ?? null}
                          onChange={(v) => setEduDraft({ ...eduDraft, start_date: v })}
                          includeDay
                          optionalMonth
                          minYear={1970}
                          maxYear={new Date().getFullYear()}
                        />
                        <DatePicker
                          label="End"
                          value={eduDraft.end_date ?? null}
                          onChange={(v) => setEduDraft({ ...eduDraft, end_date: v })}
                          includeDay
                          optionalMonth
                          minYear={1970}
                          maxYear={new Date().getFullYear() + 5}
                          alignRight
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            <AddEduInline onAdd={(entry) => setEdu([...edu, entry])} />
          </div>
        </div>

        <div className="sticky bottom-0 p-5 pt-3 bg-white/90 border-t border-[var(--color-amber-100)] rounded-b-2xl">
          <Button onClick={handleEditDone} className="w-full">Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Your Qualifications</h2>
          {matching && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Checking the certification registry for the best matches.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-2xl bg-[var(--color-amber-50)]/50 border border-[var(--color-amber-100)] px-3 pt-2.5 pb-3 flex flex-col items-center">
          <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Certificates</p>
          <div className="flex-1 flex items-center">
            <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{certs.length}</p>
          </div>
        </div>
        <div className="flex-1 rounded-2xl bg-[var(--color-amber-50)]/50 border border-[var(--color-amber-100)] px-3 pt-2.5 pb-3 flex flex-col items-center">
          <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">Education</p>
          <div className="flex-1 flex items-center">
            <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{edu.length}</p>
          </div>
        </div>
      </div>

      {certs.length > 0 ? (
        <div className="flex flex-col gap-2">
          {certs.map((cert, i) => {
            const prompt = getExpiryPrompt(cert)
            const expired = isExpired(cert.expiry_date)
            const secondaryMeta = [
              cert.issuing_body,
              cert.expiry_date ? `${expired ? 'Expired' : 'Valid until'} ${formatDateDisplay(cert.expiry_date)}` : null,
              cert.crew_count ? `${cert.crew_count} crew` : null,
            ].filter(Boolean).join(' · ')

            if (cert.match_tier === 'amber' && cert.alternatives.length > 0) {
              return (
                <div key={`${cert.source_name}-${i}`} className="rounded-2xl border border-[var(--color-amber-200)] bg-[var(--color-amber-50)]/35 p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg text-[var(--color-amber-700)]">⟡</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        &ldquo;{cert.source_name}&rdquo; — did you mean?
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Pick the closest canonical certificate so we can keep the name, authority, and renewal guidance consistent.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {cert.alternatives.map((alternative) => (
                      <button
                        key={alternative.id}
                        type="button"
                        onClick={() => confirmAmberMatch(i, alternative)}
                        className="w-full rounded-xl border border-[var(--color-amber-200)] bg-white px-3 py-3 text-left hover:border-[var(--color-amber-500)] hover:bg-[var(--color-amber-50)] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-[var(--color-amber-700)] mt-0.5">→</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{alternative.name}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                              {[alternative.issuingAuthority, alternative.crewCount ? `${alternative.crewCount} crew` : null].filter(Boolean).join(' · ')}
                            </p>
                            {alternative.equivalenceNote && (
                              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                ↳ {alternative.equivalenceNote}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => keepCertAsEntered(i)}
                    className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-left"
                  >
                    None of these — keep as is
                  </button>
                </div>
              )
            }

            if (cert.match_tier === 'green') {
              return (
                <div key={`${cert.source_name}-${i}`} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg text-emerald-700">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{cert.name}</p>
                        {cert.issuing_body && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white text-[var(--color-text-secondary)] border border-emerald-200">
                            {cert.issuing_body}
                          </span>
                        )}
                      </div>
                      {secondaryMeta && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{secondaryMeta}</p>
                      )}
                      {cert.source_name !== cert.name && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          Parsed as &ldquo;{cert.source_name}&rdquo;
                        </p>
                      )}
                      {cert.equivalence_note && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{cert.equivalence_note}</p>
                      )}
                      {prompt && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-2">{prompt}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={`${cert.source_name}-${i}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg text-[var(--color-text-secondary)]">?</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{cert.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      We couldn&apos;t match this cleanly, so keep the details you know and we&apos;ll save it as entered.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Issuing Authority</label>
                    <input
                      className={inputClass}
                      value={cert.issuing_body ?? ''}
                      onChange={(event) => updateCert(i, { issuing_body: event.target.value || null })}
                      placeholder="e.g. MCA, RYA, PYA"
                    />
                  </div>
                  <DatePicker
                    label="Expires"
                    value={cert.expiry_date ?? null}
                    onChange={(value) => updateCert(i, { expiry_date: value })}
                    includeDay
                    optionalMonth
                    minYear={2000}
                    maxYear={new Date().getFullYear() + 15}
                  />
                  {prompt && (
                    <p className="text-xs text-[var(--color-text-secondary)]">{prompt}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No certifications found — tap &ldquo;Edit&rdquo; to add yours.
        </p>
      )}

      {edu.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3 mt-1">
          {edu.map((entry, i) => {
            const subtitle = [
              entry.qualification,
              entry.field_of_study,
              entry.end_date ? formatDateDisplay(entry.end_date) : null,
            ].filter(Boolean).join(' · ')

            return (
              <div key={`${entry.institution}-${i}`} className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text-primary)] leading-snug">{entry.institution}</p>
                {subtitle && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{subtitle}</p>}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <Button
          onClick={() => onConfirm(certs, edu)}
          className="w-full"
          disabled={matching || hasUnresolvedAmber}
        >
          {matching ? 'Checking certifications…' : hasUnresolvedAmber ? 'Choose the closest match first' : 'Looks good'}
        </Button>
        <button
          type="button"
          onClick={() => {
            matchRequestRef.current += 1
            setMatching(false)
            setEditing(true)
          }}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
        >
          Edit qualifications
        </button>
      </div>
    </div>
  )
}
