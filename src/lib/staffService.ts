import api from './axios';

export interface StaffStats {
  byStatus: { statut: string; count: number }[];
  byType: { type: string; count: number }[];
  evolution: { week: string; total: number }[];
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

export const fetchStaffStats = async (): Promise<StaffStats> => {
  const response = await api.get('/requetes/staff/stats');
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
