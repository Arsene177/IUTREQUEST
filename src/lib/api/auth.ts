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

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
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
};
