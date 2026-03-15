import { type InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Element rendered on the right side (e.g. a clear button) */
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, suffix, id, className = "", ...props }, ref) => {
    const reactId = useId();
    const inputId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`
              h-12 w-full rounded-xl border px-4 text-sm
              bg-[var(--color-surface)]
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-tertiary)]
              focus:outline-none focus:ring-2
              transition-colors
              ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-[var(--color-border)] focus:border-[var(--color-interactive)] focus:ring-[var(--color-interactive)]/20"
              }
              ${suffix ? "pr-10" : ""}
              ${className}
            `}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            aria-invalid={error ? true : undefined}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-[var(--color-text-tertiary)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
