'use client'

import { Button } from '@/components/ui'
import { ChipSelect } from '@/components/cv/ChipSelect'
import { Skeleton } from '@/components/ui/skeleton'
import type { ParsedSocialMedia } from '@/lib/cv/types'

interface StepExtrasProps {
  skills: string[]
  hobbies: string[]
  socialMedia: ParsedSocialMedia
  existingSkills: string[]
  existingHobbies: string[]
  parseLoading: boolean
  onSkillsChange: (s: string[]) => void
  onHobbiesChange: (h: string[]) => void
  onConfirm: () => void
}

export function StepExtras({
  skills, hobbies, socialMedia,
  existingSkills, existingHobbies,
  parseLoading,
  onSkillsChange, onHobbiesChange,
  onConfirm,
}: StepExtrasProps) {
  if (parseLoading) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Skills & Interests</h2>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    )
  }

  const hasAnything = skills.length > 0 || hobbies.length > 0 || socialMedia?.instagram || socialMedia?.website

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Skills & Interests</h2>

      {hasAnything ? (
        <>
          <ChipSelect
            label="Skills"
            items={skills}
            onChange={onSkillsChange}
            existingItems={existingSkills}
            maxItems={20}
          />

          <ChipSelect
            label="Hobbies"
            items={hobbies}
            onChange={onHobbiesChange}
            existingItems={existingHobbies}
            maxItems={10}
          />

          <p className="text-xs text-[var(--color-text-tertiary)]">
            Tap any to remove. Tap + to add.
          </p>

          {(socialMedia?.instagram || socialMedia?.website) && (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Social</p>
              {socialMedia.instagram && (
                <p className="text-sm text-[var(--color-text-secondary)]">Instagram: @{socialMedia.instagram}</p>
              )}
              {socialMedia.website && (
                <p className="text-sm text-[var(--color-text-secondary)]">Website: {socialMedia.website}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
          We didn&apos;t find skills or hobbies on your CV — you can add them from your profile anytime.
        </p>
      )}

      <Button onClick={onConfirm} className="w-full mt-1">
        {hasAnything ? 'Looks good' : 'Next'}
      </Button>
    </div>
  )
}
