"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/layout/Header";
import { RequeteFormShell } from "@/components/requetes/RequeteFormShell";
import { TextField, TextAreaField, FileDropzoneMulti } from "@/components/ui";
import { contestationNoteSchema, type ContestationNoteFormValues, type ContestationNoteFormOutput } from "@/lib/validation";
import { useSubmitRequete } from "@/hooks/useSubmitRequete";
import type { PayloadContestationNote } from "@/types";

export default function ContestationNotePage() {
  const { submit, isSubmitting } = useSubmitRequete();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContestationNoteFormValues>({
    resolver: zodResolver(contestationNoteSchema),
    defaultValues: { priorite: "normale", justificatifs: [] },
  });

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
    submit(payload, validated.justificatifs);
  };

  return (
    <>
      <Header title="Tableau de bord" />
      <RequeteFormShell
        title="Contestation de note"
        description="Demande de révision d'une note attribuée par l'enseignant"
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
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

        <Controller
          control={control}
          name="justificatifs"
          render={({ field }) => (
            <FileDropzoneMulti
              label="Justificatifs (copie corrigée)"
              value={field.value ?? []}
              onChange={field.onChange}
              error={errors.justificatifs?.message}
            />
          )}
        />
      </RequeteFormShell>
    </>
  );
}
