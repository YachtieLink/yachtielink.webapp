'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateDisplay } from '@/lib/cv/types'
import type { ParsedCertification, ParsedEducation, ConfirmedCert, ConfirmedEducation } from '@/lib/cv/types'

interface StepQualificationsProps {
  certifications: ParsedCertification[]
  education: ParsedEducation[]
  parseLoading: boolean
  onConfirm: (certs: ConfirmedCert[], education: ConfirmedEducation[]) => void
  /** Pre-confirmed data from a previous pass (e.g. when returning from review) */
  initialCerts?: ConfirmedCert[]
  initialEducation?: ConfirmedEducation[]
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

  // Edit state
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null)
  const [certDraft, setCertDraft] = useState<ConfirmedCert | null>(null)

  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null)
  const [eduDraft, setEduDraft] = useState<ConfirmedEducation | null>(null)

  function removeCert(i: number) {
    if (editingCertIndex === i) { setEditingCertIndex(null); setCertDraft(null) }
    else if (editingCertIndex !== null && editingCertIndex > i) { setEditingCertIndex(editingCertIndex - 1) }
    setCerts(certs.filter((_, j) => j !== i))
  }
  function removeEdu(i: number) {
    if (editingEduIndex === i) { setEditingEduIndex(null); setEduDraft(null) }
    else if (editingEduIndex !== null && editingEduIndex > i) { setEditingEduIndex(editingEduIndex - 1) }
    setEdu(edu.filter((_, j) => j !== i))
  }

  function startEditCert(i: number) {
    setEditingCertIndex(i)
    setCertDraft({ ...certs[i] })
  }
  function saveCert() {
    if (editingCertIndex === null || !certDraft) return
    setCerts(certs.map((c, j) => j === editingCertIndex ? certDraft : c))
    setEditingCertIndex(null)
    setCertDraft(null)
  }
  function cancelCert() {
    setEditingCertIndex(null)
    setCertDraft(null)
  }

  function startEditEdu(i: number) {
    setEditingEduIndex(i)
    setEduDraft({ ...edu[i] })
  }
  function saveEdu() {
    if (editingEduIndex === null || !eduDraft) return
    setEdu(edu.map((e, j) => j === editingEduIndex ? eduDraft : e))
    setEditingEduIndex(null)
    setEduDraft(null)
  }
  function cancelEdu() {
    setEditingEduIndex(null)
    setEduDraft(null)
  }

  if (parseLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Qualifications</h2>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
      </div>
    )
  }

  const hasAnything = certs.length > 0 || edu.length > 0

  const inputClass = "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 focus:border-[var(--color-interactive)]"
  const labelClass = "text-xs font-medium text-[var(--color-text-secondary)]"

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Qualifications</h2>

      {/* Certs */}
      {certs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Certifications ({certs.length})</p>
          {certs.map((cert, i) => {
            const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()
            const isEditing = editingCertIndex === i

            if (isEditing && certDraft) {
              return (
                <div key={i} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-interactive)]/40 flex flex-col gap-3">
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
                      placeholder="e.g. MCA, RYA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Issued Date</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={certDraft.issued_date ?? ''}
                        onChange={(e) => setCertDraft({ ...certDraft, issued_date: e.target.value || null })}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Expiry Date</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={certDraft.expiry_date ?? ''}
                        onChange={(e) => setCertDraft({ ...certDraft, expiry_date: e.target.value || null })}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={saveCert} className="text-xs text-[var(--color-interactive)] font-medium">Save</button>
                    <button type="button" onClick={cancelCert} className="text-xs text-[var(--color-text-tertiary)]">Cancel</button>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {isExpired ? '!' : 'ok'}
                    </span>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{cert.name}</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {[
                      cert.expiry_date ? (isExpired ? `Expired ${formatDateDisplay(cert.expiry_date)}` : `Valid until ${formatDateDisplay(cert.expiry_date)}`) : cert.issued_date ? `Issued ${formatDateDisplay(cert.issued_date)}` : null,
                      cert.issuing_body,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button type="button" onClick={() => startEditCert(i)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-interactive)]">Edit</button>
                  <button type="button" onClick={() => removeCert(i)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]">×</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          We didn&apos;t find certifications on your CV — you can add them from your profile. Most captains look for STCW at minimum.
        </p>
      )}

      {/* Education */}
      {edu.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Education ({edu.length})</p>
          {edu.map((e, i) => {
            const isEditing = editingEduIndex === i

            if (isEditing && eduDraft) {
              return (
                <div key={i} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-interactive)]/40 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Institution</label>
                    <input
                      className={inputClass}
                      value={eduDraft.institution ?? ''}
                      onChange={(ev) => setEduDraft({ ...eduDraft, institution: ev.target.value })}
                      placeholder="University or school name"
                    />
                  </div>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Start Date</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={eduDraft.start_date ?? ''}
                        onChange={(ev) => setEduDraft({ ...eduDraft, start_date: ev.target.value || null })}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>End Date</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={eduDraft.end_date ?? ''}
                        onChange={(ev) => setEduDraft({ ...eduDraft, end_date: ev.target.value || null })}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEdu} className="text-xs text-[var(--color-interactive)] font-medium">Save</button>
                    <button type="button" onClick={cancelEdu} className="text-xs text-[var(--color-text-tertiary)]">Cancel</button>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)] flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{e.institution}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {[e.qualification, e.start_date && e.end_date ? `${formatDateDisplay(e.start_date)} — ${formatDateDisplay(e.end_date)}` : formatDateDisplay(e.end_date)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button type="button" onClick={() => startEditEdu(i)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-interactive)]">Edit</button>
                  <button type="button" onClick={() => removeEdu(i)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]">×</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No education entries found — you can add them anytime.
        </p>
      )}

      <Button onClick={() => onConfirm(certs, edu)} className="w-full mt-1">
        {hasAnything ? 'Looks good' : 'Next'}
      </Button>
    </div>
  )
}
