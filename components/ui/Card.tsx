import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Add a hover/press state — useful for tappable cards */
  interactive?: boolean;
}

export function Card({
  interactive = false,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-[var(--color-border)]
        bg-[var(--color-surface-raised)] p-4
        ${interactive ? "cursor-pointer transition-colors hover:bg-[var(--color-surface-overlay)] active:scale-[0.99]" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-3 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-sm font-semibold text-[var(--color-text-primary)] ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`text-sm text-[var(--color-text-secondary)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
