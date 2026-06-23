import { forwardRef, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, className, id, rows = 4, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-[var(--color-ink)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={clsx(
            "rounded-[var(--radius-control)] px-4 py-3 text-[var(--color-ink)] bg-[var(--color-canvas-soft)] border border-transparent resize-none",
            "placeholder:text-[var(--color-ink-faint)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:bg-white",
            error && "ring-2 ring-[var(--color-danger)] bg-white",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {hint && !error && (
          <p className="text-xs text-[var(--color-ink-faint)]">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";
