'use client'

interface StatsTileProps {
  seaTime: string
  yachtCount: number
  certCount: number
  endorsementCount: number
  colleagueCount: number
}

export function StatsTile({ seaTime, yachtCount, certCount, endorsementCount, colleagueCount }: StatsTileProps) {
  const stats = [
    seaTime ? { label: 'Sea Time', value: seaTime } : null,
    yachtCount > 0 ? { label: 'Yachts', value: String(yachtCount) } : null,
    certCount > 0 ? { label: 'Certs', value: String(certCount) } : null,
    endorsementCount > 0 ? { label: 'Endorsements', value: String(endorsementCount) } : null,
    colleagueCount > 0 ? { label: 'Colleagues', value: String(colleagueCount) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex items-center justify-center">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-[var(--color-text-primary)]">{s.value}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
