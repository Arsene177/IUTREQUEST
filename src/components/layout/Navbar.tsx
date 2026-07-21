'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    title?: string;
}

export default function Navbar({ title = 'Tableau de bord' }: NavbarProps) {
    const { user, notificationsNonLues } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const [now, setNow] = useState(new Date());
    const [recherche, setRecherche] = useState('');

    useEffect(() => {
        // Met à jour immédiatement puis chaque seconde
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000); // chaque seconde
        return () => clearInterval(interval);
    }, []);

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
      flex items-center justify-between sticky top-0 z-20 transition-colors">

            {/* Titre — décalé à droite sur mobile pour laisser place au burger */}
            <div className="ml-10 lg:ml-0 min-w-0">
                <h1 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide truncate">
                    {title}
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                    {dateStr} — {timeStr}
                </p>
            </div>

            {/* Recherche globale — accessible depuis n'importe quelle page staff,
                renvoie vers la liste des requêtes déjà filtrée par le rôle connecté. */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const q = recherche.trim();
                    router.push(q ? `/staff/requetes?search=${encodeURIComponent(q)}` : '/staff/requetes');
                }}
                className="hidden sm:flex flex-1 max-w-md mx-4"
            >
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="search"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher une requête (id, nom, matricule...)"
                        aria-label="Recherche globale"
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
              rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </form>

            {/* Actions droite */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                    aria-pressed={theme === 'dark'}
                    title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                    className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400
          hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 transition-colors"
                >
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button
                    onClick={() => router.push('/staff/notifications')}
                    aria-label={`Notifications${notificationsNonLues > 0 ? ` (${notificationsNonLues} non lues)` : ''}`}
                    className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800
          text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 transition-colors"
                >
                    <Bell size={18} />
                    {notificationsNonLues > 0 && (
                        <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full
              bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {notificationsNonLues > 9 ? '9+' : notificationsNonLues}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
}