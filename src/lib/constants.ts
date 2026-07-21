export const STATUT_CONFIG = {
  EN_ATTENTE: { label: "En attente", color: "#D97706", bg: "#FEF3C7", border: "#F59E0B" },
  EN_COURS: { label: "En cours", color: "#2563EB", bg: "#DBEAFE", border: "#3B82F6" },
  ATTENTE_INFO: { label: "Attente info", color: "#EA580C", bg: "#FFEDD5", border: "#F97316" },
  VALIDEE: { label: "Validée", color: "#7C3AED", bg: "#EDE9FE", border: "#8B5CF6" },
  EN_EXECUTION: { label: "En exécution", color: "#0891B2", bg: "#CFFAFE", border: "#06B6D4" },
  REJETEE: { label: "Rejetée", color: "#DC2626", bg: "#FEE2E2", border: "#EF4444" },
  ANNULEE: { label: "Annulée", color: "#6B7280", bg: "#F3F4F6", border: "#9CA3AF" },
  CLOTUREE: { label: "Clôturée", color: "#059669", bg: "#D1FAE5", border: "#10B981" },
} as const;

export const TYPE_CONFIG = {
  effet_academique: { label: "Effet académique", icon: "" },
  correction_nom: { label: "Correction de nom", icon: "" },
  contestation_note: { label: "Contestation note", icon: "" },
} as const;

export const ROLE_CONFIG = {
  secretariat: { label: "Secrétariat", color: "#2563EB" },
  directeur_adjoint: { label: "Directeur Adjoint", color: "#7C3AED" },
  directeur: { label: "Directeur", color: "#DC2626" },
  departement: { label: "Département", color: "#059669" },
  cellule_informatique: { label: "Cellule Informatique", color: "#0891B2" },
  scolarite: { label: "Scolarité", color: "#D97706" },
  etudiant: { label: "Étudiant", color: "#6B7280" },
} as const;

/**
 * Cible(s) valide(s) pour l'acheminement d'une requête, selon son type.
 * Doit rester synchronisé avec CIBLES_ACHEMINEMENT_VALIDES côté backend
 * (backend/src/controllers/requeteController.ts) : router vers un service
 * hors de cette liste orpheline le dossier (plus personne ne peut le voir).
 */
export const CIBLES_ACHEMINEMENT: Record<string, { value: string; label: string }[]> = {
  effet_academique: [{ value: "directeur_adjoint", label: "Directeur adjoint" }],
  correction_nom: [{ value: "directeur", label: "Directeur" }],
  contestation_note: [{ value: "cellule_informatique", label: "Cellule informatique" }],
};

/**
 * Types de requêtes qu'un rôle staff peut effectivement traiter, selon le
 * circuit métier réel (cf. buildStaffRoleFilter côté backend). Sert à ne
 * pas proposer, dans les filtres, des types que le rôle ne gère jamais.
 */
export const TYPES_VISIBLES_PAR_ROLE: Record<string, (keyof typeof TYPE_CONFIG)[]> = {
  secretariat: ["effet_academique", "correction_nom"],
  departement: ["contestation_note"],
  directeur_adjoint: ["effet_academique"],
  directeur: ["correction_nom"],
  scolarite: ["effet_academique"],
  cellule_informatique: ["correction_nom", "contestation_note"],
};

export const EXTENSIONS_ACCEPTEES = [".pdf", ".jpg", ".jpeg", ".png"];
export const MIME_ACCEPTES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
export const TAILLE_MAX_FICHIER_OCTETS = 5 * 1024 * 1024;

export type StatutFiltre = "EN_ATTENTE" | "EN_COURS" | "RESOLUE" | "REJETE" | "ANNULEE";

export const STATUT_LABELS = Object.fromEntries(
  Object.entries(STATUT_CONFIG).map(([key, value]) => [key, value.label])
) as Record<keyof typeof STATUT_CONFIG, string>;

export const STATUT_COLOR_VARS = Object.fromEntries(
  Object.entries(STATUT_CONFIG).map(([key, value]) => [key, { fg: value.color, bg: value.bg }])
) as Record<keyof typeof STATUT_CONFIG, { fg: string; bg: string }>;

export const TYPE_REQUETE_LABELS = Object.fromEntries(
  Object.entries(TYPE_CONFIG).map(([key, value]) => [key, value.label])
) as Record<keyof typeof TYPE_CONFIG, string>;

export const TYPE_REQUETE_DESCRIPTIONS = {
  effet_academique: "Demande d’attestation, relevé de notes ou certificat académique.",
  correction_nom: "Demande de correction de votre nom dans les documents officiels.",
  contestation_note: "Contestation d’une note ou d’un résultat obtenu à un examen.",
} as const;

import type { StatutRequete } from "@/types";

export const TIMELINE_STEPS: ReadonlyArray<{
  key: string;
  label: string;
  statuts: readonly StatutRequete[];
}> = [
  { key: "depot", label: "Dépot de la requête", statuts: ["EN_ATTENTE", "EN_COURS", "ATTENTE_INFO", "VALIDEE", "EN_EXECUTION", "REJETEE", "CLOTUREE"] },
  { key: "traitement", label: "Traitement par le secrétariat", statuts: ["EN_COURS", "ATTENTE_INFO", "VALIDEE", "EN_EXECUTION", "REJETEE", "CLOTUREE"] },
  { key: "validation", label: "Validation par la direction", statuts: ["VALIDEE", "EN_EXECUTION", "REJETEE", "CLOTUREE"] },
  { key: "cloture", label: "Exécution et clôture", statuts: ["EN_EXECUTION", "CLOTUREE"] },
];

export const FILTRE_LABELS: Record<StatutFiltre, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  RESOLUE: "Résolues",
  REJETE: "Rejetés",
  ANNULEE: "Annulées",
};

export const STATUT_TO_FILTRE = {
  EN_ATTENTE: "EN_ATTENTE",
  EN_COURS: "EN_COURS",
  ATTENTE_INFO: "EN_ATTENTE",
  VALIDEE: "RESOLUE",
  EN_EXECUTION: "RESOLUE",
  REJETEE: "REJETE",
  ANNULEE: "ANNULEE",
  CLOTUREE: "RESOLUE",
} as const satisfies Record<keyof typeof STATUT_CONFIG, StatutFiltre>;