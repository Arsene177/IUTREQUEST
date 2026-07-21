"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { RequeteFormShell } from "@/components/requetes/RequeteFormShell";
import { TextField, TextAreaField, FileDropzone } from "@/components/ui";
import { correctionNomSchema, type CorrectionNomFormValues } from "@/lib/validation";
import { useSubmitRequete } from "@/hooks/useSubmitRequete";
import type { PayloadCorrectionNom } from "@/types";

export default function CorrectionNomPage() {
  const { submit, isSubmitting } = useSubmitRequete();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CorrectionNomFormValues>({
    resolver: zodResolver(correctionNomSchema),
    defaultValues: { priorite: "normale" },
  });

  const documentQuitus = watch("document_quitus");
  const documentLettreDirecteur = watch("document_lettre_directeur");
  const tousDocumentsFournis = !!documentQuitus && !!documentLettreDirecteur;

  const onSubmit = (values: CorrectionNomFormValues) => {
    const payload: PayloadCorrectionNom = {
      type: "correction_nom",
      priorite: values.priorite,
      ancien_nom: values.ancien_nom,
      nouveau_nom: values.nouveau_nom,
      motif: values.motif,
    };
    submit(payload, [values.document_quitus, values.document_lettre_directeur]);
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <RequeteFormShell
        title="Correction de nom"
        description="Modification de l'état civil dans les registres de l'IUT"
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitDisabled={!tousDocumentsFournis}
      >
        <TextField
          label="Nom actuel (incorrect)"
          placeholder="Nom tel qu'il apparaît dans le registre"
          error={errors.ancien_nom?.message}
          {...register("ancien_nom")}
        />

        <TextField
          label="Nom correct (souhaité)"
          placeholder="Nom correct tel qu'il doit apparaître"
          error={errors.nouveau_nom?.message}
          {...register("nouveau_nom")}
        />

        <TextAreaField
          label="Description"
          placeholder="Expliquez brièvement l'origine de l'erreur……"
          error={errors.motif?.message}
          {...register("motif")}
        />

        <p className="text-sm font-bold text-[var(--color-ink)]">
          Documents obligatoires (2 fichiers requis)
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
          name="document_lettre_directeur"
          render={({ field }) => (
            <FileDropzone
              label="Lettre au directeur"
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
