import axios, { AxiosError } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const TOKEN_STORAGE_KEY = "iutrequest_token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Injecte le token JWT sur chaque requête sortante
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Déconnecte automatiquement sur un 401 (token expiré/invalide)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      const onAuthPage =
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/mot-de-passe-oublie");
      if (!onAuthPage) {
        window.location.href = "/login?session=expired";
      }
    }
    return Promise.reject(error);
  }
);

/** Extrait un message d'erreur lisible depuis une erreur axios (format API: { message }) */
export function getApiErrorMessage(error: unknown, fallback = "Une erreur est survenue. Veuillez réessayer."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") {
      return "Impossible de contacter le serveur. Vérifiez votre connexion.";
    }
  }
  return fallback;
}
