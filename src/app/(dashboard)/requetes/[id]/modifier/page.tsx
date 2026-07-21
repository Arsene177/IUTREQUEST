"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RequeteFormShell } from "@/components/requetes/RequeteFormShell";
import { TextField, TextAreaField, SelectField, Spinner } from "@/components/ui";
import {
  effetAcademiqueEditSchema,
  correctionNomEditSchema,
  contestationNoteEditSchema,
  type EffetAcademiqueEditFormValues,
  type CorrectionNomEditFormValues,
  type ContestationNoteEditFormValues,
  type ContestationNoteEditFormOutput,
} from "@/lib/validation";
import { requetesApi } from "@/lib/api/requetes";
import { getApiErrorMessage } from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import type { RequeteDetailResponse } from "@/types";

const TYPE_DOCUMENT_OPTIONS = [
  { value: "attestation_scolarite", label: "Attestation de scolarité" },
  { value: "releve_notes", label: "Relevé de notes" },
  { value: "certificat", label: "Certificat" },
  { value: "autre", label: "Autre" },
];

interface EditFormProps {
  requeteId: number;
  detail: RequeteDetailResponse;
  backHref: string;
}

interface DetailsEffetAcademique {
  type_document?: EffetAcademiqueEditFormValues["type_document"];
  annee_academique?: string;
  motif?: string;
}

