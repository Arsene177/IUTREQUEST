"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] disabled:opacity-50",
  secondary:
    "bg-[var(--color-canvas-soft)] text-[var(--color-ink)] hover:bg-[var(--color-cream-line)] disabled:opacity-50",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 disabled:opacity-50",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-canvas-soft)] disabled:opacity-50",
  outline:
    "bg-transparent border border-[var(--color-cream-line)] text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)] disabled:opacity-50",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
