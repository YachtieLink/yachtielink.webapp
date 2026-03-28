'use client'

import { BarChart3 } from 'lucide-react'

interface StatsTileProps {
  seaTime: string
  yachtCount: number
  certCount: number
}

export function StatsTile({ seaTime, yachtCount, certCount }: StatsTileProps) {
  const stats = [
    seaTime ? { label: 'Sea Time', value: seaTime } : null,
    yachtCount > 0 ? { label: 'Yachts', value: String(yachtCount) } : null,
    certCount > 0 ? { label: 'Certs', value: String(certCount) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <div className="h-full rounded-xl bg-white/80 p-5 flex flex-col items-center justify-center gap-2">
      <BarChart3 size={16} className="text-[var(--color-text-tertiary)]" />
      <div className="flex flex-col gap-1.5 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{s.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
