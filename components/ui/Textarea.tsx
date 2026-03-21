import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className = "", ...props }, ref) => {
    const reactId = useId();
    const textareaId = id ?? reactId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full min-h-[120px] rounded-xl border px-4 py-3 text-sm
            bg-[var(--color-surface)]
            text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-tertiary)]
            focus-visible:outline-none focus-visible:ring-2
            transition-colors resize-y
            ${
              error
                ? "border-[var(--color-error)] focus-visible:border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20"
                : "border-[var(--color-border)] focus-visible:border-[var(--color-interactive)] focus-visible:ring-[var(--color-interactive)]/20"
            }
            ${className}
          `}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          aria-invalid={error ? true : undefined}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} role="alert" className="text-xs text-[var(--color-error)]">
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={`${textareaId}-hint`} className="text-xs text-[var(--color-text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
