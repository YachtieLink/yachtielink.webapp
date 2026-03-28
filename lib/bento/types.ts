export interface BentoTemplateSlot {
  id: string
  areaName: string
  type: 'photo' | 'about' | 'experience' | 'certifications' | 'endorsements' | 'education' | 'skills' | 'contact' | 'cv' | 'stats' | 'spacer'
}

export interface BentoTemplateVariant {
  slots: BentoTemplateSlot[]
  areas: {
    desktop: string
    mobile: string
  }
  /** Optional explicit row sizes (CSS grid-template-rows). Falls back to grid-auto-rows if not set. */
  rowSizes?: {
    desktop?: string
    mobile?: string
  }
}

export interface BentoTemplate {
  id: string
  name: string
  description: string
  variants: {
    full: BentoTemplateVariant
    medium: BentoTemplateVariant
    minimal: BentoTemplateVariant
  }
}

export type BentoDensity = 'full' | 'medium' | 'minimal'

export interface BentoTile {
  areaName: string
  type: BentoTemplateSlot['type']
  content: React.ReactNode
  onClick?: () => void
}
