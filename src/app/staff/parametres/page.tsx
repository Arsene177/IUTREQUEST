"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Settings, AlertCircle, CheckCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ROLE_CONFIG } from "@/lib/constants";
import {
  changerMotDePasseSchema,
  type ChangerMotDePasseFormValues,
} from "@/lib/validation";
import type { User } from "@/types";

const STAFF_ROLES = [
  "secretariat",
  "directeur",
  "directeur_adjoint",
  "departement",
  "scolarite",
  "cellule_informatique",
];

export default function StaffParametresPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [profil, setProfil] = useState<User | null>(null);
  const [isLoadingProfil, setIsLoadingProfil] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !STAFF_ROLES.includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    authApi
      .me()
      .then(({ user: me }) => setProfil(me))
      .catch((err) => {
        setError(err?.response?.data?.message || "Impossible de charger votre profil.");
      })
      .finally(() => setIsLoadingProfil(false));
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangerMotDePasseFormValues>({
    resolver: zodResolver(changerMotDePasseSchema),
  });

  const onSubmit = async (values: ChangerMotDePasseFormValues) => {
    setError("");
    setSuccess("");
    try {
      await authApi.changerMotDePasse({
        ancien_mot_de_passe: values.ancien_mot_de_passe,
        nouveau_mot_de_passe: values.nouveau_mot_de_passe,
      });
      setSuccess("Votre mot de passe a été modifié avec succès.");
      reset();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de modifier le mot de passe.");
    }
  };

  if (isLoading || !user) {
    return (
      <StaffLayout>
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      </StaffLayout>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];

  return (
    <StaffLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mon profil</h3>
          {isLoadingProfil ? (
            <p className="text-sm text-gray-500">Chargement du profil…</p>
          ) : profil ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium text-gray-900">{profil.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prénom</p>
                <p className="font-medium text-gray-900">{profil.prenom}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{profil.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Rôle</p>
                <p className="font-medium" style={{ color: roleConfig?.color }}>
                  {roleConfig?.label ?? profil.role}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Profil indisponible.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Changer le mot de passe</h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register("ancien_mot_de_passe")}
              />
              {errors.ancien_mot_de_passe && (
                <p className="text-xs text-red-600 mt-1">{errors.ancien_mot_de_passe.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register("nouveau_mot_de_passe")}
              />
              {errors.nouveau_mot_de_passe && (
                <p className="text-xs text-red-600 mt-1">{errors.nouveau_mot_de_passe.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                {...register("confirmation")}
              />
              {errors.confirmation && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmation.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="self-start bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Modification…" : "Valider le changement"}
            </button>
          </form>
        </div>
      </div>
    </StaffLayout>
  );
}
