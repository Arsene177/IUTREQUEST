"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, AlertCircle } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { formatDateHeure } from "@/lib/format";
import type { Notification } from "@/types";

const STAFF_ROLES = [
  "secretariat",
  "directeur",
  "directeur_adjoint",
  "departement",
  "scolarite",
  "cellule_informatique",
];

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
    notificationsApi
      .liste()
      .then(({ notifications: list }) => setNotifications(list))
      .catch((err) => {
        setError(err.response?.data?.message || "Erreur lors du chargement des notifications");
      })
      .finally(() => setIsLoadingData(false));
  }, [user]);

  const handleMarquerToutLu = async () => {
    try {
      await notificationsApi.marquerToutesLues();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setNotificationsNonLues(0);
    } catch {
      // silencieux : non bloquant pour l'UX
    }
  };

  if (isLoading || !user) {
    return (
      <StaffLayout>
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
          <button
            onClick={handleMarquerToutLu}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:underline"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Tout marquer lu</span>
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {isLoadingData ? (
            <p className="px-6 py-8 text-center text-gray-500">Chargement des notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-500">Aucune notification pour le moment.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-6 py-4 ${n.lu ? "" : "bg-blue-50"}`}
                >
                  <p className="text-sm text-gray-900">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateHeure(n.date_envoie)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
