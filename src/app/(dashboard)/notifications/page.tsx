"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, Button, Spinner } from "@/components/ui";
import { notificationsApi } from "@/lib/api/notifications";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import { formatDateLettres } from "@/lib/format";
import type { Notification } from "@/types";

function iconePourNotification(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rejet")) return "❌";
  if (lower.includes("clôtur")) return "🎉";
  if (lower.includes("valid")) return "✅";
  if (lower.includes("information") || lower.includes("requises")) return "ℹ️";
  return "⏳";
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const charger = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { notifications: liste } = await notificationsApi.liste();
      setNotifications(liste);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de charger vos notifications."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClicNotification = async (n: Notification) => {
    if (!n.lu) {
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, lu: true } : item)));
      try {
        await notificationsApi.marquerLue(n.id);
      } catch {
        // silencieux : non bloquant pour la navigation
      }
    }
    if (n.requete_id) {
      router.push(`/requetes/${n.requete_id}`);
    }
  };

  const handleToutMarquerLu = async () => {
    try {
      await notificationsApi.marquerToutesLues();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      notify("Toutes les notifications ont été marquées comme lues.", "success");
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible de marquer les notifications comme lues."), "error");
    }
  };

  const aDesNonLues = notifications.some((n) => !n.lu);

  return (
    <>
      <Header title="Mes Notifications" />

      <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">Mes Notifications</h1>
          {aDesNonLues && (
            <Button variant="secondary" size="sm" onClick={handleToutMarquerLu}>
              <CheckCheck size={16} />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <Spinner label="Chargement des notifications…" />
        ) : error ? (
          <p className="rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error}
          </p>
        ) : notifications.length === 0 ? (
          <Card className="px-8 py-10 text-center">
            <p className="text-sm text-[var(--color-ink-muted)]">Aucune notification.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li key={n.id}>
                <Card
                  className={`px-5 py-4 cursor-pointer transition hover:shadow-md ${
                    !n.lu ? "border-l-4 border-l-[var(--color-brand)]" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleClicNotification(n)}
                    className="w-full text-left flex items-start gap-3"
                  >
                    <span className="text-xl flex-shrink-0" aria-hidden>
                      {iconePourNotification(n.message)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm text-[var(--color-ink)]">{n.message}</p>
                        {!n.lu && (
                          <span className="inline-block flex-shrink-0 rounded-full bg-[var(--color-brand)] text-white text-[10px] font-bold uppercase px-2 py-0.5">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                        {formatDateLettres(n.date_envoie)}
                      </p>
                    </div>
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
