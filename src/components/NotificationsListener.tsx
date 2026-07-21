"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { notificationsApi } from "@/lib/api/notifications";
import { API_BASE_URL } from "@/lib/api-client";

interface NotificationEvent {
  id: number;
  requete_id: number | null;
  message: string;
  lu: boolean;
  date_envoie: string;
}

/**
 * Composant invisible qui maintient la connexion SSE vers
 * /notifications/stream et synchronise le compteur de notifications non
 * lues en temps réel — sans lui, le badge de la cloche ne se met à jour
 * qu'au rechargement de la page.
 */
export function NotificationsListener() {
  const { user, token, setNotificationsNonLues } = useAuth();
  const { notify } = useToast();
  const sourceRef = useRef<EventSource | null>(null);

  // Compte initial au chargement / changement d'utilisateur.
  useEffect(() => {
    if (!user) {
      setNotificationsNonLues(0);
      return;
    }
    notificationsApi
      .nbNonLues()
      .then(({ nb }) => setNotificationsNonLues(nb))
      .catch(() => {
        // silencieux : non bloquant, le badge restera simplement à 0
      });
  }, [user, setNotificationsNonLues]);

  // Connexion SSE tant qu'un utilisateur est authentifié.
  useEffect(() => {
    if (!token) {
      sourceRef.current?.close();
      sourceRef.current = null;
      return;
    }

    const source = new EventSource(`${API_BASE_URL}/notifications/stream?token=${token}`);
    sourceRef.current = source;

    source.addEventListener("notification", (event: MessageEvent) => {
      try {
        const data: NotificationEvent = JSON.parse(event.data);
        setNotificationsNonLues((prev) => prev + 1);
        notify(data.message, "info");
      } catch {
        // évènement malformé : ignoré
      }
    });

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [token, notify, setNotificationsNonLues]);

  return null;
}