function EditEffetAcademique({ requeteId, detail, backHref }: EditFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const details = detail.details as DetailsEffetAcademique | null;
  const [anneeDebut, anneeFin] = String(details?.annee_academique ?? "").split("-");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EffetAcademiqueEditFormValues>({
    resolver: zodResolver(effetAcademiqueEditSchema),
    defaultValues: {
      type_document: details?.type_document,
      annee_academique_debut: anneeDebut ?? "",
      annee_academique_fin: anneeFin ?? "",
      motif: details?.motif ?? "",
      priorite: detail.requete.priorite,
    },
  });

  const onSubmit = async (values: EffetAcademiqueEditFormValues) => {
    setIsSubmitting(true);
    try {
      await requetesApi.modifier(requeteId, {
        priorite: values.priorite,
        type_document: values.type_document,
        annee_academique: `${values.annee_academique_debut}-${values.annee_academique_fin}`,
        motif: values.motif || undefined,
      });
      notify("Requête modifiée avec succès.", "success");
      router.push(backHref);
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible de modifier la requête."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequeteFormShell
      title="Modifier — Effet académique"
      description="Mettez à jour les informations de votre demande"
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitLabel="Enregistrer les modifications"
      backHref={backHref}
      backLabel="Retour à la requête"
    >
      <SelectField
        label="Nom de l'effet académique"
        options={TYPE_DOCUMENT_OPTIONS}
        error={errors.type_document?.message}
        {...register("type_document")}
      />
      <div>
        <p className="text-sm font-bold text-[var(--color-ink)] mb-1.5">Année académique</p>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            placeholder="Ex: 2023"
            error={errors.annee_academique_debut?.message}
            {...register("annee_academique_debut")}
          />
          <TextField
            placeholder="Ex: 2024"
            error={errors.annee_academique_fin?.message}
            {...register("annee_academique_fin")}
          />
        </div>
      </div>
      <TextAreaField label="Description" error={errors.motif?.message} {...register("motif")} />
    </RequeteFormShell>
  );
}

interface DetailsCorrectionNom {
  ancien_nom?: string;
  nouveau_nom?: string;
  motif?: string;
}

function EditCorrectionNom({ requeteId, detail, backHref }: EditFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const details = detail.details as DetailsCorrectionNom | null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CorrectionNomEditFormValues>({
    resolver: zodResolver(correctionNomEditSchema),
    defaultValues: {
      ancien_nom: details?.ancien_nom ?? "",
      nouveau_nom: details?.nouveau_nom ?? "",
      motif: details?.motif ?? "",
      priorite: detail.requete.priorite,
    },
  });

  const onSubmit = async (values: CorrectionNomEditFormValues) => {
    setIsSubmitting(true);
    try {
      await requetesApi.modifier(requeteId, {
        priorite: values.priorite,
        ancien_nom: values.ancien_nom,
        nouveau_nom: values.nouveau_nom,
        motif: values.motif,
      });
      notify("Requête modifiée avec succès.", "success");
      router.push(backHref);
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible de modifier la requête."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequeteFormShell
      title="Modifier — Correction de nom"
      description="Mettez à jour les informations de votre demande"
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitLabel="Enregistrer les modifications"
      backHref={backHref}
      backLabel="Retour à la requête"
    >
      <TextField
        label="Nom actuel (incorrect)"
        error={errors.ancien_nom?.message}
        {...register("ancien_nom")}
      />
      <TextField
        label="Nom correct (souhaité)"
        error={errors.nouveau_nom?.message}
        {...register("nouveau_nom")}
      />
      <TextAreaField label="Description" error={errors.motif?.message} {...register("motif")} />
    </RequeteFormShell>
  );
}

interface DetailsContestationNote {
  code_matiere?: string;
  note_actuelle?: number;
  note_contestee?: number;
  motif_contestation?: string;
}

function EditContestationNote({ requeteId, detail, backHref }: EditFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const details = detail.details as DetailsContestationNote | null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContestationNoteEditFormValues>({
    resolver: zodResolver(contestationNoteEditSchema),
    // z.coerce.number() rend le type "input" du schéma (`unknown`) peu
    // exploitable pour typer un objet littéral ; on caste comme le fait déjà
    // la page de création (cf. ContestationNoteFormOutput plus bas).
    defaultValues: {
      code_matiere: details?.code_matiere ?? "",
      note_actuelle: details?.note_actuelle,
      note_contestee: details?.note_contestee,
      motif_contestation: details?.motif_contestation ?? "",
      priorite: detail.requete.priorite,
    } as ContestationNoteEditFormValues,
  });

  const onSubmit = async (values: ContestationNoteEditFormValues) => {
    const validated = values as unknown as ContestationNoteEditFormOutput;
    setIsSubmitting(true);
    try {
      await requetesApi.modifier(requeteId, {
        priorite: validated.priorite,
        code_matiere: validated.code_matiere,
        note_actuelle: validated.note_actuelle,
        note_contestee: validated.note_contestee,
        motif_contestation: validated.motif_contestation,
      });
      notify("Requête modifiée avec succès.", "success");
      router.push(backHref);
    } catch (err) {
      notify(getApiErrorMessage(err, "Impossible de modifier la requête."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequeteFormShell
      title="Modifier — Contestation de note"
      description="Mettez à jour les informations de votre demande"
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitLabel="Enregistrer les modifications"
      backHref={backHref}
      backLabel="Retour à la requête"
    >
      <TextField
        label="Matière concernée"
        error={errors.code_matiere?.message}
        {...register("code_matiere")}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Note actuelle"
          type="number"
          step="0.5"
          min={0}
          max={20}
          error={errors.note_actuelle?.message}
          {...register("note_actuelle")}
        />
        <TextField
          label="Note demandée"
          type="number"
          step="0.5"
          min={0}
          max={20}
          error={errors.note_contestee?.message}
          {...register("note_contestee")}
        />
      </div>
      <TextAreaField
        label="Description"
        error={errors.motif_contestation?.message}
        {...register("motif_contestation")}
      />
    </RequeteFormShell>
  );
}

export default function ModifierRequetePage() {
  const params = useParams<{ id: string }>();
  const requeteId = Number(params.id);

  const [detail, setDetail] = useState<RequeteDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(requeteId)) return;
    requetesApi
      .detail(requeteId)
      .then((data) => {
        if (data.requete.statut !== "EN_ATTENTE") {
          setError("Cette requête n'est plus modifiable : elle a déjà été réceptionnée.");
          return;
        }
        setDetail(data);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Impossible de charger cette requête.")))
      .finally(() => setIsLoading(false));
  }, [requeteId]);

  const backHref = `/requetes/${requeteId}`;

  if (isLoading) return <Spinner label="Chargement du dossier…" />;

  if (error || !detail) {
    return (
      <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-2xl">
        <p className="rounded-lg bg-[var(--color-danger-soft)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
          {error ?? "Requête introuvable."}
        </p>
      </main>
    );
  }

  if (detail.requete.type === "effet_academique") {
    return <EditEffetAcademique requeteId={requeteId} detail={detail} backHref={backHref} />;
  }
  if (detail.requete.type === "correction_nom") {
    return <EditCorrectionNom requeteId={requeteId} detail={detail} backHref={backHref} />;
  }
  return <EditContestationNote requeteId={requeteId} detail={detail} backHref={backHref} />;
}
