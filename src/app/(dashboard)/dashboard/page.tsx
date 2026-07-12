"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { RequetesTable } from "@/components/dashboard/RequetesTable";
import { Spinner } from "@/components/ui";
import { useMesRequetes } from "@/hooks/useMesRequetes";
import { STATUT_TO_FILTRE, type StatutFiltre } from "@/lib/constants";

export default function DashboardPage() {
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
      <Header title="Tableau de bord" showNewRequestButton />

      <main className="px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
        {isLoading ? (
          <Spinner label="Chargement de vos requêtes…" />
        ) : error ? (
          <p className="rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard value={stats.total} label="Totaux" accentColor="var(--color-brand)" />
              <StatCard
                value={stats.enAttente}
                label="En attentes"
                accentColor="var(--color-status-attente)"
              />
              <StatCard
                value={stats.enCours}
                label="En cours"
                accentColor="var(--color-status-cours)"
              />
              <StatCard
                value={stats.resolues}
                label="Résolues"
                accentColor="var(--color-status-validee)"
              />
              <StatCard
                value={stats.rejetees}
                label="Rejetés"
                accentColor="var(--color-status-rejetee)"
              />
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
