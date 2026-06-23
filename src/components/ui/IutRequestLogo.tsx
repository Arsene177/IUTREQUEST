import clsx from "clsx";

interface IutRequestLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { badge: "w-8 h-8 text-sm", word: "text-lg" },
  md: { badge: "w-11 h-11 text-base", word: "text-2xl" },
  lg: { badge: "w-14 h-14 text-lg", word: "text-3xl" },
};

export function IutRequestLogo({ size = "md", showWordmark = true, className }: IutRequestLogoProps) {
  const s = SIZE_CLASSES[size];
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div
        className={clsx(
          "flex items-center justify-center rounded-xl bg-[var(--color-brand)] text-white font-extrabold flex-shrink-0",
          s.badge
        )}
      >
        IR
      </div>
      {showWordmark && (
        <span className={clsx("font-extrabold text-[var(--color-brand)] tracking-tight", s.word)}>
          IUTRequest
        </span>
      )}
    </div>
  );
}
