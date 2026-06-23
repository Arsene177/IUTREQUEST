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
      annee_academique: `${values.annee_academique_debut}-${values.annee_academique_fin}`,
      motif: values.motif || undefined,
    };
    submit(payload, values.justificatif);
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
