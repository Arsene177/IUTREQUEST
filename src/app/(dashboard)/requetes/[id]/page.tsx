"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProgressTimeline } from "@/components/requetes/ProgressTimeline";
import { Card, Button, StatusBadge, Spinner, FileDropzone } from "@/components/ui";
import { requetesApi } from "@/lib/api/requetes";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { formatDate, nomComplet } from "@/lib/format";
import { TYPE_REQUETE_LABELS } from "@/lib/constants";
import type { RequeteDetailResponse } from "@/types";

export default function RequeteDetailPage() {
  const params = useParams<{ id: string }>();
  const requeteId = Number(params.id);
  const router = useRouter();
  const { notify } = useToast();
  const { user } = useAuth();

  const idEstValide = Number.isFinite(requeteId);

  const [detail, setDetail] = useState<RequeteDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnulation, setIsAnnulation] = useState(false);
  const [fichierComplement, setFichierComplement] = useState<File | null>(null);
  const [isEnvoiComplement, setIsEnvoiComplement] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await requetesApi.detail(requeteId);
      setDetail(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de charger cette requête."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!idEstValide) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch initial au montage / changement d'id, pattern standard
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requeteId, idEstValide]);

  const handleAnnuler = async () => {
    setIsAnnulation(true);
    try {
      await requetesApi.annuler(requeteId);
      notify("Votre requête a été annulée.", "success");
      router.push("/dashboard");
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible d'annuler cette requête."), "error");
    } finally {
      setIsAnnulation(false);
    }
  };

  const handleEnvoiComplement = async () => {
    if (!fichierComplement) return;
    setIsEnvoiComplement(true);
    try {
      await requetesApi.fournirInfoManquante(requeteId, [fichierComplement]);
      notify("Document envoyé. Votre dossier repasse en traitement.", "success");
      setFichierComplement(null);
      await fetchDetail();
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible d'envoyer le document."), "error");
    } finally {
      setIsEnvoiComplement(false);
    }
  };

  return (
    <>
      <Header title="Tableau de bord" />

      <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 font-bold text-[var(--color-ink)] hover:opacity-70 transition mb-6"
        >
          <ChevronLeft size={20} />
          Mes requêtes
        </Link>

        {!idEstValide ? (
          <p className="rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            Identifiant de requête invalide.
          </p>
        ) : isLoading ? (
          <Spinner label="Chargement du dossier…" />
        ) : error || !detail ? (
          <p className="rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error ?? "Requête introuvable."}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <Card className="px-8 py-7">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-[var(--color-ink-muted)] uppercase">
                    Requête #{detail.requete.id}
                  </p>
                  <h1 className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">
                    {TYPE_REQUETE_LABELS[detail.requete.type]}
                  </h1>
                </div>
                <StatusBadge statut={detail.requete.statut} />
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--color-cream-line)]">
                <div>
                  <dt className="text-xs font-bold uppercase text-[var(--color-ink-muted)]">Étudiant</dt>
                  <dd className="text-sm text-[var(--color-ink)] mt-1">
                    {user ? nomComplet(user.nom, user.prenom) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-[var(--color-ink-muted)]">Déposée le</dt>
                  <dd className="text-sm text-[var(--color-ink)] mt-1">
                    {formatDate(detail.requete.date_depot)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-[var(--color-ink-muted)]">Priorité</dt>
                  <dd className="text-sm text-[var(--color-ink)] mt-1 capitalize">
                    {detail.requete.priorite}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-[var(--color-ink-muted)]">
                    Dernière mise à jour
                  </dt>
                  <dd className="text-sm text-[var(--color-ink)] mt-1">
                    {formatDate(detail.requete.updated_at)}
                  </dd>
                </div>
              </dl>

              {detail.requete.statut === "EN_ATTENTE" && (
                <div className="mt-6 pt-6 border-t border-[var(--color-cream-line)]">
                  <Button variant="danger" onClick={handleAnnuler} isLoading={isAnnulation}>
                    Annuler la requête
                  </Button>
                </div>
              )}
            </Card>

            <Card className="px-8 py-7">
              <h2 className="font-extrabold text-[var(--color-ink)] mb-5">Progression</h2>
              <ProgressTimeline statut={detail.requete.statut} historique={detail.historique} />
            </Card>

            {detail.requete.statut === "ATTENTE_INFO" && (
              <Card className="px-8 py-7">
                <h2 className="font-extrabold text-[var(--color-status-info)] mb-2">
                  Information complémentaire requise
                </h2>
                <p className="text-sm text-[var(--color-ink-muted)] mb-4">
                  Le service en charge de votre dossier a besoin d&apos;un document
                  supplémentaire pour poursuivre le traitement.
                </p>
                <FileDropzone
                  label="Document complémentaire"
                  value={fichierComplement}
                  onChange={setFichierComplement}
                />
                <Button
                  className="mt-4"
                  onClick={handleEnvoiComplement}
                  isLoading={isEnvoiComplement}
                  disabled={!fichierComplement}
                >
                  Envoyer le document
                </Button>
              </Card>
            )}

            {detail.historique.length > 0 && (
              <Card className="px-8 py-7">
                <h2 className="font-extrabold text-[var(--color-ink)] mb-4">Historique du dossier</h2>
                <ul className="flex flex-col gap-3">
                  {detail.historique.map((entry) => (
                    <li
                      key={entry.id}
                      className="text-sm text-[var(--color-ink-muted)] border-l-2 border-[var(--color-cream-line)] pl-4"
                    >
                      <p className="text-[var(--color-ink)] font-medium">
                        {entry.ancien_statut ? `${entry.ancien_statut} → ` : ""}
                        {entry.nouveau_statut}
                      </p>
                      <p className="text-xs mt-0.5">
                        {formatDate(entry.date, "dd/MM/yyyy HH:mm")} —{" "}
                        {nomComplet(entry.nom, entry.prenom)}
                      </p>
                      {entry.commentaire && <p className="text-xs mt-1">{entry.commentaire}</p>}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </main>
    </>
  );
}
