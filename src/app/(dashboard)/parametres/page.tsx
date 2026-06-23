"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { Card, Button, TextField } from "@/components/ui";
import {
  changerMotDePasseSchema,
  type ChangerMotDePasseFormValues,
} from "@/lib/validation";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

type PanneauOuvert = "aucun" | "changer";

export default function ParametresPage() {
  const [panneau, setPanneau] = useState<PanneauOuvert>("aucun");
  const { notify } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangerMotDePasseFormValues>({
    resolver: zodResolver(changerMotDePasseSchema),
  });

  const onSubmit = async (values: ChangerMotDePasseFormValues) => {
    try {
      await authApi.changerMotDePasse({
        ancien_mot_de_passe: values.ancien_mot_de_passe,
        nouveau_mot_de_passe: values.nouveau_mot_de_passe,
      });
      notify("Votre mot de passe a été modifié avec succès.", "success");
      reset();
      setPanneau("aucun");
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible de modifier le mot de passe."), "error");
    }
  };

  return (
    <>
      <Header title="Tableau de bord" />

      <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-bold text-[var(--color-ink)] hover:opacity-70 transition mb-6"
        >
          <ArrowLeft size={20} />
          Paramètres
        </Link>

        <div className="flex flex-col gap-5">
          <Link href="/mot-de-passe-oublie">
            <Card className="px-7 py-6 cursor-pointer hover:shadow-md transition">
              <p className="font-extrabold text-[var(--color-ink)] text-center">
                Mot de passe oublié
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] text-center mt-1">
                Entrez vos informations pour recevoir votre mot de passe
              </p>
            </Card>
          </Link>

          <Card className="overflow-hidden">
            <button
              type="button"
              onClick={() => setPanneau(panneau === "changer" ? "aucun" : "changer")}
              className="w-full px-7 py-6 text-center"
            >
              <p className="font-extrabold text-[var(--color-ink)]">Changer le mot de passe</p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                Entrez l&apos;ancien mot de passe pour pouvoir le modifier
              </p>
            </button>

            {panneau === "changer" && (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="px-7 pb-7 pt-2 flex flex-col gap-4 border-t border-[var(--color-cream-line)]"
              >
                <TextField
                  label="Mot de passe actuel"
                  type="password"
                  autoComplete="current-password"
                  error={errors.ancien_mot_de_passe?.message}
                  {...register("ancien_mot_de_passe")}
                />
                <TextField
                  label="Nouveau mot de passe"
                  type="password"
                  autoComplete="new-password"
                  error={errors.nouveau_mot_de_passe?.message}
                  {...register("nouveau_mot_de_passe")}
                />
                <TextField
                  label="Confirmer le nouveau mot de passe"
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmation?.message}
                  {...register("confirmation")}
                />
                <Button type="submit" isLoading={isSubmitting} className="mt-1">
                  Valider le changement
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
