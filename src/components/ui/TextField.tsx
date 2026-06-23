import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold uppercase tracking-wide text-[var(--color-ink-muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "h-12 rounded-[var(--radius-control)] px-4 text-[var(--color-ink)] bg-[var(--color-canvas-soft)] border border-transparent",
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

TextField.displayName = "TextField";
