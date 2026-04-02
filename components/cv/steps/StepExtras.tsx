'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui'
import { ChipSelect } from '@/components/cv/ChipSelect'
import { Skeleton } from '@/components/ui/skeleton'
import { Instagram, Linkedin, Globe, ChevronRight, Pencil, X } from 'lucide-react'
import { TikTokIcon } from '@/components/ui/social-icons'
import type { ParsedSocialMedia } from '@/lib/cv/types'

// ── Collapsible blurb ────────────────────────────────────

function CollapsibleBlurb({ label, hint, value, onChange, placeholder, hardLimit, softLimit, rows }: {
  label: string; hint: string; value: string; onChange: (v: string) => void
  placeholder: string; hardLimit: number; softLimit: number; rows: number
}) {
  // 'collapsed' = 2-line preview, 'read' = full text, 'edit' = textarea
  const [mode, setMode] = useState<'collapsed' | 'read' | 'edit'>('collapsed')

  const borderClass = value.length > hardLimit
    ? 'border-[var(--color-error)]'
    : value.length > softLimit
      ? 'border-amber-400'
      : 'border-[var(--color-border)] focus-within:border-[var(--color-interactive)]'

  const counterClass = value.length > hardLimit
    ? 'text-[var(--color-error)] font-medium'
    : value.length > softLimit
      ? 'text-amber-500'
      : 'text-[var(--color-text-tertiary)]'

  // No content — show "Add" link that goes straight to edit
  if (!value && mode !== 'edit') {
    return (
      <button
        type="button"
        onClick={() => setMode('edit')}
        className="flex items-center gap-1.5 text-sm text-[var(--color-interactive)] py-1"
      >
        <ChevronRight size={14} />
        Add {label.toLowerCase()}
      </button>
    )
  }

  // Collapsed — 2-line preview
  if (mode === 'collapsed' && value) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className="text-xs text-[var(--color-interactive)] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <Pencil size={10} /> Edit
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] line-clamp-2 leading-relaxed">{value}</p>
        <button
          type="button"
          onClick={() => setMode('read')}
          className="text-xs text-[var(--color-interactive)] self-start py-0.5"
        >
          Read more
        </button>
      </div>
    )
  }

  // Read — full text, not editable
  if (mode === 'read') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="text-xs text-[var(--color-interactive)] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <Pencil size={10} /> Edit
            </button>
          </div>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{value}</p>
        <button
          type="button"
          onClick={() => setMode('collapsed')}
          className="text-xs text-[var(--color-text-tertiary)] self-start py-0.5"
        >
          Show less
        </button>
      </div>
    )
  }

  // Edit — full textarea
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
        <button
          type="button"
          onClick={() => setMode(value ? 'collapsed' : 'collapsed')}
          className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        >
          Done
        </button>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => { if (e.target.value.length <= hardLimit) onChange(e.target.value) }}
        placeholder={placeholder}
        rows={Math.max(rows, 8)}
        autoFocus
        className={`w-full rounded-xl border bg-[var(--color-surface)] px-3 py-3 text-base leading-relaxed text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20 resize-y ${borderClass}`}
      />
      <p className={`text-[10px] text-right ${counterClass}`}>
        {value.length}/{hardLimit}{value.length > softLimit && value.length <= hardLimit && ` · recommended under ${softLimit}`}
      </p>
    </div>
  )
}

const SOCIAL_PLATFORMS: { key: string; label: string; icon: ReactNode; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={16} />, placeholder: '@your_handle' },
  { key: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} />, placeholder: 'linkedin.com/in/yourname' },
  { key: 'tiktok', label: 'TikTok', icon: <TikTokIcon size={16} />, placeholder: '@your_handle' },
  { key: 'website', label: 'Website', icon: <Globe size={16} />, placeholder: 'yoursite.com' },
]

// ── Props ────────────────────────────────────────────────

interface StepExtrasProps {
  skills: string[]
  hobbies: string[]
  skillsSummary: string
  interestsSummary: string
  socialMedia: ParsedSocialMedia
  existingSkills: string[]
  existingHobbies: string[]
  parseLoading: boolean
  onSkillsChange: (s: string[]) => void
  onHobbiesChange: (h: string[]) => void
  onSkillsSummaryChange: (s: string) => void
  onInterestsSummaryChange: (s: string) => void
  onSocialChange: (s: ParsedSocialMedia) => void
  onConfirm: () => void
}

// ── Component ────────────────────────────────────────────

