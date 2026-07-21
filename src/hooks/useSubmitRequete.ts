"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requetesApi, documentsApi } from "@/lib/api/requetes";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import type { PayloadNouvelleRequete } from "@/types";

export function useSubmitRequete() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { notify } = useToast();

  const submit = async (payload: PayloadNouvelleRequete, justificatifs: File | File[]) => {
    setIsSubmitting(true);
    const fichiers = Array.isArray(justificatifs) ? justificatifs : [justificatifs];
    try {
      const { requete_id } = await requetesApi.creer(payload);

      try {
        await documentsApi.upload(requete_id, fichiers);
      } catch (uploadError) {
        // La requête existe déjà : on informe clairement plutôt que de bloquer l'étudiant.
        notify(
          `Votre requête #${requete_id} a bien été créée, mais l'envoi du justificatif a échoué (${getApiErrorMessage(
            uploadError,
            "erreur réseau"
          )}). Vous pourrez le renvoyer depuis le détail de la requête.`,
          "error"
        );
        router.push("/dashboard");
        return;
      }

      notify("Votre requête a été soumise avec succès.", "success");
      router.push("/dashboard");
    } catch (error) {
      notify(getApiErrorMessage(error, "Impossible de soumettre la requête."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
