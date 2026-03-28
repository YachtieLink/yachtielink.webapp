import { Sparkles } from 'lucide-react'
import { ProfileAccordion } from '@/components/profile/ProfileAccordion'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { skillsSummary } from '@/lib/profile-summaries'
import type { Skill } from '@/lib/queries/types'

interface SkillsSectionProps {
  skills: Skill[]
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const grouped = skills.reduce((acc, s) => {
    const cat = s.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <ScrollReveal>
      <ProfileAccordion
        title="Extra Skills"
        summary={skillsSummary(skills)}
        icon={<Sparkles size={16} />}
      >
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-1.5 capitalize">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => (
                <span key={s.id} className="text-sm px-3 py-1.5 rounded-full bg-[var(--color-surface-raised)] text-[var(--color-text-primary)]">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </ProfileAccordion>
    </ScrollReveal>
  )
}
