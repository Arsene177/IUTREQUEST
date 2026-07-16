"use client";

import StaffLayout from "@/components/layout/StaffLayout";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ROLE_CONFIG } from "@/lib/constants";
import { changerMotDePasseSchema, type ChangerMotDePasseFormValues } from "@/lib/validation";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api-client";
import { Settings, User as UserIcon, KeyRound, AlertCircle, CheckCircle } from "lucide-react";

const STAFF_ROLES = ['secretariat', 'directeur', 'directeur_adjoint', 'departement', 'scolarite', 'cellule_informatique'];

export default function StaffParametresPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !STAFF_ROLES.includes(user.role))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangerMotDePasseFormValues>({
    resolver: zodResolver(changerMotDePasseSchema),
  });

  const onSubmit = async (values: ChangerMotDePasseFormValues) => {
    setSuccess("");
    try {
      await authApi.changerMotDePasse({
        ancien_mot_de_passe: values.ancien_mot_de_passe,
        nouveau_mot_de_passe: values.nouveau_mot_de_passe,
      });
      setSuccess("Votre mot de passe a été modifié avec succès.");
      reset();
      setPanneauOuvert(false);
    } catch (err) {
      setSuccess("");
      alert(getApiErrorMessage(err, "Impossible de modifier le mot de passe."));
    }
  };

  if (isLoading || !user) {
    return (
      <StaffLayout title="Paramètres">
        <div className="p-8 text-center text-gray-500">Chargement...</div>
      </StaffLayout>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];

  return (
    <StaffLayout title="Paramètres">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>
        </header>

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profil</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Nom complet</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user.prenom} {user.nom}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Rôle</p>
              <p className="font-medium" style={{ color: roleConfig?.color }}>{roleConfig?.label ?? user.role}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setPanneauOuvert((v) => !v)}
            className="w-full flex items-center space-x-3 px-6 py-5 text-left"
          >
            <KeyRound className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Changer le mot de passe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Entrez votre ancien mot de passe pour le modifier</p>
            </div>
          </button>

          {panneauOuvert && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="px-6 pb-6 pt-2 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...register("ancien_mot_de_passe")}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.ancien_mot_de_passe && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.ancien_mot_de_passe.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register("nouveau_mot_de_passe")}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.nouveau_mot_de_passe && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.nouveau_mot_de_passe.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmation")}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.confirmation && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.confirmation.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? "Validation..." : "Valider le changement"}
              </button>
            </form>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
