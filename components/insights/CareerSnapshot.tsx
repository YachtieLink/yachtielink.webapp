'use client'

import { formatSeaTime } from '@/lib/sea-time'

interface CareerSnapshotProps {
  seaTimeDays: number
  yachtCount: number
  certCount: number
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 bg-[var(--color-surface)] rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-[var(--color-text-primary)]">{value}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}

export function CareerSnapshot({ seaTimeDays, yachtCount, certCount }: CareerSnapshotProps) {
  const seaTimeDisplay = seaTimeDays > 0 ? formatSeaTime(seaTimeDays).displayShort : '0'

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
        Your Professional Footprint
      </h2>
      <div className="flex gap-2">
        <StatCard value={seaTimeDisplay} label="Sea Time" />
        <StatCard value={String(yachtCount)} label="Yachts" />
        <StatCard value={String(certCount)} label="Certs" />
      </div>
    </div>
  )
}
