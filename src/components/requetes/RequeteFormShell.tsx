"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Card, Button } from "@/components/ui";

interface RequeteFormShellProps {
  title: string;
  description: string;
  children: ReactNode;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  /** Cible du lien "retour"/"annuler" — /dashboard par défaut, ou le détail d'une requête en édition. */
  backHref?: string;
  backLabel?: string;
}

export function RequeteFormShell({
  title,
  description,
  children,
  onSubmit,
  isSubmitting,
  submitLabel = "Soumettre la requête",
  backHref = "/dashboard",
  backLabel = "Mes requêtes",
}: RequeteFormShellProps) {
  return (
    <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-2xl">
      <nav className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mb-6">
        <Link
          href={backHref}
          className="flex items-center gap-1 font-bold text-[var(--color-ink)] hover:opacity-70 transition"
        >
          <ChevronLeft size={18} />
          {backLabel}
        </Link>
        <span>&gt;</span>
        <span>{title.toLowerCase()}</span>
      </nav>

      <Card className="overflow-hidden">
        <div className="px-5 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-[var(--color-cream-line)]">
          <h1 className="text-lg sm:text-xl font-extrabold text-[var(--color-ink)]">{title}</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">{description}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="px-5 sm:px-8 py-6 sm:py-7 flex flex-col gap-5"
        >
          {children}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Link href={backHref} className="sm:order-1">
              <Button type="button" variant="secondary" disabled={isSubmitting} fullWidth>
                Annuler
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting} fullWidth className="sm:w-auto">
              {submitLabel}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
