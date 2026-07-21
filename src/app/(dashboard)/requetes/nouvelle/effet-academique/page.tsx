"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { RequeteFormShell } from "@/components/requetes/RequeteFormShell";
import { TextField, TextAreaField, SelectField, FileDropzone } from "@/components/ui";
import { effetAcademiqueSchema, type EffetAcademiqueFormValues } from "@/lib/validation";
import { useSubmitRequete } from "@/hooks/useSubmitRequete";
import type { PayloadEffetAcademique } from "@/types";

const TYPE_DOCUMENT_OPTIONS = [
  { value: "attestation_scolarite", label: "Attestation de scolarité" },
  { value: "releve_notes", label: "Relevé de notes" },
  { value: "certificat", label: "Certificat" },
  { value: "autre", label: "Autre" },
];

export default function EffetAcademiquePage() {
  const { submit, isSubmitting } = useSubmitRequete();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EffetAcademiqueFormValues>({
    resolver: zodResolver(effetAcademiqueSchema),
    defaultValues: { priorite: "normale" },
  });

  const [documentQuitus, documentProfilEtudiant, documentCni, documentLettreDirecteur] = watch([
    "document_quitus",
    "document_profil_etudiant",
    "document_cni",
    "document_lettre_directeur",
  ]);
  const tousDocumentsFournis =
    !!documentQuitus && !!documentProfilEtudiant && !!documentCni && !!documentLettreDirecteur;

  const onSubmit = (values: EffetAcademiqueFormValues) => {
    const payload: PayloadEffetAcademique = {
      type: "effet_academique",
      priorite: values.priorite,
      type_document: values.type_document,
      annee_academique: `${values.annee_academique_debut}-${values.annee_academique_fin}`,
      motif: values.motif || undefined,
    };
    submit(payload, [
      values.document_quitus,
      values.document_profil_etudiant,
      values.document_cni,
      values.document_lettre_directeur,
    ]);
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <RequeteFormShell
        title="Effets académique"
        description="Demande d'obtention d'effets académique"
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitDisabled={!tousDocumentsFournis}
      >
        <SelectField
          label="Nom de l'effet académique"
          placeholder="Ex: Relevé de notes…"
          options={TYPE_DOCUMENT_OPTIONS}
          error={errors.type_document?.message}
          {...register("type_document")}
        />

        <div>
          <p className="text-sm font-bold text-[var(--color-ink)] mb-1.5">
            Année académique (année d&apos;obtention de l&apos;effet)
          </p>
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

        <TextAreaField
          label="Description"
          placeholder="Expliquer brièvement votre demande……"
          error={errors.motif?.message}
          {...register("motif")}
        />

        <p className="text-sm font-bold text-[var(--color-ink)]">
          Documents obligatoires (4 fichiers requis)
        </p>

        <Controller
          control={control}
          name="document_quitus"
          render={({ field }) => (
            <FileDropzone
              label="Quitus"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.document_quitus?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="document_profil_etudiant"
          render={({ field }) => (
            <FileDropzone
              label="Profil étudiant"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.document_profil_etudiant?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="document_cni"
          render={({ field }) => (
            <FileDropzone
              label="CNI"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.document_cni?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="document_lettre_directeur"
          render={({ field }) => (
            <FileDropzone
              label="Lettre adressée au directeur"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.document_lettre_directeur?.message}
            />
          )}
        />
      </RequeteFormShell>
    </>
  );
}
