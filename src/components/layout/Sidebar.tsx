"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, User, Filter, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMobileSidebar } from "@/context/MobileSidebarContext";
import { IutRequestLogo } from "@/components/ui";
import { nomComplet } from "@/lib/format";
import type { TypeRequete } from "@/types";
import { TYPE_REQUETE_LABELS } from "@/lib/constants";

const FILTRE_TYPES: TypeRequete[] = ["correction_nom", "contestation_note", "effet_academique"];

interface SidebarProps {
  typeFiltre?: TypeRequete | null;
  onSelectTypeFiltre?: (type: TypeRequete | null) => void;
}

export function Sidebar({ typeFiltre, onSelectTypeFiltre }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useMobileSidebar();
  const isOnDashboard = pathname === "/dashboard";

  const handleFiltreClick = (type: TypeRequete) => {
    if (!isOnDashboard) {
      router.push("/dashboard");
    }
    onSelectTypeFiltre?.(typeFiltre === type ? null : type);
    close();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={close}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-[260px] flex-shrink-0 bg-[var(--color-cream)] flex flex-col h-screen transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-[var(--color-cream-line)] flex items-center justify-between">
          <IutRequestLogo size="md" />
          <button
            onClick={close}
            aria-label="Fermer le menu"
            className="lg:hidden text-[var(--color-ink)] hover:opacity-60 transition"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-6 py-6 flex items-center gap-3 border-b border-[var(--color-cream-line)]">
          <div className="w-11 h-11 rounded-full bg-[var(--color-canvas-soft)] flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-[var(--color-ink)]" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-[var(--color-ink)] uppercase truncate">
              {user ? nomComplet(user.nom, user.prenom) : "Étudiant"}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-6 px-6">
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] mb-4">
            <Filter size={16} />
            Mes requêtes
          </p>
          <ul className="flex flex-col gap-3">
            {FILTRE_TYPES.map((type) => {
              const active = typeFiltre === type;
              return (
                <li key={type}>
                  <button
                    onClick={() => handleFiltreClick(type)}
                    className={`flex items-center gap-3 text-sm transition w-full text-left rounded-lg px-2 py-1.5 -mx-2 ${
                      active
                        ? "text-[var(--color-brand)] font-bold bg-[var(--color-brand-soft)]"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: active ? "var(--color-brand)" : "var(--color-ink-faint)",
                      }}
                    />
                    {TYPE_REQUETE_LABELS[type]}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 py-6 border-t border-[var(--color-cream-line)] flex flex-col gap-4">
          <Link
            href="/parametres"
            onClick={close}
            className="flex items-center gap-3 text-[var(--color-ink)] font-bold hover:opacity-70 transition"
          >
            <Settings size={20} />
            Paramètres
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 text-[var(--color-danger)] font-bold hover:opacity-70 transition"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
