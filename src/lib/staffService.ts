import api from './axios';

export interface StaffStats {
  // Total calculé selon la règle propre à chaque rôle (peut différer de la somme de byStatus).
  total: number;
  byStatus: { statut: string; count: number }[];
  byType: { type: string; count: number }[];
  // `week` quand aucune période n'est précisée (4 dernières semaines), `day` quand from/to sont fournis.
  evolution: { week?: string; day?: string; total: number }[];
}

export interface DocumentItem {
  id: number;
  nom: string;
  type: string;
  taille: number;
  uploaded_at: string;
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

export const fetchStaffStats = async (from?: string, to?: string): Promise<StaffStats> => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const qs = params.toString();
  const response = await api.get(`/requetes/staff/stats${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const fetchStaffRequetes = async (
  page: number = 1,
  limit: number = 10,
  statut?: string,
  type?: string
): Promise<StaffRequetesResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (statut) params.append('statut', statut);
  if (type) params.append('type', type);

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

/** Télécharge un document protégé par JWT (l'endpoint exige le header Authorization). */
export const downloadDocument = async (
  requeteId: string | number,
  docId: number,
  nomFichier: string
): Promise<void> => {
  const response = await api.get(`/requetes/${requeteId}/documents/${docId}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomFichier);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
