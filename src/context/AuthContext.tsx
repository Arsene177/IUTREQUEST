'use client';

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    notificationsNonLues: number;
    login: (token: string, user: User) => void;
    logout: () => void;
    setNotificationsNonLues: Dispatch<SetStateAction<number>>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utilisateur de test — change le rôle ici pour tester chaque profil
export const MOCK_USER: User = {
    id: 10,
    nom: 'Essomba',
    prenom: 'Paul',
    email: 'paul.essomba@iut.cm',
    role: 'secretariat',
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationsNonLues, setNotificationsNonLues] = useState(0);

    useEffect(() => {
        const savedToken = localStorage.getItem('iutrequest_token');
        const savedUser = localStorage.getItem('janngo_user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        } else {
            setToken(null);
            setUser(null);
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('iutrequest_token', newToken);
        localStorage.setItem('janngo_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('iutrequest_token');
        localStorage.removeItem('janngo_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            notificationsNonLues,
            login,
            logout,
            setNotificationsNonLues,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
}