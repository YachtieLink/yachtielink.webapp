import { classicTemplate } from './classic'
import { boldTemplate } from './bold'
import type { BentoTemplate, BentoTemplateVariant, BentoDensity } from '../types'

const templates: Record<string, BentoTemplate> = {
  classic: classicTemplate,
  bold: boldTemplate,
}

export function getTemplate(id: string): BentoTemplate {
  return templates[id] ?? classicTemplate
}

export function getTemplateVariant(id: string, density: BentoDensity): BentoTemplateVariant {
  const template = getTemplate(id)
  return template.variants[density]
}

export { classicTemplate, boldTemplate }
