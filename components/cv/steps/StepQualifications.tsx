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

  function removeCert(i: number) { setCerts(certs.filter((_, j) => j !== i)) }
  function removeEdu(i: number) { setEdu(edu.filter((_, j) => j !== i)) }

  if (parseLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Qualifications</h2>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
      </div>
    )
  }

  const hasAnything = certs.length > 0 || edu.length > 0

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Qualifications</h2>

      {/* Certs */}
      {certs.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Certifications ({certs.length})</p>
          {certs.map((cert, i) => {
            const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()
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
                <button type="button" onClick={() => removeCert(i)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] ml-2">×</button>
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
          {edu.map((e, i) => (
            <div key={i} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)] flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{e.institution}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {[e.qualification, e.start_date && e.end_date ? `${formatDateDisplay(e.start_date)} — ${formatDateDisplay(e.end_date)}` : formatDateDisplay(e.end_date)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button type="button" onClick={() => removeEdu(i)} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] ml-2">×</button>
            </div>
          ))}
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
