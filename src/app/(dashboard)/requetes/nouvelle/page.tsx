"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { RequestTypeCard } from "@/components/requetes/RequestTypeCard";
import { TYPE_REQUETE_LABELS, TYPE_REQUETE_DESCRIPTIONS } from "@/lib/constants";

export default function NouvelleRequetePage() {
  return (
    <>
      <Header title="Tableau de bord" />

      <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-bold text-[var(--color-ink)] hover:opacity-70 transition mb-1"
        >
          <ArrowLeft size={20} />
          Nouvelle requête
        </Link>
        <p className="text-sm text-[var(--color-ink-muted)] ml-7 mb-8">
          Sélectionnez le type de requête à soumettre
        </p>

        <div className="flex flex-col gap-5">
          <RequestTypeCard
            title={TYPE_REQUETE_LABELS.correction_nom}
            description={TYPE_REQUETE_DESCRIPTIONS.correction_nom}
            href="/requetes/nouvelle/correction-nom"
          />
          <RequestTypeCard
            title={TYPE_REQUETE_LABELS.contestation_note}
            description={TYPE_REQUETE_DESCRIPTIONS.contestation_note}
            href="/requetes/nouvelle/contestation-note"
          />
          <RequestTypeCard
            title={TYPE_REQUETE_LABELS.effet_academique}
            description={TYPE_REQUETE_DESCRIPTIONS.effet_academique}
            href="/requetes/nouvelle/effet-academique"
          />
        </div>
      </main>
    </>
  );
}
