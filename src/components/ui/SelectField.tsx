import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, placeholder, className, id, ...rest }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={clsx(
              "h-12 w-full appearance-none rounded-[var(--radius-control)] px-4 pr-10 text-[var(--color-ink)] bg-[var(--color-canvas-soft)] border border-transparent",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:bg-white",
              error && "ring-2 ring-[var(--color-danger)] bg-white",
              className
            )}
            aria-invalid={!!error}
            defaultValue=""
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
