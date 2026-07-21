import { apiClient } from "@/lib/api-client";
import type { LoginResponse, MeResponse, MotDePasseOublieResponse } from "@/types";

export interface LoginPayload {
  /** Matricule OU email — le backend résout l'un ou l'autre */
  identifiant: string;
  password: string;
}

export interface MotDePasseOubliePayload {
  nom: string;
  prenom: string;
  matricule: string;
  date_naissance: string; // format YYYY-MM-DD
}

export interface ChangerMotDePassePayload {
  ancien_mot_de_passe: string;
  nouveau_mot_de_passe: string;
}

export interface ResultatLigneImport {
  ligne: number;
  matricule?: string;
  statut: "cree" | "ignore";
  raison?: string;
  mot_de_passe_genere?: string;
}

export interface ImportEtudiantsResponse {
  message: string;
  resultats: ResultatLigneImport[];
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    matricule: string;
    filiere: string;
    niveau: string;
  }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>("/auth/register", payload);
    return data;
  },

  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>("/auth/me");
    return data;
  },

  async motDePasseOublie(payload: MotDePasseOubliePayload): Promise<MotDePasseOublieResponse> {
    const { data } = await apiClient.post<MotDePasseOublieResponse>(
      "/auth/forgot-password",
      payload
    );
    return data;
  },

  async changerMotDePasse(payload: ChangerMotDePassePayload): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(
      "/auth/change-password",
      payload
    );
    return data;
  },

  async importEtudiants(fichier: File): Promise<ImportEtudiantsResponse> {
    const formData = new FormData();
    formData.append("fichier", fichier);
    const { data } = await apiClient.post<ImportEtudiantsResponse>(
      "/auth/import-etudiants",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },
};
