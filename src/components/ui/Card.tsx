import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-card)] bg-[var(--color-cream)] shadow-sm",
        className
      )}
      {...rest}
    />
  );
}
