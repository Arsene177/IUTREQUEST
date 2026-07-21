export type Role =
  | "secretariat"
  | "directeur_adjoint"
  | "directeur"
  | "departement"
  | "cellule_informatique"
  | "scolarite"
  | "etudiant";

export type StatutRequete =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "ATTENTE_INFO"
  | "VALIDEE"
  | "EN_EXECUTION"
  | "REJETEE"
  | "CLOTUREE";

export type TypeRequete = "effet_academique" | "correction_nom" | "contestation_note";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  matricule?: string;
  filiere?: string;
  niveau?: string;
}

export interface Requete {
  id: number;
  type: TypeRequete;
  statut: StatutRequete;
  priorite: "normale" | "urgente";
  date_depot: string;
  etudiant?: {
    nom: string;
    prenom: string;
    matricule: string;
  };
  details?: any;
}

export interface HistoriqueItem {
  statut: StatutRequete;
  acteur: {
    nom: string;
    prenom: string;
    role: Role;
  };
  date: string;
  commentaire?: string;
  info_requise?: string;
}

export interface Notification {
  id: number;
  message: string;
  date_envoie: string;
  lu: boolean;
  requete_id?: number;
}

export interface PayloadEffetAcademique {
  type: "effet_academique";
  priorite: "normale" | "urgente";
  type_document: string;
  annee_academique: string;
  motif?: string;
}

export interface PayloadCorrectionNom {
  type: "correction_nom";
  priorite: "normale" | "urgente";
  ancien_nom: string;
  nouveau_nom: string;
  motif: string;
}

export interface PayloadContestationNote {
  type: "contestation_note";
  priorite: "normale" | "urgente";
  code_matiere: string;
  note_actuelle: number;
  note_contestee: number;
  motif_contestation: string;
}

export type PayloadNouvelleRequete =
  | PayloadEffetAcademique
  | PayloadCorrectionNom
  | PayloadContestationNote;

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface MotDePasseOublieResponse {
  message: string;
  debug_mot_de_passe?: string | null;
}

export interface CreerRequeteResponse {
  requete_id: number;
  message: string;
}

export interface MesRequetesResponse {
  requetes: Requete[];
  pagination: Pagination;
}

export interface DocumentItem {
  id: number;
  nom: string;
  type: string;
  taille: number;
  uploaded_at: string;
}

export interface RequeteDetailResponse {
  requete: Requete & {
    updated_at: string;
  };
  historique: HistoriqueStatutEntry[];
  documents: DocumentItem[];
  etudiant?: {
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

export interface UploadDocumentResponse {
  message: string;
  documents?: Array<{
    id: number;
    nom: string;
    type: string;
    taille: number;
  }>;
}

export interface HistoriqueStatutEntry {
  id: number;
  ancien_statut?: StatutRequete;
  nouveau_statut: StatutRequete;
  date: string;
  nom: string;
  prenom: string;
  commentaire?: string;
  motif?: string;
}

export interface Stats {
  par_statut: Record<StatutRequete, number>;
  par_type: Record<TypeRequete, number>;
  evolution_semaine: {
    semaine: string;
    total: number;
  }[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}