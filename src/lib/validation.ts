import { z } from "zod";
import { MIME_ACCEPTES, TAILLE_MAX_FICHIER_OCTETS } from "@/lib/constants";

// ============================================================
// Validation fichier (réutilisée par les 3 formulaires)
// ============================================================

const fichierJustificatifSchema = z
  .instanceof(File, { message: "Veuillez ajouter un fichier justificatif." })
  .refine((file) => file.size <= TAILLE_MAX_FICHIER_OCTETS, {
    message: "Le fichier ne doit pas dépasser 5 Mo.",
  })
  .refine((file) => MIME_ACCEPTES.includes(file.type), {
    message: "Format accepté : PDF, JPG ou PNG.",
  });

const fichiersJustificatifsSchema = z
  .array(fichierJustificatifSchema)
  .min(1, "Veuillez ajouter au moins un fichier justificatif.")
  .max(5, "5 fichiers maximum.");

// ============================================================
// Auth
// ============================================================

export const loginSchema = z.object({
  identifiant: z.string().min(1, "Le matricule ou l'email est requis."),
  password: z.string().min(1, "Le mot de passe est requis."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  nom: z.string().min(2, "Le nom est requis."),
  prenom: z.string().min(2, "Le prénom est requis."),
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Minimum 8 caractères."),
  matricule: z.string().min(3, "Le matricule est requis."),
  filiere: z.string().min(2, "La filière est requise."),
  niveau: z.string().min(1, "Le niveau est requis."),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const motDePasseOublieSchema = z.object({
  nom: z.string().min(2, "Le nom est requis."),
  prenom: z.string().min(2, "Le prénom est requis."),
  matricule: z.string().min(3, "Le matricule est requis."),
  date_naissance: z.string().min(1, "La date de naissance est requise."),
});
export type MotDePasseOublieFormValues = z.infer<typeof motDePasseOublieSchema>;

export const changerMotDePasseSchema = z
  .object({
    ancien_mot_de_passe: z.string().min(1, "Le mot de passe actuel est requis."),
    nouveau_mot_de_passe: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
    confirmation: z.string().min(1, "Veuillez confirmer le nouveau mot de passe."),
  })
  .refine((data) => data.nouveau_mot_de_passe === data.confirmation, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmation"],
  });
export type ChangerMotDePasseFormValues = z.infer<typeof changerMotDePasseSchema>;

// ============================================================
// Requête — Effet académique
// ============================================================

export const effetAcademiqueSchema = z.object({
  type_document: z.enum([
    "attestation_scolarite",
    "releve_notes",
    "certificat",
    "autre",
  ]),
  annee_academique_debut: z
    .string()
    .regex(/^\d{4}$/, "Année invalide (ex: 2023)."),
  annee_academique_fin: z
    .string()
    .regex(/^\d{4}$/, "Année invalide (ex: 2024)."),
  motif: z.string().max(1000).optional().or(z.literal("")),
  priorite: z.enum(["normale", "urgente"]),
  justificatif: fichierJustificatifSchema,
});
export type EffetAcademiqueFormValues = z.infer<typeof effetAcademiqueSchema>;

// ============================================================
// Requête — Correction de nom
// ============================================================

export const correctionNomSchema = z.object({
  ancien_nom: z.string().min(2, "Le nom actuel est requis."),
  nouveau_nom: z.string().min(2, "Le nom correct est requis."),
  motif: z
    .string()
    .min(10, "Veuillez expliquer brièvement l'origine de l'erreur (10 caractères min).")
    .max(1000),
  priorite: z.enum(["normale", "urgente"]),
  justificatifs: fichiersJustificatifsSchema,
});
export type CorrectionNomFormValues = z.infer<typeof correctionNomSchema>;

// ============================================================
// Requête — Contestation de note
// ============================================================

export const contestationNoteSchema = z.object({
  code_matiere: z.string().min(2, "La matière concernée est requise."),
  note_actuelle: z.coerce
    .number({ message: "Note invalide." })
    .min(0, "La note ne peut pas être négative.")
    .max(20, "La note ne peut pas dépasser 20."),
  note_contestee: z.coerce
    .number({ message: "Note invalide." })
    .min(0, "La note ne peut pas être négative.")
    .max(20, "La note ne peut pas dépasser 20."),
  motif_contestation: z
    .string()
    .min(30, "Le motif doit faire au moins 30 caractères.")
    .max(1000),
  priorite: z.enum(["normale", "urgente"]),
  justificatifs: fichiersJustificatifsSchema,
});
export type ContestationNoteFormValues = z.input<typeof contestationNoteSchema>;
export type ContestationNoteFormOutput = z.output<typeof contestationNoteSchema>;

// ============================================================
// Modification d'une requête EN_ATTENTE (mêmes règles que la création,
// sans le justificatif : les documents déjà joints ne sont pas ré-exigés).
// ============================================================

export const effetAcademiqueEditSchema = effetAcademiqueSchema.omit({ justificatif: true });
export type EffetAcademiqueEditFormValues = z.infer<typeof effetAcademiqueEditSchema>;

export const correctionNomEditSchema = correctionNomSchema.omit({ justificatifs: true });
export type CorrectionNomEditFormValues = z.infer<typeof correctionNomEditSchema>;

export const contestationNoteEditSchema = contestationNoteSchema.omit({ justificatifs: true });
export type ContestationNoteEditFormValues = z.input<typeof contestationNoteEditSchema>;
export type ContestationNoteEditFormOutput = z.output<typeof contestationNoteEditSchema>;
