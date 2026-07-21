export const STATUT_CONFIG = {
  EN_ATTENTE: { label: "En attente", color: "#D97706", bg: "#FEF3C7", border: "#F59E0B" },
  EN_COURS: { label: "En cours", color: "#2563EB", bg: "#DBEAFE", border: "#3B82F6" },
  ATTENTE_INFO: { label: "Attente info", color: "#EA580C", bg: "#FFEDD5", border: "#F97316" },
  VALIDEE: { label: "Validée", color: "#7C3AED", bg: "#EDE9FE", border: "#8B5CF6" },
  EN_EXECUTION: { label: "En exécution", color: "#0891B2", bg: "#CFFAFE", border: "#06B6D4" },
  REJETEE: { label: "Rejetée", color: "#DC2626", bg: "#FEE2E2", border: "#EF4444" },
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

export const EXTENSIONS_ACCEPTEES = [".pdf", ".jpg", ".jpeg", ".png"];
export const MIME_ACCEPTES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
export const TAILLE_MAX_FICHIER_OCTETS = 5 * 1024 * 1024;

export type StatutFiltre = "EN_ATTENTE" | "EN_COURS" | "RESOLUE" | "REJETE";

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

export const TIMELINE_STEPS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "depot", label: "Dépot de la requête" },
  { key: "traitement", label: "Traitement par le secrétariat" },
  { key: "validation", label: "Validation par la direction" },
  { key: "cloture", label: "Exécution et clôture" },
];

/**
 * Index de l'étape correspondant à chaque statut. ATTENTE_INFO reste sur
 * l'étape "traitement" (le dossier attend une réponse de l'étudiant), et
 * CLOTUREE pointe au-delà de la dernière étape pour que tout s'affiche complété.
 */
export const STATUT_STEP_INDEX: Record<StatutRequete, number> = {
  EN_ATTENTE: 0,
  EN_COURS: 1,
  ATTENTE_INFO: 1,
  VALIDEE: 2,
  EN_EXECUTION: 3,
  CLOTUREE: 4,
  REJETEE: 0,
};

export const FILTRE_LABELS: Record<StatutFiltre, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  RESOLUE: "Résolues",
  REJETE: "Rejetés",
};

export const STATUT_TO_FILTRE = {
  EN_ATTENTE: "EN_ATTENTE",
  EN_COURS: "EN_COURS",
  ATTENTE_INFO: "EN_ATTENTE",
  VALIDEE: "RESOLUE",
  EN_EXECUTION: "RESOLUE",
  REJETEE: "REJETE",
  CLOTUREE: "RESOLUE",
} as const satisfies Record<keyof typeof STATUT_CONFIG, StatutFiltre>;