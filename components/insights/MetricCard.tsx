'use client'

import { AnalyticsChart } from './AnalyticsChart'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

interface MetricCardProps {
  title: string
  value: number
  /** Previous period value for trend calculation */
  previousValue?: number
  data?: { day: string; count: number }[]
  /** Hero variant = full-width, large number */
  variant?: 'hero' | 'compact'
  /** Optional tooltip text for the metric title */
  tooltip?: string
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pctChange = Math.round(((current - previous) / previous) * 100)
  if (pctChange === 0) return null

  const isPositive = pctChange > 0
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(pctChange)}%
    </span>
  )
}

export function MetricCard({
  title,
  value,
  previousValue,
  data,
  variant = 'compact',
  tooltip,
}: MetricCardProps) {
  const isHero = variant === 'hero'

  return (
    <div className={`card-soft rounded-2xl p-4 ${isHero ? 'col-span-2' : ''}`}>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
          {title}
          {tooltip && <InfoTooltip text={tooltip} />}
        </p>
        <div className="flex items-baseline gap-2">
          {previousValue !== undefined && (
            <TrendIndicator current={value} previous={previousValue} />
          )}
          <span className={`font-bold text-[var(--color-text-primary)] ${isHero ? 'text-3xl' : 'text-2xl'}`}>
            {value.toLocaleString()}
          </span>
        </div>
      </div>
      {data && data.length > 0 && (
        <AnalyticsChart data={data} color="var(--color-coral-500)" />
      )}
    </div>
  )
}
