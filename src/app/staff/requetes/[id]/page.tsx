"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { fetchRequeteDetails, transitionRequete, exporterContestationCsv, telechargerDocument } from "@/lib/staffService";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle, Clock, XCircle, Play, Info, Download, FileText } from "lucide-react";
import Link from "next/link";
import { CIBLES_ACHEMINEMENT } from "@/lib/constants";
import type { DocumentEntry } from "@/types";

export default function RequeteDetail() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetchRequeteDetails(params.id as string);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du chargement des détails");
    }
  };

  useEffect(() => {
    if (!isLoading && (!user || !['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'].includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchDetails();
    }
  }, [user, params.id]);

  const handleTransition = async (action: string, body?: Record<string, unknown>) => {
    if (!window.confirm(`Voulez-vous vraiment effectuer l'action : ${action} ?`)) return;
    setIsProcessing(true);
    setError("");
    setSuccess("");
    try {
      const res = await transitionRequete(params.id as string, action, body);
      setSuccess(res.message);
      await fetchDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || `Erreur lors de l'action ${action}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejeter = () => {
    const motif = window.prompt("Motif du rejet (obligatoire) :");
    if (!motif?.trim()) return;
    handleTransition("rejeter", { motif: motif.trim() });
  };

  const handleDemanderInfo = () => {
    const info = window.prompt("Quelle information est requise ?");
    if (!info?.trim()) return;
    handleTransition("demander-info", { info_requise: info.trim() });
  };

  const handleAcheminer = (serviceCible: string) => {
    handleTransition("acheminer", { service_cible: serviceCible });
  };

  const handleExportCsv = async () => {
    try {
      await exporterContestationCsv(params.id as string);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de l'export du CSV");
    }
  };

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      EN_ATTENTE: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
      EN_COURS: "bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400",
      ATTENTE_INFO: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400",
      VALIDEE: "bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400",
      EN_EXECUTION: "bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400",
      REJETEE: "bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400",
      ANNULEE: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
      CLOTUREE: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${styles[statut] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
        {statut?.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading || !data) return <StaffLayout title="Requêtes"><div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div></StaffLayout>;

  const { requete, details, historique, etudiant, documents } = data;

  const showReceptionner =
    requete.statut === "EN_ATTENTE" &&
    (user?.role === "secretariat" ||
      (user?.role === "departement" && requete.type === "contestation_note"));
  const cibles = CIBLES_ACHEMINEMENT[requete.type] ?? [];
  const showAcheminer =
    requete.statut === "EN_COURS" &&
    cibles.length > 0 &&
    ["secretariat", "departement"].includes(user?.role || "");
  // Le département exporte le dossier en CSV pour le transmettre à
  // l'enseignant concerné, une fois la contestation réceptionnée.
  const showExportCsv =
    requete.type === "contestation_note" &&
    ["EN_COURS", "ATTENTE_INFO"].includes(requete.statut) &&
    user?.role === "departement";
  const showValider =
    ["EN_COURS", "ATTENTE_INFO"].includes(requete.statut) &&
    ["directeur", "directeur_adjoint", "departement"].includes(user?.role || "");
  const showRejeter =
    ["EN_COURS", "ATTENTE_INFO"].includes(requete.statut) &&
    user?.role !== "cellule_informatique";
  const showDemanderInfo = requete.statut === "EN_COURS";
  const showExecuter =
    requete.statut === "VALIDEE" &&
    ["cellule_informatique", "scolarite"].includes(user?.role || "");
  const showCloturer =
    ["EN_EXECUTION", "VALIDEE", "REJETEE"].includes(requete.statut) &&
    ["scolarite", "secretariat", "cellule_informatique"].includes(user?.role || "");

  return (
    <StaffLayout title="Requêtes">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/staff/requetes" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
                <span>Requête #{requete.id}</span>
                {getStatusBadge(requete.statut)}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">{requete.type.replace('_', ' ')}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-900 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {!!requete.en_retard && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              Ce dossier est <strong>en retard</strong> : {requete.jours_ecoules} jours écoulés depuis le dépôt, au-delà du délai indicatif pour ce type de requête.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date de dépôt</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(requete.date_depot).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Priorité</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${requete.priorite === 'urgente' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                    {requete.priorite}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Informations spécifiques</h4>
                {details ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                    {Object.entries(details).map(([key, value]) => {
                      if (key === 'id' || key === 'requete_id') return null;
                      return (
                        <div key={key}>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{value as string || 'Non renseigné'}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun détail supplémentaire.</p>
                )}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions de traitement</h3>
              <div className="flex flex-wrap gap-3">
                {showReceptionner && (
                  <button onClick={() => handleTransition('receptionner')} disabled={isProcessing} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> <span>Réceptionner</span>
                  </button>
                )}
                {showExportCsv && (
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> <span>Exporter CSV (pour l&apos;enseignant)</span>
                  </button>
                )}
                {showAcheminer && cibles.map((cible) => (
                  <button
                    key={cible.value}
                    onClick={() => handleAcheminer(cible.value)}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" /> <span>Acheminer vers {cible.label}</span>
                  </button>
                ))}
                {showValider && (
                  <button onClick={() => handleTransition('valider')} disabled={isProcessing} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> <span>Valider</span>
                  </button>
                )}
                {showExecuter && (
                  <button onClick={() => handleTransition('executer')} disabled={isProcessing} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <Play className="w-4 h-4" />
                    <span>
                      {requete.type === 'effet_academique' ? 'Lancer le traitement manuel' : 'Mettre en exécution'}
                    </span>
                  </button>
                )}
                {showCloturer && (
                  <button onClick={() => handleTransition('cloturer')} disabled={isProcessing} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> <span>Clôturer</span>
                  </button>
                )}
                {showDemanderInfo && (
                  <button onClick={handleDemanderInfo} disabled={isProcessing} className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <Info className="w-4 h-4" /> <span>Demander Info</span>
                  </button>
                )}
                {showRejeter && (
                  <button onClick={handleRejeter} disabled={isProcessing} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> <span>Rejeter</span>
                  </button>
                )}
                
                {!showReceptionner && !showAcheminer && !showValider && !showExecuter && !showCloturer && !showDemanderInfo && !showRejeter && !showExportCsv && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucune action disponible pour votre rôle à cette étape.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 text-gray-100 border-b border-gray-700 pb-2">Informations Étudiant</h3>
              {etudiant ? (
                <>
                  <p className="font-medium text-lg">{etudiant.prenom} {etudiant.nom}</p>
                  <p className="text-sm text-gray-400 mt-1">{etudiant.matricule}</p>
                  <p className="text-sm text-gray-400">{etudiant.email}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Étudiant #{requete.etudiant_id}</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span>Documents joints</span>
              </h3>
              {!documents || documents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucun document joint.</p>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc: DocumentEntry) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{doc.nom}</span>
                      <button
                        type="button"
                        onClick={() =>
                          telechargerDocument(requete.id, doc.id, doc.nom).catch(() =>
                            setError("Impossible de télécharger ce document.")
                          )
                        }
                        aria-label={`Télécharger ${doc.nom}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <span>Historique</span>
              </h3>
              <div className="relative pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-6">
                {historique?.map((hist: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900"></div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{new Date(hist.date).toLocaleString('fr-FR')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {hist.ancien_statut ? `${hist.ancien_statut} → ` : ''}
                      <span className="text-blue-600 dark:text-blue-400">{hist.nouveau_statut}</span>
                    </p>
                    {hist.commentaire && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{hist.commentaire}</p>}
                    {hist.nom && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Par {hist.prenom} {hist.nom} ({hist.role})</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
