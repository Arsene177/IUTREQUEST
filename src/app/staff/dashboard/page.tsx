"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { fetchStaffStats, StaffStats } from "@/lib/staffService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LayoutDashboard, FileText, CheckCircle, Clock, AlertCircle, AlertTriangle, TrendingUp, XCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { STATUT_CONFIG, TYPE_CONFIG } from "@/lib/constants";

const labelEtape = (etape: string) =>
  STATUT_CONFIG[etape as keyof typeof STATUT_CONFIG]?.label ?? etape.replace('_', ' ');
const labelType = (type: string) =>
  TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]?.label ?? type.replace('_', ' ');

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [error, setError] = useState<string>("");
  const chartGridColor = theme === "dark" ? "#374151" : "#E5E7EB";
  const chartTickColor = theme === "dark" ? "#9CA3AF" : "#6B7280";

  useEffect(() => {
    if (!isLoading && (!user || !['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'].includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStaffStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Erreur lors du chargement des statistiques");
      }
    };
    if (user) {
      loadStats();
    }
  }, [user]);

  if (isLoading || !user) return <StaffLayout title="Tableau de bord"><div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement...</div></StaffLayout>;

  const getTotalCount = () => {
    if (!stats) return 0;
    return stats.byStatus.reduce((acc, curr) => acc + curr.count, 0);
  };

  const getStatusCount = (statut: string) => {
    if (!stats) return 0;
    const item = stats.byStatus.find((s) => s.statut === statut);
    return item ? item.count : 0;
  };

  return (
    <StaffLayout title="Tableau de bord">
      <div className="space-y-6 max-w-7xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <LayoutDashboard className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">Tableau de bord</h1>
          </div>
          <button
            onClick={() => router.push('/staff/requetes')}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            Voir les requêtes
          </button>
        </header>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary Cards — cliquables : renvoient vers /staff/requetes
            pré-filtrée par statut, pour retrouver rapidement "toutes les
            requêtes résolues", etc. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <button
            type="button"
            onClick={() => router.push('/staff/requetes')}
            className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requêtes</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{getTotalCount()}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?retard=1')}
            className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md hover:border-red-200 dark:hover:border-red-800 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En retard</p>
              <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats?.enRetard ?? 0}</h3>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=EN_ATTENTE')}
            className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Attente</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{getStatusCount('EN_ATTENTE')}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=EN_COURS')}
            className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Cours</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{getStatusCount('EN_COURS')}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=CLOTUREE')}
            className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md hover:border-green-200 dark:hover:border-green-800 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Clôturées</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{getStatusCount('CLOTUREE')}</h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=REJETEE')}
            className="text-left bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejetées</p>
              <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{getStatusCount('REJETEE')}</h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolution Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Évolution sur 4 semaines</h3>
            <div className="h-80 w-full">
              {stats?.evolution ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.evolution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: chartTickColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `Sem. ${val}`}
                    />
                    <YAxis
                      tick={{ fill: chartTickColor, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: theme === "dark" ? "#1F2937" : "#F3F4F6" }}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        backgroundColor: theme === "dark" ? "#111827" : "#FFFFFF",
                        color: theme === "dark" ? "#F3F4F6" : "#111827",
                      }}
                    />
                    <Bar dataKey="total" name="Nouvelles requêtes" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">Aucune donnée</div>
              )}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Répartition par type</h3>
            <div className="space-y-4">
              {stats?.byType.map((t) => (
                <div key={t.type} className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{t.type.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{t.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(t.count / getTotalCount()) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {(!stats?.byType || stats.byType.length === 0) && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune donnée</div>
              )}
            </div>
          </div>
        </div>

        {/* Insights — identifie où le circuit ralentit, à partir du journal d'audit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Où les dossiers s&apos;accumulent
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Temps moyen passé à chaque étape avant de passer à la suivante
            </p>
            <div className="space-y-4">
              {stats?.tempsParEtape && stats.tempsParEtape.length > 0 ? (
                (() => {
                  const maxJours = Math.max(...stats.tempsParEtape.map((e) => Number(e.jours_moyen) || 0), 1);
                  return stats.tempsParEtape.map((e, idx) => {
                    const jours = Number(e.jours_moyen) || 0;
                    return (
                      <div key={e.etape} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            {idx === 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                            {labelEtape(e.etape)}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {jours.toFixed(1)} j
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${idx === 0 ? "bg-red-500" : "bg-indigo-500"}`}
                            style={{ width: `${Math.max((jours / maxJours) * 100, 4)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                  Pas encore assez de données (nécessite des transitions de statut).
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Délai moyen de traitement
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Du dépôt à la clôture, par type de requête
            </p>
            <div className="space-y-4">
              {stats?.delaiMoyenParType && stats.delaiMoyenParType.length > 0 ? (
                stats.delaiMoyenParType.map((d) => (
                  <div key={d.type} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{labelType(d.type)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{d.count} dossier(s) clôturé(s)</p>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {(Number(d.jours_moyen) || 0).toFixed(1)}
                      <span className="text-sm font-normal text-gray-400 dark:text-gray-500"> j</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                  Aucun dossier clôturé pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}