"use client";

import { useRouter } from "next/navigation";
import { Card, StatusBadge } from "@/components/ui";
import { TYPE_REQUETE_LABELS, FILTRE_LABELS, STATUT_TO_FILTRE, type StatutFiltre } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Requete } from "@/types";

const FILTRES: StatutFiltre[] = ["EN_ATTENTE", "EN_COURS", "RESOLUE", "REJETE"];

interface RequetesTableProps {
  requetes: Requete[];
  filtreActif: StatutFiltre | null;
  onToggleFiltre: (filtre: StatutFiltre | null) => void;
}

export function RequetesTable({ requetes, filtreActif, onToggleFiltre }: RequetesTableProps) {
  const router = useRouter();
  const requetesAffichees = filtreActif
    ? requetes.filter((r) => STATUT_TO_FILTRE[r.statut] === filtreActif)
    : requetes;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <h2 className="text-lg font-extrabold text-[var(--color-ink)]">Mes requêtes</h2>
        <div className="flex flex-wrap gap-2">
          {FILTRES.map((f) => {
            const active = filtreActif === f;
            return (
              <button
                key={f}
                onClick={() => onToggleFiltre(active ? null : f)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase transition ${
                  active
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-canvas-soft)] text-[var(--color-ink-muted)] hover:bg-[var(--color-cream-line)]"
                }`}
              >
                {FILTRE_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      {requetesAffichees.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-[var(--color-ink-faint)]">
          Aucune requête {filtreActif ? `dans la catégorie « ${FILTRE_LABELS[filtreActif]} »` : "pour le moment"}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-t border-[var(--color-cream-line)] text-xs font-bold uppercase text-[var(--color-ink-muted)]">
                <th className="px-6 py-3 font-bold">N°</th>
                <th className="px-6 py-3 font-bold">Sujet</th>
                <th className="px-6 py-3 font-bold">Date</th>
                <th className="px-6 py-3 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {requetesAffichees.map((requete) => (
                <tr
                  key={requete.id}
                  onClick={() => router.push(`/requetes/${requete.id}`)}
                  className="border-t border-[var(--color-cream-line)] cursor-pointer hover:bg-[var(--color-cream-soft)] transition"
                >
                  <td className="px-6 py-4 font-bold text-[var(--color-ink)]">#{requete.id}</td>
                  <td className="px-6 py-4 text-[var(--color-ink)]">
                    {TYPE_REQUETE_LABELS[requete.type]}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-ink-muted)]">
                    {formatDate(requete.date_depot)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge statut={requete.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
