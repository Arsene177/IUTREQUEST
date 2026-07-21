"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { Suspense, useEffect, useState } from "react";
import { fetchStaffRequetes, transitionRequete, RequeteListItem } from "@/lib/staffService";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, AlertCircle, AlertTriangle, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { TYPE_CONFIG, TYPES_VISIBLES_PAR_ROLE } from "@/lib/constants";

/**
 * Actions groupables depuis la liste — un membre du staff avec 15 dossiers
 * EN_ATTENTE à réceptionner ne devrait pas avoir à ouvrir chaque fiche une
 * par une. Le backend reste l'arbitre final : chaque appel individuel est
 * revalidé (rôle, statut, requête concernée) exactement comme une action
 * faite depuis la fiche de détail — une sélection mélangeant des dossiers
 * inéligibles se solde par des échecs partiels rapportés à l'utilisateur,
 * jamais par un bypass des règles métier.
 */
const ACTIONS_GROUPEES: { action: string; label: string; needsMotif?: boolean }[] = [
  { action: "receptionner", label: "Réceptionner" },
  { action: "valider", label: "Valider" },
  { action: "rejeter", label: "Rejeter", needsMotif: true },
  { action: "cloturer", label: "Clôturer" },
];

export default function StaffRequetesListPage() {
  return (
    <Suspense fallback={<StaffLayout title="Requêtes"><div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div></StaffLayout>}>
      <StaffRequetesList />
    </Suspense>
  );
}

