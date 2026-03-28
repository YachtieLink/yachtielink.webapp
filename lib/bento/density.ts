import type { BentoDensity } from './types'

export function detectDensity(data: {
  photoCount: number
  hasAbout: boolean
  experienceCount: number
  certCount: number
  endorsementCount: number
  educationCount: number
  hasSkills: boolean
}): BentoDensity {
  const { photoCount, experienceCount, certCount, endorsementCount, educationCount, hasSkills, hasAbout } = data

  // Full: enough photos to fill the bento AND some content
  const populatedSections = [
    endorsementCount >= 1,
    certCount >= 1,
    educationCount >= 1,
    hasSkills,
    hasAbout,
    experienceCount >= 1,
  ].filter(Boolean).length

  if (photoCount >= 4 && populatedSections >= 3) {
    return 'full'
  }

  // Medium: some photos or moderate content
  if (photoCount >= 2 || (experienceCount >= 1 && populatedSections >= 2)) {
    return 'medium'
  }

  return 'minimal'
}
