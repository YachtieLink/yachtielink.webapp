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
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">{s.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
