'use client';

interface DataPoint {
  day: string; // ISO date string
  count: number;
}

interface AnalyticsChartProps {
  data: DataPoint[];
  color?: string;
}

export function AnalyticsChart({ data, color = '#0D7377' }: AnalyticsChartProps) {
  if (!data.length) {
    return (
      <div className="h-16 flex items-end justify-center">
        <p className="text-xs text-[var(--muted-foreground)]">No data yet</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-px h-16" aria-hidden>
      {data.map((point, i) => {
        const heightPct = Math.max((point.count / max) * 100, point.count > 0 ? 8 : 2);
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${heightPct}%`,
              backgroundColor: point.count > 0 ? color : 'var(--muted)',
              opacity: point.count > 0 ? 1 : 0.3,
            }}
            title={`${point.day}: ${point.count}`}
          />
        );
      })}
    </div>
  );
}
