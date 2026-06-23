"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck } from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { formatDateHeure } from "@/lib/format";
import { Spinner } from "@/components/ui";
import type { Notification } from "@/types";

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const { setNotificationsNonLues } = useAuth();

  useEffect(() => {
    let isMounted = true;
    notificationsApi
      .liste()
      .then(({ notifications: list }) => {
        if (isMounted) setNotifications(list);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarquerToutLu = async () => {
    try {
      await notificationsApi.marquerToutesLues();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setNotificationsNonLues(0);
    } catch {
      // silencieux : non bloquant pour l'UX
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-3 w-80 max-h-96 overflow-y-auto scrollbar-thin rounded-[var(--radius-card)] bg-white shadow-xl border border-[var(--color-cream-line)] z-30"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-cream-line)]">
        <p className="font-bold text-sm text-[var(--color-ink)]">Notifications</p>
        <button
          onClick={handleMarquerToutLu}
          className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] hover:underline"
        >
          <CheckCheck size={14} />
          Tout marquer lu
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <p className="px-4 py-6 text-sm text-center text-[var(--color-ink-faint)]">
          Aucune notification pour le moment.
        </p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 border-b border-[var(--color-cream-line)] last:border-0 ${
                n.lu ? "" : "bg-[var(--color-brand-soft)]"
              }`}
            >
              <p className="text-sm text-[var(--color-ink)]">{n.message}</p>
              <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                {formatDateHeure(n.date_envoie)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
