import { cn } from "@/lib/utils";
import type { SectionColor } from "@/lib/section-colors";

type ColorScheme =
  | SectionColor
  | "success"
  | "warning"
  | "destructive"
  | "default";

interface SectionBadgeProps {
  children: React.ReactNode;
  colorScheme?: ColorScheme;
  className?: string;
}

const colorClasses: Record<ColorScheme, string> = {
  default:
    "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)]",
  teal: "bg-[var(--color-teal-100)] text-[var(--color-teal-700)]",
  coral: "bg-[var(--color-coral-100)] text-[var(--color-coral-700)]",
  navy: "bg-[var(--color-navy-100)] text-[var(--color-navy-700)]",
  amber: "bg-[var(--color-amber-100)] text-[var(--color-amber-700)]",
  sand: "bg-[var(--color-sand-100)] text-[var(--color-sand-400)]",
  success: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  destructive: "bg-[var(--color-error)]/15 text-[var(--color-error)]",
};

export function SectionBadge({
  children,
  colorScheme = "default",
  className,
}: SectionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses[colorScheme],
        className
      )}
    >
      {children}
    </span>
  );
}
