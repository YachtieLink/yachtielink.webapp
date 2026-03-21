import { useId } from "react";

interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  children,
}: FormFieldProps) {
  const reactId = useId();
  const fieldId = htmlFor ?? reactId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          {label}
          {required && (
            <span className="text-[var(--color-error)] ml-0.5">*</span>
          )}
        </label>
      )}

      {description && (
        <p className="text-xs text-[var(--color-text-tertiary)]">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p role="alert" className="text-xs text-[var(--color-error)]">
          {error}
        </p>
      )}
    </div>
  );
}
