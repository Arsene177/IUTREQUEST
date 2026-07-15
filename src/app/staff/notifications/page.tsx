"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { notificationsApi } from "@/lib/api/notifications";
import type { Notification } from "@/types";
import { Bell, CheckCheck, AlertCircle } from "lucide-react";

const STAFF_ROLES = ['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'];

export default function StaffNotificationsPage() {
  const { user, isLoading, setNotificationsNonLues } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !STAFF_ROLES.includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    notificationsApi
      .liste()
      .then(({ notifications: list }) => {
        if (isMounted) setNotifications(list);
      })
      .catch(() => {
        if (isMounted) setError("Erreur lors du chargement des notifications");
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleMarquerToutLu = async () => {
    try {
      await notificationsApi.marquerToutesLues();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setNotificationsNonLues(0);
    } catch {
      setError("Impossible de marquer les notifications comme lues");
    }
  };

  const handleMarquerLue = async (id: number) => {
    try {
      await notificationsApi.marquerLue(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
    } catch {
      // silencieux : non bloquant pour l'UX
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading || !user) {
    return (
      <StaffLayout title="Notifications">
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      </StaffLayout>
    );
  }

  const nonLues = notifications.filter((n) => !n.lu).length;

  return (
    <StaffLayout title="Notifications">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Tout est à jour"}
              </p>
            </div>
          </div>
          {nonLues > 0 && (
            <button
              onClick={handleMarquerToutLu}
              className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer lu
            </button>
          )}
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {isLoadingData ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Chargement…</p>
          ) : notifications.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-500">Aucune notification pour le moment.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.lu && handleMarquerLue(n.id)}
                  className={`px-6 py-4 flex items-start justify-between gap-4 ${
                    n.lu ? "" : "bg-blue-50 dark:bg-blue-500/10 cursor-pointer"
                  }`}
                >
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(n.date_envoie)}</p>
                  </div>
                  {!n.lu && <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
