'use client'

import { useState } from 'react'
import { Button, DatePicker } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateDisplay } from '@/lib/cv/types'
import type { ParsedCertification, ParsedEducation, ConfirmedCert, ConfirmedEducation } from '@/lib/cv/types'

interface StepQualificationsProps {
  certifications: ParsedCertification[]
  education: ParsedEducation[]
  parseLoading: boolean
  onConfirm: (certs: ConfirmedCert[], education: ConfirmedEducation[]) => void
  initialCerts?: ConfirmedCert[]
  initialEducation?: ConfirmedEducation[]
}

const inputClass = "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)]"
const labelClass = "text-xs font-medium text-[var(--color-text-secondary)]"

/** Count how many optional detail fields are filled on a cert */
function certDetailCount(c: ConfirmedCert): { filled: number; total: number } {
  const fields = [c.issuing_body, c.issued_date, c.expiry_date]
  return { filled: fields.filter(Boolean).length, total: fields.length }
}

/** Count how many optional detail fields are filled on an education entry */
function eduDetailCount(e: ConfirmedEducation): { filled: number; total: number } {
  const fields = [e.qualification, e.field_of_study, e.start_date, e.end_date]
  return { filled: fields.filter(Boolean).length, total: fields.length }
}

function AddCertInline({ onAdd }: { onAdd: (cert: ConfirmedCert) => void }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-xs text-[var(--color-interactive)] self-start"
      >
        + Add certification
      </button>
    )
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd({ name: trimmed, category: null, issued_date: null, expiry_date: null, issuing_body: null })
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
        className="text-xs text-[var(--color-interactive)] self-start"
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

