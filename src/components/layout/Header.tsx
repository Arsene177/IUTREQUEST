"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Plus, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { NotificationsPanel } from "@/components/dashboard/NotificationsPanel";
import { useMobileSidebar } from "@/context/MobileSidebarContext";

interface HeaderProps {
  title: string;
  showNewRequestButton?: boolean;
}

export function Header({ title, showNewRequestButton = false }: HeaderProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const router = useRouter();
  const { open: openSidebar } = useMobileSidebar();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- horloge : init au montage puis tick périodique, pattern standard
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-cream)] border-b border-[var(--color-cream-line)] px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openSidebar}
          aria-label="Ouvrir le menu"
          className="lg:hidden text-[var(--color-ink)] hover:opacity-60 transition flex-shrink-0"
        >
          <Menu size={24} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-[var(--color-ink)] uppercase tracking-wide truncate">
            {title}
          </h1>
          {now && (
            <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-0.5">
              {formatDate(now, "dd/MM/yyyy")} {formatDate(now, "HH:mm")}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            aria-label="Notifications"
            className="text-[var(--color-ink)] hover:opacity-60 transition relative"
          >
            <Bell size={22} />
          </button>
          {panelOpen && <NotificationsPanel onClose={() => setPanelOpen(false)} />}
        </div>

        {showNewRequestButton && (
          <Link
            href="/requetes/nouvelle"
            onClick={(e) => {
              e.preventDefault();
              router.push("/requetes/nouvelle");
            }}
            className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white px-3 sm:px-4 h-10 text-xs sm:text-sm font-semibold hover:bg-[var(--color-brand-dark)] transition whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nouvelle requête</span>
          </Link>
        )}
      </div>
    </header>
  );
}
