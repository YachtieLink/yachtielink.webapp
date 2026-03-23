'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { saveConfirmedImport } from '@/lib/cv/save-parsed-cv-data'
import { StepPersonal } from '@/components/cv/steps/StepPersonal'
import { StepExperience } from '@/components/cv/steps/StepExperience'
import { StepQualifications } from '@/components/cv/steps/StepQualifications'
import { StepExtras } from '@/components/cv/steps/StepExtras'
import { StepReview } from '@/components/cv/steps/StepReview'
import type {
  ParsedCvData, ParsedPersonal, ParsedLanguage,
  ConfirmedYacht, ConfirmedCert, ConfirmedEducation,
  ConfirmedImportData, SaveStats, ParsedSocialMedia,
} from '@/lib/cv/types'

interface CvImportWizardProps {
  userId: string
  storagePath: string
  existingProfile: Record<string, unknown>
  existingAttachments: unknown[]
  existingCerts: unknown[]
  existingEducation: unknown[]
  existingSkills: string[]
  existingHobbies: string[]
}

const TOTAL_STEPS = 5

export function CvImportWizard({
  userId,
  storagePath,
  existingProfile,
  existingSkills,
  existingHobbies,
}: CvImportWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [parseLoading, setParseLoading] = useState(true)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedCvData | null>(null)

  // Confirmed data per step
  const [confirmedPersonal, setConfirmedPersonal] = useState<ParsedPersonal | null>(null)
  const [confirmedLanguages, setConfirmedLanguages] = useState<ParsedLanguage[]>([])
  const [confirmedYachts, setConfirmedYachts] = useState<ConfirmedYacht[]>([])
  const [confirmedCerts, setConfirmedCerts] = useState<ConfirmedCert[]>([])
  const [confirmedEducation, setConfirmedEducation] = useState<ConfirmedEducation[]>([])
  const [skills, setSkills] = useState<string[]>(existingSkills)
  const [hobbies, setHobbies] = useState<string[]>(existingHobbies)

  // Fire parse on mount
  useEffect(() => {
    // Check sessionStorage for resume
    const key = `cv-wizard-${storagePath}`
    const stored = sessionStorage.getItem(key)
    if (stored) {
      try {
        const state = JSON.parse(stored)
        if (state.parsed) { setParsed(state.parsed); setParseLoading(false) }
        if (state.step) setStep(state.step)
        if (state.confirmedPersonal) setConfirmedPersonal(state.confirmedPersonal)
        if (state.confirmedLanguages) setConfirmedLanguages(state.confirmedLanguages)
        if (state.confirmedYachts) setConfirmedYachts(state.confirmedYachts)
        if (state.confirmedCerts) setConfirmedCerts(state.confirmedCerts)
        if (state.confirmedEducation) setConfirmedEducation(state.confirmedEducation)
        if (state.skills) setSkills(state.skills)
        if (state.hobbies) setHobbies(state.hobbies)
        return
      } catch { /* ignore corrupt storage */ }
    }

    fetch('/api/cv/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setParseError(body.error || 'Could not parse CV')
          setParseLoading(false)
          return
        }
        const { data, warning } = await res.json()
        if (warning) toast(warning, 'success')
        setParsed(data as ParsedCvData)

        // Merge skills/hobbies
        const newSkills = [...new Set([...existingSkills, ...(data.skills ?? [])])]
        const newHobbies = [...new Set([...existingHobbies, ...(data.hobbies ?? [])])]
        setSkills(newSkills)
        setHobbies(newHobbies)

        setParseLoading(false)
      })
      .catch(() => {
        setParseError('Something went wrong. Try again or enter your details manually.')
        setParseLoading(false)
      })
  }, [storagePath, existingSkills, existingHobbies])

  // Persist to sessionStorage on change
  useEffect(() => {
    if (parseLoading) return
    const key = `cv-wizard-${storagePath}`
    sessionStorage.setItem(key, JSON.stringify({
      parsed, step, confirmedPersonal, confirmedLanguages,
      confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies,
    }))
  }, [parsed, step, confirmedPersonal, confirmedLanguages, confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies, parseLoading, storagePath])

  const handleSave = useCallback(async (): Promise<SaveStats | null> => {
    const existingSkillsLower = existingSkills.map(s => s.toLowerCase())
    const existingHobbiesLower = existingHobbies.map(h => h.toLowerCase())

    const importData: ConfirmedImportData = {
      personal: confirmedPersonal ?? { full_name: null, primary_role: null, bio: null, phone: null, email: null, location_country: null, location_city: null, dob: null, home_country: null, smoke_pref: null, appearance_note: null, travel_docs: null, license_info: null },
      languages: confirmedLanguages,
      yachts: confirmedYachts,
      certifications: confirmedCerts,
      education: confirmedEducation,
      skills: skills.filter(s => !existingSkillsLower.includes(s.toLowerCase())),
      hobbies: hobbies.filter(h => !existingHobbiesLower.includes(h.toLowerCase())),
      endorsementRequests: [],
      socialMedia: parsed?.social_media ?? { instagram: null, website: null },
    }

    try {
      const stats = await saveConfirmedImport(supabase, userId, importData)
      sessionStorage.removeItem(`cv-wizard-${storagePath}`)
      return stats
    } catch {
      return null
    }
  }, [confirmedPersonal, confirmedLanguages, confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies, existingSkills, existingHobbies, parsed, supabase, userId, storagePath])

  // Parse error screen
  if (parseError && !parsed) {
    return (
      <div className="flex flex-col gap-4 items-center text-center py-8">
        <p className="text-sm text-[var(--color-text-secondary)]">
          We couldn&apos;t read your CV automatically. You can fill in your details from your profile settings, or try uploading a different file.
        </p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={() => router.push('/app/profile')} className="flex-1">
            Go to profile
          </Button>
          <Button onClick={() => router.push('/app/cv/upload')} className="flex-1">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Progress header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--color-text-tertiary)]">Step {step} of {TOTAL_STEPS}</p>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-xs text-[var(--color-interactive)]"
            >
              Back
            </button>
          )}
        </div>
        <div className="w-full h-1 bg-[var(--color-surface-raised)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-interactive)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <StepPersonal
              parsed={parsed?.personal ?? null}
              languages={parsed?.languages ?? []}
              existing={existingProfile}
              parseLoading={parseLoading}
              onConfirm={(personal, langs) => {
                setConfirmedPersonal(personal)
                setConfirmedLanguages(langs)
                setStep(2)
              }}
            />
          )}

          {step === 2 && (
            <StepExperience
              yachts={parsed?.employment_yacht ?? []}
              landJobs={parsed?.employment_land ?? []}
              parseLoading={parseLoading}
              onConfirm={(yachts) => {
                setConfirmedYachts(yachts)
                setStep(3)
              }}
            />
          )}

          {step === 3 && (
            <StepQualifications
              certifications={parsed?.certifications ?? []}
              education={parsed?.education ?? []}
              parseLoading={parseLoading}
              onConfirm={(certs, edu) => {
                setConfirmedCerts(certs)
                setConfirmedEducation(edu)
                setStep(4)
              }}
            />
          )}

          {step === 4 && (
            <StepExtras
              skills={skills}
              hobbies={hobbies}
              socialMedia={parsed?.social_media ?? { instagram: null, website: null }}
              existingSkills={existingSkills}
              existingHobbies={existingHobbies}
              parseLoading={parseLoading}
              onSkillsChange={setSkills}
              onHobbiesChange={setHobbies}
              onConfirm={() => setStep(5)}
            />
          )}

          {step === 5 && (
            <StepReview
              importData={{
                personal: confirmedPersonal ?? { full_name: null, primary_role: null, bio: null, phone: null, email: null, location_country: null, location_city: null, dob: null, home_country: null, smoke_pref: null, appearance_note: null, travel_docs: null, license_info: null },
                languages: confirmedLanguages,
                yachts: confirmedYachts,
                certifications: confirmedCerts,
                education: confirmedEducation,
                skills: skills.filter(s => !existingSkills.includes(s)),
                hobbies: hobbies.filter(h => !existingHobbies.includes(h)),
                endorsementRequests: [],
                socialMedia: parsed?.social_media ?? { instagram: null, website: null },
              }}
              onSave={handleSave}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
