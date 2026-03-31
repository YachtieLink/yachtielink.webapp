'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'

const PARSE_STEPS = [
  { label: 'Opening your CV...', icon: '📄' },
  { label: 'Extracting text from the document...', icon: '🔍' },
  { label: 'Reading your work history...', icon: '⚓' },
  { label: 'Identifying qualifications & certificates...', icon: '📜' },
  { label: 'Matching yachts in our database...', icon: '🛥️' },
  { label: 'Picking up skills & languages...', icon: '🌍' },
  { label: 'Organising everything...', icon: '✨' },
  { label: 'Almost there — final checks...', icon: '✅' },
]

function ParseProgress({ startedAt }: { startedAt: number }) {
  const [activeStep, setActiveStep] = useState(() =>
    Math.min(Math.floor((Date.now() - startedAt) / 5000), PARSE_STEPS.length - 1)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 5000)
      setActiveStep(Math.min(elapsed, PARSE_STEPS.length - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-amber-200)] border-t-[var(--color-amber-500)]" />

      <div className="w-full max-w-xs">
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[var(--color-amber-100)] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-[var(--color-amber-500)] rounded-full"
            initial={false}
            animate={{ width: `${Math.min(((activeStep + 1) / PARSE_STEPS.length) * 100, 95)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-2.5">
          {PARSE_STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={i < activeStep ? false : { opacity: 0, y: 8 }}
              animate={{
                opacity: i <= activeStep ? 1 : 0.3,
                y: 0,
              }}
              transition={{ duration: 0.3, delay: i <= activeStep ? 0 : 0 }}
              className="flex items-center gap-2.5"
            >
              <span className="text-base w-6 text-center flex-shrink-0">
                {i < activeStep ? <span className="text-[var(--color-teal-600)]">✓</span> : s.icon}
              </span>
              <span className={`text-sm ${
                i < activeStep
                  ? 'text-[var(--color-text-secondary)] line-through decoration-[var(--color-text-tertiary)]'
                  : i === activeStep
                    ? 'text-[var(--color-amber-700)] font-medium'
                    : 'text-[var(--color-text-tertiary)]'
              }`}>
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--color-amber-600)] text-center mt-2">
        This usually takes 30–45 seconds
      </p>
    </div>
  )
}
import { saveConfirmedImport } from '@/lib/cv/save-parsed-cv-data'
import { StepPersonal } from '@/components/cv/steps/StepPersonal'
import { StepExperience } from '@/components/cv/steps/StepExperience'
import { StepQualifications } from '@/components/cv/steps/StepQualifications'
import { StepExtras } from '@/components/cv/steps/StepExtras'
import { StepReview } from '@/components/cv/steps/StepReview'
import type {
  ParsedCvData, ParsedPersonal, ParsedLanguage,
  ConfirmedYacht, ConfirmedCert, ConfirmedEducation,
  ConfirmedImportData, ConfirmedPersonal, SaveStats, ParsedSocialMedia,
} from '@/lib/cv/types'

const EMPTY_PERSONAL: ConfirmedPersonal = {
  full_name: null, primary_role: null, bio: null, phone: null, email: null,
  location_country: null, location_city: null, dob: null, home_country: null,
  smoke_pref: null, appearance_note: null, travel_docs: null, license_info: null,
}

/** Single factory for ConfirmedImportData — eliminates duplicate construction */
function buildImportData(opts: {
  confirmedPersonal: ParsedPersonal | null
  confirmedLanguages: ParsedLanguage[]
  confirmedYachts: ConfirmedYacht[]
  confirmedCerts: ConfirmedCert[]
  confirmedEducation: ConfirmedEducation[]
  skills: string[]
  hobbies: string[]
  skillsSummary: string | null
  interestsSummary: string | null
  existingSkills: string[]
  existingHobbies: string[]
  socialMedia: ParsedSocialMedia | undefined
}): ConfirmedImportData {
  const existingSkillsLower = new Set(opts.existingSkills.map(s => s.toLowerCase()))
  const existingHobbiesLower = new Set(opts.existingHobbies.map(h => h.toLowerCase()))

  return {
    personal: opts.confirmedPersonal ?? EMPTY_PERSONAL,
    languages: opts.confirmedLanguages,
    yachts: opts.confirmedYachts,
    certifications: opts.confirmedCerts,
    education: opts.confirmedEducation,
    skills: opts.skills.filter(s => !existingSkillsLower.has(s.toLowerCase())),
    hobbies: opts.hobbies.filter(h => !existingHobbiesLower.has(h.toLowerCase())),
    skillsSummary: opts.skillsSummary || null,
    interestsSummary: opts.interestsSummary || null,
    endorsementRequests: [],
    socialMedia: opts.socialMedia ?? { instagram: null, linkedin: null, tiktok: null, website: null },
  }
}

interface CvImportWizardProps {
  userId: string
  storagePath: string
  existingProfile: Record<string, unknown>
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
  // Track if we're editing from the review screen so onConfirm returns to step 5
  const returnToReviewRef = useRef(false)
  const [parseLoading, setParseLoading] = useState(true)
  const [parseStartedAt] = useState(() => Date.now())
  const [parsePersonalLoading, setParsePersonalLoading] = useState(true)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseRateLimited, setParseRateLimited] = useState(false)
  const [parsed, setParsed] = useState<ParsedCvData | null>(null)
  const [parsedPersonal, setParsedPersonal] = useState<ParsedPersonal | null>(null)
  const [parsedLanguages, setParsedLanguages] = useState<ParsedLanguage[]>([])

  // Ref to track full parse completion for race guard
  const parsedRef = useRef<ParsedCvData | null>(null)
  useEffect(() => { parsedRef.current = parsed }, [parsed])

  // Confirmed data per step
  const [confirmedPersonal, setConfirmedPersonal] = useState<ParsedPersonal | null>(null)
  const [confirmedLanguages, setConfirmedLanguages] = useState<ParsedLanguage[]>([])
  const [confirmedYachts, setConfirmedYachts] = useState<ConfirmedYacht[]>([])
  const [confirmedCerts, setConfirmedCerts] = useState<ConfirmedCert[]>([])
  const [confirmedEducation, setConfirmedEducation] = useState<ConfirmedEducation[]>([])
  const [skills, setSkills] = useState<string[]>(existingSkills)
  const [hobbies, setHobbies] = useState<string[]>(existingHobbies)
  const [socialMedia, setSocialMedia] = useState<ParsedSocialMedia>({ instagram: null, linkedin: null, tiktok: null, website: null })
  const [skillsSummary, setSkillsSummary] = useState<string>('')
  const [interestsSummary, setInterestsSummary] = useState<string>('')

  // Fast parse — personal + languages only
  const firePersonalParse = useCallback(() => {
    fetch('/api/cv/parse-personal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    })
      .then(async (res) => {
        if (!res.ok) return // Silent fail — full parse will handle it
        const { data } = await res.json()
        // Race guard: if full parse already completed, ignore fast parse result
        if (parsedRef.current) {
          setParsePersonalLoading(false)
          return
        }
        setParsedPersonal(data.personal)
        setParsedLanguages(data.languages ?? [])
        setParsePersonalLoading(false)
      })
      .catch(() => {
        // Network failure — clear loading so we don't hang forever if full parse also fails
        setParsePersonalLoading(false)
      })
  }, [storagePath])

  // Full parse — everything
  const fireFullParse = useCallback(() => {
    fetch('/api/cv/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 429) {
            // Daily parse limit reached — not an error, just a limit
            setParseRateLimited(true)
            setParseLoading(false)
            setParsePersonalLoading(false)
            return
          }
          const body = await res.json().catch(() => ({}))
          setParseError(body.error || 'Could not parse CV')
          setParseLoading(false)
          setParsePersonalLoading(false)
          return
        }
        const { data, warning } = await res.json()
        if (warning) toast(warning, 'success')

        setParsed(data as ParsedCvData)

        // If fast parse hasn't returned yet, populate personal from full parse
        setParsedPersonal(prev => prev ?? (data as ParsedCvData).personal)
        setParsedLanguages(prev => prev.length ? prev : ((data as ParsedCvData).languages ?? []))
        setParsePersonalLoading(false)

        // Merge skills/hobbies
        const newSkills = [...new Set([...existingSkills, ...(data.skills ?? [])])]
        const newHobbies = [...new Set([...existingHobbies, ...(data.hobbies ?? [])])]
        setSkills(newSkills)
        setHobbies(newHobbies)

        // Initialise social media from parse
        if (data.social_media) {
          setSocialMedia(prev => ({
            instagram: prev.instagram || data.social_media?.instagram || null,
            linkedin: prev.linkedin || data.social_media?.linkedin || null,
            tiktok: prev.tiktok || data.social_media?.tiktok || null,
            website: prev.website || data.social_media?.website || null,
          }))
        }

        // Initialise summaries from parse
        if (data.skills_summary) setSkillsSummary(prev => prev || data.skills_summary || '')
        if (data.interests_summary) setInterestsSummary(prev => prev || data.interests_summary || '')

        setParseLoading(false)
      })
      .catch(() => {
        setParseError('Something went wrong. Try again or enter your details manually.')
        setParseLoading(false)
        setParsePersonalLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePath, existingSkills, existingHobbies])

  // Guard against StrictMode double-mount firing parses twice
  const hasFiredRef = useRef(false)

  // Fire parses on mount (or resume from sessionStorage)
  useEffect(() => {
    if (hasFiredRef.current) return
    hasFiredRef.current = true

    const key = `cv-wizard-${storagePath}`
    const stored = sessionStorage.getItem(key)
    if (stored) {
      try {
        const state = JSON.parse(stored)
        if (state.parsed) { setParsed(state.parsed); setParseLoading(false); parsedRef.current = state.parsed }
        if (state.parsedPersonal) { setParsedPersonal(state.parsedPersonal); setParsePersonalLoading(false) }
        if (state.parsedLanguages) setParsedLanguages(state.parsedLanguages)
        if (state.step) setStep(state.step)
        if (state.confirmedPersonal) setConfirmedPersonal(state.confirmedPersonal)
        if (state.confirmedLanguages) setConfirmedLanguages(state.confirmedLanguages)
        if (state.confirmedYachts) setConfirmedYachts(state.confirmedYachts)
        if (state.confirmedCerts) setConfirmedCerts(state.confirmedCerts)
        if (state.confirmedEducation) setConfirmedEducation(state.confirmedEducation)
        if (state.skills) setSkills(state.skills)
        if (state.hobbies) setHobbies(state.hobbies)
        if (state.skillsSummary) setSkillsSummary(state.skillsSummary)
        if (state.interestsSummary) setInterestsSummary(state.interestsSummary)
        if (state.socialMedia) setSocialMedia(state.socialMedia)

        // Initialise from parsed data if not yet in state
        if (!state.socialMedia && state.parsed?.social_media) {
          const sm = state.parsed.social_media
          setSocialMedia({
            instagram: sm.instagram || null,
            linkedin: sm.linkedin || null,
            tiktok: sm.tiktok || null,
            website: sm.website || null,
          })
        }
        if (!state.skillsSummary && state.parsed?.skills_summary) {
          setSkillsSummary(state.parsed.skills_summary)
        }
        if (!state.interestsSummary && state.parsed?.interests_summary) {
          setInterestsSummary(state.parsed.interests_summary)
        }

        // If full parse is already cached, skip both fetches
        if (state.parsed) return
        // If only personal is cached, skip fast fetch, re-fire full only
        if (state.parsedPersonal) {
          fireFullParse()
          return
        }
      } catch { /* ignore corrupt storage */ }
    }

    // Fire both parses in parallel
    firePersonalParse()
    fireFullParse()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePath])

  // Persist to sessionStorage on change
  useEffect(() => {
    if (parsePersonalLoading && parseLoading) return
    const key = `cv-wizard-${storagePath}`
    sessionStorage.setItem(key, JSON.stringify({
      parsed, parsedPersonal, parsedLanguages,
      step, confirmedPersonal, confirmedLanguages,
      confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies,
      skillsSummary, interestsSummary, socialMedia,
    }))
  }, [parsed, parsedPersonal, parsedLanguages, step, confirmedPersonal, confirmedLanguages, confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies, skillsSummary, interestsSummary, socialMedia, parsePersonalLoading, parseLoading, storagePath])

  const getImportData = useCallback((): ConfirmedImportData => {
    return buildImportData({
      confirmedPersonal, confirmedLanguages, confirmedYachts, confirmedCerts,
      confirmedEducation, skills, hobbies, skillsSummary, interestsSummary, existingSkills, existingHobbies,
      socialMedia,
    })
  }, [confirmedPersonal, confirmedLanguages, confirmedYachts, confirmedCerts, confirmedEducation, skills, hobbies, skillsSummary, interestsSummary, existingSkills, existingHobbies, socialMedia])

  const handleSave = useCallback(async (): Promise<SaveStats | null> => {
    try {
      const stats = await saveConfirmedImport(supabase, userId, getImportData())
      sessionStorage.removeItem(`cv-wizard-${storagePath}`)
      return stats
    } catch {
      return null
    }
  }, [getImportData, supabase, userId, storagePath])

  // Parse error screen — only show if we have no data at all AND both parses are done
  // Don't show while fast parse is still in flight (it might succeed)
  if (parseError && !parsed && !parsedPersonal && !parsePersonalLoading) {
    return (
      <div className="flex flex-col gap-5 items-center text-center py-8 px-4">
        <div className="h-12 w-12 rounded-full bg-[var(--color-amber-50)] flex items-center justify-center">
          <svg className="h-6 w-6 text-[var(--color-amber-500)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            We&apos;re having trouble reading this CV
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
            This sometimes happens when our systems are busy. You can try again now, come back later from your CV tab, or enter your details manually in the meantime.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Button onClick={() => router.push('/app/cv/upload')} className="w-full">
            Try again
          </Button>
          <Button variant="secondary" onClick={() => router.push('/app/profile')} className="w-full">
            Enter details manually
          </Button>
        </div>
      </div>
    )
  }

  // Show dedicated parse progress screen while personal data is loading
  if (parsePersonalLoading) {
    return (
      <div className="flex flex-col gap-4 pb-24">
        <ParseProgress startedAt={parseStartedAt} />
      </div>
    )
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Rate limit banner */}
      {parseRateLimited && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-amber-900">
            You&apos;ve used your 3 free CV reads for today
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Running these costs us real money! Your personal details were imported above — you can fill in the rest manually from your profile, or try again tomorrow.
          </p>
        </div>
      )}

      {/* Progress header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--color-amber-600)]">Step {step} of {TOTAL_STEPS}</p>
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
        <div className="w-full h-1 bg-[var(--color-amber-100)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-amber-500)] transition-all duration-300"
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
              parsed={parsedPersonal}
              languages={confirmedLanguages.length > 0 ? confirmedLanguages : parsedLanguages}
              existing={confirmedPersonal
                ? { ...existingProfile, ...Object.fromEntries(Object.entries(confirmedPersonal).filter(([, v]) => v != null)) }
                : existingProfile}
              parsePersonalLoading={parsePersonalLoading}
              onConfirm={(personal, langs) => {
                setConfirmedPersonal(personal)
                setConfirmedLanguages(langs)
                if (returnToReviewRef.current) { returnToReviewRef.current = false; setStep(5) }
                else setStep(2)
              }}
            />
          )}

          {step >= 2 && step <= 4 && parseLoading && !parseRateLimited && (
            <ParseProgress startedAt={parseStartedAt} />
          )}

          {step === 2 && (!parseLoading || parseRateLimited) && (
            <StepExperience
              userId={userId}
              yachts={parsed?.employment_yacht ?? []}
              landJobs={parsed?.employment_land ?? []}
              parseLoading={false}
              initialConfirmed={confirmedYachts.length > 0 ? confirmedYachts : undefined}
              onConfirm={(yachts) => {
                setConfirmedYachts(yachts)
                if (returnToReviewRef.current) { returnToReviewRef.current = false; setStep(5) }
                else setStep(3)
              }}
            />
          )}

          {step === 3 && (!parseLoading || parseRateLimited) && (
            <StepQualifications
              certifications={parsed?.certifications ?? []}
              education={parsed?.education ?? []}
              parseLoading={false}
              initialCerts={confirmedCerts.length > 0 ? confirmedCerts : undefined}
              initialEducation={confirmedEducation.length > 0 ? confirmedEducation : undefined}
              onConfirm={(certs, edu) => {
                setConfirmedCerts(certs)
                setConfirmedEducation(edu)
                if (returnToReviewRef.current) { returnToReviewRef.current = false; setStep(5) }
                else setStep(4)
              }}
            />
          )}

          {step === 4 && (!parseLoading || parseRateLimited) && (
            <StepExtras
              skills={skills}
              hobbies={hobbies}
              skillsSummary={skillsSummary}
              interestsSummary={interestsSummary}
              socialMedia={socialMedia}
              existingSkills={existingSkills}
              existingHobbies={existingHobbies}
              parseLoading={false}
              onSkillsChange={setSkills}
              onHobbiesChange={setHobbies}
              onSkillsSummaryChange={setSkillsSummary}
              onInterestsSummaryChange={setInterestsSummary}
              onSocialChange={setSocialMedia}
              onConfirm={() => setStep(5)}
            />
          )}

          {step === 5 && (
            <StepReview
              importData={getImportData()}
              onSave={handleSave}
              onEditStep={(s) => { returnToReviewRef.current = true; setStep(s) }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
