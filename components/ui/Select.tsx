import { type SelectHTMLAttributes, forwardRef, useId } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, id, className = "", children, ...props }, ref) => {
    const reactId = useId();
    const selectId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={`
            h-12 w-full rounded-xl border px-4 text-sm appearance-none
            bg-[var(--color-surface)]
            text-[var(--color-text-primary)]
            focus-visible:outline-none focus-visible:ring-2
            transition-colors
            ${
              error
                ? "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20"
                : "border-[var(--color-border)] focus-visible:border-[var(--color-interactive)] focus-visible:ring-[var(--color-interactive)]/20"
            }
            ${className}
          `}
          aria-describedby={
            error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
          }
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>

        {error && (
          <p id={`${selectId}-error`} role="alert" className="text-xs text-[var(--color-error)]">
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={`${selectId}-hint`} className="text-xs text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
