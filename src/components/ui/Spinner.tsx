import { Loader2 } from "lucide-react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-ink-muted)]">
      <Loader2 size={28} className="animate-spin text-[var(--color-brand)]" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
