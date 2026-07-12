"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { RequetesTable } from "@/components/dashboard/RequetesTable";
import { Spinner } from "@/components/ui";
import { useMesRequetes } from "@/hooks/useMesRequetes";
import { STATUT_TO_FILTRE, type StatutFiltre } from "@/lib/constants";

export default function RequetesPage() {
  const { requetes, isLoading, error } = useMesRequetes();
  const [filtreActif, setFiltreActif] = useState<StatutFiltre | null>(null);

  const stats = useMemo(() => {
    const counts: Record<StatutFiltre, number> = {
      EN_ATTENTE: 0,
      EN_COURS: 0,
      RESOLUE: 0,
      REJETE: 0,
    };

    requetes.forEach((r) => {
      counts[STATUT_TO_FILTRE[r.statut]] += 1;
    });

    return {
      total: requetes.length,
      enAttente: counts.EN_ATTENTE,
      enCours: counts.EN_COURS,
      resolues: counts.RESOLUE,
      rejetees: counts.REJETE,
    };
  }, [requetes]);

  return (
    <>
      <Header title="Mes requêtes" showNewRequestButton />

      <main className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
        {isLoading ? (
          <Spinner label="Chargement de vos requêtes…" />
        ) : error ? (
          <p className="rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-[var(--color-cream-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">Total</p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-cream-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">En attente</p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--color-amber)]">{stats.enAttente}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-cream-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">En cours</p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--color-brand)]">{stats.enCours}</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-cream-line)] bg-white p-4">
                <p className="text-sm text-[var(--color-ink-muted)]">Traitées</p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--color-success)]">{stats.resolues + stats.rejetees}</p>
              </div>
            </div>

            <RequetesTable
              requetes={requetes}
              filtreActif={filtreActif}
              onToggleFiltre={setFiltreActif}
            />
          </>
        )}
      </main>
    </>
  );
}
