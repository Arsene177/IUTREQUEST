// ============================================================
// Types métier — alignés sur le schéma SQL (init_db.sql)
// ============================================================

export type Role =
  | "etudiant"
  | "secretariat"
  | "directeur_adjoint"
  | "directeur"
  | "departement"
  | "cellule_informatique"
  | "scolarite";

export type StatutRequete =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "ATTENTE_INFO"
  | "VALIDEE"
  | "EN_EXECUTION"
  | "REJETEE"
  | "CLOTUREE";

export type TypeRequete =
  | "effet_academique"
  | "correction_nom"
  | "contestation_note";

export type Priorite = "normale" | "urgente";

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
}

export interface Etudiant {
  id: number;
  user_id: number;
  matricule: string;
  filiere: string;
  niveau: string;
}

/** Utilisateur connecté tel que renvoyé par /auth/login et /auth/me */
export interface AuthUser extends User {
  matricule?: string;
  filiere?: string;
  niveau?: string;
}

export interface Requete {
  id: number;
  etudiant_id: number;
  type: TypeRequete;
  statut: StatutRequete;
  priorite: Priorite;
  date_depot: string;
  service_cible: string | null;
  assigne_a: number | null;
  updated_at: string;
}

export interface RequeteAttestationDetails {
  id: number;
  requete_id: number;
  type_document: "attestation_scolarite" | "releve_notes" | "certificat" | "autre";
  annee_academique: string;
  motif: string | null;
}

export interface RequeteCorrectionNomDetails {
  id: number;
  requete_id: number;
  ancien_nom: string;
  nouveau_nom: string;
  motif: string | null;
}

export interface RequeteNoteDetails {
  id: number;
  requete_id: number;
  code_matiere: string;
  note_actuelle: number;
  note_contestee: number;
  motif_contestation: string;
  id_enseignant: number | null;
}

export type RequeteDetails =
  | RequeteAttestationDetails
  | RequeteCorrectionNomDetails
  | RequeteNoteDetails
  | null;

export interface HistoriqueStatutEntry {
  id: number;
  requete_id: number;
  ancien_statut: StatutRequete | null;
  nouveau_statut: StatutRequete;
  change_par: number;
  motif: string | null;
  commentaire: string | null;
  date: string;
  nom: string;
  prenom: string;
  role: Role;
}

export interface DocumentJoint {
  id: number;
  requete_id: number;
  nom: string;
  type: string;
  taille: number;
  valide: boolean;
  uploaded_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  requete_id: number | null;
  message: string;
  lu: boolean;
  date_envoie: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================================================
// Payloads des requêtes (POST /requetes)
// ============================================================

export interface PayloadEffetAcademique {
  type: "effet_academique";
  priorite: Priorite;
  type_document: "attestation_scolarite" | "releve_notes" | "certificat" | "autre";
  annee_academique: string;
  motif?: string;
}

export interface PayloadCorrectionNom {
  type: "correction_nom";
  priorite: Priorite;
  ancien_nom: string;
  nouveau_nom: string;
  motif?: string;
}

export interface PayloadContestationNote {
  type: "contestation_note";
  priorite: Priorite;
  code_matiere: string;
  note_actuelle: number;
  note_contestee: number;
  motif_contestation: string;
  id_enseignant?: number;
}

export type PayloadNouvelleRequete =
  | PayloadEffetAcademique
  | PayloadCorrectionNom
  | PayloadContestationNote;

// ============================================================
// Réponses API
// ============================================================

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  notifications_non_lues: number;
}

export interface CreerRequeteResponse {
  message: string;
  requete_id: number;
}

export interface MesRequetesResponse {
  requetes: Requete[];
  pagination: Pagination;
}

export interface RequeteDetailResponse {
  requete: Requete;
  details: RequeteDetails;
  historique: HistoriqueStatutEntry[];
}

export interface UploadDocumentResponse {
  message: string;
  documents: Array<{ id: number; nom: string; type: string; taille: number }>;
}

export interface ApiErrorBody {
  message: string;
  error?: unknown;
}

/**
 * Réponse de POST /auth/forgot-password. Le champ debug_mot_de_passe n'est
 * présent que sur le backend de dev (pas de service d'envoi d'email
 * branché) — à retirer lors de la fusion avec le backend d'équipe.
 */
export interface MotDePasseOublieResponse {
  message: string;
  debug_mot_de_passe?: string;
}
