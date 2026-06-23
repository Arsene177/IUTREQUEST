import { apiClient } from "@/lib/api-client";
import type {
  CreerRequeteResponse,
  MesRequetesResponse,
  PayloadNouvelleRequete,
  RequeteDetailResponse,
  UploadDocumentResponse,
} from "@/types";

export const requetesApi = {
  async creer(payload: PayloadNouvelleRequete): Promise<CreerRequeteResponse> {
    const { data } = await apiClient.post<CreerRequeteResponse>("/requetes", payload);
    return data;
  },

  async mesRequetes(page = 1, limit = 10): Promise<MesRequetesResponse> {
    const { data } = await apiClient.get<MesRequetesResponse>("/requetes/me", {
      params: { page, limit },
    });
    return data;
  },

  async detail(id: number): Promise<RequeteDetailResponse> {
    const { data } = await apiClient.get<RequeteDetailResponse>(`/requetes/${id}`);
    return data;
  },

  async annuler(id: number): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(`/requetes/${id}/annuler`);
    return data;
  },

  /**
   * Complète un dossier en ATTENTE_INFO en renvoyant les pièces manquantes.
   * Ré-utilise l'endpoint d'upload ; le backend repasse le statut à EN_COURS.
   */
  async fournirInfoManquante(id: number, fichiers: File[]): Promise<UploadDocumentResponse> {
    return documentsApi.upload(id, fichiers);
  },
};

export const documentsApi = {
  async upload(requeteId: number, fichiers: File[]): Promise<UploadDocumentResponse> {
    const formData = new FormData();
    fichiers.forEach((fichier) => formData.append("documents", fichier));

    const { data } = await apiClient.post<UploadDocumentResponse>(
      `/requetes/${requeteId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  /** Retourne l'URL de téléchargement (ouverte via window.open, le token est ajouté côté serveur de fichiers statiques ou via fetch+blob si protégé) */
  downloadUrl(requeteId: number, docId: number): string {
    return `${apiClient.defaults.baseURL}/requetes/${requeteId}/documents/${docId}`;
  },
};
