'use client';

import { useAuth } from '@/context/AuthContext';
import { ROLE_CONFIG } from '@/lib/constants';
import {
    LayoutDashboard,
    FileText,
    Bell,
    Settings,
    LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // Déterminer les éléments de navigation selon le rôle
    const getNavItems = () => {
        if (!user) return [];
        
        const isStudent = user.role === 'etudiant';
        
        if (isStudent) {
            return [
                { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
                { href: '/requetes', icon: FileText, label: 'Requêtes' },
                { href: '/dashboard', icon: Bell, label: 'Notifications' },
                { href: '/dashboard', icon: Settings, label: 'Paramètres' },
            ];
        }
        
        // Routes staff
        return [
            { href: '/staff/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
            { href: '/staff/requetes', icon: FileText, label: 'Requêtes' },
            { href: '/staff/notifications', icon: Bell, label: 'Notifications' },
            { href: '/staff/parametres', icon: Settings, label: 'Paramètres' },
        ];
    };
    
    const navItems = getNavItems();

    if (!user) return null;

    const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG];

    return (
        <>
            {/* ============ SIDEBAR DESKTOP (lg+) ============ */}
            <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r
        border-gray-100 dark:border-gray-800 h-screen sticky top-0 transition-colors">

                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">J</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">JANNGO</span>
                </div>

                {/* Profil */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 font-semibold text-sm">
                                {user.prenom[0]}{user.nom[0]}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {user.prenom} {user.nom}
                            </p>
                            <p className="text-xs font-medium" style={{ color: roleConfig.color }}>
                                {roleConfig.label}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                                    }
                `}
                            >
                                <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Déconnexion */}
                <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors"
                    >
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* ============ BOTTOM NAV MOBILE (< lg) ============ */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900
        border-t border-gray-100 dark:border-gray-800 z-40 shadow-lg transition-colors">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg
                  transition-colors duration-150 min-w-0"
                            >
                                <item.icon
                                    size={22}
                                    className={isActive ? 'text-blue-600' : 'text-gray-400'}
                                />
                                <span className={`text-[10px] font-medium truncate
                  ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {/* Label court pour mobile */}
                                    {item.label === 'Tableau de bord' ? 'Accueil' : item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Bouton déconnexion dans la bottom nav */}
                    <button
                        onClick={logout}
                        className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg"
                    >
                        <LogOut size={22} className="text-red-400" />
                        <span className="text-[10px] font-medium text-red-400">Quitter</span>
                    </button>
                </div>
            </nav>
        </>
    );
}