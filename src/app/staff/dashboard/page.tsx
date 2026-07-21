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
import { LayoutDashboard, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

type Periode = "aujourdhui" | "7j" | "30j" | "personnalise";

const PERIODE_OPTIONS: { value: Periode; label: string }[] = [
  { value: "aujourdhui", label: "Aujourd'hui" },
  { value: "7j", label: "7 derniers jours" },
  { value: "30j", label: "30 derniers jours" },
  { value: "personnalise", label: "Période personnalisée" },
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeRange(periode: Periode, dateDebut: string, dateFin: string): { from?: string; to?: string } {
  const today = new Date();
  if (periode === "aujourdhui") {
    const s = toISODate(today);
    return { from: s, to: s };
  }
  if (periode === "7j") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { from: toISODate(start), to: toISODate(today) };
  }
  if (periode === "30j") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { from: toISODate(start), to: toISODate(today) };
  }
  if (periode === "personnalise" && dateDebut && dateFin) {
    return { from: dateDebut, to: dateFin };
  }
  return {};
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [error, setError] = useState<string>("");
  const [periode, setPeriode] = useState<Periode>("30j");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'].includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (periode === "personnalise" && (!dateDebut || !dateFin)) return;
    if (!user) return;

    const loadStats = async () => {
      try {
        const { from, to } = computeRange(periode, dateDebut, dateFin);
        const data = await fetchStaffStats(from, to);
        console.log('stats reçues:', JSON.stringify(data, null, 2));
        setStats(data);
      } catch (err: any) {
        console.error('Erreur stats:', err);
        setError(err.response?.data?.message || err.message || "Erreur lors du chargement des statistiques");
      }
    };

    loadStats();
    // Rafraîchissement automatique pour que le dashboard reste à jour sans recharger la page.
    const interval = window.setInterval(loadStats, 30_000);
    return () => window.clearInterval(interval);
  }, [user, periode, dateDebut, dateFin]);

  if (isLoading || !user) return <StaffLayout><div className="p-8 text-center text-gray-500">Chargement...</div></StaffLayout>;

  const getTotalCount = () => {
    if (!stats) return 0;
    return Number(stats.total) || 0;
  };

  const getStatusCount = (statut: string) => {
    if (!stats) return 0;
    if (statut === 'EN_COURS') {
      // Additionne EN_COURS et ATTENTE_INFO pour le KPI "En cours"
      const enCours = stats.byStatus.find((s) => s.statut === 'EN_COURS');
      const attenteInfo = stats.byStatus.find((s) => s.statut === 'ATTENTE_INFO');
      return (enCours?.count ?? 0) + (attenteInfo?.count ?? 0);
    }
    const item = stats.byStatus.find((s) => s.statut === statut);
    return item ? item.count : 0;
  };

  return (
    <StaffLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tableau de bord</h1>
          </div>
          <button
            onClick={() => router.push('/staff/requetes')}
            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Voir les requêtes
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requêtes</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{getTotalCount() ?? 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Attente</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{getStatusCount('EN_ATTENTE')}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Cours</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{getStatusCount('EN_COURS')}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Clôturées</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{getStatusCount('CLOTUREE')}</h3>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolution Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Évolution</h3>
              <div className="flex flex-wrap items-center gap-2">
                {PERIODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriode(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      periode === opt.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {periode === "personnalise" && (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Du
                    <input
                      type="date"
                      value={dateDebut}
                      max={dateFin || undefined}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Au
                    <input
                      type="date"
                      value={dateFin}
                      min={dateDebut || undefined}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    />
                  </label>
                  {(!dateDebut || !dateFin) && (
                    <span className="text-xs text-gray-400">Sélectionnez une date de début et de fin.</span>
                  )}
                </div>
              )}
            </div>
            <div className="h-80 w-full">
              {stats?.evolution && stats.evolution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.evolution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) =>
                        val ? new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : val
                      }
                    />
                    <YAxis
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="total" name="Nouvelles requêtes" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">Aucune donnée</div>
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
                <div className="text-center text-gray-400 py-8">Aucune donnée</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}