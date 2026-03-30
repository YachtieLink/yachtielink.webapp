import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

interface ProfileAvatarProps {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const fallbackColors = [
  "bg-[var(--color-coral-200)]",
  "bg-[var(--color-navy-200)]",
  "bg-[var(--color-amber-200)]",
  "bg-[var(--color-teal-200)]",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileAvatar({
  name,
  src,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover object-top", sizeClass, className)}
      />
    );
  }

  const bgColor = fallbackColors[hashName(name) % fallbackColors.length];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium text-white",
        sizeClass,
        bgColor,
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
