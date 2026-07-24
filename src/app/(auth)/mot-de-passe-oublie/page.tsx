"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import {
  motDePasseOublieSchema,
  type MotDePasseOublieFormValues,
} from "@/lib/validation";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api-client";
import { Button, TextField } from "@/components/ui";

export default function MotDePasseOubliePage() {
  const [etape, setEtape] = useState<"formulaire" | "confirmation">("formulaire");
  const [serverError, setServerError] = useState<string | null>(null);
  const [motDePasseTemporaire, setMotDePasseTemporaire] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MotDePasseOublieFormValues>({
    resolver: zodResolver(motDePasseOublieSchema),
  });

  const onSubmit = async (values: MotDePasseOublieFormValues) => {
    setServerError(null);
    try {
      const reponse = await authApi.motDePasseOublie(values);
      setMotDePasseTemporaire(reponse.debug_mot_de_passe ?? null);
      setEtape("confirmation");
    } catch (err) {
      setServerError(getApiErrorMessage(err, "Aucun compte ne correspond à ces informations."));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 font-bold text-[var(--color-ink)] hover:opacity-70 transition w-fit"
      >
        <ArrowLeft size={20} />
        Retour
      </Link>

      <div className="rounded-[var(--radius-card)] bg-[var(--color-cream)] p-8 shadow-sm">
        {etape === "formulaire" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <h1 className="text-lg font-bold text-[var(--color-ink)] mb-1">
              Mot de passe oublié
            </h1>
            <p className="text-sm text-[var(--color-ink-muted)] -mt-3 mb-2">
              Entrez vos informations pour recevoir votre mot de passe.
            </p>

            {serverError && (
              <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)] font-medium">
                {serverError}
              </p>
            )}

            <TextField
              label="Nom(s)"
              placeholder="Nom de l'étudiant"
              error={errors.nom?.message}
              {...register("nom")}
            />
            <TextField
              label="Prénom(s)"
              placeholder="Prénom de l'étudiant"
              error={errors.prenom?.message}
              {...register("prenom")}
            />
            <TextField
              label="Matricule"
              placeholder="Matricule de l'étudiant"
              error={errors.matricule?.message}
              {...register("matricule")}
            />
            <TextField
              label="Date de naissance"
              type="date"
              error={errors.date_naissance?.message}
              {...register("date_naissance")}
            />

            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} className="mt-2">
              CONFIRMER
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4 text-center py-4">
            <p className="text-[var(--color-ink-muted)] text-lg">
              Mot de passe demandé
            </p>

            {motDePasseTemporaire ? (
              <div className="rounded-lg bg-[var(--color-status-attente-bg)] px-4 py-4 text-left">
                <p className="text-xs font-bold uppercase text-[var(--color-warning)] mb-2">
                  Mode développement — aucun email n&apos;est réellement envoyé
                </p>
                <p className="text-sm text-[var(--color-ink-muted)] mb-2">
                  Votre nouveau mot de passe temporaire :
                </p>
                <p className="font-mono text-lg font-bold text-[var(--color-ink)] bg-white rounded px-3 py-2 text-center select-all">
                  {motDePasseTemporaire}
                </p>
                <p className="text-xs text-[var(--color-ink-faint)] mt-2">
                  Utilisez-le pour vous connecter, puis changez-le depuis Paramètres.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">
                Si vos informations sont correctes, un nouveau mot de passe vous a été
                envoyé par email. Vérifiez votre boîte de réception (et vos spams).
              </p>
            )}

            <Link href="/login" className="mt-2">
              <Button variant="secondary" fullWidth>
                Retour à la connexion
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
