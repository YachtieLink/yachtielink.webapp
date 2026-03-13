/**
 * ProgressWheel
 *
 * Circular progress indicator used for profile completion milestones.
 * Two variants:
 *   - "A" (Sprint 3): profile setup milestones (5 steps)
 *   - "B" (Sprint 5): endorsements received (n/5)
 *
 * Accepts a value 0–max and renders an SVG ring.
 */

interface ProgressWheelProps {
  /** Completed steps */
  value: number;
  /** Total steps */
  max: number;
  /** Diameter in pixels */
  size?: number;
  /** Ring thickness in pixels */
  strokeWidth?: number;
  /** Central label (defaults to "value/max") */
  label?: React.ReactNode;
  /** Colour of the filled arc */
  colour?: string;
}

export function ProgressWheel({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  label,
  colour = "var(--color-interactive)",
}: ProgressWheelProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const dashOffset = circumference * (1 - progress);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>

      {/* Centre label */}
      <div className="absolute flex flex-col items-center justify-center">
        {label ?? (
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            {value}/{max}
          </span>
        )}
      </div>
    </div>
  );
}
