"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { Button, TextField, IutRequestLogo } from "@/components/ui";

import { authApi } from "@/lib/api/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      if (user.role === "etudiant") {
        router.replace("/dashboard");
      } else {
        router.replace("/staff/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  const sessionExpired = searchParams.get("session") === "expired";

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await authApi.login(values);
      login(res.token, res.user);
      if (res.user.role === "etudiant") {
        router.replace("/dashboard");
      } else {
        router.replace("/staff/dashboard");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <IutRequestLogo size="lg" />

      <div className="w-full rounded-[var(--radius-card)] bg-[var(--color-cream)] p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-center pb-4 mb-6 border-b border-[var(--color-ink)]">
          CONNEXION
        </h1>

        {sessionExpired && (
          <p className="mb-4 rounded-lg bg-[var(--color-status-attente-bg)] px-3 py-2 text-sm text-[var(--color-status-attente)] font-medium">
            Votre session a expiré. Veuillez vous reconnecter.
          </p>
        )}

        {serverError && (
          <p className="mb-4 rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)] font-medium">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <TextField
            label="Matricule/ID"
            placeholder="Ex: IUT2024001"
            autoComplete="username"
            error={errors.identifiant?.message}
            {...register("identifiant")}
          />

          <div>
            <TextField
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <div className="mt-2 text-right">
              <Link
                href="/mot-de-passe-oublie"
                className="text-sm font-medium text-[var(--color-warning)] hover:underline"
              >
                Mot de passe oublié?
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} className="mt-2">
            CONNEXION
          </Button>
        </form>
      </div>
    </div>
  );
}
