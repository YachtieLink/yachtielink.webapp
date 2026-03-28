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
  const { photoCount, hasAbout, experienceCount, certCount, endorsementCount, educationCount, hasSkills } = data

  // Full: 6+ photos AND rich content
  if (photoCount >= 6 && experienceCount >= 3 && endorsementCount >= 2 && certCount >= 3) {
    return 'full'
  }

  // Medium: moderate photos OR moderate content
  const populatedSections = [
    endorsementCount >= 1,
    certCount >= 1,
    educationCount >= 1,
    hasSkills,
    hasAbout,
  ].filter(Boolean).length

  if (photoCount >= 2 || (experienceCount >= 1 && populatedSections >= 2)) {
    return 'medium'
  }

  return 'minimal'
}
