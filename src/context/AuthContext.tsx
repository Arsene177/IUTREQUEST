"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi, type LoginPayload } from "@/lib/api/auth";
import { TOKEN_STORAGE_KEY } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/api-client";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  notificationsNonLues: number;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<boolean>;
  setNotificationsNonLues: (n: number) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notificationsNonLues, setNotificationsNonLues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async (): Promise<boolean> => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      return false;
    }
    try {
      const { user: me, notifications_non_lues } = await authApi.me();
      setUser(me);
      setNotificationsNonLues(notifications_non_lues);
      return true;
    } catch {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch initial au montage, setState exécuté de façon async dans le .then/.finally, pas synchrone
    refreshMe().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        const { token, user: loggedUser } = await authApi.login(payload);
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
        setUser(loggedUser);
        router.push("/dashboard");
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Identifiant ou mot de passe incorrect."));
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setNotificationsNonLues(0);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      notificationsNonLues,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshMe,
      setNotificationsNonLues,
    }),
    [user, notificationsNonLues, isLoading, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return ctx;
}
