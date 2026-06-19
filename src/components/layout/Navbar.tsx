'use client';

import { useAuth } from '@/context/AuthContext';
import { Bell, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const { user } = useAuth();
    const [now, setNow] = useState(new Date());

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
        <header className="h-16 bg-white border-b border-gray-100 px-4 lg:px-6
      flex items-center justify-between sticky top-0 z-20">

            {/* Titre — décalé à droite sur mobile pour laisser place au burger */}
            <div className="ml-10 lg:ml-0">
                <h1 className="text-base lg:text-lg font-bold text-gray-800 uppercase tracking-wide">
                    Tableau de bord
                </h1>
                <p className="text-xs text-gray-400 capitalize">
                    {dateStr} — {timeStr}
                </p>
            </div>

            {/* Actions droite */}
            <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-50 text-gray-400
          hover:text-gray-600 transition-colors">
                    <Sun size={18} />
                </button>
                <button className="relative p-2 rounded-lg hover:bg-gray-50
          text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2
            bg-red-500 rounded-full"></span>
                </button>
            </div>
        </header>
    );
}