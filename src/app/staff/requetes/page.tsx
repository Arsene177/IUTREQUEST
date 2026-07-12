"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { fetchStaffRequetes, RequeteListItem } from "@/lib/staffService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Search, Filter, AlertCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function StaffRequetesList() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [requetes, setRequetes] = useState<RequeteListItem[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [statutFilter, setStatutFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'].includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const data = await fetchStaffRequetes(page, limit, statutFilter, typeFilter);
        setRequetes(data.requetes);
        setTotalPages(data.pagination.pages);
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur lors du chargement des requêtes");
      } finally {
        setIsLoadingData(false);
      }
    };
    if (user) {
      loadData();
    }
  }, [user, page, limit, statutFilter, typeFilter]);

  const getStatusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      EN_ATTENTE: "bg-gray-100 text-gray-800 border-gray-200",
      EN_COURS: "bg-blue-100 text-blue-800 border-blue-200",
      ATTENTE_INFO: "bg-yellow-100 text-yellow-800 border-yellow-200",
      VALIDEE: "bg-green-100 text-green-800 border-green-200",
      EN_EXECUTION: "bg-purple-100 text-purple-800 border-purple-200",
      REJETEE: "bg-red-100 text-red-800 border-red-200",
      CLOTUREE: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[statut] || 'bg-gray-100 text-gray-800'}`}>
        {statut.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  if (isLoading || !user) return <StaffLayout><div className="p-8 text-center text-gray-500">Chargement...</div></StaffLayout>;

  return (
    <StaffLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Requêtes</h1>
            <p className="text-gray-500 mt-1">Gérez et traitez les demandes des étudiants</p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Tous les types</option>
                <option value="effet_academique">Effet Académique</option>
                <option value="correction_nom">Correction de Nom</option>
                <option value="contestation_note">Contestation de Note</option>
              </select>
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statutFilter}
                onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="ATTENTE_INFO">Attente info</option>
                <option value="VALIDEE">Validée</option>
                <option value="EN_EXECUTION">En exécution</option>
                <option value="REJETEE">Rejetée</option>
                <option value="CLOTUREE">Clôturée</option>
              </select>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Priorité</th>
                  <th className="px-6 py-4">Date de dépôt</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingData ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Chargement des requêtes...</td>
                  </tr>
                ) : requetes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Aucune requête trouvée</td>
                  </tr>
                ) : (
                  requetes.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">#{req.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{req.etudiant_nom} {req.etudiant_prenom}</div>
                        <div className="text-gray-500 text-xs">{req.matricule}</div>
                      </td>
                      <td className="px-6 py-4 capitalize text-gray-700">{req.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${req.priorite === 'urgente' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {req.priorite}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(req.date_depot)}</td>
                      <td className="px-6 py-4">{getStatusBadge(req.statut)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/staff/requetes/${req.id}`} className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium">
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> sur <span className="font-medium">{totalPages}</span>
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-50"
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
