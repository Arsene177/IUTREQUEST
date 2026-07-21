"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { fetchRequeteDetails, transitionRequete, downloadDocument } from "@/lib/staffService";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, XCircle, Play, Info, FileText, Download } from "lucide-react";
import Link from "next/link";
import { formatTailleFichier } from "@/lib/format";

export default function RequeteDetail() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = useState<number | null>(null);

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

  const handleTelechargerDocument = async (docId: number, nomFichier: string) => {
    setTelechargementEnCours(docId);
    try {
      await downloadDocument(params.id as string, docId, nomFichier);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de télécharger ce document");
    } finally {
      setTelechargementEnCours(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      EN_ATTENTE: "bg-gray-100 text-gray-800",
      EN_COURS: "bg-blue-100 text-blue-800",
      ATTENTE_INFO: "bg-yellow-100 text-yellow-800",
      VALIDEE: "bg-green-100 text-green-800",
      EN_EXECUTION: "bg-purple-100 text-purple-800",
      REJETEE: "bg-red-100 text-red-800",
      CLOTUREE: "bg-emerald-100 text-emerald-800"
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${styles[statut] || 'bg-gray-100 text-gray-800'}`}>
        {statut?.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading || !data) return <StaffLayout><div className="p-8 text-center text-gray-500">Chargement...</div></StaffLayout>;

  const { requete, details, historique, etudiant, documents } = data;

  const AUTRES_ROLES_VALIDATION = ["directeur", "directeur_adjoint", "departement", "scolarite", "cellule_informatique"];
  const estSecretariat = user?.role === "secretariat";
  const estDepartementContestation = user?.role === "departement" && requete.type === "contestation_note";

  // Le département ne réceptionne plus séparément — c'est toujours nécessaire pour
  // prendre en charge une contestation de note fraîchement soumise (EN_ATTENTE).
  const showReceptionner =
    requete.statut === "EN_ATTENTE" && user?.role === "departement" && requete.type === "contestation_note";

  // Secrétariat : "Valider et acheminer" fusionne réception + acheminement automatique,
  // disponible dès EN_ATTENTE (plus de bouton "Réceptionner" séparé) et tant que EN_COURS.
  const showValiderEtAcheminer =
    estSecretariat && ["EN_ATTENTE", "EN_COURS"].includes(requete.statut);
  const showDemanderInfoSecretariat = estSecretariat && ["EN_ATTENTE", "EN_COURS"].includes(requete.statut);
  const showEnAttenteEtudiant = estSecretariat && requete.statut === "ATTENTE_INFO";

  const showValider =
    !estSecretariat &&
    ["EN_COURS", "ATTENTE_INFO"].includes(requete.statut) &&
    AUTRES_ROLES_VALIDATION.includes(user?.role || "");
  const showRejeter =
    !estSecretariat &&
    !estDepartementContestation &&
    ["EN_COURS", "ATTENTE_INFO"].includes(requete.statut) &&
    AUTRES_ROLES_VALIDATION.includes(user?.role || "");
  const showDemanderInfo =
    !estSecretariat &&
    !estDepartementContestation &&
    requete.statut === "EN_COURS" &&
    AUTRES_ROLES_VALIDATION.includes(user?.role || "");
  const showExecuter =
    requete.statut === "VALIDEE" &&
    ["cellule_informatique", "scolarite"].includes(user?.role || "");
  const showCloturer =
    ["EN_EXECUTION", "VALIDEE", "REJETEE"].includes(requete.statut) &&
    ["scolarite", "cellule_informatique"].includes(user?.role || "");

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/staff/requetes" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <span>Requête #{requete.id}</span>
                {getStatusBadge(requete.statut)}
              </h1>
              <p className="text-gray-500 mt-1 capitalize">{requete.type.replace('_', ' ')}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de la demande</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date de dépôt</p>
                  <p className="font-medium text-gray-900">{new Date(requete.date_depot).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priorité</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${requete.priorite === 'urgente' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {requete.priorite}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Informations spécifiques</h4>
                {details ? (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {Object.entries(details).map(([key, value]) => {
                      if (key === 'id' || key === 'requete_id') return null;
                      return (
                        <div key={key}>
                          <p className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium text-gray-900">{value as string || 'Non renseigné'}</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun détail supplémentaire.</p>
                )}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions de traitement</h3>
              <div className="flex flex-wrap gap-3">
                {showReceptionner && (
                  <button onClick={() => handleTransition('receptionner')} disabled={isProcessing} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> <span>Réceptionner</span>
                  </button>
                )}
                {showValiderEtAcheminer && (
                  <button onClick={() => handleTransition('valider-et-acheminer')} disabled={isProcessing} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> <span>Valider et acheminer</span>
                  </button>
                )}
                {showDemanderInfoSecretariat && (
                  <button onClick={handleDemanderInfo} disabled={isProcessing} className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <Info className="w-4 h-4" /> <span>Demander des informations</span>
                  </button>
                )}
                {showEnAttenteEtudiant && (
                  <button disabled className="flex items-center space-x-2 bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium cursor-not-allowed">
                    <Clock className="w-4 h-4" /> <span>En attente de l&apos;étudiant</span>
                  </button>
                )}
                {showValider && (
                  <button onClick={() => handleTransition('valider')} disabled={isProcessing} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" />
                    <span>{estDepartementContestation ? "Transmettre à la cellule informatique" : "Valider"}</span>
                  </button>
                )}
                {showExecuter && (
                  <button onClick={() => handleTransition('executer')} disabled={isProcessing} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <Play className="w-4 h-4" /> <span>Mettre en exécution</span>
                  </button>
                )}
                {showCloturer && (
                  <button onClick={() => handleTransition('cloturer')} disabled={isProcessing} className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <CheckCircle className="w-4 h-4" /> <span>Clôturer</span>
                  </button>
                )}
                {showDemanderInfo && (
                  <button onClick={handleDemanderInfo} disabled={isProcessing} className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <Info className="w-4 h-4" /> <span>Demander des informations</span>
                  </button>
                )}
                {showRejeter && (
                  <button onClick={handleRejeter} disabled={isProcessing} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> <span>Rejeter</span>
                  </button>
                )}

                {!showReceptionner && !showValiderEtAcheminer && !showDemanderInfoSecretariat && !showEnAttenteEtudiant && !showValider && !showExecuter && !showCloturer && !showDemanderInfo && !showRejeter && (
                  <p className="text-sm text-gray-500 italic">Aucune action disponible pour votre rôle à cette étape.</p>
                )}
              </div>
            </div>

            {/* Documents fournis par l'étudiant */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Documents fournis par l&apos;étudiant
              </h3>
              {documents && documents.length > 0 ? (
                <ul className="space-y-2">
                  {documents.map((doc: { id: number; nom: string; taille: number; uploaded_at: string }) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.nom}</p>
                        <p className="text-xs text-gray-500">
                          {formatTailleFichier(doc.taille)} — {new Date(doc.uploaded_at).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleTelechargerDocument(doc.id, doc.nom)}
                        disabled={telechargementEnCours === doc.id}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50 flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        <span>Télécharger</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Aucun document fourni pour cette requête.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl shadow-sm p-6 text-white">
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span>Historique</span>
              </h3>
              <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                {historique?.map((hist: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></div>
                    <p className="text-xs text-gray-500 mb-1">{new Date(hist.date).toLocaleString('fr-FR')}</p>
                    <p className="text-sm font-medium text-gray-900">
                      {hist.ancien_statut ? `${hist.ancien_statut} → ` : ''}
                      <span className="text-blue-600">{hist.nouveau_statut}</span>
                    </p>
                    {hist.commentaire && <p className="text-sm text-gray-600 mt-1">{hist.commentaire}</p>}
                    {hist.nom && <p className="text-xs text-gray-400 mt-1">Par {hist.prenom} {hist.nom} ({hist.role})</p>}
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