export function StepExtras({
  skills, hobbies, skillsSummary, interestsSummary, socialMedia,
  existingSkills, existingHobbies,
  parseLoading,
  onSkillsChange, onHobbiesChange,
  onSkillsSummaryChange, onInterestsSummaryChange,
  onSocialChange,
  onConfirm,
}: StepExtrasProps) {
  const [showAddSocial, setShowAddSocial] = useState(false)

  if (parseLoading) {
    return (
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">The finishing touches</h2>
        <div className="flex gap-3">
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-lg" />
          <Skeleton className="h-5 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-px w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-5 w-16 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    )
  }

  const hasAnything = skills.length > 0 || hobbies.length > 0 || socialMedia?.instagram || socialMedia?.website

  // Which social platforms have values
  const activeSocials = SOCIAL_PLATFORMS.filter(p => socialMedia?.[p.key as keyof ParsedSocialMedia] != null)
  const availableSocials = SOCIAL_PLATFORMS.filter(p => socialMedia?.[p.key as keyof ParsedSocialMedia] == null)

  function updateSocial(key: string, value: string) {
    onSocialChange({ ...socialMedia, [key]: value || null })
  }

  function addSocialPlatform(key: string) {
    onSocialChange({ ...socialMedia, [key]: '' })
    setShowAddSocial(false)
  }

  function removeSocial(key: string) {
    onSocialChange({ ...socialMedia, [key]: null })
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="bg-white/90 border border-[var(--color-amber-200)] rounded-2xl p-5 flex flex-col gap-5 shadow-sm">
        <h2 className="text-lg font-serif font-semibold text-[var(--color-text-primary)]">The finishing touches</h2>

        {hasAnything ? (
          <>
            {/* Skills section */}
            <ChipSelect
              label="Skills"
              hint="Professional and technical skills that set you apart — these help match you with the right roles."
              items={skills}
              onChange={onSkillsChange}
              existingItems={existingSkills}
              maxItems={20}
            />
            <CollapsibleBlurb
              label="Skills summary"
              hint="A short pitch that brings your skills to life — what sets you apart and why it matters."
              value={skillsSummary}
              onChange={onSkillsSummaryChange}
              placeholder="e.g. Fully qualified chef with 3-star Michelin foundations, specialising in diverse cuisines and dietary requirements across private and charter yachts..."
              hardLimit={1500}
              softLimit={1000}
              rows={4}
            />

            {/* Hobbies section */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-[var(--color-amber-200)]" />
            </div>
            <ChipSelect
              label="Hobbies & Interests"
              hint="Personal interests that show your personality — captains love crew who fit the vibe onboard."
              items={hobbies}
              onChange={onHobbiesChange}
              existingItems={existingHobbies}
              maxItems={10}
            />
            <CollapsibleBlurb
              label="Interests blurb"
              hint="A line or two about what you love outside the galley, engine room, or deck — it shows you're human."
              value={interestsSummary}
              onChange={onInterestsSummaryChange}
              placeholder="e.g. When I'm not in the galley I love a good crossfit session, and if I'm near water you'll find me on a wakeboard..."
              hardLimit={750}
              softLimit={500}
              rows={3}
            />

            {/* Social links */}
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-[var(--color-amber-200)]" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-base font-semibold text-[var(--color-text-primary)]">Social & Links</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Help captains and agents find you — add your profiles and portfolio.
              </p>
              <div className="flex flex-col gap-2">
                {activeSocials.map((platform) => {
                  const val = socialMedia[platform.key as keyof ParsedSocialMedia] ?? ''
                  return (
                    <div key={platform.key} className="flex items-center gap-2">
                      <span className="w-5 text-center flex-shrink-0 text-[var(--color-text-secondary)]">{platform.icon}</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => updateSocial(platform.key, e.target.value)}
                        placeholder={platform.placeholder}
                        className="flex-1 h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-interactive)]/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocial(platform.key)}
                        aria-label={`Remove ${platform.label}`}
                        className="w-10 h-10 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors rounded-lg hover:bg-[var(--color-surface-raised)] flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}

                {activeSocials.length === 0 && (
                  <p className="text-xs text-[var(--color-text-tertiary)]">No social links yet.</p>
                )}

                {/* Add more */}
                {availableSocials.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAddSocial(!showAddSocial)}
                      className="text-sm text-[var(--color-interactive)] py-1"
                    >
                      + Add social link
                    </button>
                    {showAddSocial && (
                      <div className="absolute top-8 left-0 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg p-2 flex flex-col gap-0.5 min-w-[180px]">
                        {availableSocials.map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => addSocialPlatform(p.key)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] text-left min-h-[40px]"
                          >
                            <span className="text-[var(--color-text-secondary)]">{p.icon}</span> {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your skills and hobbies make you stand out to captains. Add a few now, or come back to it from your profile.
            </p>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 pt-3 pb-2 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent -mx-1 px-1">
        <Button onClick={onConfirm} className="w-full" size="lg">
          {hasAnything ? 'Looks good' : 'Skip for now'}
        </Button>
      </div>
    </div>
  )
}