export function StepQualifications({ certifications, education, parseLoading, onConfirm, initialCerts, initialEducation }: StepQualificationsProps) {
  const [certs, setCerts] = useState<ConfirmedCert[]>(() =>
    initialCerts && initialCerts.length > 0
      ? initialCerts
      : certifications.map(c => ({
          name: c.name,
          category: c.category,
          issued_date: c.issued_date,
          expiry_date: c.expiry_date,
          issuing_body: c.issuing_body,
        }))
  )

  const [edu, setEdu] = useState<ConfirmedEducation[]>(() =>
    initialEducation && initialEducation.length > 0
      ? initialEducation
      : education.map(e => ({
          institution: e.institution,
          qualification: e.qualification,
          field_of_study: e.field_of_study,
          start_date: e.start_date,
          end_date: e.end_date,
        }))
  )

  // Re-sync when parse arrives
  const [lastCerts, setLastCerts] = useState(certifications)
  if (certifications !== lastCerts && certifications.length > 0 && certs.length === 0) {
    setLastCerts(certifications)
    setCerts(certifications.map(c => ({ name: c.name, category: c.category, issued_date: c.issued_date, expiry_date: c.expiry_date, issuing_body: c.issuing_body })))
  }
  const [lastEdu, setLastEdu] = useState(education)
  if (education !== lastEdu && education.length > 0 && edu.length === 0) {
    setLastEdu(education)
    setEdu(education.map(e => ({ institution: e.institution, qualification: e.qualification, field_of_study: e.field_of_study, start_date: e.start_date, end_date: e.end_date })))
  }

  // Expand/edit state — expanded index shows inline detail fields
  const [expandedCert, setExpandedCert] = useState<number | null>(null)
  const [certDraft, setCertDraft] = useState<ConfirmedCert | null>(null)

  const [expandedEdu, setExpandedEdu] = useState<number | null>(null)
  const [eduDraft, setEduDraft] = useState<ConfirmedEducation | null>(null)

  function removeCert(i: number) {
    if (expandedCert === i) { setExpandedCert(null); setCertDraft(null) }
    else if (expandedCert !== null && expandedCert > i) { setExpandedCert(expandedCert - 1) }
    setCerts(certs.filter((_, j) => j !== i))
  }
  function removeEdu(i: number) {
    if (expandedEdu === i) { setExpandedEdu(null); setEduDraft(null) }
    else if (expandedEdu !== null && expandedEdu > i) { setExpandedEdu(expandedEdu - 1) }
    setEdu(edu.filter((_, j) => j !== i))
  }

  function toggleCert(i: number) {
    if (expandedCert === i) {
      // Collapsing — save draft back
      if (certDraft) setCerts(certs.map((c, j) => j === i ? certDraft : c))
      setExpandedCert(null)
      setCertDraft(null)
    } else {
      // Expanding — save previous draft if any
      if (expandedCert !== null && certDraft) {
        setCerts(certs.map((c, j) => j === expandedCert ? certDraft : c))
      }
      setExpandedCert(i)
      setCertDraft({ ...certs[i] })
    }
  }

  function toggleEdu(i: number) {
    if (expandedEdu === i) {
      if (eduDraft) setEdu(edu.map((e, j) => j === i ? eduDraft : e))
      setExpandedEdu(null)
      setEduDraft(null)
    } else {
      if (expandedEdu !== null && eduDraft) {
        setEdu(edu.map((e, j) => j === expandedEdu ? eduDraft : e))
      }
      setExpandedEdu(i)
      setEduDraft({ ...edu[i] })
    }
  }

  if (parseLoading) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Qualifications</h2>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Reading your qualifications...</p>
      </div>
    )
  }

  return (
    <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-5 shadow-sm">
      <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">Qualifications</h2>

      {/* Stat boxes */}
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

      {/* Certifications */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Certificates {certs.length > 0 && `(${certs.length})`}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Professional licences and training — STCW, ENG1, Yachtmaster, food safety, etc.
        </p>
        {certs.length > 0 ? (
          <>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Adding expiry dates and issuing bodies helps you stand out.
            </p>
            {certs.map((cert, i) => {
              const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()
              const isExpanded = expandedCert === i
              const details = certDetailCount(cert)
              const hasGaps = details.filled < details.total

              return (
                <div key={i} className={`rounded-xl border ${isExpanded ? 'border-[var(--color-amber-200)] bg-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]'} transition-colors`}>
                  {/* Collapsed row */}
                  <div
                    className="p-3 flex items-start justify-between cursor-pointer"
                    onClick={() => toggleCert(i)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isExpired && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-50 text-red-600">Expired</span>
                        )}
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{cert.name}</p>
                      </div>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        {[
                          cert.expiry_date && !isExpired ? `Valid until ${formatDateDisplay(cert.expiry_date)}` : cert.expiry_date && isExpired ? `Expired ${formatDateDisplay(cert.expiry_date)}` : null,
                          cert.issued_date && !cert.expiry_date ? `Issued ${formatDateDisplay(cert.issued_date)}` : null,
                          cert.issuing_body,
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
                        className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] p-1"
                      >×</button>
                    </div>
                  </div>

                  {/* Expanded detail fields */}
                  {isExpanded && certDraft && (
                    <div className="px-3 pb-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Name</label>
                        <input
                          className={inputClass}
                          value={certDraft.name}
                          onChange={(e) => setCertDraft({ ...certDraft, name: e.target.value })}
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
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No certifications found on your CV. Most captains look for STCW at minimum — add yours below.
          </p>
        )}
        <AddCertInline onAdd={(cert) => setCerts([...certs, cert])} />
      </div>

      {/* Education */}
      <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Education {edu.length > 0 && `(${edu.length})`}
        </p>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Degrees and diplomas — university, maritime academy, hospitality school, etc.
        </p>
        {edu.length > 0 ? (
          <>
            {edu.map((e, i) => {
              const isExpanded = expandedEdu === i
              const details = eduDetailCount(e)
              const hasGaps = details.filled < details.total

              return (
                <div key={i} className={`rounded-xl border ${isExpanded ? 'border-[var(--color-amber-200)] bg-white' : 'border-[var(--color-border)] bg-[var(--color-surface)]'} transition-colors`}>
                  {/* Collapsed row */}
                  <div
                    className="p-3 flex items-start justify-between cursor-pointer"
                    onClick={() => toggleEdu(i)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{e.institution}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        {[
                          e.qualification,
                          e.field_of_study,
                          e.start_date && e.end_date ? `${formatDateDisplay(e.start_date)} — ${formatDateDisplay(e.end_date)}` : e.end_date ? formatDateDisplay(e.end_date) : null,
                        ].filter(Boolean).join(' · ') || (hasGaps ? 'Tap to add details' : '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {hasGaps && !isExpanded && (
                        <span className="text-xs text-[var(--color-amber-600)]">{details.filled}/{details.total}</span>
                      )}
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); removeEdu(i) }}
                        className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] p-1"
                      >×</button>
                    </div>
                  </div>

                  {/* Expanded detail fields */}
                  {isExpanded && eduDraft && (
                    <div className="px-3 pb-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
                      <div className="flex flex-col gap-1">
                        <label className={labelClass}>Institution</label>
                        <input
                          className={inputClass}
                          value={eduDraft.institution}
                          onChange={(ev) => setEduDraft({ ...eduDraft, institution: ev.target.value })}
                          placeholder="University or school name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Qualification</label>
                          <input
                            className={inputClass}
                            value={eduDraft.qualification ?? ''}
                            onChange={(ev) => setEduDraft({ ...eduDraft, qualification: ev.target.value || null })}
                            placeholder="e.g. BSc, Diploma"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Field of Study</label>
                          <input
                            className={inputClass}
                            value={eduDraft.field_of_study ?? ''}
                            onChange={(ev) => setEduDraft({ ...eduDraft, field_of_study: ev.target.value || null })}
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
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No education found on your CV — you can add degrees or diplomas anytime from your profile.
          </p>
        )}
        <AddEduInline onAdd={(entry) => setEdu([...edu, entry])} />
      </div>

      {/* Confirm */}
      <div className="flex flex-col items-center gap-2 mt-1">
        <Button onClick={() => onConfirm(certs, edu)} className="px-8">
          Looks good
        </Button>
      </div>
    </div>
  )
}
