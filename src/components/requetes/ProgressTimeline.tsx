import { Check } from "lucide-react";
import { TIMELINE_STEPS } from "@/lib/constants";
import type { HistoriqueStatutEntry, StatutRequete } from "@/types";
import { formatDate, nomComplet } from "@/lib/format";

interface ProgressTimelineProps {
  statut: StatutRequete;
  historique?: HistoriqueStatutEntry[];
}

export function ProgressTimeline({ statut, historique }: ProgressTimelineProps) {
  // Chaque étape liste tous les statuts "au moins atteints" (cumulatif) :
  // un statut avancé (ex: CLOTUREE) apparaît donc dans les 4 étapes à la
  // fois. findIndex() renvoie la PREMIÈRE étape qui matche — toujours
  // "Dépôt de la requête" — au lieu de la dernière, qui est la vraie étape
  // atteinte. Il faut chercher la dernière correspondance, pas la première.
  let etapeActiveIndex = -1;
  for (let i = TIMELINE_STEPS.length - 1; i >= 0; i--) {
    if (TIMELINE_STEPS[i].statuts.includes(statut)) {
      etapeActiveIndex = i;
      break;
    }
  }
  const estRejetee = statut === "REJETEE";
  const estAnnulee = statut === "ANNULEE";
  // CLOTUREE est un état terminal : la dernière étape n'est plus "en cours",
  // elle est bel et bien terminée (coche verte, pas juste surlignée).
  const estTerminee = statut === "CLOTUREE";

  if (estRejetee || estAnnulee) {
    const nouveauStatutRecherche = estRejetee ? "REJETEE" : "ANNULEE";
    const entree = historique?.find((h) => h.nouveau_statut === nouveauStatutRecherche);
    return (
      <div
        className="rounded-lg px-4 py-3"
        style={{
          backgroundColor: estRejetee ? "var(--color-status-rejetee-bg)" : "var(--color-canvas-soft)",
        }}
      >
        <p
          className="text-sm font-bold"
          style={{ color: estRejetee ? "var(--color-status-rejetee)" : "var(--color-ink-muted)" }}
        >
          {estRejetee ? "Cette requête a été rejetée." : "Cette requête a été annulée par l'étudiant."}
        </p>
        {entree?.motif && (
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Motif : {entree.motif}
          </p>
        )}
        {entree && (
          <p className="text-xs text-[var(--color-ink-faint)] mt-2">
            Par {nomComplet(entree.nom, entree.prenom)} le {formatDate(entree.date)}
          </p>
        )}
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-6">
      {TIMELINE_STEPS.map((step, index) => {
        const isDone = index < etapeActiveIndex || (estTerminee && index === etapeActiveIndex);
        const isActive = index === etapeActiveIndex && !estTerminee;
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
