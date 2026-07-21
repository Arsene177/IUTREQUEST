import { apiClient } from "@/lib/api-client";
import type {
  CreerRequeteResponse,
  MesRequetesResponse,
  PayloadContestationNote,
  PayloadCorrectionNom,
  PayloadEffetAcademique,
  PayloadNouvelleRequete,
  RequeteDetailResponse,
  UploadDocumentResponse,
} from "@/types";

/** Omit distribue mal sur une union discriminée : on l'applique variante par variante. */
export type PayloadModifierRequete =
  | Omit<PayloadEffetAcademique, "type">
  | Omit<PayloadCorrectionNom, "type">
  | Omit<PayloadContestationNote, "type">;

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

  /** Modifie les informations d'une requête EN_ATTENTE (pas encore réceptionnée). */
  async modifier(id: number, payload: PayloadModifierRequete): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>(`/requetes/${id}`, payload);
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

  /**
   * Télécharge un document joint. La route backend exige un Bearer token
   * (authMiddleware) : on passe par apiClient (qui l'injecte) et on
   * récupère un blob plutôt qu'une URL brute, qu'un simple <a href> ne
   * pourrait pas authentifier.
   */
  async telecharger(requeteId: number, docId: number, nomFichier: string): Promise<void> {
    const response = await apiClient.get(`/requetes/${requeteId}/documents/${docId}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    window.URL.revokeObjectURL(url);
  },
};
