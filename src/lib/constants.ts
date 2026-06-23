import type { Priorite, StatutRequete, TypeRequete } from "@/types";

// ============================================================
// Statuts — libellés, couleurs, ordre de progression
// ============================================================

export const STATUT_LABELS: Record<StatutRequete, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  ATTENTE_INFO: "Information requise",
  VALIDEE: "Validée",
  EN_EXECUTION: "En exécution",
  REJETEE: "Rejetée",
  CLOTUREE: "Clôturée",
};

export const STATUT_COLOR_VARS: Record<
  StatutRequete,
  { fg: string; bg: string }
> = {
  EN_ATTENTE: { fg: "var(--color-status-attente)", bg: "var(--color-status-attente-bg)" },
  EN_COURS: { fg: "var(--color-status-cours)", bg: "var(--color-status-cours-bg)" },
  ATTENTE_INFO: { fg: "var(--color-status-info)", bg: "var(--color-status-info-bg)" },
  VALIDEE: { fg: "var(--color-status-validee)", bg: "var(--color-status-validee-bg)" },
  EN_EXECUTION: { fg: "var(--color-status-execution)", bg: "var(--color-status-execution-bg)" },
  REJETEE: { fg: "var(--color-status-rejetee)", bg: "var(--color-status-rejetee-bg)" },
  CLOTUREE: { fg: "var(--color-status-cloturee)", bg: "var(--color-status-cloturee-bg)" },
};

/** Regroupement utilisé par les filtres du dashboard (maquette : EN ATTENTE / EN COURS / RESOLUE / REJETÉ) */
export type StatutFiltre = "EN_ATTENTE" | "EN_COURS" | "RESOLUE" | "REJETE";

export const STATUT_TO_FILTRE: Record<StatutRequete, StatutFiltre> = {
  EN_ATTENTE: "EN_ATTENTE",
  ATTENTE_INFO: "EN_ATTENTE",
  EN_COURS: "EN_COURS",
  VALIDEE: "EN_COURS",
  EN_EXECUTION: "EN_COURS",
  CLOTUREE: "RESOLUE",
  REJETEE: "REJETE",
};

export const FILTRE_LABELS: Record<StatutFiltre, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  RESOLUE: "Résolue",
  REJETE: "Rejeté",
};

/** Étapes affichées dans la timeline de progression (modal "Requête #x") */
export const TIMELINE_STEPS: Array<{
  key: "soumise" | "en_cours" | "integree";
  label: string;
  statuts: StatutRequete[];
}> = [
  { key: "soumise", label: "Requête soumise", statuts: ["EN_ATTENTE"] },
  {
    key: "en_cours",
    label: "En cours de traitement",
    statuts: ["EN_COURS", "ATTENTE_INFO", "VALIDEE"],
  },
  {
    key: "integree",
    label: "Intégrée dans le SIE",
    statuts: ["EN_EXECUTION", "CLOTUREE"],
  },
];

export const STATUTS_TERMINAUX: StatutRequete[] = ["CLOTUREE", "REJETEE"];

// ============================================================
// Types de requête
// ============================================================

export const TYPE_REQUETE_LABELS: Record<TypeRequete, string> = {
  effet_academique: "Effet académique",
  correction_nom: "Correction de nom",
  contestation_note: "Contestation de note",
};

export const TYPE_REQUETE_DESCRIPTIONS: Record<TypeRequete, string> = {
  effet_academique: "Demande d'obtention d'un effet académique",
  correction_nom: "Modification de l'état civil dans les registres de l'IUT",
  contestation_note: "Demande de révision d'une note attribuée par l'enseignant",
};

export const PRIORITE_LABELS: Record<Priorite, string> = {
  normale: "Normale",
  urgente: "Urgente",
};

// ============================================================
// Documents
// ============================================================

export const TAILLE_MAX_FICHIER_OCTETS = 5 * 1024 * 1024; // 5 Mo
export const EXTENSIONS_ACCEPTEES = [".pdf", ".jpg", ".jpeg", ".png"];
export const MIME_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
