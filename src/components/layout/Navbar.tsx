'use client';

import { useAuth } from '@/context/AuthContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Bell, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notificationsApi } from '@/lib/api/notifications';

export default function Navbar() {
    const { user } = useAuth();
    const { isDark, toggleDarkMode } = useDarkMode();
    const [now, setNow] = useState(new Date());
    const [nbNonLues, setNbNonLues] = useState(0);

    useEffect(() => {
        // Met à jour immédiatement puis chaque seconde
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000); // chaque seconde
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;
        const chargerNbNonLues = () => {
            notificationsApi
                .nbNonLues()
                .then(({ nb }) => setNbNonLues(nb))
                .catch(() => {
                    // silencieux : le badge reste simplement inchangé en cas d'erreur réseau
                });
        };
        chargerNbNonLues();
        const interval = window.setInterval(chargerNbNonLues, 30_000);
        return () => window.clearInterval(interval);
    }, [user]);

    if (!user) return null;

    const dateStr = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 lg:px-6
      flex items-center justify-between sticky top-0 z-20">

            {/* Titre — décalé à droite sur mobile pour laisser place au burger */}
            <div className="ml-10 lg:ml-0">
                <h1 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">
                    Tableau de bord
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                    {dateStr} — {timeStr}
                </p>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleDarkMode}
                    aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
                    className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400
          dark:text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                    {isDark ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <Link
                    href="/staff/notifications"
                    aria-label="Notifications"
                    className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800
          text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                    <Bell size={18} />
                    {nbNonLues > 0 && (
                        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {nbNonLues > 99 ? '99+' : nbNonLues}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}