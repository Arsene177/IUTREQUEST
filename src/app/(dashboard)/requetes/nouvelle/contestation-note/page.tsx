"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { RequeteFormShell } from "@/components/requetes/RequeteFormShell";
import { TextField, TextAreaField, FileDropzone } from "@/components/ui";
import { contestationNoteSchema, type ContestationNoteFormValues, type ContestationNoteFormOutput } from "@/lib/validation";
import { useSubmitRequete } from "@/hooks/useSubmitRequete";
import type { PayloadContestationNote } from "@/types";

export default function ContestationNotePage() {
  const { submit, isSubmitting } = useSubmitRequete();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContestationNoteFormValues>({
    resolver: zodResolver(contestationNoteSchema),
    defaultValues: { priorite: "normale" },
  });

  const documentFicheRequete = watch("document_fiche_requete");
  const documentFeuilleNote = watch("document_feuille_note");
  const tousDocumentsFournis = !!documentFicheRequete && !!documentFeuilleNote;

  const onSubmit = (values: ContestationNoteFormValues) => {
    const validated = values as unknown as ContestationNoteFormOutput;
    const payload: PayloadContestationNote = {
      type: "contestation_note",
      priorite: validated.priorite,
      code_matiere: validated.code_matiere,
      note_actuelle: validated.note_actuelle,
      note_contestee: validated.note_contestee,
      motif_contestation: validated.motif_contestation,
    };
    submit(payload, [validated.document_fiche_requete, validated.document_feuille_note]);
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <RequeteFormShell
        title="Contestation de note"
        description="Demande de révision d'une note attribuée par l'enseignant"
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitDisabled={!tousDocumentsFournis}
      >
        <TextField
          label="Matière concernée"
          placeholder="Ex: Algorithme, Base de données"
          error={errors.code_matiere?.message}
          {...register("code_matiere")}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Note actuelle"
            placeholder="Ex: 8.5"
            type="number"
            step="0.5"
            min={0}
            max={20}
            error={errors.note_actuelle?.message}
            {...register("note_actuelle")}
          />
          <TextField
            label="Note demandée"
            placeholder="Ex: 18.5"
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
          placeholder="Expliquez brièvement pourquoi vous contestez cette note……"
          error={errors.motif_contestation?.message}
          {...register("motif_contestation")}
        />

        <p className="text-sm font-bold text-[var(--color-ink)]">
          Documents obligatoires (2 fichiers requis)
        </p>

        <Controller
          control={control}
          name="document_fiche_requete"
          render={({ field }) => (
            <FileDropzone
              label="Fiche de requête"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.document_fiche_requete?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="document_feuille_note"
          render={({ field }) => (
            <FileDropzone
              label="Feuille de note"
              value={field.value ?? null}
              onChange={field.onChange}
              error={errors.document_feuille_note?.message}
            />
          )}
        />
      </RequeteFormShell>
    </>
  );
}
