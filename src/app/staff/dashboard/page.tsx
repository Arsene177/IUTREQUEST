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

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [error, setError] = useState<string>("");

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

  if (isLoading || !user) return <StaffLayout title="Tableau de bord"><div className="p-8 text-center text-gray-500">Chargement...</div></StaffLayout>;

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
            <LayoutDashboard className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Tableau de bord</h1>
          </div>
          <button
            onClick={() => router.push('/staff/requetes')}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
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

        {/* Stats Summary Cards — cliquables : renvoient vers /staff/requetes
            pré-filtrée par statut, pour retrouver rapidement "toutes les
            requêtes résolues", etc. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            type="button"
            onClick={() => router.push('/staff/requetes')}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">Total Requêtes</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{getTotalCount()}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=EN_ATTENTE')}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-amber-200 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">En Attente</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2">{getStatusCount('EN_ATTENTE')}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=EN_COURS')}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">En Cours</p>
              <h3 className="text-3xl font-bold text-indigo-600 mt-2">{getStatusCount('EN_COURS')}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push('/staff/requetes?statut=CLOTUREE')}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-green-200 transition-all"
          >
            <div>
              <p className="text-sm font-medium text-gray-500">Clôturées</p>
              <h3 className="text-3xl font-bold text-green-600 mt-2">{getStatusCount('CLOTUREE')}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolution Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Évolution sur 4 semaines</h3>
            <div className="h-80 w-full">
              {stats?.evolution ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.evolution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `Sem. ${val}`}
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Répartition par type</h3>
            <div className="space-y-4">
              {stats?.byType.map((t) => (
                <div key={t.type} className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 capitalize">{t.type.replace('_', ' ')}</span>
                    <span className="font-semibold text-gray-900">{t.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
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