function StaffRequetesList() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // Permet à un lien externe (ex: tableau de bord) de pré-filtrer la liste
  // via ?statut=... et/ou ?type=... — les cartes de stats du dashboard staff
  // pointent vers ces query params pour rendre les statuts "cliquables".
  const searchParams = useSearchParams();
  const [requetes, setRequetes] = useState<RequeteListItem[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statutFilter, setStatutFilter] = useState(() => searchParams.get("statut") ?? "");
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get("type") ?? "");
  const [retardFilter, setRetardFilter] = useState(() => searchParams.get("retard") === "1");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") ?? "");
  const [searchFilter, setSearchFilter] = useState(() => searchParams.get("search") ?? "");
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<string>("");

  // Debounce : on ne relance la recherche que 400ms après la dernière frappe.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchFilter(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!isLoading && (!user || !['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'].includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const data = await fetchStaffRequetes(page, limit, statutFilter, typeFilter, retardFilter, searchFilter);
        setRequetes(data.requetes);
        setTotalPages(data.pagination.pages);
        // La sélection ne doit pas survivre à un changement de page/filtre :
        // des ids sélectionnés qui ne sont plus affichés seraient trompeurs.
        setSelection(new Set());
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur lors du chargement des requêtes");
      } finally {
        setIsLoadingData(false);
      }
    };
    if (user) {
      loadData();
    }
  }, [user, page, limit, statutFilter, typeFilter, retardFilter, searchFilter]);

  const toggleSelection = (id: number) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelection((prev) =>
      prev.size === requetes.length ? new Set() : new Set(requetes.map((r) => r.id))
    );
  };

  const handleActionGroupee = async (action: string, needsMotif?: boolean) => {
    let motif = "";
    if (needsMotif) {
      const saisie = window.prompt(
        `Motif appliqué aux ${selection.size} requête(s) sélectionnée(s) :`
      );
      if (!saisie?.trim()) return;
      motif = saisie.trim();
    }
    if (
      !window.confirm(
        `Appliquer l'action "${action}" à ${selection.size} requête(s) sélectionnée(s) ?`
      )
    ) {
      return;
    }

    setIsBulkRunning(true);
    setBulkResult("");
    const body =
      action === "rejeter"
        ? { motif }
        : action === "demander-info"
          ? { info_requise: motif }
          : undefined;

    const results = await Promise.allSettled(
      Array.from(selection).map((id) => transitionRequete(id, action, body))
    );
    const reussies = results.filter((r) => r.status === "fulfilled").length;
    const echouees = results.length - reussies;

    setBulkResult(
      echouees === 0
        ? `${reussies} requête(s) traitée(s) avec succès.`
        : `${reussies} réussie(s), ${echouees} échouée(s) (statut ou droits incompatibles).`
    );
    setIsBulkRunning(false);
    setSelection(new Set());

    // Recharge la page courante pour refléter les nouveaux statuts.
    setIsLoadingData(true);
    try {
      const data = await fetchStaffRequetes(page, limit, statutFilter, typeFilter, retardFilter, searchFilter);
      setRequetes(data.requetes);
      setTotalPages(data.pagination.pages);
    } finally {
      setIsLoadingData(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      EN_ATTENTE: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      EN_COURS: "bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      ATTENTE_INFO: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      VALIDEE: "bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800",
      EN_EXECUTION: "bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      REJETEE: "bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800",
      ANNULEE: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      CLOTUREE: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[statut] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
        {statut.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  if (isLoading || !user) return <StaffLayout title="Requêtes"><div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div></StaffLayout>;

  return (
    <StaffLayout title="Requêtes">
      <div className="space-y-6 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion des Requêtes</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez et traitez les demandes des étudiants</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher (id, nom, matricule...)"
                className="pl-9 pr-4 py-2 w-56 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Tous les types</option>
                {(TYPES_VISIBLES_PAR_ROLE[user.role] ?? Object.keys(TYPE_CONFIG)).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <select
                value={statutFilter}
                onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="ATTENTE_INFO">Attente info</option>
                <option value="VALIDEE">Validée</option>
                <option value="EN_EXECUTION">En exécution</option>
                <option value="REJETEE">Rejetée</option>
                <option value="ANNULEE">Annulée</option>
                <option value="CLOTUREE">Clôturée</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => { setRetardFilter((v) => !v); setPage(1); }}
              aria-pressed={retardFilter}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                retardFilter
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              En retard
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {bulkResult && (
          <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 p-4 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{bulkResult}</span>
          </div>
        )}

        {/* Barre d'actions groupées — visible dès qu'au moins une ligne est sélectionnée */}
        {selection.size > 0 && (
          <div className="bg-gray-900 dark:bg-gray-800 rounded-xl px-5 py-3 flex flex-wrap items-center gap-3">
            <span className="text-white text-sm font-medium">
              {selection.size} sélectionnée{selection.size > 1 ? "s" : ""}
            </span>
            <div className="flex flex-wrap gap-2 ml-auto">
              {ACTIONS_GROUPEES.map(({ action, label, needsMotif }) => (
                <button
                  key={action}
                  type="button"
                  disabled={isBulkRunning}
                  onClick={() => handleActionGroupee(action, needsMotif)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {action === "rejeter" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelection(new Set())}
                className="text-white/70 hover:text-white text-sm px-2"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={requetes.length > 0 && selection.size === requetes.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Priorité</th>
                  <th className="px-6 py-4">Date de dépôt</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoadingData ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Chargement des requêtes...</td>
                  </tr>
                ) : requetes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Aucune requête trouvée</td>
                  </tr>
                ) : (
                  requetes.map((req) => (
                    <tr key={req.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!!req.en_retard ? "bg-red-50/50 dark:bg-red-500/5" : ""} ${selection.has(req.id) ? "bg-blue-50/50 dark:bg-blue-500/5" : ""}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner la requête #${req.id}`}
                          checked={selection.has(req.id)}
                          onChange={() => toggleSelection(req.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        <span className="inline-flex items-center gap-1.5">
                          {!!req.en_retard && (
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" aria-label="En retard" />
                          )}
                          #{req.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{req.etudiant_nom} {req.etudiant_prenom}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{req.matricule}</div>
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-700 dark:text-gray-300">{req.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${req.priorite === 'urgente' ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                          {req.priorite}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(req.date_depot)}
                        {!!req.en_retard && (
                          <span className="block text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
                            {req.jours_ecoules} jours écoulés
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(req.statut)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/staff/requetes/${req.id}`} className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                          <Eye className="w-4 h-4" />
                          <span>Traiter</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoadingData && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
