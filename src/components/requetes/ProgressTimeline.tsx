import { Check } from "lucide-react";
import { TIMELINE_STEPS } from "@/lib/constants";
import type { HistoriqueStatutEntry, StatutRequete } from "@/types";
import { formatDate, nomComplet } from "@/lib/format";

interface ProgressTimelineProps {
  statut: StatutRequete;
  historique?: HistoriqueStatutEntry[];
}

export function ProgressTimeline({ statut, historique }: ProgressTimelineProps) {
  const etapeActiveIndex = TIMELINE_STEPS.findIndex((step) => step.statuts.includes(statut));
  const estRejetee = statut === "REJETEE";

  if (estRejetee) {
    const entreeRejet = historique?.find((h) => h.nouveau_statut === "REJETEE");
    return (
      <div className="rounded-lg bg-[var(--color-status-rejetee-bg)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--color-status-rejetee)]">
          Cette requête a été rejetée.
        </p>
        {entreeRejet?.motif && (
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Motif : {entreeRejet.motif}
          </p>
        )}
        {entreeRejet && (
          <p className="text-xs text-[var(--color-ink-faint)] mt-2">
            Par {nomComplet(entreeRejet.nom, entreeRejet.prenom)} le {formatDate(entreeRejet.date)}
          </p>
        )}
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-6">
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index < etapeActiveIndex;
        const isActive = index === etapeActiveIndex;
        const isLast = index === TIMELINE_STEPS.length - 1;
        return (
          <li key={step.key} className="flex items-start gap-4 relative">
            {!isLast && (
              <span
                className="absolute left-[9px] top-6 w-0.5 h-[calc(100%-0.5rem)]"
                style={{
                  backgroundColor: isDone ? "var(--color-success)" : "var(--color-cream-line)",
                }}
              />
            )}
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10"
              style={{
                backgroundColor:
                  isDone || isActive ? "var(--color-success)" : "var(--color-ink-faint)",
              }}
            >
              {isDone && <Check size={12} className="text-white" />}
            </span>
            <div className="pb-2">
              <p
                className={`font-bold ${
                  isDone || isActive ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"
                }`}
              >
                {step.label}
              </p>
              {isActive && (
                <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">Étape actuelle</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
