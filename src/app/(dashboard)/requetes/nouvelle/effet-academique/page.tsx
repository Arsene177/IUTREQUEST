"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { RequeteFormShell } from "@/components/requetes/RequeteFormShell";
import { TextAreaField, SelectField, FileDropzone } from "@/components/ui";
import { effetAcademiqueSchema, type EffetAcademiqueFormValues } from "@/lib/validation";
import { useSubmitRequete } from "@/hooks/useSubmitRequete";
import { ANNEES_ACADEMIQUES } from "@/lib/constants";
import type { PayloadEffetAcademique } from "@/types";

const TYPE_DOCUMENT_OPTIONS = [
  { value: "attestation_scolarite", label: "Attestation de scolarité" },
  { value: "releve_notes", label: "Relevé de notes" },
  { value: "certificat", label: "Certificat" },
  { value: "autre", label: "Autre" },
];

const ANNEE_ACADEMIQUE_OPTIONS = ANNEES_ACADEMIQUES.map((annee) => ({
  value: annee,
  label: annee,
}));

export default function EffetAcademiquePage() {
  const { submit, isSubmitting } = useSubmitRequete();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EffetAcademiqueFormValues>({
    resolver: zodResolver(effetAcademiqueSchema),
    defaultValues: { priorite: "normale" },
  });

  const onSubmit = (values: EffetAcademiqueFormValues) => {
    const payload: PayloadEffetAcademique = {
      type: "effet_academique",
      priorite: values.priorite,
      type_document: values.type_document,
      annee_academique: values.annee_academique,
      motif: values.motif || undefined,
    };
    submit(payload, [values.fiche_requete, values.justificatif]);
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <RequeteFormShell
        title="Effets académique"
        description="Demande d'obtention d'effets académique"
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      >
        <SelectField
          label="Nom de l'effet académique"
          placeholder="Ex: Relevé de notes…"
          options={TYPE_DOCUMENT_OPTIONS}
          error={errors.type_document?.message}
          {...register("type_document")}
        />

        <SelectField
          label="Année académique (année d'obtention de l'effet)"
          placeholder="Sélectionner une année académique…"
          options={ANNEE_ACADEMIQUE_OPTIONS}
          error={errors.annee_academique?.message}
          {...register("annee_academique")}
        />

        <TextAreaField
          label="Description"
          placeholder="Expliquer brièvement votre demande…"
          error={errors.motif?.message}
          {...register("motif")}
        />

        <Controller
          control={control}
          name="fiche_requete"
          render={({ field }) => (
            <FileDropzone
              label="Fiche de requête"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.fiche_requete?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="justificatif"
          render={({ field }) => (
            <FileDropzone
              label="Justificatif (profil étudiant ou reçu de paiement)"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.justificatif?.message}
            />
          )}
        />
      </RequeteFormShell>
    </>
  );
}
