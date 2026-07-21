import api from './axios';

export interface StaffStats {
  byStatus: { statut: string; count: number }[];
  byType: { type: string; count: number }[];
  evolution: { week: string; total: number }[];
  /** Nombre de dossiers actifs ayant dépassé le délai indicatif de leur type. */
  enRetard: number;
  /** Délai moyen de traitement (jours) des dossiers clôturés, par type. */
  delaiMoyenParType: { type: string; jours_moyen: number | null; count: number }[];
  /** Temps moyen (jours) passé dans chaque statut avant la transition suivante — révèle le goulot d'étranglement. */
  tempsParEtape: { etape: string; jours_moyen: number | null; count: number }[];
}

export interface RequeteListItem {
  id: number;
  type: string;
  statut: string;
  priorite: string;
  date_depot: string;
  updated_at: string;
  matricule: string;
  etudiant_nom: string;
  etudiant_prenom: string;
  jours_ecoules: number;
  /** 0 ou 1 (résultat brut d'un CASE SQL, pas un vrai booléen JS). */
  en_retard: 0 | 1;
}

export interface StaffRequetesResponse {
  requetes: RequeteListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const fetchStaffStats = async (): Promise<StaffStats> => {
  const response = await api.get('/requetes/staff/stats');
  return response.data;
};

export const fetchStaffRequetes = async (
  page: number = 1,
  limit: number = 10,
  statut?: string,
  type?: string,
  retard?: boolean,
  search?: string
): Promise<StaffRequetesResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (statut) params.append('statut', statut);
  if (type) params.append('type', type);
  if (retard) params.append('retard', '1');
  if (search) params.append('search', search);

  const response = await api.get(`/requetes/staff/all?${params.toString()}`);
  return response.data;
};

export const fetchRequeteDetails = async (id: string | number): Promise<any> => {
  const response = await api.get(`/requetes/${id}`);
  return response.data;
};

export const transitionRequete = async (
  id: string | number,
  action: string,
  body?: Record<string, unknown>
): Promise<{ message: string }> => {
  const response = await api.put(`/requetes/staff/${id}/${action}`, body ?? {});
  return response.data;
};

/** Télécharge le CSV d'une contestation de note (à transmettre à l'enseignant concerné). */
export const exporterContestationCsv = async (id: string | number): Promise<void> => {
  const response = await api.get(`/requetes/staff/${id}/export-csv`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = `contestation-note-${id}.csv`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
};

/** Télécharge un document joint à une requête. */
export const telechargerDocument = async (
  requeteId: string | number,
  docId: number,
  nomFichier: string
): Promise<void> => {
  const response = await api.get(`/requetes/${requeteId}/documents/${docId}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
};
