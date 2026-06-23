import { STATUT_COLOR_VARS, STATUT_LABELS } from "@/lib/constants";
import type { StatutRequete } from "@/types";

interface StatusBadgeProps {
  statut: StatutRequete;
  className?: string;
}

export function StatusBadge({ statut, className }: StatusBadgeProps) {
  const { fg, bg } = STATUT_COLOR_VARS[statut];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${className ?? ""}`}
      style={{ color: fg, backgroundColor: bg }}
    >
      {STATUT_LABELS[statut]}
    </span>
  );
}
